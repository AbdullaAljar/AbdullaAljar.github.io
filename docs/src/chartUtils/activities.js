import { gqlRequest } from "../api.js";

export async function loadRecentActivities() {
  const QUERY = `
    query {
      transaction(order_by: {createdAt: desc}, limit: 10) {
        id
        type
        createdAt
        object { type name }
      }
    }
  `;

  let data;
  try {
    data = await gqlRequest(QUERY);
  } catch (e) {
    console.error("Recent activities query failed:", e);
    const host = document.getElementById("recent-activities");
    if (host) host.textContent = "Failed to load recent activities.";
    return;
  }

  const rows = (data?.transaction ?? []).map(t => ({
    date: formatDate(t.createdAt),
    txType: t.type || "-",
    activityType: t.object?.type || "-",
    activityName: t.object?.name || "-"
  }));

  const host = document.getElementById("recent-activities");
  if (!host) return;

  host.innerHTML = `
    <div class="card-title">Recent Activities</div>
    <table class="mini-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Transaction</th>
          <th>Activity Type</th>
          <th>Activity Name</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.date}</td>
            <td>${r.txType}</td>
            <td>${r.activityType}</td>
            <td>${r.activityName}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

// Inject minimal, scoped styles for the Recent Activities table
// Mirrors the approach used in recentAudits.js so changes actually apply
const styleIdActivities = "recent-activities-styles";
if (!document.getElementById(styleIdActivities)) {
  const style = document.createElement("style");
  style.id = styleIdActivities;
  style.textContent = `
#recent-activities .card-title {
  font-weight: 600;
  margin-bottom: 8px;
}

#recent-activities table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: #111827;   /* unified row/table background */
  border-radius: 8px;
  overflow: hidden;
}

#recent-activities th,
#recent-activities td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

#recent-activities th {
  font-weight: 600;
  text-align: left;
  color: #cbd5e1;
  background: #1f2937;   /* header background */
}
  `;
  document.head.appendChild(style);
}
