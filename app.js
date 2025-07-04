// 3. Cluster Visualizer/app.js
// -----------------------------
// This file contains the primary initialization logic for the Keyword Cluster Visualizer application.
// Its main responsibility is to ensure that all external library dependencies (React, ReactDOM,
// Recharts, React-Dropzone) are loaded before attempting to render the main React application.
//
// Key Features:
// - Defines `window.initApp`, a globally accessible function that serves as the entry point
//   for starting the React application. This function is called by the script loading
//   mechanism in `main.html` once all CDN-hosted libraries are ready.
// - Performs checks to ensure React and ReactDOM are available before rendering.
// - Renders the main `InteractiveDentalTaxonomy` component into the HTML element with the ID 'root'.
// - Includes error handling to display a message in the DOM if the application fails to initialize.
//
// Dependencies:
// - `7. InteractiveDentalTaxonomy.js`: This file defines the main React component that `app.js` renders.
// - Relies on React and ReactDOM being loaded into the global scope (typically via CDN in `main.html`).
//
// Connects to:
// - `main.html`: The `window.initApp` function is called from a script in `main.html` after
//   dependent libraries (Recharts, React-Dropzone) are loaded.
// - `7. InteractiveDentalTaxonomy.js`: Instantiates and renders this component as the root of the application.
//
// Purpose:
// - To safely initialize and mount the React application after all prerequisites are met.
// - To provide a clear entry point for the application's JavaScript execution.
// - To offer basic error display if the core React rendering fails.

// Create initialization function that will be called once all scripts are loaded
window.initApp = function() {
    try {
        console.log('Initializing app with all dependencies loaded...');
        
        if (typeof React === 'undefined') {
            throw new Error('React is not loaded');
        }
        if (typeof ReactDOM === 'undefined') {
            throw new Error('ReactDOM is not loaded');
        }
        
        console.log('React and ReactDOM loaded successfully');
        
        // Render the app
        console.log('Rendering app...');
        ReactDOM.render(
            React.createElement(InteractiveDentalTaxonomy),
            document.getElementById('root')
        );
        console.log('App rendered successfully');
    } catch (error) {
        console.error('Error in script:', error);
        document.getElementById('root').innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h2>Error Loading Visualizer</h2>
                <p>${error.message}</p>
                <p>Please check the browser console for more details.</p>
                <p>This file can be opened directly in any browser without a server.</p>
            </div>
        `;
    }
}; 