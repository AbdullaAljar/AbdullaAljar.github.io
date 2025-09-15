import { gqlRequest } from '../api.js';

export async function loadAuditRatioChart(userId) {
  const auditRatioQuery = `
    query {
      user {
        id
      }
      audit {
        id
        auditorId
        groupId
        createdAt
      }
      group_user {
        groupId
        userId
      }
      transaction {
        id
        userId
        type
        amount
        objectId
      }
    }
  `;

  let data;
  try {
    data = await gqlRequest(auditRatioQuery);
  } catch (err) {
    console.error("Error fetching audit ratio data:", err);
    return;
  }

  // Defensive: check if data and data.user exist
  if (!data || !data.user) {
    console.error("User data not found in response");
    return;
  }

  // user may be an array or object
  let actualUserId;
  if (Array.isArray(data.user)) {
    if (data.user.length === 0 || !data.user[0].id) {
      console.error("User data not found in response");
      return;
    }
    actualUserId = data.user[0].id;
  } else if (data.user.id) {
    actualUserId = data.user.id;
  } else {
    console.error("User data not found in response");
    return;
  }

  // If userId was not passed, use the one from the API
  if (!userId) {
    userId = actualUserId;
  }

  // Transactions where YOU reviewed others
  const upTx = Array.isArray(data.transaction)
    ? data.transaction.filter(tx => tx.userId === userId && tx.type === "up")
    : [];

  // Transactions where YOU were reviewed (someone audited a group you were in)
  const myGroupIds = Array.isArray(data.group_user)
    ? data.group_user.filter(gu => gu.userId === userId).map(gu => gu.groupId)
    : [];

  const downTx = Array.isArray(data.transaction)
    ? data.transaction.filter(tx => myGroupIds.includes(tx.objectId) && tx.type === "down")
    : [];

  const auditsGiven = Array.isArray(data.audit)
    ? data.audit.filter(a => a.auditorId === userId)
    : [];

  const auditsReceived = Array.isArray(data.audit)
    ? data.audit.filter(a => myGroupIds.includes(a.groupId))
    : [];

  const totalXpGiven = upTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const totalXpReceived = downTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Example: Display the results in the DOM (optional, can be customized)
  const auditRatioElement = document.getElementById("audit-ratio");
  if (auditRatioElement) {
    auditRatioElement.innerHTML = `
      <ul>
        <li><strong>Audits Given:</strong> ${auditsGiven.length}</li>
        <li><strong>Audits Received:</strong> ${auditsReceived.length}</li>
        <li><strong>Total XP Given:</strong> ${totalXpGiven}</li>
        <li><strong>Total XP Received:</strong> ${totalXpReceived}</li>
      </ul>
    `;
  }

  // Example: after fetching your data
  const auditArray = data.audit || [];
  const transactionArray = data.transaction || [];

  // XP logs
  const xpTransactions = transactionArray.filter(tx => tx.type === 'xp' && tx.userId === userId);
  const upTransactions = transactionArray.filter(tx => tx.type === 'up' && tx.userId === userId);
  const downTransactions = transactionArray.filter(tx => tx.type === 'down' && tx.userId === userId);

  const totalXP = xpTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalUp = upTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const totalDown = downTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // --- tiny SVG bar chart (Up vs Down) ---
const svgHost = document.getElementById('audit-ratio-svg');
if (svgHost) {
  // Simplified: render once using a fixed viewBox, let CSS scale the SVG
  const up = Math.max(0, totalUp);
  const down = Math.max(0, totalDown);
  const maxVal = Math.max(up, down, 1);

  // Fixed coordinate system for simplicity
  const W = 800, H = 410;
  const padT = 36, padB = 28, padL = 48, padR = 48;
  const innerW = W - padL - padR;
  const baseline = H - padB;
  const topGap = 24;           // small gap above tallest bar
  const effectiveH = (H - padT - padB - topGap);
  const upH = Math.round((up / maxVal) * effectiveH);
  const downH = Math.round((down / maxVal) * effectiveH);
  const gap = 80;              // space between bars
  const barW = 140;            // bar width
  const textOffset = 25;       // label offset inside bar (slightly lower)

  const fmtKB = v => `${Math.round(v / 1000)}kB`;

  svgHost.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-label="Audit XP Up vs Down" shape-rendering="crispEdges">
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="#1f2937"/>
  <text x="${W/2}" y="${padT - 6}" text-anchor="middle" font-size="25" font-weight="700" fill="#e5e7eb">XP: Up vs Down</text>

  <!-- axis -->
  <rect x="${padL}" y="${baseline - 1}" width="${innerW}" height="2" fill="#9ca3af"/>

  <!-- Up bar -->
  <rect x="${W/2 - gap/2 - barW}" y="${baseline - upH}" width="${barW}" height="${upH}" rx="8" fill="#60a5fa"/>
  <text x="${W/2 - gap/2 - barW/2}" y="${baseline - upH + textOffset}" text-anchor="middle" font-size="20" font-weight="700" fill="#000000ff">${fmtKB(up)}</text>
  <text x="${W/2 - gap/2 - barW/2}" y="${baseline + 20}" text-anchor="middle" font-size="20" fill="#e5e7eb">Up</text>

  <!-- Down bar -->
  <rect x="${W/2 + gap/2}" y="${baseline - downH}" width="${barW}" height="${downH}" rx="8" fill="#60a5fa"/>
  <text x="${W/2 + gap/2 + barW/2}" y="${baseline - downH + textOffset}" text-anchor="middle" font-size="20" font-weight="700" fill="#000000ff">${fmtKB(down)}</text>
  <text x="${W/2 + gap/2 + barW/2}" y="${baseline + 20}" text-anchor="middle" font-size="20" fill="#e5e7eb">Down</text>
</svg>`;
}

  const totalXP_KB = (totalXP / 1_000).toFixed(1);
  const totalUp_KB = (totalUp / 1_000).toFixed(1);
  const totalDown_KB = (totalDown / 1_000).toFixed(1);
  const ratio = (totalUp_KB / totalDown_KB).toFixed(1);

  console.log("XP transactions count:", xpTransactions.length, "Total XP:", totalXP_KB, "KB");
  console.log("'Up' transactions count:", upTransactions.length, "Total Up:", totalUp_KB, "KB");
  console.log("'Down' transactions count:", downTransactions.length, "Total Down:", totalDown_KB, "KB");
  console.log("Ratio:", ratio);

  const summaryDiv = document.getElementById("audit-ratio-summary");
  if (summaryDiv) {
    // Format values as kB (divide by 1000, show 0 decimals)
    const doneKB = (totalUp / 1000).toFixed(0);
    const receivedKB = (totalDown / 1000).toFixed(0);
    const ratioValue = (totalUp / (totalDown || 1)).toFixed(1);

    // Choose a message based on ratio
    let message = "Keep going!";
    let color = "#1abc9c";
    let emoji = "";
    if (ratioValue >= 1.2) {
      message = "Outstanding work";
      color = "#27ae60";
      emoji = "🌟";
    } else if (ratioValue >= 1) {
      message = "Great job";
      color = "#2ecc71";
      emoji = "👍";
    } else if (ratioValue >= 0.8) {
      message = "Good effort";
      color = "#f1c40f";
      emoji = "💪";
    } else {
      message = "Needs improvement";
      color = "#e67e22";
      emoji = "🔄";
    }

    summaryDiv.innerHTML = `
      <div class="audit-summary">
        <div class="hdr">Audit Ratio</div>
        <div class="val" style="color:${color}">${ratioValue}</div>
        <div class="msg">${message} <span class="icon">${emoji}</span></div>
        <div class="metrics">
          <div class="m up">
            <div class="label">↑ Done</div>
            <div class="num">${doneKB} kB</div>
          </div>
          <div class="m down">
            <div class="label">↓ Received</div>
            <div class="num">${receivedKB} kB</div>
          </div>
        </div>
      </div>
    `;
    // Scoped styles for the summary panel so it stays compact and fills the tile
    const sumStyleId = 'audit-summary-compact-styles';
    if (!document.getElementById(sumStyleId)) {
      const s = document.createElement('style');
      s.id = sumStyleId;
      s.textContent = `
        #audit-ratio-summary { display:flex; }
        #audit-ratio-summary .audit-summary {
          width:100%; box-sizing:border-box;
          background:#1f2937; color:#e5e7eb; border-radius:12px;
          padding:14px 16px; display:flex; flex-direction:column; justify-content:center;
        }
        #audit-ratio-summary .hdr { font-weight:600; font-size:1rem; margin-bottom:4px; }
        #audit-ratio-summary .val { font-weight:800; font-size:clamp(1.6rem, 2.1vw, 2rem); line-height:1; margin-bottom:6px; }
        #audit-ratio-summary .msg { font-size:.9rem; opacity:.95; margin-bottom:8px; }
        #audit-ratio-summary .metrics { display:flex; gap:10px; align-items:flex-end; }
        #audit-ratio-summary .m { flex:1; min-width:120px; }
        #audit-ratio-summary .m.down { text-align:right; }
        #audit-ratio-summary .label { font-size:.85rem; color:#9cc2ff; }
        #audit-ratio-summary .m.up .label { color:#34d399; }
        #audit-ratio-summary .num { font-size:1rem; font-weight:700; }
      `;
      document.head.appendChild(s);
    }
    // Avoid forcing a fixed/percent height on the host to prevent overextending
    // remove legacy inline-margin constraints if present (safety)
    const panel = summaryDiv.firstElementChild;
    if (panel) { panel.style.margin = '0'; panel.style.maxWidth = 'none'; }
  }
}


  
