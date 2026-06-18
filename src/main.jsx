import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Award,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  ClipboardCheck,
  FileSearch,
  FileText,
  Filter,
  GalleryHorizontalEnd,
  GraduationCap,
  HeartPulse,
  LineChart,
  Mail,
  MapPin,
  MessageSquareText,
  Microscope,
  Minus,
  PanelsTopLeft,
  PenTool,
  Phone,
  Plus,
  Presentation,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import data from "./data/portfolioData.json";
import "./styles.css";

const protectedMediaProps = {
  "data-protected-media": true,
  draggable: false,
  onContextMenu: (event) => event.preventDefault(),
  onDragStart: (event) => event.preventDefault(),
};

const nav = [
  ["Fit", "fit"],
  ["Readiness", "readiness"],
  ["Education", "case-studies"],
  ["Decks", "decks"],
  ["Articles", "articles"],
  ["Lab", "lab"],
  ["Credentials", "credentials"],
  ["Contact", "contact"],
];

const fallbackHiringFit = [
  {
    title: "Medical Scientific / Product Trainer",
    text: "Evidence review, product training, scientific deck development, objection-handling frameworks, and internal field education.",
  },
  {
    title: "Medical Affairs Officer / Associate",
    text: "Medical communication, KOL/HCP engagement support, evidence-based claim review, medical insight synthesis, and compliance-aware scientific materials.",
  },
  {
    title: "Healthcare Content / Medical Reviewer",
    text: "Evidence-based articles, public education, medical accuracy review, patient-friendly communication, and citation-backed content.",
  },
  {
    title: "AI-assisted Medical Workflow Specialist",
    text: "Literature search workflow, evidence table generation, citation audit, AI output validation, and repeatable research systems.",
  },
];

const readinessIcons = [MessageSquareText, Microscope, UsersRound, LineChart, ShieldCheck, BriefcaseBusiness, BrainCircuit];
const fitIcons = [Presentation, Stethoscope, BookOpenCheck, BrainCircuit];
const aiIcons = [Search, FileText, ShieldCheck, PanelsTopLeft];

function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|mailto:|tel:|blob:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}

function trackingAttrs(name, title = name) {
  return {
    "data-goatcounter-click": name,
    "data-goatcounter-title": title,
    "data-track-click": name,
  };
}

function slugifyLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const COUNTER_NAMESPACE = "marcho-portfolio-zenwaku";
const COUNTER_BASE_URL = "https://api.counterapi.dev/v1";
const TRACKING_SUMMARY = [
  ["portfolio-visit", "Portfolio visits"],
  ["qr-scan", "QR scans"],
  ["click-hero-case-studies", "Hero case studies CTA"],
  ["click-hero-decks", "Hero decks CTA"],
  ["click-hero-contact", "Hero contact CTA"],
  ["click-contact-email", "Email clicks"],
  ["click-contact-whatsapp", "WhatsApp clicks"],
  ...nav.map(([, id]) => [`click-nav-${id}`, `Navigation: ${id}`]),
  ...data.slides.map((item) => [`click-deck-${slugifyLabel(item.title)}`, `Deck: ${item.title}`]),
  ...data.projects.map((item) => [`click-project-${slugifyLabel(item.title)}`, `Project: ${item.title}`]),
  ...data.articles.map((item) => [`click-article-${slugifyLabel(item.title)}`, `Article: ${item.title}`]),
  ...data.videos.map((item) => [`click-video-${slugifyLabel(item.title)}`, `Video: ${item.title}`]),
];

function counterUrl(name, action = "") {
  const safeName = slugifyLabel(name) || "event";
  const suffix = action ? `/${action}` : "";
  return `${COUNTER_BASE_URL}/${COUNTER_NAMESPACE}/${safeName}${suffix}`;
}

function counterValue(payload) {
  return payload?.value ?? payload?.count ?? payload?.data ?? 0;
}

function isLivePortfolioHost() {
  return window.location.hostname === "zenwaku.github.io";
}

function useAnalytics() {
  useEffect(() => {
    const goatcounterUrl = import.meta.env.VITE_GOATCOUNTER_URL || data.tracking?.goatcounterUrl;
    if (!goatcounterUrl || document.querySelector("script[data-goatcounter]")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = goatcounterUrl;
    document.head.appendChild(script);
  }, []);
}

function useCounterTracking() {
  useEffect(() => {
    if (!isLivePortfolioHost()) return undefined;

    const bump = (name) => {
      const queue = (window.__portfolioCounterBeacons ||= []);
      const beacon = new Image();
      const cleanup = () => {
        const index = queue.indexOf(beacon);
        if (index >= 0) queue.splice(index, 1);
      };
      beacon.onload = cleanup;
      beacon.onerror = cleanup;
      queue.push(beacon);
      beacon.src = `${counterUrl(name, "up")}?t=${Date.now()}`;
    };

    const params = new URLSearchParams(window.location.search);
    bump("portfolio-visit");
    if (params.get("utm_source") === "qr") bump("qr-scan");

    const onClick = (event) => {
      const target = event.target.closest("[data-track-click]");
      if (!target) return;
      bump(`click-${target.dataset.trackClick}`);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}

function useTrackingMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get("tracking") === "1" || window.location.hash === "#tracking");
  }, []);

  return enabled;
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(window.innerWidth));
    };

    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return width;
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height <= 0 ? 0 : Math.min(1, window.scrollY / height));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function textBlock(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function prepareProjectSrcDoc(html) {
  const metaTag = '<meta name="referrer" content="no-referrer">';
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${metaTag}`);
  }
  return `<!doctype html><html><head>${metaTag}</head><body>${html}</body></html>`;
}

function App() {
  useAnalytics();
  useCounterTracking();
  useReveal();
  const progress = useScrollProgress();
  const trackingMode = useTrackingMode();
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, []);

  useEffect(() => {
    const protectedSelector = "[data-protected-media]";
    const blockContext = (event) => {
      if (event.target.closest(protectedSelector)) event.preventDefault();
    };
    const blockDrag = (event) => {
      if (event.target.closest(protectedSelector)) event.preventDefault();
    };
    const blockShortcuts = (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["s", "p", "u"].includes(key)) {
        event.preventDefault();
      }
    };
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("dragstart", blockDrag);
    document.addEventListener("keydown", blockShortcuts);
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("dragstart", blockDrag);
      document.removeEventListener("keydown", blockShortcuts);
    };
  }, []);

  const openPdf = (item, collection, index, collectionLabel) => {
    setModal({ type: "pdf", item, collection, index, collectionLabel });
  };
  const openProject = (item) => setModal({ type: "project", item });

  return (
    <>
      <SiteChrome progress={progress} />
      <main>
        <Hero />
        <HiringFitSnapshot />
        <MedicalAffairsReadiness />
        <CaseStudies openProject={openProject} />
        <AIEvidenceWorkflow />
        <ScientificDecks openPdf={openPdf} />
        <ArticlesSection onOpen={(article) => setModal({ type: "article", item: article })} />
        <MedicalCommunicationLab />
        <CredentialsSection onOpen={(cert, index, collection) => setModal({ type: cert.kind === "pdf" ? "pdf" : "image", item: cert, collection, index, collectionLabel: "Certificate" })} />
        <ContactSection />
        {trackingMode ? <TrackingSnapshot /> : null}
      </main>
      <MediaModal modal={modal} onClose={() => setModal(null)} setModal={setModal} />
    </>
  );
}

function SiteChrome({ progress }) {
  return (
    <header className="site-chrome">
      <a className="wordmark" href="#top" aria-label="Back to top">
        <span>M</span>
        <strong>Marcho</strong>
      </a>
      <nav aria-label="Primary navigation">
        {nav.map(([label, id]) => (
          <a key={id} href={`#${id}`} {...trackingAttrs(`nav-${id}`, `Navigation: ${label}`)}>
            {label}
          </a>
        ))}
      </nav>
      <div className="progress-shell" aria-hidden="true">
        <div style={{ width: `${progress * 100}%` }} />
      </div>
    </header>
  );
}

function Hero() {
  const strip = data.profile.credibilityStrip || [
    "Medical Doctor",
    "Medical Scientific & Product Trainer",
    "12+ Scientific Decks",
    "AI-assisted Evidence Workflow",
    "Jakarta, Indonesia",
  ];

  return (
    <section className="hero section-band" id="top" aria-labelledby="hero-title">
      <div className="hero-copy" data-reveal>
        <p className="eyebrow">{data.profile.heroTitle || data.profile.positioning}</p>
        <h1 id="hero-title">Marcho</h1>
        <p className="hero-lead">{data.profile.heroHeadline || data.profile.headline}</p>
        <p className="hero-support">{data.profile.heroSupport || data.profile.summary}</p>
        <div className="hero-actions" aria-label="Primary actions">
          <a className="button primary" href="#case-studies" {...trackingAttrs("hero-case-studies", "Hero: View Public Education Cases")}>
            <FileSearch size={18} />
            View Education Case Studies
          </a>
          <a className="button secondary" href="#decks" {...trackingAttrs("hero-decks", "Hero: View Scientific Decks")}>
            <Presentation size={18} />
            View Scientific Decks
          </a>
          <a className="button ghost" href={`mailto:${data.profile.email}`} {...trackingAttrs("hero-contact", "Hero: Contact Me")}>
            <Mail size={18} />
            Contact Me
          </a>
        </div>
        <div className="credibility-strip" aria-label="Portfolio credibility strip">
          {strip.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <div className="hero-system" data-reveal aria-label="Medical evidence workflow visual">
        <div className="orbit-grid" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="clinical-signal">
          <div className="signal-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="signal-copy">
            <span>Evidence to field readiness</span>
            <strong>Clinical reasoning, scientific narrative, product training, and AI-assisted validation.</strong>
          </div>
        </div>
        <div className="metric-stack">
          {(data.careerMetrics || []).map((metric) => (
            <article key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title, text, icon: Icon }) {
  return (
    <div className="section-header" data-reveal>
      <div className="section-kicker">
        {Icon ? <Icon size={20} /> : null}
        <span>{kicker}</span>
      </div>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function HiringFitSnapshot() {
  const fit = data.hiringFit || fallbackHiringFit;
  const portrait = data.profileMedia?.portrait;

  return (
    <section className="section-band fit-section" id="fit" aria-labelledby="fit-title">
      <SectionHeader
        kicker="Hiring Fit Snapshot"
        icon={Target}
        title="Where I Fit Best"
        text="The portfolio is organized around roles where my clinical background, scientific communication, product training, and AI-assisted workflow can create practical value."
      />
      <div className="fit-layout">
        <div className="fit-grid" data-reveal>
          {fit.map((item, index) => {
            const Icon = fitIcons[index % fitIcons.length];
            return (
              <article className="fit-card" key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
        <aside className="at-glance-card" data-reveal>
          {portrait ? <img src={assetUrl(portrait.preview || portrait.file)} alt="Marcho professional portrait" loading="lazy" {...protectedMediaProps} /> : null}
          <div>
            <span>At a glance</span>
            <h3>{data.profile.currentRole}</h3>
            <p>I bring a physician's clinical lens into evidence interpretation, HCP education support, and practical internal scientific enablement.</p>
          </div>
          <dl>
            <div>
              <dt>Base</dt>
              <dd>Medical Doctor</dd>
            </div>
            <div>
              <dt>Current</dt>
              <dd>Medical Scientific & Product Trainer</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{data.profile.location}</dd>
            </div>
          </dl>
        </aside>
      </div>
      <SkillEvidence />
    </section>
  );
}

function SkillEvidence() {
  const groupIcons = [Stethoscope, Presentation, PenTool, BrainCircuit, UsersRound];
  return (
    <div className="skill-evidence" data-reveal>
      <div>
        <span>Skills From CV</span>
        <h3>Clinical reasoning, communication, digital fluency, and operational discipline.</h3>
      </div>
      <div className="skill-group-grid">
        {(data.profile.skillGroups || []).map((group, index) => {
          const Icon = groupIcons[index % groupIcons.length];
          return (
            <article className="skill-group" key={group.title}>
              <Icon size={22} />
              <h4>{group.title}</h4>
              <p>{group.pitch}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      <div className="soft-skill-row" aria-label="Soft skills">
        {(data.profile.softSkills || []).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

function MedicalAffairsReadiness() {
  const pillars = data.medicalAffairsReadiness || [];
  const fieldMoments = data.profileMedia?.fieldMoments || [];

  return (
    <section className="section-band readiness-section" id="readiness" aria-labelledby="readiness-title">
      <SectionHeader
        kicker="Medical Affairs Readiness"
        icon={ShieldCheck}
        title="A serious, evidence-first working style for medical teams."
        text="I am positioning my work around scientific exchange, evidence interpretation, claim discipline, and cross-functional support rather than broad creative output."
      />
      <div className="readiness-grid" data-reveal>
        {pillars.map((pillar, index) => {
          const Icon = readinessIcons[index % readinessIcons.length];
          return (
            <article className="readiness-card" key={pillar.title}>
              <Icon size={22} />
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          );
        })}
      </div>
      {fieldMoments.length ? (
        <div className="field-proof-grid" data-reveal>
          {fieldMoments.map((moment) => (
            <article className="field-proof" key={moment.title}>
              <img src={assetUrl(moment.preview || moment.file)} alt={moment.title} loading="lazy" {...protectedMediaProps} />
              <span>{moment.title}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CaseStudies({ openProject }) {
  const cases = useMemo(
    () => data.projects.map((item, index) => ({ ...item, caseIndex: index })),
    [],
  );

  return (
    <section className="section-band case-section public-education-section" id="case-studies" aria-labelledby="case-title">
      <SectionHeader
        kicker="Interactive Public Education"
        icon={PanelsTopLeft}
        title="Three interactive education cases for public health literacy."
        text="These web-based education pieces are separated from scientific decks because they are built for general audiences, with motion, references, and a guided visual reading flow."
      />
      <div className="case-grid public-education-grid" data-reveal>
        {cases.map((item) => (
          <article className="case-card public-education-card" key={item.file}>
            <div className="case-media project-case-media">
              <iframe
                src={assetUrl(item.file)}
                title={`${item.title} preview`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                tabIndex="-1"
                aria-hidden="true"
                {...protectedMediaProps}
              />
              <span className="preview-tag">Live preview</span>
            </div>
            <div className="case-body">
              <div className="case-meta">
                <span>{item.type || "Interactive Education"}</span>
                <span>{item.therapeuticArea || "Public education"}</span>
              </div>
              <h3>{item.title}</h3>
              <dl>
                <div>
                  <dt>Objective</dt>
                  <dd>{item.objective || "Built as an interactive education experience for public health literacy."}</dd>
                </div>
                <div>
                  <dt>Audience</dt>
                  <dd>General public, parents, patients, and caregivers.</dd>
                </div>
                <div>
                  <dt>Education value</dt>
                  <dd>{item.medicalValue || "Designed to make health information clearer, visual, and easier to follow."}</dd>
                </div>
              </dl>
              <button
                className="button small"
                onClick={() => openProject(item)}
                {...trackingAttrs(`project-${slugifyLabel(item.title)}`, `Interactive education: ${item.title}`)}
              >
                <PanelsTopLeft size={16} />
                Open Interactive Education
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AIEvidenceWorkflow() {
  const workflow = data.profile.aiWorkflow;
  if (!workflow) return null;

  return (
    <section className="section-band ai-section" id="ai-workflow" aria-labelledby="ai-title">
      <SectionHeader
        kicker={workflow.eyebrow}
        icon={BrainCircuit}
        title={workflow.title}
        text={workflow.summary}
      />
      <div className="ai-workflow-grid" data-reveal>
        {workflow.steps.map((step, index) => {
          const Icon = aiIcons[index % aiIcons.length];
          return (
            <article className="ai-step" key={step.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon size={24} />
              <h3>{step.label}</h3>
              {step.tools ? <p className="tool-line">{step.tools}</p> : null}
              <p>{step.text}</p>
            </article>
          );
        })}
      </div>
      <div className="compliance-note" data-reveal>
        <ShieldCheck size={24} />
        <p>{workflow.complianceNote}</p>
      </div>
    </section>
  );
}

function ScientificDecks({ openPdf }) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const areas = useMemo(() => ["All", ...Array.from(new Set(data.slides.map((slide) => slide.therapeuticArea || "Medical education")))], []);
  const filteredSlides = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.slides.filter((slide) => {
      const matchesArea = area === "All" || slide.therapeuticArea === area;
      const haystack = `${slide.title} ${slide.therapeuticArea} ${slide.outputType}`.toLowerCase();
      return matchesArea && (!needle || haystack.includes(needle));
    });
  }, [area, query]);

  return (
    <section className="section-band decks-section" id="decks" aria-labelledby="decks-title">
      <SectionHeader
        kicker="Scientific Decks"
        icon={Presentation}
        title="Twelve featured decks from a 100+ scientific-deck working library."
        text="Use search or therapeutic-area filters, then open each PDF directly in the browser with page navigation and zoom. Descriptions are intentionally concise so the work speaks through the deck itself."
      />
      <div className="deck-tools" data-reveal>
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">Search scientific decks</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deck title or area" />
        </label>
        <div className="filter-pills" aria-label="Filter by therapeutic area">
          <Filter size={18} />
          {areas.map((item) => (
            <button key={item} className={item === area ? "is-active" : ""} onClick={() => setArea(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="deck-grid" data-reveal>
        {filteredSlides.map((slide) => {
          const index = data.slides.findIndex((item) => item.file === slide.file);
          return (
            <button
              className={`deck-card ${slide.featured ? "is-featured" : ""}`}
              key={slide.file}
              onClick={() => openPdf(slide, data.slides, index, "Scientific Deck")}
              {...trackingAttrs(`deck-${slugifyLabel(slide.title)}`, `Scientific deck: ${slide.title}`)}
            >
              <img src={assetUrl(slide.thumb)} alt={`${slide.title} deck preview`} loading="lazy" {...protectedMediaProps} />
              <div>
                <span>{slide.outputType || "Scientific deck"}</span>
                {slide.featured ? <em>Featured</em> : null}
              </div>
              <h3>{slide.title}</h3>
              <p>{slide.therapeuticArea}</p>
              <small>{slide.pages} pages</small>
            </button>
          );
        })}
      </div>
      {!filteredSlides.length ? <p className="empty-state">No deck matches that filter yet.</p> : null}
    </section>
  );
}

function ArticlesSection({ onOpen }) {
  return (
    <section className="section-band articles-section" id="articles" aria-labelledby="articles-title">
      <SectionHeader
        kicker="Evidence-Based Healthcare Articles"
        icon={FileText}
        title="Public education writing with medical accuracy and readable language."
        text="Public-facing medical articles written to translate scientific evidence into practical, safe, and understandable health education."
      />
      <div className="article-grid" data-reveal>
        {data.articles.map((article) => (
          <button
            className="article-card"
            key={article.title}
            onClick={() => onOpen(article)}
            {...trackingAttrs(`article-${slugifyLabel(article.title)}`, `Article: ${article.title}`)}
          >
            <img src={assetUrl(article.posterPreview || article.poster)} alt={`${article.title} poster`} loading="lazy" {...protectedMediaProps} />
            <div>
              <span>{article.topic || "Health education"}</span>
              <h3>{article.title}</h3>
              <p>{article.audience}</p>
              <small>{article.evidenceStyle || "Review-backed"}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MedicalCommunicationLab() {
  const design = data.designs.find((item) => item.kind === "pdf") || data.designs[0];
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(design?.pages || 1);
  const [zoom, setZoom] = useState(1);
  const [activeVideo, setActiveVideo] = useState(0);
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const video = data.videos[activeVideo];

  useEffect(() => {
    setPage(1);
    setZoom(1);
    setPageCount(design?.pages || 1);
  }, [design?.file, design?.pages]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (!design && !video) return null;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="section-band lab-section" id="lab" aria-labelledby="lab-title">
      <SectionHeader
        kicker="Medical Communication Lab"
        icon={GalleryHorizontalEnd}
        title="Secondary communication experiments for public education."
        text="This section keeps design and video visible, but positions them as supporting medical communication experiments rather than the main hiring narrative."
      />
      <div className="lab-grid">
        {design ? (
          <article className="design-lab" data-reveal>
            <div className="lab-panel-heading">
              <div>
                <span>{design.outputType || "Public education carousel"}</span>
                <h3>{design.title}</h3>
              </div>
              <BadgeCheck size={22} />
            </div>
            <div className="pdf-controls compact">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} {...trackingAttrs("design-pdf-prev-page", "Design PDF: previous page")}>
                <ChevronLeft size={18} />
                Page
              </button>
              <span>{page} / {pageCount}</span>
              <button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount} {...trackingAttrs("design-pdf-next-page", "Design PDF: next page")}>
                Page
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))} disabled={zoom <= 0.75} aria-label="Zoom out" {...trackingAttrs("design-pdf-zoom-out", "Design PDF: zoom out")}>
                <Minus size={18} />
              </button>
              <span>{zoomPercent}%</span>
              <button onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))} disabled={zoom >= 2.5} aria-label="Zoom in" {...trackingAttrs("design-pdf-zoom-in", "Design PDF: zoom in")}>
                <Plus size={18} />
              </button>
            </div>
            <PdfCanvas file={design.file} page={page} zoom={zoom} maxWidth={980} minHeight={320} lazy onPageCount={setPageCount} />
            <div className="pdf-page-strip" aria-label="Carousel pages">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button key={pageNumber} className={pageNumber === page ? "is-active" : ""} onClick={() => setPage(pageNumber)} {...trackingAttrs(`design-pdf-page-${pageNumber}`, `Design PDF: page ${pageNumber}`)}>
                  {pageNumber}
                </button>
              ))}
            </div>
          </article>
        ) : null}
        {video ? (
          <article className="video-lab" data-reveal>
            <div className="lab-panel-heading">
              <div>
                <span>Medical education video</span>
                <h3>{video.title}</h3>
              </div>
              <Video size={22} />
            </div>
            <div className="video-list" aria-label="Select video">
              {data.videos.map((item, index) => (
                <button
                  key={item.file}
                  className={index === activeVideo ? "is-active" : ""}
                  onClick={() => {
                    setActiveVideo(index);
                    setVideoUnlocked(false);
                  }}
                  {...trackingAttrs(`video-${slugifyLabel(item.title)}`, `Video: ${item.title}`)}
                >
                  <CirclePlay size={20} />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
            <div className="video-frame">
              {videoUnlocked ? (
                <video
                  key={video.file}
                  src={assetUrl(video.file)}
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  preload="none"
                  playsInline
                  {...protectedMediaProps}
                />
              ) : (
                <button className="video-placeholder" onClick={() => setVideoUnlocked(true)} {...trackingAttrs(`video-play-${slugifyLabel(video.title)}`, `Video play: ${video.title}`)}>
                  <CirclePlay size={46} />
                  <span>Load and play</span>
                  <strong>{video.title}</strong>
                </button>
              )}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function CredentialsSection({ onOpen }) {
  const featured = data.certificates.filter((cert) => cert.group === "featured");
  const additional = data.certificates.filter((cert) => cert.group !== "featured");
  const all = data.certificates;

  return (
    <section className="section-band credentials-section" id="credentials" aria-labelledby="credentials-title">
      <SectionHeader
        kicker="Credentials"
        icon={Award}
        title="Credentials that support clinical, data, AI, product, and communication work."
        text="The most relevant certificates are prioritized first, while every certificate remains accessible in a carousel/modal viewer."
      />
      <div className="featured-credentials" data-reveal>
        <article className="credential-card education-card">
          <GraduationCap size={28} />
          <span>Featured Credential</span>
          <h3>Medical Doctor / Medical Education</h3>
          <p>Faculty of Medicine, clinical clerkship, and GP experience form the clinical base behind the portfolio.</p>
        </article>
        {featured.map((cert) => {
          const index = all.findIndex((item) => item.file === cert.file);
          return (
            <button className="credential-card" key={cert.file} onClick={() => onOpen(cert, index, all)} {...trackingAttrs(`certificate-${slugifyLabel(cert.title)}`, `Certificate: ${cert.title}`)}>
              <img src={assetUrl(cert.preview)} alt={`${cert.title} certificate preview`} loading="lazy" {...protectedMediaProps} />
              <span>{cert.credentialFocus}</span>
              <h3>{cert.title}</h3>
            </button>
          );
        })}
      </div>
      {additional.length ? (
        <div className="additional-credentials" data-reveal>
          <div>
            <span>Additional Certifications</span>
            <p>Occupational safety, business, accounting, and other supporting credentials.</p>
          </div>
          <div className="credential-rail">
            {additional.map((cert) => {
              const index = all.findIndex((item) => item.file === cert.file);
              return (
                <button className="mini-cert-card" key={cert.file} onClick={() => onOpen(cert, index, all)} {...trackingAttrs(`certificate-${slugifyLabel(cert.title)}`, `Certificate: ${cert.title}`)}>
                  <img src={assetUrl(cert.preview)} alt={`${cert.title} certificate preview`} loading="lazy" {...protectedMediaProps} />
                  <span>{cert.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ContactSection() {
  const whatsapp = data.profile.phone?.replace(/^0/, "62") || "";

  return (
    <footer className="section-band contact-section" id="contact">
      <div data-reveal>
        <p className="eyebrow">Contact</p>
        <h2>Open to Medical Scientific, Medical Affairs, Healthcare Content, and AI Medical Workflow roles.</h2>
        <p>
          I am ready to contribute to pharma and healthcare teams that need clinical reasoning, evidence-based communication, product training, KOL/HCP engagement support, and faster AI-assisted research workflows.
        </p>
      </div>
      <div className="contact-side" data-reveal>
        <div className="contact-actions">
          <a className="button primary" href={`mailto:${data.profile.email}`} {...trackingAttrs("contact-email", "Contact: email")}>
            <Mail size={18} />
            Email Me
          </a>
          <a className="button secondary" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" {...trackingAttrs("contact-whatsapp", "Contact: WhatsApp")}>
            <Phone size={18} />
            WhatsApp Me
          </a>
          <button className="button ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} {...trackingAttrs("contact-back-to-top", "Contact: back to top")}>
            <Sparkles size={18} />
            Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
}

function TrackingSnapshot() {
  const [stats, setStats] = useState([]);
  const [status, setStatus] = useState("Loading tracking snapshot...");

  useEffect(() => {
    let cancelled = false;
    const fallbackRows = TRACKING_SUMMARY.map(([key, label]) => ({
      key,
      label,
      value: null,
      url: counterUrl(key),
    }));

    async function loadStats() {
      setStatus("Loading tracking snapshot...");
      try {
        const rows = await Promise.all(
          TRACKING_SUMMARY.map(async ([key, label]) => {
            const response = await fetch(counterUrl(key), { cache: "no-store" });
            if (!response.ok) return { key, label, value: 0, url: counterUrl(key) };
            const payload = await response.json();
            return { key, label, value: counterValue(payload), url: counterUrl(key) };
          }),
        );
        if (!cancelled) {
          setStats(rows);
          setStatus("");
        }
      } catch {
        if (!cancelled) {
          setStats(fallbackRows);
          setStatus("Tracking is wired. If this browser cannot read the public API directly, open the raw counter links below.");
        }
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const topClicks = stats
    .filter((item) => item.key.startsWith("click-"))
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 8);

  return (
    <section className="section-band tracking-section" id="tracking">
      <SectionHeader
        kicker="QR Tracking"
        icon={QrCode}
        title="Tracking snapshot for the portfolio QR and key clicks."
        text="This lightweight view reads public counters for the GitHub Pages portfolio, including visits from the QR campaign URL and the highest-signal click areas."
      />
      <div className="tracking-panel" data-reveal>
        {status ? <p className="viewer-status">{status}</p> : null}
        <div className="tracking-cards">
          {stats.slice(0, 8).map((item) => (
            <article key={item.key}>
              <span>{item.label}</span>
              {item.value === null ? (
                <a href={item.url} target="_blank" rel="noreferrer">Open</a>
              ) : (
                <strong>{item.value}</strong>
              )}
            </article>
          ))}
        </div>
        <div className="tracking-list">
          <h3>Top click areas</h3>
          {topClicks.length ? (
            topClicks.map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                {item.value === null ? (
                  <a href={item.url} target="_blank" rel="noreferrer">Open</a>
                ) : (
                  <strong>{item.value}</strong>
                )}
              </div>
            ))
          ) : (
            <p>No click counters yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function MediaModal({ modal, onClose, setModal }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.toggle("modal-open", Boolean(modal));
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [modal, onClose]);

  if (!modal) return null;

  const label = modal.type === "pdf" ? "PDF Viewer" : modal.type === "article" ? "Article Reader" : modal.type === "project" ? "Interactive Case" : "Media Viewer";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={label}>
      <button className="modal-scrim" onClick={onClose} aria-label="Close modal" />
      <div className={`modal-panel ${modal.type}`}>
        <div className="modal-topbar">
          <div>
            <span>{label}</span>
            <h2>{modal.item.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        {modal.type === "pdf" ? (
          <PdfViewer modal={modal} setModal={setModal} />
        ) : modal.type === "article" ? (
          <ArticleReader article={modal.item} />
        ) : modal.type === "project" ? (
          <ProjectViewer project={modal.item} />
        ) : (
          <ImageViewer item={modal.item} />
        )}
      </div>
    </div>
  );
}

function ProjectViewer({ project }) {
  const [projectHtml, setProjectHtml] = useState("");
  const [status, setStatus] = useState("Loading interactive case...");

  useEffect(() => {
    let cancelled = false;
    setProjectHtml("");
    setStatus("Loading interactive case...");

    fetch(assetUrl(project.file), { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Project failed to load (${response.status})`);
        return response.text();
      })
      .then((html) => {
        if (cancelled) return;
        setProjectHtml(prepareProjectSrcDoc(html));
        setStatus("");
      })
      .catch((error) => {
        if (!cancelled) {
          setProjectHtml("<!doctype html><html><body></body></html>");
          setStatus(`Interactive project could not be loaded. ${error.message}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project.file]);

  return (
    <div className="project-viewer">
      {status ? <p className="viewer-status">{status}</p> : null}
      <iframe
        key={project.file}
        title={project.title}
        srcDoc={projectHtml}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        {...protectedMediaProps}
      />
    </div>
  );
}

function PdfCanvas({ file, page, zoom = 1, maxWidth = 1040, minHeight = 0, lazy = false, onPageCount }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportWidth = useViewportWidth();
  const [isReady, setIsReady] = useState(!lazy);
  const [status, setStatus] = useState(lazy ? "PDF preview will load here." : "Loading PDF...");

  useEffect(() => {
    if (!lazy) {
      setIsReady(true);
      return undefined;
    }

    const node = wrapRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "640px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!isReady) return undefined;

    let cancelled = false;
    let renderTask = null;

    async function renderPdf() {
      setStatus("Loading PDF...");
      try {
        const [pdfjsLib, workerModule] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.mjs?url"),
        ]);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
        const loadingTask = pdfjsLib.getDocument(assetUrl(file));
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        onPageCount?.(pdf.numPages);
        const currentPage = Math.min(page, pdf.numPages);
        const pdfPage = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        const parentWidth = Math.min(canvas.parentElement?.clientWidth || maxWidth, maxWidth);
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const fitScale = parentWidth / baseViewport.width;
        const readableMinHeight = viewportWidth < 520 && minHeight ? Math.min(minHeight, 220) : minHeight;
        const heightScale = readableMinHeight ? readableMinHeight / baseViewport.height : 0;
        const scale = Math.max(0.55, Math.min(3.4, Math.max(fitScale, heightScale) * zoom));
        const viewport = pdfPage.getViewport({ scale });

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        context.clearRect(0, 0, canvas.width, canvas.height);
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setStatus("");
      } catch (error) {
        if (!cancelled) setStatus(`This PDF preview could not be rendered in the browser. ${error.message}`);
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [file, page, zoom, maxWidth, minHeight, onPageCount, viewportWidth, isReady]);

  return (
    <div className="pdf-canvas-wrap" ref={wrapRef}>
      {status ? <p className="viewer-status">{status}</p> : null}
      <canvas ref={canvasRef} {...protectedMediaProps} />
    </div>
  );
}

function PdfViewer({ modal, setModal }) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(modal.item.pages || 1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPage(1);
    setZoom(1);
    setPageCount(modal.item.pages || 1);
  }, [modal.item.file, modal.item.pages]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const canGoPrevItem = modal.collection && modal.index > 0;
  const canGoNextItem = modal.collection && modal.index < modal.collection.length - 1;
  const collectionLabel = modal.collectionLabel || "Item";
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} {...trackingAttrs("pdf-prev-page", "PDF viewer: previous page")}>
          <ChevronLeft size={18} />
          Page
        </button>
        <span>{page} / {pageCount}</span>
        <button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount} {...trackingAttrs("pdf-next-page", "PDF viewer: next page")}>
          Page
          <ChevronRight size={18} />
        </button>
        <button onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))} disabled={zoom <= 0.75} aria-label="Zoom out" {...trackingAttrs("pdf-zoom-out", "PDF viewer: zoom out")}>
          <Minus size={18} />
        </button>
        <span>{zoomPercent}%</span>
        <button onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))} disabled={zoom >= 2.5} aria-label="Zoom in" {...trackingAttrs("pdf-zoom-in", "PDF viewer: zoom in")}>
          <Plus size={18} />
        </button>
        {modal.collection ? (
          <>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index - 1], collection: modal.collection, index: modal.index - 1, collectionLabel })}
              disabled={!canGoPrevItem}
              {...trackingAttrs(`pdf-prev-${slugifyLabel(collectionLabel)}`, `PDF viewer: previous ${collectionLabel}`)}
            >
              <ChevronLeft size={18} />
              {collectionLabel}
            </button>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index + 1], collection: modal.collection, index: modal.index + 1, collectionLabel })}
              disabled={!canGoNextItem}
              {...trackingAttrs(`pdf-next-${slugifyLabel(collectionLabel)}`, `PDF viewer: next ${collectionLabel}`)}
            >
              {collectionLabel}
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>
      <PdfCanvas file={modal.item.file} page={page} zoom={zoom} maxWidth={1040} onPageCount={setPageCount} />
    </div>
  );
}

function ArticleReader({ article }) {
  const paragraphs = textBlock(article.body);
  return (
    <div className="article-reader">
      {article.poster ? <img src={assetUrl(article.poster)} alt={`${article.title} poster`} {...protectedMediaProps} /> : null}
      <article>
        <p className="reader-meta">{article.topic} | {article.evidenceStyle}</p>
        <h3>{article.title}</h3>
        {paragraphs.map((paragraph, index) => (
          <p key={`${paragraph}-${index}`}>{paragraph}</p>
        ))}
      </article>
    </div>
  );
}

function ImageViewer({ item }) {
  return (
    <div className="image-viewer">
      <img src={assetUrl(item.file)} alt={item.title} {...protectedMediaProps} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
