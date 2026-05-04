import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/',        label: 'Home',    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
  { to: '/upload',  label: 'Analyse', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { to: '/history', label: 'Archive', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [hovered, setHovered] = useState(null)

  return (
    <aside style={{
      width: 'var(--nav-w)', minHeight: '100vh', flexShrink: 0,
      background: 'var(--charcoal)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 0',
      position: 'sticky', top: 0, height: '100vh',
      zIndex: 100,
    }}>

      {/* Logo */}
      <Link to="/" style={{ marginBottom: 48 }}>
        <div style={{
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Abstract stage curtain mark */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="4" fill="rgba(200,112,106,0.12)" />
            <path d="M10 8 Q10 20 10 32" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M30 8 Q30 20 30 32" stroke="var(--terracotta)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 8 Q20 14 30 8" stroke="var(--amber)" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="20" cy="22" r="3.5" fill="var(--terracotta)" opacity="0.8"/>
          </svg>
        </div>
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 10px' }}>
        {NAV.map((n, i) => {
          const active = pathname === n.to
          const hot = hovered === n.to || active
          return (
            <Link key={n.to} to={n.to}
              onMouseEnter={() => setHovered(n.to)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '14px 8px', borderRadius: 6,
                background: active ? 'rgba(200,112,106,0.14)' : hot ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: `1px solid ${active ? 'rgba(200,112,106,0.35)' : 'transparent'}`,
                transition: 'all 0.25s',
                animation: `slideInLeft 0.4s ${i * 0.07}s ease both`,
              }}>

                {/* Active left bar */}
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '25%', bottom: '25%',
                    width: 2, borderRadius: 2,
                    background: 'var(--terracotta)',
                    boxShadow: '0 0 8px var(--terracotta)',
                  }}/>
                )}

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={active ? 'var(--terracotta)' : hot ? 'var(--text2)' : 'var(--muted)'}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.2s' }}>
                  <path d={n.icon}/>
                </svg>

                <span style={{
                  fontFamily: "'DM Sans'", fontSize: 8,
                  fontWeight: 500, letterSpacing: '0.5px',
                  color: active ? 'var(--terracotta)' : hot ? 'var(--text2)' : 'var(--muted)',
                  transition: 'color 0.2s',
                }}>{n.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom — version mark */}
      <div style={{ padding: '0 8px', width: '100%' }}>
        <div style={{
          padding: '10px 8px', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 7, color: 'var(--muted2)', letterSpacing: '1px' }}>v 1.0</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 7, color: 'var(--muted2)', marginTop: 2 }}>PARWAAZ</div>
        </div>
      </div>
    </aside>
  )
}
