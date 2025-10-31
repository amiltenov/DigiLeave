// src/components/ExportMenu.jsx
import React, { useEffect, useMemo, useState } from "react";
import { authHeader } from "../utils/auth";
import { csvExport } from "../utils/csvExport";
import { xlsxExport } from "../utils/xlsxExport"; 
import { BASE_API_URL } from "../utils/base_api_url";

import "../styles/exportmenu.css";

const PRESETS = {
  LAST_TO_NOW: "LAST_TO_NOW",
  THIS_MONTH: "THIS_MONTH",
  THIS_YEAR: "THIS_YEAR",
  ALL: "ALL",
};

const REQUEST_FIELDS_DEFAULT = [
  "assigneeName", "assigneeEmail", "startDate", "endDate",
  "workdaysCount", "status", "type", "comment",
];
const REQUEST_FIELDS_ALL = [
  "requestId", "assigneeId", "assigneeName", "assigneeEmail",
  "startDate", "endDate", "workdaysCount", "status", "type", "comment",
  "decidedBy", "decidedAt",
];

const USER_FIELDS_DEFAULT = ["fullName", "email", "role", "availableLeaveDays"];
const USER_FIELDS_ALL = [
  "id","fullName","email","role","availableLeaveDays",
  "contractLeaveDays","workingSince","assigneeIds"
];

const HEADERS = {
  requestId: "Request ID",
  assigneeId: "Assignee ID",
  assigneeName: "Assignee Name",
  assigneeEmail: "Assignee Email",
  startDate: "Start Date",
  endDate: "End Date",
  workdaysCount: "Workdays",
  status: "Status",
  type: "Type",
  comment: "Comment",
  decidedBy: "Decided By",
  decidedAt: "Decided At (UTC)",
  id: "User ID",
  fullName: "Full Name",
  email: "Email",
  role: "Role",
  availableLeaveDays: "Avail. Leave",
  contractLeaveDays: "Contract Leave",
  workingSince: "Working Since",
  assigneeIds: "Assignee IDs",
};

function todayIso() { return new Date().toISOString().slice(0,10); }
function firstOfMonthIso() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); }
function firstOfYearIso() { const d = new Date(); d.setMonth(0,1); return d.toISOString().slice(0,10); }
function loadLastExportTo() { return localStorage.getItem("digileave:lastExportTo") || null; }
function saveLastExportTo(dateIso) { localStorage.setItem("digileave:lastExportTo", dateIso); }

function overlaps(req, fromIso, toIso) {
  if (!fromIso && !toIso) return true;
  const s = req.startDate;
  const e = req.endDate;
  if (fromIso && e < fromIso) return false;
  if (toIso && s > toIso) return false;
  return true;
}

export default function ExportMenu({ onClose }) {
  const [role, setRole] = useState(null);
  const [dataset, setDataset] = useState("REQUESTS");

  const [assignees, setAssignees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  const [preset, setPreset] = useState(PRESETS.LAST_TO_NOW);
  const [fromDate, setFromDate] = useState(() => loadLastExportTo() || firstOfMonthIso());
  const [toDate, setToDate] = useState(() => todayIso());

  const [requestFields, setRequestFields] = useState(REQUEST_FIELDS_DEFAULT);
  const [userFields, setUserFields] = useState(USER_FIELDS_DEFAULT);

  const [sortBy, setSortBy] = useState("startDate");
  const [sortDir, setSortDir] = useState("asc");

  const [format, setFormat] = useState("CSV");

  useEffect(() => {
    (async () => {
      const r = await fetch(`${BASE_API_URL}/account`, { headers: authHeader() });
      if (!r.ok) return;
      const me = await r.json();
      setRole(me.role);
    })();
  }, []);

  useEffect(() => {
    if (!role) return;
    const fetchForRequests = async () => {
      const [assigneesRes, requestsRes] = await Promise.all([
        fetch(`${BASE_API_URL}/approver/assignees`, { headers: authHeader() }),
        fetch(`${BASE_API_URL}/approver/requests`, { headers: authHeader() }),
      ]);
      if (assigneesRes.ok) setAssignees(await assigneesRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
    };
    const fetchForUsers = async () => {
      if (role === "ADMIN") {
        const res = await fetch(`${BASE_API_URL}/admin/users`, { headers: authHeader() });
        if (res.ok) setAdminUsers(await res.json());
      } else {
        const res = await fetch(`${BASE_API_URL}/approver/assignees`, { headers: authHeader() });
        if (res.ok) setAdminUsers(await res.json());
      }
    };
    fetchForRequests();
    fetchForUsers();
  }, [role]);

  useEffect(() => {
    if (preset === PRESETS.LAST_TO_NOW) {
      const last = loadLastExportTo();
      setFromDate(last || firstOfMonthIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.THIS_MONTH) {
      setFromDate(firstOfMonthIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.THIS_YEAR) {
      setFromDate(firstOfYearIso());
      setToDate(todayIso());
    } else if (preset === PRESETS.ALL) {
      setFromDate("");
      setToDate("");
    }
  }, [preset]);

  const requestRows = useMemo(() => {
    const byId = new Map(assignees.map(u => [u.id, u]));
    const rows = requests
      .filter(r => overlaps(r, fromDate || null, toDate || null))
      .map(r => {
        const u = byId.get(r.userId);
        const decidedByUser = r.decidedByUserId ? byId.get(r.decidedByUserId) : null;
        return {
          requestId: r.id,
          assigneeId: r.userId,
          assigneeName: u?.fullName || r.userId,
          assigneeEmail: u?.email || "",
          startDate: r.startDate,
          endDate: r.endDate,
          workdaysCount: r.workdaysCount,
          status: r.status,
          type: r.type,
          comment: r.comment || "",
          decidedBy: decidedByUser?.fullName || r.decidedByUserId || "",
          decidedAt: r.decidedAt || "",
        };
      });

    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * dir;
    });

    return rows;
  }, [assignees, requests, fromDate, toDate, sortBy, sortDir]);

  const userRows = useMemo(() => {
    return [...adminUsers]
      .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
      .map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        availableLeaveDays: u.availableLeaveDays,
        contractLeaveDays: u.contractLeaveDays,
        workingSince: u.workingSince,
        assigneeIds: Array.isArray(u.assigneeIds) ? u.assigneeIds : [],
      }));
  }, [adminUsers]);

  const onExport = async () => {
    const rows = dataset === "REQUESTS" ? requestRows : userRows;
    const fields = dataset === "REQUESTS" ? requestFields : userFields;
    const filenameBase = dataset === "REQUESTS" ? "requests-export" : "users-export";

    if (format === "CSV") {
      if (dataset === "REQUESTS" && toDate) saveLastExportTo(toDate);
      csvExport(rows, fields, `${filenameBase}.csv`, HEADERS);
    } else {
      await xlsxExport({
        rows,
        fields,
        headers: HEADERS,
        filename: `${filenameBase}.xlsx`,
      });
    }
  };

  const fieldsForUi = dataset === "REQUESTS" ? REQUEST_FIELDS_ALL : USER_FIELDS_ALL;
  const selectedFields = dataset === "REQUESTS" ? requestFields : userFields;
  const setSelectedFields = dataset === "REQUESTS" ? setRequestFields : setUserFields;

  return (
    <div className="export-root" >
      <div className="export-head">
        <div>
          <div className="export-title">Export</div>
          <div className="export-sub">Choose dataset, fields, and format</div>
        </div>
        {onClose && <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>}
      </div>

      <div className="export-body" style={{ flex: "1 1 auto", overflowY: "auto", paddingRight: 8 }}>
        <section className="export-section">
          <div className="export-section__title">Choose Dataset</div>
          <div className="dataset-row">
            <label
              className={`dataset-card ${dataset === "REQUESTS" ? "dataset-card--active" : ""}`}
              onClick={() => setDataset("REQUESTS")}
            >
              <div className="dataset-card__main">Requests</div>
              <div className="dataset-card__sub">Leave request data</div>
            </label>
            <label
              className={`dataset-card ${dataset === "USERS" ? "dataset-card--active" : ""}`}
              onClick={() => setDataset("USERS")}
            >
              <div className="dataset-card__main">Users</div>
              <div className="dataset-card__sub">User information</div>
            </label>
          </div>
        </section>

        {dataset === "REQUESTS" && (
          <section className="export-section">
            <div className="export-section__title">Date Range</div>
            <div className="controls-row" style={{ alignItems: "center" }}>
              <select className="select" value={preset} onChange={(e)=>setPreset(e.target.value)}>
                <option value="LAST_TO_NOW">Last Export → Now (Default)</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="ALL">All</option>
              </select>
              <input className="input" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
              <input className="input" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
              <div className="meta">Includes any request that overlaps the selected range</div>
            </div>
          </section>
        )}

        <section className="export-section">
          <div className="export-section__title">Fields to Export</div>
          <div className="small-links" style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => setSelectedFields(fieldsForUi)}>Select All</button>
            <button type="button" onClick={() => setSelectedFields([])}>Clear All</button>
          </div>
          <div className="chips">
            {fieldsForUi.map((f) => {
              const checked = selectedFields.includes(f);
              return (
                <label key={f} className="chip">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) setSelectedFields(selectedFields.filter(x => x !== f));
                      else setSelectedFields([...selectedFields, f]);
                    }}
                  />
                  {HEADERS[f] || f}
                </label>
              );
            })}
          </div>
        </section>

        <section className="export-section">
          <div className="export-section__title">File Format</div>
          <div className="controls-row">
            <select className="select" value={format} onChange={(e)=>setFormat(e.target.value)}>
              <option value="CSV">CSV (.csv)</option>
              <option value="XLSX">Excel (.xlsx) — styled</option>
            </select>
          </div>
        </section>
      </div>

      <div className="export-footer" style={{ flex: "0 0 auto", paddingTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-primary" onClick={onExport}>
          Export {format === "CSV" ? "CSV" : "Excel"}
        </button>
        <div className="meta">
          Role: {role || "…"} · Rows: {dataset === "REQUESTS" ? requestRows.length : userRows.length}
        </div>
      </div>
    </div>
  );
}
