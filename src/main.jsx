import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Award,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  ClipboardList,
  FileText,
  GalleryHorizontalEnd,
  GraduationCap,
  HeartPulse,
  LineChart,
  Mail,
  MessageSquareText,
  Microscope,
  Minus,
  PanelsTopLeft,
  PenTool,
  Phone,
  Presentation,
  Plus,
  QrCode,
  Rocket,
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
  ["About", "about"],
  ["Slides", "slides"],
  ["Projects", "projects"],
  ["Articles", "articles"],
  ["Design", "design"],
  ["Videos", "videos"],
  ["Certificates", "certificates"],
  ["Contact", "contact"],
];

const competencyIcons = [
  Stethoscope,
  GraduationCap,
  Presentation,
  UsersRound,
  ClipboardList,
  Microscope,
  LineChart,
  Target,
  BriefcaseBusiness,
  MessageSquareText,
  PenTool,
  BrainCircuit,
];

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
  return value
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
  ["click-hero-view-work", "Hero work CTA"],
  ["click-hero-contact", "Hero contact CTA"],
  ["click-contact-email", "Email clicks"],
  ["click-contact-phone", "Phone clicks"],
  ["click-contact-qr-card", "QR card clicks"],
  ["click-nav-slides", "Slides nav"],
  ["click-nav-projects", "Projects nav"],
  ["click-nav-articles", "Articles nav"],
  ["click-nav-design", "Design nav"],
  ["click-nav-videos", "Videos nav"],
  ["click-nav-certificates", "Certificates nav"],
  ["click-design-pdf-next-page", "Design next page"],
  ["click-design-pdf-zoom-in", "Design zoom in"],
  ...data.projects.map((item) => [`click-project-tab-${slugifyLabel(item.title)}`, `Project: ${item.title}`]),
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
  return text
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
  const [projectIndex, setProjectIndex] = useState(0);

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

  const featured = data.projects[projectIndex];

  return (
    <>
      <SiteChrome progress={progress} />
      <main>
        <Hero />
        <About />
        <SlideShowcase onOpen={(slide, index) => setModal({ type: "pdf", item: slide, collection: data.slides, index, collectionLabel: "Scientific Deck" })} />
        <ProjectLab
          project={featured}
          projectIndex={projectIndex}
          setProjectIndex={setProjectIndex}
        />
        <ArticleStudio onOpen={(article) => setModal({ type: "article", item: article })} />
        <DesignGallery />
        <VideoRoom />
        <CertificateMarquee onOpen={(cert, index) => setModal({ type: cert.kind === "pdf" ? "pdf" : "image", item: cert, collection: data.certificates, index, collectionLabel: "Certificate" })} />
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
        Marcho
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
  const roles = ["Medical Scientific", "Product Trainer", "Medical Affairs", "Healthcare Content", "Market Insight"];
  const kineticWords = ["Evidence", "Training", "Strategy", "Medical Affairs", "Articles", "Design", "Video", "AI Workflow"];
  return (
    <section className="hero section-band" id="top">
      <div className="hero-copy" data-reveal>
        <h1>Marcho</h1>
        <p className="hero-lead">{data.profile.headline}</p>
        <div className="kinetic-line" aria-hidden="true">
          <div>
            {[...kineticWords, ...kineticWords].map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </div>
        </div>
        <div className="hero-actions">
          <a className="button primary" href="#projects" {...trackingAttrs("hero-view-work", "Hero: View Work")}>
            <PanelsTopLeft size={18} />
            View Work
          </a>
          <a className="button secondary" href={`mailto:${data.profile.email}`} {...trackingAttrs("hero-contact", "Hero: Contact")}>
            <Mail size={18} />
            Contact
          </a>
        </div>
      </div>
      <div className="signal-panel" data-reveal>
        <div className="signal-top">
          <div className="signal-line">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="role-stack">
          {roles.map((role) => (
            <span key={role}>{role}</span>
          ))}
        </div>
        <div className="proof-row">
          <Proof icon={Presentation} value="100+" label="Scientific decks" />
          <Proof icon={GalleryHorizontalEnd} value="30+" label="Designs" />
          <Proof icon={FileText} value="20+" label="Articles" />
          <Proof icon={Award} value="10" label="Certificates" />
        </div>
      </div>
    </section>
  );
}

function Proof({ icon: Icon, value, label }) {
  return (
    <div className="proof">
      <Icon size={18} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SectionHeader({ number, title, text, icon: Icon }) {
  return (
    <div className="section-header" data-reveal>
      <div className="section-index">
        <span>{number}</span>
        {Icon ? <Icon size={22} /> : null}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function About() {
  const competencies = data.profile.coreCompetencies.map((skill, index) => ({
    skill,
    Icon: competencyIcons[index % competencyIcons.length],
  }));
  return (
    <section className="section-band about" id="about">
      <SectionHeader
        number="01"
        icon={Stethoscope}
        title="I turn clinical depth into business-ready clarity."
        text={data.profile.summary}
      />
      <div className="about-grid">
        <ProfileSnapshot />
        <div className="competency-panel" data-reveal>
          <div className="panel-title">
            <span>Core Competencies</span>
            <h3>What I bring into medical, product, and commercial teams.</h3>
          </div>
          <div className="competency-grid">
            {competencies.map(({ skill, Icon }) => (
              <article className="competency" key={skill}>
                <Icon size={22} />
                <span>{skill}</span>
              </article>
            ))}
          </div>
          <div className="expertise-note">
            <HeartPulse size={22} />
            <p>The through-line is simple: clinical reasoning, product clarity, and communication that helps field teams move with confidence.</p>
          </div>
        </div>
        <SkillMatrix />
        <div className="expertise-rail" data-reveal>
          {[
            ["Evidence", "I turn journals, disease burden, and clinical nuance into messages teams can use in the field.", BrainCircuit],
            ["Market", "I connect product claims, competitor movement, and customer reality into practical positioning.", Target],
            ["Enablement", "I build decks, objection handling, and evidence summaries that make execution easier.", BriefcaseBusiness],
            ["Healthcare", "I keep the message grounded in clinical judgment, ethics, and patient relevance.", HeartPulse],
          ].map(([title, body, Icon]) => (
            <article className="expertise" key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="timeline" data-reveal>
          {data.profile.experience.map((item) => (
            <article key={`${item.role}-${item.company}`} className="timeline-item">
              <div>
                <span>{item.period}</span>
                <h3>{item.role}</h3>
                <p>{item.company}</p>
              </div>
              <ul>
                {item.focus.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
      {data.profileMedia?.fieldMoments?.length ? (
        <div className="moments-grid" data-reveal>
          {data.profileMedia.fieldMoments.map((moment) => (
            <article className="moment-card" key={moment.title}>
              <img src={assetUrl(moment.preview || moment.file)} alt={moment.title} loading="lazy" {...protectedMediaProps} />
              <span>{moment.title}</span>
            </article>
          ))}
        </div>
      ) : null}
      <div className="skills-strip" data-reveal>
        {data.profile.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </section>
  );
}

function ProfileSnapshot() {
  const portrait = data.profileMedia?.portrait;
  return (
    <aside className="profile-snapshot" data-reveal>
      {portrait ? <img src={assetUrl(portrait.preview || portrait.file)} alt="Marcho formal portrait" loading="lazy" {...protectedMediaProps} /> : null}
      <div>
        <span>At a Glance</span>
        <h3>{data.profile.currentRole}</h3>
        <p>I bring clinical credibility, field communication, and product thinking into one practical working style.</p>
      </div>
      <dl>
        <div>
          <dt>Base</dt>
          <dd>Medical Doctor</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>Medical Affairs, Product Training, Healthcare Content</dd>
        </div>
        <div>
          <dt>Languages</dt>
          <dd>Bahasa Indonesia, English</dd>
        </div>
      </dl>
    </aside>
  );
}

function SkillMatrix() {
  const groupIcons = [Stethoscope, Rocket, PenTool, LineChart, UsersRound];
  return (
    <div className="skill-matrix" data-reveal>
      <div className="matrix-title">
        <span>Skills From My CV</span>
        <h3>Hard skills, soft skills, and tools I can bring into the job from day one.</h3>
      </div>
      <div className="skill-group-grid">
        {data.profile.skillGroups.map((group, index) => {
          const Icon = groupIcons[index % groupIcons.length];
          return (
            <article className="skill-group" key={group.title}>
              <Icon size={24} />
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
      <div className="soft-skill-row">
        {data.profile.softSkills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>
  );
}

function SlideShowcase({ onOpen }) {
  return (
    <section className="section-band slides-section" id="slides">
      <SectionHeader
        number="02"
        icon={Presentation}
        title="I build scientific decks that make evidence easier to act on."
        text="These 12 selected decks represent a wider library of more than 100 scientific decks I have built across gastroenterology, renal care, pediatrics, liver disease, pain management, and therapeutic strategy."
      />
      <div className="deck-grid" data-reveal>
        {data.slides.map((slide, index) => (
          <button
            className="deck-card"
            key={slide.file}
            onClick={() => onOpen(slide, index)}
            {...trackingAttrs(`deck-${slugifyLabel(slide.title)}`, `Scientific deck: ${slide.title}`)}
          >
            <img src={assetUrl(slide.thumb)} alt="" loading="lazy" {...protectedMediaProps} />
            <h3>{slide.title}</h3>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProjectLab({ project, projectIndex, setProjectIndex }) {
  const [projectHtml, setProjectHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    const projectUrl = assetUrl(project.file);
    setProjectHtml("");

    fetch(projectUrl, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Project failed to load (${response.status})`);
        return response.text();
      })
      .then((html) => {
        if (cancelled) return;
        setProjectHtml(prepareProjectSrcDoc(html));
      })
      .catch(() => {
        if (!cancelled) {
          setProjectHtml("<!doctype html><html><body></body></html>");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project.file]);

  return (
    <section className="section-band project-section" id="projects">
      <SectionHeader
        number="03"
        icon={PanelsTopLeft}
        title="I make health explainers people can experience, not just read."
        text="These interactive HTML projects are embedded with their original animation, motion, references, and presentation rhythm intact."
      />
      <div className="project-tabs" data-reveal>
        {data.projects.map((item, index) => (
          <button
            key={item.file}
            className={index === projectIndex ? "is-active" : ""}
            onClick={() => setProjectIndex(index)}
            {...trackingAttrs(`project-tab-${slugifyLabel(item.title)}`, `Project tab: ${item.title}`)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="iframe-shell" data-reveal>
        <div className="iframe-toolbar">
          <span>{project.title}</span>
          <span className="iframe-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
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
    </section>
  );
}

function ArticleStudio({ onOpen }) {
  return (
    <section className="section-band articles-section" id="articles">
      <SectionHeader
        number="04"
        icon={FileText}
        title="I write health articles that make complex topics feel human."
        text="The selected articles combine clinical accuracy, public-friendly language, and poster-led storytelling. They represent a broader collection of more than 20 articles."
      />
      <div className="article-grid" data-reveal>
        {data.articles.map((article) => (
          <button
            className="article-card"
            key={article.title}
            onClick={() => onOpen(article)}
            {...trackingAttrs(`article-${slugifyLabel(article.title)}`, `Article: ${article.title}`)}
          >
            <img src={assetUrl(article.posterPreview)} alt="" loading="lazy" {...protectedMediaProps} />
            <div>
              <span>{article.pages} pages</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function DesignGallery() {
  const design = data.designs.find((item) => item.kind === "pdf") || data.designs[0];
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(design?.pages || 1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPage(1);
    setZoom(1);
    setPageCount(design?.pages || 1);
  }, [design?.file, design?.pages]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (!design) return null;

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="section-band design-section" id="design">
      <SectionHeader
        number="05"
        icon={GalleryHorizontalEnd}
        title="I design data carousels that make public health easier to scan."
        text="This four-page bulletin carousel is shown directly as a high-resolution PDF canvas, with page-by-page navigation and zoom for sharper reading."
      />
      <div className="design-pdf-stage" data-reveal>
        <div className="design-pdf-toolbar">
          <div>
            <span>Data Bulletin Carousel</span>
            <h3>{design.title}</h3>
          </div>
          <div className="pdf-controls compact">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              {...trackingAttrs("design-pdf-prev-page", "Design PDF: previous page")}
            >
              <ChevronLeft size={18} />
              Page
            </button>
            <span>
              {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={page >= pageCount}
              {...trackingAttrs("design-pdf-next-page", "Design PDF: next page")}
            >
              Page
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
              disabled={zoom <= 0.75}
              aria-label="Zoom out"
              {...trackingAttrs("design-pdf-zoom-out", "Design PDF: zoom out")}
            >
              <Minus size={18} />
            </button>
            <span>{zoomPercent}%</span>
            <button
              onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
              disabled={zoom >= 2.5}
              aria-label="Zoom in"
              {...trackingAttrs("design-pdf-zoom-in", "Design PDF: zoom in")}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <PdfCanvas file={design.file} page={page} zoom={zoom} maxWidth={980} minHeight={320} lazy onPageCount={setPageCount} />
        <div className="pdf-page-strip" aria-label="Carousel pages">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={pageNumber === page ? "is-active" : ""}
              onClick={() => setPage(pageNumber)}
              {...trackingAttrs(`design-pdf-page-${pageNumber}`, `Design PDF: page ${pageNumber}`)}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CertificateMarquee({ onOpen }) {
  const loop = [...data.certificates, ...data.certificates];
  return (
    <section className="section-band certificate-section" id="certificates">
      <SectionHeader
        number="07"
        icon={Award}
        title="I keep stacking credentials around the work I want to do better."
        text="My certificates span clinical care, occupational safety, data analytics, digital marketing, product management, business, and AI, because I like building breadth that still connects back to healthcare."
      />
      <div className="marquee" data-reveal>
        <div className="marquee-track">
          {loop.map((cert, index) => (
            <button
              className="certificate-card"
              key={`${cert.file}-${index}`}
              onClick={() => onOpen(cert, index % data.certificates.length)}
              {...trackingAttrs(`certificate-${slugifyLabel(cert.title)}`, `Certificate: ${cert.title}`)}
            >
              <img src={assetUrl(cert.preview)} alt={cert.title} loading="lazy" {...protectedMediaProps} />
              <span>{cert.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoRoom() {
  const [active, setActive] = useState(0);
  const video = data.videos[active];
  return (
    <section className="section-band video-section" id="videos">
      <SectionHeader
        number="06"
        icon={Video}
        title="I create healthcare videos that teach without overcomplicating."
        text="These video pieces around hyperphosphatemia are built for clear patient and public education, with playback directly on the page."
      />
      <div className="video-layout" data-reveal>
        <div className="video-list">
          {data.videos.map((item, index) => (
            <button
              key={item.file}
              className={index === active ? "is-active" : ""}
              onClick={() => setActive(index)}
              {...trackingAttrs(`video-${slugifyLabel(item.title)}`, `Video: ${item.title}`)}
            >
              <CirclePlay size={22} />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
        <div className="video-frame">
          <video
            key={video.file}
            src={assetUrl(video.file)}
            controls
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            preload="metadata"
            playsInline
            {...protectedMediaProps}
          />
          <h3>{video.title}</h3>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const qrCode = data.tracking?.qrCode;
  const qrUrl = data.tracking?.qrUrl || "https://zenwaku.github.io/marcho-portfolio/";

  return (
    <footer className="section-band contact-section" id="contact">
      <div data-reveal>
        <h2>I am ready for Medical Affairs, product, and healthcare content roles.</h2>
        <p>
          I combine physician-level clinical reasoning with product storytelling, stakeholder communication, market awareness, and AI-enabled workflow speed.
        </p>
      </div>
      <div className="contact-side" data-reveal>
        <div className="contact-actions">
          <a className="button primary" href={`mailto:${data.profile.email}`} {...trackingAttrs("contact-email", "Contact: email")}>
            <Mail size={18} />
            {data.profile.email}
          </a>
          <a className="button secondary" href={`tel:${data.profile.phone}`} {...trackingAttrs("contact-phone", "Contact: phone")}>
            <Phone size={18} />
            {data.profile.phone}
          </a>
          <button
            className="button ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            {...trackingAttrs("contact-back-to-top", "Contact: back to top")}
          >
            <Sparkles size={18} />
            Back to Top
          </button>
        </div>
        {qrCode ? (
          <a className="qr-card" href={qrUrl} aria-label="Open QR campaign link" {...trackingAttrs("contact-qr-card", "Contact: QR card")}>
            <img src={assetUrl(qrCode)} alt="QR code for Marcho portfolio" loading="lazy" />
            <div>
              <span>
                <QrCode size={16} />
                Scan Portfolio
              </span>
              <strong>QR campaign link</strong>
            </div>
          </a>
        ) : null}
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
        number="QR"
        icon={QrCode}
        title="Tracking snapshot for the portfolio QR and key clicks."
        text="This lightweight view reads public counters for the GitHub Pages portfolio, including visits from the QR campaign URL and the highest-signal click areas."
      />
      <div className="tracking-panel" data-reveal>
        {status ? <p className="viewer-status">{status}</p> : null}
        <div className="tracking-cards">
          {stats.slice(0, 7).map((item) => (
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

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Close modal" />
      <div className={`modal-panel ${modal.type}`}>
        <div className="modal-topbar">
          <div>
            <span>{modal.type === "pdf" ? "PDF Viewer" : modal.type === "article" ? "Article Reader" : "Media Viewer"}</span>
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
        ) : (
          <ImageViewer item={modal.item} />
        )}
      </div>
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

  const canGoPrevDeck = modal.collection && modal.index > 0;
  const canGoNextDeck = modal.collection && modal.index < modal.collection.length - 1;
  const collectionLabel = modal.collectionLabel || "Item";
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={page <= 1}
          {...trackingAttrs("pdf-prev-page", "PDF viewer: previous page")}
        >
          <ChevronLeft size={18} />
          Page
        </button>
        <span>
          {page} / {pageCount}
        </span>
        <button
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          disabled={page >= pageCount}
          {...trackingAttrs("pdf-next-page", "PDF viewer: next page")}
        >
          Page
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
          disabled={zoom <= 0.75}
          aria-label="Zoom out"
          {...trackingAttrs("pdf-zoom-out", "PDF viewer: zoom out")}
        >
          <Minus size={18} />
        </button>
        <span>{zoomPercent}%</span>
        <button
          onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
          disabled={zoom >= 2.5}
          aria-label="Zoom in"
          {...trackingAttrs("pdf-zoom-in", "PDF viewer: zoom in")}
        >
          <Plus size={18} />
        </button>
        {modal.collection ? (
          <>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index - 1], collection: modal.collection, index: modal.index - 1, collectionLabel })}
              disabled={!canGoPrevDeck}
              {...trackingAttrs(`pdf-prev-${slugifyLabel(collectionLabel)}`, `PDF viewer: previous ${collectionLabel}`)}
            >
              <ChevronLeft size={18} />
              {collectionLabel}
            </button>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index + 1], collection: modal.collection, index: modal.index + 1, collectionLabel })}
              disabled={!canGoNextDeck}
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
      {article.poster ? <img src={assetUrl(article.poster)} alt="" {...protectedMediaProps} /> : null}
      <article>
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
