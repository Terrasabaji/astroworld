#!/usr/bin/env python3
"""Astro World Muhurta — JSON stdin -> JSON stdout."""
import json
import sys

from muhurta_engine import list_events, search_muhurtas


def main():
    try:
        p = json.loads(sys.stdin.read())
        op = p.get("op", "search")
        if op == "events":
            print(json.dumps(list_events()))
            return
        if op == "search":
            print(json.dumps(search_muhurtas(p)))
            return
        raise ValueError(f"Unknown op: {op}")
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
