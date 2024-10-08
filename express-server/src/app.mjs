import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { triggerPipeline } from './pipelineController.mjs'; // Adjust the import path as needed

const app = express();
const port = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Adjust to match your frontend URL
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Routes
app.post('/api/trigger-pipeline', triggerPipeline);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
