require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB error:", err));

// Routes
app.get('/', (req, res) => {
  res.send('TaskWeaver Backend running 🚀');
});
app.use('/api/projects', projectRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
