# Impact Model

Model logic is implemented in `notebooks/impact_model.ipynb` and `scripts/run_impact_model.py`.

## Core Formula
1. `performance_score` from batting terms
2. `bowler_performance` from bowling terms
3. `context_score` from innings phase and pressure
4. `impact_raw` = blended performance x context x pressure factor

## Normalization
- Convert raw impact to 0-100 for readability
- Apply clipping to keep values in valid range

## Recency Requirement
- Compute player-match impact sequence
- Rolling last 10 innings average (`rolling_IM`)
- Recency-weighted score (`weighted_IM`)
- Final normalized score (`IM_score`)
