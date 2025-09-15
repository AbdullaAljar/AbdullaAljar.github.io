import { gqlRequest } from "../api.js";


export async function loadSkillsHistogram() {

    const SKILLS_QUERY = `

    query {
    transaction(where: { type: { _ilike: "%skill%" } }) {
        id
        type
        amount
    }
    }
    `

    const {transaction} = await gqlRequest(SKILLS_QUERY);

    //name (remove redundant "skills_"_
    const sums = new  Map();
    for (const {type, amount} of transaction) {
        const raw = String(type  || "");
        const name = raw.startsWith('skill_') ? raw.slice(6) : raw;
        sums.set(name, (sums.get(name) || 0) + (amount || 0));
    }

    //order by desc
    const data = Array.from(sums, ([skill, total]) => ({ skill, total }))
        .sort((a, b) => b.total - a.total);
    const top = data;


    //draw a horizontal bar chart/ histogram
    const host = document.getElementById('skills-histogram');
    if (!host || !top.length) return;

    // Make the chart respond to the host's size so increasing the tile height
    // gives the bars more vertical space, similar to other responsive charts.
    const rect = host.getBoundingClientRect();
    const padL = 150, padR = 24, padT = 28, padB = 16;
    const minW = 720;
    const W = Math.max(minW, Math.floor(rect.width || minW));
    // Compute row height from available vertical space, with sensible clamps
    const availableH = Math.max(320, Math.floor((rect.height || 420)));
    const row = Math.max(22, Math.min(40, Math.floor((availableH - padT - padB) / Math.max(1, top.length))));
    const H = padT + padB + row * top.length;
    const maxV = Math.max(...top.map(d => d.total), 1);
    const x = v => padL + (v / maxV) * (W - padL - padR);
    const y = i => padT + i * row;
// view box without chart to give the border feeling
  host.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-label="Skills histogram">
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="#1f2937"/>
  <text x="${W/2}" y="18" text-anchor="middle" font-size="20" font-weight="700" fill="#e5e7eb">Skills (sum of amount)</text>

  ${top.map((d,i)=>`
    <text x="${padL-10}" y="${y(i)+17}" text-anchor="end" font-size="12" fill="#e5e7eb">${d.skill}</text>
    <rect x="${padL}" y="${y(i)+6}" width="${x(d.total)-padL}" height="16" rx="6" fill="#60a5fa"/>
    <text x="${x(d.total)+6}" y="${y(i)+17}" font-size="11" fill="#e5e7eb">${d.total}</text>
  `).join('')}
</svg>`;
}
