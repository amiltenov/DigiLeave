import { useMemo, useState } from "react";

const API = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";

export default function NewRequest() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "ok" | "err" | "unauth", text: string }

  // compute business days (Mon–Fri)
  const workdaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s) || Number.isNaN(e) || s > e) return 0;
    let d = new Date(s);
    let count = 0;
    while (d <= e) {
      const day = d.getDay(); // 0=Sun..6=Sat
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }, [startDate, endDate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!startDate || !endDate) {
      setMsg({ type: "err", text: "Select both start and end dates." });
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setMsg({ type: "err", text: "Start date cannot be after end date." });
      return;
    }
    if (workdaysCount <= 0) {
      setMsg({ type: "err", text: "Selected range contains no workdays (Mon–Fri)." });
      return;
    }

    const payload = {
      startDate,       // "YYYY-MM-DD"
      endDate,         // "YYYY-MM-DD"
      workdaysCount,   // your backend currently expects this from client
      comment: comment || null
      // userEmail set server-side from OAuth principal
      // status defaults to SUBMITTED server-side or in model
    };

    // 🔵 log what you're sending
    console.log("[NewRequest] Submitting payload →", payload);

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 🟡 log raw HTTP status
      console.log("[NewRequest] Response status:", res.status, res.statusText);

      if (res.status === 401) {
        setMsg({ type: "unauth", text: "Not signed in. Use Login with Google." });
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[NewRequest] Error response body:", text);
        setMsg({ type: "err", text: text || `Request failed (HTTP ${res.status})` });
        return;
      }

      const saved = await res.json().catch(() => null);

      // 🟢 log what the backend saved (DB object echoed back)
      console.log("[NewRequest] Saved to DB ←", saved);

      setMsg({
        type: "ok",
        text: saved?.id
          ? `Request submitted successfully (id: ${saved.id}).`
          : "Request submitted successfully.",
      });

      setStartDate("");
      setEndDate("");
      setComment("");
    } catch (err) {
      console.error("[NewRequest] Network/JS error:", err);
      setMsg({ type: "err", text: "Network error. Is the backend on :8080 with CORS enabled?" });
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ padding: "16px 24px" }}>
      <h1>Create Leave Request</h1>

      {msg && (
        <div
          style={{
            padding: "10px 12px",
            margin: "10px 0",
            borderRadius: 8,
            border: "1px solid",
            borderColor:
              msg.type === "ok" ? "rgba(0,160,60,.4)" :
              msg.type === "unauth" ? "rgba(255,170,0,.5)" :
              "rgba(200,0,0,.4)",
            background:
              msg.type === "ok" ? "rgba(0,160,60,.08)" :
              msg.type === "unauth" ? "rgba(255,170,0,.08)" :
              "rgba(200,0,0,.08)",
            color: "#000"
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Start date</span>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>End date</span>
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Comment (optional)</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Reason, notes, etc."
            style={{ resize: "vertical" }}
          />
        </label>

        <div style={{ fontSize: 14 }}>
          <strong>Preview:</strong> {workdaysCount} workday{workdaysCount === 1 ? "" : "s"} (Mon–Fri)
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#FFD733",
              color: "#111",
              fontWeight: 700,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>

          <button
            type="button"
            onClick={() => { setStartDate(""); setEndDate(""); setComment(""); setMsg(null); }}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,.2)",
              background: "rgba(255,255,255,.7)",
              color: "#111",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
