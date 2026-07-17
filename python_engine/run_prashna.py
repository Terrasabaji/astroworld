#!/usr/bin/env python3
"""Astro World Prashna analysis — JSON stdin → JSON stdout."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from prashna import run_prashna_analysis


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
        report = run_prashna_analysis(payload)
        print(json.dumps(report))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
