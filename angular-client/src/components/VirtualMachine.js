import React, { useState } from 'react';

function TerraformForm() {
  const [formData, setFormData] = useState({
    storage_account_name: '',
    location: '',
    environment: '',
    security_level: '',
    business_unit: '',
    storage_type: '',
    enable_advanced_threat_protection: false,
    min_tls_versionallow_blob_public_access: '',
    containers_list: '',
    lifecycles: '',
    pe_resource_name: '',
    // Add more fields as needed
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert formData to JSON and send it to your API
    const response = await fetch('http://localhost:5000/api/trigger-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      alert('Pipeline triggered successfully!');
    } else {
      alert('Failed to trigger pipeline');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="storage_account_name" onChange={handleChange} placeholder="Storage Account Name" />
      <input type="text" name="location" onChange={handleChange} placeholder="Location" />
      <input type="text" name="environment" onChange={handleChange} placeholder="Environment" />
      <input type="text" name="security_level" onChange={handleChange} placeholder="Security Level" />
      <input type="text" name="business_unit" onChange={handleChange} placeholder="Business Unit" />
      <input type="text" name="storage_type" onChange={handleChange} placeholder="Storage Type" />
      <input type="checkbox" name="enable_advanced_threat_protection" onChange={handleChange} /> Enable Advanced Threat Protection
      <input type="text" name="min_tls_versionallow_blob_public_access" onChange={handleChange} placeholder="Min TLS Version" />
      <textarea name="containers_list" onChange={handleChange} placeholder="Containers List (JSON)" />
      <textarea name="lifecycles" onChange={handleChange} placeholder="Lifecycles (JSON)" />
      <input type="text" name="pe_resource_name" onChange={handleChange} placeholder="Private Endpoint Name" />
      {/* Add more fields as needed */}
      <button type="submit">Submit</button>
    </form>
  );
}

export default TerraformForm;
