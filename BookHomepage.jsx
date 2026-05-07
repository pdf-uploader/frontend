/**
 * BookHomepage.jsx — Interactive book cover component.
 * Self-contained, inline-styled React component (no Tailwind needed).
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    icon: '🗺️',
    chapter: 'Chapter 1',
    title: 'Planning',
    desc:
      "Strategic route planning, traffic demand forecasting, environmental impact assessments, and feasibility studies for Uganda's expressway network.",
    bullets: [
      'Route Identification & Corridor Studies',
      'Traffic Volume & Demand Forecasting',
      'Environmental & Social Impact Assessment',
      'Cost-Benefit & Feasibility Analysis',
      'Stakeholder Engagement Procedures',
    ],
  },
  {
    icon: '📐',
    chapter: 'Chapter 2',
    title: 'Design',
    desc:
      "Geometric design standards, structural engineering specifications, pavement design criteria, and drainage systems aligned with Uganda's climate and terrain.",
    bullets: [
      'Geometric & Alignment Standards',
      'Pavement Structure & Materials',
      'Bridges & Structural Design',
      'Drainage & Hydraulic Design',
      'Safety Infrastructure & Signage',
    ],
  },
  {
    icon: '🏗️',
    chapter: 'Chapter 3',
    title: 'Construction',
    desc:
      'Construction management procedures, quality control protocols, safety standards, and contractor oversight guidelines for expressway infrastructure delivery.',
    bullets: [
      'Construction Planning & Supervision',
      'Quality Control & Assurance',
      'Materials Testing & Acceptance',
      'Occupational Health & Safety',
      'Environmental Compliance during Works',
    ],
  },
  {
    icon: '🚦',
    chapter: 'Chapter 4',
    title: 'Operation',
    desc:
      'Traffic management systems, tolling operations, incident response protocols, and intelligent transport system integration for smooth expressway operations.',
    bullets: [
      'Traffic Control & Management Systems',
      'Tolling & Revenue Operations',
      'Incident & Emergency Response',
      'ITS & Communication Infrastructure',
      'Performance Monitoring & Reporting',
    ],
  },
  {
    icon: '🔧',
    chapter: 'Chapter 5',
    title: 'Maintenance',
    desc:
      'Routine and periodic maintenance frameworks, asset management systems, pavement rehabilitation strategies, and lifecycle cost management for long-term sustainability.',
    bullets: [
      'Routine & Periodic Maintenance Plans',
      'Pavement Condition Monitoring',
      'Bridge Inspection & Repair',
      'Asset Management Systems',
      'Lifecycle Cost Analysis & Planning',
    ],
  },
];

const TOC_ENTRIES = [
  { num: '1', name: 'Planning',     page: '14'  },
  { num: '2', name: 'Design',       page: '52'  },
  { num: '3', name: 'Construction', page: '98'  },
  { num: '4', name: 'Operation',    page: '144' },
  { num: '5', name: 'Maintenance',  page: '186' },
];

// ─── Theme ───────────────────────────────────────────────────────────────────

const C = {
  navy:        '#1a2744',
  gold:        '#c97c2a',
  paper:       '#faf8f3',
  paperBorder: '#d0c4aa',
  paperDot:    '#d8cdb8',
  textDark:    '#3a3020',
  textMid:     '#6a5a40',
  textMuted:   '#8a7a60',
  spineLight:  '#e0d4bb',
};

const fontSerif   = "'Source Serif 4', Georgia, serif";
const fontDisplay = "'Playfair Display', 'Times New Roman', serif";

// ─── Timing constants ─────────────────────────────────────────────────────────

const LAST_SPREAD = SECTIONS.length + 1; // 0=toc+welcome, 1–5=sections, 6=login
const OPEN_MS     = 1000; // book-opening animation (slide + flip two phases)
const CLOSE_MS    = 900;  // book-closing animation (fade + slide)
const FLIP_MS     = 880;  // page-flip (2× slower as requested)

// ─── Content components ───────────────────────────────────────────────────────

function TocLeftContent() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={styles.pageHeader}>Uganda Expressway Integrated Manual</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
        Table of Contents
      </div>
      <div style={{ fontFamily: fontSerif, fontSize: 12, color: C.textMuted, fontStyle: 'italic', marginBottom: 24 }}>
        Five integrated manuals covering the full lifecycle
      </div>
      {TOC_ENTRIES.map((e) => (
        <div key={e.num} style={styles.tocEntry}>
          <span style={{ fontFamily: fontDisplay, fontSize: 11, color: C.gold, fontWeight: 700, minWidth: 18, marginTop: 2 }}>{e.num}</span>
          <span style={{ fontFamily: fontSerif, fontSize: 14, color: C.navy }}>{e.name}</span>
          <span style={{ flex: 1, borderBottom: `1px dotted ${C.paperDot}`, margin: '0 8px', alignSelf: 'center', height: 1 }} />
          <span style={{ fontFamily: fontSerif, fontSize: 12, color: C.textMuted, minWidth: 20, textAlign: 'right' }}>{e.page}</span>
        </div>
      ))}
    </div>
  );
}

function WelcomeRightContent() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={styles.pageHeader}>Welcome</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 10, lineHeight: 1.3 }}>
        An interactive preview
      </div>
      <div style={{ width: 32, height: 1.5, background: C.gold, marginBottom: 16 }} />
      <div style={{ fontFamily: fontSerif, fontSize: 13.5, color: C.textDark, lineHeight: 1.75, marginBottom: 20 }}>
        This manual covers the complete lifecycle of Uganda's expressway infrastructure — from initial planning through
        design, construction, operation, and long-term maintenance.<br /><br />
        Flip through the pages to explore each section. Log in to access the full content.
      </div>
      <div style={{ padding: 14, background: 'rgba(201,124,42,0.07)', borderLeft: `2px solid ${C.gold}`, borderRadius: '0 4px 4px 0' }}>
        <div style={{ fontFamily: fontSerif, fontSize: 12, color: '#7a5a20', lineHeight: 1.6 }}>
          Click the <strong>right page</strong> to begin browsing →
        </div>
      </div>
    </div>
  );
}

function SectionLeftContent({ section }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={styles.pageHeader}>{section.chapter} · Uganda Expressway Integrated Manual</div>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{section.icon}</div>
      <div style={{ fontFamily: fontSerif, fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
        {section.chapter}
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, color: C.navy, marginBottom: 14, lineHeight: 1.2 }}>
        {section.title}
      </div>
      <div style={{ width: 32, height: 1.5, background: C.gold, marginBottom: 16 }} />
      <div style={{ fontFamily: fontSerif, fontSize: 14, color: C.textDark, lineHeight: 1.75 }}>
        {section.desc}
      </div>
    </div>
  );
}

function SectionRightContent({ section }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={styles.pageHeader}>Key Topics</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 14, color: C.textMuted, marginBottom: 14, fontStyle: 'italic' }}>
        Covered in this section:
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {section.bullets.map((b) => (
          <li key={b} style={{ fontFamily: fontSerif, fontSize: 12.5, color: '#5a4a30', padding: '6px 0', borderBottom: `0.5px dotted ${C.paperDot}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.gold, flexShrink: 0 }}>—</span>{b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginLeftContent({ onLoginClick }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.6 }}>🔐</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Ready to dive deeper?</div>
      <div style={{ fontFamily: fontSerif, fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>
        You've seen the full structure of the Uganda Expressway Integrated Manual.
        Log in to access the complete reference documentation, detailed specifications, and all annexes.
      </div>
      <button
        onClick={onLoginClick}
        style={{ background: C.navy, color: '#fff', fontFamily: fontSerif, fontSize: 13, letterSpacing: '0.08em', border: 'none', borderRadius: 4, padding: '10px 24px', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.gold)}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
      >
        Log in to view full manual
      </button>
    </div>
  );
}

function LoginRightContent() {
  const supporters = ['KOICA', 'Korea Expressway Corporation', 'Dohwa Engineering', 'Cheil Engineering'];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={styles.pageHeader}>Access</div>
      <div style={{ fontFamily: fontSerif, fontSize: 13, color: C.textMuted, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
        This manual is available to registered users of the Uganda Ministry of Works &amp; Transport expressway management portal.
      </div>
      <div style={{ borderTop: `0.5px solid ${C.paperBorder}`, paddingTop: 14 }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 13, color: C.navy, marginBottom: 8 }}>Supported by:</div>
        {supporters.map((s) => (
          <div key={s} style={{ fontFamily: fontSerif, fontSize: 12, color: C.textMid, padding: '5px 0', borderBottom: `0.5px dotted ${C.paperDot}` }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = {
  pageHeader: {
    fontFamily: fontSerif, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
    color: C.textMuted, paddingBottom: 10, borderBottom: `0.5px solid ${C.paperBorder}`, marginBottom: 24,
  },
  tocEntry: { display: 'flex', alignItems: 'flex-start', padding: '10px 0', borderBottom: `0.5px solid #e8e0d0`, gap: 12 },
  page: { flex: 1, background: C.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  pageTexture: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(180,160,120,0.07) 24px,rgba(180,160,120,0.07) 25px)',
    borderRadius: 'inherit',
  },
  pageInner: { padding: '32px 28px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 },
  pageFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', borderTop: `0.5px solid ${C.paperBorder}`, position: 'relative', zIndex: 1 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSpreadLabel(spread) {
  if (spread === 0) return 'i – ii';
  const start = spread * 2 - 1;
  return `${start} – ${start + 1}`;
}

function getSpreadContent(spread, side, onLoginClick) {
  if (spread === 0) return side === 'left' ? <TocLeftContent /> : <WelcomeRightContent />;
  if (spread > SECTIONS.length) return side === 'left' ? <LoginLeftContent onLoginClick={onLoginClick} /> : <LoginRightContent />;
  const section = SECTIONS[spread - 1];
  return side === 'left' ? <SectionLeftContent section={section} /> : <SectionRightContent section={section} />;
}

function getMobilePage(pageIndex, onLoginClick) {
  const spread = Math.floor(pageIndex / 2);
  const side   = pageIndex % 2 === 0 ? 'left' : 'right';
  return getSpreadContent(spread, side, onLoginClick);
}

function getMobilePageLabel(pageIndex) {
  if (pageIndex === 0) return 'i';
  if (pageIndex === 1) return 'ii';
  return String(pageIndex - 1);
}

function playPaperRustle() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx  = new Ctx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
    window.setTimeout(() => ctx.close(), 200);
  } catch { /* ignore */ }
}

// ─── BookCover (static, closed state) ────────────────────────────────────────

function BookCover({ onClick, tiltEnabled = true }) {
  const innerRef      = useRef(null);
  const hoverTimer    = useRef(null);
  const [showHint, setShowHint]   = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const onMouseMove = useCallback((e) => {
    if (!tiltEnabled) return;
    const el = innerRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const dx = (e.clientX - left - width / 2)  / (width  / 2);
    const dy = (e.clientY - top  - height / 2) / (height / 2);
    el.style.transform = `rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg)`;
  }, [tiltEnabled]);

  const onMouseLeave = useCallback(() => {
    if (innerRef.current) innerRef.current.style.transform = '';
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setShowHint(false);
    setIsHovered(false);
  }, []);

  useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); }, []);

  return (
    /* Outer: perspective container + click target */
    <div
      style={{ perspective: 2000, width: 'min(88vw,480px)', height: 'min(86vh,680px)', cursor: 'pointer', position: 'relative', userSelect: 'none' }}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => {
        if (!tiltEnabled) return;
        setIsHovered(true);
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => setShowHint(true), 600);
      }}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label="Open the Expressway Integrated Manual"
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Inner: the book itself — this element gets the tilt transform */}
      <div
        ref={innerRef}
        style={{
          width: '100%', height: '100%',
          borderRadius: '2px 10px 10px 2px',
          boxShadow: isHovered
            ? '-10px 14px 34px rgba(0,0,0,0.44), 10px 0 14px rgba(0,0,0,0.18), 2px 0 0 #f0ebe0, 4px 0 0 #e8e2d8, 6px 0 0 #e0d9ce'
            : '-6px 6px 20px rgba(0,0,0,0.38), 4px 0 8px rgba(0,0,0,0.14), 2px 0 0 #f0ebe0, 4px 0 0 #e8e2d8, 6px 0 0 #e0d9ce',
          overflow: 'hidden',
          transition: 'box-shadow 200ms ease',
          outline: isFocused ? `2px solid ${C.gold}` : 'none',
          outlineOffset: isFocused ? '4px' : '0px',
          position: 'relative',
        }}
      >
        <img
          src="/logo/bookcover.png"
          alt="Uganda Expressway Integrated Manual cover"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

      {/* "Click to open" hint */}
      <div aria-hidden style={{
        position: 'absolute', left: '50%', bottom: 18,
        transform: 'translateX(-50%)',
        fontFamily: fontSerif, fontSize: 12, letterSpacing: '0.06em',
        color: 'rgba(58,48,32,0.72)',
        background: 'rgba(255,255,255,0.86)',
        border: `1px solid ${C.paperBorder}`,
        borderRadius: 999, padding: '5px 11px',
        opacity: showHint ? 1 : 0, transition: 'opacity 220ms ease',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Click to open
      </div>
    </div>
  );
}

// ─── Shared spread shell (used by both animation scenes and OpenBook) ─────────

function SpreadShell({ children, style = {}, ...rest }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'min(96vw,1280px)',
        minHeight: 'min(82vh,760px)',
        display: 'flex',
        borderRadius: 8,
        /* NO filter here — CSS filter flattens 3-D children (breaks preserve-3d) */
        boxShadow: '0 8px 36px rgba(0,0,0,0.20)',
        /* perspective so children can do 3-D rotateY */
        perspective: 1800,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function PageLeft({ children, onClick, cursor = 'default', style }) {
  return (
    <div
      style={{ ...styles.page, borderRadius: '8px 0 0 8px', boxShadow: 'inset -28px 0 36px rgba(0,0,0,0.13)', cursor, ...style }}
      onClick={onClick}
    >
      <div style={styles.pageTexture} />
      <div style={styles.pageInner}>{children}</div>
    </div>
  );
}

function PageRight({ children, onClick, cursor = 'default', style }) {
  return (
    <div
      style={{ ...styles.page, borderRadius: '0 8px 8px 0', boxShadow: 'inset 28px 0 36px rgba(0,0,0,0.09)', cursor, ...style }}
      onClick={onClick}
    >
      <div style={styles.pageTexture} />
      <div style={styles.pageInner}>{children}</div>
    </div>
  );
}

/* Spine is now shadow-only — no visible thick divider */
function Spine() {
  return (
    <div style={{
      width: 2, flexShrink: 0, background: C.paperBorder, zIndex: 2,
      boxShadow: '3px 0 10px rgba(0,0,0,0.13), -3px 0 10px rgba(0,0,0,0.10)',
    }} />
  );
}

// ─── BookOpeningAnimation ─────────────────────────────────────────────────────
/**
 * Physical book opening — two sequential phases:
 *
 * Phase 1 · SLIDE  (coverOpenSlide, 340 ms)
 *   The portrait cover starts centered in the viewport (translateX(-50%) on the
 *   right-half element) and slides to the right half of the spread, as if the
 *   reader is moving the book to the right to make room for the left page.
 *
 * Phase 2 · FLIP  (coverOpenFlip, remaining ms, delayed)
 *   The cover rotates 0 → -180° around the spine (left edge of the element),
 *   peeling right→left to reveal the TOC underneath.  The TOC page fades in
 *   during this phase.
 */
function BookOpeningAnimation({ onDone, onLoginClick }) {
  const OPEN_SLIDE_MS = 340;
  const OPEN_FLIP_MS  = OPEN_MS - OPEN_SLIDE_MS;

  useEffect(() => {
    const t = window.setTimeout(onDone, OPEN_MS + 40);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const faceBase = {
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  };

  return (
    <SpreadShell>
      {/* TOC page: always visible — no paper overlay covers it during slide */}
      <PageLeft><TocLeftContent /></PageLeft>
      <Spine />
      {/* Welcome page: always visible, revealed as cover peels off */}
      <PageRight><WelcomeRightContent /></PageRight>

      {/* ── Cover: starts centered (portrait look), slides right, then flips open ── */}
      {/*   Phase 1 — coverOpenSlide: translateX(-50%) → translateX(0)             */}
      {/*   Phase 2 — coverOpenFlip:  rotateY(0) → rotateY(-180°) after delay      */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 'calc(50% - 1px)',
        zIndex: 17,
        transformOrigin: 'left center',   /* spine — correct pivot for the flip   */
        transformStyle: 'preserve-3d',
        animation: [
          `coverOpenSlide ${OPEN_SLIDE_MS}ms cubic-bezier(0.22, 0, 0.36, 1) forwards`,
          `coverOpenFlip  ${OPEN_FLIP_MS}ms cubic-bezier(0.4, 0, 0.25, 1) ${OPEN_SLIDE_MS}ms forwards`,
        ].join(', '),
      }}>
        {/* Front face: cover image (visible while cover faces the viewer) */}
        <div style={{ ...faceBase, background: C.navy, borderRadius: '2px 8px 8px 2px' }}>
          <img src="/logo/bookcover.png" alt="" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, transparent 28%)' }} />
        </div>
        {/* Back face: inside cover / endpaper (visible as cover folds to the left) */}
        <div style={{ ...faceBase, background: '#f5f0e8', transform: 'rotateY(180deg)', borderRadius: '8px 0 0 8px' }}>
          <div style={styles.pageTexture} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 30%)' }} />
        </div>
      </div>
    </SpreadShell>
  );
}

// ─── BookClosingAnimation ─────────────────────────────────────────────────────
/**
 * Physical book closing in two sequential phases:
 *
 * Phase 1 · FLIP  (leftPageCloseFlip, ~55 % of CLOSE_MS)
 *   The left page (showing current spread's left content) sweeps LEFT → RIGHT
 *   around the spine (transform-origin: right center, rotateY 0 → 180°).
 *   The back face carries the COVER IMAGE, so as the flip completes the reader
 *   sees the cover land on the right side of the spread.
 *   The right page fades out quickly so only the flip is in focus.
 *
 * Phase 2 · SLIDE  (remaining ~45 % of CLOSE_MS, after a delay)
 *   The SpreadShell fades out while a portrait-sized cover image slides in from
 *   the right and settles at center — as if the reader placed the closed book
 *   back in the middle of the table.
 *   onDone fires ≈ 40 ms later and the static BookCover appears seamlessly.
 */
function BookClosingAnimation({ spread, onDone, onLoginClick }) {
  const FLIP_DUR = Math.round(CLOSE_MS * 0.55); // phase 1: page flip

  useEffect(() => {
    const t = window.setTimeout(onDone, CLOSE_MS + 40);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const faceBase = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden' };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* ── Spread shell fades out during the flip so no blank left area shows ── */}
      <SpreadShell style={{ animation: `spreadFadeOut ${CLOSE_MS * 0.9}ms ease forwards` }}>

        {/* Left placeholder — transparent, keeps flex layout; flip overlay renders actual content */}
        <div style={{ flex: 1 }} />
        <Spine />
        {/* Right page fades out quickly so attention stays on the flip */}
        <PageRight style={{ animation: `spreadFadeOut ${FLIP_DUR * 0.45}ms ease forwards` }}>
          {getSpreadContent(spread, 'right', onLoginClick)}
        </PageRight>

        {/* ── LEFT-PAGE FLIP: sweeps left → right, cover image on back face ── */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 'calc(50% - 1px)',
          borderRadius: '8px 0 0 8px',
          zIndex: 20,
          transformOrigin: 'right center',
          transformStyle: 'preserve-3d',
          animation: `leftPageCloseFlip ${FLIP_DUR}ms cubic-bezier(0.42, 0, 0.22, 1) forwards`,
        }}>
          {/* Front: left page content (visible 0 – 90°) */}
          <div style={{ ...faceBase, background: C.paper, borderRadius: '8px 0 0 8px' }}>
            <div style={styles.pageTexture} />
            <div style={styles.pageInner}>{getSpreadContent(spread, 'left', onLoginClick)}</div>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(0,0,0,0.10) 0%, transparent 22%)' }} />
          </div>
          {/* Back: cover image (visible 90 – 180°, landing on the right side) */}
          <div style={{ ...faceBase, background: C.navy, transform: 'rotateY(-180deg)', borderRadius: '0 8px 8px 0' }}>
            <img src="/logo/bookcover.png" alt="" aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(to left, rgba(0,0,0,0.10) 0%, transparent 30%)' }} />
          </div>
        </div>

      </SpreadShell>

      {/* ── Portrait cover slides in from right simultaneously with SpreadShell fade ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 25,
      }}>
        <div style={{
          width: 'min(88vw, 480px)', height: 'min(86vh, 680px)',
          borderRadius: '2px 10px 10px 2px', overflow: 'hidden',
          boxShadow: '-6px 12px 32px rgba(0,0,0,0.40)',
          animation: `coverCloseSlide ${CLOSE_MS}ms cubic-bezier(0.28, 0, 0.18, 1) both`,
        }}>
          <img src="/logo/bookcover.png" alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
      </div>

    </div>
  );
}

// ─── Mobile cover animator (kept for mobile open/close) ───────────────────────
function AnimatingCover({ mode, onDone }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, mode === 'opening' ? OPEN_MS : CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [mode, onDone]);
  return (
    <div style={{ perspective: 1800, width: 'min(88vw,480px)', height: 'min(86vh,680px)', flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: '2px 10px 10px 2px',
        overflow: 'hidden', position: 'relative',
        transformOrigin: 'left center',
        animation: mode === 'opening'
          ? `bookCoverOpen ${OPEN_MS}ms cubic-bezier(0.45,0,0.25,1) forwards`
          : `bookCoverClose ${CLOSE_MS}ms cubic-bezier(0.45,0,0.25,1) forwards`,
        boxShadow: '-8px 14px 36px rgba(0,0,0,0.40), 2px 0 0 #f0ebe0, 4px 0 0 #e8e2d8',
      }}>
        <img src="/logo/bookcover.png" alt="" aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      </div>
    </div>
  );
}

// ─── PageFlipOverlay ──────────────────────────────────────────────────────────
/**
 * Two-face card overlay on the turning half of the spread.
 *
 * Front face: old page content  (visible  0 – 90°, peeling off the current side)
 * Back face:  new page content  (visible 90 – 180°, lands on the opposite side)
 *
 * Using real content on both faces means no blank paper ever appears — the flip
 * shows actual pages the entire rotation, exactly like a physical book turn.
 *
 * Forward flip (right→left):
 *   front = fromSpread RIGHT page (lifts off the right side)
 *   back  = toSpread   LEFT page  (lands on the left side after the turn)
 *
 * Backward flip (left→right):
 *   front = fromSpread LEFT page  (lifts off the left side)
 *   back  = toSpread   RIGHT page (lands on the right side after the turn)
 */
function PageFlipOverlay({ direction, fromSpread, toSpread, onLoginClick }) {
  const isForward = direction === 'forward';

  const faceBase = {
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, bottom: 0,
      [isForward ? 'right' : 'left']: 0,
      width: 'calc(50% - 1px)',
      zIndex: 20,
      transformOrigin: isForward ? 'left center' : 'right center',
      transformStyle: 'preserve-3d',
      animation: `${isForward ? 'pageFlipFwd' : 'pageFlipBwd'} ${FLIP_MS}ms cubic-bezier(0.38, 0, 0.24, 1) forwards`,
    }}>

      {/* ── Front face: page being turned away ── */}
      <div style={{ ...faceBase, background: C.paper, borderRadius: isForward ? '0 8px 8px 0' : '8px 0 0 8px' }}>
        <div style={styles.pageTexture} />
        <div style={styles.pageInner}>
          {getSpreadContent(fromSpread, isForward ? 'right' : 'left', onLoginClick)}
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isForward
            ? 'linear-gradient(to left,  rgba(0,0,0,0.20) 0%, transparent 26%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.20) 0%, transparent 26%)' }} />
      </div>

      {/* ── Back face: next page content landing on the opposite side ── */}
      <div style={{
        ...faceBase,
        background: C.paper,
        transform: isForward ? 'rotateY(180deg)' : 'rotateY(-180deg)',
        borderRadius: isForward ? '8px 0 0 8px' : '0 8px 8px 0',
      }}>
        <div style={styles.pageTexture} />
        <div style={styles.pageInner}>
          {getSpreadContent(toSpread, isForward ? 'left' : 'right', onLoginClick)}
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: isForward
            ? 'linear-gradient(to right, rgba(0,0,0,0.09) 0%, transparent 30%)'
            : 'linear-gradient(to left,  rgba(0,0,0,0.09) 0%, transparent 30%)' }} />
      </div>
    </div>
  );
}

// ─── MobilePageFlipOverlay ────────────────────────────────────────────────────
/**
 * Simpler horizontal slide for mobile (no 3-D perspective).
 */
function MobileFlipOverlay({ direction, fromPageIndex, onLoginClick }) {
  const isForward = direction === 'forward';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: C.paper, overflow: 'hidden',
      animation: `${isForward ? 'mobileFlipFwd' : 'mobileFlipBwd'} ${FLIP_MS}ms cubic-bezier(0.4, 0, 0.3, 1) forwards`,
    }}>
      <div style={styles.pageTexture} />
      <div style={{ ...styles.pageInner, minHeight: 'min(74vh,680px)' }}>
        {getMobilePage(fromPageIndex, onLoginClick)}
      </div>
    </div>
  );
}

// ─── OpenBook (two-page spread) ───────────────────────────────────────────────

function OpenBook({
  spread,
  mobilePageIndex,
  isMobile,
  isFlipping,
  flipDirection,
  flipFromSpread,
  mobileFlipFromPage,
  onTurnForward,
  onTurnBackward,
  onClose,
  onLoginClick,
}) {
  const [hoverSide, setHoverSide] = useState(null);

  const canGoForward  = isMobile ? mobilePageIndex < (LAST_SPREAD + 1) * 2 - 1 : spread < LAST_SPREAD;
  const canGoBackward = isMobile ? mobilePageIndex > 0 : spread > 0;
  const isFirstSpread = isMobile ? mobilePageIndex === 0 : spread === 0;

  const leftCursor  = (isFirstSpread || canGoBackward) ? 'w-resize' : 'default';
  const rightCursor = canGoForward ? 'e-resize' : 'default';

  /* ── Mobile layout ── */
  if (isMobile) {
    return (
      <div style={{
        width: 'min(92vw,560px)', minHeight: 'min(84vh,700px)',
        borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${C.paperBorder}`, background: C.paper,
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        position: 'relative',
      }}>
        <div style={styles.pageTexture} />
        <div style={{ ...styles.pageInner, minHeight: 'min(74vh,640px)' }}>
          {getMobilePage(mobilePageIndex, onLoginClick)}
        </div>
        <div style={{ ...styles.pageFooter, justifyContent: 'center' }}>
          <span style={{ fontFamily: fontSerif, fontSize: 11, color: C.textMuted }}>
            {getMobilePageLabel(mobilePageIndex)}
          </span>
        </div>

        {/* Mobile flip overlay */}
        {isFlipping && (
          <MobileFlipOverlay
            direction={flipDirection}
            fromPageIndex={mobileFlipFromPage}
            onLoginClick={onLoginClick}
          />
        )}

        {/* Tap zones */}
        <button type="button" onClick={() => { if (isFlipping) return; if (isFirstSpread) onClose(); else onTurnBackward(); }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', opacity: 0, border: 'none', background: 'transparent', cursor: leftCursor }}
          aria-label="Previous page" />
        <button type="button" onClick={() => { if (isFlipping || !canGoForward) return; onTurnForward(); }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', opacity: 0, border: 'none', background: 'transparent', cursor: rightCursor }}
          aria-label="Next page" />
      </div>
    );
  }

  /* ── Desktop layout ── */

  // During a flip, keep the OLD spread's content on whichever side is NOT being flipped.
  // This prevents the new page from "appearing" before the flip animation reaches that side.
  //   Forward flip (right→left): the left page must stay on the old spread.
  //   Backward flip (left→right): the right page must stay on the old spread.
  const leftDisplaySpread  = (isFlipping && flipDirection === 'forward')  ? flipFromSpread : spread;
  const rightDisplaySpread = (isFlipping && flipDirection === 'backward') ? flipFromSpread : spread;

  return (
    /* SpreadShell supplies perspective:1800 and boxShadow without CSS filter,  */
    /* which is critical — filter would flatten all preserve-3d children.       */
    <SpreadShell style={{ position: 'relative' }} onMouseLeave={() => setHoverSide(null)}>
      {/* Left page */}
      <PageLeft cursor={leftCursor} onClick={() => { if (isFlipping) return; if (isFirstSpread) onClose(); else if (canGoBackward) onTurnBackward(); }}>
        <div onMouseEnter={() => setHoverSide('left')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {getSpreadContent(leftDisplaySpread, 'left', onLoginClick)}
        </div>
      </PageLeft>

      <Spine />

      {/* Right page */}
      <PageRight cursor={rightCursor} onClick={() => { if (isFlipping || !canGoForward) return; onTurnForward(); }}>
        <div onMouseEnter={() => setHoverSide('right')} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {getSpreadContent(rightDisplaySpread, 'right', onLoginClick)}
        </div>
      </PageRight>

      {/* Two-face page flip overlay */}
      {isFlipping && (
        <PageFlipOverlay
          direction={flipDirection}
          fromSpread={flipFromSpread}
          toSpread={spread}
          onLoginClick={onLoginClick}
        />
      )}

      {/* Page counter */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)',
        background: 'rgba(250,248,243,0.92)', border: `1px solid ${C.paperBorder}`,
        borderRadius: 999, padding: '4px 12px',
        fontFamily: fontSerif, fontSize: 11, color: C.textMuted,
        zIndex: 30, pointerEvents: 'none',
      }}>
        {getSpreadLabel(spread)}
      </div>

      {/* Hover affordance chevrons */}
      <div aria-hidden style={{
        position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
        opacity: hoverSide === 'right' && canGoForward && !isFlipping ? 0.55 : 0,
        transition: 'opacity 180ms ease', fontSize: 26, color: 'rgba(58,48,32,0.45)',
        pointerEvents: 'none', zIndex: 11,
      }}>›</div>
      <div aria-hidden style={{
        position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
        opacity: hoverSide === 'left' && (canGoBackward || isFirstSpread) && !isFlipping ? 0.52 : 0,
        transition: 'opacity 180ms ease', fontSize: 24, color: 'rgba(58,48,32,0.45)',
        pointerEvents: 'none', zIndex: 11,
      }}>{isFirstSpread ? '×' : '‹'}</div>
    </SpreadShell>
  );
}

// ─── ContactButton ────────────────────────────────────────────────────────────

function ContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating pill — bottom-right corner */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 22,
          right: 22,
          zIndex: 200,
          fontFamily: fontSerif,
          fontSize: 12,
          letterSpacing: '0.06em',
          color: open ? '#fff' : C.textMid,
          background: open ? C.navy : 'rgba(255,255,255,0.88)',
          border: `1px solid ${open ? C.navy : C.paperBorder}`,
          borderRadius: 999,
          padding: '7px 16px',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
          backdropFilter: 'blur(8px)',
          transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease',
          userSelect: 'none',
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Contact
      </button>

      {/* Popup card */}
      {open && (
        <>
          {/* Backdrop — click anywhere to dismiss */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 198 }}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Contact information"
            style={{
              position: 'fixed',
              bottom: 60,
              right: 22,
              zIndex: 199,
              background: C.paper,
              border: `1px solid ${C.paperBorder}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: '20px 22px',
              minWidth: 260,
              fontFamily: fontSerif,
            }}
          >
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 700,
              color: C.navy,
              marginBottom: 14,
              letterSpacing: '0.04em',
            }}>
              Contact
            </div>

            {[
              { role: 'Developer', email: 'kjuho2021@gmail.com' },
              { role: 'Project Manager', email: 'kisong3007@kecbd.com' },
            ].map(({ role, email }) => (
              <div key={role} style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: C.textMuted,
                  marginBottom: 3,
                }}>
                  {role}
                </div>
                <a
                  href={`mailto:${email}`}
                  style={{
                    fontSize: 13,
                    color: C.navy,
                    textDecoration: 'none',
                    display: 'block',
                    padding: '5px 8px',
                    borderRadius: 5,
                    background: 'rgba(26,39,68,0.04)',
                    transition: 'background 150ms ease',
                    wordBreak: 'break-all',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(201,124,42,0.10)`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = `rgba(26,39,68,0.04)`)}
                >
                  {email}
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

/**
 * Phase state machine:
 *  CLOSED
 *    │  click cover
 *    ▼
 *  OPENING  (AnimatingCover plays bookCoverOpen, spread hidden)
 *    │  after OPEN_MS
 *    ▼
 *  OPEN
 *    │  click right half     │  click left half (spread=0) → CLOSING
 *    ▼                       ▼
 *  FLIPPING_FWD          CLOSING  (AnimatingCover plays bookCoverClose)
 *    │  after FLIP_MS          │  after CLOSE_MS
 *    ▼                         ▼
 *  OPEN                     CLOSED
 *
 * Key principle: ONLY ONE of (cover | spread) is ever rendered at the same time,
 * except during OPENING/CLOSING where the AnimatingCover is shown solo (no spread).
 */
export default function BookHomepage({ onLoginClick }) {
  // 'CLOSED' | 'OPENING' | 'OPEN' | 'FLIPPING_FWD' | 'FLIPPING_BWD' | 'CLOSING'
  const [phase,           setPhase]           = useState('CLOSED');
  const [spread,          setSpread]          = useState(0);
  const [flipFromSpread,  setFlipFromSpread]  = useState(0);
  const [mobilePageIndex, setMobilePageIndex] = useState(0);
  const [mobileFlipFrom,  setMobileFlipFrom]  = useState(0);
  const [isMobile,        setIsMobile]        = useState(false);
  const [isTouchLike,     setIsTouchLike]     = useState(false);

  const handleLogin = onLoginClick ?? (() => { window.location.href = '/login'; });

  useEffect(() => {
    const sync = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.innerWidth < 768);
      setIsTouchLike(window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  /* ── Actions ── */

  const openBook = useCallback(() => {
    if (phase !== 'CLOSED') return;
    setSpread(0);
    setMobilePageIndex(0);
    setPhase('OPENING');
    // AnimatingCover calls onDone which triggers this:
  }, [phase]);

  const handleOpenDone = useCallback(() => {
    setPhase('OPEN');
  }, []);

  const closeBook = useCallback(() => {
    if (phase !== 'OPEN') return;
    setPhase('CLOSING');
  }, [phase]);

  const handleCloseDone = useCallback(() => {
    setPhase('CLOSED');
    setSpread(0);
    setMobilePageIndex(0);
  }, []);

  const goNext = useCallback(() => {
    if (phase !== 'OPEN') return;
    if (isMobile) {
      const max = (LAST_SPREAD + 1) * 2 - 1;
      if (mobilePageIndex >= max) return;
      setMobileFlipFrom(mobilePageIndex);
      setMobilePageIndex((p) => p + 1);
      setPhase('FLIPPING_FWD');
      playPaperRustle();
      window.setTimeout(() => setPhase('OPEN'), FLIP_MS + 30);
    } else {
      if (spread >= LAST_SPREAD) return;
      setFlipFromSpread(spread);
      setSpread((p) => p + 1);
      setPhase('FLIPPING_FWD');
      playPaperRustle();
      window.setTimeout(() => setPhase('OPEN'), FLIP_MS + 30);
    }
  }, [phase, spread, mobilePageIndex, isMobile]);

  const goPrevOrClose = useCallback(() => {
    if (phase !== 'OPEN') return;
    if (isMobile) {
      if (mobilePageIndex === 0) { closeBook(); return; }
      setMobileFlipFrom(mobilePageIndex);
      setMobilePageIndex((p) => p - 1);
      setPhase('FLIPPING_BWD');
      playPaperRustle();
      window.setTimeout(() => setPhase('OPEN'), FLIP_MS + 30);
    } else {
      if (spread === 0) { closeBook(); return; }
      setFlipFromSpread(spread);
      setSpread((p) => p - 1);
      setPhase('FLIPPING_BWD');
      playPaperRustle();
      window.setTimeout(() => setPhase('OPEN'), FLIP_MS + 30);
    }
  }, [phase, spread, mobilePageIndex, isMobile, closeBook]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'OPEN') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrevOrClose(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeBook(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, goNext, goPrevOrClose, closeBook]);

  const isFlipping = phase === 'FLIPPING_FWD' || phase === 'FLIPPING_BWD';
  const flipDir    = phase === 'FLIPPING_FWD' ? 'forward' : phase === 'FLIPPING_BWD' ? 'backward' : null;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap"
      />

      <main style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 0, background: '#f4f1ec',
        position: 'relative',
      }}>
        <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          Uganda Expressway Integrated Manual — interactive book preview
        </h1>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', minHeight: 'min(94vh,820px)' }}>

          {/* CLOSED: static cover */}
          {phase === 'CLOSED' && (
            <BookCover onClick={openBook} tiltEnabled={!isTouchLike} />
          )}

          {/* OPENING ─ desktop: blank pages flip open; mobile: cover rotates */}
          {phase === 'OPENING' && (
            isMobile
              ? <AnimatingCover mode="opening" onDone={handleOpenDone} />
              : <BookOpeningAnimation onDone={handleOpenDone} onLoginClick={handleLogin} />
          )}

          {/* OPEN / FLIPPING: two-page spread */}
          {(phase === 'OPEN' || isFlipping) && (
            <OpenBook
              spread={spread}
              mobilePageIndex={mobilePageIndex}
              isMobile={isMobile}
              isFlipping={isFlipping}
              flipDirection={flipDir}
              flipFromSpread={flipFromSpread}
              mobileFlipFromPage={mobileFlipFrom}
              onTurnForward={goNext}
              onTurnBackward={goPrevOrClose}
              onClose={closeBook}
              onLoginClick={handleLogin}
            />
          )}

          {/* CLOSING ─ desktop: pages fold closed (2→1); mobile: cover rotates back */}
          {phase === 'CLOSING' && (
            isMobile
              ? <AnimatingCover mode="closing" onDone={handleCloseDone} />
              : <BookClosingAnimation spread={spread} onDone={handleCloseDone} onLoginClick={handleLogin} />
          )}

        </div>

        {/* Contact button — fixed bottom-right, always visible */}
        <ContactButton />
      </main>

      <style>{`
        /* ── Opening phase 1: cover slides from center to right half ── */
        @keyframes coverOpenSlide {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0);    }
        }

        /* ── Opening phase 2: cover flips open (right→left, spine pivot) ── */
        @keyframes coverOpenFlip {
          0%   { transform: rotateY(0deg);    }
          100% { transform: rotateY(-180deg); }
        }

        /* ── Closing: element fades out (spread / SpreadShell fade) ── */
        @keyframes spreadFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Closing phase 1: left page flips left → right, cover on back face ── */
        @keyframes leftPageCloseFlip {
          0%   { transform: rotateY(0deg);   }
          100% { transform: rotateY(180deg); }
        }

        /* ── Closing phase 2: portrait cover slides from right into center ── */
        /* Starts simultaneously with the flip; fades in gradually           */
        @keyframes coverCloseSlide {
          0%   { transform: translateX(50%); opacity: 0;   }
          30%  { opacity: 0;                               }
          55%  { opacity: 1; transform: translateX(18%);   }
          100% { transform: translateX(0);   opacity: 1;   }
        }

        /* ── Page flip forward: right page sweeps right→left (full 180 °) ── */
        /*    Both faces use backface-visibility:hidden, so front shows 0–90°  */
        /*    and back shows 90–180°. Visible the entire way across.           */
        @keyframes pageFlipFwd {
          0%   { transform: rotateY(0deg);    }
          100% { transform: rotateY(-180deg); }
        }

        /* ── Page flip backward: left page sweeps left→right (full 180 °) ── */
        @keyframes pageFlipBwd {
          0%   { transform: rotateY(0deg);   }
          100% { transform: rotateY(180deg); }
        }

        /* ── Mobile cover open/close (portrait rotateY) ── */
        @keyframes bookCoverOpen {
          0%   { transform: translateY(0px)  rotateY(0deg);    opacity: 1; }
          8%   { transform: translateY(-6px) rotateY(0deg);    opacity: 1; }
          55%  { transform: translateY(-6px) rotateY(-90deg);  opacity: 1; }
          90%  { transform: translateY(-6px) rotateY(-175deg); opacity: 0.4; }
          100% { transform: translateY(-6px) rotateY(-180deg); opacity: 0; }
        }
        @keyframes bookCoverClose {
          0%   { transform: translateY(-6px) rotateY(-180deg); opacity: 0; }
          10%  { transform: translateY(-6px) rotateY(-175deg); opacity: 0.4; }
          45%  { transform: translateY(-6px) rotateY(-90deg);  opacity: 1; }
          92%  { transform: translateY(-6px) rotateY(0deg);    opacity: 1; }
          100% { transform: translateY(0px)  rotateY(0deg);    opacity: 1; }
        }

        /* ── Mobile flip: horizontal slide-out (2× slower via FLIP_MS) ── */
        @keyframes mobileFlipFwd {
          0%   { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(-12%); opacity: 0; }
        }
        @keyframes mobileFlipBwd {
          0%   { transform: translateX(0);   opacity: 1; }
          100% { transform: translateX(12%); opacity: 0; }
        }
      `}</style>
    </>
  );
}
