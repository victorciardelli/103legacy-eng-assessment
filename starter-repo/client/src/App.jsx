import React from "react";

export default function App() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>103Legacy - Assessment Starter</h1>
      <p>This is the starter repo for the 103Legacy founding engineer technical assessment.</p>
      <p>Routes:</p>
      <ul>
        <li>
          <a href="/upload/test-card-001">Contributor Upload Page</a> — where contributors record/upload their video message
        </li>
        <li>
          <a href="/dashboard/test-card-001">Organizer Dashboard</a> — where the card organizer sees upload progress
        </li>
      </ul>
      <p style={{ color: "#888", marginTop: "20px" }}>
        Run <code>cd server && node setup-db.js</code> first to create the test card.
      </p>
    </div>
  );
}
