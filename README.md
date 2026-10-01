# Striver 79 — DSA Tracker 🚀

Striver changed the Striver79 sheet (the most famous and last minute revision sheet), so here it is Track your progress, star problems for revision, and write Markdown notes — all stored in your own MongoDB database.

![Striver 79 DSA Tracker](./tracker/public/preview.png)

---

## Features

- ✅ **Mark problems as done** with a single click
- ⭐ **Star problems** for quick revision
- 📝 **Personal Markdown notes** per problem (with live preview & split view)
- 🔍 **Search & filter** — All / Starred / Not Done / Completed
- 📊 **Live progress bar** with per-topic stats
- 🔗 **Direct LeetCode / GFG links** for every problem (pre-seeded)
- 💾 **Your data, your database** — runs entirely on your own MongoDB Atlas cluster

---

## Tech Stack

| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | Vanilla HTML, CSS, JS       |
| Backend  | Node.js + Express           |
| Database | MongoDB (via Mongoose)      |
| Fonts    | Inter + JetBrains Mono      |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ad-itya07/22_striver79.git
cd 22_striver79
```

---

### 2. Set up environment variables

```bash
cd tracker
cp .env.example .env
```

Open `.env` and fill in your own MongoDB connection string:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/striver79?retryWrites=true&w=majority
PORT=3001
```

> **How to get a free MongoDB URI:**
> 1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
> 2. Create a free **M0** cluster
> 3. Go to **Database** → **Connect** → **Drivers**
> 4. Copy the connection string and replace `<password>` with your DB user password

---

### 3. Install dependencies

```bash
npm install
```

---

### 4. Seed the database

This step loads all 79 problems (with curated LeetCode/GFG links) into **your** MongoDB database:

```bash
npm run seed
```

You should see output like:
```
Connected to MongoDB
Found seed-data.json -- using pre-exported data (with curated links)
  Topic Array and Hashing: 8 questions
  Topic Binary Search: 8 questions
  ...
Seed complete! Inserted: 79, Already existed: 0
Total questions in DB: 79
```

---

### 5. Start the tracker

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. 🎉

---

## Available Scripts

| Command               | Description                                         |
|-----------------------|-----------------------------------------------------|
| `npm run dev`         | Start the server with hot-reload (nodemon)          |
| `npm start`           | Start the server (production)                       |
| `npm run seed`        | Seed your MongoDB with all 79 problems              |

---

## Project Structure

```
22_striver79/
├── tracker/                    # The web app
│   ├── public/
│   │   ├── index.html          # Frontend UI
│   │   ├── style.css           # Styles
│   │   └── app.js              # Frontend logic
│   ├── models/
│   │   └── Question.js         # Mongoose schema
│   ├── server.js               # Express API server
│   ├── seed.js                 # DB seeder (reads seed-data.json)
│   ├── export-seed.js          # Exports curated data (maintainer tool)
│   ├── seed-data.json          # Pre-curated problem data with links ✅
│   ├── .env.example            # Environment variable template
│   └── package.json
└── Strivers-79-Last-Moment-DSA-Sheet-Ace-Interviews-main/   # Java solutions
```

---

## API Endpoints

| Method  | Endpoint              | Description                        |
|---------|-----------------------|------------------------------------|
| `GET`   | `/api/questions`      | Get all questions grouped by topic |
| `GET`   | `/api/stats`          | Get overall stats                  |
| `PATCH` | `/api/questions/:id`  | Update isDone / isStarred / notes  |

---

## How the Seed Data Works

The `seed-data.json` file contains **only public data** — question names, topics, problem links, and ordering. It contains **no personal data** (no notes, no completion status, no starred flags). 

When you run `npm run seed`, it reads this file and inserts the questions into **your own** MongoDB database. Your progress is always private and stored only in your DB.

---

## Topics Covered

| # | Topic                   | Problems |
|---|-------------------------|----------|
| 1 | Array and Hashing       | 8        |
| 2 | Binary Search           | 8        |
| 3 | Linked List             | 6        |
| 4 | Stacks and Queues       | 6        |
| 5 | Strings                 | 4        |
| 6 | Recursion & Backtracking| 6        |
| 7 | Trees (BT + BST)        | 11       |
| 8 | Heaps                   | 3        |
| 9 | Graphs                  | 12       |
|10 | Dynamic Programming     | 12       |
|11 | Tries                   | 3        |
|   | **Total**               | **79**   |

---

## License

MIT — do whatever you want with it. If you find it useful, a ⭐ on the repo would be appreciated!
