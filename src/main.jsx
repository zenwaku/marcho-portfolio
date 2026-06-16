import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
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
  PanelsTopLeft,
  PenTool,
  Phone,
  Presentation,
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

function App() {
  useReveal();
  const progress = useScrollProgress();
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
        <DesignGallery onOpen={(design) => setModal({ type: design.kind === "pdf" ? "pdf" : "image", item: design })} />
        <VideoRoom />
        <CertificateMarquee onOpen={(cert, index) => setModal({ type: cert.kind === "pdf" ? "pdf" : "image", item: cert, collection: data.certificates, index, collectionLabel: "Certificate" })} />
        <ContactSection />
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
          <a key={id} href={`#${id}`}>
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
          <a className="button primary" href="#projects">
            <PanelsTopLeft size={18} />
            View Work
          </a>
          <a className="button secondary" href={`mailto:${data.profile.email}`}>
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
        <ProfileSnapshot />
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
              <img src={assetUrl(moment.preview || moment.file)} alt={moment.title} loading="lazy" />
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
      {portrait ? <img src={assetUrl(portrait.preview || portrait.file)} alt="Marcho formal portrait" loading="lazy" /> : null}
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
          <button className="deck-card" key={slide.file} onClick={() => onOpen(slide, index)}>
            <img src={assetUrl(slide.thumb)} alt="" loading="lazy" />
            <span>{slide.pages} pages</span>
            <h3>{slide.title}</h3>
            <p>{slide.summary}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProjectLab({ project, projectIndex, setProjectIndex }) {
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
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="iframe-shell" data-reveal>
        <div className="iframe-toolbar">
          <span>{project.title}</span>
          <a href={assetUrl(project.file)} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} in a new tab`}>
            <ArrowUpRight size={18} />
          </a>
        </div>
        <iframe
          key={project.file}
          title={project.title}
          src={assetUrl(project.file)}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
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
          <button className="article-card" key={article.file} onClick={() => onOpen(article)}>
            <img src={assetUrl(article.posterPreview)} alt="" loading="lazy" />
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

function DesignGallery({ onOpen }) {
  return (
    <section className="section-band design-section" id="design">
      <SectionHeader
        number="05"
        icon={GalleryHorizontalEnd}
        title="I design health carousels that educate at a glance."
        text="I create poster, bulletin, and carousel-style health visuals for public education, built to make useful medical information easier to scan, save, and share."
      />
      <div className="design-grid" data-reveal>
        {data.designs.map((design, index) => (
          <button className={`design-card design-${index}`} key={design.file} onClick={() => onOpen(design)}>
            <img src={assetUrl(design.preview)} alt={design.title} loading="lazy" />
            <span>{design.title}</span>
            <small>{design.kind === "pdf" ? `${design.pages} page carousel` : "education carousel"}</small>
          </button>
        ))}
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
            <button className="certificate-card" key={`${cert.file}-${index}`} onClick={() => onOpen(cert, index % data.certificates.length)}>
              <img src={assetUrl(cert.preview)} alt={cert.title} loading="lazy" />
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
            <button key={item.file} className={index === active ? "is-active" : ""} onClick={() => setActive(index)}>
              <CirclePlay size={22} />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
        <div className="video-frame">
          <video key={video.file} src={assetUrl(video.file)} controls preload="metadata" playsInline />
          <h3>{video.title}</h3>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <footer className="section-band contact-section" id="contact">
      <div data-reveal>
        <h2>I am ready for Medical Affairs, product, and healthcare content roles.</h2>
        <p>
          I combine physician-level clinical reasoning with product storytelling, stakeholder communication, market awareness, and AI-enabled workflow speed.
        </p>
      </div>
      <div className="contact-actions" data-reveal>
        <a className="button primary" href={`mailto:${data.profile.email}`}>
          <Mail size={18} />
          {data.profile.email}
        </a>
        <a className="button secondary" href={`tel:${data.profile.phone}`}>
          <Phone size={18} />
          {data.profile.phone}
        </a>
        <button className="button ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Sparkles size={18} />
          Back to Top
        </button>
      </div>
    </footer>
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

function PdfViewer({ modal, setModal }) {
  const canvasRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(modal.item.pages || 1);
  const [status, setStatus] = useState("Loading PDF...");

  useEffect(() => {
    setPage(1);
    setPageCount(modal.item.pages || 1);
  }, [modal.item.file, modal.item.pages]);

  useEffect(() => {
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
        const loadingTask = pdfjsLib.getDocument(assetUrl(modal.item.file));
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const currentPage = Math.min(page, pdf.numPages);
        const pdfPage = await pdf.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const parentWidth = Math.min(canvas.parentElement.clientWidth, 1040);
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const scale = Math.max(0.7, Math.min(2.1, parentWidth / baseViewport.width));
        const viewport = pdfPage.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setStatus("");
      } catch (error) {
        if (!cancelled) setStatus(`Could not render this PDF in canvas. The original file is still available below. ${error.message}`);
      }
    }
    renderPdf();
    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [modal.item.file, page]);

  const canGoPrevDeck = modal.collection && modal.index > 0;
  const canGoNextDeck = modal.collection && modal.index < modal.collection.length - 1;
  const collectionLabel = modal.collectionLabel || "Item";

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
          <ChevronLeft size={18} />
          Page
        </button>
        <span>
          {page} / {pageCount}
        </span>
        <button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount}>
          Page
          <ChevronRight size={18} />
        </button>
        {modal.collection ? (
          <>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index - 1], collection: modal.collection, index: modal.index - 1, collectionLabel })}
              disabled={!canGoPrevDeck}
            >
              <ChevronLeft size={18} />
              {collectionLabel}
            </button>
            <button
              onClick={() => setModal({ type: "pdf", item: modal.collection[modal.index + 1], collection: modal.collection, index: modal.index + 1, collectionLabel })}
              disabled={!canGoNextDeck}
            >
              {collectionLabel}
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>
      {status ? <p className="viewer-status">{status}</p> : null}
      <canvas ref={canvasRef} />
      <object className="pdf-fallback" data={assetUrl(modal.item.file)} type="application/pdf" aria-label={modal.item.title} />
    </div>
  );
}

function ArticleReader({ article }) {
  const paragraphs = textBlock(article.body);
  return (
    <div className="article-reader">
      {article.poster ? <img src={assetUrl(article.poster)} alt="" /> : null}
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
      <img src={assetUrl(item.file)} alt={item.title} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
