import axios from 'axios';

const apiUrl = 'http://localhost:5000/api'; // URL of the Express server running on port 5000

export const getTestMessage = () => {
  return axios.get(`${apiUrl}/test`);
};

export const triggerPipeline = (resourceType, parameters) => {
  return axios.post(`${apiUrl}/trigger-pipeline`, { resourceType, parameters });
};
