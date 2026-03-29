const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Pure JS prediction — instant, no Python dependency
function jsPrediction(examMode, diffLevel, subjects) {
  const maxMark = examMode === 'mid' ? 30 : 100;
  const multiplier = diffLevel === 'easy' ? 0.75 : diffLevel === 'brutal' ? 1.15 : 1.0;
  return subjects.map(sub => {
    const dailyPerc = ((sub.assign + sub.attend) / 15) * 100;
    const midPerc = examMode === 'mid'
      ? dailyPerc
      : ((Math.min(sub.written + sub.assign, 30) / 30) * 100);
    const avgPerc = (midPerc * 0.6 + dailyPerc * 0.4);
    const predicted = Math.max(0, Math.min(Math.round((avgPerc * multiplier / 100) * maxMark), maxMark));
    return predicted;
  });
}

router.post('/', async (req, res) => {
  const { examMode, diffLevel, subjects } = req.body;
  if (!subjects || subjects.length === 0)
    return res.status(400).json({ error: 'No subjects provided.' });

  const maxMark = examMode === 'mid' ? 30 : 100;

  // Always use JS prediction first (instant, reliable on all platforms)
  // Python model attempted only if available and quick
  let predictions;
  try {
    const result = await Promise.race([
      runPythonModel({ examMode, diffLevel, subjects }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
    ]);
    predictions = subjects.map((sub, i) => ({
      subject: sub.name, color: sub.color,
      topics: sub.topics || [], notes: sub.notes || '',
      predicted: result[i], maxMark
    }));
  } catch {
    // Instant JS fallback — never fails
    const jsResult = jsPrediction(examMode, diffLevel, subjects);
    predictions = subjects.map((sub, i) => ({
      subject: sub.name, color: sub.color,
      topics: sub.topics || [], notes: sub.notes || '',
      predicted: jsResult[i], maxMark
    }));
  }

  return res.json({ predictions, maxMark });
});

function runPythonModel(data) {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [path.join(__dirname, '../ml/model.py'), JSON.stringify(data)]);
    let output = '', errOutput = '';
    py.stdout.on('data', d => output += d.toString());
    py.stderr.on('data', d => errOutput += d.toString());
    py.on('close', code => {
      if (code !== 0 || !output.trim()) return reject(new Error(errOutput || 'Python model failed'));
      try { resolve(JSON.parse(output.trim())); } catch { reject(new Error('Invalid JSON')); }
    });
    py.on('error', reject);
  });
}

module.exports = router;
