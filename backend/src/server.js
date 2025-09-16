require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const aiRoutes = require('./routes/aiRoutes');

const projectRoutes = require('./routes/projectRoutes');
const planRoutes = require("./routes/planRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/plans", planRoutes);


app.use('/api', aiRoutes);
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
  console.log(`✅ Server running on http://34.204.10.42:${PORT}`);
});
