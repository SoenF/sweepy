const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const SyncService = require('../services/syncService');

// GET /api/sync/data - Get all data for mobile sync
router.get('/data', authMiddleware, async (req, res) => {
  try {
    const syncData = await SyncService.getSyncData(req.family_id);
    res.json(syncData);
  } catch (error) {
    console.error('Sync data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/changes - Apply offline changes from mobile
router.post('/changes', authMiddleware, async (req, res) => {
  try {
    const { changes } = req.body;
    
    if (!Array.isArray(changes)) {
      return res.status(400).json({ error: 'Changes must be an array' });
    }

    const results = await SyncService.applyOfflineChanges(req.family_id, changes);
    res.json(results);
  } catch (error) {
    console.error('Apply changes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/push - Push individual changes (for real-time sync)
router.post('/push', authMiddleware, async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    let result;
    switch (type) {
      case 'create_member':
        result = await SyncService.handleCreateMember(req.family_id, data);
        break;
      case 'update_member':
        result = await SyncService.handleUpdateMember(req.family_id, data);
        break;
      case 'delete_member':
        result = await SyncService.handleDeleteMember(req.family_id, data.id);
        break;
      case 'create_chore':
        result = await SyncService.handleCreateChore(req.family_id, data);
        break;
      case 'update_chore':
        result = await SyncService.handleUpdateChore(req.family_id, data);
        break;
      case 'delete_chore':
        result = await SyncService.handleDeleteChore(req.family_id, data.id);
        break;
      case 'complete_assignment':
        result = await SyncService.handleCompleteAssignment(req.family_id, data);
        break;
      case 'update_points':
        result = await SyncService.handleUpdatePoints(req.family_id, data);
        break;
      default:
        return res.status(400).json({ error: `Unknown change type: ${type}` });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Push change error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;