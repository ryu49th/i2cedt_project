const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: String,
  skills: [String],
  weakness: [String]
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: String,
  members: [MemberSchema]
});

// ป้องกัน OverwriteModelError
module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
