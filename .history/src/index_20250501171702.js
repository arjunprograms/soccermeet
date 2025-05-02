import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Extremely simple app that doesn't depend on Firebase
const SimpleApp = () => {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>SoccerMeet</h1>
      <p>Basic React rendering is working</p>
      <p>If you can see this, the problem is not with React itself</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  console.log("Rendering app...");
  root.render(
    <React.StrictMode>
      <SimpleApp />
    </React.StrictMode>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h1>Error</h1>
      <p>There was a problem rendering the app: ${error.message}</p>
    </div>
  `;
}