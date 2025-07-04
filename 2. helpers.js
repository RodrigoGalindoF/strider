// 3. Cluster Visualizer/2. helpers.js
// ------------------------------------
// This file contains various helper/utility functions used across the Keyword Cluster Visualizer application.
// These functions assist with tasks like:
// - Determining display colors and styles for different node types.
// - Formatting numerical data (numbers, decimals, currency) for presentation.
// - Providing a custom sorting logic for keyword strings.
//
// Dependencies:
// - `1. constants.js`: Specifically, `NodeType` is used by `getNodeTypeColor` and
//                      `getNodeTypePillStyles` to apply type-specific styling.
//
// Used by:
// - `5. KeywordListDisplay.js`: Uses `formatNumber`, `formatDecimal`, `formatCurrency`
//                               for displaying keyword metrics.
// - `6. DataDisplayArea.js`: Uses `customKeywordSort` indirectly via `InteractiveDentalTaxonomy`
//                            for sorting items in the flat view. (Correction: `createSortableHeader` is in DataDisplayArea itself,
//                            but the main sorting logic that uses `customKeywordSort` resides in `InteractiveDentalTaxonomy.js`).
// - `7. InteractiveDentalTaxonomy.js`: Uses `getNodeTypeColor`, `getNodeTypePillStyles`,
//                                      `formatNumber`, `formatDecimal`, `formatCurrency`, and
//                                      `customKeywordSort` for rendering nodes, displaying metrics,
//                                      and sorting data in both hierarchical and flat views.
//
// Purpose:
// - To encapsulate reusable logic for common tasks, promoting cleaner and more maintainable component code.
// - To ensure consistent data presentation and styling across the application.

// Define getNodeTypeColor function
function getNodeTypeColor(nodeType) {
    switch (nodeType) {
        case NodeType.PILLAR:   return '#3b82f6'; // Tailwind blue-500
        case NodeType.PARENT:   return '#22c55e'; // Tailwind green-500
        case NodeType.SUBTOPIC: return '#f59e0b'; // Tailwind amber-500
        case NodeType.CLUSTER:  return '#ef4444'; // Tailwind red-500
        default:                return '#6b7280'; // Default: Tailwind gray-500
    }
}

// Define getNodeTypePillStyles function
function getNodeTypePillStyles(nodeType) {
    switch (nodeType) {
        case NodeType.PILLAR:   return { backgroundColor: '#dbeafe', textColor: '#1d4ed8' }; // blue-100, blue-700
        case NodeType.PARENT:   return { backgroundColor: '#dcfce7', textColor: '#15803d' }; // green-100, green-700
        case NodeType.SUBTOPIC: return { backgroundColor: '#fef3c7', textColor: '#b45309' }; // amber-100, amber-700
        case NodeType.CLUSTER:  return { backgroundColor: '#fee2e2', textColor: '#b91c1c' }; // red-100, red-700
        default:                return { backgroundColor: '#f3f4f6', textColor: '#374151' }; // gray-100, gray-700
    }
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatDecimal(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatCurrency(num) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// NEW: Custom sort function for keywords
const customKeywordSort = (valA, valB) => {
    const strA = String(valA || '').trim();
    const strB = String(valB || '').trim();

    const getCategory = (s) => {
        if (/^[a-z]/i.test(s)) return 1; // Letters
        if (/^[0-9]/.test(s)) return 2; // Numbers
        return 3; // Symbols or anything else
    };

    const categoryA = getCategory(strA);
    const categoryB = getCategory(strB);

    if (categoryA !== categoryB) {
        return categoryA - categoryB; // Sort by category first (1 then 2 then 3)
    }

    // If in the same category, then sort alphabetically (case-insensitive) within that category
    return strA.toLowerCase().localeCompare(strB.toLowerCase(), 'en-US');
};

// Expose functions to the global scope
window.getNodeTypeColor = getNodeTypeColor;
window.getNodeTypePillStyles = getNodeTypePillStyles;
window.formatNumber = formatNumber;
window.formatDecimal = formatDecimal;
window.formatCurrency = formatCurrency;
window.customKeywordSort = customKeywordSort; 