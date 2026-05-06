import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

export default function SpeechAnalysis({ result }) {
  if (!result) return null

  const summary = result.pronunciation_summary
  const wordScores = result.word_scores || []
  const referenceText = wordScores.length
    ? wordScores.map(w => w.reference_word).join(' ')
    : null
  const heardText = result.transcribed_text || null
  const comparisonRows = wordScores.slice(0, 80)
  const hasMoreRows = wordScores.length > comparisonRows.length
  const pauseStats = result.pause_stats || {}
  const pauses = result.pauses || []
  const fillerCounts = result.filler_counts || {}
  const fillerWords = result.filler_words || []

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const radarData = [
    { metric: 'Clarity', value: summary?.accuracy_percent || 0 },
    { metric: 'Rhythm', value: 85 }, // Placeholder data if not present
    { metric: 'Tone', value: 90 },
    { metric: 'Pace', value: 88 },
    { metric: 'Fluency', value: result.wer ? Math.max(0, 100 - result.wer * 100) : 0 },
  ]

  const getColorForLabel = (label) => {
    switch(label) {
      case 'correct': return '#10B981';
      case 'acceptable': return '#F59E0B';
      case 'mispronounced': return '#F97316';
      case 'incorrect': return '#EF4444';
      default: return '#94A3B8';
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-h2">Speech Analysis</h2>
        <div className="pill-button" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Compare Reference
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Radar Chart */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="text-h3" style={{ width: '100%', marginBottom: '16px' }}>Pronunciation Radar</h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="value" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.4} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fluency & Errors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Fluency Metrics</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-brand" style={{ fontSize: '48px', color: 'var(--accent-teal)' }}>
                  {summary?.overall_pronunciation_score || '--'}%
                </div>
                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Overall Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-brand" style={{ fontSize: '48px', color: '#F59E0B' }}>
                  {result.wer ? (result.wer * 100).toFixed(1) : '--'}%
                </div>
                <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Word Error Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript with Confidence Scoring */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Transcript Breakdown</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', lineHeight: '2' }}>
          {wordScores.map((w, i) => (
            <span key={i} style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.6)',
              borderBottom: `3px solid ${getColorForLabel(w.label)}`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            title={`${w.label} - ${Math.round(w.combined_score * 100)}%`}
            >
              {w.reference_word}
            </span>
          ))}
          {!wordScores.length && <span className="text-body">{result.transcribed_text || 'No transcript available.'}</span>}
        </div>
      </div>

      {/* Pauses & Fillers */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Pauses & Filler Words</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Pause Count</div>
            <div className="font-brand" style={{ fontSize: '22px' }}>{pauseStats.pause_count ?? '--'}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Total Pause Time</div>
            <div className="font-brand" style={{ fontSize: '22px' }}>{pauseStats.total_pause_seconds ?? '--'}s</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Avg Pause</div>
            <div className="font-brand" style={{ fontSize: '22px' }}>{pauseStats.avg_pause_seconds ?? '--'}s</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Longest Pause</div>
            <div className="font-brand" style={{ fontSize: '22px' }}>{pauseStats.longest_pause_seconds ?? '--'}s</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Top Pauses</div>
            {pauses.length === 0 && <div className="text-body">No long pauses detected.</div>}
            {pauses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pauses.slice(0, 6).map((p, i) => (
                  <div key={`${p.start}-${i}`} className="glass-card" style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="text-body">{formatTime(p.start)} - {formatTime(p.end)}</div>
                    <div className="text-caption" style={{ color: '#EF4444' }}>{p.duration}s</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Filler Word Counts</div>
            {Object.keys(fillerCounts).length === 0 && <div className="text-body">No fillers detected.</div>}
            {Object.keys(fillerCounts).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(fillerCounts).map(([word, count]) => (
                  <span key={word} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.15)', color: '#4338CA', fontSize: '12px' }}>
                    {word} · {count}
                  </span>
                ))}
              </div>
            )}
            {fillerWords.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {fillerWords.slice(0, 10).map((f, i) => (
                  <span key={`${f.word}-${i}`} style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                    {f.word} @ {formatTime(f.start)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reference vs Heard Comparison */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Reference vs Heard</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Reference Script</div>
            <div className="text-body" style={{ whiteSpace: 'pre-wrap' }}>{referenceText || 'No reference script provided.'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Heard Transcript</div>
            <div className="text-body" style={{ whiteSpace: 'pre-wrap' }}>{heardText || 'No transcript available.'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Missing from Speech</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.missing_words?.length
                ? result.missing_words.map((w, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.15)', color: '#991B1B', fontSize: '12px' }}>{w}</span>
                  ))
                : <span className="text-body">None</span>
              }
            </div>
          </div>
          <div>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Extra in Speech</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.extra_words?.length
                ? result.extra_words.map((w, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', color: '#92400E', fontSize: '12px' }}>{w}</span>
                  ))
                : <span className="text-body">None</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Word-by-word Comparison */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Word-by-word Comparison</h3>
        {!wordScores.length && (
          <div className="text-body">No word-level comparison available.</div>
        )}
        {!!wordScores.length && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  <th className="text-caption" style={{ padding: '8px 6px' }}>Reference</th>
                  <th className="text-caption" style={{ padding: '8px 6px' }}>Heard</th>
                  <th className="text-caption" style={{ padding: '8px 6px' }}>Label</th>
                  <th className="text-caption" style={{ padding: '8px 6px' }}>Similarity</th>
                  <th className="text-caption" style={{ padding: '8px 6px' }}>Whisper Conf.</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((w, i) => (
                  <tr key={`${w.reference_word}-${i}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td className="text-body" style={{ padding: '8px 6px' }}>{w.reference_word}</td>
                    <td className="text-body" style={{ padding: '8px 6px' }}>{w.transcribed_word}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        background: `${getColorForLabel(w.label)}22`,
                        color: getColorForLabel(w.label),
                      }}>
                        {w.label}
                      </span>
                    </td>
                    <td className="text-body" style={{ padding: '8px 6px' }}>{Math.round((w.cosine_similarity || 0) * 100)}%</td>
                    <td className="text-body" style={{ padding: '8px 6px' }}>{Math.round((w.whisper_confidence || 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreRows && (
              <div className="text-caption" style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                Showing first {comparisonRows.length} of {wordScores.length} words.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #F59E0B' }}>
        <h3 className="text-h3" style={{ marginBottom: '8px', color: '#F59E0B' }}>Coach Insight</h3>
        <p className="text-body">{result.feedback_summary}</p>
      </div>

    </div>
  )
}
