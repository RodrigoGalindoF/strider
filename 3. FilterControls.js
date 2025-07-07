// 3. Cluster Visualizer/3. FilterControls.js
// -------------------------------------------
// This file defines the `FilterControls` React component.
// This component is responsible for rendering the entire interactive filter bar
// at the top of the visualizer. It includes:
// - A text input for searching nodes by name or metadata.
// - Toggle buttons for filtering by different node types (Pillar, Parent, Subtopic, Cluster, Keywords).
// - A dropdown to filter by a specific Pillar Topic.
// - Dropdowns and custom range inputs for filtering by Search Volume, Keyword Difficulty, and Average CPC.
// - Buttons to "Show/Hide Filters" and "Reset All Filters".
//
// Props:
// - `filters`: An object containing the current state of all filters.
// - `searchTerm`: The current string value in the search input.
// - `onSearchChange`: Callback function to handle changes in the search input.
// - `onNodeTypeFilterChange`: Callback function to handle toggling of node type filters.
// - `pillarTopicOptions`: An array of options for the Pillar Topic dropdown.
// - `onDropdownChange`: Callback function for changes in dropdown filter selections (Pillar, SV, KD, CPC ranges).
// - `onCustomInputChange`: Callback for changes in custom numeric range inputs.
// - `onApplyCustomRange`: Callback when the "Apply" button for a custom range is clicked.
// - `onToggleFilterSection`: Callback to show or hide the main filter controls section.
// - `isFilterSectionManuallyCollapsed`: Boolean indicating if the filter section is currently hidden.
// - `onResetAllFilters`: Callback to reset all filters to their initial state.
// - `SEARCH_VOLUME_RANGES`, `KEYWORD_DIFFICULTY_RANGES`, `CPC_RANGES`: Constants for predefined filter ranges.
// - `NodeType`: Constant object defining node types.
// - `excludedKeywords`: An array of excluded keywords.
// - `onAddExcludedKeyword`: Callback to add an excluded keyword.
// - `onRemoveExcludedKeyword`: Callback to remove an excluded keyword.
// - `onAddMultipleExcludedKeywords`: Callback to add multiple excluded keywords.
//
// Dependencies:
// - React library for creating the component.
// - Constants from `1. constants.js` (`NodeType`, `SEARCH_VOLUME_RANGES`, etc.) are passed as props
//   from the parent component (`InteractiveDentalTaxonomy.js`).
//
// Connects to:
// - `7. InteractiveDentalTaxonomy.js`: This component is instantiated and managed by
//   `InteractiveDentalTaxonomy`, which provides its props and handles the state updates
//   triggered by user interactions within the filter controls.
//
// Purpose:
// - To provide a user-friendly interface for filtering and searching the keyword taxonomy data.
// - To encapsulate all filter-related UI and interaction logic in a dedicated component.

// NEW: FilterControls Component
function FilterControls({
    filters,
    onNodeTypeFilterChange,
    pillarTopicOptions,
    onDropdownChange,
    onCustomInputChange,
    onApplyCustomRange,
    onToggleFilterSection,
    isFilterSectionManuallyCollapsed,
    onResetAllFilters,
    SEARCH_VOLUME_RANGES,
    KEYWORD_DIFFICULTY_RANGES,
    CPC_RANGES,
    NodeType
}) {
    const [isNodeTypesDropdownOpen, setIsNodeTypesDropdownOpen] = React.useState(false);
    const nodeTypesDropdownRef = React.useRef(null);
    const nodeTypesButtonRef = React.useRef(null);

    React.useEffect(() => {
        if (!isNodeTypesDropdownOpen) return;
        // Use pointerdown for better compatibility (covers touch and mouse)
        function handleClickOutside(event) {
            // Debug log to verify handler is firing
            console.log('Pointer event for outside click detected:', event.target);
            if (
                nodeTypesDropdownRef.current &&
                !nodeTypesDropdownRef.current.contains(event.target) &&
                nodeTypesButtonRef.current &&
                !nodeTypesButtonRef.current.contains(event.target)
            ) {
                setIsNodeTypesDropdownOpen(false);
            }
        }
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [isNodeTypesDropdownOpen]);

    return React.createElement('div', { className: 'filter-controls' }, [
        React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }
        }, [
            React.createElement('h2', {
                style: {
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                }
            }, 'Filters'),
            React.createElement('button', {
                onClick: onResetAllFilters,
                style: {
                    padding: '6px 12px',
                    fontSize: '13px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#4b5563'
                }
            }, 'Reset All')
        ]),
        // Filters Grid - Airbnb-style layout
        !isFilterSectionManuallyCollapsed && React.createElement(React.Fragment, null, [
            // Filters Grid - Airbnb-style layout
            React.createElement('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px',
                    alignItems: 'start'
                }
            }, [
                // Node Types Filter
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }
                }, [
                    React.createElement('span', { 
                        style: { 
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }
                    }, 'Node Types'),
                    React.createElement('div', {
                        style: {
                            position: 'relative'
                        }
                    }, [
                        React.createElement('button', {
                            ref: nodeTypesButtonRef,
                            onClick: () => setIsNodeTypesDropdownOpen((open) => !open),
                            style: {
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease'
                            }
                        }, [
                            React.createElement('span', null, 
                                Object.values(filters.nodeTypes).filter(Boolean).length 
                                    ? `${Object.values(filters.nodeTypes).filter(Boolean).length} selected`
                                    : 'Select types'
                            ),
                            React.createElement('span', { style: { color: '#6b7280' } }, '▼')
                        ]),
                        isNodeTypesDropdownOpen && React.createElement('div', {
                            ref: nodeTypesDropdownRef,
                            style: {
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                zIndex: 1000,
                                marginTop: '4px',
                                padding: '8px 0'
                            }
                        }, 
                            Object.keys(filters.nodeTypes).map(type => 
                                React.createElement('div', {
                                    key: type,
                                    onClick: () => {
                                        onNodeTypeFilterChange(type);
                                    },
                                    style: {
                                        padding: '10px 12px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        backgroundColor: filters.nodeTypes[type] ? '#f3f4f6' : 'transparent',
                                        transition: 'background-color 0.15s ease'
                                    }
                                }, [
                                    React.createElement('div', {
                                        style: {
                                            width: '18px',
                                            height: '18px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: filters.nodeTypes[type] ? '#2563eb' : 'transparent',
                                            borderColor: filters.nodeTypes[type] ? '#2563eb' : '#d1d5db',
                                            transition: 'all 0.15s ease'
                                        }
                                    }, filters.nodeTypes[type] && React.createElement('span', {
                                        style: {
                                            color: '#ffffff',
                                            fontSize: '12px'
                                        }
                                    }, '✓')),
                                    React.createElement('span', null, type.charAt(0).toUpperCase() + type.slice(1))
                                ])
                            )
                        )
                    ])
                ]),

                // Pillar Topic Filter
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }
                }, [
                    React.createElement('span', { 
                        style: { 
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }
                    }, 'Pillar Topic'),
                    React.createElement('select', {
                        value: filters.pillarTopic.currentSelection,
                        onChange: (e) => onDropdownChange('pillarTopic', e.target.value),
                        style: { 
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#ffffff',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.75rem center',
                            backgroundSize: '1em',
                            cursor: 'pointer'
                        }
                    },
                        pillarTopicOptions.map(option => 
                            React.createElement('option', { key: option.value, value: option.value }, option.label)
                        )
                    )
                ]),

                // Search Volume Filter with Custom Range
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }
                }, [
                    React.createElement('span', { 
                        style: { 
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }
                    }, 'Search Volume'),
                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }
                    }, [
                        React.createElement('select', {
                            value: filters.searchVolume.currentSelection,
                            onChange: (e) => onDropdownChange('searchVolume', e.target.value),
                            style: { 
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1em',
                                cursor: 'pointer'
                            }
                        },
                            Object.entries(SEARCH_VOLUME_RANGES).map(([key, range]) =>
                                React.createElement('option', { key, value: key }, range.label)
                            )
                        ),
                        filters.searchVolume.currentSelection === 'custom' && React.createElement('div', {
                            style: {
                                display: 'flex',
                                gap: '8px',
                                padding: '8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                width: '100%',
                                boxSizing: 'border-box'
                            }
                        }, [
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'From',
                                value: filters.searchVolume.customMin,
                                onChange: (e) => onCustomInputChange('searchVolume', 'customMin', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'To',
                                value: filters.searchVolume.customMax,
                                onChange: (e) => onCustomInputChange('searchVolume', 'customMax', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('button', {
                                onClick: () => onApplyCustomRange('searchVolume'),
                                style: {
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #2563eb',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                }
                            }, 'Apply')
                        ])
                    ])
                ]),

                // Keyword Difficulty Filter with Custom Range
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }
                }, [
                    React.createElement('span', { 
                        style: { 
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }
                    }, 'Keyword Difficulty'),
                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }
                    }, [
                        React.createElement('select', {
                            value: filters.keywordDifficulty.currentSelection,
                            onChange: (e) => onDropdownChange('keywordDifficulty', e.target.value),
                            style: { 
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1em',
                                cursor: 'pointer'
                            }
                        },
                            Object.entries(KEYWORD_DIFFICULTY_RANGES).map(([key, range]) =>
                                React.createElement('option', { key, value: key }, range.label)
                            )
                        ),
                        filters.keywordDifficulty.currentSelection === 'custom' && React.createElement('div', {
                            style: {
                                display: 'flex',
                                gap: '8px',
                                padding: '8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                width: '100%',
                                boxSizing: 'border-box'
                            }
                        }, [
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'From',
                                value: filters.keywordDifficulty.customMin,
                                onChange: (e) => onCustomInputChange('keywordDifficulty', 'customMin', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'To',
                                value: filters.keywordDifficulty.customMax,
                                onChange: (e) => onCustomInputChange('keywordDifficulty', 'customMax', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('button', {
                                onClick: () => onApplyCustomRange('keywordDifficulty'),
                                style: {
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #2563eb',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                }
                            }, 'Apply')
                        ])
                    ])
                ]),

                // Average CPC Filter with Custom Range
                React.createElement('div', { 
                    style: { 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }
                }, [
                    React.createElement('span', { 
                        style: { 
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                        }
                    }, 'Average CPC'),
                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }
                    }, [
                        React.createElement('select', {
                            value: filters.averageCPC.currentSelection,
                            onChange: (e) => onDropdownChange('averageCPC', e.target.value),
                            style: { 
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1em',
                                cursor: 'pointer'
                            }
                        },
                            Object.entries(CPC_RANGES).map(([key, range]) =>
                                React.createElement('option', { key, value: key }, range.label)
                            )
                        ),
                        filters.averageCPC.currentSelection === 'custom' && React.createElement('div', {
                            style: {
                                display: 'flex',
                                gap: '8px',
                                padding: '8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                width: '100%',
                                boxSizing: 'border-box'
                            }
                        }, [
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'From',
                                value: filters.averageCPC.customMin,
                                onChange: (e) => onCustomInputChange('averageCPC', 'customMin', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('input', {
                                type: 'number',
                                placeholder: 'To',
                                value: filters.averageCPC.customMax,
                                onChange: (e) => onCustomInputChange('averageCPC', 'customMax', e.target.value),
                                style: {
                                    flex: 1,
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    minWidth: '0'
                                }
                            }),
                            React.createElement('button', {
                                onClick: () => onApplyCustomRange('averageCPC'),
                                style: {
                                    padding: '6px 12px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #2563eb',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                }
                            }, 'Apply')
                        ])
                    ])
                ])
            ])
        ])
    ]);
}
// PropTypes for FilterControls can be added here if desired. 