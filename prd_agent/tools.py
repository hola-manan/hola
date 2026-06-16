"""LangChain tools used by the PRD graph.

- ``list_prd_styles`` / ``get_prd_style`` expose the process-style references in
  the sibling ``prds/`` folder, so the draft stage can target a specific format.
- ``save_prd`` persists a finished PRD to disk.
"""

from __future__ import annotations

import re
from pathlib import Path

from langchain_core.tools import tool

PRDS_DIR = Path(__file__).resolve().parent.parent / "prds"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"


def _style_path(name: str) -> Path | None:
    """Resolve a style key (with or without the NN- prefix) to a file in prds/."""
    name = name.strip().lower().removesuffix(".md")
    for path in sorted(PRDS_DIR.glob("[0-9][0-9]-*.md")):
        stem = path.stem
        if name in (stem, re.sub(r"^\d+-", "", stem)):
            return path
    return None


@tool
def list_prd_styles() -> str:
    """List the available PRD process styles (Amazon PR/FAQ, lean one-pager, etc.).

    Returns one style per line as ``key: title`` where ``key`` can be passed to
    get_prd_style.
    """
    lines = []
    for path in sorted(PRDS_DIR.glob("[0-9][0-9]-*.md")):
        key = re.sub(r"^\d+-", "", path.stem)
        first_line = path.read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        lines.append(f"{key}: {first_line}")
    return "\n".join(lines) if lines else "(no styles found)"


@tool
def get_prd_style(name: str) -> str:
    """Return the full description of one PRD process style by its key.

    Use this before drafting when the PRD should follow a specific format so the
    structure matches that style.
    """
    path = _style_path(name)
    if path is None:
        return f"Unknown style '{name}'. Call list_prd_styles to see valid keys."
    return path.read_text(encoding="utf-8")


@tool
def save_prd(content: str, filename: str) -> str:
    """Write the final PRD to the output/ directory and return its path."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe = Path(filename).name or "prd.md"
    if not safe.endswith(".md"):
        safe += ".md"
    dest = OUTPUT_DIR / safe
    dest.write_text(content, encoding="utf-8")
    return str(dest)


# Plain (non-tool) helpers for deterministic use inside nodes.
def save_prd_to_disk(content: str, filename: str) -> str:
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe = Path(filename).name or "prd.md"
    if not safe.endswith(".md"):
        safe += ".md"
    dest = OUTPUT_DIR / safe
    dest.write_text(content, encoding="utf-8")
    return str(dest)


def read_style(name: str) -> str | None:
    path = _style_path(name)
    return path.read_text(encoding="utf-8") if path else None


def available_styles() -> list[dict]:
    """Return [{key, title}] for every PRD process style in prds/.

    Mirrors list_prd_styles so the web dropdown and the --style CLI keys stay in sync.
    """
    styles = []
    for path in sorted(PRDS_DIR.glob("[0-9][0-9]-*.md")):
        key = re.sub(r"^\d+-", "", path.stem)
        title = path.read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        title = re.sub(r"^\d+\.\s*", "", title)  # drop leading "1. " numbering
        styles.append({"key": key, "title": title})
    return styles


STYLE_TOOLS = [list_prd_styles, get_prd_style]
