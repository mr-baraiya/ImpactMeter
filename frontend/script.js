/* global Chart */

const playerSelect = document.getElementById("playerSelect");
const statusMsg = document.getElementById("statusMsg");

const impactScoreValue = document.getElementById("impactScoreValue");
const gaugeFill = document.getElementById("gaugeFill");
const gaugeCanvas = document.getElementById("gaugeChart");

const breakRuns = document.getElementById("breakRuns");
const breakStrikeRate = document.getElementById("breakStrikeRate");
const breakContext = document.getElementById("breakContext");
const breakPressure = document.getElementById("breakPressure");
const breakClutch = document.getElementById("breakClutch");
const breakFinal = document.getElementById("breakFinal");

const phasePowerplay = document.getElementById("phasePowerplay");
const phaseMiddle = document.getElementById("phaseMiddle");
const phaseDeath = document.getElementById("phaseDeath");
const phasePowerplayBar = document.getElementById("phasePowerplayBar");
const phaseMiddleBar = document.getElementById("phaseMiddleBar");
const phaseDeathBar = document.getElementById("phaseDeathBar");

const rankingTableBody = document.getElementById("rankingTableBody");

const compareASelect = document.getElementById("compareASelect");
const compareBSelect = document.getElementById("compareBSelect");
const compareAScore = document.getElementById("compareAScore");
const compareBScore = document.getElementById("compareBScore");

let playerScores = [];
let impactDataset = [];
let trendChart = null;
let compareTrendChart = null;
let distributionChart = null;
let gaugeChart = null;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseCSV(text) {
  const rows = [];
  let cur = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (c === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }

    if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cur);
      cur = "";
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cur += c;
  }

  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] || "").trim();
    });
    return obj;
  });
}

async function fetchCsvFromPaths(paths) {
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const text = await res.text();
        return parseCSV(text);
      }
    } catch (_err) {
      // Try next path.
    }
  }
  return [];
}

function groupMeanByPlayer(rows) {
  const map = new Map();

  rows.forEach((r) => {
    const player = r.player;
    const score = toNumber(r.IM_score ?? r.impact_score, 0);
    if (!map.has(player)) {
      map.set(player, { sum: 0, count: 0 });
    }
    const item = map.get(player);
    item.sum += score;
    item.count += 1;
  });

  return [...map.entries()]
    .map(([player, v]) => ({
      player,
      impact: v.count > 0 ? v.sum / v.count : 0
    }))
    .sort((a, b) => b.impact - a.impact);
}

function latestPlayerScore(playerRows) {
  const sorted = [...playerRows].sort((a, b) => {
    const da = new Date(a.match_date || "1970-01-01").getTime();
    const db = new Date(b.match_date || "1970-01-01").getTime();
    if (da !== db) return da - db;
    return toNumber(a.match_id) - toNumber(b.match_id);
  });

  return sorted[sorted.length - 1] || null;
}

function updateGauge(score) {
  const clamped = Math.max(0, Math.min(100, score));
  impactScoreValue.textContent = clamped.toFixed(1);
  gaugeFill.style.width = `${clamped}%`;

  if (!gaugeChart) {
    gaugeChart = new Chart(gaugeCanvas, {
      type: "doughnut",
      data: {
        labels: ["Score", "Remaining"],
        datasets: [
          {
            data: [clamped, 100 - clamped],
            backgroundColor: ["#0B6E4F", "#E5E7EB"],
            borderWidth: 0,
            cutout: "75%"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  } else {
    gaugeChart.data.datasets[0].data = [clamped, 100 - clamped];
    gaugeChart.update();
  }
}

function buildTrend(points) {
  const labels = points.map((_, idx) => `${idx + 1}`);
  const data = points.map((p) => toNumber(p.IM_score ?? p.impact_score, 0));

  if (trendChart) {
    trendChart.destroy();
  }

  const ctx = document.getElementById("trendChart");
  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Impact Score",
          data,
          borderColor: "#0B6E4F",
          backgroundColor: "rgba(11, 110, 79, 0.15)",
          pointBackgroundColor: "#F39C12",
          pointRadius: 3,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100
        }
      }
    }
  });
}

function computeBreakdown(player, matchId, finalImpact) {
  const rows = impactDataset.filter(
    (r) => r.player === player && String(r.match_id) === String(matchId)
  );

  if (rows.length === 0) {
    breakRuns.textContent = "-";
    breakStrikeRate.textContent = "-";
    breakContext.textContent = "-";
    breakPressure.textContent = "-";
    breakClutch.textContent = "-";
    breakFinal.textContent = finalImpact.toFixed(1);
    return;
  }

  const phaseWeight = { powerplay: 1.1, middle: 1.0, death: 1.4 };

  const totals = rows.reduce(
    (acc, r) => {
      const runs = toNumber(r.runs_scored, 0);
      const strikeRate = toNumber(r.strike_rate, 0);
      const pressure = toNumber(r.pressure_index, 0.5);
      const phase = (r.phase || "middle").toLowerCase();
      const isDeath = phase === "death" ? 1.2 : 1.0;

      acc.runs += runs * 0.6;
      acc.strike += strikeRate * 0.2;
      acc.context += (phaseWeight[phase] || 1.0);
      acc.pressure += pressure;
      acc.clutch += pressure * isDeath;
      return acc;
    },
    { runs: 0, strike: 0, context: 0, pressure: 0, clutch: 0 }
  );

  const n = rows.length;
  breakRuns.textContent = (totals.runs / n).toFixed(2);
  breakStrikeRate.textContent = (totals.strike / n).toFixed(2);
  breakContext.textContent = (totals.context / n).toFixed(2);
  breakPressure.textContent = ((totals.pressure / n) * 20).toFixed(2);
  breakClutch.textContent = (totals.clutch / n).toFixed(2);
  breakFinal.textContent = finalImpact.toFixed(1);
}

function computePhaseContribution(player) {
  const rows = impactDataset.filter((r) => r.player === player);

  if (rows.length === 0) {
    phasePowerplay.textContent = "0%";
    phaseMiddle.textContent = "0%";
    phaseDeath.textContent = "0%";
    phasePowerplayBar.style.width = "0%";
    phaseMiddleBar.style.width = "0%";
    phaseDeathBar.style.width = "0%";
    return;
  }

  const phaseWeight = { powerplay: 1.1, middle: 1.0, death: 1.4 };
  const totals = { powerplay: 0, middle: 0, death: 0 };

  rows.forEach((r) => {
    const runs = toNumber(r.runs_scored, 0);
    const strikeRate = toNumber(r.strike_rate, 0);
    const batterImpact = toNumber(r.batter_impact_score, 0);
    const bowlerImpact = toNumber(r.bowler_impact_score, 0);
    const wickets = toNumber(r.wickets_taken, 0);
    const pressure = toNumber(r.pressure_index, 0.5);
    const phase = (r.phase || "middle").toLowerCase();

    const perfBat = runs * 0.6 + strikeRate * 0.2 + batterImpact * 0.2;
    const perfBowl = bowlerImpact * 0.7 + wickets * 10;
    const combined = 0.6 * perfBat + 0.4 * perfBowl;
    const ctx = (phaseWeight[phase] || 1.0) * (1 + pressure);
    const raw = combined * ctx;

    if (!totals[phase]) totals[phase] = 0;
    totals[phase] += raw;
  });

  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const p = ((totals.powerplay || 0) / sum) * 100;
  const m = ((totals.middle || 0) / sum) * 100;
  const d = ((totals.death || 0) / sum) * 100;

  phasePowerplay.textContent = `${p.toFixed(1)}%`;
  phaseMiddle.textContent = `${m.toFixed(1)}%`;
  phaseDeath.textContent = `${d.toFixed(1)}%`;

  phasePowerplayBar.style.width = `${p}%`;
  phaseMiddleBar.style.width = `${m}%`;
  phaseDeathBar.style.width = `${d}%`;
}

function renderRankingTable(rows) {
  const top = rows.slice(0, 10);
  rankingTableBody.innerHTML = top
    .map(
      (r, idx) => `
      <tr class="border-b border-slate-100">
        <td class="py-2 pr-2">${idx + 1}</td>
        <td class="py-2 pr-2">${r.player}</td>
        <td class="py-2 text-right font-semibold">${r.impact.toFixed(1)}</td>
      </tr>`
    )
    .join("");
}

function renderPlayer(player) {
  const rows = playerScores
    .filter((r) => r.player === player)
    .sort((a, b) => {
      const da = new Date(a.match_date || "1970-01-01").getTime();
      const db = new Date(b.match_date || "1970-01-01").getTime();
      if (da !== db) return da - db;
      return toNumber(a.match_id) - toNumber(b.match_id);
    });

  if (rows.length === 0) return;

  const latest = latestPlayerScore(rows);
  const latestImpact = toNumber(latest.IM_score ?? latest.impact_score, 0);

  updateGauge(latestImpact);
  buildTrend(rows.slice(-10));
  computeBreakdown(player, latest.match_id, latestImpact);
  computePhaseContribution(player);
}

function getPlayerRecentSeries(player, n = 10) {
  return playerScores
    .filter((r) => r.player === player)
    .sort((a, b) => {
      const da = new Date(a.match_date || "1970-01-01").getTime();
      const db = new Date(b.match_date || "1970-01-01").getTime();
      if (da !== db) return da - db;
      return toNumber(a.match_id) - toNumber(b.match_id);
    })
    .slice(-n)
    .map((r) => toNumber(r.IM_score ?? r.impact_score, 0));
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function renderComparison() {
  const a = compareASelect.value;
  const b = compareBSelect.value;
  const aSeries = getPlayerRecentSeries(a, 10);
  const bSeries = getPlayerRecentSeries(b, 10);

  compareAScore.textContent = mean(aSeries).toFixed(1);
  compareBScore.textContent = mean(bSeries).toFixed(1);

  const maxLen = Math.max(aSeries.length, bSeries.length, 10);
  const labels = Array.from({ length: maxLen }, (_, i) => `${i + 1}`);

  if (compareTrendChart) compareTrendChart.destroy();
  compareTrendChart = new Chart(document.getElementById("compareTrendChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: a,
          data: aSeries,
          borderColor: "#0B6E4F",
          backgroundColor: "rgba(11, 110, 79, 0.10)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2
        },
        {
          label: b,
          data: bSeries,
          borderColor: "#F39C12",
          backgroundColor: "rgba(243, 156, 18, 0.10)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { y: { min: 0, max: 100 } }
    }
  });
}

function renderDistribution(rankingRows) {
  const bins = Array.from({ length: 10 }, () => 0);
  rankingRows.forEach((r) => {
    const score = Math.max(0, Math.min(99.999, r.impact));
    const idx = Math.floor(score / 10);
    bins[idx] += 1;
  });

  const labels = [
    "0-10", "10-20", "20-30", "30-40", "40-50",
    "50-60", "60-70", "70-80", "80-90", "90-100"
  ];

  if (distributionChart) distributionChart.destroy();
  distributionChart = new Chart(document.getElementById("distributionChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Players",
          data: bins,
          backgroundColor: "#0B6E4F"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

async function init() {
  statusMsg.textContent = "Loading data...";

  playerScores = await fetchCsvFromPaths([
    "../data/features/player_impact_scores.csv",
    "./data/features/player_impact_scores.csv",
    "/data/features/player_impact_scores.csv"
  ]);

  impactDataset = await fetchCsvFromPaths([
    "../data/features/impact_dataset.csv",
    "./data/features/impact_dataset.csv",
    "/data/features/impact_dataset.csv"
  ]);

  if (playerScores.length === 0) {
    statusMsg.textContent = "Could not load CSV files. Run a local server from project root (for example: python -m http.server 8000).";
    return;
  }

  const players = [...new Set(playerScores.map((r) => r.player))].sort((a, b) =>
    a.localeCompare(b)
  );

  playerSelect.innerHTML = players
    .map((p) => `<option value="${p}">${p}</option>`)
    .join("");

  compareASelect.innerHTML = players
    .map((p) => `<option value="${p}">${p}</option>`)
    .join("");

  compareBSelect.innerHTML = players
    .map((p) => `<option value="${p}">${p}</option>`)
    .join("");

  const defaultPlayer = players.find((p) => p.toLowerCase().includes("kohli")) || players[0];
  playerSelect.value = defaultPlayer;

  const ranking = groupMeanByPlayer(playerScores);
  renderRankingTable(ranking);
  renderDistribution(ranking);
  renderPlayer(defaultPlayer);

  compareASelect.value = defaultPlayer;
  compareBSelect.value = ranking[0]?.player || players[0];
  if (compareBSelect.value === compareASelect.value && players.length > 1) {
    compareBSelect.value = players[1];
  }
  renderComparison();

  playerSelect.addEventListener("change", (e) => {
    renderPlayer(e.target.value);
  });

  compareASelect.addEventListener("change", renderComparison);
  compareBSelect.addEventListener("change", renderComparison);

  statusMsg.textContent = `Loaded ${players.length} players.`;
}

init();
