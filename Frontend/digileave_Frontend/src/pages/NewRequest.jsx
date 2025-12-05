import { useEffect, useMemo, useState } from "react";
import { authHeader } from "../utils/auth";
import { BASE_API_URL } from "../utils/base_api_url";
import { hasOverlapWithRequests } from "../utils/overlap";
import FlashMessage from "../utils/FlashMessage";
import { setFlashMessage } from "../utils/flashMessageStorage";
import "../styles/newrequest.css";


const LEAVE_TYPES = [
  "ANNUAL_PAID_LEAVE",
  "ANNUAL_UNPAID_LEAVE",
  "SICK_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
];



export default function NewRequest() {
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [toast, setToast] = useState(null); // { status, text }
  
  const [availableDays, setAvailableDays] = useState(null);
  const [holidayDates, setHolidayDates] = useState(() => new Set());
  const [myRequests, setMyRequests] = useState([]);
  
  const today = new Date().toISOString().slice(0, 10);


  // # Fetch User info for checks
  useEffect(() => {
    const headers = new Headers(authHeader());

    // availableLeaveDays blanace check 
    fetch(`${BASE_API_URL}/account`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setAvailableDays(u?.availableLeaveDays ?? null))
      .catch(() => setAvailableDays(null));
    // fetch user requests (to check for overlap with the new request)
    fetch(`${BASE_API_URL}/requests`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => (Array.isArray(list) ? setMyRequests(list) : []))
      .catch(() => setMyRequests([]));
  }, []);


  // # Official holidays check
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
    for (let y = s.getFullYear(); y <= e.getFullYear(); y += 1) {
      years.push(y);
    }

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



  // # Calculate workdays (skip Weekends and Holidays)
  const workdaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) {
      return 0;
    }

    let current = new Date(s);
    let count = 0;

    while (current <= e) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      const iso = `${year}-${month}-${day}`;

      const isHoliday = holidayDates.has(iso);

      if (!isWeekend && !isHoliday) {
        count += 1;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }, [startDate, endDate, holidayDates]);



  // # Calculate remaining days
  const remainingDays = useMemo(() => {
    if (availableDays == null) return null;
    const rem = availableDays - workdaysCount;
    return rem < 0 ? 0 : rem;
  }, [availableDays, workdaysCount]);



  function showToast(status, text) {
    setToast({ status, text });
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setToast(null);

    if (!type) {
      showToast("err", "Please choose a leave type.");
      return;
    }
    if (!startDate || !endDate) {
      showToast("err", "Select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showToast("err", "Start date cannot be after end date.");
      return;
    }
    if (workdaysCount <= 0) {
      showToast("err", "Selected range contains no workdays (Mon–Fri).");
      return;
    }

    const hasOverlap = hasOverlapWithRequests(startDate, endDate, myRequests);
    if (hasOverlap) {
      showToast("err", "This request overlaps with an existing leave request.");
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
        showToast("unauth", "Not signed in. Use Login with Google.");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        showToast("err", text || `Request failed (HTTP ${res.status})`);
        return;
      }

      const saved = await res.json().catch(() => null);

      setFlashMessage({
        status: "ok",
        text: "Leave request created successfully.",
        requestId: saved?.id ?? null,
      });

      window.location.href = "/requests";
    } catch {
      showToast("err", "Network error.");
    } finally {
      setSubmitting(false);
    }
  }



  return (

    <div className="newrequest-root">
      {toast && (
        <FlashMessage
          status={toast.status}
          text={toast.text}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="newrequest-card">
        <h2 className="newrequest-title">
          Create Leave Request
        </h2>

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
            <select
              id="type-dropdown"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              {LEAVE_TYPES.map((leaveType) => {
                const label = leaveType
                  .toLowerCase()
                  .split("_")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                  )
                  .join(" ");
                return (
                  <option key={leaveType} value={leaveType}>
                    {label}
                  </option>
                );
              })}
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

          <div className="newrequest-summary-row">
            <div className="newrequest-summary-card">
              <div className="newrequest-summary-label">Preview (work days)</div>
              <div className="newrequest-summary-value">
                {workdaysCount}
              </div>
            </div>

            <div className="newrequest-summary-card">
              <div className="newrequest-summary-label">Available days</div>
              <div className="newrequest-summary-value">
                {availableDays == null ? "—" : availableDays}
              </div>
            </div>

            <div className="newrequest-summary-card">
              <div className="newrequest-summary-label">Remaining after request</div>
              <div
                className={
                  "newrequest-summary-value " +
                  (remainingDays === 0 ? "danger" : "")
                }
              >
                {remainingDays == null ? "—" : remainingDays}
              </div>
            </div>
          </div>

          <div className="newrequest-buttons">
            <button
              className="newrequest-button newrequest-button--submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              className="newrequest-button newrequest-button--reset"
              type="button"
              onClick={() => {
                setType(LEAVE_TYPES[0]);
                setStartDate("");
                setEndDate("");
                setComment("");
                setToast(null);
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
