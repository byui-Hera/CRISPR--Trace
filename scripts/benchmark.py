"""Benchmark CRISPR-Trace scanning on reproducible synthetic DNA sequences.

Run from the project root:

    python scripts/benchmark.py
"""

from __future__ import annotations

import argparse
import json
import random
import statistics
import sys
import time
from pathlib import Path


# Allow this script to work before the package is installed in editable mode.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from crispr_trace.scanner import analyze_sequence  # noqa: E402


GUIDE = "ACGTACGTACGTACGTACGT"
BASES = "ACGT"


def build_sequence(length: int, seed: int) -> str:
    """Create deterministic DNA with one known intended target."""
    if length < 23:
        raise ValueError("Benchmark sequences must be at least 23 bases long.")

    generator = random.Random(seed)
    sequence = [generator.choice(BASES) for _ in range(length)]

    # Embed a known exact target when there is enough room for spacer + PAM.
    target_start = min(100, length - 23)
    sequence[target_start:target_start + 23] = list(GUIDE + "AGG")
    return "".join(sequence)


def benchmark_length(length: int, repeats: int) -> dict[str, float | int]:
    """Measure median analysis time for one sequence length."""
    sequence = build_sequence(length, seed=length)

    # Warm up once so the reported times focus on the analysis itself.
    analyze_sequence(sequence, GUIDE)

    elapsed_seconds = []
    result_count = 0
    for _ in range(repeats):
        started = time.perf_counter()
        results = analyze_sequence(sequence, GUIDE)
        elapsed_seconds.append(time.perf_counter() - started)
        result_count = len(results)

    return {
        "sequence_length": length,
        "candidate_sites": result_count,
        "median_ms": round(statistics.median(elapsed_seconds) * 1000, 3),
        "min_ms": round(min(elapsed_seconds) * 1000, 3),
        "max_ms": round(max(elapsed_seconds) * 1000, 3),
        "repeats": repeats,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark CRISPR-Trace sequence scanning."
    )
    parser.add_argument(
        "--lengths",
        nargs="+",
        type=int,
        default=[1_000, 10_000, 100_000],
        help="DNA lengths to test (default: 1000 10000 100000).",
    )
    parser.add_argument(
        "--repeats",
        type=int,
        default=5,
        help="Number of timed repetitions per sequence length (default: 5).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON instead of a formatted table.",
    )
    args = parser.parse_args()

    if args.repeats < 1:
        parser.error("--repeats must be at least 1.")
    if any(length < 23 for length in args.lengths):
        parser.error("Every sequence length must be at least 23.")
    return args


def main() -> None:
    args = parse_args()
    results = [benchmark_length(length, args.repeats) for length in args.lengths]

    if args.json:
        print(json.dumps(results, indent=2))
        return

    print("CRISPR-Trace benchmark")
    print(f"Guide length: {len(GUIDE)} bases | Repeats: {args.repeats}")
    print()
    print(f"{'DNA bases':>12} {'Candidates':>12} {'Median ms':>12} {'Min ms':>10} {'Max ms':>10}")
    print("-" * 62)
    for result in results:
        print(
            f"{result['sequence_length']:>12,} "
            f"{result['candidate_sites']:>12,} "
            f"{result['median_ms']:>12.3f} "
            f"{result['min_ms']:>10.3f} "
            f"{result['max_ms']:>10.3f}"
        )


if __name__ == "__main__":
    main()
