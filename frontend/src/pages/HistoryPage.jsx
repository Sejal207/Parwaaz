import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions, deleteSession } from '../api'
import { ArtButton } from './HomePage'

const MODE_LABEL = { full:'Full', speech:'Speech', acting:'Expression', singing:'Pitch' }
const STATUS = {
  completed: { color:'var(--sage)',  label:'Complete' },
  processing: { color:'var(--warn)', label:'Running' },
  failed:     { color:'var(--danger)', label:'Failed' },
  pending:    { color:'var(--muted)', label:'Pending' },
}

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

  return (
    <div style={{ maxWidth: 800, animation: 'fadeUp 0.5s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 52 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:20, height:1, background:'var(--terracotta)' }}/>
            <span style={{ fontFamily:"'DM Mono'", fontSize:9, letterSpacing:'3px', color:'var(--terracotta)', textTransform:'uppercase' }}>
              Analysis Archive
            </span>
          </div>
          <h1 style={{
            fontFamily:"'Playfair Display'", fontStyle:'italic',
            fontSize:'clamp(28px,5vw,52px)', fontWeight:900,
            color:'var(--parchment)', lineHeight:1,
          }}>Sessions</h1>
        </div>
        <Link to="/upload"><ArtButton primary>+ New Analysis</ArtButton></Link>
      </div>

      {/* Divider */}
      <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:32 }}/>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'40px 0' }}>
          <div style={{ width:20, height:20, borderRadius:'50%', border:'1.5px solid var(--terracotta)', borderTopColor:'transparent', animation:'spinSlow 0.8s linear infinite' }}/>
          <span style={{ fontFamily:"'DM Mono'", fontSize:10, color:'var(--muted)', letterSpacing:'2px' }}>Loading archive…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && sessions.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontFamily:"'Playfair Display'", fontStyle:'italic', fontSize:20, color:'var(--muted2)', marginBottom:28 }}>
            No sessions recorded yet.
          </div>
          <Link to="/upload"><ArtButton primary>Start First Analysis</ArtButton></Link>
        </div>
      )}

      {/* Session list */}
      {!loading && sessions.map((s, i) => {
        const st = STATUS[s.status] || STATUS.pending
        const score = s.facial_result?.comparison_score
        const wer   = s.speech_result?.wer

        return (
          <Link to={`/result/${s.id}`} key={s.id}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'18px 22px', marginBottom:6, borderRadius:8,
              background:'var(--charcoal)', border:'1px solid rgba(255,255,255,0.06)',
              transition:'all 0.25s',
              animation:`fadeUp 0.5s ${i*0.05}s ease both`,
              position:'relative', overflow:'hidden',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--soot)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--charcoal)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              {/* Left accent on hover */}
              <div style={{
                position:'absolute', left:0, top:'20%', bottom:'20%',
                width:2, borderRadius:2, background:'var(--terracotta)',
                opacity:0, transition:'opacity 0.25s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity=1}
              />

              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                {/* Mode pill */}
                <span style={{
                  fontFamily:"'DM Mono'", fontSize:8, letterSpacing:'1px',
                  color:'var(--terracotta)',
                  background:'rgba(200,112,106,0.12)',
                  border:'1px solid rgba(200,112,106,0.25)',
                  padding:'4px 12px', borderRadius:100,
                  whiteSpace:'nowrap',
                }}>{MODE_LABEL[s.mode] || s.mode}</span>

                <div>
                  <div style={{ fontWeight:500, fontSize:14, color:'var(--parchment)', marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontFamily:"'DM Mono'", fontSize:9, color:'var(--muted)', letterSpacing:'0.5px' }}>
                    {new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    {score != null && ` · Score ${score.toFixed(0)}/100`}
                    {wer != null && ` · WER ${(wer*100).toFixed(1)}%`}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{
                  fontFamily:"'DM Mono'", fontSize:8, letterSpacing:'1px', color:st.color,
                  padding:'3px 10px', borderRadius:100,
                  background:`${st.color}18`, border:`1px solid ${st.color}30`,
                }}>{st.label}</span>
                <button
                  onClick={e => del(e, s.id)}
                  style={{
                    background:'none', border:'1px solid transparent',
                    color:'var(--muted)', padding:'4px 8px', borderRadius:4,
                    fontSize:13, fontWeight:600, transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(200,112,106,0.35)'; e.currentTarget.style.color='var(--danger)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--muted)' }}
                >×</button>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
