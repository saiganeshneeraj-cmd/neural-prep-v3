require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const predictRoute = require('./routes/predict');
const topicsRoute = require('./routes/topics');
const authRoute = require('./routes/auth');

app.use('/api/predict', predictRoute);
app.use('/api/topics', topicsRoute);
app.use('/api/auth', authRoute);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 NeuralPrep Server running at http://localhost:${PORT}`);
  console.log(`📊 ML Prediction API: http://localhost:${PORT}/api/predict`);
  console.log(`✨ Topics API: http://localhost:${PORT}/api/topics\n`);
});
