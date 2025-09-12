require('dotenv').config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json())

// DB connect (MongoDB)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB error:", err));

// Routes
app.get('/', (req, res) => {
  res.send('TaskWeaver Backend running 🚀');
});

// Example CRUD
const ProjectSchema = new mongoose.Schema({
  name: String,
  desc: String,
  members: [{ name: String, skills: [String], weakness: [String] }]
});

const Project = mongoose.model('Project', ProjectSchema);

app.post('/api/projects', async (req, res) => {
  const project = new Project(req.body);
  await project.save();
  res.json(project);
});

app.get('/api/projects', async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
