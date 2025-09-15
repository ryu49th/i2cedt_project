// routes/planRoutes.js
const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

// CREATE
router.post('/', planController.createPlan);

// READ (plans by project)
router.get('/:projectId', planController.getPlansByProject);

// DELETE
router.delete('/:id', planController.deletePlan);

// UPDATE
router.put('/:id', planController.updatePlan);


module.exports = router;
