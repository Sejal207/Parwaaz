import React, { useState } from 'react'
import { Play, Pause, Volume2, TrendingUp, Music2, Zap, Target } from 'lucide-react'

const API = import.meta.env.VITE_API_URL 

export default function PitchAnalysis({ result, session }) {
  const [userAudioPlaying, setUserAudioPlaying] = useState(false)
  const [refAudioPlaying, setRefAudioPlaying] = useState(false)
  const userAudioRef = React.useRef(null)
  const refAudioRef = React.useRef(null)

  if (!result) return null

  // Get audio URLs
  const userAudioUrl = session?.audio_path 
    ? `${API}/uploads/${session.audio_path.split('/').pop()}` 
    : null
  const refAudioUrl = session?.reference_audio_path
    ? `${API}/uploads/${session.reference_audio_path.split('/').pop()}`
    : null

  const handleUserAudioPlay = () => {
    if (userAudioRef.current) {
      if (userAudioPlaying) {
        userAudioRef.current.pause()
      } else {
        userAudioRef.current.play()
        if (refAudioRef.current) refAudioRef.current.pause()
        setRefAudioPlaying(false)
      }
      setUserAudioPlaying(!userAudioPlaying)
    }
  }

  const handleRefAudioPlay = () => {
    if (refAudioRef.current) {
      if (refAudioPlaying) {
        refAudioRef.current.pause()
      } else {
        refAudioRef.current.play()
        if (userAudioRef.current) userAudioRef.current.pause()
        setUserAudioPlaying(false)
      }
      setRefAudioPlaying(!refAudioPlaying)
    }
  }

  // Extract metrics from result
  const pitchAccuracy = result.pitch_accuracy || 0
  const rhythmDeviation = result.rhythm_deviation_ms || 0
  const tempoRatio = result.tempo_ratio || 1.0
  const stability = result.stability || 0
  const finalScore = result.final_score || 0
  const pitchTendency = result.pitch_tendency || 'Pitch alignment is generally balanced.'
  const timingTendency = result.timing_tendency || 'Timing is generally aligned.'
  const detectedScale = result.detected_scale || 'Unknown'
  const feedbackSummary = result.feedback_summary || 'No feedback available.'
  const meanErrorCents = result.mean_error_cents || 0
  const keyOffset = result.key_offset || 0
  const lyricsError = result.lyrics_error || 0

  // Calculate grade based on final score
  const getGrade = (score) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  // Color for metrics
  const getMetricColor = (value, thresholds) => {
    for (let [threshold, color] of thresholds) {
      if (value >= threshold) return color
    }
    return '#EF4444'
  }

  const pitchColor = getMetricColor(pitchAccuracy, [[80, '#10B981'], [60, '#F59E0B'], [0, '#EF4444']])
  const stabilityScore = Math.max(0, 100 - (stability / 2))
  const stabilityColor = getMetricColor(stabilityScore, [[80, '#10B981'], [60, '#F59E0B'], [0, '#EF4444']])
  const rhythmColor = getMetricColor(100 - Math.min(100, rhythmDeviation / 5), [[70, '#10B981'], [50, '#F59E0B'], [0, '#EF4444']])

  return (
    <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-h2">Singing Analysis</h2>
        <div className="pill-button" style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--accent-teal)' }}>
          Overall Grade: {getGrade(finalScore)}
        </div>
      </div>

      {/* Audio Comparison Section */}
      {(userAudioUrl || refAudioUrl) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Your Performance Audio */}
          {userAudioUrl && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={20} color="var(--accent-teal)" />
                Your Performance
              </h3>
              <audio 
                ref={userAudioRef}
                src={userAudioUrl}
                onPlay={() => setUserAudioPlaying(true)}
                onPause={() => setUserAudioPlaying(false)}
                onEnded={() => setUserAudioPlaying(false)}
                style={{ width: '100%', marginBottom: '12px' }}
                controls
              />
              <button
                onClick={handleUserAudioPlay}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: userAudioPlaying ? 'var(--accent-deep)' : 'var(--accent-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}>
                {userAudioPlaying ? <Pause size={16} /> : <Play size={16} />}
                {userAudioPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          )}

          {/* Reference Audio */}
          {refAudioUrl && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={20} color="var(--accent-teal)" />
                Reference Track
              </h3>
              <audio 
                ref={refAudioRef}
                src={refAudioUrl}
                onPlay={() => setRefAudioPlaying(true)}
                onPause={() => setRefAudioPlaying(false)}
                onEnded={() => setRefAudioPlaying(false)}
                style={{ width: '100%', marginBottom: '12px' }}
                controls
              />
              <button
                onClick={handleRefAudioPlay}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: refAudioPlaying ? 'var(--accent-deep)' : 'var(--accent-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}>
                {refAudioPlaying ? <Pause size={16} /> : <Play size={16} />}
                {refAudioPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overall Score */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(20,184,166,0.1) 0%, rgba(139,92,246,0.1) 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Overall Performance Score</p>
          <div className="font-brand" style={{ fontSize: '64px', color: finalScore >= 70 ? '#10B981' : finalScore >= 50 ? '#F59E0B' : '#EF4444', marginBottom: '8px' }}>
            {finalScore.toFixed(1)}%
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {feedbackSummary || 'Keep practicing to improve your performance.'}
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Pitch Accuracy */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Target size={20} color="var(--accent-teal)" />
            Pitch Accuracy
          </h3>
          <div className="font-brand" style={{ fontSize: '48px', color: pitchColor, marginBottom: '8px' }}>
            {pitchAccuracy.toFixed(1)}%
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
            Mean error: {meanErrorCents.toFixed(1)} cents
          </p>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, pitchAccuracy)}%`, background: pitchColor, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Stability */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--accent-teal)" />
            Voice Stability
          </h3>
          <div className="font-brand" style={{ fontSize: '48px', color: stabilityColor, marginBottom: '8px' }}>
            {stabilityScore.toFixed(1)}%
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
            Deviation: {stability.toFixed(1)} cents
          </p>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, stabilityScore)}%`, background: stabilityColor, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Rhythm Alignment */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--accent-teal)" />
            Rhythm Alignment
          </h3>
          <div className="font-brand" style={{ fontSize: '48px', color: rhythmColor, marginBottom: '8px' }}>
            {(100 - Math.min(100, rhythmDeviation / 5)).toFixed(1)}%
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>
            Deviation: {rhythmDeviation.toFixed(0)} ms
          </p>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, 100 - rhythmDeviation / 5)}%`, background: rhythmColor, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Scale Detection */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Music2 size={20} color="var(--accent-teal)" />
            Detected Scale
          </h3>
          <div className="font-brand" style={{ fontSize: '28px', color: 'var(--accent-teal)', marginBottom: '12px' }}>
            {detectedScale}
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Key offset: {keyOffset} semitones
          </p>
        </div>
      </div>

      {/* Tendency Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #8B5CF6' }}>
          <h3 className="text-h3" style={{ marginBottom: '12px' }}>Pitch Tendency</h3>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {pitchTendency}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #F59E0B' }}>
          <h3 className="text-h3" style={{ marginBottom: '12px' }}>Timing Tendency</h3>
          <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {timingTendency}
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tempo Analysis */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>Tempo Analysis</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Tempo Ratio</p>
              <span className="font-brand" style={{ fontSize: '32px', color: tempoRatio > 1.1 ? '#EF4444' : tempoRatio < 0.9 ? '#EF4444' : '#10B981' }}>
                {tempoRatio.toFixed(2)}x
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Lyric Accuracy</p>
              <span className="font-brand" style={{ fontSize: '32px', color: (1 - lyricsError) * 100 >= 80 ? '#10B981' : '#F59E0B' }}>
                {((1 - lyricsError) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Note Statistics */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '16px' }}>Song Information</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Note Transitions</p>
              <span className="font-brand" style={{ fontSize: '32px', color: 'var(--accent-teal)' }}>
                {result.note_transitions?.length || 0}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Unique Notes</p>
              <span className="font-brand" style={{ fontSize: '32px', color: 'var(--accent-teal)' }}>
                {result.note_durations?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second-by-Second Analysis */}
      {result.second_by_second && (
        <div style={{ marginTop: '32px' }}>
          <h2 className="text-h2" style={{ marginBottom: '24px' }}>Second-by-Second Breakdown</h2>

          {/* Overall Statistics */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Performance Timeline Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Total Duration</p>
                <p className="font-brand" style={{ fontSize: '24px', color: 'var(--accent-teal)' }}>
                  {result.second_by_second.overall_stats?.total_duration_seconds || 0} seconds
                </p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>On-Pitch Seconds</p>
                <p className="font-brand" style={{ fontSize: '24px', color: '#10B981' }}>
                  {result.second_by_second.overall_stats?.seconds_on_pitch || 0} / {result.second_by_second.overall_stats?.total_duration_seconds || 0}
                </p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Overall Accuracy</p>
                <p className="font-brand" style={{ fontSize: '24px', color: result.second_by_second.overall_stats?.overall_accuracy >= 80 ? '#10B981' : result.second_by_second.overall_stats?.overall_accuracy >= 60 ? '#F59E0B' : '#EF4444' }}>
                  {(result.second_by_second.overall_stats?.overall_accuracy || 0).toFixed(1)}%
                </p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Seconds with Issues</p>
                <p className="font-brand" style={{ fontSize: '24px', color: '#F59E0B' }}>
                  {result.second_by_second.overall_stats?.seconds_with_issues || 0}
                </p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Notes Matched</p>
                <p className="font-brand" style={{ fontSize: '24px', color: '#10B981' }}>
                  {result.second_by_second.overall_stats?.notes_matched_seconds || 0} / {result.second_by_second.overall_stats?.total_duration_seconds || 0}
                </p>
              </div>
            </div>

            {/* Issue Distribution */}
            {result.second_by_second.overall_stats?.issue_distribution && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>Issue Distribution</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8B5CF6' }} />
                    <span className="text-body" style={{ fontSize: '13px' }}>Flat: {result.second_by_second.overall_stats.issue_distribution.flat}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#F59E0B' }} />
                    <span className="text-body" style={{ fontSize: '13px' }}>Sharp: {result.second_by_second.overall_stats.issue_distribution.sharp}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#EF4444' }} />
                    <span className="text-body" style={{ fontSize: '13px' }}>Instability: {result.second_by_second.overall_stats.issue_distribution.instability}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Critical Issues */}
            {result.second_by_second.overall_stats?.critical_issues?.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-body" style={{ color: '#EF4444', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>⚠️ Critical Issues Found</p>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {result.second_by_second.overall_stats.critical_issues.slice(0, 5).map((issue, idx) => (
                    <li key={idx}>
                      Second {issue.second}: {issue.type === 'flat' ? '🎵 Flat' : issue.type === 'sharp' ? '📈 Sharp' : '❌ Unstable'} ({issue.value.toFixed(0)} cents deviation)
                    </li>
                  ))}
                  {result.second_by_second.overall_stats.critical_issues.length > 5 && (
                    <li>... and {result.second_by_second.overall_stats.critical_issues.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Per-Second Timeline */}
          <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Detailed Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.second_by_second.per_second?.map((second, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: second.performance === 'excellent' ? 'rgba(16,185,129,0.1)' : 
                                second.performance === 'good' ? 'rgba(34,197,94,0.1)' :
                                second.performance === 'fair' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    borderLeft: `4px solid ${
                      second.performance === 'excellent' ? '#10B981' :
                      second.performance === 'good' ? '#22C55E' :
                      second.performance === 'fair' ? '#F59E0B' : '#EF4444'
                    }`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <p className="font-brand" style={{ fontSize: '14px', marginBottom: '4px' }}>
                        Second {second.second} ({second.start_time.toFixed(1)}s - {second.end_time.toFixed(1)}s)
                      </p>
                      <p className="text-body" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Accuracy: {second.metrics.accuracy_percentage.toFixed(1)}% | Error: {second.metrics.mean_error_cents.toFixed(1)} cents
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: 'rgba(255,255,255,0.1)',
                      color: second.performance === 'excellent' ? '#10B981' :
                             second.performance === 'good' ? '#22C55E' :
                             second.performance === 'fair' ? '#F59E0B' : '#EF4444'
                    }}>
                      {second.performance.toUpperCase()}
                    </span>
                  </div>

                  {second.metrics.pitch_offset !== 0 && (
                    <p className="text-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Pitch offset: {second.metrics.pitch_offset > 0 ? '🔺 Sharp' : '🔻 Flat'} ({Math.abs(second.metrics.pitch_offset).toFixed(0)} cents)
                    </p>
                  )}

                  {second.issues?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {second.issues.map((issue, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: issue.type === 'flat' ? 'rgba(139,92,246,0.3)' :
                                       issue.type === 'sharp' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
                            color: issue.type === 'flat' ? '#A78BFA' :
                                   issue.type === 'sharp' ? '#FBBF24' : '#F87171',
                          }}
                        >
                          {issue.type} ({issue.severity}) - {issue.value.toFixed(0)}¢
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Note Comparison Section */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      {/* Reference Notes */}
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(139,92,246,0.15)',
                        borderRadius: '6px',
                        border: '1px solid rgba(139,92,246,0.3)'
                      }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>
                          📖 Reference:
                        </p>
                        {second.reference_notes?.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {second.reference_notes.map((note, i) => (
                              <span key={i} style={{
                                padding: '2px 8px',
                                background: 'rgba(139,92,246,0.4)',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#D8BFD8'
                              }}>
                                {note}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>—</span>
                        )}
                      </div>

                      {/* User Notes */}
                      <div style={{
                        padding: '8px 12px',
                        background: second.note_match ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        borderRadius: '6px',
                        border: `1px solid ${second.note_match ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>
                          🎤 Your Performance: {second.note_match ? '✅ Match' : '❌ Mismatch'}
                        </p>
                        {second.user_notes?.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {second.user_notes.map((note, i) => (
                              <span key={i} style={{
                                padding: '2px 8px',
                                background: second.note_match ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: second.note_match ? '#A7F3D0' : '#FCA5A5'
                              }}>
                                {note}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Note Analysis */}
      {result.note_durations?.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 className="text-h2" style={{ marginBottom: '24px' }}>Note Analysis</h2>
          
          {/* Note Durations */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Note Durations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {result.note_durations?.map((note, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(16,184,166,0.3)'
                }}>
                  <p className="font-brand" style={{ fontSize: '28px', color: 'var(--accent-teal)', marginBottom: '4px' }}>
                    {note.note}
                  </p>
                  <p className="text-body" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {note.duration.toFixed(2)}s
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Note Timeline */}
          {result.note_timeline?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 className="text-h3" style={{ marginBottom: '16px' }}>Note Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.note_timeline?.map((note, idx) => {
                  const duration = note.end - note.start
                  const barWidth = (duration / (result.second_by_second?.overall_stats?.total_duration_seconds || 10)) * 100
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: '40px', fontSize: '14px', fontWeight: '600', color: 'var(--accent-teal)' }}>
                        {note.note}
                      </div>
                      <div style={{ flex: 1, height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {duration > 0.3 && `${duration.toFixed(2)}s`}
                        </div>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {note.start.toFixed(2)}s - {note.end.toFixed(2)}s
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Note Transitions */}
          {result.note_transitions?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="text-h3" style={{ marginBottom: '16px' }}>Note Transitions ({result.note_transitions.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.note_transitions?.slice(0, 15).map((transition, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(139,92,246,0.2)',
                      color: '#A78BFA',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid rgba(139,92,246,0.4)'
                    }}
                  >
                    {transition}
                  </span>
                ))}
                {result.note_transitions?.length > 15 && (
                  <span style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ... and {result.note_transitions.length - 15} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pitch Contour Visualization */}
      {result.ref_contour && result.user_contour && (
        <div style={{ marginTop: '32px' }}>
          <h2 className="text-h2" style={{ marginBottom: '24px' }}>Pitch Contour Analysis</h2>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Your Pitch vs Reference</h3>
            
            {/* Simple ASCII-like visualization */}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '16px',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              overflowX: 'auto',
              marginBottom: '16px',
              height: '200px',
              position: 'relative'
            }}>
              <svg width="100%" height="180" viewBox={`0 0 ${Math.min(result.ref_contour.length, 500)} 180`} style={{ background: 'rgba(16,184,166,0.1)' }}>
                {/* Reference contour */}
                <polyline
                  points={result.ref_contour.slice(0, 500).map((val, i) => {
                    const x = i
                    const y = 160 - ((val + 200) / 400) * 160
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* User contour */}
                <polyline
                  points={result.user_contour.slice(0, 500).map((val, i) => {
                    const x = i
                    const y = 160 - ((val + 200) / 400) * 160
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  opacity="0.6"
                />
                {/* Grid lines */}
                <line x1="0" y1="40" x2="100%" y2="40" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                <line x1="0" y1="80" x2="100%" y2="80" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
                <line x1="0" y1="120" x2="100%" y2="120" stroke="rgba(255,255,255,0.1)" strokeDasharray="4" />
              </svg>
              
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '16px', height: '2px', background: '#8B5CF6' }} />
                  <span>Reference</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '16px', height: '2px', background: '#F59E0B' }} />
                  <span>Your Performance</span>
                </div>
              </div>
            </div>

            <p className="text-body" style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Purple line shows the reference pitch; Yellow line shows your performance pitch over time
            </p>
          </div>
        </div>
      )}

      {/* Detailed Score Breakdown */}
      <div style={{ marginTop: '32px' }}>
        <h2 className="text-h2" style={{ marginBottom: '24px' }}>Score Breakdown</h2>
        
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Pitch Score Component */}
            <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Pitch Accuracy (40% weight)</p>
              <div className="font-brand" style={{ fontSize: '28px', color: '#10B981', marginBottom: '8px' }}>
                {pitchAccuracy.toFixed(1)}%
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pitchAccuracy}%`, background: '#10B981', transition: 'width 0.3s' }} />
              </div>
              <p className="text-body" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Mean error: {meanErrorCents.toFixed(1)} cents | Key offset: {keyOffset} semitones
              </p>
            </div>

            {/* Rhythm Score Component */}
            <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Rhythm Accuracy (30% weight)</p>
              <div className="font-brand" style={{ fontSize: '28px', color: '#F59E0B', marginBottom: '8px' }}>
                {(100 - Math.min(100, rhythmDeviation / 5)).toFixed(1)}%
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${100 - Math.min(100, rhythmDeviation / 5)}%`, background: '#F59E0B', transition: 'width 0.3s' }} />
              </div>
              <p className="text-body" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Deviation: {rhythmDeviation.toFixed(0)}ms | Tempo: {tempoRatio.toFixed(2)}x
              </p>
            </div>

            {/* Lyrics Score Component */}
            <div style={{ padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '8px' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Lyrics Accuracy (20% weight)</p>
              <div className="font-brand" style={{ fontSize: '28px', color: '#A78BFA', marginBottom: '8px' }}>
                {((1 - lyricsError) * 100).toFixed(1)}%
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(1 - lyricsError) * 100}%`, background: '#A78BFA', transition: 'width 0.3s' }} />
              </div>
              <p className="text-body" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Word Error Rate: {(lyricsError * 100).toFixed(1)}%
              </p>
            </div>

            {/* Stability Score Component */}
            <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Voice Stability (10% weight)</p>
              <div className="font-brand" style={{ fontSize: '28px', color: '#3B82F6', marginBottom: '8px' }}>
                {stabilityScore.toFixed(1)}%
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stabilityScore}%`, background: '#3B82F6', transition: 'width 0.3s' }} />
              </div>
              <p className="text-body" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Std deviation: {stability.toFixed(1)} cents
              </p>
            </div>
          </div>

          {/* Final Score Calculation */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>Final Score Calculation</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Pitch</p>
                <p className="font-brand" style={{ fontSize: '16px', color: '#10B981' }}>+{(0.40 * pitchAccuracy).toFixed(1)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Rhythm</p>
                <p className="font-brand" style={{ fontSize: '16px', color: '#F59E0B' }}>+{(0.30 * (100 - Math.min(100, rhythmDeviation / 5))).toFixed(1)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Lyrics</p>
                <p className="font-brand" style={{ fontSize: '16px', color: '#A78BFA' }}>+{(0.20 * ((1 - lyricsError) * 100)).toFixed(1)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Stability</p>
                <p className="font-brand" style={{ fontSize: '16px', color: '#3B82F6' }}>+{(0.10 * stabilityScore).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Computed Metrics Reference */}
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <h2 className="text-h2" style={{ marginBottom: '24px' }}>Complete Metrics Reference</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-teal)', marginBottom: '12px', textTransform: 'uppercase' }}>Pitch Metrics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Accuracy:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{pitchAccuracy.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Error:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{meanErrorCents.toFixed(2)} cents</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Key Offset:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{keyOffset} semitones</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#F59E0B', marginBottom: '12px', textTransform: 'uppercase' }}>Rhythm Metrics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Deviation:</span>
                <span style={{ fontWeight: '600', color: '#F59E0B' }}>{rhythmDeviation.toFixed(2)} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tempo Ratio:</span>
                <span style={{ fontWeight: '600', color: '#F59E0B' }}>{tempoRatio.toFixed(3)}x</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#A78BFA', marginBottom: '12px', textTransform: 'uppercase' }}>Voice Quality</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stability:</span>
                <span style={{ fontWeight: '600', color: '#A78BFA' }}>{stability.toFixed(2)} cents</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stability Score:</span>
                <span style={{ fontWeight: '600', color: '#A78BFA' }}>{stabilityScore.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#10B981', marginBottom: '12px', textTransform: 'uppercase' }}>Lyrics & Scale</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lyrics Error:</span>
                <span style={{ fontWeight: '600', color: '#10B981' }}>{(lyricsError * 100).toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detected Scale:</span>
                <span style={{ fontWeight: '600', color: '#10B981' }}>{detectedScale}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#06B6D4', marginBottom: '12px', textTransform: 'uppercase' }}>Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Final Score:</span>
                <span style={{ fontWeight: '600', color: '#06B6D4', fontSize: '14px' }}>{finalScore.toFixed(1)}/100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Grade:</span>
                <span style={{ fontWeight: '600', color: '#06B6D4', fontSize: '14px' }}>{getGrade(finalScore)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
