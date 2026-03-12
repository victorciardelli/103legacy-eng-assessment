# 103Legacy — Founding Engineer Technical Assessment

## What is 103Legacy?

103Legacy creates physical keepsake greeting cards with embedded HD screens that play compiled video messages. When someone has a milestone moment — a birthday, wedding, retirement — their loved ones each record a short video message through our platform. We compile those messages and deliver them inside a beautiful physical card.

## About This Repo

This is a simplified version of our video upload pipeline. It allows contributors to upload video messages for a card, and organizers to see upload progress on a dashboard.

**The code works in the happy path, but it's fragile.** Your job is to make it production-ready. See the assessment brief for full instructions.

## Setup

### Prerequisites
- Node.js 18+ 
- npm

### Installation

```bash
# Install root dependencies
npm install

# Install server and client dependencies
npm run install:all

# Set up the database with a test card
npm run setup
```

### Running

```bash
# Start both server and client
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Contributor upload page:** http://localhost:5173/upload/test-card-001
- **Organizer dashboard:** http://localhost:5173/dashboard/test-card-001

## Project Structure

```
├── server/
│   ├── index.js          # Express server with upload endpoint
│   └── setup-db.js       # Database initialization + seed data
├── client/
│   └── src/
│       ├── main.jsx       # React Router setup
│       ├── App.jsx        # Home page
│       ├── UploadPage.jsx # Contributor upload experience
│       └── DashboardPage.jsx  # Organizer dashboard
├── design/
│   └── wireframe.svg     # Low-fidelity wireframe for the upload flow
├── uploads/              # Where uploaded files are stored
└── db/                   # SQLite database location
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cards` | List all cards |
| GET | `/api/cards/:cardId` | Get card with uploads |
| POST | `/api/cards/:cardId/upload` | Upload video (multipart, field: `video`) |
| POST | `/api/cards` | Create a new card |
| GET | `/api/uploads/:uploadId` | Get single upload status |

## Known Bugs & Limitations

These are the issues we know about. Fixing them (and anything else you find) is the core of this assessment.

### 1. No file validation
The server accepts any file type. You can upload a PDF, a spreadsheet, or an executable and it will happily store it. There's no check that the file is actually a video, and no file size limit.

### 2. Filename collisions
Uploaded files are stored using their original filename. If two contributors both upload a file called `IMG_0001.MOV`, the second upload silently overwrites the first. Data is lost with no warning.

### 3. No upload progress
The frontend shows "Uploading..." but gives no indication of progress. For large files on slow connections (common on mobile), contributors have no idea if the upload is working, how long it will take, or if it's hung. Many will close the browser and give up.

### 4. Race condition on upload count
When a video is uploaded, the server reads the current `upload_count`, adds 1, and writes it back. If two uploads happen at the same time, both read the same count and one increment is lost. The dashboard shows the wrong number.

### 5. Generic error messages
Every error — wrong file type, file too large, server crash, network timeout — returns the same message: "Something went wrong." Contributors (often non-technical family members like grandparents) have no way to understand or fix the problem.

### 6. No mobile responsiveness
The upload page uses hardcoded pixel widths that overflow on mobile screens. Input fields and buttons extend past the screen edge. The file input doesn't suggest camera/video capture on mobile devices. This is critical because ~70% of our contributors open their upload link on their phone via text message.

## Test Card

After running `npm run setup`, a test card is created:

- **Card ID:** `test-card-001`
- **Recipient:** Grandma Rose
- **Occasion:** 80th Birthday
- **Organizer:** Sarah

Use this card for development and testing.
