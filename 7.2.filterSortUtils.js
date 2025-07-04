// 3. Cluster Visualizer/7.2.filterSortUtils.js
// Provides utility functions for filtering and sorting data.

/**
 * Checks if a given value passes a range filter (predefined or custom).
 * @param {number|string} value - The value to check.
 * @param {Object} filterSetting - The filter setting object (e.g., filters.searchVolume).
 * @param {Object} rangeCollection - The collection of predefined ranges (e.g., SEARCH_VOLUME_RANGES).
 * @returns {boolean} True if the value passes the filter, false otherwise.
 */
function checkRangeSelectionFilter_internal(value, filterSetting, rangeCollection) {
    const val = parseFloat(value);
    // If the value itself is not a number, it shouldn't be filtered out by a numeric filter.
    // Or, if it's 0 and you want to include items with 0 value when no filter is set.
    if (isNaN(val)) return true; 

    const { currentSelection, customMin, customMax } = filterSetting;

    if (currentSelection === 'any' || !currentSelection) {
        return true; // No filter applied or invalid selection
    }

    let minBound = null;
    let maxBound = null;

    if (currentSelection === 'custom') {
        minBound = customMin === '' ? null : parseFloat(customMin);
        maxBound = customMax === '' ? null : parseFloat(customMax);
    } else if (rangeCollection && rangeCollection[currentSelection]) {
        const range = rangeCollection[currentSelection];
        minBound = range.min !== null ? parseFloat(range.min) : null;
        maxBound = range.max !== null ? parseFloat(range.max) : null;
    } else {
        return true; // Should not happen with valid setup, treat as 'any'
    }

    if (minBound !== null && !isNaN(minBound) && val < minBound) return false;
    if (maxBound !== null && !isNaN(maxBound) && val > maxBound) return false;
    
    return true;
}

/**
 * Internal recursive function to filter the hierarchical data structure.
 */
function filterHierarchicalTreeRecursive_internal(
    nodesToFilter,
    filters,
    searchTermsArray,
    NodeType,
    applyFiltersToNodeNames, // NEW FLAG
    checkRangeFunc,
    SEARCH_VOLUME_RANGES,
    KEYWORD_DIFFICULTY_RANGES,
    CPC_RANGES,
    excludedKeywords = []
) {
    if (!nodesToFilter || !Array.isArray(nodesToFilter) || nodesToFilter.length === 0) return [];
    let currentLevelVisibleNodes = [];

    // Helper for exclusion
    const isExcluded = (name) => {
        if (!name) return false;
        const lower = name.trim().toLowerCase();
        return excludedKeywords.some(ex => lower.includes(ex));
    };

    for (const node of nodesToFilter) {
        if (!node) continue;
        // Optionally skip exclusion at node level
        if (applyFiltersToNodeNames && isExcluded(node.name)) continue;

        const visibleChildren = filterHierarchicalTreeRecursive_internal(
            node.children || [], 
            filters, 
            searchTermsArray, 
            NodeType, 
            applyFiltersToNodeNames, 
            checkRangeFunc, 
            SEARCH_VOLUME_RANGES, 
            KEYWORD_DIFFICULTY_RANGES, 
            CPC_RANGES,
            excludedKeywords // pass down
        );

        const isNodeTypeSelected = filters.nodeTypes[node.type];

        const passesNumerics = applyFiltersToNodeNames ? (
            checkRangeFunc(node.size || 0, filters.searchVolume, SEARCH_VOLUME_RANGES) &&
            checkRangeFunc(node.averageKD || 0, filters.keywordDifficulty, KEYWORD_DIFFICULTY_RANGES) &&
            checkRangeFunc(node.averageCPC || 0, filters.averageCPC, CPC_RANGES)
        ) : true;
        
        let passesSearch = true;
        if (applyFiltersToNodeNames && Array.isArray(searchTermsArray) && searchTermsArray.length > 0) {
            const nodeNameLower = node.name ? node.name.toLowerCase() : '';
            const centroidKeywordsLower = node.metadata?.centroid_keywords ? node.metadata.centroid_keywords.toLowerCase() : '';
            const tfidfKeywordsLower = node.metadata?.tfidf_keywords ? node.metadata.tfidf_keywords.toLowerCase() : '';
            passesSearch = searchTermsArray.some(termObj => {
                if (termObj.isExact) {
                    return nodeNameLower === termObj.value ||
                        centroidKeywordsLower === termObj.value ||
                        tfidfKeywordsLower === termObj.value;
                } else {
                    return new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(nodeNameLower) ||
                        new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(centroidKeywordsLower) ||
                        new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(tfidfKeywordsLower);
                }
            });
        }
        
        const selfMatchesContentFilters = passesNumerics && passesSearch;
        
        let filteredKeywords = [];
        let clusterHasMatchingKeywords = false;
        if (node.type === NodeType.CLUSTER && Array.isArray(node.keywords)) {
            if (filters.nodeTypes[NodeType.KEYWORDS] && node.keywords.length > 0) { 
                filteredKeywords = node.keywords.filter(kw => {
                    if (!kw || typeof kw.keyword !== 'string') return false; 
                    // Exclude keyword if it matches any excluded keyword
                    if (isExcluded(kw.keyword)) return false;
                    const kwTextLower = kw.keyword.toLowerCase();
                    let kwSearchMatch = true;
                    if (Array.isArray(searchTermsArray) && searchTermsArray.length > 0) {
                        kwSearchMatch = searchTermsArray.some(termObj =>
                            termObj.isExact
                                ? kwTextLower === termObj.value
                                : new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(kwTextLower)
                        );
                    }
                    let kwNumericMatch = 
                        checkRangeFunc(kw.searchVolume || 0, filters.searchVolume, SEARCH_VOLUME_RANGES) &&
                        checkRangeFunc(kw.keywordDifficulty || 0, filters.keywordDifficulty, KEYWORD_DIFFICULTY_RANGES) && 
                        checkRangeFunc(kw.cpc || 0, filters.averageCPC, CPC_RANGES);
                    return kwSearchMatch && kwNumericMatch;
                });
                clusterHasMatchingKeywords = filteredKeywords.length > 0;
            } else {
                filteredKeywords = []; 
            }
        }
        
        let includeNode = false;
        if (visibleChildren.length > 0) {
            includeNode = true;
        } else if (isNodeTypeSelected && selfMatchesContentFilters) {
            includeNode = true;
        } else if (node.type === NodeType.CLUSTER && filters.nodeTypes[NodeType.KEYWORDS] && clusterHasMatchingKeywords) {
            includeNode = true;
        }
        
        if (includeNode) {
            currentLevelVisibleNodes.push({
                ...node,
                children: visibleChildren,
                keywords: filteredKeywords
            });
        }
    }
    return currentLevelVisibleNodes;
}

// Wrapper function to be exposed globally
function filterHierarchicalTreeRecursive(
    nodesToFilter,
    filters,
    searchTermsArray,
    NodeType,
    applyFiltersToNodeNames = true, // default preserves previous behaviour
    SEARCH_VOLUME_RANGES,
    KEYWORD_DIFFICULTY_RANGES,
    CPC_RANGES,
    excludedKeywords = []
) {
    // Calls the internal function, passing the _internal checkRangeSelectionFilter
    return filterHierarchicalTreeRecursive_internal(
        nodesToFilter,
        filters,
        searchTermsArray,
        NodeType,
        applyFiltersToNodeNames, // new flag forwarded
        checkRangeSelectionFilter_internal,
        SEARCH_VOLUME_RANGES,
        KEYWORD_DIFFICULTY_RANGES,
        CPC_RANGES,
        excludedKeywords
    );
}

// Expose functions to window object
window.checkRangeSelectionFilter = checkRangeSelectionFilter_internal; // Expose the internal one
window.filterHierarchicalTreeRecursive = filterHierarchicalTreeRecursive; // Expose the wrapper

/**
 * Filters a flat list of nodes based on various criteria (pillar topic, numeric ranges, search term).
 * @param {Array} sourceList - The initial flat list of nodes of a specific type.
 * @param {Object} filters - The main filters object from state.
 * @param {string} selectedPillar - The currently selected pillar topic ('all' or specific name).
 * @param {string} searchTermsArray - The array of search terms.
 * @param {string} singleSelectedType - The specific NodeType being filtered (e.g., NodeType.CLUSTER).
 * @param {Object} NodeType - The NodeType constants.
 * @param {Function} rangeCheckFunc - The checkRangeSelectionFilter_internal function.
 * @param {Object} SEARCH_VOLUME_RANGES_local - Constant for search volume ranges.
 * @param {Object} KEYWORD_DIFFICULTY_RANGES_local - Constant for KD ranges.
 * @param {Object} CPC_RANGES_local - Constant for CPC ranges.
 * @returns {Array} The filtered flat list.
 */
function filterFlatListByType_internal(
    sourceList, 
    filters, 
    selectedPillar, 
    searchTermsArray, 
    singleSelectedType, 
    NodeType, 
    rangeCheckFunc, 
    SEARCH_VOLUME_RANGES_local, 
    KEYWORD_DIFFICULTY_RANGES_local, 
    CPC_RANGES_local,
    excludedKeywords = [] // NEW ARG
) {
    if (!sourceList) return [];

    // Helper for exclusion
    const isExcluded = (name) => {
        if (!name) return false;
        const lower = name.trim().toLowerCase();
        return excludedKeywords.some(ex => lower.includes(ex));
    };

    let pillarFilteredList = sourceList;
    if (selectedPillar !== 'all' && selectedPillar) {
        pillarFilteredList = sourceList.filter(item => {
            if (!item.fullHierarchyPath || typeof item.fullHierarchyPath !== 'string') {
                return item.type === NodeType.PILLAR && item.name === selectedPillar;
            }
            if (item.type === NodeType.PILLAR) {
                return item.name === selectedPillar;
            }
            return item.fullHierarchyPath.startsWith(selectedPillar + " > ");
        });
    }

    let numericFilteredList = pillarFilteredList.filter(item => {
        return rangeCheckFunc(item.searchVolume || 0, filters.searchVolume, SEARCH_VOLUME_RANGES_local) &&
               rangeCheckFunc(item.keywordDifficulty || 0, filters.keywordDifficulty, KEYWORD_DIFFICULTY_RANGES_local) &&
               rangeCheckFunc(item.cpc || 0, filters.averageCPC, CPC_RANGES_local);
    });

    // Exclude items whose name matches any excluded keyword
    let exclusionFilteredList = numericFilteredList.filter(item => !isExcluded(item.name));

    let searchFilteredList = exclusionFilteredList;
    if (Array.isArray(searchTermsArray) && searchTermsArray.length > 0) {
        searchFilteredList = exclusionFilteredList.filter(item => {
            const itemNameLower = item.name ? item.name.toLowerCase() : '';
            let passesSearch = searchTermsArray.some(termObj =>
                termObj.isExact
                    ? itemNameLower === termObj.value
                    : new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(itemNameLower)
            );
            if (!passesSearch && singleSelectedType !== NodeType.KEYWORDS && item.metadata) {
                const centroidKeywordsLower = item.metadata.centroid_keywords ? item.metadata.centroid_keywords.toLowerCase() : '';
                const tfidfKeywordsLower = item.metadata.tfidf_keywords ? item.metadata.tfidf_keywords.toLowerCase() : '';
                passesSearch = searchTermsArray.some(termObj =>
                    termObj.isExact
                        ? centroidKeywordsLower === termObj.value || tfidfKeywordsLower === termObj.value
                        : new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(centroidKeywordsLower) ||
                          new RegExp('\\b' + escapeRegExp(termObj.value) + '\\b', 'i').test(tfidfKeywordsLower)
                );
            }
            return passesSearch;
        });
    }
    return searchFilteredList;
}

// We will add the global assignment for this function later.

/**
 * Sorts a flat list of data based on the provided sort configuration.
 * @param {Array} list - The list to sort.
 * @param {Object} sortConfig - The sort configuration object (e.g., { key: 'name', direction: 'asc' }).
 * @param {Function} customSortFunc - The custom keyword sorting function (e.g., customKeywordSort from helpers.js).
 * @returns {Array} The sorted list.
 */
function sortFlatDataList_internal(list, sortConfig, customSortFunc) {
    if (!list) return [];
    let sortedList = [...list]; // Operate on a copy

    if (sortConfig && sortConfig.key) {
        const { key: sortKey, direction } = sortConfig;
        // Ensure customSortFunc is actually a function before using it
        const effectiveCustomSort = typeof customSortFunc === 'function' ? customSortFunc : (a, b) => String(a || '').toLowerCase().localeCompare(String(b || '').toLowerCase());


        sortedList.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            let comparison = 0;

            if (sortKey === 'name' || sortKey === 'fullHierarchyPath' || sortKey === 'type') {
                comparison = effectiveCustomSort(valA, valB);
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = (valA || 0) - (valB || 0);
            } else {
                // Fallback for any other string types or mixed types
                comparison = String(valA || '').toLowerCase().localeCompare(String(valB || '').toLowerCase(), 'en-US');
            }
            return direction === 'desc' ? -comparison : comparison;
        });
    } else {
        // Default sort if no specific sortConfig is provided (e.g., by name ascending)
        // Ensure customSortFunc is callable here too
        const effectiveCustomSort = typeof customSortFunc === 'function' ? customSortFunc : (a, b) => String(a || '').toLowerCase().localeCompare(String(b || '').toLowerCase());
        sortedList.sort((a, b) => effectiveCustomSort(a.name, b.name));
    }
    return sortedList;
}

// Global exposure for this will be handled at the end of the file.
// Expose functions to window object
window.checkRangeSelectionFilter = checkRangeSelectionFilter_internal;
window.filterHierarchicalTreeRecursive = filterHierarchicalTreeRecursive; // This is the wrapper
window.filterFlatListByType = filterFlatListByType_internal; // Expose the internal version directly
window.sortFlatDataList = sortFlatDataList_internal; // Expose the internal version directly 

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 