/* global Chart */

const playerSelect = document.getElementById("playerSelect");
const playerDropdownList = document.getElementById("playerDropdownList");
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
const trendPlayerLabel = document.getElementById("trendPlayerLabel");
const trendTableBody = document.getElementById("trendTableBody");
const pressureIndexValue = document.getElementById("pressureIndexValue");
const pressureLevelBadge = document.getElementById("pressureLevelBadge");
const pressureIndexBar = document.getElementById("pressureIndexBar");
const highPressureShare = document.getElementById("highPressureShare");
const clutchScoreValue = document.getElementById("clutchScoreValue");
const clutchTag = document.getElementById("clutchTag");
const clutchScoreBar = document.getElementById("clutchScoreBar");
const clutchSummary = document.getElementById("clutchSummary");

const phasePowerplay = document.getElementById("phasePowerplay");
const phaseMiddle = document.getElementById("phaseMiddle");
const phaseDeath = document.getElementById("phaseDeath");
const phasePowerplayBar = document.getElementById("phasePowerplayBar");
const phaseMiddleBar = document.getElementById("phaseMiddleBar");
const phaseDeathBar = document.getElementById("phaseDeathBar");

const rankingTableBody = document.getElementById("rankingTableBody");

const compareASelect = document.getElementById("compareASelect");
const compareBSelect = document.getElementById("compareBSelect");
const compareADropdownList = document.getElementById("compareADropdownList");
const compareBDropdownList = document.getElementById("compareBDropdownList");
const compareAScore = document.getElementById("compareAScore");
const compareBScore = document.getElementById("compareBScore");

let playerScores = [];
let impactDataset = [];
let allPlayers = [];
let visiblePlayers = [];
let trendChart = null;
let compareTrendChart = null;
let distributionChart = null;
let gaugeChart = null;

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setDropdownItems(players) {
  visiblePlayers = players;

  if (players.length === 0) {
    playerDropdownList.innerHTML = '<li class="px-3 py-2 text-slate-500">No players found</li>';
    playerDropdownList.classList.remove("hidden");
    return;
  }

  playerDropdownList.innerHTML = players
    .map(
      (p) =>
        `<li><button type="button" class="w-full text-left px-3 py-2 hover:bg-slate-100" data-player="${escapeHtml(p)}">${escapeHtml(p)}</button></li>`
    )
    .join("");

  playerDropdownList.classList.remove("hidden");
}

function closePlayerDropdown() {
  playerDropdownList.classList.add("hidden");
}

function filterPlayers(query) {
  const q = query.trim().toLowerCase();
  if (!q) return allPlayers;
  return allPlayers.filter((p) => p.toLowerCase().includes(q));
}

function setupComboInput(inputEl, listEl, onSelect) {
  let visible = [];

  function close() {
    listEl.classList.add("hidden");
  }

  function setItems(players) {
    visible = players;

    if (players.length === 0) {
      listEl.innerHTML = '<li class="px-3 py-2 text-slate-500">No players found</li>';
      listEl.classList.remove("hidden");
      return;
    }

    listEl.innerHTML = players
      .map(
        (p) =>
          `<li><button type="button" class="w-full text-left px-3 py-2 hover:bg-slate-100" data-player="${escapeHtml(p)}">${escapeHtml(p)}</button></li>`
      )
      .join("");

    listEl.classList.remove("hidden");
  }

  function selectFromInput() {
    const typed = inputEl.value.trim().toLowerCase();
    if (!typed) return;

    const exact = allPlayers.find((p) => p.toLowerCase() === typed);
    const partial = allPlayers.find((p) => p.toLowerCase().includes(typed));
    const selected = exact || partial;
    if (!selected) return;

    inputEl.value = selected;
    close();
    onSelect(selected);
  }

  inputEl.addEventListener("focus", () => {
    setItems(filterPlayers(inputEl.value));
  });

  inputEl.addEventListener("input", () => {
    setItems(filterPlayers(inputEl.value));
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (visible.length > 0) {
        inputEl.value = visible[0];
      }
      selectFromInput();
    }
    if (e.key === "Escape") {
      close();
    }
  });

  listEl.addEventListener("click", (e) => {
    const target = e.target.closest("button[data-player]");
    if (!target) return;
    inputEl.value = target.dataset.player;
    close();
    onSelect(target.dataset.player);
  });

  document.addEventListener("click", (e) => {
    const withinPicker = e.target === inputEl || listEl.contains(e.target);
    if (!withinPicker) {
      close();
    }
  });

  return {
    close,
    selectFromInput
  };
}

function pickPlayerFromInput() {
  const typed = playerSelect.value.trim().toLowerCase();
  if (!typed) return;

  const exact = allPlayers.find((p) => p.toLowerCase() === typed);
  const partial = allPlayers.find((p) => p.toLowerCase().includes(typed));
  const selected = exact || partial;

  if (!selected) {
    statusMsg.textContent = `No player found for "${playerSelect.value.trim()}".`;
    return;
  }

  playerSelect.value = selected;
  renderPlayer(selected);
  closePlayerDropdown();
  statusMsg.textContent = `Loaded ${allPlayers.length} players.`;
}

function populatePlayerSelect(players, selectedPlayer) {
  if (players.length === 0) {
    playerSelect.value = "";
    return "";
  }

  visiblePlayers = players;

  const nextSelected = players.includes(selectedPlayer) ? selectedPlayer : players[0];
  playerSelect.value = nextSelected;
  return nextSelected;
}

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

function renderTrendTable(points) {
  trendTableBody.innerHTML = points
    .map((point, idx) => {
      const score = toNumber(point.IM_score ?? point.impact_score, 0);
      return `
        <tr class="border-b border-slate-100">
          <td class="py-2 px-3">Match${idx + 1}</td>
          <td class="py-2 px-3 text-right font-semibold">${score.toFixed(1)}</td>
        </tr>`;
    })
    .join("");
}

function buildTrend(points) {
  const labels = points.map((_, idx) => `Match${idx + 1}`);
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

function getPressureLevel(score) {
  if (score >= 60) {
    return {
      label: "High",
      classes: "bg-red-100 text-red-700"
    };
  }
  if (score >= 30) {
    return {
      label: "Medium",
      classes: "bg-amber-100 text-amber-700"
    };
  }
  return {
    label: "Low",
    classes: "bg-emerald-100 text-emerald-700"
  };
}

function getClutchTag(score) {
  if (score >= 75) {
    return {
      label: "Elite",
      classes: "bg-emerald-100 text-emerald-700"
    };
  }
  if (score >= 55) {
    return {
      label: "Reliable",
      classes: "bg-sky-100 text-sky-700"
    };
  }
  if (score >= 35) {
    return {
      label: "Developing",
      classes: "bg-amber-100 text-amber-700"
    };
  }
  return {
    label: "Low Sample",
    classes: "bg-slate-100 text-slate-700"
  };
}

function computePressureAndClutch(player) {
  const rows = impactDataset.filter((r) => r.player === player);
  if (rows.length === 0) {
    pressureIndexValue.textContent = "0.0";
    pressureLevelBadge.textContent = "Low";
    pressureLevelBadge.className = "px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700";
    pressureIndexBar.style.width = "0%";
    highPressureShare.textContent = "0.0%";

    clutchScoreValue.textContent = "0.0";
    clutchTag.textContent = "Low Sample";
    clutchTag.className = "px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700";
    clutchScoreBar.style.width = "0%";
    clutchSummary.textContent = "No high-pressure summary available yet.";
    return;
  }

  const pressureScores = rows.map((r) => Math.max(0, Math.min(100, toNumber(r.pressure_index, 0) * 100)));
  const avgPressure = mean(pressureScores);
  const highPressureRows = rows.filter((r) => toNumber(r.pressure_index, 0) * 100 >= 60);
  const highShare = (highPressureRows.length / rows.length) * 100;

  const pressureLevel = getPressureLevel(avgPressure);
  pressureIndexValue.textContent = avgPressure.toFixed(1);
  pressureLevelBadge.textContent = pressureLevel.label;
  pressureLevelBadge.className = `px-3 py-1 rounded-full text-xs font-semibold ${pressureLevel.classes}`;
  pressureIndexBar.style.width = `${avgPressure}%`;
  highPressureShare.textContent = `${highShare.toFixed(1)}%`;

  const highRuns = highPressureRows.reduce((acc, r) => acc + toNumber(r.runs_scored, 0), 0);
  const highBalls = highPressureRows.reduce((acc, r) => acc + toNumber(r.balls_faced, 0), 0);
  const highWickets = highPressureRows.reduce((acc, r) => acc + toNumber(r.wickets_taken, 0), 0);
  const highStrikeRate = highBalls > 0 ? (highRuns * 100) / highBalls : 0;
  const highImpact = mean(
    highPressureRows.map(
      (r) => 0.6 * toNumber(r.batter_impact_score, 0) + 0.4 * toNumber(r.bowler_impact_score, 0)
    )
  );

  const srComponent = Math.min(100, highStrikeRate / 1.5);
  const runsComponent = Math.min(100, highRuns * 2);
  const wicketsComponent = Math.min(100, highWickets * 25);
  const impactComponent = Math.max(0, Math.min(100, highImpact));

  const clutchScore =
    0.35 * srComponent +
    0.25 * runsComponent +
    0.2 * wicketsComponent +
    0.2 * impactComponent;

  const clutch = Math.max(0, Math.min(100, clutchScore));
  const clutchMeta = getClutchTag(clutch);

  clutchScoreValue.textContent = clutch.toFixed(1);
  clutchTag.textContent = clutchMeta.label;
  clutchTag.className = `px-3 py-1 rounded-full text-xs font-semibold ${clutchMeta.classes}`;
  clutchScoreBar.style.width = `${clutch}%`;
  clutchSummary.textContent =
    `High-pressure runs: ${highRuns.toFixed(0)}, SR: ${highStrikeRate.toFixed(1)}, wickets: ${highWickets.toFixed(0)}`;
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
  const lastTen = rows.slice(-10);

  trendPlayerLabel.textContent = `Player: ${player}`;

  updateGauge(latestImpact);
  buildTrend(lastTen);
  renderTrendTable(lastTen);
  computeBreakdown(player, latest.match_id, latestImpact);
  computePhaseContribution(player);
  computePressureAndClutch(player);
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

  allPlayers = [...new Set(playerScores.map((r) => r.player))].sort((a, b) =>
    a.localeCompare(b)
  );

  populatePlayerSelect(allPlayers);

  const defaultPlayer =
    allPlayers.find((p) => p.trim().toLowerCase() === "v kohli") ||
    allPlayers.find((p) => p.trim().toLowerCase() === "virat kohli") ||
    allPlayers.find((p) => p.toLowerCase().includes("kohli")) ||
    allPlayers[0];
  playerSelect.value = defaultPlayer;

  const ranking = groupMeanByPlayer(playerScores);
  renderRankingTable(ranking);
  renderDistribution(ranking);
  renderPlayer(defaultPlayer);

  compareASelect.value = defaultPlayer;
  compareBSelect.value = ranking[0]?.player || allPlayers[0];
  if (compareBSelect.value === compareASelect.value && allPlayers.length > 1) {
    compareBSelect.value = allPlayers[1];
  }
  renderComparison();

  const compareACombo = setupComboInput(compareASelect, compareADropdownList, renderComparison);
  const compareBCombo = setupComboInput(compareBSelect, compareBDropdownList, renderComparison);

  playerSelect.addEventListener("focus", () => {
    setDropdownItems(filterPlayers(playerSelect.value));
  });

  playerSelect.addEventListener("input", () => {
    setDropdownItems(filterPlayers(playerSelect.value));
  });

  playerSelect.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (visiblePlayers.length > 0) {
        playerSelect.value = visiblePlayers[0];
      }
      pickPlayerFromInput();
    }
    if (e.key === "Escape") {
      closePlayerDropdown();
    }
  });

  playerDropdownList.addEventListener("click", (e) => {
    const target = e.target.closest("button[data-player]");
    if (!target) return;
    playerSelect.value = target.dataset.player;
    pickPlayerFromInput();
  });

  document.addEventListener("click", (e) => {
    const withinPicker = e.target === playerSelect || playerDropdownList.contains(e.target);
    if (!withinPicker) {
      closePlayerDropdown();
    }
  });

  compareASelect.addEventListener("blur", () => {
    compareACombo.selectFromInput();
  });

  compareBSelect.addEventListener("blur", () => {
    compareBCombo.selectFromInput();
  });

  statusMsg.textContent = `Loaded ${allPlayers.length} players.`;
}

init();
