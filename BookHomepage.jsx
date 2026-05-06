/**
 * BookHomepage.jsx
 *
 * Interactive book cover component for the Uganda Expressway Integrated Manual homepage.
 *
 * HOW TO USE:
 * 1. Drop this file into your components folder (e.g. src/components/BookHomepage.jsx)
 * 2. Import and render it on your homepage:
 *      import BookHomepage from '@/components/BookHomepage';
 *      export default function HomePage() { return <BookHomepage />; }
 *
 * 3. Install the Google Font in your layout or _document.tsx / app/layout.tsx:
 *      <link
 *        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap"
 *        rel="stylesheet"
 *      />
 *
 * 4. The component is self-contained with inline styles — no Tailwind or CSS modules required.
 *    However, if you already use Tailwind you can freely replace the inline style objects
 *    with utility classes wherever you prefer.
 *
 * CUSTOMISATION:
 *  - SECTIONS array: edit chapter titles, descriptions, and bullet points.
 *  - TOC_ENTRIES: edit page numbers to match your actual PDF.
 *  - PARTNERS: edit the logo pill labels to match your partners.
 *  - onLoginClick prop: pass a callback to wire up to your real login flow.
 *  - The cover road illustration is pure CSS — swap it for a real <img> if you want
 *    a photograph (just replace the CoverPhoto component).
 *
 * DEPENDENCIES: React 17+ (uses hooks). No other runtime dependencies.
 */

'use client'; // remove this line if you are NOT using Next.js App Router

import { useState, useRef, useCallback } from 'react';

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

const PARTNERS = ['EX', 'DOHWA', 'CHEIL', 'KOICA'];

// ─── Styles (objects) ─────────────────────────────────────────────────────────
// Keeping colours as constants so they're easy to theme centrally.

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

const fontSerif  = "'Source Serif 4', Georgia, serif";
const fontDisplay = "'Playfair Display', 'Times New Roman', serif";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pure-CSS expressway road illustration used on the book cover */
function CoverIllustration() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* sky */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '42%',
        background: 'linear-gradient(180deg,#0d2050 0%,#1e3a70 100%)',
      }} />
      {/* hills */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
        background: 'linear-gradient(0deg,#2a4a1a 0%,#3a6020 40%,#1a3010 100%)',
        clipPath: 'polygon(0% 100%,100% 100%,100% 20%,60% 0%,40% 0%,0% 20%)',
      }} />
      {/* centre road stripe */}
      <div style={{
        position: 'absolute',
        top: '46%', left: '50%', transform: 'translateX(-50%)',
        width: 18, bottom: 0,
        backgroundImage: 'repeating-linear-gradient(0deg,#c8a83a 0px,#c8a83a 18px,transparent 18px,transparent 34px)',
      }} />
    </div>
  );
}

/** The closed book cover rendered with 3-D tilt on hover */
function BookCover({ onClick }) {
  const bookRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = bookRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const dx = (e.clientX - left - width  / 2) / (width  / 2);
    const dy = (e.clientY - top  - height / 2) / (height / 2);
    el.style.transform = `rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (bookRef.current) bookRef.current.style.transform = '';
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 3-D perspective wrapper */}
      <div
        style={{ perspective: 1800, width: 340, height: 460, cursor: 'pointer' }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        title="Click to open the manual"
        role="button"
        aria-label="Open the Expressway Integrated Manual"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <div
          ref={bookRef}
          style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.05s',
            borderRadius: '2px 10px 10px 2px',
            boxShadow: `-6px 6px 20px rgba(0,0,0,0.38), 4px 0 8px rgba(0,0,0,0.14)`,
            overflow: 'hidden',
          }}
        >
          {/* Orange spine */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 36,
            background: C.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '2px 0 0 2px',
          }}>
            <span style={{
              fontFamily: fontDisplay, fontSize: 9.5, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#fff',
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
              whiteSpace: 'nowrap',
            }}>
              Uganda Expressway
            </span>
          </div>

          {/* Main cover face */}
          <div style={{
            marginLeft: 36, position: 'absolute', top: 0, right: 0, bottom: 0, left: 36,
            background: C.navy,
          }}>
            <CoverIllustration />

            {/* Coat of arms seal */}
            <div style={{
              position: 'absolute', top: 14, left: 14,
              width: 48, height: 48, borderRadius: '50%',
              border: `1.5px solid rgba(201,124,42,0.6)`,
              background: 'rgba(10,20,50,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🇺🇬</div>

            {/* Bottom text block */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '20px 18px 22px',
              background: 'linear-gradient(0deg,rgba(10,18,40,0.98) 0%,rgba(10,18,40,0.85) 70%,transparent 100%)',
            }}>
              <div style={{ fontFamily: fontSerif, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Ministry of Works &amp; Transport
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: 10 }}>
                Expressway<br />Integrated Manual
              </div>
              <div style={{ width: 36, height: 1.5, background: C.gold, marginBottom: 10 }} />
              <div style={{ fontFamily: fontSerif, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', marginBottom: 14, lineHeight: 1.5 }}>
                Project for Establishment of Integrated Manuals and Main<br />
                Facility Management System of Expressways in Uganda · November 2025
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {PARTNERS.map((p) => (
                  <span key={p} style={{
                    fontFamily: fontDisplay, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.5)',
                    border: '0.5px solid rgba(255,255,255,0.2)',
                    borderRadius: 2, padding: '2px 7px',
                  }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* "Open" CTA below the book */}
      <button
        onClick={onClick}
        style={{
          marginTop: 24,
          fontFamily: fontSerif, fontSize: 13, letterSpacing: '0.05em',
          color: '#888', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
      >
        Open the manual <span>→</span>
      </button>
    </div>
  );
}

// ─── Page content builders ────────────────────────────────────────────────────

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
        This manual covers the complete lifecycle of Uganda's expressway infrastructure — from initial planning through design,
        construction, operation, and long-term maintenance.<br /><br />
        Flip through the pages to explore each section. Log in to access the full content.
      </div>
      <div style={{
        padding: 14, background: 'rgba(201,124,42,0.07)',
        borderLeft: `2px solid ${C.gold}`, borderRadius: '0 4px 4px 0',
      }}>
        <div style={{ fontFamily: fontSerif, fontSize: 12, color: '#7a5a20', lineHeight: 1.6 }}>
          Click <strong>Next</strong> to begin browsing the chapters →
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
          <li key={b} style={{
            fontFamily: fontSerif, fontSize: 12.5, color: '#5a4a30',
            padding: '6px 0', borderBottom: `0.5px dotted ${C.paperDot}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: C.gold, flexShrink: 0 }}>—</span>
            {b}
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
      <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
        Ready to dive deeper?
      </div>
      <div style={{ fontFamily: fontSerif, fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 20 }}>
        You've seen the full structure of the Uganda Expressway Integrated Manual.
        Log in to access the complete reference documentation, detailed specifications, and all annexes.
      </div>
      <button
        onClick={onLoginClick}
        style={{
          background: C.navy, color: '#fff',
          fontFamily: fontSerif, fontSize: 13, letterSpacing: '0.08em',
          border: 'none', borderRadius: 4, padding: '10px 24px', cursor: 'pointer',
        }}
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
          <div key={s} style={{
            fontFamily: fontSerif, fontSize: 12, color: C.textMid,
            padding: '5px 0', borderBottom: `0.5px dotted ${C.paperDot}`,
          }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared style objects ─────────────────────────────────────────────────────

const styles = {
  pageHeader: {
    fontFamily: fontSerif,
    fontSize: 9,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: C.textMuted,
    paddingBottom: 10,
    borderBottom: `0.5px solid ${C.paperBorder}`,
    marginBottom: 24,
  },
  tocEntry: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: `0.5px solid #e8e0d0`,
    gap: 12,
  },
  page: {
    flex: 1,
    background: C.paper,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  pageTexture: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(180,160,120,0.07) 24px,rgba(180,160,120,0.07) 25px)',
    borderRadius: 'inherit',
  },
  pageInner: {
    padding: '32px 28px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  pageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 28px',
    borderTop: `0.5px solid ${C.paperBorder}`,
    position: 'relative',
    zIndex: 1,
  },
};

// ─── Open book (two-page spread) ─────────────────────────────────────────────

const TOTAL_SPREADS = SECTIONS.length; // 0 = toc, 1-5 = sections, 6 = login

function FlipButton({ onClick, disabled, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: fontSerif, fontSize: 12,
        color: disabled ? C.textMuted : hovered ? '#fff' : C.navy,
        background: disabled ? 'none' : hovered ? C.navy : 'none',
        border: `0.5px solid ${disabled ? C.paperDot : hovered ? C.navy : C.paperBorder}`,
        borderRadius: 3, padding: '5px 14px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      {children}
    </button>
  );
}

function OpenBook({ spread, onPrev, onNext, onClose, onLoginClick, flipping }) {
  const isLogin = spread > TOTAL_SPREADS;
  const isToc   = spread === 0;
  const section  = !isToc && !isLogin ? SECTIONS[spread - 1] : null;

  const pageAnim = flipping
    ? { animation: 'pageFlip 0.35s ease-in-out' }
    : {};

  const pageNumLabel = isToc
    ? 'i – ii'
    : isLogin
    ? '—'
    : `${spread * 2 - 1} – ${spread * 2}`;

  return (
    <>
      <style>{`
        @keyframes pageFlip {
          0%   { opacity:1; transform:scaleX(1);    }
          50%  { opacity:0.3; transform:scaleX(0.85); }
          100% { opacity:1; transform:scaleX(1);    }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* Two-page spread */}
        <div
          style={{
            display: 'flex', gap: 0,
            width: '100%', maxWidth: 720, minHeight: 480,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            borderRadius: '8px 8px 8px 8px',
            ...pageAnim,
          }}
        >
          {/* Left page */}
          <div style={{ ...styles.page, borderRadius: '8px 0 0 8px', borderRight: `1px solid ${C.paperBorder}`, boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.04)' }}>
            <div style={styles.pageTexture} />
            <div style={styles.pageInner}>
              {isToc   && <TocLeftContent />}
              {section && <SectionLeftContent section={section} />}
              {isLogin && <LoginLeftContent onLoginClick={onLoginClick} />}
            </div>
            <div style={styles.pageFooter}>
              <FlipButton onClick={onPrev} disabled={spread === 0}>← Previous</FlipButton>
              <span style={{ fontFamily: fontSerif, fontSize: 11, color: C.textMuted }}>{pageNumLabel}</span>
              <span />
            </div>
          </div>

          {/* Spine */}
          <div style={{
            width: 14, flexShrink: 0,
            background: `linear-gradient(90deg,#c8b89a,${C.spineLight},#c8b89a)`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            zIndex: 2,
          }} />

          {/* Right page */}
          <div style={{ ...styles.page, borderRadius: '0 8px 8px 0', boxShadow: '4px 0 16px rgba(0,0,0,0.08)' }}>
            <div style={styles.pageTexture} />
            <div style={styles.pageInner}>
              {isToc   && <WelcomeRightContent />}
              {section && <SectionRightContent section={section} />}
              {isLogin && <LoginRightContent />}
            </div>
            <div style={styles.pageFooter}>
              <span />
              <span />
              <FlipButton onClick={onNext} disabled={isLogin}>
                {spread === TOTAL_SPREADS ? 'Final page →' : 'Next →'}
              </FlipButton>
            </div>
          </div>
        </div>

        {/* Close book */}
        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            fontFamily: fontSerif, fontSize: 12, color: '#999',
            background: 'none', border: 'none', cursor: 'pointer',
            letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#555')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        >
          ← Close the book
        </button>
      </div>
    </>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {Function} [props.onLoginClick]  - Called when "Log in" button is pressed.
 *                                           Defaults to window.location redirect to '/login'.
 */
export default function BookHomepage({ onLoginClick }) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [spread,   setSpread]   = useState(0);
  const [flipping, setFlipping] = useState(false);

  const handleLogin = onLoginClick ?? (() => { window.location.href = '/login'; });

  const flip = useCallback((next) => {
    setFlipping(true);
    setTimeout(() => {
      setSpread(next);
      setFlipping(false);
    }, 180);
  }, []);

  const openBook  = () => { setSpread(0); setIsOpen(true);  };
  const closeBook = () => { setIsOpen(false); };
  const nextPage  = () => { if (spread <= TOTAL_SPREADS) flip(spread + 1); };
  const prevPage  = () => { if (spread > 0)              flip(spread - 1); };

  return (
    <>
      {/* Load fonts — place this in your _document.tsx / layout.tsx instead if preferred */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap"
      />

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem 3rem',
          background: '#f4f1ec',
        }}
      >
        {/* Screen-reader intro */}
        <h1 style={{
          position: 'absolute', width: 1, height: 1,
          padding: 0, margin: -1, overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        }}>
          Uganda Expressway Integrated Manual — interactive book preview
        </h1>

        {!isOpen && (
          <>
            <p style={{
              fontFamily: fontSerif, fontSize: 13,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#999', marginBottom: 32,
            }}>
              Uganda Expressway Integrated Manual
            </p>
            <BookCover onClick={openBook} />
          </>
        )}

        {isOpen && (
          <OpenBook
            spread={spread}
            onPrev={prevPage}
            onNext={nextPage}
            onClose={closeBook}
            onLoginClick={handleLogin}
            flipping={flipping}
          />
        )}
      </main>
    </>
  );
}
