import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession } from '../api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const EC = { happy:'#7a9e8a', sad:'#87CEEB', angry:'#c8706a', neutral:'#b8b0a6', fear:'#d4956a', disgust:'#8a7ab0' }
const API = 'http://localhost:8000'

export default function ResultPage() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(null)

  useEffect(() => {
    getSession(id).then(r => {
      const s = r.data; setSession(s); setLoading(false)
      if (s.mode === 'acting') setTab('facial')
      else if (s.mode === 'speech') setTab('speech')
      else if (s.mode === 'singing') setTab('pitch')
      else setTab(s.facial_result ? 'facial' : s.speech_result ? 'speech' : 'pitch')
    })
  }, [id])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:16, paddingTop:80 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--terracotta)', borderTopColor:'transparent', animation:'spinSlow 0.8s linear infinite' }}/>
      <span style={{ fontFamily:"'DM Mono'", fontSize:14, color:'var(--muted)' }}>Loading…</span>
    </div>
  )
  if (!session) return <p style={{ fontSize:16, color:'var(--danger)' }}>Session not found</p>

  const fr = session.facial_result, sr = session.speech_result, ps = sr?.pronunciation_summary
  const tabs = []
  if (['acting','full'].includes(session.mode)) tabs.push({ k:'facial', l:'Expression' })
  if (['speech','full'].includes(session.mode)) tabs.push({ k:'speech', l:'Speech' })
  if (['singing','full'].includes(session.mode)) tabs.push({ k:'pitch', l:'Pitch' })

  const videoUrl = session.annotated_video_path ? `${API}/uploads/${session.annotated_video_path.split('/').pop()}` : null

  return (
    <div style={{ maxWidth:920, animation:'fadeUp 0.5s ease' }}>
      <Link to="/history"><div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:36, fontSize:13, color:'var(--muted)', transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--terracotta)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Archive</div></Link>

      <div style={{ marginBottom:48 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontFamily:"'DM Mono'", fontSize:11, color:'var(--sage)', background:'rgba(122,158,138,0.15)', border:'1px solid rgba(122,158,138,0.3)', padding:'4px 14px', borderRadius:100 }}>{session.status}</span>
          <span style={{ fontSize:12, color:'var(--muted2)' }}>{new Date(session.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
        </div>
        <h1 style={{ fontFamily:"'Playfair Display'", fontStyle:'italic', fontSize:'clamp(40px,6vw,64px)', fontWeight:900, color:'var(--parchment)', lineHeight:1.05 }}>{session.title}</h1>
      </div>

      {tabs.length > 1 && (
        <div style={{ display:'flex', gap:2, marginBottom:44, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {tabs.map(({k,l}) => (
            <button key={k} onClick={()=>setTab(k)} style={{ padding:'12px 28px', borderRadius:'8px 8px 0 0', background: tab===k?'var(--charcoal)':'transparent', border:`1px solid ${tab===k?'rgba(255,255,255,0.1)':'transparent'}`, borderBottom:tab===k?'1px solid var(--charcoal)':'none', marginBottom:tab===k?-1:0, color:tab===k?'var(--parchment)':'var(--muted)', fontSize:16, fontWeight:tab===k?600:400, transition:'all 0.2s', position:'relative' }}>
              {tab===k && <div style={{ position:'absolute', top:0, left:12, right:12, height:2, borderRadius:2, background:'var(--terracotta)' }}/>}
              {l}
            </button>
          ))}
        </div>
      )}

      {tab==='facial' && fr && <FacialPanel fr={fr} videoUrl={videoUrl} />}
      {tab==='facial' && !fr && <Empty text="Facial module was not run." />}
      {tab==='speech' && sr && <SpeechPanel sr={sr} ps={ps} />}
      {tab==='speech' && !sr && <Empty text="Speech module was not run." />}
      {tab==='pitch' && <Empty text="Pitch module — coming soon." />}
    </div>
  )
}

/* ══════════════════ FACIAL ══════════════════ */
function FacialPanel({ fr, videoUrl }) {
  const score = fr.comparison_score, has = score!=null
  const dom = fr.dominant_emotion, ref = fr.ref_dominant, match = dom&&ref&&dom===ref
  const sc = has?(score>=70?'var(--sage)':score>=50?'var(--warn)':'var(--danger)'):null
  const radarData = fr.emotion_percentages ? Object.entries(fr.emotion_percentages).map(([e,v])=>({emotion:e, you:v, ref:fr.ref_percentages?.[e]||0})) : []

  return (
    <div style={{ animation:'fadeIn 0.4s ease' }}>

      {/* ─── ANNOTATED VIDEO ─── */}
      {videoUrl && (
        <Pnl title="Analysed Video — Emotion Overlay" mb={20}>
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:14, lineHeight:1.6 }}>
            Your <strong style={{color:'var(--parchment)'}}>original performance</strong> with real-time emotion probability bars overlaid on every frame.
          </p>
          <video controls style={{ width:'100%', borderRadius:8, background:'#000', maxHeight:480 }} src={videoUrl}>
            Your browser does not support this video.
          </video>
        </Pnl>
      )}

      {/* ─── COMPARISON HEADER: YOUR EMOTION vs REFERENCE ─── */}
      {has && (
        <>
          <div style={{ fontFamily:"'DM Mono'", fontSize:11, letterSpacing:2, color:'var(--muted)', textTransform:'uppercase', marginBottom:14 }}>
            Emotion Comparison — Your Performance vs Reference Video
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 60px 1fr', gap:14, marginBottom:28, alignItems:'stretch' }}>
            {/* YOUR performance */}
            <TiltCard>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'DM Mono'", fontSize:10, letterSpacing:2, color:'var(--amber)', marginBottom:6 }}>📹 YOUR PERFORMANCE</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>Detected dominant emotion</div>
                <EmoPill emotion={dom} size={20} />
              </div>
            </TiltCard>

            {/* Match indicator */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:match?'rgba(122,158,138,0.18)':'rgba(200,112,106,0.18)', border:`2px solid ${match?'rgba(122,158,138,0.6)':'rgba(200,112,106,0.6)'}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px ${match?'rgba(122,158,138,0.3)':'rgba(200,112,106,0.3)'}` }}>
                {match
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--terracotta)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>}
              </div>
              <div style={{ fontFamily:"'DM Mono'", fontSize:9, fontWeight:600, color:match?'var(--sage)':'var(--terracotta)', letterSpacing:1 }}>{match?'MATCH':'DIFFERS'}</div>
            </div>

            {/* REFERENCE */}
            <TiltCard>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'DM Mono'", fontSize:10, letterSpacing:2, color:'var(--terracotta)', marginBottom:6 }}>🎬 REFERENCE VIDEO</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>Expected dominant emotion</div>
                <EmoPill emotion={ref} size={20} />
              </div>
            </TiltCard>
          </div>
        </>
      )}

      {/* ─── SCORE + GRADE ─── */}
      {has && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
          <TiltCard>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${sc}, transparent)`, borderRadius:'8px 8px 0 0' }}/>
            <div style={{ fontFamily:"'DM Mono'", fontSize:11, letterSpacing:2, color:'var(--muted)', marginBottom:16, textTransform:'uppercase' }}>Expression Match Score</div>
            <div style={{ fontFamily:"'Playfair Display'", fontStyle:'italic', fontSize:84, fontWeight:900, color:sc, lineHeight:1, textShadow:`0 0 60px ${sc}40` }}>{score.toFixed(1)}</div>
            <div style={{ fontFamily:"'DM Mono'", fontSize:12, color:'var(--muted)', marginTop:12 }}>out of 100</div>
          </TiltCard>
          <TiltCard>
            <div style={{ fontFamily:"'DM Mono'", fontSize:11, letterSpacing:2, color:'var(--terracotta)', marginBottom:16, textTransform:'uppercase' }}>Overall Grade</div>
            <div style={{ fontFamily:"'Playfair Display'", fontSize:26, fontWeight:700, color:'var(--parchment)', lineHeight:1.3 }}>{fr.grade}</div>
          </TiltCard>
        </div>
      )}

      {/* No comparison */}
      {!has && (
        <div style={{ padding:32, background:'rgba(200,112,106,0.08)', border:'1px solid rgba(200,112,106,0.2)', borderRadius:10, marginBottom:28 }}>
          <div style={{ fontFamily:"'DM Mono'", fontSize:11, color:'var(--terracotta)', letterSpacing:2, marginBottom:14, textTransform:'uppercase' }}>Dominant Emotion Detected</div>
          <EmoPill emotion={dom} size={24} />
          <p style={{ fontSize:14, color:'var(--muted)', marginTop:16, lineHeight:1.6 }}>No reference video was provided. Upload one to see a full comparison with scoring.</p>
        </div>
      )}

      {/* ─── SCORE BREAKDOWN ─── */}
      {fr.score_components && (
        <Pnl title="Score Breakdown — How You Were Graded" mb={20}>
          {Object.entries(fr.score_components).map(([k,v])=>{
            const c=v>=70?'var(--sage)':v>=40?'var(--warn)':'var(--danger)'
            const L={emotion_match:'Emotion Match (35%)',distribution:'Distribution Similarity (15%)',embedding:'Embedding Similarity (25%)',temporal:'Temporal Consistency (15%)',confidence:'Model Confidence (10%)'}
            return (
              <div key={k} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:14, color:'var(--text2)' }}>{L[k]||k}</span>
                  <span style={{ fontFamily:"'Playfair Display'", fontStyle:'italic', fontSize:20, fontWeight:700, color:c }}>{v.toFixed(1)}</span>
                </div>
                <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(v,100)}%`, background:c, borderRadius:3, boxShadow:`0 0 12px ${c}`, transition:'width 1.2s ease' }}/>
                </div>
              </div>
            )
          })}
        </Pnl>
      )}

      {/* ─── RADAR CHART ─── */}
      {radarData.length>0 && (
        <Pnl title={has?"Emotion Distribution — You vs Reference":"Emotion Distribution"} mb={20}>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="emotion" tick={{ fill:'var(--text2)', fontSize:14, textTransform:'capitalize' }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:'var(--muted)', fontSize:11 }} />
              <Radar name="Your Performance" dataKey="you" stroke="var(--terracotta)" fill="var(--terracotta)" fillOpacity={0.25} strokeWidth={2} />
              {fr.ref_percentages && <Radar name="Reference" dataKey="ref" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="5 5" />}
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:10 }}>
            <LegendDot color="var(--terracotta)" label="Your performance" />
            {fr.ref_percentages && <LegendDot color="var(--amber)" label="Reference video" dashed />}
          </div>
        </Pnl>
      )}

      {/* ─── EMOTION RINGS ─── */}
      {fr.emotion_percentages && (
        <Pnl title="Emotion Percentage Breakdown" mb={20}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {Object.entries(fr.emotion_percentages).sort((a,b)=>b[1]-a[1]).map(([e,pct])=>{
              const c=EC[e]||'#b8b0a6',r=32,circ=2*Math.PI*r,d=(pct/100)*circ
              return (
                <div key={e} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ position:'relative', width:88, height:88 }}>
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                      <circle cx="44" cy="44" r={r} fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${d} ${circ}`} strokeDashoffset={circ*0.25} style={{ filter:`drop-shadow(0 0 8px ${c})` }}/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display'", fontStyle:'italic', fontSize:18, fontWeight:700, color:c }}>{pct.toFixed(0)}%</div>
                  </div>
                  <div style={{ fontSize:14, color:'var(--text2)', textTransform:'capitalize', fontWeight:500 }}>{e}</div>
                </div>
              )
            })}
          </div>
        </Pnl>
      )}

      {/* ─── TIMESTAMPS ─── */}
      {fr.predictions?.length>0 && (
        <Pnl title="Frame-by-Frame Emotion Timeline" mb={20}>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>Each chip represents a sampled frame — showing timestamp, detected emotion, and confidence level.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {fr.predictions.map((p,i)=>{
              const c=EC[p.emotion]||'#b8b0a6'
              return (
                <div key={i} style={{ padding:'7px 14px', borderRadius:8, background:`${c}15`, border:`1px solid ${c}30`, color:c, fontSize:12, fontFamily:"'DM Mono'", transition:'transform 0.15s, box-shadow 0.15s', cursor:'default' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow=`0 0 16px ${c}40`}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none'}}
                  title={`Confidence: ${(p.confidence*100).toFixed(1)}%`}
                >
                  <span style={{opacity:0.6}}>{p.timestamp}s</span> {p.emotion} <span style={{fontWeight:700}}>{(p.confidence*100).toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </Pnl>
      )}

      {/* FEEDBACK */}
      <div style={{ padding:'24px 28px', borderRadius:10, background:'rgba(200,112,106,0.07)', border:'1px solid rgba(200,112,106,0.2)', borderLeft:'4px solid var(--terracotta)' }}>
        <div style={{ fontFamily:"'DM Mono'", fontSize:11, letterSpacing:2, color:'var(--terracotta)', marginBottom:12, textTransform:'uppercase' }}>🎭 Coach Feedback</div>
        <p style={{ fontSize:16, color:'var(--text2)', lineHeight:1.9 }}>{fr.feedback_summary}</p>
      </div>
    </div>
  )
}

/* ══════════════════ SPEECH ══════════════════ */
const LC = { correct:{bg:'rgba(122,158,138,0.12)',bd:'rgba(122,158,138,0.35)',tx:'var(--sage)'}, acceptable:{bg:'rgba(212,149,106,0.1)',bd:'rgba(212,149,106,0.3)',tx:'var(--amber)'}, mispronounced:{bg:'rgba(212,149,106,0.1)',bd:'rgba(212,149,106,0.3)',tx:'var(--warn)'}, incorrect:{bg:'rgba(200,112,106,0.1)',bd:'rgba(200,112,106,0.3)',tx:'var(--danger)'}, missing:{bg:'rgba(72,72,72,0.2)',bd:'rgba(72,72,72,0.4)',tx:'var(--muted)'} }

function SpeechPanel({ sr, ps }) {
  return (
    <div style={{ animation:'fadeIn 0.4s ease' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          {l:'Pronunciation',v:ps?.overall_pronunciation_score!=null?`${ps.overall_pronunciation_score}%`:'—',c:'var(--amber)'},
          {l:'Word Error Rate',v:sr.wer!=null?`${(sr.wer*100).toFixed(1)}%`:'—',c:sr.wer<0.1?'var(--sage)':sr.wer<0.3?'var(--warn)':'var(--danger)'},
          {l:'Accuracy',v:ps?.accuracy_percent!=null?`${ps.accuracy_percent}%`:'—',c:'var(--sage)'},
        ].map(s=>(
          <TiltCard key={s.l}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${s.c}, transparent)`,borderRadius:'8px 8px 0 0'}}/>
            <div style={{fontFamily:"'DM Mono'",fontSize:11,letterSpacing:2,color:'var(--muted)',marginBottom:16,textTransform:'uppercase'}}>{s.l}</div>
            <div style={{fontFamily:"'Playfair Display'",fontStyle:'italic',fontSize:52,fontWeight:900,color:s.c,textShadow:`0 0 30px ${s.c}40`}}>{s.v}</div>
          </TiltCard>
        ))}
      </div>

      {sr.wer!=null && (
        <Pnl title="Error Breakdown" mb={20}>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={[{n:'Substitutions',v:sr.substitutions},{n:'Deletions',v:sr.deletions},{n:'Insertions',v:sr.insertions}]} layout="vertical" margin={{left:0,right:20}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="n" width={120} tick={{fill:'var(--muted)',fontSize:13}}/>
              <Tooltip contentStyle={{background:'var(--soot)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,fontSize:13}}/>
              <Bar dataKey="v" radius={[0,6,6,0]}>{['var(--amber)','var(--danger)','var(--sage)'].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Pnl>
      )}

      {sr.word_scores?.length>0 && (
        <Pnl title="Word-Level Pronunciation" mb={20}>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {sr.word_scores.map((w,i)=>{const lc=LC[w.label]||LC.missing; return (
              <div key={i} title={`${w.combined_score.toFixed(2)} — ${w.label}`} style={{padding:'6px 14px',borderRadius:100,fontSize:15,fontWeight:500,background:lc.bg,border:`1px solid ${lc.bd}`,color:lc.tx,transition:'transform 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
              >{w.reference_word}</div>
            )})}
          </div>
          <div style={{display:'flex',gap:16,marginTop:18,flexWrap:'wrap'}}>
            {Object.entries(LC).map(([l,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:c.tx}}/>
                <span style={{fontSize:11,color:'var(--muted)',textTransform:'capitalize'}}>{l}</span>
              </div>
            ))}
          </div>
        </Pnl>
      )}

      <Pnl title="Transcription" mb={20}>
        <p style={{fontSize:16,lineHeight:2,color:'var(--text2)',fontWeight:300}}>{sr.transcribed_text||'—'}</p>
      </Pnl>

      <div style={{padding:'24px 28px',borderRadius:10,background:'rgba(212,149,106,0.07)',border:'1px solid rgba(212,149,106,0.2)',borderLeft:'4px solid var(--amber)'}}>
        <div style={{fontFamily:"'DM Mono'",fontSize:11,letterSpacing:2,color:'var(--amber)',marginBottom:12,textTransform:'uppercase'}}>🎤 AI Feedback</div>
        <p style={{fontSize:16,color:'var(--text2)',lineHeight:1.9}}>{sr.feedback_summary}</p>
      </div>
    </div>
  )
}

/* ══════════════════ SHARED ══════════════════ */
function Pnl({title,children,mb=0}){
  return <div style={{padding:28,background:'var(--charcoal)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,marginBottom:mb}}>
    <div style={{fontFamily:"'DM Mono'",fontSize:11,letterSpacing:2,color:'var(--muted)',marginBottom:20,textTransform:'uppercase'}}>{title}</div>
    {children}
  </div>
}

function TiltCard({children}){
  const [t,sT]=useState({x:0,y:0})
  return <div onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();sT({x:((e.clientX-r.left)/r.width-0.5)*10,y:((e.clientY-r.top)/r.height-0.5)*-10})}} onMouseLeave={()=>sT({x:0,y:0})}
    style={{padding:'32px 28px',background:'var(--charcoal)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,position:'relative',overflow:'hidden',
      transform:`perspective(600px) rotateY(${t.x}deg) rotateX(${t.y}deg)`,
      transition:'transform 0.12s ease-out, box-shadow 0.3s',
      boxShadow:(t.x||t.y)?'0 24px 60px rgba(0,0,0,0.5), 0 0 20px rgba(200,112,106,0.1)':'none',
    }}>{children}</div>
}

function EmoPill({emotion,size=18}){
  const c=EC[emotion]||'var(--muted)'
  return <div style={{display:'inline-block',padding:'10px 24px',borderRadius:100,background:`${c}18`,border:`1.5px solid ${c}40`,color:c,fontFamily:"'Playfair Display'",fontStyle:'italic',fontSize:size,fontWeight:700,textTransform:'capitalize',boxShadow:`0 0 20px ${c}20`}}>{emotion}</div>
}

function Empty({text}){return <div style={{padding:'80px 0',textAlign:'center'}}><div style={{fontFamily:"'Playfair Display'",fontStyle:'italic',fontSize:22,color:'var(--muted2)'}}>{text}</div></div>}

function LegendDot({color,label,dashed}){
  return <div style={{display:'flex',alignItems:'center',gap:8}}>
    <div style={{width:12,height:3,borderRadius:2,background:dashed?'transparent':color,...(dashed?{border:`1px dashed ${color}`}:{})}}/>
    <span style={{fontSize:12,color:'var(--muted)'}}>{label}</span>
  </div>
}