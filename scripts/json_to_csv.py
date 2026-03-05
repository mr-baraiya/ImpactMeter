import argparse
import csv
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


def safe_get(dct: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    current: Any = dct
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def first_or_none(values: Any) -> Optional[Any]:
    if isinstance(values, list) and values:
        return values[0]
    return None


def format_date(info: Dict[str, Any]) -> str:
    dates = info.get("dates")
    if isinstance(dates, list) and dates:
        return str(dates[0])
    return ""


def parse_outcome(info: Dict[str, Any]) -> Tuple[str, str]:
    outcome = info.get("outcome", {}) if isinstance(info.get("outcome"), dict) else {}
    winner = str(outcome.get("winner", ""))

    by = outcome.get("by", {}) if isinstance(outcome.get("by"), dict) else {}
    if "runs" in by:
        margin = f"runs:{by['runs']}"
    elif "wickets" in by:
        margin = f"wickets:{by['wickets']}"
    else:
        margin = ""

    return winner, margin


def get_innings_items(match: Dict[str, Any]) -> List[Dict[str, Any]]:
    innings = match.get("innings", [])
    if not isinstance(innings, list):
        return []
    return [item for item in innings if isinstance(item, dict)]


def parse_wickets(delivery: Dict[str, Any]) -> Tuple[int, str, str, str]:
    wickets_obj = delivery.get("wickets")
    wicket_count = 0
    player_out = ""
    dismissal_kind = ""
    fielder_names = ""

    if isinstance(wickets_obj, list) and wickets_obj:
        wicket_count = len(wickets_obj)
        first = wickets_obj[0] if isinstance(wickets_obj[0], dict) else {}
        player_out = str(first.get("player_out", ""))
        dismissal_kind = str(first.get("kind", ""))
        fielders = first.get("fielders", [])
        if isinstance(fielders, list):
            names: List[str] = []
            for f in fielders:
                if isinstance(f, dict):
                    name = f.get("name")
                    if name:
                        names.append(str(name))
                elif isinstance(f, str):
                    names.append(f)
            fielder_names = "|".join(names)

    # Legacy schema may have singular "wicket"
    wicket_obj = delivery.get("wicket")
    if wicket_count == 0 and isinstance(wicket_obj, dict):
        wicket_count = 1
        player_out = str(wicket_obj.get("player_out", ""))
        dismissal_kind = str(wicket_obj.get("kind", ""))
        fielders = wicket_obj.get("fielders", [])
        if isinstance(fielders, list):
            names = []
            for f in fielders:
                if isinstance(f, dict) and f.get("name"):
                    names.append(str(f["name"]))
                elif isinstance(f, str):
                    names.append(f)
            fielder_names = "|".join(names)

    return wicket_count, player_out, dismissal_kind, fielder_names


def parse_modern_innings(
    match_meta: Dict[str, Any],
    innings_index: int,
    innings_item: Dict[str, Any],
    total_teams: List[str],
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    batting_team = str(innings_item.get("team", ""))
    bowling_team = next((t for t in total_teams if t != batting_team), "")

    innings_runs = 0
    innings_wkts = 0

    overs = innings_item.get("overs", [])
    if not isinstance(overs, list):
        return rows

    for over_obj in overs:
        if not isinstance(over_obj, dict):
            continue

        over_number = int(over_obj.get("over", 0))
        deliveries = over_obj.get("deliveries", [])
        if not isinstance(deliveries, list):
            continue

        legal_in_over = 0

        for delivery_index, delivery in enumerate(deliveries, start=1):
            if not isinstance(delivery, dict):
                continue

            runs = delivery.get("runs", {}) if isinstance(delivery.get("runs"), dict) else {}
            extras = delivery.get("extras", {}) if isinstance(delivery.get("extras"), dict) else {}

            wides = int(extras.get("wides", 0) or 0)
            noballs = int(extras.get("noballs", 0) or 0)
            byes = int(extras.get("byes", 0) or 0)
            legbyes = int(extras.get("legbyes", 0) or 0)
            penalties = int(extras.get("penalty", 0) or 0)

            legal_delivery = 1 if (wides == 0 and noballs == 0) else 0
            legal_in_over += legal_delivery

            batter_runs = int(runs.get("batter", 0) or 0)
            extras_runs = int(runs.get("extras", wides + noballs + byes + legbyes + penalties) or 0)
            total_runs = int(runs.get("total", batter_runs + extras_runs) or 0)

            wicket_count, player_out, dismissal_kind, fielder_names = parse_wickets(delivery)

            row = {
                **match_meta,
                "innings": innings_index,
                "batting_team": batting_team,
                "bowling_team": bowling_team,
                "over": over_number,
                "delivery_in_over": delivery_index,
                "legal_delivery_number": legal_in_over,
                "is_legal_delivery": legal_delivery,
                "ball_id": f"{over_number}.{delivery_index}",
                "batter": str(delivery.get("batter", "")),
                "non_striker": str(delivery.get("non_striker", "")),
                "bowler": str(delivery.get("bowler", "")),
                "batter_runs": batter_runs,
                "extras_runs": extras_runs,
                "total_runs": total_runs,
                "wides": wides,
                "noballs": noballs,
                "byes": byes,
                "legbyes": legbyes,
                "penalty": penalties,
                "is_wicket": 1 if wicket_count > 0 else 0,
                "wickets_on_ball": wicket_count,
                "player_out": player_out,
                "dismissal_kind": dismissal_kind,
                "fielders": fielder_names,
                "innings_runs_before": innings_runs,
                "innings_wkts_before": innings_wkts,
                "innings_runs_after": innings_runs + total_runs,
                "innings_wkts_after": innings_wkts + wicket_count,
            }
            rows.append(row)

            innings_runs += total_runs
            innings_wkts += wicket_count

    return rows


def parse_legacy_innings(
    match_meta: Dict[str, Any],
    innings_index: int,
    innings_item: Dict[str, Any],
    total_teams: List[str],
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []

    key = next(iter(innings_item.keys()))
    payload = innings_item.get(key, {}) if isinstance(innings_item.get(key), dict) else {}

    batting_team = str(payload.get("team", ""))
    bowling_team = next((t for t in total_teams if t != batting_team), "")

    innings_runs = 0
    innings_wkts = 0

    deliveries = payload.get("deliveries", [])
    if not isinstance(deliveries, list):
        return rows

    legal_counter_by_over: Dict[int, int] = {}

    for delivery_item in deliveries:
        if not isinstance(delivery_item, dict) or not delivery_item:
            continue

        ball_key = next(iter(delivery_item.keys()))
        delivery = delivery_item.get(ball_key, {}) if isinstance(delivery_item.get(ball_key), dict) else {}

        try:
            over_str, ball_str = str(ball_key).split(".", 1)
            over_number = int(over_str)
            delivery_in_over = int(ball_str)
        except (ValueError, TypeError):
            over_number = 0
            delivery_in_over = 0

        extras = delivery.get("extras", {}) if isinstance(delivery.get("extras"), dict) else {}
        runs = delivery.get("runs", {}) if isinstance(delivery.get("runs"), dict) else {}

        wides = int(extras.get("wides", 0) or 0)
        noballs = int(extras.get("noballs", 0) or 0)
        byes = int(extras.get("byes", 0) or 0)
        legbyes = int(extras.get("legbyes", 0) or 0)
        penalties = int(extras.get("penalty", 0) or 0)

        legal_delivery = 1 if (wides == 0 and noballs == 0) else 0
        legal_counter_by_over.setdefault(over_number, 0)
        legal_counter_by_over[over_number] += legal_delivery

        batter_runs = int(runs.get("batter", 0) or 0)
        extras_runs = int(runs.get("extras", wides + noballs + byes + legbyes + penalties) or 0)
        total_runs = int(runs.get("total", batter_runs + extras_runs) or 0)

        wicket_count, player_out, dismissal_kind, fielder_names = parse_wickets(delivery)

        row = {
            **match_meta,
            "innings": innings_index,
            "batting_team": batting_team,
            "bowling_team": bowling_team,
            "over": over_number,
            "delivery_in_over": delivery_in_over,
            "legal_delivery_number": legal_counter_by_over[over_number],
            "is_legal_delivery": legal_delivery,
            "ball_id": str(ball_key),
            "batter": str(delivery.get("batter", "")),
            "non_striker": str(delivery.get("non_striker", "")),
            "bowler": str(delivery.get("bowler", "")),
            "batter_runs": batter_runs,
            "extras_runs": extras_runs,
            "total_runs": total_runs,
            "wides": wides,
            "noballs": noballs,
            "byes": byes,
            "legbyes": legbyes,
            "penalty": penalties,
            "is_wicket": 1 if wicket_count > 0 else 0,
            "wickets_on_ball": wicket_count,
            "player_out": player_out,
            "dismissal_kind": dismissal_kind,
            "fielders": fielder_names,
            "innings_runs_before": innings_runs,
            "innings_wkts_before": innings_wkts,
            "innings_runs_after": innings_runs + total_runs,
            "innings_wkts_after": innings_wkts + wicket_count,
        }
        rows.append(row)

        innings_runs += total_runs
        innings_wkts += wicket_count

    return rows


def parse_match_file(file_path: Path) -> List[Dict[str, Any]]:
    with file_path.open("r", encoding="utf-8") as f:
        match = json.load(f)

    info = match.get("info", {}) if isinstance(match.get("info"), dict) else {}

    event = info.get("event", {}) if isinstance(info.get("event"), dict) else {}
    teams = info.get("teams", []) if isinstance(info.get("teams"), list) else []

    winner, result_margin = parse_outcome(info)

    match_meta = {
        "match_id": file_path.stem,
        "match_date": format_date(info),
        "season": str(info.get("season", "")),
        "city": str(info.get("city", "")),
        "venue": str(info.get("venue", "")),
        "match_type": str(info.get("match_type", "")),
        "gender": str(info.get("gender", "")),
        "event_name": str(event.get("name", "")),
        "event_match_number": str(event.get("match_number", "")),
        "team1": str(teams[0]) if len(teams) > 0 else "",
        "team2": str(teams[1]) if len(teams) > 1 else "",
        "toss_winner": str(safe_get(info, "toss", "winner", default="")),
        "toss_decision": str(safe_get(info, "toss", "decision", default="")),
        "winner": winner,
        "result_margin": result_margin,
        "player_of_match": str(first_or_none(info.get("player_of_match")) or ""),
    }

    rows: List[Dict[str, Any]] = []
    innings_items = get_innings_items(match)

    for innings_index, innings_item in enumerate(innings_items, start=1):
        if "overs" in innings_item and "team" in innings_item:
            innings_rows = parse_modern_innings(match_meta, innings_index, innings_item, teams)
        else:
            innings_rows = parse_legacy_innings(match_meta, innings_index, innings_item, teams)
        rows.extend(innings_rows)

    # Add chase target where possible (target for innings >= 2).
    totals_by_innings: Dict[int, int] = {}
    for row in rows:
        totals_by_innings[row["innings"]] = max(
            totals_by_innings.get(row["innings"], 0), int(row["innings_runs_after"])
        )

    first_innings_total = totals_by_innings.get(1)
    for row in rows:
        row["target_runs"] = first_innings_total + 1 if first_innings_total is not None and row["innings"] >= 2 else ""

    return rows


def collect_json_files(input_dir: Path) -> List[Path]:
    return sorted(input_dir.glob("*.json"))


def write_csv(rows: Iterable[Dict[str, Any]], output_csv: Path) -> None:
    rows_list = list(rows)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    if not rows_list:
        raise ValueError("No rows were generated. Check input JSON files.")

    fieldnames = list(rows_list[0].keys())
    with output_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_list)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Cricsheet JSON files to ball-by-ball CSV.")
    parser.add_argument(
        "--input-dir",
        default="data/raw/ipl_json",
        help="Path to directory containing Cricsheet JSON files.",
    )
    parser.add_argument(
        "--output-csv",
        default="data/processed/ball_by_ball.csv",
        help="Output CSV path.",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_csv = Path(args.output_csv)

    if not input_dir.exists() or not input_dir.is_dir():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")

    json_files = collect_json_files(input_dir)
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in: {input_dir}")

    all_rows: List[Dict[str, Any]] = []
    for idx, file_path in enumerate(json_files, start=1):
        try:
            all_rows.extend(parse_match_file(file_path))
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] Failed to parse {file_path.name}: {exc}")

        if idx % 100 == 0:
            print(f"Processed {idx}/{len(json_files)} matches...")

    write_csv(all_rows, output_csv)
    print(f"Done. Matches parsed: {len(json_files)}")
    print(f"Rows written: {len(all_rows)}")
    print(f"Output CSV: {output_csv}")


if __name__ == "__main__":
    main()
