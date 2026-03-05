# Feature Engineering

Feature engineering is done in `notebooks/feature_engineering.ipynb`.

## Key Features
- `strike_rate`: zero-safe batting rate
- `phase`: `powerplay`, `middle`, `death`
- `pressure_index`: normalized pressure score in [0, 1]
- `batter_impact_score`: batting contribution proxy
- `bowler_impact_score`: bowling contribution proxy

## Important Safety Rules
- Division-by-zero handling for strike rate
- Missing impact components filled with 0 after merges
- Numeric coercion for noisy fields

## Output
Final engineered dataset is saved to:
`data/features/impact_dataset.csv`
