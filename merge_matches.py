#!/usr/bin/env python3
"""
Merge fuzzy match results back into the master quotes sheet.

For each 'uncertain' row, if our top match scored ≥ 70:
  - Update Venue with the matched venue name
  - Set MatchConfidence to 'fuzzy_matched'
If score < 70:
  - Keep Venue as-is (raw transcription)
  - Set MatchConfidence to 'needs_review'

Always append match_1..3 + score_1..3 columns so data team can inspect.
"""

import csv

QUOTES_PATH  = "/root/.claude/uploads/8cbffa9f-1046-547a-b5a6-d5b6a4b4dd02/f9af4d96-secondz_quotes_4.csv"
MATCHES_PATH = "/home/user/claude-test-1/venue_matches_output.csv"
OUTPUT_PATH  = "/home/user/claude-test-1/secondz_quotes_merged.csv"

THRESHOLD = 70


def make_key(row):
    """Join key: Name + RawVenue + TranscriptFile."""
    return (
        row.get("Name", "").strip(),
        row.get("RawVenue", "").strip(),
        row.get("TranscriptFile", "").strip(),
    )


def load_matches(path):
    """Return dict: key -> match row."""
    lookup = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            k = make_key(row)
            # Keep highest-scoring entry if duplicates
            if k not in lookup or int(row.get("score_1") or 0) > int(lookup[k].get("score_1") or 0):
                lookup[k] = row
    return lookup


def main():
    matches = load_matches(MATCHES_PATH)
    print(f"Loaded {len(matches)} fuzzy match results")

    extra_cols = ["match_1","score_1","match_2","score_2","match_3","score_3"]

    rows_out = []
    stats = {"high":0, "corrected":0, "fuzzy_matched":0, "needs_review":0, "unchanged":0}

    with open(QUOTES_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        base_fields = reader.fieldnames
        for row in reader:
            out = dict(row)
            # Initialise extra columns
            for col in extra_cols:
                out[col] = ""

            conf = row.get("MatchConfidence","").strip()

            if conf == "uncertain":
                k = make_key(row)
                m = matches.get(k)
                if m:
                    score = int(m.get("score_1") or 0)
                    out["match_1"] = m.get("match_1","")
                    out["score_1"] = m.get("score_1","")
                    out["match_2"] = m.get("match_2","")
                    out["score_2"] = m.get("score_2","")
                    out["match_3"] = m.get("match_3","")
                    out["score_3"] = m.get("score_3","")
                    if score >= THRESHOLD:
                        out["Venue"] = m["match_1"]
                        out["MatchConfidence"] = "fuzzy_matched"
                        stats["fuzzy_matched"] += 1
                    else:
                        out["MatchConfidence"] = "needs_review"
                        stats["needs_review"] += 1
                else:
                    out["MatchConfidence"] = "needs_review"
                    stats["needs_review"] += 1
            else:
                stats[conf] = stats.get(conf, 0) + 1

            rows_out.append(out)

    out_fields = base_fields + extra_cols
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        writer.writerows(rows_out)

    total = len(rows_out)
    print(f"\n=== MERGED OUTPUT: {OUTPUT_PATH} ===")
    print(f"Total rows         : {total:>5}")
    print(f"  high             : {stats.get('high',0):>5}")
    print(f"  corrected        : {stats.get('corrected',0):>5}")
    print(f"  fuzzy_matched    : {stats.get('fuzzy_matched',0):>5}  (≥{THRESHOLD} score, Venue updated)")
    print(f"  needs_review     : {stats.get('needs_review',0):>5}  (<{THRESHOLD} score, needs human)")
    resolved = stats.get('high',0) + stats.get('corrected',0) + stats.get('fuzzy_matched',0)
    print(f"\n  Fully resolved   : {resolved:>5} / {total}  ({resolved/total*100:.1f}%)")
    print(f"  Still unresolved : {stats.get('needs_review',0):>5} / {total}  ({stats.get('needs_review',0)/total*100:.1f}%)")


if __name__ == "__main__":
    main()
