import { useEffect, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DendritesLogo from "../../components/DendritesLogo";

gsap.registerPlugin(ScrollTrigger);

/**
 * Dendrites — Landing Page
 * --------------------------------------------------------------
 * Design tokens: White & Blue Theme (inspired by Google Gemini / Canvas)
 * Typography: 'Outfit' (modern geometric sans-serif) & 'Inter'
 * --------------------------------------------------------------
 */

const FONT_IMPORT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

function useFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_IMPORT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_IMPORT_HREF;
    document.head.appendChild(link);
  }, []);
}

/* ----------------------------------------------------------------------- */
/*  Data                                                                    */
/* ----------------------------------------------------------------------- */

interface Feature {
  tag: string;
  title: string;
  body: string;
  detail: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    tag: "agent",
    title: "Instantly organize any topic into a study path",
    body: "Tell the AI what you want to learn. It automatically structures the subject into folders, creates dedicated chats for each subtopic, and maps out a custom learning guide.",
    detail: "Type a topic → get a structured workspace instantly",
    accent: "#ef4444",
  },
  {
    tag: "workspaces",
    title: "Organize with nested folders and custom workspaces",
    body: "Create separate workspaces and nesting folders for different subjects. Set specific guidelines or reference files at any level, and watch nested chats adapt automatically.",
    detail: "Clean workspaces · hierarchical organization",
    accent: "#f97316",
  },
  {
    tag: "documents",
    title: "Learn directly from your files and documents",
    body: "Upload study materials like PDFs, books, and articles. Ask questions, search for facts, and get answers grounded entirely in your uploaded sources.",
    detail: "Document uploads · smart text search & extraction",
    accent: "#eab308",
  },
  {
    tag: "visualization",
    title: "See your learning roadmap in a visual map",
    body: "Visualize complex topics in an interactive graph. Navigate through node connections and flowcharts to see how concepts connect and map out your progress.",
    detail: "Interactive roadmaps · spatial visual views",
    accent: "#22c55e",
  },
  {
    tag: "memory",
    title: "AI companion that remembers your past chats",
    body: "No more re-explaining context. The AI naturally references your past discussions, uploaded files, and preferences, making responses relevant over time.",
    detail: "Continuous learning context · smart long-term memory",
    accent: "#10b981",
  },
  {
    tag: "branch",
    title: "Explore subtopics without losing your place",
    body: "Branch out off-shoot chats to explore deep questions without disrupting your main conversation. The new branch retains the context of the main discussion automatically.",
    detail: "Context-aware sub-chats · focused tangents",
    accent: "#06b6d4",
  },
  {
    tag: "behavior",
    title: "Teach the AI who to be for different subjects",
    body: "Set distinct rules or personas for your folders. Have one behave like a demanding coding mentor and another like a simple teacher, depending on the subject.",
    detail: "Folder-level instructions · custom AI behavior",
    accent: "#3b82f6",
  },
  {
    tag: "quick chat",
    title: "A sandbox for quick, disposable questions",
    body: "Need to quickly test code or ask a fast, off-topic question? Use quick chat as a scratchpad that won't clutter your organized workspace.",
    detail: "Instant sandbox sessions · clutter-free queries",
    accent: "#6366f1",
  },
  {
    tag: "recall",
    title: "Turn key insights into smart study cards",
    body: "Convert any AI response into a flashcard. The system automatically schedules reviews for when you're about to forget them, helping you remember forever.",
    detail: "Smart spaced repetition · personalized card decks",
    accent: "#8b5cf6",
  },
  {
    tag: "share",
    title: "Share your complete workspaces in one click",
    body: "Share entire folder structures, chats, and guides with others. Anyone with the link can preview your workflow and copy the entire tree into their own workspace.",
    detail: "Instant web previews · one-click workspace copies",
    accent: "#ec4899",
  },
];

/* ----------------------------------------------------------------------- */
/*  Hero dendrite SVG — the signature element                              */
/* ----------------------------------------------------------------------- */

function HeroDendrite() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="dendrite-hero-svg"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rainbowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="20%" stopColor="#f97316" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="80%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* trunk */}
      <path
        className="dendrite-path dendrite-trunk"
        d="M320 600 C320 520 320 480 320 420"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* primary branches */}
      <path
        className="dendrite-path dendrite-l1"
        d="M320 420 C300 380 260 360 200 330"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l1"
        d="M320 420 C340 380 380 360 440 330"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l1"
        d="M320 420 C318 370 322 330 320 290"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* secondary branches — left */}
      <path
        className="dendrite-path dendrite-l2"
        d="M200 330 C170 310 140 300 100 290"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l2"
        d="M200 330 C185 290 175 260 165 220"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* secondary branches — right */}
      <path
        className="dendrite-path dendrite-l2"
        d="M440 330 C470 310 500 300 540 292"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l2"
        d="M440 330 C455 288 465 258 475 216"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* secondary branches — center */}
      <path
        className="dendrite-path dendrite-l2"
        d="M320 290 C300 255 305 225 290 190"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l2"
        d="M320 290 C340 255 335 225 350 190"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* tertiary fine branches */}
      <path
        className="dendrite-path dendrite-l3"
        d="M100 290 C80 278 65 270 48 260"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l3"
        d="M165 220 C155 195 150 175 140 150"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l3"
        d="M540 292 C562 280 578 272 596 262"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l3"
        d="M475 216 C486 191 492 171 502 146"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l3"
        d="M290 190 C278 165 270 145 258 122"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="dendrite-path dendrite-l3"
        d="M350 190 C362 165 370 145 382 122"
        fill="none"
        stroke="url(#rainbowGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* terminal nodes — glow points */}
      {[
        [48, 260],
        [140, 150],
        [596, 262],
        [502, 146],
        [258, 122],
        [382, 122],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          className="dendrite-node"
          cx={cx}
          cy={cy}
          r="14"
          fill="url(#nodeGlow)"
        />
      ))}
      {[
        [48, 260],
        [140, 150],
        [596, 262],
        [502, 146],
        [258, 122],
        [382, 122],
      ].map(([cx, cy], i) => (
        <circle
          key={`core-${i}`}
          className="dendrite-node-core"
          cx={cx}
          cy={cy}
          r="3.2"
          fill="#ffffff"
        />
      ))}
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/*  Small mark used as the section identifier                              */
/* ----------------------------------------------------------------------- */

function BranchMark({ color }: { color: string }) {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
      <path
        d="M11 27V14"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11 14C11 9 6 8 3 3"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M11 14C11 9 16 8 19 3"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="11" cy="14" r="2.4" fill={color} />
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/*  Feature section                                                         */
/* ----------------------------------------------------------------------- */

function FeatureSection({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const tag = el.querySelector(".f-tag");
    const title = el.querySelector(".f-title");
    const body = el.querySelector(".f-body");
    const detail = el.querySelector(".f-detail");
    const mark = el.querySelector(".f-mark");
    const rule = el.querySelector(".f-rule");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 72%",
        end: "top 30%",
        toggleActions: "play none none reverse",
      },
    });

    tl.fromTo(
      mark,
      { opacity: 0, scale: 0.6, rotate: -8 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" },
    )
      .fromTo(
        rule,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "power2.out" },
        "<0.05",
      )
      .fromTo(
        tag,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "<0.1",
      )
      .fromTo(
        title,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
        "<0.05",
      )
      .fromTo(
        body,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
        "<0.12",
      )
      .fromTo(
        detail,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "<0.1",
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const reversed = index % 2 === 1;

  return (
    <section
      ref={sectionRef}
      className={`feature-section ${reversed ? "feature-section--reversed" : ""}`}
    >
      <div className="feature-inner bg-neutral-50 border border-neutral-200/80 shadow-sm">
        <div className="f-mark" style={{ color: feature.accent }}>
          <BranchMark color={feature.accent} />
        </div>
        <div className="f-rule" style={{ background: feature.accent }} />
        <p className="f-tag font-semibold" style={{ color: feature.accent }}>
          {feature.tag}
        </p>
        <h3 className="f-title text-neutral-900">{feature.title}</h3>
        <p className="f-body text-neutral-600">{feature.body}</p>
        <p className="f-detail text-neutral-400 border-t border-neutral-200">
          {feature.detail}
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Main page                                                                */
/* ----------------------------------------------------------------------- */

export function DendritesLanding() {
  useFonts();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const paths = root.querySelectorAll<SVGPathElement>(".dendrite-path");
      const nodes = root.querySelectorAll<SVGCircleElement>(".dendrite-node");
      const nodeCores = root.querySelectorAll<SVGCircleElement>(
        ".dendrite-node-core",
      );

      if (prefersReducedMotion) {
        gsap.set(paths, { opacity: 1 });
        gsap.set(nodes, { opacity: 0.7, scale: 1 });
        gsap.set(nodeCores, { opacity: 1, scale: 1 });
      } else {
        // Prepare stroke-draw animation
        paths.forEach((p) => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = `${len}`;
          p.style.strokeDashoffset = `${len}`;
        });
        gsap.set(nodes, { opacity: 0, scale: 0 });
        gsap.set(nodeCores, { opacity: 0, scale: 0 });

        const tl = gsap.timeline({ delay: 0.2 });

        tl.to(".dendrite-trunk", {
          strokeDashoffset: 0,
          duration: 0.7,
          ease: "power2.inOut",
        })
          .to(
            ".dendrite-l1",
            {
              strokeDashoffset: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.12,
            },
            "<0.1",
          )
          .to(
            ".dendrite-l2",
            {
              strokeDashoffset: 0,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0.08,
            },
            "<0.25",
          )
          .to(
            ".dendrite-l3",
            {
              strokeDashoffset: 0,
              duration: 0.45,
              ease: "power2.out",
              stagger: 0.06,
            },
            "<0.2",
          )
          .to(
            nodeCores,
            {
              opacity: 1,
              scale: 1,
              duration: 0.3,
              ease: "back.out(3)",
              stagger: 0.05,
            },
            "<0.1",
          )
          .to(
            nodes,
            {
              opacity: 1,
              scale: 1,
              duration: 0.4,
              ease: "power1.out",
              stagger: 0.05,
            },
            "<",
          )
          .to(
            nodes,
            {
              opacity: 0.45,
              scale: 1.4,
              duration: 1.6,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              stagger: { each: 0.3, from: "random" },
            },
            ">-0.2",
          );

        // Hero copy entrance, synced after the tree starts drawing
        gsap.fromTo(
          ".hero-eyebrow",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: "power2.out" },
        );
        gsap.fromTo(
          ".hero-title-line",
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.45,
            ease: "power3.out",
            stagger: 0.08,
          },
        );
        gsap.fromTo(
          ".hero-sub",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.9, ease: "power3.out" },
        );
        gsap.fromTo(
          ".hero-cta",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, delay: 1.05, ease: "power3.out" },
        );
        gsap.fromTo(
          ".hero-stat",
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 1.2,
            ease: "power2.out",
            stagger: 0.08,
          },
        );

        // Parallax fade of the hero tree on scroll out
        gsap.to(heroRef.current, {
          opacity: 0.15,
          scale: 0.92,
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: root.querySelector(".hero"),
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // Connective spine that grows as the visitor scrolls the feature list
      const spine = root.querySelector(".spine-line");
      if (spine) {
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".features",
              start: "top 60%",
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
      }

      // Closing section reveal
      gsap.fromTo(
        ".closing-content > *",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".closing",
            start: "top 65%",
          },
        },
      );

      // Marquee strip
      const marqueeTrack = root.querySelector(".marquee-track");
      if (marqueeTrack) {
        gsap.to(marqueeTrack, {
          xPercent: -50,
          ease: "none",
          duration: 22,
          repeat: -1,
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className="dendrites-landing min-h-screen text-neutral-900"
      ref={rootRef}
    >
      <style>{STYLES}</style>

      {/* ---------------------------------------------------------------- */}
      {/* NAV                                                              */}
      {/* ---------------------------------------------------------------- */}
      <header className="nav bg-white/30 backdrop-blur-md border-b border-neutral-200/50">
        <div className="nav-mark text-neutral-900 flex items-center gap-2">
          <DendritesLogo size={28} />
          <span className="text-blue-600 font-bold">
            Nurons
          </span>
        </div>
        <nav className="nav-links flex items-center gap-6">
          <a
            href="#features"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Features
          </a>
          <Link
            to="/terms"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/refund"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Refunds
          </Link>
          <a
            href="mailto:nuronstech@gmail.com"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-5">
          <Link
            to="/login"
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="nav-cta bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/10 transition-all font-semibold"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="hero bg-transparent">
        <div className="hero-container">
          <div className="hero-left">
            <p className="hero-eyebrow text-blue-600 font-semibold">
              an ai that doesn't reset at midnight
            </p>
            <h1 className="hero-title text-neutral-900">
              Most AI chat forgets you the moment you close the tab.
              <span className="hero-title-accent text-blue-600 font-extrabold">
                Nurons doesn't.
              </span>
            </h1>
            <p className="hero-sub text-neutral-500">
              A learning companion with real memory — across sessions, branches,
              and documents — plus an agent that turns "I want to learn
              Kubernetes" into a folder tree, named chats, and a roadmap, before
              you've typed a second sentence.
            </p>
            <div className="hero-cta">
              <Link
                to="/register"
                className="btn-primary bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/10 transition-all font-semibold"
              >
                Start for free
              </Link>
              <a
                href="#features"
                className="btn-ghost text-neutral-800 hover:text-red-500 border-neutral-300 hover:border-red-500 transition-all font-semibold"
              >
                See how memory works ↓
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-num text-red-500">4</span>
                <span className="stat-label text-neutral-500">memory layers</span>
              </div>
              <div className="hero-stat">
                <span className="stat-num text-green-500">∞</span>
                <span className="stat-label text-neutral-500">
                  nested folders
                </span>
              </div>
              <div className="hero-stat">
                <span className="stat-num text-purple-500">1</span>
                <span className="stat-label text-neutral-500">
                  sentence to a roadmap
                </span>
              </div>
            </div>
          </div>
          <div className="hero-right" ref={heroRef}>
            <div className="dendrite-card">
              <HeroDendrite />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* MARQUEE STRIP                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="marquee border-t border-b border-neutral-200/50 bg-white/20 backdrop-blur-sm"
        aria-hidden="true"
      >
        <div className="marquee-track">
          {Array(2)
            .fill(FEATURES)
            .flat()
            .map((f, i) => (
              <span
                key={i}
                className="marquee-item text-neutral-400 after:text-neutral-200"
              >
                {f.tag}
              </span>
            ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* FEATURES                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="features" className="features">
        <div className="spine bg-neutral-200">
          <div className="spine-line bg-blue-600" />
        </div>
        <header className="features-head">
          <p className="features-eyebrow text-blue-600 font-semibold">
            what's actually different
          </p>
          <h2 className="features-title text-neutral-900">
            Ten parts of the same idea: nothing you tell it should disappear.
          </h2>
        </header>
        {FEATURES.map((f, i) => (
          <FeatureSection key={f.tag} feature={f} index={i} />
        ))}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* AGENT SPOTLIGHT                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="agent"
        className="agent-spotlight bg-white/20 backdrop-blur-sm border-t border-b border-neutral-200/50"
      >
        <div className="agent-inner">
          <p className="agent-eyebrow text-blue-600 font-semibold">the agent</p>
          <h2 className="agent-title text-neutral-900">
            Type "I want to learn React."
            <br />
            Get a workspace, not an answer.
          </h2>
          <div className="agent-trace">
            <div className="trace-row border-b border-neutral-200">
              <span className="trace-dot bg-neutral-300" />
              <span className="trace-label text-neutral-800">
                reads your intent
              </span>
            </div>
            <div className="trace-row border-b border-neutral-200">
              <span className="trace-dot bg-neutral-300" />
              <span className="trace-label text-neutral-800">
                checks your folders for where this belongs
              </span>
            </div>
            <div className="trace-row border-b border-neutral-200">
              <span className="trace-dot bg-neutral-300" />
              <span className="trace-label text-neutral-800">
                drafts a curriculum — folders as milestones
              </span>
            </div>
            <div className="trace-row border-b border-neutral-200">
              <span className="trace-dot bg-neutral-300" />
              <span className="trace-label text-neutral-800">
                creates the chats, empty and named, waiting for you
              </span>
            </div>
            <div className="trace-row trace-row--final">
              <span className="trace-dot trace-dot--final bg-blue-600 shadow-md shadow-blue-600/20" />
              <span className="trace-label text-blue-600 font-semibold">
                writes the roadmap itself
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CLOSING                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section id="start" className="closing bg-transparent">
        <div className="closing-content">
          <p className="closing-eyebrow text-neutral-500">
            no credit card · free tier included
          </p>
          <h2 className="closing-title text-neutral-900">
            Your next conversation
            <br />
            shouldn't start from zero.
          </h2>
          <Link
            to="/register"
            className="btn-primary btn-primary--lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/10 transition-all inline-block font-semibold"
          >
            Start for free
          </Link>
          <p className="closing-foot text-neutral-500">
            Nurons — built to remember what ChatGPT lets you forget.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Styles                                                                   */
/* ----------------------------------------------------------------------- */

const STYLES = `
  .dendrites-landing {
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
    position: relative;
    background: linear-gradient(135deg, #fee2e2 0%, #ffedd5 20%, #fef9c3 40%, #dcfce7 60%, #dbeafe 80%, #f3e8ff 100%) !important;
    background-attachment: fixed !important;
  }

  .dendrites-landing * { box-sizing: border-box; }

  .dendrites-landing :focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
    border-radius: 2px;
  }

  /* ---------------- NAV ---------------- */
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 48px;
    backdrop-filter: blur(10px);
  }
  .nav-mark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: 19px;
    letter-spacing: 0.01em;
  }
  .nav-links {
    display: flex;
    gap: 36px;
    font-size: 14px;
  }
  .nav-links a { text-decoration: none; }
  .nav-cta {
    font-size: 13.5px;
    font-weight: 500;
    padding: 9px 18px;
    border-radius: 100px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .nav-cta:hover { transform: translateY(-1px); }

  @media (max-width: 760px) {
    .nav { padding: 16px 20px; }
    .nav-links { display: none; }
  }

  /* ---------------- HERO ---------------- */
  .hero {
    position: relative;
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    z-index: 1;
  }

  .hero-container {
    max-width: 1200px;
    width: 100%;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 64px;
    align-items: center;
  }

  .hero-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .hero-right {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
  }

  .dendrite-card {
    width: 100%;
    max-width: 480px;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 28px;
    padding: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.02);
    position: relative;
    overflow: hidden;
  }

  .dendrite-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05));
    pointer-events: none;
  }

  .dendrite-hero-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .dendrite-node-core {
    filter: drop-shadow(0 0 4px rgba(236,72,153,0.8));
  }

  .hero-eyebrow {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 0 0 20px;
  }

  .hero-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: clamp(38px, 4.5vw, 58px);
    line-height: 1.15;
    letter-spacing: -0.025em;
    margin: 0 0 24px;
    color: #111827;
  }

  .hero-title-accent {
    display: block;
    margin-top: 10px;
  }

  .hero-sub {
    font-size: 18px;
    line-height: 1.65;
    margin: 0 0 36px;
    color: #4b5563;
  }

  .hero-cta {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 48px;
    flex-wrap: wrap;
  }

  .btn-primary {
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 100px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    display: inline-block;
  }
  .btn-primary:hover { transform: translateY(-2px); }
  .btn-primary--lg { font-size: 16px; padding: 17px 34px; }
  .btn-ghost {
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    padding-bottom: 2px;
    transition: border-color 0.2s, color 0.2s;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 28px;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .stat-num {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .stat-label {
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
  }

  .nav-mark span,
  .features-title,
  .agent-title,
  .closing-title,
  .f-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  @media (max-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr;
      gap: 48px;
    }
    .hero-left {
      align-items: center;
      text-align: center;
    }
    .hero-cta {
      justify-content: center;
    }
    .hero-stats {
      justify-content: center;
    }
    .hero-stat {
      align-items: center;
    }
    .dendrite-card {
      max-width: 440px;
    }
  }

  /* ---------------- MARQUEE ---------------- */
  .marquee {
    overflow: hidden;
    padding: 14px 0;
  }
  .marquee-track {
    display: flex;
    width: max-content;
    gap: 48px;
  }
  .marquee-item {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .marquee-item::after {
    content: '·';
    margin-left: 48px;
  }

  /* ---------------- FEATURES ---------------- */
  .features {
    position: relative;
    padding: 140px 24px 80px;
    max-width: 880px;
    margin: 0 auto;
  }
  .spine {
    position: absolute;
    left: 50%;
    top: 320px;
    bottom: 120px;
    width: 1px;
    transform: translateX(-50%);
  }
  .spine-line {
    width: 100%;
    height: 100%;
    transform-origin: top;
    transform: scaleY(0);
  }
  @media (max-width: 760px) { .spine { display: none; } }

  .features-head {
    text-align: center;
    max-width: 620px;
    margin: 0 auto 100px;
  }
  .features-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0 0 18px;
  }
  .features-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: clamp(26px, 4vw, 38px);
    line-height: 1.3;
    margin: 0;
  }

  .feature-section {
    position: relative;
    margin-bottom: 130px;
    display: flex;
    justify-content: flex-start;
  }
  .feature-section--reversed { justify-content: flex-end; }
  .feature-section:last-child { margin-bottom: 0; }

  .feature-inner {
    width: 100%;
    max-width: 460px;
    border-radius: 18px;
    padding: 38px 38px 34px;
    position: relative;
  }
  .feature-section--reversed .feature-inner { text-align: right; }
  .feature-section--reversed .f-mark { margin-left: auto; }
  .feature-section--reversed .f-rule { margin-left: auto; }

  .f-mark { margin-bottom: 18px; opacity: 0; }
  .f-rule {
    width: 40px;
    height: 2px;
    margin-bottom: 18px;
    transform-origin: left;
    transform: scaleX(0);
    border-radius: 2px;
  }
  .feature-section--reversed .f-rule { transform-origin: right; }
  .f-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0 0 14px;
    opacity: 0;
  }
  .f-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: 25px;
    line-height: 1.32;
    margin: 0 0 14px;
    opacity: 0;
  }
  .f-body {
    font-size: 15px;
    line-height: 1.65;
    margin: 0 0 20px;
    opacity: 0;
  }
  .f-detail {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    letter-spacing: 0.02em;
    margin: 0;
    padding-top: 16px;
    opacity: 0;
  }

  @media (max-width: 760px) {
    .features { padding-top: 90px; }
    .feature-section, .feature-section--reversed { justify-content: center; }
    .feature-inner, .feature-section--reversed .feature-inner {
      text-align: left;
      max-width: 100%;
    }
    .feature-section--reversed .f-mark,
    .feature-section--reversed .f-rule { margin-left: 0; }
    .feature-section--reversed .f-rule { transform-origin: left; }
  }

  /* ---------------- AGENT SPOTLIGHT ---------------- */
  .agent-spotlight {
    padding: 120px 24px;
  }
  .agent-inner { max-width: 640px; margin: 0 auto; }
  .agent-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0 0 20px;
  }
  .agent-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: clamp(26px, 4.4vw, 40px);
    line-height: 1.28;
    margin: 0 0 52px;
  }
  .agent-trace {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .trace-row {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 16px 0;
  }
  .trace-row--final { border-bottom: none; }
  .trace-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .trace-dot--final {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .trace-label {
    font-size: 15.5px;
  }

  /* ---------------- CLOSING ---------------- */
  .closing {
    padding: 160px 24px 120px;
    text-align: center;
  }
  .closing-content { max-width: 560px; margin: 0 auto; }
  .closing-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 24px;
  }
  .closing-title {
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    font-size: clamp(30px, 5.5vw, 48px);
    line-height: 1.2;
    margin: 0 0 40px;
  }
  .closing-foot {
    margin-top: 32px;
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    font-weight: 400;
  }

  /* ---------------- REDUCED MOTION ---------------- */
  @media (prefers-reduced-motion: reduce) {
    .dendrites-landing * {
      animation-duration: 0.001ms !important;
      transition-duration: 0.001ms !important;
    }
  }
`;
