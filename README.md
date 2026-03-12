# ImpactMeter

**ImpactMeter** is a context-aware cricket analytics system that converts ball-by-ball IPL data into an interpretable **Impact Metric (`IM_score`) ranging from 0–100**.
It evaluates player performance using **match context, pressure situations, and recent form**.

Live Demo:

[https://mr-baraiya.github.io/ImpactMeter](https://mr-baraiya.github.io/ImpactMeter)

---

# Why ImpactMeter

Traditional cricket metrics such as **runs, strike rate, or wickets** fail to capture *when* and *how important* a performance was.

ImpactMeter improves this by modeling:

* **Performance** – runs, strike rate, batter/bowler impact
* **Context** – powerplay, middle overs, death overs
* **Situation** – pressure-aware contribution and clutch performance
* **Recency** – rolling and weighted recent-match form

Core idea:

```
Impact = Performance × Context × Pressure
```

This produces a normalized **Impact Score (0–100)**.

---

# Requirements

* Python **3.10+**
* `pip`
* A local web server (Python `http.server` works)

---

# Project Structure

```
ImpactMeter/
│
├── index.html
├── script.js
├── requirements.txt
│
├── data/
│   ├── raw/ipl_json/
│   ├── processed/ball_by_ball.csv
│   └── features/
│       ├── impact_dataset.csv
│       └── player_impact_scores.csv
│
├── models/
│   ├── ml_impact_scores.csv
│   └── ml_feature_importance.csv
│
├── scripts/
│   ├── json_to_csv.py
│   ├── run_impact_model.py
│   └── run_ml_assisted_impact.py
│
├── notebooks/
│   ├── analysis.ipynb
│   ├── feature_engineering.ipynb
│   ├── impact_model.ipynb
│   └── ml_assisted_impact.ipynb
│
├── docs/
│   ├── 01_problem_definition.md
│   ├── 02_dataset.md
│   ├── 03_feature_engineering.md
│   ├── 04_impact_model.md
│   ├── 05_algorithm_pipeline.md
│   ├── 06_results.md
│   ├── 07_edge_cases.md
│   └── 08_impact_metric_explanation.md
│
└── frontend/
    └── ImpactMeter_Logic_Design_Document.html
```

---

# Setup

Run from project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

# Quickstart (End-to-End)

To rebuild the full pipeline:

```
# Convert Cricsheet JSON → ball-by-ball dataset
python scripts/json_to_csv.py

# Run feature engineering notebook
notebooks/feature_engineering.ipynb

# Generate rule-based impact scores
python scripts/run_impact_model.py

# Generate ML-assisted validation scores
python scripts/run_ml_assisted_impact.py

# Launch dashboard
python -m http.server 8000
```

Open:

```
http://localhost:8000
```

---

# Detailed Pipeline

## 1. Convert Raw JSON

```
python scripts/json_to_csv.py
```

Output:

```
data/processed/ball_by_ball.csv
```

---

## 2. Feature Engineering

Run:

```
notebooks/feature_engineering.ipynb
```

Output:

```
data/features/impact_dataset.csv
```

Features include:

* strike_rate
* phase (powerplay / middle / death)
* pressure_index
* batter_impact_score
* bowler_impact_score

---

## 3. Build Rule-Based Impact Scores

```
python scripts/run_impact_model.py
```

Output:

```
data/features/player_impact_scores.csv
```

Main columns:

* player
* match_id
* match_date
* impact_score
* rolling_IM
* weighted_IM
* pressure_score
* clutch_score
* IM_score

---

## 4. ML-Assisted Impact Validation

```
python scripts/run_ml_assisted_impact.py
```

Outputs:

```
models/ml_impact_scores.csv
models/ml_feature_importance.csv
```

ML is used for:

* feature importance validation
* score stability verification

Rule-based scoring remains the **primary metric**.

---

# Dashboard

Start server:

```
python -m http.server 8000
```

Open:

```
http://localhost:8000
```

Files used:

* UI → `index.html`
* Logic → `script.js`

---

# Documentation

Main project documentation:

* Problem Definition → `docs/01_problem_definition.md`
* Dataset → `docs/02_dataset.md`
* Feature Engineering → `docs/03_feature_engineering.md`
* Impact Model → `docs/04_impact_model.md`
* Algorithm Pipeline → `docs/05_algorithm_pipeline.md`
* Results → `docs/06_results.md`
* Edge Cases → `docs/07_edge_cases.md`
* Impact Metric Explanation → `docs/08_impact_metric_explanation.md`
* Technical Design → `frontend/ImpactMeter_Logic_Design_Document.html`

---

# Troubleshooting

If CSV files fail to load in the browser:

* ensure the server was started from repo root

If ML outputs are missing:

```
python scripts/run_ml_assisted_impact.py
```

If rule scores are missing:

```
python scripts/run_impact_model.py
```

---

# Data Source

Cricsheet IPL dataset
[https://cricsheet.org/](https://cricsheet.org/)
