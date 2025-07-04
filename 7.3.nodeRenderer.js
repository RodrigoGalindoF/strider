// 3. Cluster Visualizer/7.3. nodeRenderer.js
// --------------------------------------------
// This file defines the `renderTaxonomyNode` function, which is responsible for
// rendering individual nodes in the Keyword Cluster Visualizer. It handles both
// hierarchical and flat (spreadsheet-style) view rendering logic.
//
// Function:
// - `renderTaxonomyNode`: The core rendering function. It takes a node object
//   and various context/props (level, view type, filter state, helper functions,
//   sub-components like KeywordListDisplay) to produce the React elements for that node.
//
//   Key rendering aspects:
//   - Hierarchical View: Displays nodes with indentation, an expansion toggle, title, type pill,
//     aggregated metrics, and conditionally, a list of keywords (for clusters) via `KeywordListDisplayComponent`.
//     It recursively calls itself for child nodes.
//   - Flat View: Renders nodes as rows in a table-like structure, displaying properties
//     like name/keyword, search volume, KD, CPC, full path, and type pill.
//
// Dependencies:
// - React library (specifically `React.createElement` and `React.Fragment`).
// - This function expects a `propsObject` containing many values and functions that
//   originate from `7. InteractiveDentalTaxonomy.js` and `2. helpers.js`, such as:
//   - `filters`: Current filter state (for `filters.nodeTypes`).
//   - `NodeType`: Node type constants.
//   - `expandedNodes`: Set of expanded node IDs.
//   - `toggleNode`: Callback to expand/collapse a node.
//   - `calculateDynamicNodeMetrics`: Function to get aggregated metrics.
//   - `formatNumber`, `formatDecimal`, `formatCurrency`: Formatting helpers.
//   - `getNodeTypePillStyles`: Helper for styling type pills.
//   - `KeywordListDisplayComponent`: The `KeywordListDisplay` React component itself.
//
// Connects to:
// - `7. InteractiveDentalTaxonomy.js`: This function is defined here but is intended to be
//   called by `InteractiveDentalTaxonomy` (specifically, it will be assigned to a variable
//   or ref within `InteractiveDentalTaxonomy` and then passed as the `renderNode` prop
//   to the `DataDisplayArea` component).
// - `6. DataDisplayArea.js`: Receives this function as the `renderNode` prop and calls it
//   to render each visible node.
// - `5. KeywordListDisplay.js`: Uses the `KeywordListDisplayComponent` passed in the props
//   to render lists of keywords for cluster nodes.
//
// Purpose:
// - To encapsulate the complex rendering logic for individual nodes, separating it from
//   the main application state and data flow management in `InteractiveDentalTaxonomy.js`.
// - To provide a flexible rendering mechanism that can adapt to different view modes
//   (hierarchical vs. flat) and node types.

function renderTaxonomyNode(node, level = 0, isFlatRender = false, propsObject, index = 0) {
    const {
        filters,
        NodeType,
        expandedNodes,
        toggleNode,
        calculateDynamicNodeMetrics, // This is the function from InteractiveDentalTaxonomy
        formatNumber,
        formatDecimal,
        formatCurrency,
        getNodeTypePillStyles, // This is the helper from 2.helpers.js
        KeywordListDisplayComponent, // This is the KeywordListDisplay component from 5.KeywordListDisplay.js
        getNodeTypeColor,
        showPathTooltip, // New: Destructure showPathTooltip
        hidePathTooltip  // New: Destructure hidePathTooltip
    } = propsObject;

    if (isFlatRender) {
        // console.log(`[renderTaxonomyNode FLAT RENDER] Node: ${node?.name}, Index: ${index}, Level: ${level}`);

        return React.createElement('div', {
            key: node.id,
            className: 'flat-view-row',
            // style attribute removed, grid columns now handled by CSS class .flat-view-row
        }, [
            // Keyword name cell
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-name'
            }, node.name),
            
            // Search volume cell
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-numeric',
                style: { textAlign: 'right' }
            }, node.searchVolume?.toLocaleString() || '-'),
            
            // Keyword difficulty cell
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-numeric',
                style: { textAlign: 'right' }
            }, node.keywordDifficulty ? `${node.keywordDifficulty.toFixed(1)}%` : '-'),
            
            // CPC cell
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-numeric',
                style: { textAlign: 'right' }
            }, node.cpc ? `$${node.cpc.toFixed(2)}` : '-'),
            
            // Full path cell - now shows an icon, custom tooltip on hover
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-path'
                // title attribute removed, custom tooltip will be used
            }, React.createElement('span', { 
                className: 'path-indicator-icon',
                onMouseEnter: (event) => showPathTooltip(node.fullHierarchyPath, event), // Added onMouseEnter
                onMouseLeave: () => hidePathTooltip() // Added onMouseLeave
            }, '…')), 
            
            // Type cell
            React.createElement('div', {
                className: 'flat-view-cell flat-view-cell-type'
            }, React.createElement('span', {
                className: 'flat-view-type-pill',
                style: {
                    backgroundColor: getNodeTypePillStyles(node.type).backgroundColor,
                    color: getNodeTypePillStyles(node.type).textColor
                }
            }, node.type))
        ]);
    }

    // ==== HIERARCHICAL RENDERING LOGIC ====
    const nodeId = `${node.type}-${node.name}-${level}`;
    const shouldRenderNodeVisuals = filters.nodeTypes[node.type];
    let keywordsToDisplay = [];
    let hasKeywordsToShow = false;

    if (node.type === NodeType.CLUSTER && filters.nodeTypes[NodeType.KEYWORDS] && Array.isArray(node.keywords)) {
        let tempKeywords = [...node.keywords];
        if (tempKeywords.length > 50) {
            const shuffled = tempKeywords.sort(() => 0.5 - Math.random());
            keywordsToDisplay = shuffled.slice(0, 50);
        } else {
            keywordsToDisplay = tempKeywords;
        }
        keywordsToDisplay.sort((a, b) => a.keyword.localeCompare(b.keyword));
        hasKeywordsToShow = keywordsToDisplay.length > 0;
    }

    const hasChildrenInFilteredTree = node.children && node.children.length > 0;
    const isNodeOverallExpandable = hasChildrenInFilteredTree || (node.type === NodeType.CLUSTER && hasKeywordsToShow);
    const isExpanded = expandedNodes.has(nodeId);

    const finalElementsToRender = [];

    if (shouldRenderNodeVisuals) {
        const metrics = calculateDynamicNodeMetrics(node); // This now calls the function passed in propsObject
        const nodeVisualBlockChildren = [];

        nodeVisualBlockChildren.push(
            React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    cursor: isNodeOverallExpandable ? 'pointer' : 'default'
                },
                onClick: () => isNodeOverallExpandable && toggleNode(nodeId)
            }, [
                isNodeOverallExpandable && React.createElement('span', {
                    style: {
                        fontSize: '20px',
                        color: '#6b7280',
                        transition: 'transform 0.2s ease-in-out',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                        lineHeight: '1'
                    }
                }, '❯'),
                React.createElement('h3', {
                    style: {
                        margin: '0',
                        color: '#111827',
                        fontSize: level === 0 ? '18px' : level === 1 ? '16px' : '15px',
                        fontWeight: '600',
                        flex: 1
                    }
                }, node.name),
                React.createElement('span', (() => {
                    const pillStyles = getNodeTypePillStyles(node.type);
                    return {
                        style: {
                            fontSize: '11px',
                            fontWeight: '500',
                            color: pillStyles.textColor,
                            backgroundColor: pillStyles.backgroundColor,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                        }
                    };
                })(), node.type)
            ])
        );

        nodeVisualBlockChildren.push(
            React.createElement('div', {
                style: {
                    marginBottom: '16px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px'
                }
            }, [
                React.createElement('div', { style: { backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px' } }, [
                    React.createElement('span', { style: { color: '#4b5563', fontSize: '12px', fontWeight: '500' } }, 'Search Volume: '),
                    React.createElement('span', { style: { color: '#111827', fontSize: '13px', fontWeight: '600' } }, formatNumber(metrics.totalSearchVolume))
                ]),
                React.createElement('div', { style: { backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px' } }, [
                    React.createElement('span', { style: { color: '#4b5563', fontSize: '12px', fontWeight: '500' } }, 'Average KD: '),
                    React.createElement('span', { style: { color: '#111827', fontSize: '13px', fontWeight: '600' } }, `${formatDecimal(metrics.averageKD)}%`)
                ]),
                React.createElement('div', { style: { backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px' } }, [
                    React.createElement('span', { style: { color: '#4b5563', fontSize: '12px', fontWeight: '500' } }, 'Total Keywords: '),
                    React.createElement('span', { style: { color: '#111827', fontSize: '13px', fontWeight: '600' } }, formatNumber(metrics.totalKeywords))
                ]),
                React.createElement('div', { style: { backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px' } }, [
                    React.createElement('span', { style: { color: '#4b5563', fontSize: '12px', fontWeight: '500' } }, 'Average CPC: '),
                    React.createElement('span', { style: { color: '#111827', fontSize: '13px', fontWeight: '600' } }, formatCurrency(metrics.averageCPC))
                ]),
                (metrics.totalClusters > 0) && React.createElement('div', { style: { backgroundColor: '#f9fafb', padding: '8px 12px', borderRadius: '6px' } }, [
                    React.createElement('span', { style: { color: '#4b5563', fontSize: '12px', fontWeight: '500' } }, 'Total Clusters: '),
                    React.createElement('span', { style: { color: '#111827', fontSize: '13px', fontWeight: '600' } }, formatNumber(metrics.totalClusters))
                ])
            ].filter(Boolean)
        ));

        if (node.type === NodeType.CLUSTER && isExpanded && hasKeywordsToShow) {
            nodeVisualBlockChildren.push(React.createElement(KeywordListDisplayComponent, {
                keywords: keywordsToDisplay,
                marginLeft: 0,
                isParentNodeVisible: true,
                formatNumber: formatNumber,
                formatDecimal: formatDecimal,
                formatCurrency: formatCurrency
            }));
        }

        if (isExpanded && hasChildrenInFilteredTree) {
            // Recursive call to render children, passing the same propsObject
            const childrenOutput = node.children.map(child => renderTaxonomyNode(child, level + 1, false, propsObject));
            nodeVisualBlockChildren.push(...childrenOutput.filter(el => el !== null));
        }

        finalElementsToRender.push(
            React.createElement('div', {
                key: nodeId,
                style: (() => {
                    // getNodeTypeColor is now directly available from propsObject
                    const nodeTypeColor = getNodeTypeColor(node.type);
                    return {
                        marginLeft: `${level * 25}px`,
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderLeft: `3px solid ${nodeTypeColor}`,
                        borderRadius: '10px',
                        marginBottom: '20px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
                    };
                })()
            },
                nodeVisualBlockChildren
            )
        );
    } else {
        // Node's own visuals are HIDDEN.
        // Render keywords if this is a (hidden) cluster, it's "expanded", and KEYWORDS type is selected.
        if (node.type === NodeType.CLUSTER && isExpanded && hasKeywordsToShow && filters.nodeTypes[NodeType.KEYWORDS]) {
            finalElementsToRender.push(React.createElement(KeywordListDisplayComponent, {
                key: `${nodeId}-keywords`, // Ensure unique key for this element
                keywords: keywordsToDisplay,
                marginLeft: level * 20,
                isParentNodeVisible: false,
                formatNumber: formatNumber,
                formatDecimal: formatDecimal,
                formatCurrency: formatCurrency
            }));
        }

        // Process children if they exist in the filtered tree.
        // If the current node is hidden, we recurse into its children regardless of its own 'isExpanded' state.
        // The children's rendering will then depend on their own visibility and expansion state.
        if (hasChildrenInFilteredTree) { // REMOVED isExpanded check here
            // Children of a hidden node should be rendered at the same visual indentation level.
            const childrenOutput = node.children.map(child => renderTaxonomyNode(child, level, false, propsObject)); // CHANGED level + 1 to level in previous step, remains level
            finalElementsToRender.push(...childrenOutput.filter(el => el !== null));
        } else if (!isFlatRender && hasChildrenInFilteredTree && !isExpanded) { // This else-if might become redundant or need adjustment
            // This log might need to be removed or rephrased as the primary condition above changed.
            // console.log(`[renderTaxonomyNode]     (Hidden ${node.name}) NOT processing children because it's NOT expanded.`);
            // For now, let's see the effect of the main change. We can refine logging later.
        }
    }

    if (finalElementsToRender.length === 0) return null;
    if (finalElementsToRender.length === 1 && !shouldRenderNodeVisuals) return finalElementsToRender[0];

    return React.createElement(React.Fragment, { key: `${nodeId}_wrapper` }, finalElementsToRender);
}

// Expose function to the global scope
window.renderTaxonomyNode = renderTaxonomyNode; 