# Algorithm Pipeline

## Step-by-Step
1. Parse Cricsheet IPL JSON files to delivery-level CSV
2. Engineer context and impact features
3. Compute per-row impact components
4. Aggregate to player-match impact
5. Apply rolling last-10 and recency weighting
6. Normalize to 0-100 and rank players
7. Save final output CSV

## Execution Commands
- JSON to CSV:
`D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/json_to_csv.py`

- Impact model pipeline:
`D:/VS_CODES/Projects/ImpactMeter/venv/Scripts/python.exe scripts/run_impact_model.py`

## Main Artifacts
- `data/processed/ball_by_ball.csv`
- `data/features/impact_dataset.csv`
- `data/features/player_impact_scores.csv`
