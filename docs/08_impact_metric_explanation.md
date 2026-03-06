# ImpactMeter Logic Document (Current Rule-Based Version)

This document describes the current ImpactMeter scoring logic implemented in this repository.

## 1. Problem

Traditional cricket metrics (average, strike rate, wickets) often miss the full match story because they do not directly encode context and pressure.

ImpactMeter addresses this by combining performance with match situation.

Core goal:

`Impact = Performance x Match Context x Game Situation`

## 2. Data Pipeline

```text
Raw IPL JSON
      ↓
Ball-by-ball dataset
      ↓
Feature Engineering
      ↓
Rule-Based Impact Calculation
      ↓
Impact Score (0–100)
      ↓
Rolling last 10 innings
```

Instead of training a machine learning model, ImpactMeter currently uses a rule-based scoring system that combines engineered cricket features with weighted scoring logic.

## 3. Impact Score Calculation

Impact score is computed using transparent weighted scoring logic.

```text
Impact Score =
0.4 x Performance Score
+ 0.35 x Context Score
+ 0.25 x Pressure Score
```

Then normalize to a common scale:

Impact Score is normalized to a 0-100 scale using min-max scaling.

Where:

### Performance Score

Measures direct cricket contribution.

Example inputs:

- Runs Scored
- Strike Rate
- Boundaries
- Wickets Taken
- Economy Rate

### Context Score

Captures match situation.

Example inputs:

- Match phase (powerplay / middle / death)
- Opposition strength
- Team score context

### Pressure Score

Reflects difficulty of the situation.

Example conceptual formula:

`Pressure = Required Run Rate x Wickets Lost Factor x Overs Remaining Factor`

## 4. Why Rule-Based Approach

A rule-based approach was chosen to maintain transparency and interpretability of the impact score.

Each component of the score can be directly traced to cricket performance metrics, making the system easy to understand for analysts and non-technical users.

This level of explainability is useful for both technical reviewers and cricket analysts.

## 5. Rolling Impact

Final player form signal uses recent-match weighting.

```text
Final Impact = Weighted average of last 10 matches
```

Recent matches receive higher weight.

Example weights:

- Match10 -> weight 1.0
- Match9 -> weight 0.9
- Match8 -> weight 0.8

This helps ImpactMeter capture current form, not just long-term average.

## 6. Role-Aware Evaluation

ImpactMeter evaluates players differently based on role.

Batters are evaluated using batting metrics such as runs, strike rate, and boundaries.

Bowlers are evaluated using bowling metrics such as wickets, economy rate, and dot ball percentage.

All-rounders are evaluated using a balanced combination of batting and bowling metrics.

This prevents bowlers from being incorrectly evaluated using batting-only statistics.

This directly addresses role-mismatch issues in player evaluation.

## 7. Future Improvements

ImpactMeter currently uses a transparent rule-based scoring system to compute player impact using performance, match context, and pressure indicators.

As a future improvement, we plan to extend the system with machine learning models such as Random Forest to learn patterns directly from ball-by-ball data.

This would allow the system to automatically learn relationships between match context, pressure situations, and player performance while still keeping the rule-based score as an interpretable baseline.

This hybrid approach would combine:

- explainability from rule-based scoring
- pattern learning from machine learning models
