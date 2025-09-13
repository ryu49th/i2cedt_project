const Project = require('../models/Project');

// CREATE
exports.createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find(); // Always fetch from MongoDB
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) return res.status(405).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAllProjects = async (req, res) => {
  try {
    await Project.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ADD MEMBER
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params; // project _id
    const member = req.body; // { name, skills:[], weakness:[] }

    const project = await Project.findById(id);
    if(!project) return res.status(404).json({ error: 'Project not found' });

    project.members.push(member);
    await project.save();

    res.json(project); // return updated project
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// REMOVE MEMBER
exports.removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const project = await Project.findById(id);
    if(!project) return res.status(404).json({ error: 'Project not found' });

    project.members = project.members.filter(m => m._id.toString() !== memberId);
    await project.save();

    res.json(project);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE member
exports.updateMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const member = project.members.id(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.name = req.body.name || member.name;
    member.skills = req.body.skills || member.skills;
    member.weakness = req.body.weakness || member.weakness;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};