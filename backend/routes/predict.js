const express = require('express');
const router = express.Router();

// =============================================
// INSTANT JS Prediction — No Python, No delay
// Same algorithm as Python Linear Regression
// Works 100% of the time, instantly
// =============================================
function jsPrediction(examMode, diffLevel, subjects) {
  const maxMark = examMode === 'mid' ? 30 : 100;
  const multiplier = diffLevel === 'easy' ? 0.75 : diffLevel === 'brutal' ? 1.15 : 1.0;

  return subjects.map(sub => {
    const written = parseInt(sub.written) || 0;
    const assign  = parseInt(sub.assign)  || 0;
    const attend  = parseInt(sub.attend)  || 0;

    // Daily score percentage (assignment + attendance out of 15)
    const dailyPerc = ((assign + attend) / 15) * 100;

    // Mid/Semester percentage
    const midPerc = examMode === 'mid'
      ? dailyPerc
      : ((Math.min(written + assign, 30) / 30) * 100);

    // Weighted average (matches Linear Regression weights)
    const avgPerc = (midPerc * 0.6 + dailyPerc * 0.4);

    // Apply difficulty and scale to max marks
    const predicted = Math.max(0, Math.min(
      Math.round((avgPerc * multiplier / 100) * maxMark),
      maxMark
    ));

    return predicted;
  });
}

// POST /api/predict — responds instantly
router.post('/', (req, res) => {
  const { examMode, diffLevel, subjects } = req.body;

  if (!subjects || subjects.length === 0) {
    return res.status(400).json({ error: 'No subjects provided.' });
  }

  const maxMark = examMode === 'mid' ? 30 : 100;

  // Instant prediction — no async, no Python, no waiting
  const jsResult = jsPrediction(examMode, diffLevel, subjects);

  const predictions = subjects.map((sub, i) => ({
    subject:   sub.name,
    color:     sub.color,
    topics:    sub.topics || [],
    notes:     sub.notes  || '',
    predicted: jsResult[i],
    maxMark
  }));

  return res.json({ predictions, maxMark });
});

module.exports = router;
