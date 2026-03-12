const Database = require("better-sqlite3");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const dbPath = path.join(__dirname, "../db/uploads.db");
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    occasion TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    upload_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    contributor_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id)
  );
`);

// Seed a test card with some expected contributors
const cardId = "test-card-001";

const existing = db.prepare("SELECT id FROM cards WHERE id = ?").get(cardId);
if (!existing) {
  db.prepare(
    `INSERT INTO cards (id, recipient_name, occasion, organizer_name, upload_count, created_at)
     VALUES (?, 'Grandma Rose', '80th Birthday', 'Sarah', 0, datetime('now'))`
  ).run(cardId);

  console.log(`Created test card: ${cardId}`);
  console.log(`Recipient: Grandma Rose`);
  console.log(`Occasion: 80th Birthday`);
  console.log(`Organizer: Sarah`);
} else {
  console.log("Test card already exists");
}

console.log("\nDatabase setup complete!");
console.log(`Database location: ${dbPath}`);
console.log(`\nYou can test the upload flow at:`);
console.log(`  Contributor page: http://localhost:5173/upload/${cardId}`);
console.log(`  Organizer dashboard: http://localhost:5173/dashboard/${cardId}`);

db.close();
