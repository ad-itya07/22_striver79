require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Question = require('./models/Question');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET all questions grouped by topic
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ topic: 1, order: 1, name: 1 });
    const grouped = {};
    for (const q of questions) {
      if (!grouped[q.topic]) grouped[q.topic] = [];
      grouped[q.topic].push(q);
    }
    res.json({ grouped, total: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await Question.countDocuments();
    const done = await Question.countDocuments({ isDone: true });
    const starred = await Question.countDocuments({ isStarred: true });
    const withNotes = await Question.countDocuments({ notes: { $ne: '' } });
    res.json({ total, done, starred, withNotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update a question (done/starred/notes)
app.patch('/api/questions/:id', async (req, res) => {
  try {
    const allowedFields = ['isDone', 'isStarred', 'notes', 'link'];
    const update = {};
    for (const key of allowedFields) {
      if (key in req.body) update[key] = req.body[key];
    }
    const q = await Question.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Catch-all: serve frontend ────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
