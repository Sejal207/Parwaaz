import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions, deleteSession } from '../api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { PlayCircle, Trophy, Target, Star, Mic, Sparkles, TrendingUp, Lock, Music } from 'lucide-react'

const MODE_LABEL = { full:'Full', speech:'Speech', acting:'Acting', singing:'Singing' }

export default function HistoryPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = async () => {
    const r = await listSessions()
    setSessions(r.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const del = async (e, id) => {
    e.preventDefault()
    if (!confirm('Delete this session?')) return
    await deleteSession(id)
    load()
  }

  const getSessionScores = (session) => {
    const actingScore = session.facial_result?.comparison_score ?? null
    const speechScore = session.speech_result?.pronunciation_summary?.overall_pronunciation_score ?? null
    const singingScore = session.pitch_result?.in_range_percent ?? null

    return {
      acting: actingScore,
      speech: speechScore,
      singing: singingScore,
    }
  }

  const buildProgressData = () => {
    if (!sessions.length) return []

    const byDate = {}
    sessions.forEach((s) => {
      const date = new Date(s.created_at)
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const scores = getSessionScores(s)

      if (!byDate[key]) {
        byDate[key] = { date: key, acting: [], speech: [], singing: [] }
      }
      if (scores.acting !== null) byDate[key].acting.push(scores.acting)
      if (scores.speech !== null) byDate[key].speech.push(scores.speech)
      if (scores.singing !== null) byDate[key].singing.push(scores.singing)
    })

    return Object.values(byDate)
      .map((row) => ({
        date: row.date,
        acting: row.acting.length ? Math.round(row.acting.reduce((a, b) => a + b, 0) / row.acting.length) : null,
        speech: row.speech.length ? Math.round(row.speech.reduce((a, b) => a + b, 0) / row.speech.length) : null,
        singing: row.singing.length ? Math.round(row.singing.reduce((a, b) => a + b, 0) / row.singing.length) : null,
      }))
  }

  const progressData = buildProgressData()

  const moduleSeries = sessions
    .map((s) => ({
      created_at: s.created_at,
      ...getSessionScores(s),
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const moduleCards = [
    { key: 'acting', label: 'Acting', color: 'var(--accent-teal)' },
    { key: 'speech', label: 'Speech', color: '#F59E0B' },
    { key: 'singing', label: 'Singing', color: '#8B5CF6' },
  ].map((m) => {
    const values = moduleSeries.map((row) => row[m.key]).filter((v) => v !== null && v !== undefined)
    const current = values.length ? values[values.length - 1] : null
    const previous = values.length > 1 ? values[values.length - 2] : null
    const delta = current !== null && previous !== null ? current - previous : null

    return {
      ...m,
      values,
      current,
      delta,
    }
  })

  // Mock Radar Data
  const radarData = [
    { skill: 'Acting', current: 92, initial: 65 },
    { skill: 'Speech', current: 90, initial: 70 },
    { skill: 'Singing', current: 87, initial: 60 },
    { skill: 'Rhythm', current: 85, initial: 55 },
  ]

  const ACHIEVEMENTS = [
    { id: 'first', title: 'First Performance', icon: PlayCircle, unlocked: true, color: 'var(--accent-teal)' },
    { id: 'streak', title: '7-Day Streak', icon: Target, unlocked: true, color: '#F59E0B' },
    { id: 'pitch', title: 'Pitch Perfect', icon: Music, unlocked: true, color: '#8B5CF6' },
    { id: 'emotion', title: 'Emotion Master', icon: Sparkles, unlocked: true, color: '#EF4444' },
    { id: 'fluent', title: 'Fluent Speaker', icon: Mic, unlocked: true, color: '#10B981' },
    { id: 'stage', title: 'Stage Ready', icon: Trophy, unlocked: false, color: '#94A3B8' },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeUp 0.6s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Your Journey</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Track your progress over time.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="pill-button" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', boxShadow: 'none' }}>Filter</button>
          <button className="pill-button" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', boxShadow: 'none' }}>Goals</button>
        </div>
      </div>

      {/* Overall Progress Chart */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 className="text-h3" style={{ marginBottom: '24px' }}>Overall Progress (Last 30 Days)</h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <LineChart data={progressData.length ? progressData : []}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="acting" stroke="var(--accent-teal)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-teal)' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="speech" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="singing" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--accent-teal)' }} /><span className="text-caption">Acting</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: '#F59E0B' }} /><span className="text-caption">Speech</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: '#8B5CF6' }} /><span className="text-caption">Singing</span></div>
        </div>
      </div>

      {/* Module-wise Progress */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 className="text-h3" style={{ marginBottom: '24px' }}>Module-wise Progress</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {moduleCards.map((card) => (
            <div key={card.key} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span className="text-h3" style={{ fontSize: 18 }}>{card.label}</span>
                <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>Last score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="font-brand" style={{ fontSize: 28, color: card.color }}>
                  {card.current !== null ? `${Math.round(card.current)}%` : '--'}
                </span>
                {card.delta !== null && (
                  <span className="text-caption" style={{ color: card.delta >= 0 ? '#10B981' : '#EF4444' }}>
                    {card.delta >= 0 ? '+' : ''}{card.delta.toFixed(1)}%
                  </span>
                )}
              </div>
              <div style={{ width: '100%', height: 60 }}>
                <ResponsiveContainer>
                  <LineChart data={card.values.map((v, i) => ({ idx: i, value: v }))}>
                    <XAxis dataKey="idx" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Line type="monotone" dataKey="value" stroke={card.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Performances (Horizontal Scroll) */}
      <div style={{ marginBottom: '32px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Recent Performances</h3>
        
        {loading ? (
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Loading archive...</p>
        ) : sessions.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No performances recorded yet.</p>
            <Link to="/upload" style={{ textDecoration: 'none' }}><button className="pill-button">Start First Analysis</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
            {sessions.map((s, i) => (
              <Link to={`/result/${s.id}`} key={s.id} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ 
                  minWidth: '240px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
                  borderTop: i === 0 ? '3px solid var(--accent-teal)' : '1px solid rgba(255,255,255,0.3)'
                }}>
                  {/* Thumbnail Placeholder */}
                  <div style={{ width: '100%', height: '120px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={32} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="text-caption" style={{ color: 'var(--accent-teal)' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {i === 0 && <span className="text-caption" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 100 }}>New</span>}
                    </div>
                    <p className="text-body" style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title}
                    </p>
                  </div>
                  
                  {/* Sparkline placeholder */}
                  <div style={{ height: '24px', display: 'flex', alignItems: 'flex-end', gap: '2px', opacity: 0.7 }}>
                    {[...Array(10)].map((_, idx) => (
                      <div key={idx} style={{ flex: 1, background: 'var(--accent-teal)', borderRadius: '1px', height: `${Math.random() * 80 + 20}%` }} />
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Skill Radar */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="text-h3" style={{ width: '100%', marginBottom: '16px' }}>Skill Breakdown</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-secondary)', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Current" dataKey="current" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.4} strokeWidth={2} />
                <Radar name="Initial" dataKey="initial" stroke="var(--text-secondary)" fill="var(--text-secondary)" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--accent-teal)' }} /><span className="text-caption">Current</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--text-secondary)', border: '1px dashed rgba(0,0,0,0.2)' }} /><span className="text-caption">Initial</span></div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '24px' }}>Achievements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {ACHIEVEMENTS.map(ach => (
              <div key={ach.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', opacity: ach.unlocked ? 1 : 0.4 }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '50%', 
                  background: ach.unlocked ? `${ach.color}20` : 'rgba(0,0,0,0.05)',
                  border: `2px solid ${ach.unlocked ? ach.color : 'rgba(0,0,0,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: ach.unlocked ? ach.color : 'rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  {ach.unlocked ? <ach.icon size={24} /> : <Lock size={24} />}
                </div>
                <span className="text-caption" style={{ lineHeight: 1.2 }}>{ach.title}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Personalized Insight */}
      <div className="glass-panel" style={{ padding: '32px', borderLeft: '4px solid var(--accent-teal)' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Personalized Insight</h3>
        <p className="text-artistic" style={{ color: 'var(--accent-deep)', lineHeight: 1.6 }}>
          "Your emotional expression has improved 23% since your first performance. Focus on breath control to unlock further growth in singing."
        </p>
      </div>

    </div>
  )
}
