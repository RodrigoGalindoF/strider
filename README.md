# Keyword Cluster Visualizer

A powerful, interactive web application for visualizing and analyzing keyword taxonomy data. This tool provides both hierarchical and flat view modes for exploring keyword clusters with advanced filtering and search capabilities.

## Features

### 🎯 Core Functionality
- **Dual View Modes**: Hierarchical tree view and flat spreadsheet view
- **Advanced Filtering**: Filter by node types, search volume, keyword difficulty, and CPC ranges
- **Real-time Search**: Search across keywords with support for exact matches and multiple terms
- **Keyword Exclusion**: Exclude specific keywords from search results
- **Dynamic Metrics**: Real-time calculation of aggregated metrics (search volume, average KD, CPC)
- **CSV Export**: Export filtered data to CSV format
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📊 Data Visualization
- **Hierarchical View**: Tree-like structure showing parent-child relationships
- **Flat View**: Spreadsheet-style table with sortable columns
- **Type-based Styling**: Color-coded nodes by type (Pillar, Parent, Subtopic, Cluster, Keywords)
- **Interactive Expansion**: Click to expand/collapse nodes
- **Pagination**: Navigate through large datasets efficiently

### 🔍 Search & Filter Capabilities
- **Multi-term Search**: Use commas to search for multiple terms
- **Exact Match**: Use quotes for exact keyword matching
- **Exclusion System**: Exclude specific keywords from results
- **Range Filters**: Custom numeric ranges for search volume, difficulty, and CPC
- **Pillar Topic Filter**: Filter by specific pillar topics

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/keyword-cluster-visualizer.git
   cd keyword-cluster-visualizer
   ```

2. **Open the application**:
   - Simply open `index.html` in your web browser
   - Or serve it using a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```

3. **Load your data**:
   - The application will automatically load sample data from GitHub
   - You can also upload your own JSON file with the same structure

## Data Format

The application expects JSON data in the following format:

```json
{
  "data": [
    {
      "name": "Pillar Topic Name",
      "type": "pillar",
      "size": 1000,
      "averageKD": 45.5,
      "averageCPC": 2.50,
      "children": [
        {
          "name": "Parent Topic",
          "type": "parent",
          "size": 500,
          "children": [
            {
              "name": "Cluster Name",
              "type": "cluster",
              "size": 200,
              "keywords": [
                {
                  "keyword": "example keyword",
                  "searchVolume": 1000,
                  "keywordDifficulty": 45.5,
                  "cpc": 2.50
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Usage

### Basic Navigation
1. **View Modes**: Toggle between hierarchical and flat views by selecting different node types
2. **Search**: Use the search bar to find specific keywords or topics
3. **Filters**: Use the sidebar filters to narrow down results by various criteria
4. **Export**: Click the "Export CSV" button to download filtered data

### Advanced Features
- **Exact Search**: Wrap terms in quotes for exact matching
- **Multiple Terms**: Separate search terms with commas
- **Keyword Exclusion**: Click the "Exclude" button to remove terms from results
- **Custom Ranges**: Use the "Custom range" option in filters for specific numeric ranges

## Project Structure

```
├── index.html                 # Main HTML file
├── styles.css                 # CSS styles
├── app.js                     # Application initialization
├── 1. constants.js           # Application constants and sample data
├── 2. helpers.js             # Utility functions
├── 3. FilterControls.js      # Filter controls component
├── 5. KeywordListDisplay.js  # Keyword list display component
├── 6. DataDisplayArea.js     # Main data display component
├── 7. InteractiveDentalTaxonomy.js # Main application component
├── 7.1.dataProcessingUtils.js # Data processing utilities
├── 7.2.filterSortUtils.js    # Filtering and sorting utilities
├── 7.3.nodeRenderer.js       # Node rendering logic
├── 7.4.csvExportUtils.js     # CSV export utilities
├── 8. searchLogic.js         # Search logic and excluded keywords
└── package.json              # Project dependencies
```

## Technologies Used

- **React 17**: UI framework
- **Vanilla JavaScript**: Core functionality
- **CSS3**: Styling and responsive design
- **HTML5**: Structure
- **ECharts**: Data visualization (if needed)
- **React-Dropzone**: File upload functionality

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure your data format matches the expected structure
3. Try refreshing the page if the application doesn't load properly

## Data Source

The application automatically loads sample data from a public GitHub repository. You can replace this with your own data by uploading a JSON file with the same structure. 