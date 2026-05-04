import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadSession } from '../api'
import { ArtButton } from './HomePage'

const MODULES = [
  {
    value: 'acting', num: '01', label: 'Expression',
    title: 'Facial Analysis',
    desc: 'Emotion recognition comparing your performance to a reference video — no dialogue matching.',
    tech: ['ResNet18', 'EmotionLSTM'],
    accent: 'var(--terracotta)', accentDim: 'rgba(200,112,106,0.12)', accentBorder: 'rgba(200,112,106,0.3)',
  },
  {
    value: 'speech', num: '02', label: 'Delivery',
    title: 'Speech Scoring',
    desc: 'Whisper AI transcription + cosine similarity pronunciation scoring per word.',
    tech: ['Whisper', 'MiniLM-L6'],
    accent: 'var(--amber)', accentDim: 'rgba(212,149,106,0.12)', accentBorder: 'rgba(212,149,106,0.3)',
  },
  {
    value: 'singing', num: '03', label: 'Pitch',
    title: 'Vocal Accuracy',
    desc: 'pYIN pitch contour extraction vs reference audio, cent-level precision.',
    tech: ['librosa', 'pYIN'],
    accent: 'var(--sage)', accentDim: 'rgba(122,158,138,0.12)', accentBorder: 'rgba(122,158,138,0.3)',
  },
  {
    value: 'full', num: '∞', label: 'Complete',
    title: 'Full Analysis',
    desc: 'All three modules run in parallel — complete multimodal performance analysis.',
    tech: ['All Models'],
    accent: 'var(--iris)', accentDim: 'rgba(138,122,176,0.12)', accentBorder: 'rgba(138,122,176,0.3)',
  },
]

const NEEDS_REF_VIDEO = ['acting', 'full']

export default function UploadPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)
  const [mode, setMode]         = useState(null)
  const [title, setTitle]       = useState('')
  const [refText, setRefText]   = useState('')
  const [video, setVideo]       = useState(null)
  const [refVideo, setRefVideo] = useState(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [dragging, setDragging] = useState(false)
  const [draggingRef, setDraggingRef] = useState(false)
  const fileRef    = useRef()
  const refFileRef = useRef()

  const sel = MODULES.find(m => m.value === mode)
  const showRefVideo = NEEDS_REF_VIDEO.includes(mode)

  const submit = async () => {
    if (!title || !video) { setError('Title and video are required'); return }
    setError(''); setLoading(true)
    const fd = new FormData()
    fd.append('title', title); fd.append('mode', mode)
    fd.append('reference_text', refText); fd.append('video', video)
    if (refVideo) fd.append('reference_video', refVideo)
    try {
      const res = await uploadSession(fd, setProgress)
      navigate(`/result/${res.data.id}`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.')
      setLoading(false)
    }
  }

  const STEPS = ['Choose Module', 'Details', 'Upload']

  return (
    <div style={{ maxWidth: 720, animation: 'fadeUp 0.5s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 20, height: 1, background: 'var(--terracotta)' }}/>
          <span style={{ fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '3px', color: 'var(--terracotta)', textTransform: 'uppercase' }}>
            New Analysis · Step {step + 1} of 3
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display'", fontStyle: 'italic',
          fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900,
          color: 'var(--parchment)', lineHeight: 1,
        }}>{STEPS[step]}</h1>
      </div>

      {/* Step pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 52 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: i < step ? 28 : i === step ? 28 : 20,
              height: 4, borderRadius: 2,
              background: i < step ? 'var(--terracotta)'
                : i === step ? 'var(--terracotta)'
                : 'rgba(255,255,255,0.1)',
              transition: 'all 0.4s',
              opacity: i === step ? 1 : i < step ? 0.6 : 0.3,
            }}/>
          </div>
        ))}
      </div>

      {/* ── STEP 0: Module Selection ── */}
      {step === 0 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
            {MODULES.map((m) => {
              const active = mode === m.value
              return (
                <div key={m.value}
                  onClick={() => setMode(m.value)}
                  style={{
                    padding: '24px 22px', borderRadius: 8, cursor: 'pointer',
                    background: active ? m.accentDim : 'var(--charcoal)',
                    border: `1px solid ${active ? m.accentBorder : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                    boxShadow: active ? `0 0 24px ${m.accentDim}` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--soot)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--charcoal)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}}
                >
                  {/* Top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${m.accent}, transparent)`,
                    opacity: active ? 0.8 : 0.2,
                    transition: 'opacity 0.3s',
                  }}/>
                  {/* Selected check */}
                  {active && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 20, height: 20, borderRadius: '50%',
                      background: m.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    </div>
                  )}
                  {/* Watermark num */}
                  <div style={{
                    position: 'absolute', right: 8, bottom: -12,
                    fontFamily: "'Playfair Display'", fontStyle: 'italic',
                    fontSize: 72, fontWeight: 900, color: 'rgba(255,255,255,0.04)',
                    lineHeight: 1, userSelect: 'none',
                  }}>{m.num}</div>

                  <div style={{ fontFamily: "'DM Mono'", fontSize: 8, color: m.accent, letterSpacing: '2px', marginBottom: 10, textTransform: 'uppercase' }}>
                    {m.label}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display'", fontSize: 16, fontWeight: 700, color: 'var(--parchment)', marginBottom: 8 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 14 }}>{m.desc}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {m.tech.map(t => (
                      <span key={t} style={{
                        padding: '2px 9px', borderRadius: 100,
                        background: m.accentDim, border: `1px solid ${m.accentBorder}`,
                        fontFamily: "'DM Mono'", fontSize: 8, color: m.accent,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <ArtButton primary disabled={!mode} onClick={() => mode && setStep(1)}>
            Continue
          </ArtButton>
        </div>
      )}

      {/* ── STEP 1: Details ── */}
      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 500 }}>
          {/* Selected module badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32,
            padding: '8px 14px', borderRadius: 100,
            background: sel?.accentDim, border: `1px solid ${sel?.accentBorder}`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: sel?.accent }}/>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 9, color: sel?.accent, letterSpacing: '1px' }}>{sel?.title}</span>
            <button onClick={() => setStep(0)} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              fontSize: 11, padding: '0 4px', lineHeight: 1,
            }}>✕</button>
          </div>

          <ArtInput label="Session Title" placeholder="Hamlet monologue — take 3"
            value={title} onChange={e => setTitle(e.target.value)} />

          {showRefVideo ? (
            <div style={{
              padding: '16px 18px', borderRadius: 8, marginBottom: 24,
              background: 'rgba(200,112,106,0.08)', border: '1px solid rgba(200,112,106,0.22)',
              borderLeft: '3px solid var(--terracotta)',
            }}>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--terracotta)', letterSpacing: '2px', marginBottom: 6, textTransform: 'uppercase' }}>Expression Module</div>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                This module compares <em>emotional expression</em> — not words.
                Upload your reference video in the next step to enable comparison scoring.
              </p>
            </div>
          ) : (
            <ArtTextarea label="Reference Script" hint="Paste the exact dialogue or lyrics you intend to perform"
              value={refText} onChange={e => setRefText(e.target.value)} />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <ArtButton onClick={() => setStep(0)}>Back</ArtButton>
            <ArtButton primary disabled={!title} onClick={() => title && setStep(2)}>Continue</ArtButton>
          </div>
        </div>
      )}

      {/* ── STEP 2: Upload ── */}
      {step === 2 && (
        <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560 }}>

          {/* Performance video */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
              {showRefVideo ? 'Performance Video' : 'Your Video'}
            </div>
            <VideoDropZone
              file={video} setFile={setVideo}
              dragging={dragging} setDragging={setDragging}
              fileRef={fileRef} accent="var(--terracotta)"
            />
          </div>

          {/* Reference video (facial/full only) */}
          {showRefVideo && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '2px', color: 'var(--terracotta)', textTransform: 'uppercase' }}>Reference Video</span>
                <span style={{ fontFamily: "'DM Mono'", fontSize: 8, color: 'var(--muted)', letterSpacing: '1px' }}>— optional, enables comparison scoring</span>
              </div>
              <VideoDropZone
                file={refVideo} setFile={setRefVideo}
                dragging={draggingRef} setDragging={setDraggingRef}
                fileRef={refFileRef}
                accent="var(--amber)"
                accentDim="rgba(212,149,106,0.12)"
                label="Drop Reference Video"
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 6, marginTop: 16,
              background: 'rgba(200,112,106,0.08)', border: '1px solid rgba(200,112,106,0.25)',
              fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--terracotta)',
            }}>{error}</div>
          )}

          {loading ? (
            <AnalysisLoader progress={progress} isFacial={showRefVideo} />
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <ArtButton onClick={() => setStep(1)}>Back</ArtButton>
              <ArtButton primary disabled={!video} onClick={submit}>Launch Analysis</ArtButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VideoDropZone({ file, setFile, dragging, setDragging, fileRef, accent, accentDim, label = 'Drop Video Here' }) {
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) setFile(f) }}
      onClick={() => !file && fileRef.current.click()}
      style={{
        borderRadius: 8, padding: '44px 32px', textAlign: 'center',
        border: `1.5px dashed ${dragging ? accent : file ? 'rgba(122,158,138,0.5)' : 'rgba(255,255,255,0.1)'}`,
        background: dragging ? (accentDim || 'rgba(200,112,106,0.07)') : file ? 'rgba(122,158,138,0.06)' : 'rgba(255,255,255,0.01)',
        cursor: file ? 'default' : 'pointer',
        transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
      }}
    >
      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={e => setFile(e.target.files[0])} />

      {file ? (
        <div>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: 'rgba(122,158,138,0.15)', border: '1px solid rgba(122,158,138,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 13, color: 'var(--sage)', fontWeight: 500, marginBottom: 4 }}>{file.name}</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--muted)', marginBottom: 16 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </div>
          <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{
            background: 'rgba(200,112,106,0.1)', border: '1px solid rgba(200,112,106,0.3)',
            color: 'var(--terracotta)', padding: '5px 14px', borderRadius: 4,
            fontFamily: "'DM Mono'", fontSize: 9, letterSpacing: '1px',
          }}>Remove</button>
        </div>
      ) : (
        <div>
          <div style={{
            width: 52, height: 52, borderRadius: 8, margin: '0 auto 18px',
            background: accentDim || 'rgba(200,112,106,0.1)',
            border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'floatSoft 3s ease-in-out infinite',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--muted)', letterSpacing: '1px' }}>
            MP4 · MOV · WEBM — max 100 MB
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisLoader({ progress, isFacial }) {
  const isUploading = progress < 100
  const accent = isFacial ? 'var(--terracotta)' : 'var(--amber)'

  return (
    <div style={{
      marginTop: 24, padding: '32px 28px', borderRadius: 8,
      background: 'var(--charcoal)', border: '1px solid rgba(255,255,255,0.07)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }}/>

      {/* Orbital animation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <svg width="72" height="72" viewBox="0 0 72 72"
            style={{ position: 'absolute', top: 0, left: 0, animation: 'spinSlow 4s linear infinite' }}>
            <circle cx="36" cy="36" r="30" fill="none"
              stroke={accent} strokeWidth="1"
              strokeDasharray="6 8" opacity="0.5"/>
          </svg>
          <svg width="72" height="72" viewBox="0 0 72 72"
            style={{ position: 'absolute', top: 0, left: 0, animation: 'spinSlow 2s linear infinite reverse' }}>
            <circle cx="36" cy="36" r="18" fill="none"
              stroke="var(--gold)" strokeWidth="1"
              strokeDasharray="3 10" opacity="0.4"/>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 16px ${accent}`,
              animation: 'inkPulse 1.4s ease infinite',
            }}/>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Playfair Display'", fontStyle: 'italic',
          fontSize: 16, fontWeight: 700, color: 'var(--parchment)', marginBottom: 6,
        }}>
          {isUploading ? 'Transmitting…' : isFacial ? 'Analysing Emotional Signature…' : 'AI Models Running…'}
        </div>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--muted)', letterSpacing: '1px' }}>
          {isUploading ? `${progress}% uploaded` : '30 – 90 seconds · please wait'}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: '100%', transition: 'width 0.4s',
          width: isUploading ? `${progress}%` : '100%',
          background: `linear-gradient(90deg, var(--charcoal), ${accent})`,
          boxShadow: `0 0 8px ${accent}`,
          animation: !isUploading ? 'scanline 2s ease-in-out infinite' : 'none',
        }}/>
      </div>

      {/* Emotion tags */}
      {!isUploading && isFacial && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {['happy', 'sad', 'angry', 'neutral', 'fear', 'disgust'].map((e, i) => (
            <span key={e} style={{
              fontFamily: "'DM Mono'", fontSize: 8, padding: '3px 10px', borderRadius: 100,
              background: 'rgba(200,112,106,0.1)', border: '1px solid rgba(200,112,106,0.25)',
              color: 'var(--text2)', letterSpacing: '0.5px',
              animation: `inkPulse 2s ${i * 0.3}s ease infinite`,
            }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtInput({ label, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block', fontFamily: "'DM Mono'", fontSize: 9,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: focused ? 'var(--terracotta)' : 'var(--muted)',
        marginBottom: 10, transition: 'color 0.2s',
      }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 6,
          background: 'var(--charcoal)', fontSize: 14,
          border: `1px solid ${focused ? 'rgba(200,112,106,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(200,112,106,0.08)' : 'none',
        }}
      />
    </div>
  )
}

function ArtTextarea({ label, hint, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block', fontFamily: "'DM Mono'", fontSize: 9,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: focused ? 'var(--terracotta)' : 'var(--muted)',
        marginBottom: 6, transition: 'color 0.2s',
      }}>{label}</label>
      {hint && <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>{hint}</p>}
      <textarea value={value} onChange={onChange} rows={5}
        placeholder="To be or not to be, that is the question…"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 6,
          background: 'var(--charcoal)', fontSize: 13, lineHeight: 1.8,
          border: `1px solid ${focused ? 'rgba(200,112,106,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: 'var(--text)', outline: 'none', resize: 'vertical',
          transition: 'border-color 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(200,112,106,0.08)' : 'none',
        }}
      />
    </div>
  )
}
