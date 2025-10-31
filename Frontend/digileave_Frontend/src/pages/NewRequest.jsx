import { useMemo, useState, useEffect } from "react";
import { authHeader } from "../utils/auth";
import { BASE_API_URL } from "../utils/base_api_url";
import { hasOverlapWithRequests } from "../utils/overlap";
import "../styles/newrequest.css";


const LEAVE_TYPES = [
  "ANNUAL_PAID_LEAVE",
  "ANNUAL_UNPAID_LEAVE",
  "SICK_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
];

function prettyType(t) {
  return t
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


export default function NewRequest() {
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const [availableDays, setAvailableDays] = useState(null);

  // BG public holiday dates (YYYY-MM-DD)
  const [holidayDates, setHolidayDates] = useState(() => new Set());

  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    const h = new Headers();
    Object.entries(authHeader()).forEach(([k, v]) => h.set(k, v));
    fetch(`${BASE_API_URL}/account`, { headers: h })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setAvailableDays(u?.availableLeaveDays ?? null))
      .catch(() => setAvailableDays(null));

    fetch(`${BASE_API_URL}/requests`, { headers: h })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => (Array.isArray(list) ? setMyRequests(list) : setMyRequests([])))
      .catch(() => setMyRequests([]));
  }, []);

  // Fetch official hlidays
  useEffect(() => {
    if (!startDate || !endDate) {
      setHolidayDates(new Set());
      return;
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s) || Number.isNaN(e) || s > e) {
      setHolidayDates(new Set());
      return;
    }

    const years = [];
    for (let y = s.getFullYear(); y <= e.getFullYear(); y++) years.push(y);

    Promise.all(
      years.map((y) =>
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/BG`)
          .then((r) => (r.ok ? r.json() : Promise.resolve([])))
          .catch(() => [])
      )
    )
      .then((lists) => {
        const isoSet = new Set(
          lists
            .flat()
            .filter((h) =>
              Array.isArray(h.types) ? h.types.includes("Public") : true
            )
            .map((h) => h.date)
        );
        setHolidayDates(isoSet);
      })
      .catch(() => {
        setHolidayDates(new Set());
      });
  }, [startDate, endDate]);

  const workdaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s) || Number.isNaN(e) || s > e) return 0;
    let d = new Date(s);
    let count = 0;
    while (d <= e) {
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6;
      const iso = toLocalISO(d);
      const isHoliday = holidayDates.has(iso);
      if (!isWeekend && !isHoliday) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }, [startDate, endDate, holidayDates]);

  const remainingDays = useMemo(() => {
    if (availableDays == null) return null;
    const rem = availableDays - workdaysCount;
    return rem < 0 ? 0 : rem;
  }, [availableDays, workdaysCount]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!type) {
      setMsg({ type: "err", text: "Please choose a leave type." });
      return;
    }
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

    const hasOverlap = hasOverlapWithRequests(startDate, endDate, myRequests);

    if (hasOverlap) {
      setMsg({ type: "err", text: "This request overlaps with an existing leave request." });
      return;
    }

    const payload = {
      type,
      startDate,
      endDate,
      workdaysCount,
      comment: comment || null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_API_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setMsg({ type: "unauth", text: "Not signed in. Use Login with Google." });
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setMsg({ type: "err", text: text || `Request failed (HTTP ${res.status})` });
        return;
      }

      const saved = await res.json().catch(() => null);
      setMsg({
        type: "ok",
        text: saved?.id ? `Request submitted successfully.` : "Request submitted successfully.",
      });
      

      const h = new Headers();
      Object.entries(authHeader()).forEach(([k, v]) => h.set(k, v));
      fetch(`${BASE_API_URL}/requests`, { headers: h })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => (Array.isArray(list) ? setMyRequests(list) : null))
        .catch(() => {});

      setType(LEAVE_TYPES[0]);
      setStartDate("");
      setEndDate("");
      setComment("");
    } catch {
      setMsg({ type: "err", text: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="newrequest-wrap">
      <div className="newrequest-card">
        <h2>Create Leave Request</h2>

        {msg && (
          <div className={`nr-alert ${msg.type === "ok" ? "ok" : msg.type === "unauth" ? "warn" : "err"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            <span>Start date</span>
            <input
              className="datePicker"
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <label>
            <span>End date</span>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Leave type</span>
            <select id="type-dropdown" value={type} onChange={(e) => setType(e.target.value)} required>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {prettyType(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Comment (optional)</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reason, notes, etc."
            />
          </label>

          <div className="nr-previewCard">
            <span className="nr-stat">Preview</span>
            <div className="nr-previewText">
              {workdaysCount} workday{workdaysCount === 1 ? "" : "s"} (Mon–Fri)
            </div>
          </div>

          <div className="nr-stats">
            <div className="nr-stat">
              <div className="nr-stat-label">Available days</div>
              <div className="nr-stat-value">{availableDays == null ? "—" : availableDays}</div>
            </div>
            <div className="nr-stat">
              <div className="nr-stat-label">Remaining after request</div>
              <div className={`nr-stat-value ${remainingDays === 0 ? "danger" : ""}`}>
                {remainingDays == null ? "—" : remainingDays}
              </div>
            </div>
          </div>

          <div className="newrequest-buttons">
            <button className="btn-lg submit-btn" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              className="btn-lg reset-btn"
              type="button"
              onClick={() => {
                setType(LEAVE_TYPES[0]);
                setStartDate("");
                setEndDate("");
                setComment("");
                setMsg(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
