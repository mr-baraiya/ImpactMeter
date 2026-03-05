# Problem Definition

T20 cricket performance is usually judged using isolated stats such as runs, strike rate, or wickets. These single metrics ignore match context and pressure.

ImpactMeter aims to produce one player impact score per match that combines:
- Performance (batting and bowling contribution)
- Context (phase of innings)
- Pressure (game state difficulty)
- Recency (last 10 innings weighted toward recent matches)

## Goal
Build a transparent, reproducible pipeline that converts raw ball-by-ball data into a normalized 0-100 ImpactMeter score and player rankings.

## Why It Matters
- Fairer comparison across player roles
- Better insight into clutch performance under pressure
- Easy interpretation for judges, analysts, and fans
