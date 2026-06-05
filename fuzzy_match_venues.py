#!/usr/bin/env python3
"""
Fuzzy match unresolved venue transcriptions against a known venue database.
Produces a CSV with top-3 matches + confidence scores per record.
Records with top match < 70 are flagged for human review.
"""

import csv
import sys
from rapidfuzz import fuzz, process

VENUE_DB_PATH = "/root/.claude/uploads/e121db8c-1e22-4fc5-9133-c9a9a9d4467d/b9c07382-Expert_foodboards__Sheet1.csv"
UNRESOLVED_PATH = "/root/.claude/uploads/e121db8c-1e22-4fc5-9133-c9a9a9d4467d/48235b30-remaining_venues_to_match__Sheet1.csv"
OUTPUT_PATH = "/home/user/claude-test-1/venue_matches_output.csv"

NEEDS_REVIEW_THRESHOLD = 70


def load_venue_db(path):
    """Load venue DB. Returns dict: city -> list of venue names."""
    venues_by_city = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 5:
                continue
            city = row[1].strip()
            venue_name = row[4].strip()
            if city and venue_name:
                venues_by_city.setdefault(city, set()).add(venue_name)
    # Deduplicate and sort
    return {city: sorted(names) for city, names in venues_by_city.items()}


def load_unresolved(path):
    """Load unresolved records as list of dicts."""
    records = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    return records


def build_query(row):
    """Build a search string from the raw venue name + quote text."""
    parts = []
    raw = row.get("RawVenue", "").strip()
    q1 = row.get("Quote1", "").strip()
    q2 = row.get("Quote2", "").strip()
    if raw:
        parts.append(raw)
    if q1:
        parts.append(q1)
    if q2:
        parts.append(q2)
    return " ".join(parts)


def score_candidate(query, candidate):
    """
    Composite score: blend of token_set_ratio (good for partial/reordered) and
    partial_ratio (good for substring matches), weighted toward token_set.
    """
    ts = fuzz.token_set_ratio(query, candidate)
    pr = fuzz.partial_ratio(query, candidate)
    wr = fuzz.WRatio(query, candidate)
    # Weight: token_set 40%, partial 30%, WRatio 30%
    return round(ts * 0.4 + pr * 0.3 + wr * 0.3)


def find_top_matches(query, candidates, n=3):
    """Return top-n (venue_name, score) tuples."""
    if not candidates:
        return []
    scored = [(c, score_candidate(query, c)) for c in candidates]
    scored.sort(key=lambda x: -x[1])
    return scored[:n]


def main():
    print("Loading venue database...")
    venues_by_city = load_venue_db(VENUE_DB_PATH)
    print(f"  Cities loaded: {len(venues_by_city)}")
    for city, names in sorted(venues_by_city.items()):
        print(f"    {city}: {len(names)} venues")

    print("\nLoading unresolved records...")
    records = load_unresolved(UNRESOLVED_PATH)
    print(f"  Records: {len(records)}")

    # Build output rows
    fieldnames = list(records[0].keys()) + [
        "match_1", "score_1",
        "match_2", "score_2",
        "match_3", "score_3",
        "needs_human_review",
    ]

    results = []
    city_miss = set()

    for row in records:
        city = row.get("City", "").strip()
        query = build_query(row)

        candidates = venues_by_city.get(city, [])
        if not candidates:
            city_miss.add(city)

        matches = find_top_matches(query, candidates, n=3)

        out = dict(row)
        for i, (name, score) in enumerate(matches, start=1):
            out[f"match_{i}"] = name
            out[f"score_{i}"] = score
        # Pad missing slots
        for i in range(len(matches) + 1, 4):
            out[f"match_{i}"] = ""
            out[f"score_{i}"] = ""

        top_score = matches[0][1] if matches else 0
        out["needs_human_review"] = "YES" if (not matches or top_score < NEEDS_REVIEW_THRESHOLD) else "no"
        results.append(out)

    if city_miss:
        print(f"\nWARNING: No venue data for cities: {sorted(city_miss)}")

    # Write output
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    # Summary stats
    needs_review = sum(1 for r in results if r["needs_human_review"] == "YES")
    confident = len(results) - needs_review
    print(f"\nDone. Output: {OUTPUT_PATH}")
    print(f"  Total records : {len(results)}")
    print(f"  High confidence (>=70) : {confident}")
    print(f"  Needs human review (<70): {needs_review}")


if __name__ == "__main__":
    main()
