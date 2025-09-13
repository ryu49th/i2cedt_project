const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// CRUD routes
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;

