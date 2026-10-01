/**
 * seed.js — Populates MongoDB with Striver 79 question data.
 *
 * Priority 1: Uses seed-data.json if present (pre-exported, with curated links).
 * Fallback:   Parses Java files from the sheet directory.
 *
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Question = require('./models/Question');

const MONGO_URI = process.env.MONGO_URI;

// Path to the DSA sheet directory (relative to this file)
const SHEET_DIR = path.join(
  __dirname,
  '..',
  'Strivers-79-Last-Moment-DSA-Sheet-Ace-Interviews-main'
);

// Topic display-order mapping
const TOPIC_ORDER = [
  'Array and Hashing',
  'Binary Search',
  'Linked List',
  'Stacks and Queues',
  'Strings',
  'Recursion and Backtracking',
  'Trees (BT + BST)',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Tries',
];

/**
 * Convert a camelCase filename (without .java) to a readable title.
 * e.g. "kadaneAlgorithm" -> "Kadane Algorithm"
 */
function camelToReadable(filename) {
  const name = filename.replace(/\.java$/, '');
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Extract the first HTTP/HTTPS URL from file content.
 */
function extractLink(content) {
  const match = content.match(/https?:\/\/[^\s*\n]+/);
  return match ? match[0].replace(/[,;)\]]+$/, '').trim() : '';
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  let toInsert = [];

  // Priority 1: Use pre-exported seed-data.json if it exists
  const seedDataPath = path.join(__dirname, 'seed-data.json');
  if (fs.existsSync(seedDataPath)) {
    console.log('Found seed-data.json -- using pre-exported data (with curated links)');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

    for (const [topic, questions] of Object.entries(seedData.topics)) {
      questions.forEach((q) => {
        toInsert.push({
          topic,
          name: q.name,
          link: q.link || '',
          isDone: false,
          isStarred: false,
          notes: '',
          order: q.order,
        });
      });
      console.log('  Topic ' + topic + ': ' + questions.length + ' questions');
    }
  } else {
    // Fallback: Parse Java files from the sheet directory
    console.log('seed-data.json not found -- falling back to parsing Java files');

    const entries = fs.readdirSync(SHEET_DIR, { withFileTypes: true });
    const topicDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => {
        const ai = TOPIC_ORDER.indexOf(a);
        const bi = TOPIC_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

    for (const topic of topicDirs) {
      const topicPath = path.join(SHEET_DIR, topic);
      const files = fs
        .readdirSync(topicPath)
        .filter((f) => f.endsWith('.java'))
        .sort();

      files.forEach((file, idx) => {
        const content = fs.readFileSync(path.join(topicPath, file), 'utf-8');
        const link = extractLink(content);
        const name = camelToReadable(file);

        toInsert.push({
          topic,
          name,
          link,
          isDone: false,
          isStarred: false,
          notes: '',
          order: idx,
        });
      });

      console.log('  Topic ' + topic + ': ' + files.length + ' questions');
    }
  }

  // Only insert questions that don't already exist (match by topic+name)
  let inserted = 0;
  let skipped = 0;
  for (const q of toInsert) {
    const exists = await Question.findOne({ topic: q.topic, name: q.name });
    if (!exists) {
      await Question.create(q);
      inserted++;
    } else {
      // Update link if the curated data has a better one
      if (q.link && exists.link !== q.link) {
        await Question.findByIdAndUpdate(exists._id, { link: q.link });
      }
      skipped++;
    }
  }

  console.log('\nSeed complete! Inserted: ' + inserted + ', Already existed: ' + skipped);
  console.log('Total questions in DB: ' + (await Question.countDocuments()));
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
