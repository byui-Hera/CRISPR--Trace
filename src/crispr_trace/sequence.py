"""DNA sequence normalization and strand operations."""


def validate_dna(sequence: str) -> str:
    """Normalize a DNA sequence and reject unsupported characters."""
    normalized = sequence.upper().strip()
    if not normalized:
        raise ValueError("DNA sequence cannot be empty.")
    if any(base not in "ACGT" for base in normalized):
        raise ValueError("DNA may contain only A, C, G, and T.")
    return normalized


def reverse_complement(sequence: str) -> str:
    """Return the reverse-complement strand of a DNA sequence."""
    sequence = validate_dna(sequence)
    return sequence.translate(str.maketrans("ACGT", "TGCA"))[::-1]
