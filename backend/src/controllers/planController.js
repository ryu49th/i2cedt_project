// controllers/planController.js
const Plan = require('../models/Plan');

// CREATE
exports.createPlan = async (req, res) => {
  try {
    const { title, content, projectId } = req.body;
    if (!title || !content || !projectId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const plan = new Plan({ title, content, projectId });
    await plan.save();

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ by projectId
exports.getPlansByProject = async (req, res) => {
  try {
    const plans = await Plan.find({ projectId: req.params.projectId });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ message: 'Plan deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updatePlan = async (req, res) => {
  try {
    const { content, title } = req.body; // allow updating content and/or title
    if (!content && !title) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const update = {};
    if (content) update.content = content;
    if (title) update.title = title;

    const plan = await Plan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
