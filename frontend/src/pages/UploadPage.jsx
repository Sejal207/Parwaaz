import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { uploadSession } from '../api'
import { Camera, Upload, Info, CheckCircle2, Loader2, Sparkles, Mic, Music, Square, Play, AlignLeft, Video } from 'lucide-react'

export default function UploadPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Parse mode from query string if available (e.g. /upload?mode=speech)
  const queryParams = new URLSearchParams(location.search)
  const initialMode = queryParams.get('mode') || 'acting'

  const [performanceType, setPerformanceType] = useState(
    ['acting', 'speech', 'singing'].includes(initialMode) ? initialMode : 'acting'
  )
  const [title, setTitle] = useState('')
  const [referenceText, setReferenceText] = useState('')
  
  // File state
  const [video, setVideo] = useState(null)
  const [referenceVideo, setReferenceVideo] = useState(null)
  const [referenceAudio, setReferenceAudio] = useState(null)
  
  const [draggingVideo, setDraggingVideo] = useState(false)
  const [draggingRefVideo, setDraggingRefVideo] = useState(false)
  const [draggingRefAudio, setDraggingRefAudio] = useState(false)
  
  const videoRef = useRef()
  const refVideoRef = useRef()
  const refAudioRef = useRef()

  // Upload/Processing state
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleUploadClick = () => {
    if (!title.trim()) {
      setError('Please enter a performance title')
      return
    }
    if (!video) {
      setError('Please select or upload a video file')
      return
    }
    if (performanceType === 'speech' && !referenceText.trim()) {
      setError('Please provide the reference text for speech analysis')
      return
    }
    if (performanceType === 'acting' && !referenceVideo) {
      setError('Please provide a reference video for acting analysis')
      return
    }
    if (performanceType === 'singing' && !referenceAudio) {
      setError('Please provide a reference audio track for singing analysis')
      return
    }
    
    setError('')
    setIsUploading(true)

    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('mode', performanceType)
    fd.append('reference_text', performanceType === 'speech' ? referenceText.trim() : '')
    fd.append('video', video)
    
    if (performanceType === 'acting' && referenceVideo) {
      fd.append('reference_video', referenceVideo)
    }
    if (performanceType === 'singing' && referenceAudio) {
      fd.append('reference_audio', referenceAudio)
    }

    uploadSession(fd, setProgress)
      .then(res => {
        setProgress(100)
        setTimeout(() => {
          navigate(`/result/${res.data.id}`)
        }, 1000)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Upload failed. Please try again.')
        setIsUploading(false)
      })
  }

  const isRecordDisabled = true // completely removing record feature
  const needsRefText = performanceType === 'speech'
  const needsRefVideo = performanceType === 'acting'
  const needsRefAudio = performanceType === 'singing'

  // --- Processing Screen ---
  if (isUploading) {
    return <ProcessingScreen progress={progress} mode={performanceType} />
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
            { id: 'acting', label: 'Acting (Facial Analysis)' },
            { id: 'speech', label: 'Speech (Pronunciation)' },
            { id: 'singing', label: 'Singing (Pitch & Timing)' }
          ].map(type => (
            <div key={type.id}
              onClick={() => setPerformanceType(type.id)}
              style={{
                padding: '10px 24px', borderRadius: '999px', cursor: 'pointer',
                background: performanceType === type.id ? 'var(--accent-teal)' : 'rgba(255,255,255,0.5)',
                color: performanceType === type.id ? 'white' : 'var(--text-secondary)',
                fontWeight: 500, fontSize: 14,
                boxShadow: performanceType === type.id ? '0 4px 12px rgba(20,184,166,0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}>
              {performanceType === type.id && <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, marginBottom: -2 }} />}
              {type.label}
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

          {needsRefAudio && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Music size={20} color="var(--accent-teal)" />
                <h3 className="text-h3" style={{ fontSize: 16 }}>Reference Audio</h3>
              </div>
              <p className="text-body" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Required for Singing Analysis. The AI will compare your pitch and timing against this audio track. (Supports MP3, WAV, and other formats)
              </p>
              
              <div 
                onDragOver={e => { e.preventDefault(); setDraggingRefAudio(true) }}
                onDragLeave={() => setDraggingRefAudio(false)}
                onDrop={e => { 
                  e.preventDefault(); setDraggingRefAudio(false); 
                  const f = e.dataTransfer.files[0]; 
                  if (f?.type.startsWith('audio/')) setReferenceAudio(f) 
                }}
                onClick={() => !referenceAudio && refAudioRef.current?.click()}
                style={{
                  padding: 32, textAlign: 'center', cursor: referenceAudio ? 'default' : 'pointer',
                  border: draggingRefAudio ? '2px dashed var(--accent-teal)' : '1px dashed rgba(100,116,139,0.3)',
                  borderRadius: 12, background: 'rgba(255,255,255,0.2)', transition: 'all 0.2s'
                }}>
                <input ref={refAudioRef} type="file" accept="audio/*" style={{ display: 'none' }}
                  onChange={e => setReferenceAudio(e.target.files[0])} />
                
                {referenceAudio ? (
                  <div>
                    <CheckCircle2 size={24} color="var(--accent-teal)" style={{ marginBottom: 8 }} />
                    <p className="text-body" style={{ fontWeight: 600, marginBottom: 4 }}>{referenceAudio.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setReferenceAudio(null) }}
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
                    <p className="text-body" style={{ fontSize: 14 }}>Click or drag reference audio here</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 32 }} />

        {/* YOUR PERFORMANCE VIDEO/AUDIO Upload Zone */}
        <div 
          onDragOver={e => { e.preventDefault(); setDraggingVideo(true) }}
          onDragLeave={() => setDraggingVideo(false)}
          onDrop={e => { 
            e.preventDefault(); setDraggingVideo(false); 
            const f = e.dataTransfer.files[0]; 
            const isVideo = f?.type.startsWith('video/');
            const isAudio = performanceType === 'singing' && f?.type.startsWith('audio/');
            if (isVideo || isAudio) setVideo(f) 
          }}
          onClick={() => !video && videoRef.current?.click()}
          className="glass-panel"
          style={{
            padding: 40, textAlign: 'center', cursor: video ? 'default' : 'pointer',
            border: draggingVideo ? '2px dashed var(--accent-teal)' : '2px dashed var(--accent-teal)',
            background: draggingVideo ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.3)',
            marginBottom: 24, transition: 'all 0.2s'
          }}>
          <input ref={videoRef} type="file" accept={performanceType === 'singing' ? "video/*,audio/*" : "video/*"} style={{ display: 'none' }}
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
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                {performanceType === 'singing' ? 'Drop your video or audio file here' : 'Drop your final video here'}
              </p>
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
            <b>Tip:</b> {performanceType === 'singing' ? 'You can upload a video or audio file. Choose a quiet space for best results.' : 'Choose a quiet, well-lit space. The AI analyzes both your expressions and voice together.'}
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

function ProcessingScreen({ progress, mode = 'acting' }) {
  const [simulatedProgress, setSimulatedProgress] = useState(progress)
  const [currentStep, setCurrentStep] = useState(0)

  const STEPS = [
    { title: 'Uploading Files', desc: 'Transferring video & reference media to AI engine...' },
    { title: 'Audio Extraction', desc: 'Converting media streams with FFmpeg...' },
    { title: 'AI Neural Inference', desc: mode === 'acting' ? 'Analyzing facial expressions & emotional contours...' : mode === 'speech' ? 'Scoring speech pronunciation & fluency...' : 'Tracking vocal pitch accuracy & rhythm timing...' },
    { title: 'Generating Feedback', desc: 'Structuring performance analytics & report summary...' }
  ]

  useEffect(() => {
    // If real progress comes from axios upload event, use it up to 50%
    if (progress > simulatedProgress) {
      setSimulatedProgress(progress)
    }
  }, [progress])

  useEffect(() => {
    // Increment simulated progress smoothly for long AI inference steps
    const timer = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 98) return 98
        const stepInc = prev < 30 ? 5 : prev < 70 ? 2 : 1
        return prev + stepInc
      })
    }, 400)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (simulatedProgress < 25) setCurrentStep(0)
    else if (simulatedProgress < 55) setCurrentStep(1)
    else if (simulatedProgress < 85) setCurrentStep(2)
    else setCurrentStep(3)
  }, [simulatedProgress])

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (simulatedProgress / 100) * circumference

  const modeIcons = {
    acting: { icon: Sparkles, label: 'Acting Analysis', color: 'var(--accent-teal)' },
    speech: { icon: Mic, label: 'Speech Analysis', color: '#F59E0B' },
    singing: { icon: Music, label: 'Singing Analysis', color: '#8B5CF6' }
  }

  const ActiveIcon = modeIcons[mode]?.icon || Sparkles
  const activeColor = modeIcons[mode]?.color || 'var(--accent-teal)'

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', textAlign: 'center',
      animation: 'fadeScale 0.6s ease',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      paddingTop: 30, paddingBottom: 60
    }}>
      
      {/* Active Mode Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 20px', borderRadius: '999px',
        background: 'rgba(255,255,255,0.7)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <ActiveIcon size={18} color={activeColor} />
        <span className="text-h3" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
          {modeIcons[mode]?.label || 'Performance Analysis'}
        </span>
      </div>

      {/* Progress Ring */}
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth="10" />
          <circle cx="110" cy="110" r={radius} fill="none" stroke={activeColor} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span className="font-brand" style={{ fontSize: 52, color: 'var(--text-primary)', lineHeight: 1 }}>
            {Math.round(simulatedProgress)}%
          </span>
          <span className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Processing
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-h2" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
          {STEPS[currentStep].title}
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          {STEPS[currentStep].desc}
        </p>
      </div>

      {/* Stages Stepper */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%', marginTop: 12 }}>
        {STEPS.map((s, idx) => {
          const isDone = idx < currentStep
          const isCurrent = idx === currentStep
          return (
            <div key={idx} className="glass-card" style={{
              padding: '16px 12px', textAlign: 'center',
              borderTop: `3px solid ${isDone || isCurrent ? activeColor : 'rgba(0,0,0,0.1)'}`,
              opacity: isDone || isCurrent ? 1 : 0.4,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', margin: '0 auto 8px',
                background: isDone ? activeColor : isCurrent ? 'rgba(20,184,166,0.2)' : 'rgba(0,0,0,0.05)',
                color: isDone ? 'white' : activeColor,
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isDone ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className="text-caption" style={{ fontWeight: 600, display: 'block', fontSize: 11 }}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}
