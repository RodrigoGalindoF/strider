// 3. Cluster Visualizer/5. KeywordListDisplay.js
// -----------------------------------------------
// This file defines the `KeywordListDisplay` React component.
// This component is responsible for rendering a list of keywords, typically
// associated with a 'Cluster' node in the hierarchical view. It displays
// each keyword along with its metrics (Search Volume, Keyword Difficulty, CPC).
//
// Props:
// - `keywords`: An array of keyword objects to display. Each object should have
//               `keyword`, `searchVolume`, `keywordDifficulty`, and `cpc` properties.
// - `marginLeft` (optional, default: 0): Number for left margin, used for indentation.
// - `isParentNodeVisible` (optional, default: true): Boolean indicating if the parent node
//                                                 (the cluster itself) is visually rendered.
//                                                 This affects styling (e.g., top margin, background).
// - `formatNumber`, `formatDecimal`, `formatCurrency`: Helper functions passed from the parent
//                                                    to ensure consistent formatting of metrics.
//
// Dependencies:
// - React library for creating the component.
// - Helper functions (`formatNumber`, `formatDecimal`, `formatCurrency`) from `2. helpers.js`,
//   which are passed as props from `InteractiveDentalTaxonomy.js`.
//
// Connects to:
// - `7. InteractiveDentalTaxonomy.js`: This component is instantiated within the `renderNode`
//   function of `InteractiveDentalTaxonomy` when rendering an expanded 'Cluster' node that
//   has keywords to display (and the 'Keywords' node type filter is active).
//
// Purpose:
// - To provide a structured and readable display of keywords and their associated metrics
//   within a cluster.
// - To allow for conditional styling based on whether its containing cluster node is visible.

// NEW: KeywordListDisplay Component
function KeywordListDisplay({
    keywords,
    marginLeft = 0,
    isParentNodeVisible = true,
    formatNumber, // Prop for helper function
    formatDecimal, // Prop for helper function
    formatCurrency // Prop for helper function
}) {
    if (!keywords || keywords.length === 0) return null;

    const style = {
        marginTop: isParentNodeVisible ? '20px' : '10px',
        fontSize: '13px',
        color: '#666',
        paddingBottom: '10px',
        marginLeft: `${marginLeft}px`
    };
    if (!isParentNodeVisible) {
        style.padding = '15px'; 
        style.backgroundColor = '#f9fafb';
        style.borderRadius = '8px';
        style.border = '1px solid #e5e7eb';
    }

    return React.createElement('div', { style: style }, [
        React.createElement('div', { 
            style: { 
                fontSize: '14px',
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e5e7eb'
            } 
        }, 'Keywords'),
        React.createElement('div', { 
            style: { 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '10px'
            } 
        }, 
            keywords.map(kw =>
                React.createElement('div', { 
                    key: kw.keyword, // Assuming kw.keyword is unique enough for this context
                    style: { 
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }
                }, [
                    React.createElement('div', { 
                        style: { 
                            color: '#1f2937',
                            fontWeight: '500',
                            fontSize: '13px',
                            marginBottom: '6px'
                        } 
                    }, kw.keyword),
                    React.createElement('div', { 
                        style: { 
                            fontSize: '11px',
                            color: '#6b7280'
                        } 
                    }, [
                        `Search Volume: ${formatNumber(kw.searchVolume)}`,
                        ` • KD: ${formatDecimal(kw.keywordDifficulty)}`,
                        ` • CPC: ${formatCurrency(kw.cpc)}`
                    ])
                ])
            )
        )
    ]);
}
// TODO: Add PropTypes for KeywordListDisplay 