from __future__ import annotations

import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import fitz
from PIL import Image
from pypdf import PdfReader

SOURCE_ROOT = Path(r"C:\Users\march\OneDrive\Documents\Website Portofolio & Project")
APP_ROOT = Path(__file__).resolve().parents[1]
EXTRA_ROOT = APP_ROOT / "extra-assets"
PUBLIC_ROOT = APP_ROOT / "public" / "portfolio-assets"
DATA_DIR = APP_ROOT / "src" / "data"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "asset"


def clean_title(path: Path) -> str:
    name = path.stem
    name = re.sub(r"\s*\(\d+\)$", "", name)
    name = name.replace("_", " ")
    name = re.sub(r"\s+", " ", name).strip()
    return name


def clean_pdf_text(text: str) -> str:
    text = text.replace("\u0000", "")
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue
        line = re.sub(r"\s+([,.;:%)])", r"\1", line)
        line = re.sub(r"([(])\s+", r"\1", line)
        line = re.sub(r"\s+-\s+", "-", line)
        lines.append(line)
    flat = " ".join(lines)
    flat = re.sub(r"\s+([,.;:%)])", r"\1", flat)
    flat = re.sub(r"([(])\s+", r"\1", flat)
    flat = re.sub(r"\s+", " ", flat).strip()
    if not flat:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", flat)
    paragraphs = []
    current = []
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        current.append(sentence)
        joined = " ".join(current)
        if len(joined) > 320 or len(current) >= 3:
            paragraphs.append(joined)
            current = []
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def remove_leading_title(body: str, title: str) -> str:
    paragraphs = text_paragraphs(body)
    if not paragraphs:
        return body
    title_words = re.findall(r"[A-Za-z0-9]+", title)
    if title_words:
        title_pattern = r"^\W*" + r"\W+".join(re.escape(word) for word in title_words) + r"\W*"
        cleaned = re.sub(title_pattern, "", paragraphs[0], count=1, flags=re.IGNORECASE).strip()
        if cleaned != paragraphs[0].strip():
            paragraphs[0] = cleaned
            if not paragraphs[0]:
                paragraphs = paragraphs[1:]
    return "\n\n".join(paragraphs)


def text_paragraphs(body: str) -> list[str]:
    return [part.strip() for part in body.split("\n\n") if part.strip()]


def pdf_text(path: Path, max_pages: int | None = None) -> str:
    try:
        reader = PdfReader(str(path))
        pages = reader.pages if max_pages is None else reader.pages[:max_pages]
        return clean_pdf_text("\n".join(page.extract_text() or "" for page in pages))
    except Exception:
        return ""


def pdf_pages(path: Path) -> int:
    try:
        return len(PdfReader(str(path)).pages)
    except Exception:
        return 0


def copy_asset(src: Path, dest_dir: Path, prefix: str | None = None) -> str:
    dest_dir.mkdir(parents=True, exist_ok=True)
    stem = slugify(prefix or src.stem)
    dest = dest_dir / f"{stem}{src.suffix.lower()}"
    counter = 2
    while dest.exists() and src.resolve() != dest.resolve():
        dest = dest_dir / f"{stem}-{counter}{src.suffix.lower()}"
        counter += 1
    shutil.copy2(src, dest)
    return "/" + dest.relative_to(APP_ROOT / "public").as_posix()


def pdf_thumb(src: Path, dest_dir: Path, width: int = 760) -> str | None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{slugify(src.stem)}.webp"
    try:
        doc = fitz.open(str(src))
        page = doc.load_page(0)
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        image.save(dest, "WEBP", quality=78, method=6)
        doc.close()
        return "/" + dest.relative_to(APP_ROOT / "public").as_posix()
    except Exception as exc:
        print(f"thumbnail failed for {src}: {exc}", file=sys.stderr)
        return None


def image_preview(src: Path, dest_dir: Path, width: int = 900) -> str | None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{slugify(src.stem)}.webp"
    try:
        with Image.open(src) as image:
            image = image.convert("RGB")
            ratio = width / image.width
            if ratio < 1:
                image = image.resize((width, max(1, int(image.height * ratio))), Image.Resampling.LANCZOS)
            image.save(dest, "WEBP", quality=76, method=6)
        return "/" + dest.relative_to(APP_ROOT / "public").as_posix()
    except Exception as exc:
        print(f"preview failed for {src}: {exc}", file=sys.stderr)
        return None


def media_image(src: Path, dest_dir: Path, prefix: str, width: int = 1000) -> dict[str, str | None]:
    return {
        "file": copy_asset(src, dest_dir, prefix),
        "preview": image_preview(src, PUBLIC_ROOT / "thumbs" / "profile", width=width),
    }


def find_poster_for_article(pdf: Path, posters: list[Path]) -> Path | None:
    title = clean_title(pdf).lower()
    rules = [
        ("delima", "delima"),
        ("ikan gabus", "gabus"),
        ("kalsium", "kalsium"),
        ("zinc", "zinc"),
        ("ppi", "maag"),
        ("maag", "maag"),
        ("fatty liver", "fatty liver"),
        ("fatty liver", "curcuma"),
    ]
    for article_key, poster_key in rules:
        if article_key in title:
            for poster in posters:
                if poster_key in clean_title(poster).lower():
                    return poster
    return None


def main() -> None:
    if PUBLIC_ROOT.exists():
        shutil.rmtree(PUBLIC_ROOT)
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    concept_src = APP_ROOT / "docs" / "visual-concept.png"
    concept_url = None
    if concept_src.exists():
        concept_url = copy_asset(concept_src, PUBLIC_ROOT / "system", "visual-concept")

    cv_src = SOURCE_ROOT / "CV_MARCHO.pdf"
    cv = {
        "title": "Marcho Original CV",
        "file": None,
        "thumb": None,
        "pages": pdf_pages(cv_src),
        "text": pdf_text(cv_src),
    }

    projects = []
    for src in sorted((SOURCE_ROOT / "Project").glob("*.html")):
        projects.append(
            {
                "title": clean_title(src),
                "file": copy_asset(src, PUBLIC_ROOT / "projects"),
                "size": src.stat().st_size,
                "type": "Interactive HTML Deck",
            }
        )

    slides = []
    for src in sorted((SOURCE_ROOT / "Showcase Scientific Slides").glob("*.pdf")):
        pages = pdf_pages(src)
        slides.append(
            {
                "title": clean_title(src),
                "file": copy_asset(src, PUBLIC_ROOT / "slides"),
                "thumb": pdf_thumb(src, PUBLIC_ROOT / "thumbs" / "slides"),
                "pages": pages,
            }
        )

    article_dir = SOURCE_ROOT / "Artikel"
    poster_sources = sorted(article_dir.glob("*.png"))
    articles = []
    for src in sorted(article_dir.glob("*.pdf")):
        title = clean_title(src)
        poster = find_poster_for_article(src, poster_sources)
        poster_original = copy_asset(poster, PUBLIC_ROOT / "articles" / "posters") if poster else None
        poster_preview = image_preview(poster, PUBLIC_ROOT / "thumbs" / "articles") if poster else pdf_thumb(src, PUBLIC_ROOT / "thumbs" / "articles")
        text = remove_leading_title(pdf_text(src), title)
        articles.append(
            {
                "title": title,
                "file": None,
                "poster": poster_original,
                "posterPreview": poster_preview,
                "pages": pdf_pages(src),
                "body": text,
                "excerpt": text[:520],
            }
        )

    designs = []
    for src in sorted((SOURCE_ROOT / "Design").glob("*.png")):
        designs.append(
            {
                "title": clean_title(src),
                "file": copy_asset(src, PUBLIC_ROOT / "designs"),
                "preview": image_preview(src, PUBLIC_ROOT / "thumbs" / "designs", width=1100),
                "size": src.stat().st_size,
                "pages": 1,
                "kind": "image",
                "summary": "Health education carousel design created to make public-facing medical topics easier to understand.",
            }
        )
    extra_design_pdf = EXTRA_ROOT / "designs" / "new-buletin-data-carousel.pdf"
    if extra_design_pdf.exists():
        designs.insert(
            0,
            {
                "title": "New Buletin Data Carousel",
                "file": copy_asset(extra_design_pdf, PUBLIC_ROOT / "designs"),
                "preview": pdf_thumb(extra_design_pdf, PUBLIC_ROOT / "thumbs" / "designs", width=900),
                "size": extra_design_pdf.stat().st_size,
                "pages": pdf_pages(extra_design_pdf),
                "kind": "pdf",
                "summary": "A multi-page data bulletin carousel designed for public education, built to make health information feel clear, visual, and shareable.",
            },
        )

    certificates = []
    for src in sorted((SOURCE_ROOT / "Certification").glob("*")):
        if src.suffix.lower() not in {".pdf", ".jpeg", ".jpg", ".png"}:
            continue
        file_url = copy_asset(src, PUBLIC_ROOT / "certificates")
        if src.suffix.lower() == ".pdf":
            preview = pdf_thumb(src, PUBLIC_ROOT / "thumbs" / "certificates", width=760)
            pages = pdf_pages(src)
        else:
            preview = image_preview(src, PUBLIC_ROOT / "thumbs" / "certificates", width=760)
            pages = 1
        certificates.append(
            {
                "title": clean_title(src),
                "file": file_url,
                "preview": preview,
                "pages": pages,
                "kind": src.suffix.lower().lstrip("."),
            }
        )

    videos = []
    for src in sorted((SOURCE_ROOT / "Video").glob("*.mp4")):
        title = clean_title(src)
        if "edukasi hiperfosfat" in title.lower():
            title = "Edukasi Hiperfosfat"
        elif "hiperfosfat" in title.lower():
            title = "Lyric Video Hiperfosfat"
        external_video_urls = {
            "Edukasi Hiperfosfat": os.environ.get("MARCHO_VIDEO_EDUKASI_URL"),
            "Lyric Video Hiperfosfat": os.environ.get("MARCHO_VIDEO_LYRIC_URL"),
        }
        external_url = external_video_urls.get(title)
        videos.append(
            {
                "title": title,
                "file": external_url or copy_asset(src, PUBLIC_ROOT / "videos"),
                "size": src.stat().st_size,
                "delivery": "github-release" if external_url else "local",
            }
        )

    profile_media = {"portrait": None, "fieldMoments": []}
    portrait_src = EXTRA_ROOT / "profile" / "marcho-formal-portrait.jpg"
    if portrait_src.exists():
        profile_media["portrait"] = {
            "title": "Marcho formal portrait",
            **media_image(portrait_src, PUBLIC_ROOT / "profile", "marcho-formal-portrait", width=960),
        }
    field_sources = [
        ("field-discussion.png", "Leading a focused scientific discussion"),
        ("stage-product-training.png", "Product training in a formal healthcare forum"),
        ("scientific-discussion.png", "Turning evidence into a practical recommendation"),
    ]
    for filename, title in field_sources:
        src = EXTRA_ROOT / "profile" / filename
        if src.exists():
            profile_media["fieldMoments"].append(
                {
                    "title": title,
                    **media_image(src, PUBLIC_ROOT / "profile", slugify(title), width=1100),
                }
            )

    data = {
        "generatedAt": "2026-06-16",
        "sourceRoot": None,
        "concept": concept_url,
        "profile": {
            "name": "Marcho",
            "location": "Jakarta, Indonesia",
            "email": "marchoict@gmail.com",
            "phone": "081311993778",
            "positioning": "Medical Scientific x Product Strategy",
            "headline": "I turn clinical evidence into clear product stories, useful market insight, and healthcare education that people can actually act on.",
            "summary": "I am a medical doctor and Master of Management candidate working at the intersection of Medical Affairs, product training, healthcare content, market intelligence, and AI-assisted workflow speed. My edge is simple: I can read the science, understand the field reality, and shape it into communication that helps teams move with confidence.",
            "currentRole": "Medical Scientific & Product Trainer - PT Novell Pharmaceutical Laboratories",
            "coreCompetencies": [
                "Medical Affairs",
                "Product Training",
                "Scientific Communication",
                "KOL & stakeholder engagement",
                "Scientific deck development",
                "Evidence interpretation",
                "Market & competitor intelligence",
                "Product strategy",
                "Sales enablement",
                "Healthcare content writing",
                "Public education carousel design",
                "AI-assisted research workflow",
            ],
            "skillGroups": [
                {
                    "title": "Clinical & Medical Affairs",
                    "pitch": "I bring physician-level judgment into evidence review, claims, field discussion, and ethical healthcare communication.",
                    "items": [
                        "General consultation & treatment",
                        "Emergency triage",
                        "BLS/ACLS foundation",
                        "Clinical communication",
                        "Evidence interpretation",
                        "Regulatory-compliant product claims",
                        "KOL scientific liaison",
                    ],
                },
                {
                    "title": "Product, Market & Commercial",
                    "pitch": "I can connect the science with business reality, then turn it into field-ready assets for sales, marketing, and medical teams.",
                    "items": [
                        "Product Training",
                        "Product strategy",
                        "GTM asset development",
                        "Sales enablement",
                        "Market & competitor mapping",
                        "Claim and positioning analysis",
                        "Stakeholder engagement",
                    ],
                },
                {
                    "title": "Content, Design & Education",
                    "pitch": "I build the communication layer: decks, articles, carousels, videos, and visuals that make health topics easier to understand.",
                    "items": [
                        "Scientific deck development",
                        "Healthcare article writing",
                        "Public education carousel design",
                        "Poster and bulletin design",
                        "Educational video scripting",
                        "Photoshop, Canva, CapCut",
                        "Photography and visual editing",
                    ],
                },
                {
                    "title": "Data, Digital & AI Workflow",
                    "pitch": "I use digital and AI tools to research faster, organize evidence better, and turn raw information into practical output.",
                    "items": [
                        "Excel intermediate",
                        "Google Workspace",
                        "Notion workflow",
                        "Google Analytics",
                        "Metricool and Business Suite",
                        "ChatGPT, Gemini, Claude",
                        "Perplexity, Elicit, Consensus",
                    ],
                },
                {
                    "title": "Operational & Professional Edge",
                    "pitch": "My clinical background is supported by operational discipline, safety awareness, and the ability to work across functions.",
                    "items": [
                        "HSE / K3 knowledge",
                        "Industrial hygiene awareness",
                        "MCU coordination",
                        "Basic accounting & finance support",
                        "Public speaking",
                        "Teamwork",
                        "PC assembly & troubleshooting",
                    ],
                },
            ],
            "softSkills": [
                "Structured clinical reasoning",
                "Decision-making under pressure",
                "Cross-functional collaboration",
                "Public speaking",
                "Teamwork",
                "Stakeholder communication",
                "Documentation discipline",
                "Learning agility",
                "Ethical communication",
            ],
            "experience": [
                {
                    "role": "Medical Scientific & Product Trainer",
                    "company": "PT Novell Pharmaceutical Laboratories",
                    "period": "May 2024 - Now",
                    "focus": ["KOL engagement", "Scientific narrative", "GTM assets", "Market intelligence", "Regulatory-compliant claims"],
                },
                {
                    "role": "Company Doctor & Administration",
                    "company": "PT Sator Delta Lucktrus",
                    "period": "February 2024 - May 2024",
                    "focus": ["Employee wellness", "MCU coordination", "Industrial hygiene", "Cross-functional administration"],
                },
                {
                    "role": "General Practitioner",
                    "company": "RS Hermina Tangerang",
                    "period": "June 2023 - February 2024",
                    "focus": ["Emergency triage", "BLS/ACLS", "Inpatient rounds", "Continuity of care"],
                },
                {
                    "role": "General Practitioner",
                    "company": "Puskesmas Jatiuwung",
                    "period": "January 2023 - June 2023",
                    "focus": ["Primary care", "Public health programs", "Health promotion", "Minor procedures"],
                },
                {
                    "role": "General Practitioner",
                    "company": "Klinik Berkah Cengkareng",
                    "period": "October 2022 - January 2023",
                    "focus": ["General consultation", "Prescription standards", "Clinical documentation"],
                },
            ],
            "education": [
                "Master of Management, Marketing concentration - in progress",
                "Product Management - Purwadhika Digital Technology School, Oct 2025 - Dec 2025",
                "Faculty of Medicine - Christian Krida Wacana University (UKRIDA), Aug 2015 - Aug 2019",
                "Clinical Clerkship / Co-Ass, Oct 2019 - Apr 2022",
            ],
            "skills": [
                "Medical Affairs",
                "Product Training",
                "Medical & scientific communication",
                "Evidence interpretation",
                "Product strategy",
                "KOL engagement",
                "Stakeholder communication",
                "Market and competitor analysis",
                "GTM and sales enablement assets",
                "Scientific deck development",
                "Healthcare article writing",
                "Public health education design",
                "Digital marketing and analytics",
                "Google Analytics, Metricool, Business Suite",
                "Data productivity with Excel, Notion, Google Workspace",
                "Design and editing with Photoshop, Canva, CapCut",
                "Public speaking and teamwork",
                "HSE / K3 and occupational health awareness",
                "Basic accounting and finance support",
                "PC assembly and troubleshooting",
                "AI productivity power use",
            ],
            "languages": ["Bahasa Indonesia - Native", "English - Working proficiency"],
        },
        "profileMedia": profile_media,
        "cv": cv,
        "projects": projects,
        "slides": slides,
        "articles": articles,
        "designs": designs,
        "certificates": certificates,
        "videos": videos,
        "counts": {
            "projects": len(projects),
            "slides": len(slides),
            "articles": len(articles),
            "designs": len(designs),
            "certificates": len(certificates),
            "videos": len(videos),
        },
    }
    (DATA_DIR / "portfolioData.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(data["counts"], indent=2))


if __name__ == "__main__":
    main()
