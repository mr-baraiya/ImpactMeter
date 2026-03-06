# ImpactMeter

ImpactMeter is a context-aware IPL player analytics system that converts ball-by-ball events into an interpretable `IM_score` (`0-100`) with pressure and clutch intelligence.

## Why This Project

Traditional metrics (runs, strike rate, wickets) miss match context. ImpactMeter models:

- `Performance`: runs, strike rate, batter/bowler impact
- `Context`: powerplay, middle overs, death overs
- `Situation`: pressure-aware contribution and clutch behavior
- `Recency`: rolling and weighted recent-match form

## Quick Judge View

- Player Impact Score gauge (`IM_score`)
- Explainable score breakdown
- Last 10 match trend table + line chart
- Pressure Index card (`Low/Medium/High`)
- Clutch Performance card
- Role-aware evaluation logic (see `docs/08_impact_metric_explanation.md`, Section 6)
- Top impact leaderboard
- Player-vs-player comparison

## Dashboard Entry

- Main UI: `index.html`
- Client logic: `script.js`

## Project Structure

```text
ImpactMeter/
|-- index.html
|-- script.js
|-- data/
|   |-- raw/ipl_json/
|   |-- processed/ball_by_ball.csv
|   `-- features/
|       |-- impact_dataset.csv
|       `-- player_impact_scores.csv
|-- docs/
|   |-- 01_problem_definition.md
|   |-- 02_dataset.md
|   |-- 03_feature_engineering.md
|   |-- 04_impact_model.md
|   |-- 05_algorithm_pipeline.md
|   |-- 06_results.md
|   `-- 07_edge_cases.md
|-- notebooks/
|   |-- analysis.ipynb
|   |-- feature_engineering.ipynb
|   `-- impact_model.ipynb
|-- scripts/
|   |-- json_to_csv.py
|   `-- run_impact_model.py
`-- README.md
```

## Setup

From project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

## Pipeline

### 1. Convert raw JSON to ball-by-ball

```powershell
D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/json_to_csv.py
```

Output: `data/processed/ball_by_ball.csv`

### 2. Build engineered features

Run all cells in `notebooks/feature_engineering.ipynb`

Output: `data/features/impact_dataset.csv`

### 3. Generate impact output (recommended)

```powershell
D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/run_impact_model.py
```

Output: `data/features/player_impact_scores.csv`

Current output columns include:

- `player`
- `match_id`
- `match_date`
- `impact_score`
- `rolling_IM`
- `weighted_IM`
- `pressure_score`
- `clutch_score`
- `IM_score`

## Docs Navigation

Use this section as the main redirect hub for judges:

- Problem Definition: [`docs/01_problem_definition.md`](docs/01_problem_definition.md)
- Dataset: [`docs/02_dataset.md`](docs/02_dataset.md)
- Feature Engineering: [`docs/03_feature_engineering.md`](docs/03_feature_engineering.md)
- Impact Model: [`docs/04_impact_model.md`](docs/04_impact_model.md)
- Algorithm Pipeline: [`docs/05_algorithm_pipeline.md`](docs/05_algorithm_pipeline.md)
- Results: [`docs/06_results.md`](docs/06_results.md)
- Edge Cases: [`docs/07_edge_cases.md`](docs/07_edge_cases.md)
- Impact Metric Explanation: [`docs/08_impact_metric_explanation.md`](docs/08_impact_metric_explanation.md)

## 1-Minute Demo Flow

1. Open `index.html` on local server.
2. Select `V Kohli` (default).
3. Show impact score and explanation panel.
4. Show last 10 match trend chart + table.
5. Show pressure level and clutch score cards.
6. Compare 2 players and show leaderboard.

## Data Source

- Cricsheet IPL JSON: <https://cricsheet.org/>

## Notes

- If notebook kernel paths differ, prefer script execution for reproducible outputs.
- This repository is optimized for interpretable analytics and presentation-ready judge demos.
