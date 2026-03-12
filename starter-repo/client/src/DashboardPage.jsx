import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// BUG: No auto-refresh. The organizer has to manually reload the page
// to see if new uploads have come in.
// BUG: No empty state handling. If no one has uploaded yet, the page
// just shows nothing — no guidance, no message.
// BUG: No real-time contributor tracking. We only know about contributors
// who have already uploaded. There's no concept of "invited but hasn't
// uploaded yet" — which is the most important thing for an organizer to see.

export default function DashboardPage() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then(setCard)
      .catch(() => setError("Something went wrong"));
  }, [cardId]);

  if (error) return <div style={styles.container}><p style={{ color: "red" }}>{error}</p></div>;
  if (!card) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        Card for {card.recipient_name}
      </h1>
      <p style={styles.subtitle}>
        {card.occasion} — {card.upload_count} video(s) received
      </p>

      <h2>Uploads</h2>

      {/* BUG: No handling for empty uploads array */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Contributor</th>
            <th style={styles.th}>File</th>
            <th style={styles.th}>Caption</th>
            <th style={styles.th}>Size</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {card.uploads && card.uploads.map((upload) => (
            <tr key={upload.id}>
              <td style={styles.td}>{upload.contributor_name}</td>
              <td style={styles.td}>{upload.filename}</td>
              {/* BUG: Caption always shows as empty because the server
                  never stores it. The organizer has no way to know what
                  captions contributors wrote, or that they're missing. */}
              <td style={styles.td}>{upload.caption || "—"}</td>
              <td style={styles.td}>
                {(upload.file_size / 1024 / 1024).toFixed(1)} MB
              </td>
              <td style={styles.td}>{upload.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "32px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "2px solid #ddd",
    fontSize: "14px",
    color: "#666",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
  },
};
