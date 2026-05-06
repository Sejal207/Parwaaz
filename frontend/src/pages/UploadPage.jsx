import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadSession } from '../api'
import { Camera, Upload, Info, CheckCircle2, Loader2, Sparkles, Mic, Music, Square, Play, AlignLeft, Video } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const [performanceType, setPerformanceType] = useState('full') // 'acting', 'speech', 'singing', 'full'
  const [title, setTitle] = useState('')
  const [referenceText, setReferenceText] = useState('')
  
  // File state
  const [video, setVideo] = useState(null)
  const [referenceVideo, setReferenceVideo] = useState(null)
  
  const [draggingVideo, setDraggingVideo] = useState(false)
  const [draggingRefVideo, setDraggingRefVideo] = useState(false)
  
  const videoRef = useRef()
  const refVideoRef = useRef()

  // Upload/Processing state
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleUploadClick = () => {
    if (!title) {
      setError('Please enter a performance title')
      return
    }
    if (performanceType === 'singing') {
      setError('Singing analysis is coming soon. Please choose Acting, Speech, or All Three.')
      return
    }
    if (!video) {
      setError('Please select or record a video')
      return
    }
    if ((performanceType === 'speech' || performanceType === 'full') && !referenceText.trim()) {
      setError('Please provide the reference text for speech analysis')
      return
    }
    if ((performanceType === 'acting' || performanceType === 'full') && !referenceVideo) {
      setError('Please provide a reference video for acting analysis')
      return
    }
    
    setError('')
    setIsUploading(true)

    const fd = new FormData()
    fd.append('title', title)
    fd.append('mode', performanceType)
    
    if (performanceType === 'speech' || performanceType === 'full') {
      fd.append('reference_text', referenceText)
    } else {
      fd.append('reference_text', '') // Backend might expect the field
    }

    fd.append('video', video)
    
    if (performanceType === 'acting' || performanceType === 'full') {
      if (referenceVideo) fd.append('reference_video', referenceVideo)
    }

    uploadSession(fd, setProgress)
      .then(res => {
        setTimeout(() => {
          navigate(`/result/${res.data.id}`)
        }, 1500)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Upload failed. Please try again.')
        setIsUploading(false)
      })
  }

  const isRecordDisabled = true // completely removing record feature
  const needsRefText = performanceType === 'speech' || performanceType === 'full'
  const needsRefVideo = performanceType === 'acting' || performanceType === 'full'

  // --- Processing Screen ---
  if (isUploading) {
    return <ProcessingScreen progress={progress} />
  }

  // --- Selection Screen ---
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'slideUpFade 0.6s ease', paddingBottom: 60 }}>
      
      <div style={{ marginBottom: 48 }}>
        <h1 className="text-h1" style={{ marginBottom: 8 }}>
          Upload your performance
        </h1>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Please select your video to receive detailed feedback.
        </p>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 48 }} />

      {/* Performance Settings */}
      <div style={{ marginBottom: 32 }}>
        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Performance Settings
        </p>

        {/* Title Input */}
        <div style={{ marginBottom: 24 }}>
          <input 
            type="text" 
            placeholder="Performance Title (e.g., Hamlet Monologue)" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="glass-panel"
            style={{
              width: '100%', padding: '16px 20px', fontSize: 16,
              fontFamily: 'Inter', color: 'var(--text-primary)', outline: 'none'
            }}
          />
        </div>

        {/* Performance Type Pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { id: 'acting', label: 'Acting' },
            { id: 'speech', label: 'Speech' },
            { id: 'singing', label: 'Singing', upcoming: true },
            { id: 'full', label: 'All Three' }
          ].map(type => (
            <div key={type.id}
              onClick={() => !type.upcoming && setPerformanceType(type.id)}
              style={{
                padding: '10px 24px', borderRadius: '999px', cursor: 'pointer',
                background: performanceType === type.id ? 'var(--accent-teal)' : 'rgba(255,255,255,0.5)',
                color: performanceType === type.id ? 'white' : 'var(--text-secondary)',
                fontWeight: 500, fontSize: 14,
                boxShadow: performanceType === type.id ? '0 4px 12px rgba(20,184,166,0.3)' : 'none',
                transition: 'all 0.2s ease',
                opacity: type.upcoming ? 0.6 : 1,
                cursor: type.upcoming ? 'not-allowed' : 'pointer'
              }}>
              {performanceType === type.id && <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />}
              {type.label}
              {type.upcoming && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#F59E0B' }}>Upcoming soon</span>
              )}
            </div>
          ))}
        </div>

        {/* --- Reference Fields Based on Selection --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
          
          {needsRefText && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlignLeft size={20} color="var(--accent-teal)" />
                <h3 className="text-h3" style={{ fontSize: 16 }}>Reference Text</h3>
              </div>
              <p className="text-body" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Required for Speech Analysis. The AI will compare your pronunciation against this text.
              </p>
              <textarea 
                placeholder="Paste the monologue or dialogue here..."
                value={referenceText}
                onChange={e => setReferenceText(e.target.value)}
                style={{
                  width: '100%', minHeight: 120, padding: 16, borderRadius: 8,
                  background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.3)',
                  fontFamily: 'Inter', fontSize: 14, color: 'var(--text-primary)', outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {needsRefVideo && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Video size={20} color="var(--accent-teal)" />
                <h3 className="text-h3" style={{ fontSize: 16 }}>Reference Video</h3>
              </div>
              <p className="text-body" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Required for Acting Analysis. The AI will compare your expressions against this video.
              </p>
              
              <div 
                onDragOver={e => { e.preventDefault(); setDraggingRefVideo(true) }}
                onDragLeave={() => setDraggingRefVideo(false)}
                onDrop={e => { 
                  e.preventDefault(); setDraggingRefVideo(false); 
                  const f = e.dataTransfer.files[0]; 
                  if (f?.type.startsWith('video/')) setReferenceVideo(f) 
                }}
                onClick={() => !referenceVideo && refVideoRef.current?.click()}
                style={{
                  padding: 32, textAlign: 'center', cursor: referenceVideo ? 'default' : 'pointer',
                  border: draggingRefVideo ? '2px dashed var(--accent-teal)' : '1px dashed rgba(100,116,139,0.3)',
                  borderRadius: 12, background: 'rgba(255,255,255,0.2)', transition: 'all 0.2s'
                }}>
                <input ref={refVideoRef} type="file" accept="video/*" style={{ display: 'none' }}
                  onChange={e => setReferenceVideo(e.target.files[0])} />
                
                {referenceVideo ? (
                  <div>
                    <CheckCircle2 size={24} color="var(--accent-teal)" style={{ marginBottom: 8 }} />
                    <p className="text-body" style={{ fontWeight: 600, marginBottom: 4 }}>{referenceVideo.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setReferenceVideo(null) }}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent-deep)',
                        textDecoration: 'underline', cursor: 'pointer', fontSize: 12
                      }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} color="var(--text-secondary)" style={{ marginBottom: 8 }} />
                    <p className="text-body" style={{ fontSize: 14 }}>Click or drag reference video here</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 32 }} />

        {/* YOUR PERFORMANCE VIDEO Upload Zone */}
        <div 
          onDragOver={e => { e.preventDefault(); setDraggingVideo(true) }}
          onDragLeave={() => setDraggingVideo(false)}
          onDrop={e => { 
            e.preventDefault(); setDraggingVideo(false); 
            const f = e.dataTransfer.files[0]; 
            if (f?.type.startsWith('video/')) setVideo(f) 
          }}
          onClick={() => !video && videoRef.current?.click()}
          className="glass-panel"
          style={{
            padding: 40, textAlign: 'center', cursor: video ? 'default' : 'pointer',
            border: draggingVideo ? '2px dashed var(--accent-teal)' : '2px dashed var(--accent-teal)',
            background: draggingVideo ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.3)',
            marginBottom: 24, transition: 'all 0.2s'
          }}>
          <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
            onChange={e => setVideo(e.target.files[0])} />
          
          {video ? (
            <div>
              <CheckCircle2 size={32} color="var(--accent-teal)" style={{ marginBottom: 12 }} />
              <p className="text-h3" style={{ marginBottom: 4 }}>{video.name}</p>
              <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>
                {(video.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <button onClick={(e) => { e.stopPropagation(); setVideo(null) }}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-deep)',
                  textDecoration: 'underline', cursor: 'pointer', fontSize: 14
                }}>
                Remove and select another
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} color="var(--accent-teal)" style={{ marginBottom: 12 }} />
              <p className="text-h2" style={{ marginBottom: 4 }}>Upload Your Performance</p>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Drop your final video here</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="glass-panel" style={{
          padding: '16px 20px', borderLeft: '4px solid var(--accent-teal)',
          display: 'flex', gap: 16, alignItems: 'center', marginBottom: 32
        }}>
          <Info size={24} color="var(--accent-teal)" />
          <p className="text-body" style={{ fontSize: 14, margin: 0 }}>
            <b>Tip:</b> Choose a quiet, well-lit space. The AI analyzes both your expressions and voice together.
          </p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button className="pill-button" 
          disabled={!video}
          style={{ 
            width: '100%', padding: '16px 0', fontSize: 18,
            opacity: video ? 1 : 0.5, cursor: video ? 'pointer' : 'not-allowed'
          }} 
          onClick={handleUploadClick}>
          Analyze Performance
        </button>
      </div>

    </div>
  )
}

// --- Live Recorder Component ---
function LiveRecorder({ onRecordingComplete }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [recordingFinished, setRecordingFinished] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [recordingReady, setRecordingReady] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setErrorMsg('')
    } catch (err) {
      console.error("Error accessing media devices.", err)
      setErrorMsg('Camera or Microphone access denied. Please allow permissions in your browser.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleStartRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return
    setRecordedChunks([])
    setRecordingFinished(false)
    setRecordingReady(false)
    const stream = videoRef.current.srcObject
    const preferredTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    const chosenType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t))
    const options = chosenType ? { mimeType: chosenType } : undefined
    
    try {
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data])
        }
      }

      mediaRecorder.onstop = () => {
        setRecordingFinished(true)
      }

      mediaRecorder.start(500)
      setIsRecording(true)
    } catch (e) {
      setErrorMsg('Failed to start recording: ' + e.message)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopCamera() // Stop stream so we can replay the video
    }
  }

  // Create file when chunks are finalized
  useEffect(() => {
    if (recordingFinished && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      if (!blob.size) {
        setErrorMsg('Recording was empty. Please try again.')
        setRecordingReady(false)
        return
      }
      const file = new File([blob], 'live-recording.webm', { type: 'video/webm' })
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(blob)
        videoRef.current.controls = true
      }
      onRecordingComplete(file)
      setRecordingReady(true)
    }
  }, [recordingFinished, recordedChunks])

  const handleRetake = () => {
    setRecordedChunks([])
    setRecordingFinished(false)
    onRecordingComplete(null)
    if (videoRef.current) {
      videoRef.current.src = ""
      videoRef.current.controls = false
    }
    startCamera()
  }

  return (
    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {errorMsg ? (
        <div style={{ color: '#EF4444', padding: 20, textAlign: 'center' }}>
          <p className="text-body">{errorMsg}</p>
        </div>
      ) : (
        <>
          <div style={{ 
            width: '100%', maxWidth: 600, background: '#000', borderRadius: 12, 
            overflow: 'hidden', position: 'relative', aspectRatio: '16/9', marginBottom: 24 
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted={!recordingFinished} 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isRecording && (
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', animation: 'breathePulse 1.5s infinite' }} />
                <span className="text-caption" style={{ color: 'white', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>REC</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {!recordingFinished ? (
              isRecording ? (
                <button className="pill-button" onClick={handleStopRecording} style={{ background: '#EF4444', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
                  <Square size={16} fill="currentColor" /> Stop Recording
                </button>
              ) : (
                <button className="pill-button" onClick={handleStartRecording} style={{ background: '#EF4444', color: 'white', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
                  <Camera size={16} /> Start Recording
                </button>
              )
            ) : (
              <button className="pill-button" onClick={handleRetake} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)' }}>
                Retake
              </button>
            )}
          </div>
          {recordingFinished && (
            <div style={{ marginTop: 12, color: recordingReady ? '#10B981' : '#EF4444', fontSize: 12 }}>
              {recordingReady ? 'Recording ready to upload.' : 'Recording not ready yet.'}
            </div>
          )}
        </>
      )}

    </div>
  )
}

// --- Processing Screen Component ---
function ProcessingScreen({ progress }) {
  const INSIGHTS = [
    "Detecting micro-expressions...",
    "Mapping vocal pitch contours...",
    "Analyzing rhythmic patterns...",
    "Correlating emotion with delivery..."
  ]
  const [insightIndex, setInsightIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setInsightIndex(i => (i + 1) % INSIGHTS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', textAlign: 'center',
      animation: 'fadeScale 0.8s ease',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40,
      paddingTop: 40
    }}>
      
      {/* Video Thumbnail / Progress Ring */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(20,184,166,0.2)" strokeWidth="8" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--accent-teal)" strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span className="font-brand" style={{ fontSize: 48, color: 'var(--accent-deep)', lineHeight: 1 }}>
            {progress}%
          </span>
        </div>
      </div>

      <h2 className="text-h2" style={{ color: 'var(--text-primary)' }}>
        Analyzing your performance...
      </h2>

      {/* Module Status Cards */}
      <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
        {[
          { icon: Sparkles, label: 'Acting' },
          { icon: Mic, label: 'Speech' },
          { icon: Music, label: 'Singing' }
        ].map((m, i) => (
          <div key={m.label} className="glass-card" style={{
            flex: '1', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12,
            animation: `slideUpFade 0.6s ease ${i * 0.2}s both`
          }}>
            <m.icon size={24} color="var(--accent-teal)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p className="text-h3" style={{ fontSize: 16 }}>{m.label}</p>
              <div style={{ width: '100%', height: 4, background: 'rgba(20,184,166,0.2)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'var(--accent-teal)',
                  width: progress > (i * 30) ? '100%' : '0%',
                  transition: 'width 2s ease'
                }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Animated Insight Text */}
      <div style={{ height: 40, overflow: 'hidden' }}>
        <p className="text-artistic" key={insightIndex} style={{
          color: 'var(--text-secondary)',
          animation: 'slideUpFade 0.5s ease both'
        }}>
          {INSIGHTS[insightIndex]}
        </p>
      </div>

    </div>
  )
}
