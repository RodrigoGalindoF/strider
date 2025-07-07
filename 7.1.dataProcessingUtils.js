// 3. Cluster Visualizer/7.1. dataProcessingUtils.js
// --------------------------------------------------
// This file contains utility functions for processing the input keyword taxonomy data.
// These functions are responsible for:
// - Parsing raw JSON data from uploaded files or using predefined sample data.
// - Extracting and structuring data into a hierarchical format suitable for display.
// - Simultaneously extracting flat lists of all nodes categorized by their type
//   (Pillar, Parent, Subtopic, Cluster, Keywords) for efficient flat-view filtering and display.
// - Calculating dynamic, aggregated metrics (e.g., total search volume, average KD, total keywords)
//   for parent nodes based on their children and associated keywords in the hierarchy.
//
// Functions:
// - `extractAllNodesAndKeywords`: Recursively traverses raw data to create flat lists of nodes by type and all keywords.
// - `transformNodeForHierarchicalView`: Recursively transforms raw node data into the structure needed for hierarchical display.
// - `processRawDataFromFile`: Takes raw JSON string content, parses it, and uses the above helpers
//                             to produce both hierarchical data and the flat lists of all node types.
// - `processSampleDataForApp`: Takes the predefined SAMPLE_DATA, and uses similar logic to
//                              `processRawDataFromFile` to prepare it for the application.
// - `calculateDynamicNodeMetrics`: Recursively calculates aggregated metrics for a given node.
//
// Dependencies:
// - `NodeType` constant (expected to be available in the scope where these functions are called,
//   typically passed from `1. constants.js` via the main `InteractiveDentalTaxonomy` component).
//
// Connects to:
// - `7. InteractiveDentalTaxonomy.js`: This is the primary consumer of these utility functions.
//   `InteractiveDentalTaxonomy` calls these functions (e.g., `processRawDataFromFile`, `processSampleDataForApp`)
//   when a file is loaded or sample data is requested. The `calculateDynamicNodeMetrics` function
//   is used within the rendering logic of `InteractiveDentalTaxonomy` (specifically in its `renderNode` method)
//   to compute metrics on-the-fly for displayed hierarchical nodes.
//
// Purpose:
// - To centralize the logic for data ingestion, transformation, and initial processing.
// - To separate data manipulation tasks from the main component's rendering and state management logic,
//   improving code organization and maintainability.
// - To provide structured data (both hierarchical and flat lists) to the main application component.

/**
 * Recursively extracts flat lists of different node types and all keywords from raw hierarchical data.
 * Deduplicates keywords globally: only the first appearance of each exact keyword string is kept.
 * @param {Array} nodes - The array of raw nodes to process.
 * @param {Object} NodeType - The NodeType constant object.
 * @param {Array<string>} currentPath - The current path in the hierarchy (for fullHierarchyPath).
 * @param {number} level - The current depth in the hierarchy.
 * @param {Set} seenKeywords - Set of keyword strings already included (for deduplication).
 * @returns {Object} An object containing lists: { keywordsList, pillarsList, parentsList, subtopicsList, clustersList }.
 */
function extractAllNodesAndKeywords(nodes, NodeType, currentPath = [], level = 0, seenKeywords = new Set()) {
    let keywordsList = [];
    let pillarsList = [];
    let parentsList = [];
    let subtopicsList = [];
    let clustersList = [];

    if (!nodes || !Array.isArray(nodes)) {
        return { keywordsList, pillarsList, parentsList, subtopicsList, clustersList };
    }

    for (const node of nodes) {
        if (!node || !node.type) continue;
        const newPath = node.name ? [...currentPath, node.name] : [...currentPath];
        const fullPathString = newPath.join(' > ');

        const commonNodeData = {
            id: `${node.type}-${node.name}-${level}-${Math.random().toString(36).substr(2, 9)}`,
            name: node.name,
            type: node.type,
            searchVolume: node.size || 0,
            keywordDifficulty: node.averageKD || 0,
            cpc: node.averageCPC || 0,
            totalKeywords: node.totalKeywords || 0,
            totalClusters: node.totalClusters || 0,
            fullHierarchyPath: fullPathString,
        };

        switch (node.type) {
            case NodeType.PILLAR:
                pillarsList.push(commonNodeData);
                break;
            case NodeType.PARENT:
                parentsList.push(commonNodeData);
                break;
            case NodeType.SUBTOPIC:
                subtopicsList.push(commonNodeData);
                break;
            case NodeType.CLUSTER:
                clustersList.push(commonNodeData);
                if (Array.isArray(node.keywords)) {
                    // Deduplicate keywords globally
                    node.keywords.forEach(kw => {
                        if (!kw || typeof kw.keyword !== 'string') return;
                        if (!seenKeywords.has(kw.keyword)) {
                            seenKeywords.add(kw.keyword);
                            keywordsList.push({
                                id: `keyword-${kw.keyword}-${Math.random().toString(36).substr(2, 9)}`,
                                name: kw.keyword,
                                type: NodeType.KEYWORDS,
                                searchVolume: kw.searchVolume || 0,
                                keywordDifficulty: kw.keywordDifficulty || 0,
                                cpc: kw.cpc || 0,
                                fullHierarchyPath: newPath.length > 0 ? `${fullPathString} > ${kw.keyword}` : kw.keyword,
                            });
                        }
                    });
                }
                break;
        }

        if (node.children && Array.isArray(node.children)) {
            const nestedResults = extractAllNodesAndKeywords(node.children, NodeType, newPath, level + 1, seenKeywords);
            keywordsList = keywordsList.concat(nestedResults.keywordsList);
            pillarsList = pillarsList.concat(nestedResults.pillarsList);
            parentsList = parentsList.concat(nestedResults.parentsList);
            subtopicsList = subtopicsList.concat(nestedResults.subtopicsList);
            clustersList = clustersList.concat(nestedResults.clustersList);
        }
    }
    return { keywordsList, pillarsList, parentsList, subtopicsList, clustersList };
}

/**
 * Transforms a raw node for hierarchical display, ensuring only unique keywords are included globally.
 * @param {Object} node - The raw node object.
 * @param {Set} seenKeywords - Set of keyword strings already included (for deduplication).
 * @returns {Object} The transformed node.
 */
function transformNodeForHierarchicalView(node, seenKeywords = new Set()) {
    const transformedNode = {
        name: node.name,
        type: node.type,
        size: node.size || 0,
        totalKeywords: node.totalKeywords || 0,
        totalClusters: node.totalClusters || 0,
        averageKD: node.averageKD || 0,
        averageCPC: node.averageCPC || 0
    };
    if (node.metadata) transformedNode.metadata = node.metadata;
    if (node.keywords) {
        // Only include unique keywords (first appearance wins)
        transformedNode.keywords = node.keywords.filter(kw => {
            if (!kw || typeof kw.keyword !== 'string') return false;
            if (!seenKeywords.has(kw.keyword)) {
                seenKeywords.add(kw.keyword);
                return true;
            }
            return false;
        });
    }
    if (node.children && Array.isArray(node.children)) {
        transformedNode.children = node.children.map(child => transformNodeForHierarchicalView(child, seenKeywords)); // Recursive call
    }
    return transformedNode;
}

/**
 * Processes raw data from a JSON file content string.
 * Parses the JSON, extracts different node types for flat lists, and transforms data for hierarchical view.
 * @param {string} fileContents - The string content of the JSON file.
 * @param {Object} NodeType - The NodeType constant object.
 * @returns {Object} An object containing { hierarchicalData, allPillarsData, allParentsData, allSubtopicsData, allClustersData, allKeywordsData, error }.
 *                   Returns an error object if parsing fails.
 */
function processRawDataFromFile(fileContents, NodeType) {
    try {
        const parsedData = JSON.parse(fileContents);
        const rawDataArray = parsedData.data || [];
        // Step 1: Build deduplicated hierarchical tree
        const hierarchicalData = rawDataArray.map(node => transformNodeForHierarchicalView(node, new Set()));
        // Step 2: Generate all flat lists from the deduplicated tree
        const seenKeywords = new Set();
        const extracted = extractAllNodesAndKeywords(hierarchicalData, NodeType, [], 0, seenKeywords);
        return {
            hierarchicalData,
            allPillarsData: extracted.pillarsList,
            allParentsData: extracted.parentsList,
            allSubtopicsData: extracted.subtopicsList,
            allClustersData: extracted.clustersList,
            allKeywordsData: extracted.keywordsList,
            error: null
        };
    } catch (err) {
        console.error('Error parsing JSON file in processRawDataFromFile:', err);
        return { error: 'Error parsing JSON file: ' + err.message };
    }
}


/**
 * Processes sample data for the application.
 * Extracts different node types for flat lists and prepares data for hierarchical view.
 * @param {Array} sampleDataInput - The SAMPLE_DATA array.
 * @param {Object} NodeType - The NodeType constant object.
 * @returns {Object} An object containing { hierarchicalData, allPillarsData, allParentsData, allSubtopicsData, allClustersData, allKeywordsData }.
 */
function processSampleDataForApp(sampleDataInput, NodeType) {
    // Step 1: Build deduplicated hierarchical tree
    const hierarchicalData = sampleDataInput.map(node => transformNodeForHierarchicalView(node, new Set()));
    // Step 2: Generate all flat lists from the deduplicated tree
    const seenKeywords = new Set();
    const extractedSample = extractAllNodesAndKeywords(hierarchicalData, NodeType, [], 0, seenKeywords);
    return {
        hierarchicalData: hierarchicalData, // Use transformed sample data for consistency
        allPillarsData: extractedSample.pillarsList,
        allParentsData: extractedSample.parentsList,
        allSubtopicsData: extractedSample.subtopicsList,
        allClustersData: extractedSample.clustersList,
        allKeywordsData: extractedSample.keywordsList,
    };
}

/**
 * Calculates dynamic aggregated metrics for a given node based on its children and keywords.
 * This function is recursive for processing child nodes.
 * @param {Object} node - The node for which to calculate metrics (assumed to be from a filtered tree).
 * @param {Object} NodeType - The NodeType constant object.
 * @param {Function} calculateMetricsRecursively - The function itself, for recursive calls.
 * @param {WeakMap} cache - A WeakMap to cache results for node objects.
 * @returns {Object} An object containing aggregated metrics: { totalSearchVolume, totalKeywords, totalClusters, averageKD, averageCPC }.
 */
function calculateDynamicNodeMetrics(node, NodeType, calculateMetricsRecursively, cache) {
    if (cache && cache.has(node)) {
        return cache.get(node);
    }

    let metrics = {
        totalSearchVolume: 0,
        totalKeywords: 0,
        totalClusters: 0,
        weightedKDSum: 0,
        totalVolumeForKD: 0,
        itemsWithKD: 0,
        simpleKDSum: 0,
        weightedCPCSum: 0,
        totalVolumeForCPC: 0,
        itemsWithCPC: 0,
        simpleCPCSum: 0,
        averageKD: 0,
        averageCPC: 0
    };

    if (node.type === NodeType.CLUSTER) {
        metrics.totalClusters = 1;
    }

    if (node.type === NodeType.CLUSTER && Array.isArray(node.keywords) && node.keywords.length > 0) {
        node.keywords.forEach(kw => {
            const sv = typeof kw.searchVolume === 'number' ? kw.searchVolume : 0;
            const kd = typeof kw.keywordDifficulty === 'number' ? kw.keywordDifficulty : null;
            const cpc = typeof kw.cpc === 'number' ? kw.cpc : null;

            metrics.totalKeywords += 1;
            metrics.totalSearchVolume += sv;

            if (kd !== null) {
                metrics.weightedKDSum += kd * sv;
                metrics.totalVolumeForKD += sv;
                metrics.simpleKDSum += kd;
                metrics.itemsWithKD += 1;
            }
            if (cpc !== null) {
                metrics.weightedCPCSum += cpc * sv;
                metrics.totalVolumeForCPC += sv;
                metrics.simpleCPCSum += cpc;
                metrics.itemsWithCPC += 1;
            }
        });
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
        node.children.forEach(childNode => {
            // Pass the same calculateMetricsRecursively function and cache for the recursive call
            const childMetrics = calculateMetricsRecursively(childNode, NodeType, calculateMetricsRecursively, cache);

            metrics.totalSearchVolume += childMetrics.totalSearchVolume;
            metrics.totalKeywords += childMetrics.totalKeywords;
            metrics.totalClusters += childMetrics.totalClusters;
            metrics.weightedKDSum += childMetrics.weightedKDSum;
            metrics.totalVolumeForKD += childMetrics.totalVolumeForKD;
            metrics.simpleKDSum += childMetrics.simpleKDSum;
            metrics.itemsWithKD += childMetrics.itemsWithKD;
            metrics.weightedCPCSum += childMetrics.weightedCPCSum;
            metrics.totalVolumeForCPC += childMetrics.totalVolumeForCPC;
            metrics.simpleCPCSum += childMetrics.simpleCPCSum;
            metrics.itemsWithCPC += childMetrics.itemsWithCPC;
        });
    }

    if (metrics.totalVolumeForKD > 0) {
        metrics.averageKD = metrics.weightedKDSum / metrics.totalVolumeForKD;
    } else if (metrics.itemsWithKD > 0) {
        metrics.averageKD = metrics.simpleKDSum / metrics.itemsWithKD;
    } else {
        metrics.averageKD = 0;
    }

    if (metrics.totalVolumeForCPC > 0) {
        metrics.averageCPC = metrics.weightedCPCSum / metrics.totalVolumeForCPC;
    } else if (metrics.itemsWithCPC > 0) {
        metrics.averageCPC = metrics.simpleCPCSum / metrics.itemsWithCPC;
    } else {
        metrics.averageCPC = 0;
    }

    if (cache) {
        cache.set(node, metrics);
    }
    return metrics;
}
// Make functions globally available if using separate script tags without a module bundler
window.extractAllNodesAndKeywords = extractAllNodesAndKeywords;
window.transformNodeForHierarchicalView = transformNodeForHierarchicalView;
window.processRawDataFromFile = processRawDataFromFile;
window.processSampleDataForApp = processSampleDataForApp;
window.calculateDynamicNodeMetrics = calculateDynamicNodeMetrics; 