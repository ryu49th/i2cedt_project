const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  title: String,
  content: String,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  createdAt: { type: Date, default: Date.now }
});

// ป้องกัน OverwriteModelError
module.exports = mongoose.models.Plan || mongoose.model("Plan", planSchema);
