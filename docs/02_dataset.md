# Dataset

## Source
- Cricsheet IPL match JSON files
- Path: `data/raw/ipl_json/`

## Processed Outputs
- Ball-by-ball table: `data/processed/ball_by_ball.csv`
- Engineered player-match table: `data/features/impact_dataset.csv`
- Final impact output: `data/features/player_impact_scores.csv`

## Granularity
- Raw: delivery-level events
- Features: player x match x innings view
- Final: player impact timeline and normalized impact scores

## Core Fields Used
- Batting: `batter_runs`, `balls_faced`, `strike_rate`
- Bowling: `wickets_taken`, `economy`
- Context: `phase`, `match_date`, `match_id`
- Pressure: `pressure_index`
