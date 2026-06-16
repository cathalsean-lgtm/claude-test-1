#!/usr/bin/env python3
"""
Fuzzy match unresolved venue transcriptions against known venue databases.
Sources:
  - Expert_foodboards CSV  (primary, city-keyed)
  - RECS_SOT Tracker CSV   (fills gaps, city names may differ)
Produces a CSV with top-3 matches + confidence scores per record.
Records with top match < 70 are flagged for human review.
"""

import csv
from rapidfuzz import fuzz

VENUE_DB_PATH   = "/root/.claude/uploads/e121db8c-1e22-4fc5-9133-c9a9a9d4467d/b9c07382-Expert_foodboards__Sheet1.csv"
RECS_SOT_PATH   = "/root/.claude/uploads/e121db8c-1e22-4fc5-9133-c9a9a9d4467d/ed0c57f3-RECS_SOT__Recs_Tracker.csv"
UNRESOLVED_PATH = "/root/.claude/uploads/e121db8c-1e22-4fc5-9133-c9a9a9d4467d/48235b30-remaining_venues_to_match__Sheet1.csv"
OUTPUT_PATH     = "/home/user/claude-test-1/venue_matches_output.csv"

NEEDS_REVIEW_THRESHOLD = 70

# Map unresolved-file city names → RECS_SOT city names
CITY_ALIAS = {
    "Hobart":        "Tasmania",
    "Auckland":      "NZ - Auckland",
    "Central Otago": "NZ - Central Otago",
    "Christchurch":  "NZ - Christchurch",
    "Wellington":    "NZ - Wellington",
    "Tokyo":         "Japan",
    # These match directly:
    "Bangkok":       "Bangkok",
    "Cairns":        "Cairns",
    "Canberra":      "Canberra",
    "Darwin":        "Darwin",
    "Port Douglas":  "Port Douglas",
    "Singapore":     "Singapore",
}


def load_venue_db(path):
    """Expert_foodboards: col[1]=city, col[4]=venue name."""
    venues = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.reader(f):
            if len(row) < 5:
                continue
            city, name = row[1].strip(), row[4].strip()
            if city and name:
                venues.setdefault(city, set()).add(name)
    return {c: sorted(v) for c, v in venues.items()}


def load_recs_sot(path):
    """RECS_SOT tracker: col[1]=city, col[4]='Answer' (venue name)."""
    venues = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    # First two rows are headers
    for row in rows[2:]:
        if len(row) < 5:
            continue
        city, name = row[1].strip(), row[4].strip()
        if city and name:
            venues.setdefault(city, set()).add(name)
    return {c: sorted(v) for c, v in venues.items()}


def load_unresolved(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_queries(row):
    """Return (raw_venue_query, full_query). Full includes quote context."""
    raw  = row.get("RawVenue","").strip()
    q1   = row.get("Quote1","").strip()
    q2   = row.get("Quote2","").strip()
    full = " ".join(x for x in [raw, q1, q2] if x)
    return raw, full


def composite(query, candidate):
    if not query:
        return 0
    # token_set_ratio strips shared generic words (e.g. "coffee roasters") then
    # compares only remainders — this causes false positives when venues share
    # category words. Use partial_ratio + WRatio instead: partial_ratio correctly
    # rewards the raw name being a substring of the full official venue name.
    pr = fuzz.partial_ratio(query, candidate)
    wr = fuzz.WRatio(query, candidate)
    return round(pr * 0.55 + wr * 0.45)


def score_candidate(raw, full_query, candidate):
    """Take the max of raw-venue score and full-query score.
    This prevents quote noise from swamping a strong venue-name match."""
    return max(composite(raw, candidate), composite(full_query, candidate))


def find_top_matches(raw, full_query, candidates, n=3):
    if not candidates:
        return []
    scored = sorted(
        ((c, score_candidate(raw, full_query, c)) for c in candidates),
        key=lambda x: -x[1]
    )
    return scored[:n]


def main():
    print("Loading venue databases...")
    primary   = load_venue_db(VENUE_DB_PATH)
    secondary = load_recs_sot(RECS_SOT_PATH)

    # Merge: primary wins if city exists in both
    combined = dict(secondary)
    for city, names in primary.items():
        existing = set(combined.get(city, []))
        existing.update(names)
        combined[city] = sorted(existing)

    total_venues = sum(len(v) for v in combined.values())
    print(f"  {len(combined)} cities, {total_venues} total venue entries")

    print("\nLoading unresolved records...")
    records = load_unresolved(UNRESOLVED_PATH)
    print(f"  {len(records)} records")

    fieldnames = list(records[0].keys()) + [
        "match_1","score_1","match_2","score_2","match_3","score_3","needs_human_review"
    ]

    results = []
    still_missing = set()

    for row in records:
        city = row.get("City","").strip()

        # Resolve city alias to find candidates
        candidates = combined.get(city, [])
        if not candidates:
            alias = CITY_ALIAS.get(city)
            if alias:
                candidates = combined.get(alias, [])
        if not candidates:
            still_missing.add(city)

        raw, full_query = build_queries(row)
        matches = find_top_matches(raw, full_query, candidates)
        out = dict(row)
        for i, (name, score) in enumerate(matches, 1):
            out[f"match_{i}"] = name
            out[f"score_{i}"] = score
        for i in range(len(matches)+1, 4):
            out[f"match_{i}"] = ""
            out[f"score_{i}"] = ""

        top_score = matches[0][1] if matches else 0
        out["needs_human_review"] = "YES" if (not matches or top_score < NEEDS_REVIEW_THRESHOLD) else "no"
        results.append(out)

    if still_missing:
        print(f"\nWARNING: Still no venue data for: {sorted(still_missing)}")

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    needs_review = sum(1 for r in results if r["needs_human_review"] == "YES")
    print(f"\nDone. Output: {OUTPUT_PATH}")
    print(f"  Total records       : {len(results)}")
    print(f"  High confidence ≥70 : {len(results)-needs_review}")
    print(f"  Needs human review  : {needs_review}")

    # Sample high-confidence matches
    print("\nSample high-confidence matches:")
    hi = [r for r in results if r["needs_human_review"]=="no"]
    for r in hi[:20]:
        print(f"  {r['City']:<18} '{r['RawVenue'][:35]:<35}' => '{r['match_1']}' ({r['score_1']})")


if __name__ == "__main__":
    main()
