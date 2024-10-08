import React, { useState } from 'react';
import './App.css';
import StorageAccountForm from './components/StorageAccount';
import VirtualMachineForm from './components/VirtualMachine'; // Add other forms as needed

function App() {
  const [formData, setFormData] = useState({
    resourceType: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleResourceTypeChange = (event) => {
    setFormData({
      ...formData,
      resourceType: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      resourceType: formData.resourceType, 
      parameters: { ...formData }
    };

    // Trigger Azure DevOps pipeline via REST API
    try {
      const response = await fetch('http://localhost:5000/api/trigger-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Pipeline triggered successfully');
      } else {
        alert('Failed to trigger pipeline');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error triggering pipeline');
    }
  };

  const renderForm = () => {
    switch (formData.resourceType) {
      case 'storageAccount':
        return <StorageAccountForm onChange={handleInputChange} />;
      case 'virtualMachine':
        return <VirtualMachineForm onChange={handleInputChange} />;
      // Add cases for other resource types here
      default:
        return <p>Select a resource type to see the form.</p>;
    }
  };

  return (
    <div className="App">
      <h1>Terraform Deployment Form</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Resource Type:</label>
          <select value={formData.resourceType} onChange={handleResourceTypeChange} required>
            <option value="">Select a resource type</option>
            <option value="virtualMachine">Virtual Machine</option>
            <option value="storageAccount">Storage Account</option>
            <option value="network">Network</option>
          </select>
        </div>
        {renderForm()}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;
