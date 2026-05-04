import React, { useEffect, useRef } from 'react'

export default function Cursor() {
  const dot = useRef()
  const ring = useRef()

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0

    const move = e => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', move)

    let raf
    const animate = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (dot.current) {
        dot.current.style.transform = `translate(${mx - 4}px, ${my - 4}px)`
      }
      if (ring.current) {
        ring.current.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    const over = () => { if (ring.current) ring.current.style.transform += ' scale(1.6)' }
    const out  = () => {}
    document.querySelectorAll('button,a').forEach(el => {
      el.addEventListener('mouseenter', over)
      el.addEventListener('mouseleave', out)
    })

    return () => {
      window.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dot} style={{
        position:'fixed', top:0, left:0, width:8, height:8,
        background:'var(--cyan)', borderRadius:'50%',
        zIndex:99999, pointerEvents:'none',
        boxShadow:'0 0 10px var(--cyan), 0 0 20px var(--cyan)',
        transition:'background 0.1s',
      }}/>
      <div ref={ring} style={{
        position:'fixed', top:0, left:0, width:36, height:36,
        border:'1px solid rgba(135,206,235,0.5)',
        borderRadius:'50%', zIndex:99998, pointerEvents:'none',
        transition:'transform 0.08s linear, width 0.2s, height 0.2s',
      }}/>
    </>
  )
}
