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


def deck_case_fields(title: str) -> dict[str, object]:
    key = title.lower()
    common_contribution = (
        "Evidence review, deck structure, scientific narrative, claim framing, training support, "
        "and competitor or positioning insight."
    )
    rules: list[tuple[str, dict[str, object]]] = [
        (
            "tropisetron",
            {
                "therapeuticArea": "Oncology supportive care / antiemetic",
                "objective": "Created to support evidence-based discussion on antiemetic use in oncology supportive care.",
                "medicalValue": "Helps field and medical teams connect mechanism, clinical use case, and practical education points.",
                "featured": True,
            },
        ),
        (
            "ibuprofen",
            {
                "therapeuticArea": "Pediatrics / fever & pain",
                "objective": "Built to clarify pediatric fever and pain management options with responsible safety framing.",
                "medicalValue": "Supports clearer internal training and practical HCP education around antipyretic and analgesic choices.",
                "featured": True,
            },
        ),
        (
            "thalassemia",
            {
                "therapeuticArea": "Pediatrics / hematology",
                "objective": "Designed to communicate adherence challenges and education needs in pediatric thalassemia care.",
                "medicalValue": "Turns a chronic-care topic into patient-aware scientific messaging for healthcare audiences.",
                "featured": False,
            },
        ),
        (
            "lacto",
            {
                "therapeuticArea": "Pediatrics / probiotic / GI",
                "objective": "Created to organize probiotic and gastrointestinal evidence into a training-ready scientific deck.",
                "medicalValue": "Helps connect product education with pediatric GI relevance and responsible evidence interpretation.",
                "featured": False,
            },
        ),
        (
            "udca",
            {
                "therapeuticArea": "Hepatology / fatty liver",
                "objective": "Built to frame UDCA strategies in fatty liver disease through evidence and clinical context.",
                "medicalValue": "Supports structured discussion of hepatology evidence, limitations, and clinical positioning.",
                "featured": True,
            },
        ),
        (
            "l-ornithine",
            {
                "therapeuticArea": "Hepatology / chronic liver disease",
                "objective": "Designed to explain LOLA mechanism and efficacy in chronic liver disease management.",
                "medicalValue": "Translates liver-disease evidence into practical scientific education for internal and HCP-facing use.",
                "featured": True,
            },
        ),
        (
            "nalfurafine",
            {
                "therapeuticArea": "Nephrology / hepatology pruritus",
                "objective": "Created to compare therapeutic options and positioning logic for pruritus-related clinical education.",
                "medicalValue": "Supports balanced competitor mapping and claim framing without overstating comparative value.",
                "featured": True,
            },
        ),
        (
            "somatostatin",
            {
                "therapeuticArea": "GI bleeding / pancreatitis",
                "objective": "Built to connect acute GI bleeding and pancreatitis use cases with mechanism-led scientific education.",
                "medicalValue": "Helps teams explain complex acute-care topics with clearer clinical structure.",
                "featured": False,
            },
        ),
        (
            "pantoprazole",
            {
                "therapeuticArea": "Gastroenterology / cardiovascular comorbidity",
                "objective": "Designed to frame PPI use for audiences considering cardiovascular comorbidity and GI protection.",
                "medicalValue": "Supports nuanced discussion of gastroprotection, risk context, and treatment relevance.",
                "featured": True,
            },
        ),
        (
            "zoledronic",
            {
                "therapeuticArea": "Bone health / oncology supportive care",
                "objective": "Created to organize zoledronic acid evidence for bone health and supportive-care education.",
                "medicalValue": "Helps translate mechanism, indication context, and clinical education into a coherent deck.",
                "featured": False,
            },
        ),
        (
            "sulfasalazine",
            {
                "therapeuticArea": "Gastroenterology / IBD",
                "objective": "Built to revisit sulfasalazine evidence within the era of advanced IBD therapy.",
                "medicalValue": "Supports balanced scientific discussion on established therapy, modern context, and clinical relevance.",
                "featured": True,
            },
        ),
        (
            "nsaid",
            {
                "therapeuticArea": "Gastroenterology / drug safety",
                "objective": "Designed to explain NSAID-induced lower GI injury through a safety-oriented evidence lens.",
                "medicalValue": "Strengthens drug-safety education and practical interpretation of gastrointestinal risk.",
                "featured": True,
            },
        ),
    ]
    for needle, fields in rules:
        if needle in key:
            return {
                "type": "Scientific Deck",
                "outputType": "Scientific deck",
                "contribution": common_contribution,
                **fields,
            }
    return {
        "type": "Scientific Deck",
        "outputType": "Scientific deck",
        "therapeuticArea": "Medical scientific education",
        "objective": "Created to translate medical evidence into a structured scientific education asset.",
        "contribution": common_contribution,
        "medicalValue": "Supports clearer evidence interpretation, training discussion, and compliance-aware communication.",
        "featured": False,
    }


def project_case_fields(title: str) -> dict[str, object]:
    key = title.lower()
    if "dha" in key or "epa" in key:
        area = "Pediatrics / nutrition"
        value = "Shows how clinical nutrition topics can become interactive, parent-friendly education."
    elif "perut" in key or "anak" in key:
        area = "Pediatrics / probiotic / GI"
        value = "Turns gut-health education into a more engaging and practical learning experience."
    else:
        area = "Preventive health / public education"
        value = "Demonstrates interactive education for public-facing health literacy."
    return {
        "type": "Interactive Education",
        "outputType": "Interactive HTML education",
        "therapeuticArea": area,
        "objective": "Built as an interactive education experience with motion, references, and a guided reading flow.",
        "contribution": "Content structure, scientific framing, interaction flow, and web-based education presentation.",
        "medicalValue": value,
        "featured": False,
    }


def article_fields(title: str) -> dict[str, str]:
    key = title.lower()
    topic = "General health education"
    if "fatty liver" in key or "curcuma" in key:
        topic = "Hepatology / fatty liver"
    elif "maag" in key or "ppi" in key:
        topic = "Gastroenterology / acid-related symptoms"
    elif "zinc" in key:
        topic = "Pediatrics / micronutrients"
    elif "kalsium" in key:
        topic = "Pediatrics / bone health"
    elif "gabus" in key:
        topic = "Nutrition / wound recovery"
    elif "delima" in key:
        topic = "Nutrition / antioxidant education"
    return {
        "type": "Article",
        "topic": topic,
        "audience": "Public readers, patients, and caregivers",
        "evidenceStyle": "Review-backed",
    }


def certificate_fields(title: str) -> dict[str, str]:
    key = title.lower()
    if "acls" in key:
        return {"group": "featured", "credentialFocus": "Clinical emergency foundation"}
    if "analitik data" in key or "data" in key:
        return {"group": "featured", "credentialFocus": "Data analytics"}
    if "artificial intelligence" in key:
        return {"group": "featured", "credentialFocus": "AI literacy"}
    if "product management" in key or "purwadhika" in key:
        return {"group": "featured", "credentialFocus": "Product management"}
    if "digital marketing" in key or "e-commerce" in key:
        return {"group": "featured", "credentialFocus": "Digital marketing & e-commerce"}
    return {"group": "additional", "credentialFocus": "Additional professional credential"}


def main() -> None:
    if PUBLIC_ROOT.exists():
        shutil.rmtree(PUBLIC_ROOT)
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    concept_src = APP_ROOT / "docs" / "visual-concept.png"
    concept_url = None
    if concept_src.exists():
        concept_url = copy_asset(concept_src, PUBLIC_ROOT / "system", "visual-concept")

    qr_src = EXTRA_ROOT / "system" / "portfolio-qr.svg"
    qr_url = None
    qr_png_url = None
    if qr_src.exists():
        qr_url = copy_asset(qr_src, PUBLIC_ROOT / "system", "portfolio-qr")
    qr_png_src = EXTRA_ROOT / "system" / "portfolio-qr-cv.png"
    if qr_png_src.exists():
        qr_png_url = copy_asset(qr_png_src, PUBLIC_ROOT / "system", "portfolio-qr-cv")

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
        title = clean_title(src)
        projects.append(
            {
                "title": title,
                "file": copy_asset(src, PUBLIC_ROOT / "projects"),
                "size": src.stat().st_size,
                **project_case_fields(title),
            }
        )

    slides = []
    for src in sorted((SOURCE_ROOT / "Showcase Scientific Slides").glob("*.pdf")):
        title = clean_title(src)
        pages = pdf_pages(src)
        slides.append(
            {
                "title": title,
                "file": copy_asset(src, PUBLIC_ROOT / "slides"),
                "thumb": pdf_thumb(src, PUBLIC_ROOT / "thumbs" / "slides"),
                "pages": pages,
                **deck_case_fields(title),
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
                **article_fields(title),
            }
        )

    designs = []
    extra_design_pdf = EXTRA_ROOT / "designs" / "new-buletin-data-carousel.pdf"
    if extra_design_pdf.exists():
        designs.append(
            {
                "title": "New Buletin Data Carousel",
                "file": copy_asset(extra_design_pdf, PUBLIC_ROOT / "designs"),
                "preview": None,
                "size": extra_design_pdf.stat().st_size,
                "pages": pdf_pages(extra_design_pdf),
                "kind": "pdf",
                "type": "Design",
                "outputType": "Public education carousel",
                "therapeuticArea": "Public health education",
                "audience": "General public",
                "summary": "A four-page data bulletin carousel designed to make health information clear, visual, and easier to understand.",
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
                **certificate_fields(clean_title(src)),
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
                "type": "Video",
                "outputType": "Medical education video",
                "therapeuticArea": "Nephrology / hyperphosphatemia education",
                "audience": "Public education viewers",
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
        "generatedAt": "2026-06-18",
        "sourceRoot": None,
        "concept": concept_url,
        "tracking": {
            "qrUrl": "https://zenwaku.github.io/marcho-portfolio/?utm_source=qr&utm_medium=print&utm_campaign=portfolio_hiring",
            "qrCode": qr_url,
            "qrCodePng": qr_png_url,
            "goatcounterUrl": os.environ.get("VITE_GOATCOUNTER_URL"),
        },
        "careerMetrics": [
            {"value": "100+", "label": "Scientific decks built"},
            {"value": "30+", "label": "Medical communication designs"},
            {"value": "20+", "label": "Evidence-based articles"},
            {"value": "10", "label": "Professional certificates"},
        ],
        "hiringFit": [
            {
                "title": "Medical Scientific / Product Trainer",
                "text": "Evidence review, product training, scientific deck development, objection-handling frameworks, and internal field education.",
            },
            {
                "title": "Medical Affairs Officer / Associate",
                "text": "Medical communication, KOL/HCP engagement support, evidence-based claim review, medical insight synthesis, and compliance-aware scientific materials.",
            },
            {
                "title": "Healthcare Content / Medical Reviewer",
                "text": "Evidence-based articles, public education, medical accuracy review, patient-friendly communication, and citation-backed content.",
            },
            {
                "title": "AI-assisted Medical Workflow Specialist",
                "text": "Literature search workflow, evidence table generation, citation audit, AI output validation, and repeatable research systems.",
            },
        ],
        "medicalAffairsReadiness": [
            {
                "title": "Scientific Exchange Mindset",
                "text": "I prioritize balanced, evidence-based discussion that respects clinical context and compliance boundaries.",
            },
            {
                "title": "Evidence Interpretation",
                "text": "I read clinical literature with attention to study design, claim strength, limitations, and practical relevance.",
            },
            {
                "title": "KOL & HCP Engagement Support",
                "text": "I can help prepare scientific materials, discussion points, and educational support for field medical interactions.",
            },
            {
                "title": "Medical Insight & Competitor Mapping",
                "text": "I synthesize field context, product claims, competitor movement, and therapeutic-area signals into usable insight.",
            },
            {
                "title": "Claim Review & Compliance Awareness",
                "text": "I frame claims carefully, separate evidence from interpretation, and avoid unsupported business-impact language.",
            },
            {
                "title": "Cross-functional Collaboration",
                "text": "I work across medical, product, marketing, sales, and operations while keeping the scientific standard visible.",
            },
            {
                "title": "AI-assisted Evidence Workflow",
                "text": "I use AI to accelerate search and synthesis, then verify citations, clinical logic, and source quality before use.",
            },
        ],
        "profile": {
            "name": "Marcho",
            "location": "Jakarta, Indonesia",
            "email": "marchoict@gmail.com",
            "phone": "081311993778",
            "positioning": "Medical Doctor | Medical Scientific & Product Trainer | Medical Affairs Candidate",
            "headline": "I translate clinical evidence into compliant scientific narratives, HCP education materials, product training, market insight, and AI-assisted evidence workflows for pharma and healthcare teams.",
            "summary": "My edge combines physician-level clinical reasoning, field communication, KOL/HCP engagement support, product training, and modern AI-assisted research productivity while keeping final medical judgment human-led.",
            "heroTitle": "Medical Doctor | Medical Scientific & Product Trainer | Medical Affairs Candidate",
            "heroHeadline": "I translate clinical evidence into compliant scientific narratives, HCP education materials, product training, market insight, and AI-assisted evidence workflows for pharma and healthcare teams.",
            "heroSupport": "My edge combines physician-level clinical reasoning, field communication, KOL/HCP engagement support, product training, and modern AI-assisted research productivity while keeping final medical judgment human-led.",
            "credibilityStrip": [
                "Medical Doctor",
                "Medical Scientific & Product Trainer",
                "12+ Scientific Decks",
                "AI-assisted Evidence Workflow",
                "Jakarta, Indonesia",
            ],
            "currentRole": "Medical Scientific & Product Trainer - PT Novell Pharmaceutical Laboratories",
            "coreCompetencies": [
                "Medical Affairs",
                "Product Training",
                "Scientific Communication",
                "KOL/HCP engagement support",
                "Scientific deck development",
                "Evidence interpretation",
                "Medical insight synthesis",
                "Market & competitor mapping",
                "Claim review & compliance awareness",
                "Field medical education",
                "Evidence-based healthcare communication",
                "Public education carousel design",
                "AI-assisted evidence workflow",
                "Citation audit & source validation",
                "Simple workflow automation",
                "Cross-functional medical support",
            ],
            "aiWorkflow": {
                "eyebrow": "AI-Assisted Evidence Workflow",
                "title": "AI-Assisted Evidence Workflow, Clinically Validated",
                "summary": "I use AI as a productivity layer for medical literature search, evidence synthesis, scientific writing, strategic research, and simple automation. The final thinking stays human-led: I verify sources, compare claims across tools, audit citations, and translate validated evidence into clear, practical, and medically responsible communication.",
                "complianceNote": "AI accelerates the workflow, but medical judgment, source verification, and final claim responsibility remain human-led.",
                "steps": [
                    {
                        "label": "Search & Map",
                        "tools": "Perplexity, Elicit, Consensus, Gemini, Claude, ChatGPT",
                        "text": "Map research questions, guidelines, systematic reviews, RCTs, and competing claims.",
                    },
                    {
                        "label": "Structure & Synthesize",
                        "tools": "ChatGPT, Claude, Codex",
                        "text": "Convert findings into outlines, evidence tables, decks, articles, scripts, and research workflows.",
                    },
                    {
                        "label": "Validate & Audit",
                        "tools": "Clinical judgment, citation checks, source hierarchy",
                        "text": "Check citations, AI output accuracy, source hierarchy, claim strength, clinical logic, and journal quality.",
                    },
                    {
                        "label": "Translate & Execute",
                        "tools": "Decks, articles, HCP education, internal training",
                        "text": "Transform validated evidence into HCP education, internal training, medical content, and strategic insight.",
                    },
                ],
                "tools": ["ChatGPT", "Codex", "Gemini", "Claude Cowork", "Perplexity", "Elicit", "Consensus", "Make"],
            },
            "skillGroups": [
                {
                    "title": "Clinical & Medical Affairs",
                    "pitch": "I bring physician-level judgment into evidence review, claim framing, field discussion, and ethical healthcare communication.",
                    "items": [
                        "General consultation & treatment",
                        "Emergency triage",
                        "BLS/ACLS foundation",
                        "Clinical communication",
                        "Evidence interpretation",
                        "Compliance-aware claim framing",
                        "KOL/HCP engagement support",
                    ],
                },
                {
                    "title": "Product Training & Medical Insight",
                    "pitch": "I connect the science with field reality, then turn it into internal scientific enablement for medical, product, and training teams.",
                    "items": [
                        "Product Training",
                        "Internal scientific enablement",
                        "Field medical education",
                        "Market & competitor mapping",
                        "Claim and positioning analysis",
                        "Stakeholder communication",
                        "Medical insight synthesis",
                    ],
                },
                {
                    "title": "Medical Communication",
                    "pitch": "I build decks, articles, carousels, videos, and visuals that make health topics clearer without losing clinical responsibility.",
                    "items": [
                        "Scientific deck development",
                        "Evidence-based healthcare communication",
                        "Public education carousel design",
                        "Poster and bulletin design",
                        "Educational video scripting",
                        "Photoshop, Canva, CapCut",
                        "Photography and visual editing",
                    ],
                },
                {
                    "title": "Data, Digital & AI Workflow",
                    "pitch": "I use digital and AI tools to research faster, organize evidence better, and build repeatable workflows while keeping human validation in the loop.",
                    "items": [
                        "Excel intermediate",
                        "Google Workspace",
                        "Notion workflow",
                        "Google Analytics",
                        "Metricool and Business Suite",
                        "ChatGPT, Codex, Gemini",
                        "Claude Cowork, Perplexity",
                        "Elicit, Consensus, Make",
                        "AI output verification and citation audit",
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
                    "focus": [
                        "KOL/HCP engagement support",
                        "Compliant scientific narratives",
                        "Internal scientific enablement",
                        "Medical insight",
                        "Compliance-aware claims",
                    ],
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
                    "period": "August 2023 - February 2024",
                    "focus": ["Emergency triage", "BLS/ACLS", "Inpatient rounds", "Continuity of care"],
                },
                {
                    "role": "General Practitioner",
                    "company": "Puskesmas Jatiuwung",
                    "period": "February 2023 - August 2023",
                    "focus": ["Primary care", "Public health programs", "Health promotion", "Minor procedures"],
                },
                {
                    "role": "General Practitioner",
                    "company": "Klinik Berkah Cengkareng",
                    "period": "October 2022 - February 2023",
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
                "KOL/HCP engagement support",
                "Stakeholder communication",
                "Market and competitor analysis",
                "Internal scientific enablement",
                "Field medical education",
                "Scientific deck development",
                "Evidence-based healthcare communication",
                "Public health education design",
                "Digital marketing and analytics",
                "Google Analytics, Metricool, Business Suite",
                "Data productivity with Excel, Notion, Google Workspace",
                "Design and editing with Photoshop, Canva, CapCut",
                "Public speaking and teamwork",
                "HSE / K3 and occupational health awareness",
                "Basic accounting and finance support",
                "PC assembly and troubleshooting",
                "AI-assisted medical literature review",
                "AI output verification and citation audit",
                "Simple automation with Make",
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
