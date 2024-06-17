import React, { useState } from 'react';
import './App.css';

function App() {
  const [projectName, setProjectName] = useState('');

  const handleInputChange = (event) => {
    setProjectName(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!projectName) {
      alert("Project name can't be empty!");
      return;
    }

    try {
      // Send a request to the build server to trigger the build process
      const response = await fetch('http://localhost:5000/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName }),
      });

      if (response.ok) {
        alert('Build triggered successfully!');
      } else {
        throw new Error('Build trigger failed.');
      }
    } catch (error) {
      console.error('Build trigger error:', error);
      alert('Build trigger failed.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Deploy to S3</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={projectName}
            onChange={handleInputChange}
            placeholder="Enter project name"
          />
          <button type="submit">Submit</button>
        </form>
      </header>
    </div>
  );
}

export default App;
