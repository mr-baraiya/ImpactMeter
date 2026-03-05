from pathlib import Path

import pandas as pd


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

    player_scores = (
        df.groupby("player", as_index=False)["impact_score"]
        .mean()
        .sort_values("impact_score", ascending=False)
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    player_scores.to_csv(output_path, index=False)

    print("Saved:", output_path)
    print("Rows:", len(player_scores))
    print(player_scores.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
