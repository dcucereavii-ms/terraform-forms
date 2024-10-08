import React, { useState } from 'react';

function StorageAccountForm({ onChange }) {
  const [formData, setFormData] = useState({
    storage_account_name: '',
    location: '',
    environment: '',
    security_level: '',
    business_unit: '',
    storage_type: '',
    enable_advanced_threat_protection: false,
    min_tls_versionallow_blob_public_access: '',
    pe_resource_name: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    onChange(e); // Propagate change to the parent
  };

  return (
    <div>
      <input type="text" name="storage_account_name" value={formData.storage_account_name} onChange={handleChange} placeholder="Storage Account Name" />
      <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" />
      <input type="text" name="environment" value={formData.environment} onChange={handleChange} placeholder="Environment" />
      <input type="text" name="security_level" value={formData.security_level} onChange={handleChange} placeholder="Security Level" />
      <input type="text" name="business_unit" value={formData.business_unit} onChange={handleChange} placeholder="Business Unit" />
      <input type="text" name="storage_type" value={formData.storage_type} onChange={handleChange} placeholder="Storage Type" />
      <input type="checkbox" name="enable_advanced_threat_protection" checked={formData.enable_advanced_threat_protection} onChange={handleChange} /> Enable Advanced Threat Protection
      <input type="text" name="min_tls_versionallow_blob_public_access" value={formData.min_tls_versionallow_blob_public_access} onChange={handleChange} placeholder="Min TLS Version" />
      <input type="text" name="pe_resource_name" value={formData.pe_resource_name} onChange={handleChange} placeholder="Private Endpoint Name" />
    </div>
  );
}

export default StorageAccountForm;
