import { gqlRequest } from '../api.js';

export async function loadXpOverTimeChart() {
  const XP_QUERY = `
    query {
      transaction(
        where: { type: { _eq: "xp" } }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
      }
    }
  `;

  // Monday start (UTC) => "YYYY-MM-DD"
  const weekStartKeyUTC = (isoDateStrOrDate) => {
    const d0 = typeof isoDateStrOrDate === 'string' ? new Date(isoDateStrOrDate) : isoDateStrOrDate;
    const d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate()));
    const day = d.getUTCDay();                    // 0..6 (Sun..Sat)
    const offset = (day === 0 ? 6 : day - 1);     // 0 for Mon
    d.setUTCDate(d.getUTCDate() - offset);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  };

  const fmtWeekLabel = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d))
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  // ---- fetch ----
  const res = await gqlRequest(XP_QUERY);
  const txs = (res && res.transaction) || [];
  if (!txs.length) return;

  // ---- bucket by week ----
  const byWeek = new Map();
  for (const t of txs) {
    const key = weekStartKeyUTC(t.createdAt);
    byWeek.set(key, (byWeek.get(key) || 0) + (t.amount || 0));
  }

  // ---- build a COMPLETE weekly axis: first week -> current week ----
  const firstTx = new Date(txs[0].createdAt);
  const startKey = weekStartKeyUTC(firstTx);
  const endKey   = weekStartKeyUTC(new Date());   // this week

  // iterate weeks
  const weeks = [];
  {
    const [y, m, d] = startKey.split('-').map(Number);
    const cur = new Date(Date.UTC(y, m - 1, d));
    while (true) {
      const key = weekStartKeyUTC(cur);
      weeks.push(key);
      if (key === endKey) break;
      cur.setUTCDate(cur.getUTCDate() + 7);
    }
  }

  // ---- cumulative series on that full axis ----
  let running = 0;
  const series = weeks.map((wk) => {
    running += (byWeek.get(wk) || 0);
    return { wk, xp: running };
  });
  if (!series.length) return;

  // ---- render SVG ----
  const host = document.getElementById('xp-over-time-chart');
  if (!host) return;

  const W = 700, H = 260, pad = 36;
  const minX = 0, maxX = series.length - 1;
  const minY = 0, maxY = Math.max(...series.map(p => p.xp), 1);

  const xScale = i => pad + (i - minX) * (W - 2*pad) / Math.max(1,(maxX - minX));
  const yScale = v => H - pad - (v - minY) * (H - 2*pad) / Math.max(1,(maxY - minY));

  const pathD = series.map((p, i) => `${i ? 'L' : 'M'} ${xScale(i)} ${yScale(p.xp)}`).join(' ');
  const mid = Math.floor(series.length / 2);

  host.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-label="Cumulative XP by week">
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="#1f2937"/>
  <text x="${W/2}" y="22" text-anchor="middle" font-size="14" fill="#e5e7eb">XP Over Time (weekly, cumulative)</text>

  <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="#9ca3af" stroke-width="1"/>
  <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H-pad}" stroke="#9ca3af" stroke-width="1"/>

  <path d="M ${pad} ${H-pad} ${pathD} L ${xScale(maxX)} ${H-pad} Z" fill="rgba(99,179,237,0.18)"/>
  <path d="${pathD}" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"/>

  <text x="${xScale(0)}"    y="${H-pad+16}" font-size="11" fill="#e5e7eb" text-anchor="start">${fmtWeekLabel(series[0].wk)}</text>
  <text x="${xScale(mid)}"  y="${H-pad+16}" font-size="11" fill="#e5e7eb" text-anchor="middle">${fmtWeekLabel(series[mid].wk)}</text>
  <text x="${xScale(maxX)}" y="${H-pad+16}" font-size="11" fill="#e5e7eb" text-anchor="end">${fmtWeekLabel(series[maxX].wk)}</text>

  <text x="${pad-6}" y="${yScale(maxY)-4}" font-size="11" fill="#e5e7eb" text-anchor="end">${Math.round(maxY/1000)}kB</text>
</svg>`;
}
