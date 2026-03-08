![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
# ImpactMeter

ImpactMeter is a context-aware IPL player analytics system that converts ball-by-ball events into an interpretable `IM_score` (`0-100`) with pressure and clutch intelligence.

## Why This Project

Traditional metrics (runs, strike rate, wickets) miss match context. ImpactMeter models:

- `Performance`: runs, strike rate, batter/bowler impact
- `Context`: powerplay, middle overs, death overs
- `Situation`: pressure-aware contribution and clutch behavior
- `Recency`: rolling and weighted recent-match form

## Requirements

- Python `3.10+` (recommended)
- `pip`
- A local web server to open `index.html` (Python `http.server` is enough)

## Project Structure

```text
ImpactMeter/
|-- index.html
|-- script.js
|-- requirements.txt
|-- data/
|   |-- raw/ipl_json/
|   |-- processed/ball_by_ball.csv
|   `-- features/
|       |-- impact_dataset.csv
|       `-- player_impact_scores.csv
|-- models/
|   |-- ml_impact_scores.csv
|   `-- ml_feature_importance.csv
|-- scripts/
|   |-- json_to_csv.py
|   |-- run_impact_model.py
|   `-- run_ml_assisted_impact.py
|-- notebooks/
|   |-- analysis.ipynb
|   |-- feature_engineering.ipynb
|   |-- impact_model.ipynb
|   `-- ml_assisted_impact.ipynb
|-- docs/
|   |-- 01_problem_definition.md
|   |-- 02_dataset.md
|   |-- 03_feature_engineering.md
|   |-- 04_impact_model.md
|   |-- 05_algorithm_pipeline.md
|   |-- 06_results.md
|   |-- 07_edge_cases.md
|   `-- 08_impact_metric_explanation.md
`-- frontend/
    `-- ImpactMeter_Logic_Design_Document.html
```

## Setup

Run from project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Quickstart (End-to-End)

If you want a complete rebuild and fresh outputs:

```powershell
# 1) Raw JSON -> ball-by-ball CSV
python scripts/json_to_csv.py

# 2) Build feature dataset
#    Run all cells in notebooks/feature_engineering.ipynb

# 3) Rule-based impact outputs
python scripts/run_impact_model.py

# 4) ML-assisted outputs (saved to models/)
python scripts/run_ml_assisted_impact.py

# 5) Start dashboard
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Detailed Pipeline

### 1. Convert raw IPL JSON

```powershell
python scripts/json_to_csv.py
```

Output:

- `data/processed/ball_by_ball.csv`

### 2. Generate engineered features

Run all cells in `notebooks/feature_engineering.ipynb`.

Output:

- `data/features/impact_dataset.csv`

### 3. Build rule-based impact scores

```powershell
python scripts/run_impact_model.py
```

Output:

- `data/features/player_impact_scores.csv`

Main columns:

- `player`
- `match_id`
- `match_date`
- `impact_score`
- `rolling_IM`
- `weighted_IM`
- `pressure_score`
- `clutch_score`
- `IM_score`

### 4. Build ML-assisted scores and explainability

```powershell
python scripts/run_ml_assisted_impact.py
```

Outputs:

- `models/ml_impact_scores.csv`
- `models/ml_feature_importance.csv`

Notes:

- ML uses fixed scaling (not dataset min-max) for stability.
- ML outputs are calibrated against rule scores to keep ML as a validation layer.

## Run The Dashboard

```powershell
python -m http.server 8000
```

Open:

- `http://localhost:8000`

Dashboard files:

- UI: `index.html`
- Logic: `script.js`

## Docs Navigation

Use this as the judge/mentor navigation hub:

- Problem Definition: [`docs/01_problem_definition.md`](docs/01_problem_definition.md)
- Dataset: [`docs/02_dataset.md`](docs/02_dataset.md)
- Feature Engineering: [`docs/03_feature_engineering.md`](docs/03_feature_engineering.md)
- Impact Model: [`docs/04_impact_model.md`](docs/04_impact_model.md)
- Algorithm Pipeline: [`docs/05_algorithm_pipeline.md`](docs/05_algorithm_pipeline.md)
- Results: [`docs/06_results.md`](docs/06_results.md)
- Edge Cases: [`docs/07_edge_cases.md`](docs/07_edge_cases.md)
- Impact Metric Explanation: [`docs/08_impact_metric_explanation.md`](docs/08_impact_metric_explanation.md)
- Technical Design (HTML): [`frontend/ImpactMeter_Logic_Design_Document.html`](frontend/ImpactMeter_Logic_Design_Document.html)

## Troubleshooting

- If CSVs fail to load in browser, ensure you started a local server from repo root.
- If ML files are missing, run `python scripts/run_ml_assisted_impact.py` again.
- If rule scores are missing, run `python scripts/run_impact_model.py` again.
- If notebook paths differ, use script-based pipeline commands for reproducibility.

## Data Source

- Cricsheet IPL JSON: <https://cricsheet.org/>
