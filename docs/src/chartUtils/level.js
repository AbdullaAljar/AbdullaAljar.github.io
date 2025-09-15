import { gqlRequest } from "../api.js";

export async function loadLevelCard() {
  const LEVEL_QUERY = `
    query {
      transaction(
        where: { type: { _eq: "level" } }
        order_by: [{ amount: desc }]
        limit: 1
      ) {
        id
        type
        amount
        createdAt
        object {
          type
          name
        }
      }
    }
  `;

  const { transaction } = await gqlRequest(LEVEL_QUERY);
  if (!transaction.length) return;

  const { amount, createdAt, object } = transaction[0];

  // figure out time gap (calendar-aware months + remaining days)
  const created = new Date(createdAt);
  const now = new Date();

  function addMonths(d, m) {
    return new Date(d.getFullYear(), d.getMonth() + m, d.getDate());
  }
  function diffMonthsDays(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (addMonths(from, months) > to) months -= 1;
    const anchor = addMonths(from, months);
    const days = Math.max(0, Math.floor((to - anchor) / (1000 * 60 * 60 * 24)));
    return { months: Math.max(0, months), days };
  }
  const { months, days } = diffMonthsDays(created, now);

  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const agoParts = [];
  if (months > 0) agoParts.push(plural(months, 'month'));
  if (days > 0) agoParts.push(plural(days, 'day'));
  const agoText = agoParts.length ? `${agoParts.join(', ')} ago` : 'today';

  const recent = months < 1; // under a month considered recent
  const message = recent ? `Keep it up! 👍` : `Pick it up! 🔄`;
  const dateStr = created.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

  const host = document.getElementById("level-card");
  if (!host) return;

  host.innerHTML = `
    <div class="level-card">
      <div class="hdr">Current Level</div>
      <div class="val">${amount}</div>
      <p>Congratulations! You leveled up ${agoText} on <b>${dateStr}</b>
      by completing <b>${object?.name || "a project"}</b>.</p>
      <p>${message}</p>
    </div>
  `;

  // Scoped styles for the level card so the value appears in light blue
  const levelStyleId = 'level-card-styles';
  if (!document.getElementById(levelStyleId)) {
    const s = document.createElement('style');
    s.id = levelStyleId;
    s.textContent = `
      /* Host tile + inner panel to create a border like the audit summary */
      #level-card { display:flex; }
      #level-card .level-card {
        width:100%; box-sizing:border-box;
        background:#1f2937; color:#e5e7eb; border-radius:12px;
        padding:24px 28px; display:flex; flex-direction:column; justify-content:center;
      }
      #level-card .hdr { font-weight:700; font-size:1rem; color:#cbd5e1; margin:0 0 4px; }
      #level-card .val { font-weight:800; color: var(--brand, #60a5fa); line-height:1; margin:0 0 8px; font-size: clamp(1.8rem, 2.6vw, 2.4rem); }
      #level-card p { margin: 4px 0; }
    `;
    document.head.appendChild(s);
  }
}
