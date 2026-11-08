"""Mismatch analysis and transparent heuristic scoring."""


def mismatch_positions(guide: str, spacer: str) -> tuple[int, ...]:
    """Return zero-based positions where guide and spacer differ."""
    if len(guide) != len(spacer):
        raise ValueError("Guide and spacer must have the same length.")
    return tuple(
        index
        for index, (guide_base, spacer_base) in enumerate(zip(guide, spacer))
        if guide_base != spacer_base
    )


def score_site(positions: tuple[int, ...]) -> tuple[float, str]:
    """Score a site, penalizing mismatches in the PAM-proximal seed region."""
    seed_mismatches = sum(position >= 12 for position in positions)
    non_seed_mismatches = len(positions) - seed_mismatches
    score = max(0.1, round(1.0 - 0.2 * seed_mismatches - 0.1 * non_seed_mismatches, 2))

    if score >= 0.75:
        return score, "High"
    if score >= 0.4:
        return score, "Medium"
    return score, "Low"
