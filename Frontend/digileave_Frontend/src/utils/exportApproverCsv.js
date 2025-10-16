import { authHeader } from "./auth";
import { csvExport } from "./csvExport";
import { BASE_API_URL } from "../utils/base_api_url";


export async function exportApproverRequestsCsv() {
  // 1) fetch assignees + requests in parallel
  const [assigneesRes, requestsRes] = await Promise.all([
    fetch(`${BASE_API_URL}/approver/assignees`, { headers: authHeader() }),
    fetch(`${BASE_API_URL}/approver/requests`, { headers: authHeader() }),
  ]);

  if (!assigneesRes.ok) throw new Error("Failed to fetch assignees");
  if (!requestsRes.ok) throw new Error("Failed to fetch requests");

  const assignees = await assigneesRes.json(); // [{id, fullName, email, ...}]
  const requests  = await requestsRes.json();  // [{id, userId, startDate, ...}]

  // 2) build a quick map for user lookup
  const byId = new Map(assignees.map(u => [u.id, u]));

  // 3) shape rows for CSV (only a few readable columns)
  const rows = requests.map(r => {
    const u = byId.get(r.userId);
    return {
      assigneeName:  u?.fullName || r.userId,
      assigneeEmail: u?.email || "",
      startDate:     r.startDate,        // yyyy-MM-dd (from your API)
      endDate:       r.endDate,
      workdaysCount: r.workdaysCount,
      status:        r.status,
      type:          r.type,
      comment:       r.comment || "",
      decidedBy:     (byId.get(r.decidedByUserId)?.fullName) || r.decidedByUserId || "",
      decidedAt:     r.decidedAt || "",
      requestId:     r.id
    };
  });

  // 4) choose columns + pretty headers
  const fields = [
    "assigneeName",
    "assigneeEmail",
    "startDate",
    "endDate",
    "workdaysCount",
    "status",
    "type",
    "comment",
    "decidedBy",
    "decidedAt",
    "requestId",
  ];

  const headers = {
    assigneeName:  "Assignee Name",
    assigneeEmail: "Assignee Email",
    startDate:     "Start Date",
    endDate:       "End Date",
    workdaysCount: "Workdays",
    status:        "Status",
    type:          "Type",
    comment:       "Comment",
    decidedBy:     "Decided By",
    decidedAt:     "Decided At (UTC)",
    requestId:     "Request ID",
  };

  // 5) download
  csvExport(rows, fields, "approver-requests.csv", headers);
}
