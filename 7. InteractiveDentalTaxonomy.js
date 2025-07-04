// 3. Cluster Visualizer/7. InteractiveDentalTaxonomy.js
// ------------------------------------------------------
// This file defines the main `InteractiveDentalTaxonomy` React component.
// It serves as the root component for the keyword cluster visualizer, orchestrating
// major functionalities including state management, event handling, and rendering of sub-components.
// Core data processing, filtering/sorting logic, and node rendering details are delegated
// to utility files in the `7.x` series (`7.1.dataProcessingUtils.js`, 
// `7.2.filterSortUtils.js`, `7.3.nodeRenderer.js`).
//
// Core Responsibilities:
// - Manages application state: loaded hierarchical data (`data`), loading/error states,
//   UI interaction states (drag state, expanded nodes, search term, filter settings,
//   display mode, pagination, sort configuration, etc.).
// - Manages refs for pre-processed flat lists of nodes by type (`allKeywordsDataRef`, etc.),
//   which are populated by `7.1.dataProcessingUtils.js`.
// - Handles user interactions and events:
//   - File input and sample data loading (delegating processing to `7.1.dataProcessingUtils.js`).
//   - Node expansion/collapse in the hierarchical view.
//   - Filter changes from `FilterControls` (search term, node types, pillar topic, numeric ranges).
//   - Sorting requests from `DataDisplayArea`.
//   - Pagination for the flat view.
// - Coordinates data flow:
//   - Uses `getFilteredData` (React.useMemo) to prepare data for display by calling
//     filtering utilities from `7.2.filterSortUtils.js`.
//   - Uses a `useEffect` hook to sort flat data by calling `sortFlatDataList` from
//     `7.2.filterSortUtils.js`.
// - Renders the main application layout, composing:
//   - `FilterControls` component.
//   - `DropZoneView` component (if no data is loaded).
//   - `DataDisplayArea` component.
// - Prepares a `renderNodePropsObject` containing all necessary state, callbacks, and helper
//   functions, and provides a wrapper `renderNode` function to `DataDisplayArea` which,
//   in turn, calls `renderTaxonomyNode` from `7.3.nodeRenderer.js`.
//
// Dependencies:
// - React (including hooks: useState, useEffect, useMemo, useCallback, useRef).
// - Constants from `1. constants.js` (SAMPLE_DATA, NodeType, INITIAL_FILTERS_STATE, etc.).
// - Helper functions from `2. helpers.js` (formatters, style getters, `customKeywordSort`).
// - Utility functions from:
//   - `7.1.dataProcessingUtils.js` (processRawDataFromFile, processSampleDataForApp, calculateDynamicNodeMetrics).
//   - `7.2.filterSortUtils.js` (checkRangeSelectionFilter, filterHierarchicalTreeRecursive, filterFlatListByType, sortFlatDataList).
//   - `7.3.nodeRenderer.js` (renderTaxonomyNode).
// - Sub-components:
//   - `3. FilterControls.js`
//   - `4. DropZoneView.js`
//   - `5. KeywordListDisplay.js` (passed as a component to `renderTaxonomyNode`)
//   - `6. DataDisplayArea.js`
//
// Connects to:
// - This is the top-level application component rendered by `app.js`.
// - Passes necessary state and callback functions as props to its child components.
//
// Purpose:
// - To serve as the central controller and view manager for the entire application.
// - To integrate various UI components and utility modules into a cohesive experience.

// Debounce utility function
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function InteractiveDentalTaxonomy() {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [expandedNodes, setExpandedNodes] = React.useState(new Set());
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 100;
    const [isFilterSectionManuallyCollapsed, setIsFilterSectionManuallyCollapsed] = React.useState(false);
    const [sortConfig, setSortConfig] = React.useState([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

    // --- Search / exclusion logic centralised in useSearchLogic ---
    const {
        searchTerm,
        debouncedSearchTerm,
        excludedKeywords,
        handleSearchChange: baseHandleSearchChange,
        handleAddExcludedKeyword,
        handleRemoveExcludedKeyword,
        handleAddMultipleExcludedKeywords,
        resetExcludedKeywords
    } = window.useSearchLogic ? window.useSearchLogic() : { searchTerm:'', debouncedSearchTerm:'', excludedKeywords:[], handleSearchChange:()=>{}, handleAddExcludedKeyword:()=>{}, handleRemoveExcludedKeyword:()=>{}, handleAddMultipleExcludedKeywords:()=>{}, resetExcludedKeywords:()=>{} };

    const [flatListLength, setFlatListLength] = React.useState(0);
    const [processingFilter, setProcessingFilter] = React.useState(false);
    const [filters, setFilters] = React.useState(INITIAL_FILTERS_STATE);

    const fullFlatListData = React.useRef([]);
    const filteredData = React.useRef([]); // This will store the (filtered and then) sorted list for flat view
    // Expose filteredData globally for DataDisplayArea metrics
    window.filteredData = filteredData;
    const allKeywordsDataRef = React.useRef([]);
    const allPillarsDataRef = React.useRef([]);
    const allParentsDataRef = React.useRef([]);
    const allSubtopicsDataRef = React.useRef([]);
    const allClustersDataRef = React.useRef([]);
    const [isSearching, setIsSearching] = React.useState(false);

    const pillarTopicOptions = React.useMemo(() => {
        if (!data) {
            return [{ value: 'all', label: 'All Pillar Topics' }];
        }
        const pillars = data.filter(node => node.type === NodeType.PILLAR)
                                    .map(pillar => ({ value: pillar.name, label: pillar.name }));
        return [{ value: 'all', label: 'All Pillar Topics' }, ...pillars];
    }, [data]);

    const handleDropdownChange = (filterKey, selectedValue) => {
        setProcessingFilter(true);
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterKey]: {
                ...prevFilters[filterKey],
                currentSelection: selectedValue,
                customMin: selectedValue !== 'custom' ? '' : prevFilters[filterKey].customMin,
                customMax: selectedValue !== 'custom' ? '' : prevFilters[filterKey].customMax,
            },
        }));
    };
    
    const handleCustomInputChange = (filterKey, boundary, value) => {
        setProcessingFilter(true);
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterKey]: {
                ...prevFilters[filterKey],
                [boundary]: value,
            },
        }));
    };

    const handleApplyCustomRange = (filterKey) => {
        setProcessingFilter(true);
        setFilters(prevFilters => ({ ...prevFilters })); 
    };

    const handleSort = (columnKey) => {
        setSortConfig(currentSortConfigArray => {
            const currentSort = currentSortConfigArray.length > 0 ? currentSortConfigArray[0] : null;
            let newDirection = (currentSort && currentSort.key === columnKey && currentSort.direction === 'asc') ? 'desc' : 'asc';
            return [{ key: columnKey, direction: newDirection }];
        });
        setCurrentPage(1);
    };

    const handleToggleFilterSection = () => setIsFilterSectionManuallyCollapsed(prevState => !prevState);

    const handleResetAllFilters = () => {
        setProcessingFilter(true);
        setFilters(INITIAL_FILTERS_STATE);
        resetExcludedKeywords();
        setSortConfig([]);
        setCurrentPage(1);
    };

    // Wrapper that toggles processingFilter whilst delegating to hook handler
    const handleSearchChange = (e) => {
        setProcessingFilter(true);
        baseHandleSearchChange(e);
    };

    const handleNodeTypeFilterChange = (nodeType) => {
        setProcessingFilter(true); // Keep this to show loading/processing state
        setFilters(prevFilters => {
            const newNodeTypes = {
                ...prevFilters.nodeTypes,
                [nodeType]: !prevFilters.nodeTypes[nodeType] // Direct toggle
            };
            return {
                ...prevFilters,
                nodeTypes: newNodeTypes
            };
        });
        setCurrentPage(1); // Reset page on filter change, good practice
        // The existing useEffect that watches [filters, processingFilter, displayMode]
        // will handle setting setProcessingFilter(false) after a brief timeout
        // if not in the async keyword loading path. This can remain as is for now,
        // but might be revisited if displayMode state is removed.
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) newSet.delete(nodeId); else newSet.add(nodeId);
            return newSet;
        });
    };

    // Memoized function for calculating metrics, to be passed to nodeRenderer
    // It directly calls the utility function.
    const calculateMetricsForNode = React.useCallback((node) => {
        // The calculateDynamicNodeMetrics from utils needs itself for recursion and a cache.
        const metricsCache = new WeakMap(); // Create a new cache for this calculation pass
        return calculateDynamicNodeMetrics(node, NodeType, calculateDynamicNodeMetrics, metricsCache);
    }, [NodeType]); // NodeType is stable, calculateDynamicNodeMetrics from global scope is stable

    const getFilteredData = React.useMemo(() => {
        if (!data) return null;

        const selectedPillar = filters.pillarTopic.currentSelection;
        const dataSource = selectedPillar === 'all' || !selectedPillar 
            ? data 
            : data.filter(node => node.type === NodeType.PILLAR && node.name === selectedPillar);

        // Use debouncedSearchTerm for filtering logic
        const searchTermsArray = debouncedSearchTerm
            .split(',')
            .map(term => {
                const trimmed = term.trim();
                if (trimmed.length === 0) return null;
                if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
                    return { value: trimmed.slice(1, -1).toLowerCase(), isExact: true };
                } else {
                    return { value: trimmed.toLowerCase(), isExact: false };
                }
            })
            .filter(termObj => termObj && termObj.value.length > 0);

        const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);

        if (selectedNodeTypesArray.length === 0) {
            fullFlatListData.current = [];
            setFlatListLength(0);
            return [];
        }

        // Determine currentDisplayMode internally
        const currentDisplayMode = selectedNodeTypesArray.length === 1 ? 'flat' : 'hierarchical';

        if (currentDisplayMode === 'flat') {
            setProcessingFilter(true);
            const singleSelectedType = selectedNodeTypesArray[0];
            let sourceDataForFlatList;
            switch (singleSelectedType) {
                case NodeType.PILLAR:   sourceDataForFlatList = allPillarsDataRef.current; break;
                case NodeType.PARENT:   sourceDataForFlatList = allParentsDataRef.current; break;
                case NodeType.SUBTOPIC: sourceDataForFlatList = allSubtopicsDataRef.current; break;
                case NodeType.CLUSTER:  sourceDataForFlatList = allClustersDataRef.current; break;
                case NodeType.KEYWORDS: sourceDataForFlatList = allKeywordsDataRef.current; break;
                default: sourceDataForFlatList = [];
            }
            // Pass searchTermsArray (array of {value, isExact}) and excludedKeywords
            fullFlatListData.current = filterFlatListByType(
                sourceDataForFlatList, filters, selectedPillar, 
                searchTermsArray, singleSelectedType, NodeType, 
                checkRangeSelectionFilter, // from 7.2.filterSortUtils.js
                SEARCH_VOLUME_RANGES, KEYWORD_DIFFICULTY_RANGES, CPC_RANGES,
                excludedKeywords // NEW ARG
            );
            setCurrentPage(1);
            return [];
        } else { // Hierarchical Mode
            fullFlatListData.current = [];
            filteredData.current = [];
            setFlatListLength(0);
            // Pass searchTermsArray (array of {value, isExact}) and excludedKeywords
            const hierarchicalResult = filterHierarchicalTreeRecursive(
                dataSource,
                filters,
                searchTermsArray,
                NodeType,
                /* applyToNodeNames = */ false, // hierarchical mode – skip node-level filters
                SEARCH_VOLUME_RANGES,
                KEYWORD_DIFFICULTY_RANGES,
                CPC_RANGES,
                excludedKeywords
            );
            return hierarchicalResult;
        }
    }, [data, debouncedSearchTerm, filters, NodeType, SEARCH_VOLUME_RANGES, KEYWORD_DIFFICULTY_RANGES, CPC_RANGES, excludedKeywords]);

    // Effect for sorting flat data when fullFlatListData or sortConfig changes
    React.useEffect(() => {
        // Determine current mode directly for this effect
        const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);
        const isFlatModeCurrently = selectedNodeTypesArray.length === 1;

        if (isFlatModeCurrently) {
            setProcessingFilter(true); // Set true at the beginning of processing for flat mode
            setTimeout(() => {
                // fullFlatListData.current should have been updated by getFilteredData
                // due to changes in `filters` or `searchTerm` which are deps of this effect.
                const sorted = sortFlatDataList(fullFlatListData.current, sortConfig.length > 0 ? sortConfig[0] : null, customKeywordSort);
                filteredData.current = sorted;
                setFlatListLength(sorted.length);
                setCurrentPage(1); 
                setProcessingFilter(false); // Set false after processing
            }, 0);
        } else {
             // Not in flat mode (e.g., hierarchical or no types selected)
            filteredData.current = [];
            setFlatListLength(0);
            // If we were processing (e.g. switched from flat to hierarchical, or filters cleared to show no types),
            // ensure processingFilter is turned off.
            setProcessingFilter(false);
        }
    }, [filters, debouncedSearchTerm, sortConfig, customKeywordSort, NodeType, excludedKeywords]); // UPDATED dependencies: Added excludedKeywords, changed searchTerm to debouncedSearchTerm
                                                                                      // Adding filters.nodeTypes ensures it re-evaluates mode. NodeType for safety.

    const paginatedViewData = React.useMemo(() => {
        // Determine current mode directly for this memo
        const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);
        const isFlatModeCurrently = selectedNodeTypesArray.length === 1;

        if (isFlatModeCurrently && filteredData.current.length > 0) {
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            return filteredData.current.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        }
        return [];
    }, [filters.nodeTypes, currentPage, ITEMS_PER_PAGE, filteredData.current]); // UPDATED dependencies

    // Prepare props for renderTaxonomyNode once, memoize if it becomes a performance bottleneck.
    const renderNodePropsObject = {
        filters,
        NodeType,
        expandedNodes,
        toggleNode,
        calculateDynamicNodeMetrics: calculateMetricsForNode, // Use the memoized version
        formatNumber, // from 2.helpers.js
        formatDecimal, // from 2.helpers.js
        formatCurrency, // from 2.helpers.js
        getNodeTypePillStyles, // from 2.helpers.js
        getNodeTypeColor, // from 2.helpers.js
        KeywordListDisplayComponent: KeywordListDisplay // Pass the component itself
    };

    // This function is passed to DataDisplayArea, which then calls it for each node.
    const memoizedRenderNode = React.useCallback((node, level, isFlat, propsFromCaller, index) => {
        // propsFromCaller is the fully constructed props object from DataDisplayArea
        return renderTaxonomyNode(node, level, isFlat, propsFromCaller, index);
    }, []); // renderTaxonomyNode is global, no deps from this component's scope are directly used by this wrapper now.

    const handleToggleExpandAll = () => {
        if (expandedNodes.size > 0) { // Collapse All action
            setExpandedNodes(new Set());
        } else { // Expand Top Level action
            // Determine current mode directly for this handler
            const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
                .filter(([_, isSelected]) => isSelected)
                .map(([type]) => type);
            const isHierarchicalModeCurrently = selectedNodeTypesArray.length !== 1;

            if (getFilteredData && isHierarchicalModeCurrently) {
                const topLevelNodeIds = new Set();
                // getFilteredData is the array of top-level nodes for hierarchical view
                getFilteredData.forEach((node, index) => {
                    // The level for top-level nodes is 0
                    const nodeId = `${node.type}-${node.name}-0`; 
                    // Check if this top-level node is actually expandable (has children or keywords to show when expanded)
                    const hasChildrenToDisplay = node.children && node.children.length > 0;
                    // Check if keywords type is selected for display, as per comments in original file
                    const hasKeywordsToDisplayInCluster = node.type === NodeType.CLUSTER && Array.isArray(node.keywords) && node.keywords.length > 0 && filters.nodeTypes[NodeType.KEYWORDS];
                    
                    const isExpandable = hasChildrenToDisplay || hasKeywordsToDisplayInCluster;

                    if (isExpandable) {
                        topLevelNodeIds.add(nodeId);
                    }
                });
                setExpandedNodes(topLevelNodeIds);
            }
        }
    };

    // Add new useEffect hook to load data from GitHub
    React.useEffect(() => {
        const loadDataFromGitHub = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://raw.githubusercontent.com/RodrigoGalindoF/strider/main/squarified-ready.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const jsonData = await response.json();
                const result = processRawDataFromFile(JSON.stringify(jsonData), NodeType);
                if (result.error) {
                    setError(result.error);
                    setData(null);
                } else {
                    setData(result.hierarchicalData);
                    allPillarsDataRef.current = result.allPillarsData;
                    allParentsDataRef.current = result.allParentsData;
                    allSubtopicsDataRef.current = result.allSubtopicsData;
                    allClustersDataRef.current = result.allClustersData;
                    allKeywordsDataRef.current = result.allKeywordsData;
                    console.log('Data loaded and processed from GitHub.');
                }
            } catch (err) {
                console.error('Error loading data from GitHub:', err);
                setError('Error loading data: ' + err.message);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        loadDataFromGitHub();
    }, []); // Empty dependency array means this runs once when component mounts

    // --- Global Metrics Calculation (Moved from DataDisplayArea) ---
    const globalMetrics = React.useMemo(() => {
        let calculatedMetrics = { totalSearchVolume: 0, averageKD: 0, totalKeywords: 0, averageCPC: 0 };
        const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);
        const currentDisplayMode = selectedNodeTypesArray.length === 1 ? 'flat' : 'hierarchical';

        function aggregateMetrics(itemList) { // Renamed from aggregateKeywordMetrics
            let totalSearchVolume = 0;
            let totalKeywords = 0;
            let weightedKDSum = 0;
            let totalVolumeForKD = 0;
            let itemsWithKD = 0;
            let simpleKDSum = 0;
            let weightedCPCSum = 0;
            let totalVolumeForCPC = 0;
            let itemsWithCPC = 0;
            let simpleCPCSum = 0;
            itemList.forEach(item => {
                const sv = typeof item.searchVolume === 'number' ? item.searchVolume : 0;
                const kd = typeof item.keywordDifficulty === 'number' ? item.keywordDifficulty : null;
                const cpc = typeof item.cpc === 'number' ? item.cpc : null;
                totalSearchVolume += sv;
                totalKeywords += 1;
                if (kd !== null) {
                    weightedKDSum += kd * sv;
                    totalVolumeForKD += sv;
                    simpleKDSum += kd;
                    itemsWithKD += 1;
                }
                if (cpc !== null) {
                    weightedCPCSum += cpc * sv;
                    totalVolumeForCPC += sv;
                    simpleCPCSum += cpc;
                    itemsWithCPC += 1;
                }
            });
            let averageKD = totalVolumeForKD > 0 ? weightedKDSum / totalVolumeForKD : (itemsWithKD > 0 ? simpleKDSum / itemsWithKD : 0);
            let averageCPC = totalVolumeForCPC > 0 ? weightedCPCSum / totalVolumeForCPC : (itemsWithCPC > 0 ? simpleCPCSum / itemsWithCPC : 0);
            return { totalSearchVolume, averageKD, totalKeywords, averageCPC };
        }

        if (currentDisplayMode === 'hierarchical' && getFilteredData && getFilteredData.length > 0) {
            const keywordMap = new Map();
            function walk(node) {
                if (!node) return;
                if (node.type === NodeType.CLUSTER && Array.isArray(node.keywords)) {
                    node.keywords.forEach(kw => {
                        if (kw && typeof kw.keyword === 'string') {
                            const key = kw.keyword.trim().toLowerCase();
                            if (!keywordMap.has(key)) {
                                keywordMap.set(key, { ...kw, type: NodeType.KEYWORDS }); // Ensure type is set
                            }
                        }
                    });
                }
                if (Array.isArray(node.children)) {
                    node.children.forEach(walk);
                }
            }
            getFilteredData.forEach(walk);
            calculatedMetrics = aggregateMetrics(Array.from(keywordMap.values()));
        } else if (currentDisplayMode === 'flat' && filteredData.current && filteredData.current.length > 0) {
            // Use the full filtered flat list (filteredData.current)
            calculatedMetrics = aggregateMetrics(filteredData.current);
        }
        return calculatedMetrics;
    }, [getFilteredData, filteredData.current, filters.nodeTypes, NodeType]); // Dependencies updated
    // --- End Global Metrics Calculation ---

    return React.createElement('div', { style: { display: 'flex', flex: 1 } }, [
        // Sidebar with collapse button
        React.createElement('div', {
            className: 'collapsible-sidebar',
            style: {
                width: isSidebarCollapsed ? '40px' : '300px'
            }
        }, [
            // Collapse/Expand button
            React.createElement('button', {
                onClick: () => setIsSidebarCollapsed(!isSidebarCollapsed),
                className: 'sidebar-toggle-button'
            }, isSidebarCollapsed ? '→' : '←'),
            
            // Filter controls (hidden when collapsed)
            !isSidebarCollapsed && React.createElement('div', {
                className: 'sidebar-content'
            }, [
                React.createElement(FilterControls, {
                    filters,
                    searchTerm,
                    onSearchChange: baseHandleSearchChange,
                    onNodeTypeFilterChange: handleNodeTypeFilterChange,
                    pillarTopicOptions,
                    onDropdownChange: handleDropdownChange,
                    onCustomInputChange: handleCustomInputChange,
                    onApplyCustomRange: handleApplyCustomRange,
                    onToggleFilterSection: handleToggleFilterSection,
                    isFilterSectionManuallyCollapsed,
                    onResetAllFilters: handleResetAllFilters,
                    SEARCH_VOLUME_RANGES,
                    KEYWORD_DIFFICULTY_RANGES,
                    CPC_RANGES,
                    NodeType,
                    excludedKeywords,
                    onAddExcludedKeyword: handleAddExcludedKeyword,
                    onRemoveExcludedKeyword: handleRemoveExcludedKeyword,
                    onAddMultipleExcludedKeywords: handleAddMultipleExcludedKeywords
                })
            ])
        ]),
        
        // Main content area
        React.createElement('div', {
            className: 'main-content-area'
        }, [
            // Search bar (sticky)
            React.createElement('div', {
                className: 'sticky-search-bar'
            }, [
                // Use the original search input structure from FilterControls
                React.createElement('div', { className: 'search-bar-input-wrapper' }, [
                    React.createElement('span', { className: 'search-bar-icon' }, '🔍'),
                    React.createElement('input', {
                        type: 'text',
                        placeholder: 'Search by keyword. Use quotes for exact match, and commas for multiple terms.',
                        value: searchTerm,
                        onChange: handleSearchChange, // Use the handler from this component
                        className: 'search-bar-input'
                    }),
                ]),
                // --- Render Excluded Keyword Pills and Exclude Button --- 
                excludedKeywords.length > 0 && React.createElement('div', {
                    className: 'excluded-keywords-container' // Use CSS class
                }, [
                    React.createElement('span', {
                        className: 'excluded-label' // Use CSS class
                    }, 'Excluded:'),
                    ...excludedKeywords.map(keyword => React.createElement('span', {
                        key: keyword,
                        className: 'excluded-keyword-pill', // Use CSS class
                        onClick: () => handleRemoveExcludedKeyword(keyword) // Use the hook's handler
                    }, [
                        keyword,
                        React.createElement('span', {
                            className: 'remove-keyword-icon' // Use CSS class
                        }, '×')
                    ]))
                ]),
 
                // Render "Exclude terms" button below pills
                (() => {
                    const parsedSearchTerms = searchTerm
                        .split(',')
                        .map(term => term.trim())
                        .filter(term => term.length > 0);
                    const termsToPotentiallyExclude = parsedSearchTerms.filter(term => {
                        const normalizedTerm = term.toLowerCase().replace(/^"|"$/g, '');
                        return !excludedKeywords.includes(normalizedTerm);
                    });
                    const canExcludeAnyTerm = termsToPotentiallyExclude.length > 0;
 
                    return canExcludeAnyTerm && React.createElement('button', {
                        className: 'exclude-terms-button', // Use CSS class
                        onClick: (e) => {
                            e.preventDefault();
                            handleAddMultipleExcludedKeywords(searchTerm); // Use the hook's handler
                        }
                    }, `Exclude: "${termsToPotentiallyExclude.join('", "')}"?`);
                })()
                // --- End Excluded UI --- 
            ]),

            // Global metrics bar (sticky, below search)
            React.createElement('div', {
                style: {
                    position: 'sticky',
                    top: '80px', // Assuming search bar is approx 80px height with padding
                    zIndex: 19, // Slightly below search bar if they overlap
                    marginBottom: '20px',
                    padding: '16px 24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }
            }, [
                React.createElement('div', { 
                    style: { 
                        display: 'flex', 
                        gap: '32px', 
                        flexWrap: 'wrap', 
                        alignItems: 'center',
                        flex: 1
                    } 
                }, [
                    // Search Volume Metric
                    React.createElement('div', { className: 'metric-item' }, [
                        React.createElement('span', { className: 'metric-label' }, 'Search Volume'),
                        React.createElement('span', { className: 'metric-value' }, globalMetrics.totalSearchVolume.toLocaleString())
                    ]),
                    // Average KD Metric
                    React.createElement('div', { className: 'metric-item' }, [
                        React.createElement('span', { className: 'metric-label' }, 'Average KD'),
                        React.createElement('span', { className: 'metric-value' }, `${globalMetrics.averageKD.toFixed(1)}%`)
                    ]),
                    // Total Keywords Metric
                    React.createElement('div', { className: 'metric-item' }, [
                        React.createElement('span', { className: 'metric-label' }, 'Total Keywords'),
                        React.createElement('span', { className: 'metric-value' }, globalMetrics.totalKeywords.toLocaleString())
                    ]),
                    // Average CPC Metric
                    React.createElement('div', { className: 'metric-item' }, [
                        React.createElement('span', { className: 'metric-label' }, 'Average CPC'),
                        React.createElement('span', { className: 'metric-value' }, `$${globalMetrics.averageCPC.toFixed(2)}`)
                    ])
                ]),
                // Expand/Collapse and Export buttons (conditionally rendered)
                // Determine displayMode here based on filters
                React.createElement(React.Fragment, null, // Use Fragment to avoid extra div
                    (Object.entries(filters.nodeTypes).filter(([_,isSelected]) => isSelected).length !== 1) ? // Hierarchical Mode
                        React.createElement('button', {
                            onClick: () => setExpandedNodes(new Set()), // Only collapse
                            className: 'metrics-action-button collapse-all-button' // Use new classes
                        }, [
                            'Collapse All' // No icon
                        ])
                    : // Flat Mode
                        React.createElement('button', {
                            onClick: () => {
                                // Ensure correct data and parameters are passed
                                const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
                                    .filter(([_, isSelected]) => isSelected)
                                    .map(([type]) => type);
                                if (selectedNodeTypesArray.length === 1 && filteredData.current) {
                                    window.csvExportUtils.exportToCSV(
                                        filteredData.current, // Export filtered flat data
                                        selectedNodeTypesArray[0], // The single selected type
                                        filters.pillarTopic.currentSelection === 'all' ? 'all-pillars' : filters.pillarTopic.currentSelection // Pillar selection for filename
                                    );
                                } else {
                                    console.warn("Cannot export: Not in flat view or no data.");
                                }
                            },
                            className: 'metrics-action-button export-csv-button' // Use new classes
                        }, [
                            React.createElement('span', { className: 'icon', style: { display: 'inline-flex', alignItems: 'center' } },
                                // Stylish download SVG icon
                                React.createElement('svg', {
                                    xmlns: 'http://www.w3.org/2000/svg',
                                    width: 18,
                                    height: 18,
                                    viewBox: '0 0 20 20',
                                    fill: 'none',
                                    style: { marginRight: 6, verticalAlign: 'middle' }
                                },
                                    React.createElement('path', {
                                        d: 'M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15h12',
                                        stroke: '#2563eb',
                                        'stroke-width': 2,
                                        'stroke-linecap': 'round',
                                        'stroke-linejoin': 'round',
                                        fill: 'none'
                                    })
                                )
                            ),
                            'Export CSV'
                        ])
                )
            ]),

            // Data display scroll area
            React.createElement('div', {
                className: 'data-display-scroll-area'
            }, [
                React.createElement(DataDisplayArea, { 
                    displayMode: Object.entries(filters.nodeTypes).filter(([_,isSelected]) => isSelected).length === 1 ? 'flat' : 'hierarchical',
                    filters,
                    searchTerm,
                    getFilteredData: Object.entries(filters.nodeTypes).filter(([_,isSelected]) => isSelected).length !== 1 ? getFilteredData : [],
                    paginatedViewData,
                    currentPage,
                    ITEMS_PER_PAGE,
                    setCurrentPage,
                    onToggleExpandAll: handleToggleExpandAll,
                    expandedNodes,
                    renderNode: memoizedRenderNode,
                    baseRendererProps: renderNodePropsObject,
                    processingFilter,
                    loading,
                    error,
                    isSearching,
                    isFilterSectionManuallyCollapsed,
                    sortConfig,
                    onSort: handleSort,
                    NodeType,
                    totalFlatItemsCount: fullFlatListData.current.length,
                    matchingFlatItemsCount: filteredData.current.length
                })
            ])
        ])
    ]);
} 