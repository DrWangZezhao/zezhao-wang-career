#!/usr/bin/env python3
"""Generate 20 profile-aware, multilingual CVs from the canonical career database."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import CondPageBreak, HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = Path(os.environ.get("CV_PUBLIC_DIR", ROOT / "public" / "cv"))
OUTPUT_DIR = Path(os.environ.get("CV_OUTPUT_DIR", ROOT / "outputs" / "cv"))
CONTENT_REVISION = "2026-09-09-v2"
TEMPLATE_REVISION = "cv-template-v2"
LOCALES = ["en", "es", "zh", "fi"]
PROFILES = ["general", "ai-evaluation", "data-people-analytics", "customer-business-growth", "research-assessment"]
MONTHS = {
    "en": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "es": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"],
    "zh": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    "fi": ["tammi", "helmi", "maalis", "huhti", "touko", "kesä", "heinä", "elo", "syys", "loka", "marras", "joulu"],
}


def load_json(path: str) -> Any:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


DATA = {
    name: load_json(f"content/{name}.json")
    for name in ["contacts", "organisations", "education", "experiences", "projects", "publications", "languages", "evidence", "skills", "methods", "capabilities", "tools", "dissertations"]
}
DATA["identity"] = load_json("content/identity.json")

if os.environ.get("CV_FIXTURE_METRIC"):
    next(item for item in DATA["evidence"] if item["id"] == "ev-edx-users")["metric"]["value"] = int(os.environ["CV_FIXTURE_METRIC"])


def by_id(items: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
    item = next((candidate for candidate in items if candidate["id"] == item_id), None)
    if item is None:
        raise KeyError(f"Missing canonical record {item_id}")
    return item


def metric_text(metric: dict[str, Any], locale: str) -> str:
    if metric["unit"] == "R²":
        value = f'{metric["value"]:.3f}'
        if locale in {"es", "fi"}:
            value = value.replace(".", ",")
        return f'R² {metric["displayOperator"]} {value}'
    value = f'{int(metric["value"]):,}'
    if locale == "es":
        value = value.replace(",", ".")
    elif locale == "fi":
        value = value.replace(",", " ")
    units = {"en": "users", "es": "usuarios", "zh": "名用户", "fi": "käyttäjää"}
    return f'{value}{metric["displayOperator"]} {units[locale]}'


def resolve_text(text: str, locale: str) -> str:
    for evidence in DATA["evidence"]:
        placeholder = "{metric:" + evidence["id"] + "}"
        if placeholder in text:
            text = text.replace(placeholder, metric_text(evidence["metric"], locale))
    return text


def partial_date(item: dict[str, Any], locale: str) -> str:
    if item["precision"] == "year":
        return str(item["year"])
    month = MONTHS[locale][item["month"] - 1]
    return f'{item["year"]}年{month}' if locale == "zh" else f'{month} {item["year"]}'


def date_range(item: dict[str, Any], locale: str) -> str:
    start, end = partial_date(item["start"], locale), partial_date(item["end"], locale)
    return start if start == end else f"{start} - {end}"


def filename(profile_id: str, locale: str) -> str:
    names = {
        "general": "Overview",
        "ai-evaluation": "AI_Evaluation_Data_Quality",
        "data-people-analytics": "Data_User_Insights",
        "customer-business-growth": "Customer_Insights_Growth_Support",
        "research-assessment": "Research_Assessment",
    }
    return f'Zezhao_Wang_{names[profile_id]}_CV_{locale.upper()}.pdf'


def resolve(profile_id: str, locale: str) -> dict[str, Any]:
    config = load_json(f"profile-config/{profile_id}.json")
    locale_file = load_json(f"locales/{locale}.json")
    msg = locale_file["messages"]
    priority = {item_id: index for index, item_id in enumerate(config["evidencePriorityIds"])}
    orgs = DATA["organisations"]

    experiences = []
    for experience_id in config["experienceIds"]:
        item = by_id(DATA["experiences"], experience_id)
        selected = [by_id(DATA["evidence"], evidence_id) for evidence_id in item["evidenceIds"] if evidence_id in priority]
        selected = [evidence for evidence in selected if evidence["visibility"] == "public"]
        selected.sort(key=lambda evidence: priority[evidence["id"]])
        limit = config["cv"]["evidenceLimits"].get(item["id"], 1)
        experiences.append({
            "id": item["id"], "title": msg[item["titleKey"]],
            "organisations": " · ".join(by_id(orgs, org_id)["canonicalName"] for org_id in item["organisationIds"]),
            "dates": date_range(item, locale),
            "bullets": [resolve_text(msg[evidence["statementKey"]], locale) for evidence in selected[:limit]],
        })

    projects = []
    for project_id in config["projectIds"]:
        item = by_id(DATA["projects"], project_id)
        evidence = [by_id(DATA["evidence"], evidence_id) for evidence_id in item["evidenceIds"]]
        evidence = [ev for ev in evidence if ev["visibility"] == "public"][: config["cv"]["projectEvidenceLimit"]]
        projects.append({
            "title": msg[item["titleKey"]], "summary": msg[item["summaryKey"]], "url": item["url"],
            "dates": date_range(item, locale), "bullets": [resolve_text(msg[ev["statementKey"]], locale) for ev in evidence],
        })

    education = []
    for education_id in config["educationIds"]:
        item = by_id(DATA["education"], education_id)
        dissertation = by_id(DATA["dissertations"], item["dissertationId"])["title"] if item.get("dissertationId") else None
        education.append({
            "degree": msg[item["degreeKey"]], "field": msg[item["fieldKey"]],
            "organisation": by_id(orgs, item["organisationId"])["canonicalName"], "dates": date_range(item, locale),
            "honours": [msg[key] for key in item["honoursKeys"]], "dissertation": dissertation,
        })

    method_items = DATA["methods"] + DATA["capabilities"]
    groups = []
    for group_id in config["skillGroupIds"]:
        group = by_id(DATA["skills"]["groups"], group_id)
        groups.append({"name": msg[group["labelKey"]], "items": [msg[by_id(method_items, item_id)["labelKey"]] for item_id in group["itemIds"]]})

    tools = [by_id(DATA["tools"], item_id)["label"] for item_id in config["toolIds"]]
    languages = [{"name": msg[item["nameKey"]], "detail": msg["language.native"] if item["proficiency"] == "native" else item["proficiency"]} for item in DATA["languages"]]
    publications = []
    for publication_id in config["publicationIds"]:
        item = by_id(DATA["publications"], publication_id)
        publications.append({"citation": f'{item["authors"]} ({item["year"]}). {item["title"]}. {item["venue"]}, {item["volume"]}, {item["pages"]}.', "url": item["url"]})

    contacts = [item for item in DATA["contacts"] if item["public"] and item.get("value")]
    email = next(item["value"] for item in contacts if item["type"] == "email")
    links = [{"label": msg[item["labelKey"]], "url": item["value"]} for item in contacts if item["type"] == "url"]
    return {
        "profile_id": profile_id, "locale": locale, "document_language": locale_file["documentLanguage"],
        "name": DATA["identity"]["displayName"], "email": email, "links": links, "location": msg["site.location"],
        "professional_title": msg[DATA["identity"]["professionalTitleKey"]], "specialisation": msg[DATA["identity"]["specialisationKey"]],
        "profile_name": msg[config["nameKey"]], "headline": msg[config["headlineKey"]], "summary": msg[config["summaryKey"]],
        "target_roles": [msg[key] for key in config["targetRoleKeys"]], "experiences": experiences, "projects": projects,
        "education": education, "skills": groups, "tools": tools, "languages": languages, "publications": publications,
        "labels": msg, "template": config["cv"]["template"],
    }


def register_font() -> str:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf", "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            try:
                pdfmetrics.registerFont(TTFont("CareerSans", candidate))
                return "CareerSans"
            except Exception:
                continue
    raise RuntimeError("No embeddable font with multilingual coverage was found")


FONT = register_font()


def xml(text: str) -> str:
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0f6c62"))
    canvas.rect(0, A4[1] - 5 * mm, A4[0], 5 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#d9d5ca"))
    canvas.line(18 * mm, 12 * mm, A4[0] - 18 * mm, 12 * mm)
    canvas.setFont(FONT, 7)
    canvas.setFillColor(colors.HexColor("#506260"))
    canvas.drawString(18 * mm, 7.5 * mm, "ZEZHAO WANG · 2026")
    canvas.drawRightString(A4[0] - 18 * mm, 7.5 * mm, str(doc.page))
    canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    ink, soft, teal, coral = [colors.HexColor(code) for code in ["#132626", "#405654", "#0f6c62", "#e46d4c"]]
    return {
        "name": ParagraphStyle("Name", parent=base["Normal"], fontName=FONT, fontSize=27, leading=29, textColor=ink, spaceAfter=4),
        "eyebrow": ParagraphStyle("Eyebrow", parent=base["Normal"], fontName=FONT, fontSize=7.2, leading=9, textColor=teal, spaceAfter=5, tracking=1.1),
        "headline": ParagraphStyle("Headline", parent=base["Normal"], fontName=FONT, fontSize=11.5, leading=14.5, textColor=soft, spaceAfter=6),
        "summary": ParagraphStyle("Summary", parent=base["Normal"], fontName=FONT, fontSize=8.3, leading=11.8, textColor=soft, spaceAfter=7),
        "contact": ParagraphStyle("Contact", parent=base["Normal"], fontName=FONT, fontSize=6.8, leading=9.6, textColor=soft, alignment=TA_RIGHT),
        "section": ParagraphStyle("Section", parent=base["Normal"], fontName=FONT, fontSize=8.2, leading=10, textColor=teal, spaceBefore=8, spaceAfter=5, tracking=1.2),
        "entry": ParagraphStyle("Entry", parent=base["Normal"], fontName=FONT, fontSize=9.5, leading=11.5, textColor=ink, spaceAfter=1),
        "meta": ParagraphStyle("Meta", parent=base["Normal"], fontName=FONT, fontSize=7, leading=9, textColor=teal),
        "date": ParagraphStyle("Date", parent=base["Normal"], fontName=FONT, fontSize=7, leading=9, textColor=soft, alignment=TA_RIGHT),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontName=FONT, fontSize=7.7, leading=10.6, textColor=soft, spaceAfter=2),
        "bullet": ParagraphStyle("Bullet", parent=base["Normal"], fontName=FONT, fontSize=7.65, leading=10.4, textColor=soft, leftIndent=8, firstLineIndent=-7, bulletIndent=0, spaceAfter=1.7),
        "small": ParagraphStyle("Small", parent=base["Normal"], fontName=FONT, fontSize=6.7, leading=9, textColor=soft),
        "roles": ParagraphStyle("Roles", parent=base["Normal"], fontName=FONT, fontSize=7.2, leading=9.5, textColor=ink),
    }


def section_header(story: list[Any], title: str, sty: dict[str, ParagraphStyle]) -> None:
    story.append(CondPageBreak(18 * mm))
    story.append(Paragraph(xml(title.upper()), sty["section"]))
    story.append(HRFlowable(width="100%", thickness=.6, color=colors.HexColor("#8ea09e"), spaceAfter=5))


def build_pdf(view: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(output_path), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=15 * mm, bottomMargin=16 * mm,
        title=f'{view["name"]} · {view["profile_name"]}', author=view["name"], subject=f'CV · {CONTENT_REVISION} · {view["locale"]} · {view["profile_id"]}')
    sty, labels = styles(), view["labels"]
    link_lines = [xml(view["location"]), f'<link href="mailto:{xml(view["email"])}" color="#0f6c62">{xml(view["email"])}</link>']
    link_lines.extend(f'<link href="{xml(link["url"])}" color="#0f6c62">{xml(link["label"])}</link>' for link in view["links"])
    heading = [Paragraph(xml(f'{labels["cv.label"]} · {view["profile_name"]}'), sty["eyebrow"]), Paragraph(xml(view["name"]), sty["name"]), Paragraph(xml(f'{view["professional_title"]} · {view["specialisation"]}'), sty["headline"])]
    header = Table([[heading, Paragraph("<br/>".join(link_lines), sty["contact"])]], colWidths=[124 * mm, 45 * mm])
    header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    role_box = Table([[Paragraph(f'<b>{xml(labels["section.roleFit"])}:</b> {xml(" · ".join(view["target_roles"]))}', sty["roles"])]], colWidths=[169 * mm])
    role_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ece7db")), ("BOX", (0, 0), (-1, -1), .4, colors.HexColor("#d9d5ca")), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story: list[Any] = [header, HRFlowable(width="100%", thickness=2.2, color=colors.HexColor("#132626"), spaceBefore=3, spaceAfter=7), Paragraph(xml(view["summary"]), sty["summary"]), role_box]

    section_header(story, labels["section.experience"], sty)
    for experience in view["experiences"]:
        story.append(CondPageBreak(30 * mm))
        title = Table([[Paragraph(xml(experience["title"]), sty["entry"]), Paragraph(xml(experience["dates"]), sty["date"])]], colWidths=[137 * mm, 32 * mm])
        title.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        story.extend([title, Paragraph(xml(experience["organisations"]), sty["meta"])])
        for bullet in experience["bullets"]:
            story.append(Paragraph("• " + xml(bullet), sty["bullet"]))
        story.append(Spacer(1, 2.5))

    story.append(PageBreak())
    section_header(story, labels["cv.selectedProject"], sty)
    for project in view["projects"]:
        project_title = Table([[Paragraph(xml(project["title"]), sty["entry"]), Paragraph(xml(project["dates"]), sty["date"])]], colWidths=[137 * mm, 32 * mm])
        project_title.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
        story.extend([project_title, Paragraph(xml(project["summary"]), sty["body"])])
        for bullet in project["bullets"]:
            story.append(Paragraph("• " + xml(bullet), sty["bullet"]))
        if project["url"]:
            story.append(Paragraph(f'<link href="{xml(project["url"])}" color="#0f6c62">{xml(project["url"].replace("https://", ""))}</link>', sty["small"]))

    section_header(story, labels["section.education"], sty)
    for item in view["education"]:
        honours = " · ".join(item["honours"])
        left = f'<b>{xml(item["degree"])} · {xml(item["field"])}</b><br/><font color="#405654">{xml(item["organisation"])}</font>'
        if honours:
            left += f'<br/><font color="#e46d4c">{xml(honours)}</font>'
        if item["dissertation"]:
            left += f'<br/><font size="6.4"><b>{xml(labels["education.dissertation"])}:</b> {xml(item["dissertation"])}</font>'
        row = Table([[Paragraph(left, sty["body"]), Paragraph(xml(item["dates"]), sty["date"])]], colWidths=[137 * mm, 32 * mm])
        row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.append(row)

    section_header(story, labels["cv.coreCapabilities"], sty)
    skill_rows = [[Paragraph(f'<b>{xml(group["name"])}</b>', sty["small"]), Paragraph(xml(" · ".join(group["items"])), sty["small"])] for group in view["skills"]]
    skill_rows.append([Paragraph(f'<b>{xml(labels["section.tools"])}</b>', sty["small"]), Paragraph(xml(" · ".join(view["tools"])), sty["small"])])
    skill_table = Table(skill_rows, colWidths=[32 * mm, 137 * mm])
    skill_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 2.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5), ("LINEBELOW", (0, 0), (-1, -2), .25, colors.HexColor("#d9d5ca"))]))
    story.append(skill_table)

    section_header(story, labels["section.languages"], sty)
    language_cells = [Paragraph(f'<b>{xml(item["name"])}</b><br/>{xml(item["detail"])}', sty["small"]) for item in view["languages"]]
    rows = [language_cells[:3], language_cells[3:] + [""]]
    language_table = Table(rows, colWidths=[56.3 * mm] * 3)
    language_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    story.append(language_table)

    if view["publications"]:
        section_header(story, labels["section.publications"], sty)
        for item in view["publications"]:
            story.append(Paragraph(f'<link href="{xml(item["url"])}" color="#0f6c62">{xml(item["citation"])}</link>', sty["body"]))

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


def content_hash() -> str:
    digest = hashlib.sha256()
    for folder in ["content", "profile-config", "locales"]:
        for path in sorted((ROOT / folder).glob("*.json")):
            digest.update(path.name.encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for directory in [PUBLIC_DIR, OUTPUT_DIR]:
        for old_pdf in directory.glob("*.pdf"):
            old_pdf.unlink()
    manifest = {"contentRevision": CONTENT_REVISION, "templateRevision": TEMPLATE_REVISION, "contentHash": content_hash(), "files": []}
    for profile_id in PROFILES:
        for locale in LOCALES:
            view = resolve(profile_id, locale)
            name = filename(profile_id, locale)
            public_path, output_path = PUBLIC_DIR / name, OUTPUT_DIR / name
            build_pdf(view, public_path)
            shutil.copy2(public_path, output_path)
            manifest["files"].append({"filename": name, "profileId": profile_id, "locale": locale, "documentLanguage": view["document_language"], "template": view["template"], "sha256": hashlib.sha256(public_path.read_bytes()).hexdigest()})
    for directory in [PUBLIC_DIR, OUTPUT_DIR]:
        (directory / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f'Generated {len(manifest["files"])} PDFs in {PUBLIC_DIR}')


if __name__ == "__main__":
    main()
