// 3. Cluster Visualizer/1. constants.js
// --------------------------------------
// This file defines various constants used throughout the Keyword Cluster Visualizer application.
// It centralizes data like sample datasets, node type definitions, predefined filter ranges
// for metrics (Search Volume, Keyword Difficulty, CPC), and the initial state for all filters.
//
// Dependencies:
// - None directly, but these constants are imported and used by virtually all other
//   JavaScript files in this application, particularly by:
//   - `2. helpers.js`: Uses NodeType for styling functions.
//   - `3. FilterControls.js`: Uses NodeType, filter range constants (SEARCH_VOLUME_RANGES, etc.)
//                           to populate dropdowns and define filter behavior.
//   - `7. InteractiveDentalTaxonomy.js`: Uses SAMPLE_DATA for the "Load Sample Data" feature,
//                                      NodeType for data processing and rendering logic,
//                                      INITIAL_FILTERS_STATE to set the default filter values,
//                                      and filter range constants for data filtering logic.
//
// Purpose:
// - To provide a single source of truth for static data and configurations.
// - To make the application easier to maintain and update by centralizing these values.
// - To ensure consistency in how these values are used across different components.

const SAMPLE_DATA = [
    {
        name: "1. Dental Health Fundamentals",
        children: [
            { name: "General Oral Health Information", size: 800 },
            { name: "Preventative Care & Hygiene", size: 800 },
            { name: "Oral Anatomy & Development", size: 600 },
            { name: "Common Dental Problems", size: 700 },
            { name: "Nutrition & Oral Health", size: 500 }
        ]
    },
    {
        name: "2. Dental Treatments & Procedures",
        children: [
            {
                name: "Diagnostic Procedures",
                children: [
                    { name: "Dental X-ray", size: 300 },
                    { name: "Dental CT Scan", size: 300 }
                ]
            },
            {
                name: "Restorative Treatments",
                children: [
                    { name: "Dental Crowns", size: 300 },
                    { name: "Crown over Implant", size: 300 }
                ]
            }
        ]
    }
];

// Define NodeType outside of any component
const NodeType = {
    PILLAR: 'pillar',
    PARENT: 'parent',
    SUBTOPIC: 'subtopic',
    CLUSTER: 'cluster',
    KEYWORDS: 'keywords'
};

// Define ranges for filters
const SEARCH_VOLUME_RANGES = {
    'any': { label: 'Any', min: null, max: null },
    '1-10': { label: '1–10', min: 1, max: 10 },
    '11-100': { label: '11–100', min: 11, max: 100 },
    '101-1000': { label: '101–1,000', min: 101, max: 1000 },
    '1001-10000': { label: '1,001–10,000', min: 1001, max: 10000 },
    '10001-100000': { label: '10,001–100,000', min: 10001, max: 100000 },
    '100001+': { label: '100,001+', min: 100001, max: null },
    'custom': { label: 'Custom range', min: null, max: null } // For custom input
};

const KEYWORD_DIFFICULTY_RANGES = {
    'any': { label: 'Any', min: null, max: null },
    '0-14': { label: 'Very easy (0–14%)', min: 0, max: 14 },
    '15-29': { label: 'Easy (15–29%)', min: 15, max: 29 },
    '30-49': { label: 'Possible (30–49%)', min: 30, max: 49 },
    '50-69': { label: 'Difficult (50–69%)', min: 50, max: 69 },
    '70-84': { label: 'Hard (70–84%)', min: 70, max: 84 },
    '85-100': { label: 'Very hard (85–100%)', min: 85, max: 100 },
    'custom': { label: 'Custom range', min: null, max: null } // For custom input
};

const CPC_RANGES = { // Example ranges, adjust as needed
    'any': { label: 'Any', min: null, max: null },
    '0.01-0.50': { label: '$0.01 – $0.50', min: 0.01, max: 0.50 },
    '0.51-1.00': { label: '$0.51 – $1.00', min: 0.51, max: 1.00 },
    '1.01-2.00': { label: '$1.01 – $2.00', min: 1.01, max: 2.00 },
    '2.01-5.00': { label: '$2.01 – $5.00', min: 2.01, max: 5.00 },
    '5.01+': { label: '$5.01+', min: 5.01, max: null },
    'custom': { label: 'Custom range', min: null, max: null } // For custom input
};

const INITIAL_FILTERS_STATE = {
    nodeTypes: {
        [NodeType.PILLAR]: true,
        [NodeType.PARENT]: true,
        [NodeType.SUBTOPIC]: true,
        [NodeType.CLUSTER]: true,
        [NodeType.KEYWORDS]: true,
    },
    pillarTopic: { currentSelection: 'all' }, // NEW: Pillar Topic filter
    searchVolume: { currentSelection: 'any', customMin: '', customMax: '' },
    keywordDifficulty: { currentSelection: 'any', customMin: '', customMax: '' },
    averageCPC: { currentSelection: 'any', customMin: '', customMax: '' },
}; 