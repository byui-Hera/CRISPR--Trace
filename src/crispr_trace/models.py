"""Typed data models for CRISPR-Trace."""

from dataclasses import dataclass

@dataclass(frozen=True)
class CandidateSite:
    """A candidate 20-base spacer adjacent to an NGG PAM."""

    position: int
    spacer: str
    pam: str
    strand: str
    mismatches: int
    mismatch_positions: tuple[int, ...]
    score: float
    risk_level: str
    classification: str
    

    def to_dict(self) -> dict:
        """Convert the model to a dashboard/export-friendly dictionary."""
        return {
            "position": self.position,
            "spacer": self.spacer,
            "pam": self.pam,
            "strand": self.strand,
            "mismatches": self.mismatches,
            "mismatch_positions": list(self.mismatch_positions),
            "score": self.score,
            "risk_level": self.risk_level,
            "classification": self.classification,
        }
