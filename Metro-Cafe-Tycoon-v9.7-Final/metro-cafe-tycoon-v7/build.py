#!/usr/bin/env python3
"""Rebuild js/game.js from ordered feature source files. Run: python build.py"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "js" / "src"
OUTPUT = ROOT / "js" / "game.js"
parts = sorted(SOURCE.glob("*.js"))
if not parts:
    raise SystemExit("No source files found in js/src")
content = "\n\n".join(p.read_text(encoding="utf-8") for p in parts)
OUTPUT.write_text(content, encoding="utf-8")
print(f"Built {OUTPUT.relative_to(ROOT)} from {len(parts)} feature files")
