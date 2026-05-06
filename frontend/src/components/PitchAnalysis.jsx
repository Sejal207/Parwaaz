import React from 'react'

export default function PitchAnalysis({ result }) {
  if (!result) return null

  // Placeholder for when singing analysis is complete.
  // The user specs include a Pitch Contour Graph and Rhythm Alignment grid.

  return (
    <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-h2">Singing Analysis</h2>
        <div className="pill-button" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Compare Reference
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Large Pitch Contour Placeholder */}
        <div className="glass-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Pitch Contour Visualization Coming Soon</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Pitch Accuracy */}
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Pitch Accuracy</h3>
            <div className="font-brand" style={{ fontSize: '48px', color: '#8B5CF6' }}>
              87%
            </div>
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Overall tuning precision</p>
          </div>

          {/* Rhythm Alignment */}
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 className="text-h3" style={{ marginBottom: '16px' }}>Rhythm Alignment</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <div>
                <span className="font-brand" style={{ fontSize: '32px', color: 'var(--accent-teal)' }}>3</span>
                <p className="text-caption">Early</p>
              </div>
              <div>
                <span className="font-brand" style={{ fontSize: '32px', color: '#10B981' }}>24</span>
                <p className="text-caption">Perfect</p>
              </div>
              <div>
                <span className="font-brand" style={{ fontSize: '32px', color: '#EF4444' }}>2</span>
                <p className="text-caption">Late</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
