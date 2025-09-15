import { gqlRequest } from "../api.js";

export async function loadRecentAuditsTable() {
  const host = document.getElementById("recent-audits");
  if (!host) return;

  const QUERY = `
    query {
      transaction(
        where: { type: { _in: ["up", "down"] } }
        order_by: { createdAt: desc }
        limit: 10
      ) {
        id
        type
        createdAt
        object { type name }
      }
    }
  `;

  try {
    const { transaction } = await gqlRequest(QUERY);

    const rows = (transaction ?? []).map(t => {
      const d = new Date(t.createdAt);
      const date = d.toLocaleString(undefined, {
        year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
      const dir = t.type === "up" ? "↑ Up" : "↓ Down";
      const dirClass = t.type === "up" ? "badge-up" : "badge-down";
      const activityType = t.object?.type ?? "—";
      const activityName = t.object?.name ?? "—";
      return `
        <tr>
          <td>${date}</td>
          <td><span class="badge ${dirClass}">${dir}</span></td>
          <td>${activityType}</td>
          <td>${activityName}</td>
        </tr>
      `;
    }).join("");

    host.innerHTML = `
      <div class="card">
        <div class="card-title">Recent Audits</div>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Direction</th>
              <th>Activity type</th>
              <th>Activity name</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    // minimal styles scoped to this widget
    const styleId = "recent-audits-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
#recent-audits .card-title {
  font-weight: 600;
  margin-bottom: 8px;
}

#recent-audits table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: #111827;   /* unified row/table background */
  border-radius: 8px;
  overflow: hidden;
}

#recent-audits th,
#recent-audits td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

#recent-audits th {
  font-weight: 600;
  text-align: left;
  color: #cbd5e1;
  background: #1f2937;   /* header background stays as-is */
}

#recent-audits .badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

#recent-audits .badge-up {
  background: #064e3b;
  color: #34d399;
}

#recent-audits .badge-down {
  background: #3f1d1d;
  color: #fca5a5;
}

      `;
      document.head.appendChild(style);
    }
  } catch (err) {
    console.error("RecentAudits query failed:", err);
    host.textContent = "Failed to load recent audits.";
  }
}
