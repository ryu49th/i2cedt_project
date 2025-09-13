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

module.exports = mongoose.model('Project', ProjectSchema);
