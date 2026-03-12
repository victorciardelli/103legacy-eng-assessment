import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// BUG: This entire component has no mobile responsiveness.
// BUG: No upload progress indicator — user stares at a blank screen during upload.
// BUG: No file type or size validation on the client side.
// BUG: Generic error handling — user has no idea what went wrong.

export default function UploadPage() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then(setCard)
      .catch(() => setErrorMsg("Something went wrong"));
  }, [cardId]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("contributorName", name || "Anonymous");

    try {
      // BUG: Using fetch with no timeout. If the server hangs (which it does
      // for large files), this will wait forever with no feedback to the user.
      // BUG: No abort controller. If the user navigates away or wants to cancel,
      // there's no way to stop the upload.
      const res = await fetch(`/api/cards/${cardId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("done");
    } catch (err) {
      setStatus("error");
      // BUG: This just shows "Something went wrong" for every possible failure:
      // wrong file type, too large, network drop, server crash — all the same message.
      setErrorMsg(err.message || "Something went wrong");
    }
  };

  if (!card) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Record a message for {card.recipient_name}</h1>
      <p style={styles.subtitle}>
        {card.occasion} — organized by {card.organizer_name}
      </p>

      {status === "done" ? (
        <div>
          <h2>Upload complete!</h2>
          <p>Thanks for your message.</p>
        </div>
      ) : (
        <div>
          <div style={styles.field}>
            <label>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label>Select video file</label>
            {/* BUG: No accept attribute to filter file types in the picker.
                Users can select any file type. */}
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={styles.input}
            />
          </div>

          {file && (
            <p style={{ fontSize: "14px", color: "#666" }}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={status === "uploading"}
            style={styles.button}
          >
            {status === "uploading" ? "Uploading..." : "Upload Video"}
          </button>

          {/* BUG: When status is "uploading", there is no progress bar,
              no percentage, no visual indicator at all. The button just says
              "Uploading..." and the user has no idea how long it will take
              or if it's still working. For a 200MB file on a slow connection,
              this could be 5+ minutes of staring at "Uploading..." */}

          {status === "error" && (
            <p style={styles.error}>{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

// BUG: Inline styles with fixed pixel widths. Not responsive on mobile.
// The input and button widths are hardcoded and will overflow on small screens.
const styles = {
  container: {
    maxWidth: "600px",
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
  field: {
    marginBottom: "20px",
  },
  input: {
    display: "block",
    width: "400px",
    padding: "10px",
    marginTop: "6px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "12px 32px",
    fontSize: "16px",
    backgroundColor: "#1a1a2e",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  error: {
    color: "red",
    marginTop: "12px",
  },
};
