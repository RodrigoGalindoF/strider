// 3. Cluster Visualizer/6. DataDisplayArea.js
// --------------------------------------------
// This file defines the `DataDisplayArea` React component.
// This is a major UI component responsible for rendering the actual visualization
// of the keyword taxonomy data. It adapts its display based on the current
// interaction mode (hierarchical or flat/spreadsheet view).
//
// Key Features:
// - Displays either hierarchical data (tree-like structure) or flat data (table/list).
// - Shows a "Current Mode" indicator.
// - Provides an "Expand/Collapse All" button for the hierarchical view.
// - Renders column headers for the flat view, which are sortable.
// - Handles the display of "Applying filters...", "Loading...", and error messages.
// - Shows a "No results match your filters" or "Please select a node type" message when applicable.
// - Implements pagination controls (Previous/Next buttons, page indicator) for the flat view.
// - Displays an overlay "Searching Keywords..." message during intensive search operations.
//
// Props:
// - `displayMode`: String ('hierarchical' or 'flat') indicating the current view.
// - `filters`: The current filter state, used to conditionally render messages (e.g., no results).
// - `searchTerm`: The current search term, used for displaying counts in flat view.
// - `getFilteredData`: Array of nodes for the hierarchical view (already filtered and structured).
// - `paginatedViewData`: Array of node items for the current page in flat view.
// - `currentPage`: Current page number for flat view pagination.
// - `ITEMS_PER_PAGE`: Number of items to display per page in flat view.
// - `setCurrentPage`: Callback function to update the current page.
// - `onToggleExpandAll`: Callback for the "Expand/Collapse All" button.
// - `expandedNodes`: A Set of expanded node IDs for the hierarchical view.
// - `renderNode`: The main rendering function (passed from `InteractiveDentalTaxonomy`)
//                 responsible for drawing individual nodes in both views.
// - `processingFilter`: Boolean indicating if filters are currently being applied.
// - `loading`: Boolean indicating if initial data is loading.
// - `error`: String containing an error message, if any.
// - `isSearching`: Boolean indicating if a keyword search is in progress.
// - `isFilterSectionManuallyCollapsed`: Boolean to control visibility of search overlay.
// - `sortConfig`: Array defining the current sort configuration for flat view.
// - `onSort`: Callback function to handle sorting in flat view.
// - `NodeType`: Constant object defining node types.
// - `totalFlatItemsCount`: Total number of items in the flat list before pagination.
// - `matchingFlatItemsCount`: Number of items matching current filters/search in flat view.
// - `showPathTooltip`: Callback function to handle showing the custom path tooltip.
// - `hidePathTooltip`: Callback function to handle hiding the custom path tooltip.
// - `baseRendererProps`: New prop to be merged with local tooltip handlers.
//
// Dependencies:
// - React library.
// - `NodeType` constant from `1. constants.js` (passed as a prop).
// - The `renderNode` function it receives as a prop is defined in `InteractiveDentalTaxonomy.js`
//   and uses helpers from `2. helpers.js` and the `KeywordListDisplay` component.
//
// Connects to:
// - `7. InteractiveDentalTaxonomy.js`: This component is instantiated and managed by
//   `InteractiveDentalTaxonomy`, which supplies all its data and callback props.
//
// Purpose:
// - To act as the main canvas for visualizing the keyword data in different formats.
// - To provide user controls for navigating and interacting with the displayed data
//   (pagination, expand/collapse).
// - To give feedback to the user about the state of data loading, filtering, and searching.

// NEW: DataDisplayArea Component
function DataDisplayArea({
    displayMode,
    filters, // Specifically filters.nodeTypes will be used
    searchTerm,
    getFilteredData, // Hierarchical data
    paginatedViewData, // Flat data for current page
    currentPage,
    ITEMS_PER_PAGE,
    setCurrentPage,
    onToggleExpandAll,
    expandedNodes,
    renderNode, // Will be further refactored, but passed for now
    baseRendererProps, // NEW PROP
    processingFilter,
    loading, // Main data loading state (for initial load)
    error, // Main data error state
    isSearching, // Keyword searching overlay
    isFilterSectionManuallyCollapsed, // For search overlay visibility
    sortConfig, // For flat view headers
    onSort, // For flat view headers
    NodeType,
    totalFlatItemsCount,
    matchingFlatItemsCount,
    // --- New props for tooltip handlers that will be passed from InteractiveDentalTaxonomy ---
    // These are being defined here, but InteractiveDentalTaxonomy will need to implement them
    // and pass them down if renderNode is to use them directly from its propsObject.
    // For now, we define them here and will adjust renderNode to call them.
    // This is a temporary setup for DataDisplayArea to manage its own tooltip state.
    // A more robust solution might involve a shared context or different component composition.
    showPathTooltip, 
    hidePathTooltip,
    propsObject
}) {
    const [activeTooltipInfo, setActiveTooltipInfo] = React.useState(null);

    const handleShowPathTooltip = React.useCallback((path, event) => {
        console.log('[DataDisplayArea] handleShowPathTooltip called. Path:', path);
        if (event && event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            console.log('[DataDisplayArea] Icon rect:', rect);
            setActiveTooltipInfo({
                path: path,
                top: rect.bottom + 5, // Position below the icon, relative to viewport
                left: rect.left + (rect.width / 2), // Center horizontally, relative to viewport
            });
        } else {
            console.warn('[DataDisplayArea] handleShowPathTooltip: Event or currentTarget missing');
        }
    }, []);

    const handleHidePathTooltip = React.useCallback(() => {
        console.log('[DataDisplayArea] handleHidePathTooltip called.');
        setActiveTooltipInfo(null);
    }, []);

    // Helper function to create sortable header cells (can be defined inside or outside)
    const createSortableHeader = (columnKey, defaultLabel, textAlign = 'left') => {
        const currentSortSetting = sortConfig.length > 0 && sortConfig[0].key === columnKey ? sortConfig[0] : null;
        let indicator = '';
        if (currentSortSetting) {
            indicator = currentSortSetting.direction === 'asc' ? ' ▲' : ' ▼';
        }
        // Ensure consistent casing for labels like 'Avg. KD'
        const label = (defaultLabel.startsWith('Avg.') || defaultLabel.startsWith('Full') || defaultLabel === 'Type' || defaultLabel === 'Keyword')
            ? defaultLabel
            : defaultLabel.charAt(0).toUpperCase() + defaultLabel.slice(1).toLowerCase();

        return React.createElement('span', {
            style: { textAlign: textAlign, cursor: 'pointer', userSelect: 'none', color: '#374151' },
            onClick: () => onSort(columnKey)
        }, label + indicator);
    };

    // *** NEW: Define getColumnHeaders function ***
    const getColumnHeaders = (nodeType, sortConfig, onSort) => {
        // Define headers based on the nodeType
        // Example: Customize columns for different node types
        let headers = [];
        if (nodeType === NodeType.KEYWORDS) {
            headers = [
                createSortableHeader('keyword', 'Keyword'),
                createSortableHeader('searchVolume', 'Search Volume', 'right'),
                createSortableHeader('keywordDifficulty', 'KD', 'right'),
                createSortableHeader('cpc', 'CPC', 'right'),
                createSortableHeader('type', 'Node Type', 'center'),
                createSortableHeader('fullHierarchyPath', 'Full Path', 'center')
            ];
        } else if (nodeType === NodeType.CLUSTER) {
             headers = [
                createSortableHeader('name', 'Cluster Name', 'left'),
                createSortableHeader('totalKeywords', 'Keywords #', 'right'),
                createSortableHeader('totalSearchVolume', 'Total Volume', 'right'),
                createSortableHeader('averageKD', 'Avg. KD', 'right'),
                createSortableHeader('averageCPC', 'Avg. CPC', 'right'),
                createSortableHeader('type', 'Node Type', 'center')
            ];
        } else { // Default for Pillar, Parent, Subtopic
            headers = [
                createSortableHeader('name', 'Name', 'left'),
                createSortableHeader('totalKeywords', 'Keywords #', 'right'),
                createSortableHeader('totalSearchVolume', 'Total Volume', 'right'),
                createSortableHeader('averageKD', 'Avg. KD', 'right'),
                createSortableHeader('averageCPC', 'Avg. CPC', 'right'),
                createSortableHeader('type', 'Node Type', 'center')
            ];
        }
        return headers;
    };

    // Determine selected node type for headers (ensure this logic is safe)
    const selectedNodeTypesArray = Object.entries(filters.nodeTypes)
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => type);
    const selectedNodeType = displayMode === 'flat' && selectedNodeTypesArray.length === 1 ? selectedNodeTypesArray[0] : null;

    // Props object to be passed to renderNode.
    // Ensure propsObject (from InteractiveDentalTaxonomy) is merged in.
    const finalNodeRendererProps = React.useMemo(() => ({
        ...propsObject,       // Include all props from InteractiveDentalTaxonomy, like getNodeTypePillStyles
        ...baseRendererProps, // Then merge/override with baseRendererProps (if it has other distinct props)
        // Finally, add/override with local handlers specific to DataDisplayArea for tooltips
        showPathTooltip: handleShowPathTooltip,
        hidePathTooltip: handleHidePathTooltip,
    }), [propsObject, baseRendererProps, handleShowPathTooltip, handleHidePathTooltip]); // Added propsObject to dependencies

    return React.createElement(React.Fragment, null, [
        // Main container for data visualization content
        React.createElement('div', {
            style: { marginTop: '20px' } 
        }, [
            // Global Metrics Summary Bar (Sticky)
            // ... existing code for metrics bar ...

            // --- RESTORED FLAT VIEW HEADER AND ROWS ---
            (displayMode === 'flat' && paginatedViewData && paginatedViewData.length > 0) &&
                React.createElement('div', { className: 'flat-view-container' }, [
                    React.createElement('div', {
                        className: 'flat-view-scroll-area',
                        style: { maxHeight: '60vh', overflowY: 'auto', overflowX: 'auto' }
                    }, [
                        React.createElement('div', {
                            className: 'flat-view-column-headers',
                            style: { position: 'sticky', top: 0, zIndex: 2 }
                        },
                            getColumnHeaders(selectedNodeType, sortConfig, onSort).map((header, idx) => {
                                // If this is the first header and it's a name/keyword/cluster name column, add the left-align class
                                if (idx === 0 && (['Keyword', 'Name', 'Cluster Name'].includes(header.props?.children?.replace(/ ▲| ▼/, '')))) {
                                    return React.createElement('span', { className: 'flat-view-header-cell-name', key: idx }, header);
                                }
                                return React.cloneElement(header, { key: idx });
                            })
                        ),
                        paginatedViewData.map((node, index) => renderNode(node, 0, true, finalNodeRendererProps, index))
                    ])
                ]),

            // Content section with responsive table
            ((displayMode === 'hierarchical' && getFilteredData && getFilteredData.length > 0) ||
              (displayMode === 'flat' && (!paginatedViewData || paginatedViewData.length === 0))) &&
                React.createElement('div', {
                     className: 'flat-view-content-area'
                }, [
                    processingFilter ? 
                        React.createElement('div', { 
                            style: { 
                                textAlign: 'center',
                                padding: '50px 20px',
                                fontSize: '16px',
                                color: '#666',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '6px',
                                margin: '20px 0'
                            }
                        }, 'Applying filters, please wait...') :
                    React.createElement(React.Fragment, null, 
                        displayMode === 'hierarchical' && getFilteredData && getFilteredData.length > 0 ? 
                            getFilteredData.map(node => renderNode(node, 0, false, finalNodeRendererProps)) :
                        displayMode === 'flat' && (!paginatedViewData || paginatedViewData.length === 0) ?
                            React.createElement('div', { 
                                style: { 
                                    textAlign: 'center',
                                    padding: '30px',
                                    color: '#666'
                                }
                            }, 
                                Object.values(filters.nodeTypes).some(v => v) ?
                                    'No results match your filters. Please adjust your filter settings.' :
                                    'Please select at least one node type to display results.'
                            ) : null
                    )
                ]),

            // Pagination controls with responsive styling
            displayMode === 'flat' && matchingFlatItemsCount > ITEMS_PER_PAGE && React.createElement('div', {
                className: 'pagination-controls'
            }, [
                React.createElement('button', {
                    className: 'pagination-btn',
                    onClick: () => setCurrentPage(prevPage => Math.max(1, prevPage - 1)),
                    disabled: currentPage === 1
                }, 'Previous'),
                React.createElement('span', {
                    className: 'pagination-page-indicator'
                }, `Page ${currentPage} of ${Math.max(1, Math.ceil(matchingFlatItemsCount / ITEMS_PER_PAGE))}`),
                React.createElement('button', {
                    className: 'pagination-btn',
                    onClick: () => setCurrentPage(prevPage => Math.min(Math.ceil(matchingFlatItemsCount / ITEMS_PER_PAGE), prevPage + 1)),
                    disabled: currentPage >= Math.ceil(matchingFlatItemsCount / ITEMS_PER_PAGE)
                }, 'Next')
            ])
        ]), // End of the main data visualization content div

        // Loading and Error messages (now part of DataDisplayArea)
        loading && React.createElement('div', { className: 'loading' }, 'Loading...'), // Main initial loading
        error && React.createElement('div', { className: 'error' }, error),

        // Keyword searching overlay (now part of DataDisplayArea)
        (isSearching && !isFilterSectionManuallyCollapsed) && React.createElement('div', {
            style: {
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }
        }, [
            React.createElement('div', {
                style: { padding: '20px 30px', backgroundColor: 'white', borderRadius: '8px',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center' }
            }, [
                React.createElement('div', { style: { fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: '#2c699a'} }, 
                    'Searching Keywords'
                ),
                React.createElement('div', { style: { fontSize: '14px', color: '#666'} }, 
                    'Searching across all keywords. Please wait...'
                )
            ])
        ]),

        // Custom Path Tooltip
        activeTooltipInfo && React.createElement('div', {
            className: `custom-path-tooltip ${activeTooltipInfo ? 'visible' : ''}`,
            style: {
                top: `${activeTooltipInfo.top}px`,
                left: `${activeTooltipInfo.left}px`
            }
        }, activeTooltipInfo.path)
    ]);
}
// TODO: Add PropTypes for DataDisplayArea 