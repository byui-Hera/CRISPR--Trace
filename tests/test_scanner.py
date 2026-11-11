import unittest

from crispr_trace.scanner import analyze_sequence
from crispr_trace.scoring import mismatch_positions, score_site
from crispr_trace.sequence import reverse_complement, validate_dna


class TestSequenceTools(unittest.TestCase):
    def test_validation_normalizes_dna(self):
        self.assertEqual(validate_dna(" acgt "), "ACGT")

    def test_validation_rejects_invalid_bases(self):
        with self.assertRaises(ValueError):
            validate_dna("ACGX")

    def test_reverse_complement(self):
        self.assertEqual(reverse_complement("AAGC"), "GCTT")


class TestScoring(unittest.TestCase):
    def test_mismatch_positions(self):
        self.assertEqual(
            mismatch_positions("ACGTACGTACGTACGTACGT", "ACGTACGTACGTACGTACGA"),
            (19,),
        )

    def test_seed_mismatch_is_penalized_more(self):
        non_seed_score, _ = score_site((3,))
        seed_score, _ = score_site((15,))
        self.assertLess(seed_score, non_seed_score)


class TestScanner(unittest.TestCase):
    def test_finds_exact_target(self):
        guide = "ACGTACGTACGTACGTACGT"
        results = analyze_sequence("TTT" + guide + "AGG" + "CCC", guide)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["mismatches"], 0)
        self.assertEqual(results[0]["strand"], "+")
        self.assertEqual(results[0]["classification"], "Intended target")


if __name__ == "__main__":
    unittest.main()
