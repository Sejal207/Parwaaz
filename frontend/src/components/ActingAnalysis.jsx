import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const EMOTION_COLORS = {
  happy: '#14B8A6',
  sad: '#64748B',
  angry: '#EF4444',
  neutral: '#94A3B8',
  fear: '#F59E0B',
  disgust: '#8B5CF6'
}

export default function ActingAnalysis({ result }) {
  if (!result) return null

  // Format data for area chart
  const timelineData = result.predictions?.map(p => ({
    time: p.timestamp,
    [p.emotion]: p.confidence * 100
  })) || []

  const userPercentages = result.emotion_percentages || {}
  const refPercentages = result.ref_percentages || {}
  const hasReference = !!result.ref_dominant
  const refDominant = result.ref_dominant
  const comparisonEmotions = Array.from(
    new Set([...Object.keys(userPercentages), ...Object.keys(refPercentages)])
  )
    .sort()
    .map((emotion) => ({
      emotion,
      user: userPercentages[emotion] || 0,
      ref: refPercentages[emotion] || 0,
      delta: (userPercentages[emotion] || 0) - (refPercentages[emotion] || 0),
    }))

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const comparisonTimeline = hasReference
    ? timelineData.map((p, i) => {
        const refProb = result.predictions?.[i]?.all_probs?.[refDominant] ?? 0
        return {
          time: p.time,
          user: Math.round(p[Object.keys(p).find(k => k !== 'time')] || 0),
          ref: Math.round(refProb * 100),
        }
      })
    : []

  const mismatchMoments = hasReference
    ? (result.predictions || [])
        .map((p) => {
          const refProb = p.all_probs?.[refDominant] ?? 0
          return {
            time: p.timestamp,
            refProb,
            userEmotion: p.emotion,
          }
        })
        .sort((a, b) => a.refProb - b.refProb)
        .slice(0, 6)
    : []

  return (
    <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-h2">Acting Analysis</h2>
        <div className="pill-button" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Compare Reference
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Area Chart */}
        <div>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>Emotional Journey</h3>
          <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '16px' }}>
            <ResponsiveContainer>
              <AreaChart data={timelineData}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                {Object.keys(EMOTION_COLORS).map(emotion => (
                  <Area key={emotion} type="monotone" dataKey={emotion} stackId="1" 
                    stroke={EMOTION_COLORS[emotion]} 
                    fill={EMOTION_COLORS[emotion]} 
                    fillOpacity={0.6} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expression Breakdown */}
        <div>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>Expression Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {result.emotion_percentages && Object.entries(result.emotion_percentages)
              .sort((a, b) => b[1] - a[1])
              .map(([emotion, pct]) => (
              <div key={emotion} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{emotion}</span>
                  <span className="font-brand" style={{ color: EMOTION_COLORS[emotion] || '#000' }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: EMOTION_COLORS[emotion] || '#000' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frame-by-frame Timeline Comparison */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Frame-by-frame Timeline Comparison</h3>
        {!hasReference && (
          <div className="text-body">Add a reference video to enable frame-by-frame comparison.</div>
        )}
        {hasReference && (
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <LineChart data={comparisonTimeline}>
                <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name === 'user' ? 'You (dominant)' : `Reference (${refDominant})`]}
                  labelFormatter={(label) => `Time ${formatTime(label)}`}
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="user" stroke="var(--accent-teal)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ref" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Mismatched Moments */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Top Mismatched Moments</h3>
        {!hasReference && (
          <div className="text-body">Add a reference video to see mismatched moments.</div>
        )}
        {hasReference && mismatchMoments.length === 0 && (
          <div className="text-body">No mismatch data available.</div>
        )}
        {hasReference && mismatchMoments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mismatchMoments.map((m, idx) => (
              <div key={`${m.time}-${idx}`} className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Time</div>
                  <div className="text-body" style={{ fontWeight: 600 }}>{formatTime(m.time)}</div>
                </div>
                <div>
                  <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Reference</div>
                  <div className="text-body" style={{ textTransform: 'capitalize' }}>{refDominant}</div>
                </div>
                <div>
                  <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Seen</div>
                  <div className="text-body" style={{ textTransform: 'capitalize' }}>{m.userEmotion}</div>
                </div>
                <div>
                  <div className="text-caption" style={{ color: 'var(--text-secondary)' }}>Match Confidence</div>
                  <div className="text-body" style={{ color: '#EF4444', fontWeight: 600 }}>{Math.round(m.refProb * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reference vs Seen Comparison */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px' }}>Reference vs Seen</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Reference Dominant Emotion</div>
            <div className="text-h3" style={{ textTransform: 'capitalize' }}>{result.ref_dominant || 'N/A'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Seen in Your Performance</div>
            <div className="text-h3" style={{ textTransform: 'capitalize' }}>{result.dominant_emotion || 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="glass-card" style={{ padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Reference Emotion Mix</div>
            {Object.keys(refPercentages).length === 0 && (
              <div className="text-body">No reference breakdown available.</div>
            )}
            {!!Object.keys(refPercentages).length && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(refPercentages)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, pct]) => (
                    <div key={`ref-${emotion}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
                      <span className="font-brand" style={{ color: EMOTION_COLORS[emotion] || '#000' }}>{pct.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Your Emotion Mix</div>
            {Object.keys(userPercentages).length === 0 && (
              <div className="text-body">No user breakdown available.</div>
            )}
            {!!Object.keys(userPercentages).length && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(userPercentages)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, pct]) => (
                    <div key={`user-${emotion}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'capitalize' }}>{emotion}</span>
                      <span className="font-brand" style={{ color: EMOTION_COLORS[emotion] || '#000' }}>{pct.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <th className="text-caption" style={{ padding: '8px 6px' }}>Emotion</th>
                <th className="text-caption" style={{ padding: '8px 6px' }}>Reference</th>
                <th className="text-caption" style={{ padding: '8px 6px' }}>Seen</th>
                <th className="text-caption" style={{ padding: '8px 6px' }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {comparisonEmotions.map((row) => (
                <tr key={row.emotion} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td className="text-body" style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{row.emotion}</td>
                  <td className="text-body" style={{ padding: '8px 6px' }}>{row.ref.toFixed(1)}%</td>
                  <td className="text-body" style={{ padding: '8px 6px' }}>{row.user.toFixed(1)}%</td>
                  <td className="text-body" style={{ padding: '8px 6px', color: row.delta >= 0 ? '#10B981' : '#EF4444' }}>
                    {row.delta >= 0 ? '+' : ''}{row.delta.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Scores */}
      {!!result.score_components && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>Comparison Scores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {Object.entries(result.score_components).map(([key, value]) => (
              <div key={key} className="glass-card" style={{ padding: '12px' }}>
                <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {key.replace('_', ' ')}
                </div>
                <div className="font-brand" style={{ fontSize: '20px' }}>{Number(value).toFixed(1)}%</div>
              </div>
            ))}
            {!!result.comparison_score && (
              <div className="glass-card" style={{ padding: '12px', border: '1px solid rgba(20,184,166,0.35)' }}>
                <div className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>Final Score</div>
                <div className="font-brand" style={{ fontSize: '22px', color: 'var(--accent-teal)' }}>{Number(result.comparison_score).toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-teal)' }}>
        <h3 className="text-h3" style={{ marginBottom: '8px', color: 'var(--accent-teal)' }}>Coach Insight</h3>
        <p className="text-body">{result.feedback_summary}</p>
      </div>
    </div>
  )
}
