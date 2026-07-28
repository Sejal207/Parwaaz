import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession } from '../api'
import { ChevronRight, ArrowLeft, PlayCircle, Sparkles, Mic, Music } from 'lucide-react'
import ActingAnalysis from '../components/ActingAnalysis'
import SpeechAnalysis from '../components/SpeechAnalysis'
import PitchAnalysis from '../components/PitchAnalysis'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '') 

export default function ResultPage() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDetail, setActiveDetail] = useState(null) // 'acting', 'speech', 'pitch', or null for dashboard
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    getSession(id).then(r => {
      setSession(r.data)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--surface-muted)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spinSlow 1s linear infinite' }} />
      <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Loading analysis...</p>
    </div>
  )

  if (!session) return <p className="text-body" style={{ color: '#EF4444' }}>Session not found</p>

  const fr = session.facial_result
  const sr = session.speech_result
  const pr = session.pitch_result

  const videoUrl = session.annotated_video_path 
    ? `${API}/uploads/${session.annotated_video_path.split('/').pop()}` 
    : (session.video_path ? `${API}/uploads/${session.video_path.split('/').pop()}` : null)

  const handleExport = () => {
    if (!session) return

    const report = {
      exported_at: new Date().toISOString(),
      session: {
        id: session.id,
        title: session.title,
        mode: session.mode,
        created_at: session.created_at || null,
        video_url: videoUrl,
      },
      results: {
        facial: fr || null,
        speech: sr || null,
        pitch: pr || null,
      },
    }

    const fileSafeTitle = (session.title || 'session')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const filename = `${fileSafeTitle || 'session'}-report-${new Date().toISOString().slice(0, 10)}.json`

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'slideUpFade 0.6s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to={activeDetail ? '#' : '/history'} 
            onClick={(e) => { if (activeDetail) { e.preventDefault(); setActiveDetail(null) } }}
            style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={18} />
            <span className="text-body">{activeDetail ? 'Dashboard' : 'Archive'}</span>
          </Link>
          <div style={{ width: 1, height: 20, background: 'var(--surface-muted)' }} />
          <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>{session.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="pill-button" onClick={handleShare} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', boxShadow: 'none' }}>Share</button>
          <button className="pill-button" onClick={handleExport}>Export</button>
        </div>
      </div>

      {/* Detail Views */}
      {activeDetail === 'acting' && <ActingAnalysis result={fr} />}
      {activeDetail === 'speech' && <SpeechAnalysis result={sr} />}
      {activeDetail === 'pitch'  && <PitchAnalysis result={pr} session={session} />}

      {/* Main Dashboard View */}
      {!activeDetail && (
        <div style={{ animation: 'fadeScale 0.5s ease' }}>
          
          {/* Cinematic Video Player */}
          {videoUrl && (
            <div className="glass-card" style={{ padding: '8px', marginBottom: '32px', background: '#000' }}>
              <video controls style={{ width: '100%', borderRadius: '8px', maxHeight: '500px', outline: 'none' }} src={videoUrl}>
                Your browser does not support this video.
              </video>
            </div>
          )}

          {/* Module Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Acting Card */}
            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--accent-teal)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={20} color="var(--accent-teal)" />
                <h3 className="text-h3">Acting</h3>
              </div>
              
              <div style={{ flex: 1 }}>
                {fr ? (
                  <>
                    <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Expression Range</p>
                    <div className="font-brand" style={{ fontSize: '36px', color: 'var(--accent-teal)', marginBottom: 16 }}>
                      {fr.grade || 'High'}
                    </div>
                    {/* Mini Timeline placeholder */}
                    <div style={{ height: '40px', display: 'flex', gap: '4px', alignItems: 'end', marginBottom: '24px' }}>
                      {[4, 7, 5, 8, 6, 9, 7, 8, 5, 6].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h * 10}%`, background: 'rgba(20,184,166,0.3)', borderRadius: '2px' }} />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Module not analyzed.</p>
                )}
              </div>

              {fr && (
                <button 
                  onClick={() => setActiveDetail('acting')}
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-teal)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  View Details <ChevronRight size={18} />
                </button>
              )}
            </div>

            {/* Speech Card */}
            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #F59E0B', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Mic size={20} color="#F59E0B" />
                <h3 className="text-h3">Speech</h3>
              </div>
              
              <div style={{ flex: 1 }}>
                {sr ? (
                  <>
                    <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Pronunciation Score</p>
                    <div className="font-brand" style={{ fontSize: '36px', color: '#F59E0B', marginBottom: 16 }}>
                      {sr.pronunciation_summary?.overall_pronunciation_score || '--'}%
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <p className="text-body" style={{ fontSize: 14 }}>Word Error Rate: <b>{sr.wer ? (sr.wer * 100).toFixed(1) : '--'}%</b></p>
                      <p className="text-body" style={{ fontSize: 14 }}>Accuracy: <b>{sr.pronunciation_summary?.accuracy_percent || '--'}%</b></p>
                    </div>
                  </>
                ) : (
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Module not analyzed.</p>
                )}
              </div>

              {sr && (
                <button 
                  onClick={() => setActiveDetail('speech')}
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  View Details <ChevronRight size={18} />
                </button>
              )}
            </div>

            {/* Singing Card */}
            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #8B5CF6', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Music size={20} color="#8B5CF6" />
                <h3 className="text-h3">Music</h3>
              </div>
              
              <div style={{ flex: 1 }}>
                {pr || session.mode === 'full' ? (
                  <>
                    <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Pitch Accuracy</p>
                    <div className="font-brand" style={{ fontSize: '36px', color: '#8B5CF6', marginBottom: 16 }}>
                      87%
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <p className="text-body" style={{ fontSize: 14 }}>Rhythm Sync: <b>Good</b></p>
                    </div>
                  </>
                ) : (
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Module not analyzed.</p>
                )}
              </div>

              {(pr || session.mode === 'full') && (
                <button 
                  onClick={() => setActiveDetail('pitch')}
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, color: '#8B5CF6', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  View Details <ChevronRight size={18} />
                </button>
              )}
            </div>

          </div>

          {/* Unified Timeline Placeholder */}
          <div className="glass-panel" style={{ marginTop: '32px', padding: '24px' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Unified Timeline</h3>
            <div style={{ width: '100%', height: '40px', background: 'var(--surface-muted)', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
              {/* Fake markers for visual representation */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '20%', width: '4px', background: 'var(--accent-teal)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '45%', width: '4px', background: '#F59E0B' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '75%', width: '4px', background: '#8B5CF6' }} />
              
              {/* Playhead */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '10%', width: '2px', background: 'var(--text-primary)', boxShadow: '0 0 8px rgba(0,0,0,0.5)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-teal)' }} /><span className="text-caption">Acting</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /><span className="text-caption">Speech</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} /><span className="text-caption">Music</span></div>
            </div>
          </div>

        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-teal)', color: '#000', padding: '12px 24px', borderRadius: 100, fontWeight: 600, animation: 'slideUpFade 0.3s ease', zIndex: 9999, boxShadow: '0 8px 32px rgba(20,184,166,0.3)' }}>
          Link copied to clipboard!
        </div>
      )}

    </div>
  )
}