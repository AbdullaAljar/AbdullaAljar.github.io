import { gqlRequest } from "../api.js";

export async function loadXpPerProjectPodiumChart() {
  // 1) Fetch xp per project
  const XP_QUERY = `
    query {
      transaction(
        where: {
          _and: [
            { type: { _eq: "xp" } },
            { object: { type: { _eq: "project" } } }
          ]
        }
      ) {
        amount
        object { name }
      }
    }
  `;

  let data;
  try {
    const res = await gqlRequest(XP_QUERY);
    data = Array.isArray(res.transaction) ? res.transaction : [];
  } catch (e) {
    console.error("Podium query failed:", e);
    return;
  }

  // 2) Aggregate XP per project and pick top 3
  const byProject = new Map();
  for (const t of data) {
    const name = t?.object?.name ?? "Unknown";
    const amt  = Number(t?.amount ?? 0);
    byProject.set(name, (byProject.get(name) || 0) + amt);
  }
  const top3 = [...byProject.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 3);

  const host = document.getElementById("xp-podium");
  if (!host) return;
  if (top3.length === 0) {
    host.textContent = "No project XP yet.";
    return;
  }

  // Ensure we always render 3 columns (pad if needed)
  while (top3.length < 3) top3.push({ name: "—", total: 0 });

  // Order for podium layout: left=3rd, center=1st, right=2nd
  const [first, second, third] = [...top3].sort((a,b)=>b.total-a.total);
  const podium = [third, first, second];

  // 3) Draw SVG podium sized to the card
  const render = () => {
    const rect = host.getBoundingClientRect();
    const W = Math.max(640, Math.floor(rect.width || 760));
    const H = Math.max(320, Math.floor(rect.height || 420));

    const pad = { t: 40, r: 24, b: 32, l: 24 };
    const colW = Math.max(160, Math.round(W * 0.22));
    const gap = Math.max(32, Math.round(W * 0.05));
    const baseY = H - pad.b;                 // ground line
    const max = Math.max(1, first.total);    // scale

    // heights with proportional scaling + step feel
    const scale = v => 90 + (v / max) * 110; // min 90, max ~200
    const heights = [
      Math.max(70, scale(podium[0].total)),  // third (left)
      Math.max(90, scale(podium[1].total)),  // first (center) tallest
      Math.max(80, scale(podium[2].total))   // second (right)
    ];

    // Center the three columns group within the inner width
    const innerW = W - pad.l - pad.r;
    const groupW = colW * 3 + gap * 2;
    const startX = pad.l + Math.max(0, Math.floor((innerW - groupW) / 2));
    const xLeft   = startX;
    const xCenter = startX + colW + gap;
    const xRight  = startX + (colW + gap) * 2;
    const xs = [xLeft, xCenter, xRight];

    const fills = ["#cd7f32", "#f1c40f", "#bdc3c7"]; // bronze, gold, silver
    const stroke = "#0f172a";

    const kB = n => `${(n/1000).toFixed(0)} kB`;

    host.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-label="Top 3 XP per project">
  <rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#1f2937"/>
  <text x="${W/2}" y="22" text-anchor="middle" font-size="16" font-weight ="700" fill="#e5e7eb" font-weight="600">
    Top 3 XP per Project
  </text>

  <!-- ground line -->
  <line x1="${pad.l}" y1="${baseY}" x2="${W-pad.r}" y2="${baseY}" stroke="#374151" stroke-width="2"/>

  ${podium.map((d, i) => {
    const h = heights[i];
    const x = xs[i];
    const y = baseY - h;
    const labelY = y - 10;
    const name = d.name;
    const val = kB(d.total);
    const place = i === 0 ? "3" : i === 1 ? "1" : "2";
    const txtX = x + colW/2;

    return `
      <!-- value label above -->
      <text x="${txtX}" y="${labelY}" text-anchor="middle" font-size="12" fill="#e5e7eb">
        ${name} • ${val}
      </text>

      <!-- podium block -->
      <rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="10"
            fill="${fills[i]}" stroke="${stroke}" stroke-width="3"/>

      <!-- place number -->
      <text x="${txtX}" y="${y + h/2}" text-anchor="middle" font-size="28" fill="#111827" font-weight="700">
        ${place}
      </text>
    `;
  }).join("")}
</svg>`;
    const svg = host.querySelector('svg');
    if (svg) { svg.style.display = 'block'; svg.style.width = '100%'; svg.style.height = '100%'; }
  };

  // Initial render + observe host size to keep in sync with card
  render();
  try { new ResizeObserver(() => render()).observe(host); } catch {}
}
