"""SpCas9 PAM scanning and end-to-end analysis."""

from .models import CandidateSite
from .scoring import mismatch_positions, score_site
from .sequence import reverse_complement, validate_dna

GUIDE_LENGTH = 20
PAM_LENGTH = 3


def _sites_on_strand(sequence: str) -> list[tuple[int, str, str]]:
    sites = []
    for index in range(len(sequence) - GUIDE_LENGTH - PAM_LENGTH + 1):
        spacer = sequence[index:index + GUIDE_LENGTH]
        pam = sequence[index + GUIDE_LENGTH:index + GUIDE_LENGTH + PAM_LENGTH]
        if pam[1:] == "GG":
            sites.append((index, spacer, pam))
    return sites


def analyze_sequence(sequence: str, guide: str) -> list[dict]:
    """Scan both strands and return candidate sites as dictionaries."""
    sequence = validate_dna(sequence)
    guide = validate_dna(guide)
    if len(guide) != GUIDE_LENGTH:
        raise ValueError("Guide RNA must be exactly 20 bases long.")

    candidates: list[CandidateSite] = []
    for index, spacer, pam in _sites_on_strand(sequence):
        positions = mismatch_positions(guide, spacer)
        score, risk_level = score_site(positions)
        classification = _classify_site(len(positions), score)
        candidates.append(CandidateSite(index, spacer, pam, "+", len(positions), positions, score, risk_level, classification))

    reverse_sequence = reverse_complement(sequence)
    for index, spacer, pam in _sites_on_strand(reverse_sequence):
        positions = mismatch_positions(guide, spacer)
        score, risk_level = score_site(positions)
        original_position = len(sequence) - (index + GUIDE_LENGTH + PAM_LENGTH)
        classification = _classify_site(len(positions), score)
        candidates.append(CandidateSite(original_position, spacer, pam, "-", len(positions), positions, score, risk_level, classification))

    return [candidate.to_dict() for candidate in candidates]


def _classify_site(mismatch_count: int, score: float) -> str:
    """Give users a plain-English interpretation of each candidate."""
    if mismatch_count == 0:
        return "Intended target"
    if score >= 0.75:
        return "Dangerous off-target"
    if score >= 0.4:
        return "Possible off-target"
    return "Lower-risk off-target"
