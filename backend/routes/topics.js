const express = require('express');
const router = express.Router();
const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

router.post('/', async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject name required.' });
  if (!GEMINI_API_KEY) return res.json({ topics: getFallbackTopics(subject), source: 'fallback' });
  try {
    const topics = await fetchGeminiTopics(subject);
    return res.json({ topics, source: 'gemini' });
  } catch (err) {
    return res.json({ topics: getFallbackTopics(subject), source: 'fallback' });
  }
});

async function fetchGeminiTopics(subject) {
  const prompt = `List exactly 5 most important exam topics for the subject "${subject}". Return ONLY a JSON array of strings, nothing else. Example: ["Topic 1","Topic 2","Topic 3","Topic 4","Topic 5"]`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 256 } });
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const urlObj = new URL(url);
    const options = { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(options, response => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          const cleaned = text.replace(/```json|```/g,'').trim();
          const topics = JSON.parse(cleaned);
          resolve(Array.isArray(topics) ? topics.slice(0,6) : []);
        } catch { reject(new Error('Failed to parse Gemini response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Gemini timeout')); });
    req.write(body); req.end();
  });
}

function getFallbackTopics(subject) {
  const s = subject.toLowerCase();
  const map = {
    math: ['Calculus & Differentiation','Integration Methods','Laplace Transforms','Fourier Series','Linear Algebra'],
    data: ['Sorting Algorithms','Binary Trees','Dynamic Programming','Graph Algorithms','Hashing'],
    machine: ['Linear Regression','Decision Trees','SVM','Neural Networks','Model Evaluation'],
    network: ['OSI Model','TCP/IP','Routing Protocols','Network Security','DNS & HTTP'],
    database: ['SQL Queries','Normalization','ER Diagrams','Indexing','Transactions'],
    signal: ['Fourier Transform','Z-Transform','Sampling Theorem','Filters','Modulation'],
    thermo: ['Laws of Thermodynamics','Carnot Cycle','Heat Transfer','Entropy','Rankine Cycle'],
    fluid: ['Bernoulli Equation','Reynolds Number','Pipe Flow','Viscosity','Turbulence'],
    finance: ['NPV & IRR','Capital Budgeting','Financial Ratios','Cash Flow','Portfolio Theory'],
    digital: ['Boolean Algebra','Flip Flops','Counters','Logic Gates','Multiplexers'],
    default: ['Unit 1 Fundamentals','Key Definitions','Important Theorems','Solved Examples','Previous Year Questions']
  };
  const keys = Object.keys(map).filter(k => k !== 'default');
  const match = keys.find(k => s.includes(k));
  return map[match] || map.default;
}

module.exports = router;
