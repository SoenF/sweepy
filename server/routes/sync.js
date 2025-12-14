const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middleware/auth');

// All sync routes require authentication
router.use(authMiddleware);

// GET /api/sync/data - Full data sync
router.get('/data', syncController.getFullSync);

// POST /api/sync/changes - Batch changes from offline queue
router.post('/changes', syncController.applyBatchChanges);

// POST /api/sync/push - Single change push
router.post('/push', syncController.pushSingleChange);

module.exports = router;
