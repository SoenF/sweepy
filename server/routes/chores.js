const express = require('express');
const router = express.Router();
const choreController = require('../controllers/choreController');

router.get('/', choreController.getAllChores);
router.post('/', choreController.createChore);
router.put('/:id', choreController.updateChore);
router.delete('/:id', choreController.deleteChore);

module.exports = router;
