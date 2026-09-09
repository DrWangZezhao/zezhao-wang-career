#!/usr/bin/env python3
"""Validate structure, selectable text, links, privacy, and page health for all generated CVs."""

from pathlib import Path
import json
import re

import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "public" / "cv"
manifest = json.loads((PDF_DIR / "manifest.json").read_text(encoding="utf-8"))
assert len(manifest["files"]) == 20
assert len({entry["filename"] for entry in manifest["files"]}) == 20
forbidden = re.compile(r"not claimed|no claim|source-stated|owner-supplied|interpretation limit|not presented as|ZEZAO WANG", re.I)

for entry in manifest["files"]:
    path = PDF_DIR / entry["filename"]
    assert path.exists() and 20_000 <= path.stat().st_size <= 2_000_000, f"Unreasonable PDF size: {path.name}"
    reader = PdfReader(path)
    assert 1 <= len(reader.pages) <= 3, f"Unexpected page count: {path.name}"
    assert reader.metadata.title and "ZEZHAO WANG" in reader.metadata.title
    annotations = [ref for page in reader.pages for ref in (page.get("/Annots") or [])]
    link_targets = []
    for ref in annotations:
        action = ref.get_object().get("/A")
        if action and action.get("/URI"):
            link_targets.append(str(action.get("/URI")))
    assert any(target == "mailto:zezwang@alumni.uv.es" for target in link_targets), f"Missing email link: {path.name}"
    assert any("linkedin.com/in/zezhao-wang" in target for target in link_targets), f"Missing LinkedIn link: {path.name}"
    assert any("github.com/DrWangZezhao" in target for target in link_targets), f"Missing GitHub link: {path.name}"
    assert any("evaluation-data-inspector.streamlit.app" in target for target in link_targets), f"Missing project link: {path.name}"

    with pdfplumber.open(path) as pdf:
        page_texts = [page.extract_text() or "" for page in pdf.pages]
    assert all(len(text.strip()) > 200 for text in page_texts), f"Blank or nearly blank page: {path.name}"
    text = "\n".join(page_texts)
    assert "ZEZHAO WANG" in text, f"Unselectable/missing canonical name: {path.name}"
    assert "zezwang@alumni.uv.es" in text, f"Missing public email: {path.name}"
    assert "+34 647" not in text, f"Private phone leaked: {path.name}"
    assert "sourceRefs" not in text and "reviewNote" not in text, f"Internal metadata leaked: {path.name}"
    assert not forbidden.search(text), f"Forbidden public wording: {path.name}"
    assert not re.search(r"\{metric:[^}]+\}", text), f"Unresolved metric placeholder: {path.name}"
    assert not re.search(r"\b(20\d{2})\s*-\s*\1\b", text), f"Duplicate year range: {path.name}"
    if entry["locale"] == "zh":
        assert "教育" in text and "研究" in text, f"Chinese glyph extraction failed: {path.name}"
    if entry["locale"] == "fi":
        assert "Tutkimus" in text or "tutkimus" in text, f"Finnish text missing: {path.name}"

print(f'Validated text, links, privacy, metadata, page health, and file sizes for {len(manifest["files"])} PDFs.')
