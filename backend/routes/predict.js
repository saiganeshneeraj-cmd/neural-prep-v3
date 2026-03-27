const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post('/', async (req, res) => {
  const { examMode, diffLevel, subjects } = req.body;
  if (!subjects || subjects.length === 0) return res.status(400).json({ error: 'No subjects provided.' });
  try {
    const result = await runPythonModel({ examMode, diffLevel, subjects });
    const maxMark = examMode === 'mid' ? 30 : 100;
    const predictions = subjects.map((sub, i) => ({ subject: sub.name, color: sub.color, topics: sub.topics || [], notes: sub.notes || '', predicted: result[i], maxMark }));
    return res.json({ predictions, maxMark });
  } catch (err) {
    const maxMark = examMode === 'mid' ? 30 : 100;
    const multiplier = diffLevel === 'easy' ? 0.75 : diffLevel === 'brutal' ? 1.15 : 1.0;
    const predictions = subjects.map(sub => {
      const dailyPerc = ((sub.assign + sub.attend) / 15) * 100;
      const midPerc = examMode === 'mid' ? dailyPerc : ((Math.min(sub.written + sub.assign, 30) / 30) * 100);
      const predicted = Math.min(Math.round(((midPerc + dailyPerc) / 2 * multiplier / 100) * maxMark), maxMark);
      return { subject: sub.name, color: sub.color, topics: sub.topics || [], notes: sub.notes || '', predicted, maxMark };
    });
    return res.json({ predictions, maxMark });
  }
});

function runPythonModel(data) {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [path.join(__dirname, '../ml/model.py'), JSON.stringify(data)]);
    let output = '', errOutput = '';
    py.stdout.on('data', d => output += d.toString());
    py.stderr.on('data', d => errOutput += d.toString());
    py.on('close', code => {
      if (code !== 0 || !output.trim()) return reject(new Error(errOutput || 'Python model failed'));
      try { resolve(JSON.parse(output.trim())); } catch { reject(new Error('Invalid JSON from Python')); }
    });
    setTimeout(() => { py.kill(); reject(new Error('Timeout')); }, 10000);
  });
}
module.exports = router;
