# ImpactMeter

ImpactMeter turns ball-by-ball IPL data into a single player impact score that is context-aware, pressure-aware, and recency-aware.

## Problem Statement

Traditional cricket metrics (runs, strike rate, wickets) do not fully capture match context. This project builds an interpretable impact metric using:

- Performance contribution
- Match context (phase)
- Pressure context
- Rolling last-10 innings with recency weighting

Final output is a normalized 0-100 `IM_score` for player-level comparison.

## Project Structure

```text
ImpactMeter/
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
|-- frontend/
`-- README.md
```

## Data Source

- Cricsheet IPL JSON: https://cricsheet.org/

## Setup

From project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

## Pipeline

### 1) Convert JSON to ball-by-ball CSV

```powershell
D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/json_to_csv.py
```

Output:

- `data/processed/ball_by_ball.csv`

### 2) Build engineered features

Run `notebooks/feature_engineering.ipynb` (all cells).

Output:

- `data/features/impact_dataset.csv`

### 3) Run impact model (recommended script)

```powershell
D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/run_impact_model.py
```

Output:

- `data/features/player_impact_scores.csv`

## Model Highlights

- Zero-safe strike rate handling
- Pressure normalization
- Missing impact values handled safely
- Rolling last-10 innings impact (`rolling_IM`)
- Recency-weighted impact (`weighted_IM`)
- Final normalized score (`IM_score`) in 0-100 range

## Architecture Diagram

```text
Cricsheet JSON
	|
	v
JSON Parser (`scripts/json_to_csv.py`)
	|
	v
Ball-by-Ball Dataset (`data/processed/ball_by_ball.csv`)
	|
	v
Feature Engineering (`notebooks/feature_engineering.ipynb`)
	|
	v
Impact Model (`notebooks/impact_model.ipynb` / `scripts/run_impact_model.py`)
	|
	v
Rolling Last 10 + Recency Weighting
	|
	v
Final Impact Score Dashboard (`frontend/`)
```

## Model Validation

- Practical validation is done by checking if high impact scores align with known high-influence performances.
- A lightweight quantitative check can be computed as correlation between player impact and team match outcomes for each season split.
- Current project focus is interpretability-first scoring with reproducible outputs.

## Sample Case Study

Example interpretation format used in demos:

- Player: MS Dhoni
- Situation: high required run rate in late overs
- Observation: strong recent `IM_score` trend and elevated pressure contribution
- Outcome: high ImpactMeter score due to clutch contribution under pressure

## 1-Minute Demo Script

1. Open dashboard and select a player.
2. Show Impact Score gauge for instant understanding.
3. Show last 10 innings trend.
4. Show Why This Score breakdown panel.
5. Compare two players in the comparison chart.
6. Show ranking table and score distribution histogram.

## Future Work

- Include opponent strength adjustment.
- Include venue and pitch difficulty.
- Add explicit match-winning probability calibration.
- Extend framework to ODI and Test formats.
- Add richer clutch-factor modeling from ball-state transitions.

## Notebook Workflow

- `notebooks/feature_engineering.ipynb`: feature construction and dataset export
- `notebooks/impact_model.ipynb`: impact computation, ranking, and trend plotting

## Documentation

Detailed writeups are in:

- `docs/01_problem_definition.md`
- `docs/02_dataset.md`
- `docs/03_feature_engineering.md`
- `docs/04_impact_model.md`
- `docs/05_algorithm_pipeline.md`
- `docs/06_results.md`
- `docs/07_edge_cases.md`

## Deliverables

- Reproducible pipeline scripts and notebooks
- Final player impact CSV output
- Supporting documentation for methodology and edge cases

## Note

If notebook kernels run in isolated paths, use the script runner (`scripts/run_impact_model.py`) for reliable local execution.
