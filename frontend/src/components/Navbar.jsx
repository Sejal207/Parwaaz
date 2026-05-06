import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Mic2, LayoutDashboard, History } from 'lucide-react'

const NAV = [
  { to: '/',        label: 'Home',      icon: Home },
  { to: '/upload',  label: 'Record',    icon: Mic2 },
  { to: '/history', label: 'History',   icon: History },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px rgba(15, 118, 110, 0.05)',
      zIndex: 100,
    }}>
      
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--accent-teal)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
            color: 'white',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: '20px'
          }}>
            P
          </div>
          <span className="font-brand" style={{ fontSize: '24px', color: 'var(--text-primary)' }}>
            Parwaaz
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '32px' }}>
        {NAV.map(n => {
          const active = pathname === n.to
          return (
            <Link key={n.to} to={n.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '999px',
                background: active ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                color: active ? 'var(--accent-deep)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                fontWeight: active ? 600 : 500,
                fontSize: '15px'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
              >
                <n.icon size={18} />
                {n.label}
              </div>
            </Link>
          )
        })}
      </div>
      
    </nav>
  )
}
