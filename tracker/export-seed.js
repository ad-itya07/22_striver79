/**
 * export-seed.js — Exports only the public, non-personal question data
 * (topic, name, link, order) from MongoDB into seed-data.json.
 *
 * This lets you commit curated problem links to the repo without
 * exposing personal data (isDone, isStarred, notes).
 *
 * Run with: npm run export-seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Question = require('./models/Question');

const MONGO_URI = process.env.MONGO_URI;
const OUTPUT_FILE = path.join(__dirname, 'seed-data.json');

async function exportSeed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  // Fetch ONLY the public fields — no personal data
  const questions = await Question.find(
    {},
    { topic: 1, name: 1, link: 1, order: 1, _id: 0 }
  ).sort({ topic: 1, order: 1, name: 1 });

  console.log(`📦 Fetched ${questions.length} questions`);

  // Group by topic for readability in the JSON file
  const grouped = {};
  for (const q of questions) {
    if (!grouped[q.topic]) grouped[q.topic] = [];
    grouped[q.topic].push({
      name: q.name,
      link: q.link || '',
      order: q.order,
    });
  }

  const output = {
    exportedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    topics: grouped,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✨ Export complete!`);
  console.log(`📄 Written to: ${OUTPUT_FILE}`);
  console.log(
    `📊 Topics: ${Object.keys(grouped).length}, Questions: ${questions.length}`
  );

  // Summary per topic
  for (const [topic, qs] of Object.entries(grouped)) {
    const withLinks = qs.filter((q) => q.link).length;
    console.log(`  ${topic}: ${qs.length} questions, ${withLinks} with links`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

exportSeed().catch((err) => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});
