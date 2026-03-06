from pathlib import Path

import pandas as pd


def compute_weighted_last_n(series: pd.Series, window: int = 10) -> pd.Series:
    values = series.fillna(0).tolist()
    result = []

    for idx in range(len(values)):
        start = max(0, idx - window + 1)
        win = values[start : idx + 1]
        weights = list(range(1, len(win) + 1))
        weighted_sum = sum(v * w for v, w in zip(win, weights))
        result.append(weighted_sum / sum(weights))

    return pd.Series(result, index=series.index)


def match_level_metrics(group: pd.DataFrame) -> pd.Series:
    pressure = (group["pressure_index"] * 100).clip(0, 100)
    pressure_score = pressure.mean()

    high = group[group["pressure_index"] >= 0.6]
    high_runs = high["runs_scored"].sum()
    high_balls = high["balls_faced"].sum()
    high_wickets = high["wickets_taken"].sum()
    high_sr = (high_runs * 100 / high_balls) if high_balls > 0 else 0

    high_impact = (0.6 * high["batter_impact_score"] + 0.4 * high["bowler_impact_score"]).mean()
    if pd.isna(high_impact):
        high_impact = 0

    sr_component = min(100, high_sr / 1.5)
    runs_component = min(100, high_runs * 2)
    wickets_component = min(100, high_wickets * 25)
    impact_component = max(0, min(100, high_impact))

    clutch_score = (
        0.35 * sr_component
        + 0.25 * runs_component
        + 0.2 * wickets_component
        + 0.2 * impact_component
    )
    clutch_score = max(0, min(100, clutch_score))

    return pd.Series(
        {
            "impact_score": group["impact_score"].mean(),
            "pressure_score": pressure_score,
            "clutch_score": clutch_score,
        }
    )


def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / "data" / "features" / "impact_dataset.csv"
    output_path = base_dir / "data" / "features" / "player_impact_scores.csv"

    df = pd.read_csv(data_path)

    # Ensure required numeric fields are safe for downstream math.
    df["runs_scored"] = pd.to_numeric(df.get("runs_scored", 0), errors="coerce").fillna(0)
    df["strike_rate"] = pd.to_numeric(df.get("strike_rate", 0), errors="coerce").fillna(0)
    df["batter_impact_score"] = pd.to_numeric(df.get("batter_impact_score", 0), errors="coerce").fillna(0)
    df["bowler_impact_score"] = pd.to_numeric(df.get("bowler_impact_score", 0), errors="coerce").fillna(0)
    df["wickets_taken"] = pd.to_numeric(df.get("wickets_taken", 0), errors="coerce").fillna(0)
    df["pressure_index"] = pd.to_numeric(df.get("pressure_index", 0.5), errors="coerce").fillna(0.5).clip(0, 1)

    # Batting + bowling blended performance score.
    df["performance_score"] = (
        df["runs_scored"] * 0.6
        + df["strike_rate"] * 0.2
        + df["batter_impact_score"] * 0.2
    )
    df["bowler_performance"] = (
        df["bowler_impact_score"] * 0.7
        + df["wickets_taken"] * 10
    )

    phase_weights = {"powerplay": 1.1, "middle": 1.0, "death": 1.4}
    df["context_score"] = df["phase"].map(phase_weights).fillna(1.0)
    df["impact_raw"] = (
        (0.6 * df["performance_score"] + 0.4 * df["bowler_performance"])
        * df["context_score"]
        * (1 + df["pressure_index"])
    )

    min_val = df["impact_raw"].min()
    max_val = df["impact_raw"].max()
    if max_val == min_val:
        df["impact_score"] = 50.0
    else:
        df["impact_score"] = 100 * (df["impact_raw"] - min_val) / (max_val - min_val)
    df["impact_score"] = df["impact_score"].clip(0, 100)

    df["match_date"] = pd.to_datetime(df.get("match_date"), errors="coerce")
    df["match_id"] = pd.to_numeric(df.get("match_id", 0), errors="coerce").fillna(0).astype(int)

    player_match = (
        df.groupby(["player", "match_id", "match_date"], as_index=False)
        .apply(match_level_metrics, include_groups=False)
        .reset_index(drop=True)
    )

    player_match = player_match.sort_values(["player", "match_date", "match_id"]).reset_index(drop=True)

    player_match["rolling_IM"] = (
        player_match.groupby("player")["impact_score"]
        .transform(lambda s: s.rolling(window=10, min_periods=1).mean())
    )

    player_match["weighted_IM"] = (
        player_match.groupby("player")["impact_score"]
        .transform(lambda s: compute_weighted_last_n(s, window=10))
    )

    player_match["IM_score"] = (
        0.4 * player_match["impact_score"]
        + 0.3 * player_match["rolling_IM"]
        + 0.2 * player_match["weighted_IM"]
        + 0.1 * player_match["clutch_score"]
    )
    player_match["IM_score"] = player_match["IM_score"].clip(0, 100)

    player_match["match_date"] = player_match["match_date"].dt.strftime("%Y-%m-%d")
    player_match = player_match[
        [
            "player",
            "match_id",
            "match_date",
            "impact_score",
            "rolling_IM",
            "weighted_IM",
            "pressure_score",
            "clutch_score",
            "IM_score",
        ]
    ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    player_match.to_csv(output_path, index=False)

    print("Saved:", output_path)
    print("Rows:", len(player_match))
    print(player_match.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
