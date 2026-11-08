"""Command-line interface for CRISPR-Trace."""

from .scanner import analyze_sequence


def main() -> None:
    target = input("Enter target DNA sequence: ")
    guide = input("Enter guide RNA sequence: ")

    try:
        results = analyze_sequence(target, guide)
    except ValueError as error:
        print(f"Error: {error}")
        return

    if not results:
        print("No valid PAM sites found.")
        return

    for result in results:
        print(result)


if __name__ == "__main__":
    main()
