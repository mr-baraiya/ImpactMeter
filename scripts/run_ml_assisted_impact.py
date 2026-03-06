from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split


def min_max_scale(values: pd.Series) -> pd.Series:
    min_val = float(values.min())
    max_val = float(values.max())
    if max_val == min_val:
        return pd.Series(np.full(len(values), 50.0), index=values.index)
    return 100 * (values - min_val) / (max_val - min_val)


def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    input_path = base_dir / "data" / "features" / "impact_dataset.csv"
    model_dir = base_dir / "models"
    model_output_scores = model_dir / "ml_impact_scores.csv"
    model_output_importance = model_dir / "ml_feature_importance.csv"

    df = pd.read_csv(input_path)

    # Numeric safety conversions.
    df["runs_scored"] = pd.to_numeric(df.get("runs_scored", 0), errors="coerce").fillna(0)
    df["strike_rate"] = pd.to_numeric(df.get("strike_rate", 0), errors="coerce").fillna(0)
    df["wickets_taken"] = pd.to_numeric(df.get("wickets_taken", 0), errors="coerce").fillna(0)
    df["economy_rate"] = pd.to_numeric(df.get("economy", 0), errors="coerce").fillna(0)
    pressure_raw = pd.to_numeric(df.get("pressure_index", 0), errors="coerce").fillna(0)
    # Keep pressure on a 0-100 scale for consistency with logic docs and UI interpretation.
    if float(pressure_raw.max()) <= 1.5:
        pressure_raw = pressure_raw * 100
    df["pressure_index"] = pressure_raw.clip(0, 100)

    # Derived feature approximations where explicit columns are unavailable.
    df["boundaries"] = (df["runs_scored"] * 0.25).round().clip(lower=0)
    df["dot_ball_percentage"] = (100 - (df["economy_rate"] * 10)).clip(lower=0, upper=100)
    df["required_run_rate"] = ((df["pressure_index"] / 100) * 12).clip(lower=0, upper=24)
    df["wickets_lost"] = ((df["pressure_index"] / 100) * 10).clip(lower=0, upper=10)
    df["match_phase"] = df.get("phase", "middle").fillna("middle").astype(str).str.lower()

    # Balanced target keeps ML-assisted scores closer to rule-based impact behavior.
    df["impact_target"] = (
        (df["runs_scored"] * 0.6)
        + (df["wickets_taken"] * 15)
        + (df["strike_rate"] * 0.2)
        - (df["economy_rate"] * 1.5)
    )

    features = [
        "runs_scored",
        "strike_rate",
        "boundaries",
        "wickets_taken",
        "economy_rate",
        "dot_ball_percentage",
        "match_phase",
        "required_run_rate",
        "wickets_lost",
        "pressure_index",
    ]

    model_df = df[features + ["impact_target"]].copy()
    X = pd.get_dummies(model_df[features], columns=["match_phase"], drop_first=False)
    y = model_df["impact_target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    pred_test = model.predict(X_test)
    test_r2 = r2_score(y_test, pred_test)
    test_mae = mean_absolute_error(y_test, pred_test)

    # Score all rows and normalize ML impact to 0-100.
    all_pred = pd.Series(model.predict(X), index=df.index)
    df["ml_impact_score"] = min_max_scale(all_pred).clip(0, 100)

    df["match_date"] = pd.to_datetime(df.get("match_date"), errors="coerce")
    df["match_id"] = pd.to_numeric(df.get("match_id", 0), errors="coerce").fillna(0).astype(int)

    player_match = (
        df.groupby(["player", "match_id", "match_date"], as_index=False)
        .agg(
            ml_impact_score=("ml_impact_score", "mean"),
            impact_target=("impact_target", "mean"),
            pressure_index=("pressure_index", "mean"),
        )
        .sort_values(["player", "match_date", "match_id"])
        .reset_index(drop=True)
    )
    player_match["match_date"] = player_match["match_date"].dt.strftime("%Y-%m-%d")

    importance = pd.Series(model.feature_importances_, index=X.columns)
    importance = importance.sort_values(ascending=False).reset_index()
    importance.columns = ["feature", "importance"]
    importance["importance_pct"] = (importance["importance"] * 100).round(2)

    model_dir.mkdir(parents=True, exist_ok=True)
    player_match.to_csv(model_output_scores, index=False)
    importance.to_csv(model_output_importance, index=False)

    print("Saved:", model_output_scores)
    print("Saved:", model_output_importance)
    print(f"Model test R2: {test_r2:.4f}")
    print(f"Model test MAE: {test_mae:.4f}")
    print("Top feature importances (%):")
    print(importance.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
