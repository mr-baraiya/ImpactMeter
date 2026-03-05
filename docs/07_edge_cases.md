# Edge Cases

## Data and Modeling Edge Cases
- Missing batting or bowling rows for a player in a match
- Players with very few innings
- Missing or malformed numeric fields
- All-equal `impact_raw` values during normalization
- Name mismatches during player selection in plots

## Handling Applied
- Fill missing impact fields with 0 where appropriate
- Use `min_periods=1` for rolling windows
- Use safe numeric conversion (`to_numeric(..., errors='coerce')`)
- Fall back to baseline score if normalization denominator is zero
- Use partial-name matching and fallback player in visualization

## Practical Note
For notebook environments with path isolation, prefer the script runner in `scripts/run_impact_model.py` for reproducible execution.

## Scenario Handling Table

| Situation | Handling |
|---|---|
| Runs in low-pressure phase | Lower pressure/context multiplier keeps score moderate |
| Run-out dismissals | Not credited as bowler wicket in feature logic |
| Tail-end runs in low leverage moments | Lower context and pressure influence |
| Death-overs wickets under pressure | Higher impact via phase and pressure factors |

## Clutch Factor Note

The dashboard includes a clutch proxy in explanation:

`clutch_factor = pressure_index x death_over_weight`

where death-over weight is higher than middle/powerplay for late-innings pressure moments.
