import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const MODULES = [
  {
    num: '01', label: 'Expression',
    title: 'Facial Analysis',
    desc: 'Frame-by-frame emotion recognition comparing your performance against a reference video.',
    tech: ['ResNet18', 'EmotionLSTM', 'FER'],
    accent: 'var(--terracotta)',
    accentDim: 'rgba(200,112,106,0.1)',
  },
  {
    num: '02', label: 'Delivery',
    title: 'Speech Scoring',
    desc: 'Whisper AI transcription with word-level pronunciation scoring via cosine similarity.',
    tech: ['Whisper', 'MiniLM-L6', 'WER'],
    accent: 'var(--amber)',
    accentDim: 'rgba(212,149,106,0.1)',
  },
  {
    num: '03', label: 'Pitch',
    title: 'Vocal Accuracy',
    desc: 'pYIN pitch contour extraction compared cent-by-cent to your reference audio.',
    tech: ['librosa', 'pYIN', 'DTW'],
    accent: 'var(--sage)',
    accentDim: 'rgba(122,158,138,0.1)',
  },
]

export default function HomePage() {
  const [visible, setVisible] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const title = 'Parwaaz'

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    let i = 0
    const id = setInterval(() => {
      setCharIndex(++i)
      if (i >= title.length) clearInterval(id)
    }, 90)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ maxWidth: 1040, position: 'relative' }}>

      {/* ── HERO ── */}
      <section style={{ marginBottom: 96, paddingTop: 12, position: 'relative' }}>

        {/* Decorative — large italic watermark */}
        <div style={{
          position: 'absolute', right: -20, top: -40,
          fontFamily: "'Playfair Display'", fontStyle: 'italic',
          fontSize: 'clamp(120px,16vw,220px)', fontWeight: 900,
          color: 'rgba(255,255,255,0.025)', lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none', letterSpacing: '-4px',
          animation: visible ? 'fadeIn 1.2s ease' : 'none',
        }}>Stage</div>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginBottom: 28,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.6s ease both' : 'none',
        }}>
          <div style={{ width: 28, height: 1, background: 'var(--terracotta)' }}/>
          <span style={{
            fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: '3px',
            color: 'var(--terracotta)', textTransform: 'uppercase',
          }}>Performing Arts Intelligence</span>
        </div>

        {/* Main title */}
        <h1 style={{
          fontFamily: "'Playfair Display'", fontStyle: 'italic',
          fontSize: 'clamp(64px,10vw,140px)', fontWeight: 900,
          lineHeight: 0.92, letterSpacing: '-2px',
          color: 'var(--parchment)',
          marginBottom: 28,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.7s 0.1s ease both' : 'none',
        }}>
          {title.slice(0, charIndex)}
          <span style={{
            display: 'inline-block', width: 3, height: '0.8em',
            background: 'var(--terracotta)', marginLeft: 4,
            verticalAlign: 'middle',
            animation: 'inkPulse 0.9s ease infinite',
          }}/>
        </h1>

        <p style={{
          fontFamily: "'DM Sans'", fontWeight: 300,
          fontSize: 'clamp(15px,1.8vw,19px)',
          color: 'var(--text2)', maxWidth: 460,
          lineHeight: 1.85, marginBottom: 44,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.7s 0.22s ease both' : 'none',
        }}>
          Upload your performance. Receive precision analysis across
          expression, speech, and vocal pitch — three concurrent AI models,
          built for the stage.
        </p>

        <div style={{
          display: 'flex', gap: 14,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.7s 0.32s ease both' : 'none',
        }}>
          <Link to="/upload"><ArtButton primary>Begin Analysis</ArtButton></Link>
          <Link to="/history"><ArtButton>View Archive</ArtButton></Link>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48,
        opacity: visible ? 1 : 0,
        animation: visible ? 'fadeIn 0.8s 0.5s ease both' : 'none',
      }}>
        <span style={{
          fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '3px',
          color: 'var(--muted)', textTransform: 'uppercase',
        }}>Analysis Modules</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
        <span style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--muted2)' }}>03</span>
      </div>

      {/* ── Module cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 80,
      }}>
        {MODULES.map((m, i) => (
          <div key={m.num} className="lift" style={{
            background: 'var(--charcoal)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '32px 26px',
            position: 'relative', overflow: 'hidden',
            opacity: visible ? 1 : 0,
            animation: visible ? `fadeUp 0.7s ${0.4 + i * 0.1}s ease both` : 'none',
          }}>
            {/* Corner accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${m.accent}, transparent)`,
              opacity: 0.7,
            }}/>
            {/* Number watermark */}
            <div style={{
              position: 'absolute', right: -4, bottom: -24,
              fontFamily: "'Playfair Display'", fontStyle: 'italic',
              fontSize: 100, fontWeight: 900, lineHeight: 1,
              color: 'rgba(255,255,255,0.025)', userSelect: 'none',
            }}>{m.num}</div>

            <div style={{
              fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '2px',
              color: m.accent, marginBottom: 16, textTransform: 'uppercase',
            }}>{m.label}</div>
            <h3 style={{
              fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700,
              color: 'var(--parchment)', marginBottom: 12, lineHeight: 1.2,
            }}>{m.title}</h3>
            <p style={{
              fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 22,
            }}>{m.desc}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {m.tech.map(t => (
                <span key={t} style={{
                  padding: '3px 10px', borderRadius: 100,
                  background: m.accentDim,
                  border: `1px solid ${m.accent}30`,
                  fontFamily: "'DM Mono'", fontSize: 9,
                  color: m.accent, letterSpacing: '0.5px',
                }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Stats strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        animation: visible ? 'fadeUp 0.7s 0.75s ease both' : 'none',
      }}>
        {[
          { v: '95%',  l: 'Transcription accuracy' },
          { v: '< 60s', l: 'Full analysis time' },
          { v: '3',    l: 'Concurrent AI models' },
          { v: 'WER',  l: 'Precision metric' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '28px 24px',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: 'var(--charcoal)',
          }}>
            <div style={{
              fontFamily: "'Playfair Display'", fontStyle: 'italic',
              fontSize: 32, fontWeight: 700,
              color: 'var(--parchment)', marginBottom: 6,
            }}>{s.v}</div>
            <div style={{
              fontFamily: "'DM Mono'", fontSize: 9,
              color: 'var(--muted)', letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ArtButton({ children, primary, onClick, disabled }) {
  const [ripples, setRipples] = useState([])

  const click = e => {
    if (disabled) return
    const r = { id: Date.now(), x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
    setRipples(rs => [...rs, r])
    setTimeout(() => setRipples(rs => rs.filter(x => x.id !== r.id)), 700)
    onClick?.()
  }

  return (
    <button onClick={click} style={{
      position: 'relative', overflow: 'hidden',
      padding: '13px 28px', borderRadius: 6,
      background: primary ? 'var(--terracotta)' : 'transparent',
      border: `1px solid ${primary ? 'var(--terracotta)' : 'rgba(255,255,255,0.15)'}`,
      color: primary ? '#fff' : 'var(--text2)',
      fontFamily: "'DM Sans'",
      fontWeight: 500, fontSize: 13, letterSpacing: '0.3px',
      transition: 'all 0.25s',
      opacity: disabled ? 0.35 : 1,
      boxShadow: primary ? '0 4px 20px rgba(200,112,106,0.3)' : 'none',
    }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = primary ? 'var(--sienna)' : 'rgba(255,255,255,0.06)'
        e.currentTarget.style.boxShadow = primary ? '0 6px 30px rgba(200,112,106,0.45)' : 'none'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = primary ? 'var(--terracotta)' : 'transparent'
        e.currentTarget.style.boxShadow = primary ? '0 4px 20px rgba(200,112,106,0.3)' : 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{
          position: 'absolute', left: r.x, top: r.y,
          width: 10, height: 10, borderRadius: '50%',
          marginLeft: -5, marginTop: -5,
          background: 'rgba(255,255,255,0.3)',
          animation: 'ripple 0.7s ease-out forwards',
          pointerEvents: 'none',
        }}/>
      ))}
      {children}
    </button>
  )
}

// Keep PrxButton as alias for backward compat
export function PrxButton({ children, primary, onClick, disabled }) {
  return <ArtButton primary={primary} onClick={onClick} disabled={disabled}>{children}</ArtButton>
}
