const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// CRUD routes
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

router.post('/:id/members', projectController.addMember);
router.put('/:id/members/:memberId', projectController.updateMember);
router.delete('/:id/members/:memberId', projectController.removeMember);

router.delete('/', projectController.deleteAllProjects);

module.exports = router;
