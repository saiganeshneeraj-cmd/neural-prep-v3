require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check — keeps Render from sleeping
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/ping', (req, res) => res.send('pong'));

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
  console.log(`\n🚀 NeuralPrep running at http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/predict`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});
