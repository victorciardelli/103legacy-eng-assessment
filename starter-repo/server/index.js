const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ---------- Database ----------
const db = new Database(path.join(__dirname, "../db/uploads.db"));

// ---------- File Storage ----------
// BUG: No file size limit configured. Large files from modern phone cameras
// (100MB+) will cause the server to run out of memory or timeout.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // BUG: Using original filename. If two contributors upload "IMG_0001.MOV"
    // at the same time, the second one overwrites the first.
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// ---------- Routes ----------

// Get all cards
app.get("/api/cards", (req, res) => {
  try {
    const cards = db.prepare("SELECT * FROM cards").all();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get a single card with its uploads
app.get("/api/cards/:cardId", (req, res) => {
  try {
    const card = db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(req.params.cardId);
    if (!card) return res.status(404).json({ error: "Not found" });

    const uploads = db
      .prepare("SELECT * FROM uploads WHERE card_id = ?")
      .all(req.params.cardId);

    res.json({ ...card, uploads });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Upload a video for a card
// BUG: No file type validation. Accepts any file type (PDFs, images, executables).
// BUG: No proper error handling. If anything fails, returns generic 500.
// BUG: No upload progress tracking. The frontend has no way to know how far along
//       the upload is because this is a single multipart upload with no streaming feedback.
app.post("/api/cards/:cardId/upload", upload.single("video"), (req, res) => {
  try {
    const { cardId } = req.params;
    const { contributorName, caption } = req.body;

    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId);
    if (!card) {
      return res.status(404).json({ error: "Something went wrong" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Something went wrong" });
    }

    const uploadId = uuidv4();

    // BUG: No status tracking. We insert "complete" immediately even though
    // in a real system the video would need processing/transcoding.
    // BUG: The caption field is accepted from the form but silently dropped here.
    // It never gets stored in the database, so it's lost forever. When the compile
    // endpoint tries to add captions to the final video, there's nothing to use.
    db.prepare(
      `INSERT INTO uploads (id, card_id, contributor_name, filename, file_size, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'complete', datetime('now'))`
    ).run(uploadId, cardId, contributorName || "Anonymous", req.file.originalname, req.file.size);

    // BUG: Race condition. We read the count and update separately.
    // If two uploads happen simultaneously, the count can be wrong.
    const currentCount = db
      .prepare("SELECT upload_count FROM cards WHERE id = ?")
      .get(cardId);
    db.prepare("UPDATE cards SET upload_count = ? WHERE id = ?").run(
      currentCount.upload_count + 1,
      cardId
    );

    res.json({
      success: true,
      uploadId,
      message: "Upload complete",
    });
  } catch (err) {
    console.error("Upload failed:", err);
    // BUG: Generic error message tells the user nothing about what went wrong.
    // Was it a file size issue? Wrong format? Server full? Connection drop?
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Compile all videos for a card into a single video with captions
// This endpoint simulates what happens when the organizer clicks "Compile Card"
// BUG: Captions are completely broken. The compile endpoint tries to read captions
// from the database, but the upload endpoint never stores them (see above).
// BUG: No validation that caption text is safe (could contain HTML/script injection).
// BUG: No handling for missing captions — if a contributor skips the caption field,
// the compiled video should still show their name, but this crashes instead.
// BUG: The compile response returns success even when it hasn't actually done anything
// with the captions. It just concatenates filenames into a "playlist" and calls it done.
app.post("/api/cards/:cardId/compile", (req, res) => {
  try {
    const { cardId } = req.params;

    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId);
    if (!card) {
      return res.status(404).json({ error: "Something went wrong" });
    }

    const uploads = db
      .prepare("SELECT * FROM uploads WHERE card_id = ? AND status = 'complete'")
      .all(cardId);

    if (uploads.length === 0) {
      return res.status(400).json({ error: "Something went wrong" });
    }

    // BUG: This is where captions should be overlaid onto each video segment.
    // Instead, we just build a list of filenames and pretend it's a compiled video.
    // The caption field doesn't exist on the upload records because it was never saved.
    const segments = uploads.map((upload) => ({
      file: upload.filename,
      contributor: upload.contributor_name,
      // BUG: upload.caption is always undefined because it was never stored
      caption: upload.caption || "",
    }));

    // Simulate a "compiled" result — in reality this should invoke a video
    // processing pipeline (FFmpeg, Mux, etc.) that overlays each contributor's
    // caption onto their video segment and stitches everything together.
    const compileResult = {
      success: true,
      cardId,
      totalSegments: segments.length,
      segments,
      // BUG: Returns a fake output path. No actual video processing happens.
      outputFile: `compiled_${cardId}.mp4`,
      captionsIncluded: segments.some((s) => s.caption.length > 0),
    };

    res.json(compileResult);
  } catch (err) {
    console.error("Compile failed:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get upload status
app.get("/api/uploads/:uploadId", (req, res) => {
  try {
    const upload = db
      .prepare("SELECT * FROM uploads WHERE id = ?")
      .get(req.params.uploadId);
    if (!upload) return res.status(404).json({ error: "Not found" });
    res.json(upload);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Create a new card (for testing)
app.post("/api/cards", (req, res) => {
  try {
    const { recipientName, occasion, organizerName } = req.body;
    const id = uuidv4();
    db.prepare(
      `INSERT INTO cards (id, recipient_name, occasion, organizer_name, upload_count, created_at)
       VALUES (?, ?, ?, ?, 0, datetime('now'))`
    ).run(id, recipientName, occasion, organizerName);
    res.json({ id, recipientName, occasion, organizerName });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
