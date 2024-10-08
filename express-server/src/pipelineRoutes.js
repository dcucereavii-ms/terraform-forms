import express from 'express';
import { triggerPipeline } from './pipelineController.mjs';

const router = express.Router();

router.post('/trigger-pipeline', triggerPipeline);

export default router;
