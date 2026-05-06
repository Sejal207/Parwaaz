import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mic, Music, Play } from 'lucide-react'

export default function HomePage() {
  const [visible, setVisible] = useState(false)
  const [taglineIndex, setTaglineIndex] = useState(0)
  const tagline = "Harr Ehsaas Ki Awaaz"

  useEffect(() => {
    // Entrance animations trigger
    setTimeout(() => setVisible(true), 100)

    // Typewriter effect for tagline
    let i = 0
    const id = setInterval(() => {
      setTaglineIndex(++i)
      if (i >= tagline.length) clearInterval(id)
    }, 60)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 112px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      {/* Background Mesh Gradient */}
      <div style={{
        position: 'absolute', inset: -100, zIndex: -1,
        background: 'var(--hero-gradient)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '30%', width: '50vw', height: '50vw',
          background: 'var(--teal-glow)',
          borderRadius: '50%', filter: 'blur(80px)',
          animation: 'shimmer 15s infinite alternate'
        }} />
      </div>

      {/* ── HERO SECTION ── */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '60px',
        maxWidth: '800px',
        zIndex: 10
      }}>
        
        {/* Abstract Waveform Visualization */}
        <div style={{
          width: '120px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.8)',
          transition: 'all 1s ease-out',
        }}>
          {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
            <div key={i} style={{
              width: '4px',
              height: `${h * 10 + 10}px`,
              background: 'linear-gradient(to top, var(--accent-teal), #6EE7B7)',
              borderRadius: '4px',
              animation: `breathePulse ${1.5 + (i * 0.2)}s infinite alternate ease-in-out`
            }} />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-h1" style={{
          fontSize: 'clamp(48px, 8vw, 72px)',
          color: 'var(--text-primary)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s ease-out'
        }}>
          Parwaaz
        </h1>

        {/* Tagline */}
        <h2 className="text-artistic" style={{
          color: 'var(--accent-deep)',
          opacity: visible ? 1 : 0,
          animation: 'breathePulse 3s infinite',
        }}>
          {tagline.slice(0, taglineIndex)}
          <span style={{ borderRight: '2px solid var(--accent-teal)', animation: 'breathePulse 1s infinite' }} />
        </h2>

        {/* Subtitle */}
        <p className="text-body" style={{
          color: 'var(--text-secondary)',
          fontSize: '18px',
          marginBottom: '20px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease 1.5s'
        }}>
          Where emotion meets precision
        </p>

        {/* Primary CTA */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 1.8s'
        }}>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <button className="pill-button">
              Begin Your Performance
              <Play size={18} fill="currentColor" />
            </button>
          </Link>
        </div>
      </div>

      {/* ── MODULE CARDS ── */}
      <div style={{
        display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10,
        width: '100%', maxWidth: '900px'
      }}>
        {[
          { id: 'acting', title: 'Acting', icon: Sparkles, delay: '2.0s',
            desc: 'Facial & emotion analysis' },
          { id: 'speech', title: 'Speech', icon: Mic, delay: '2.2s',
            desc: 'Pronunciation & fluency' },
          { id: 'singing', title: 'Singing', icon: Music, delay: '2.4s',
            desc: 'Pitch & rhythm tracking' }
        ].map(mod => (
          <div key={mod.id} className="glass-card" style={{
            flex: '1 1 250px',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${mod.delay}`
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(20,184,166,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-teal)'
            }}>
              <mod.icon size={32} style={{ animation: 'breathePulse 2s infinite alternate' }} />
            </div>
            <div>
              <h3 className="text-h3" style={{ marginBottom: '8px' }}>{mod.title}</h3>
              <p className="text-body" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {mod.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
