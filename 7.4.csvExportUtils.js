// 3. Cluster Visualizer/7.4.csvExportUtils.js
// --------------------------------------------
// This file contains utility functions for exporting data to CSV format.
// It handles the conversion of node data to CSV format and triggers the download.

// Convert a node object to a flat structure with all available data
function flattenNodeData(node) {
    const flatData = {
        'Keyword': node.name || '',
        'Search Volume': node.searchVolume || '',
        'Keyword Difficulty': node.keywordDifficulty || '',
        'CPC (USD)': node.cpc || ''
    };

    // Add keyword-specific fields if present
    if (node.type === 'KEYWORDS' && node.keyword) {
        flatData['Keyword'] = node.keyword;
    }

    // Add cluster-specific fields if present
    if (node.type === 'CLUSTER' && Array.isArray(node.keywords)) {
        flatData['Keyword Count'] = node.keywords.length;
        flatData['Keywords'] = node.keywords.map(k => k.keyword).join('; ');
    }

    return flatData;
}

// Convert data to CSV format
function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    // Get headers from the first item
    const headers = Object.keys(flattenNodeData(data[0]));
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    data.forEach(item => {
        const flatItem = flattenNodeData(item);
        const row = headers.map(header => {
            const value = flatItem[header];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

// Trigger CSV download
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Main export function
function exportToCSV(data, nodeType, pillarTopic) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const csvContent = convertToCSV(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Use the passed pillar topic
    const filename = `${nodeType}_${pillarTopic}_seodude.io_export.csv`;
    
    downloadCSV(csvContent, filename);
}

// Export the functions
window.csvExportUtils = {
    exportToCSV,
    flattenNodeData,
    convertToCSV
}; 