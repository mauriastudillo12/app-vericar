// Página principal de VeriCar
// Hero con imagen, animaciones, ola y parallax
// Buscador que redirige al feed de autos con el término de búsqueda

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './components/Navbar'
import Features from './components/Features'
import FeaturedCars from './components/FeaturedCars'
import FeaturedRepuestos from './components/FeaturedRepuestos'
import FeaturedTalleres from './components/FeaturedTalleres'
import Footer from './components/footer'
import ComoFunciona from './components/Comofunciona'




export default function Home() {

  // Ref para el efecto parallax en la imagen del hero
  const imgRef = useRef<HTMLImageElement>(null)

  // Estado del buscador del hero
  const [busqueda, setBusqueda] = useState('')

  const router = useRouter()

  // Efecto parallax — la imagen se mueve más lento que el scroll
  useEffect(() => {
    const handleScroll = () => {
      if (imgRef.current) {
        const scrollY = window.scrollY
        imgRef.current.style.transform = `translateY(${scrollY * 0.4}px)`
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Redirige al feed de autos con el término de búsqueda
  const handleBuscar = () => {
    if (busqueda.trim()) {
      router.push(`/autos?q=${encodeURIComponent(busqueda.trim())}`)
    } else {
      router.push('/autos')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Animaciones CSS del hero */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hero-badge  { animation: fadeUp 0.7s ease forwards; opacity: 0; animation-delay: 0.1s; }
        .hero-title  { animation: fadeUp 0.7s ease forwards; opacity: 0; animation-delay: 0.3s; }
        .hero-sub    { animation: fadeUp 0.7s ease forwards; opacity: 0; animation-delay: 0.5s; }
        .hero-search { animation: fadeUp 0.7s ease forwards; opacity: 0; animation-delay: 0.7s; }
        .hero-stats  { animation: fadeUp 0.7s ease forwards; opacity: 0; animation-delay: 0.9s; }
        .btn-buscar { transition: background 0.2s, transform 0.15s; }
        .btn-buscar:hover { background: #1d4ed8 !important; transform: scale(1.03); }
        .wave-container {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }
        .wave-svg {
          display: block;
          width: 200%;
          animation: wave 8s linear infinite;
        }
      `}</style>

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <div style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* Imagen con efecto parallax */}
        <img
          ref={imgRef}
          src="/hero-car.jpg"
          alt="Auto en movimiento"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '120%',
            objectFit: 'cover',
            objectPosition: 'center 60%',
            willChange: 'transform',
          }}
        />

        {/* Overlay degradado — más oscuro arriba donde está el texto */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.15) 100%)',
        }} />

        {/* Contenido del hero */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
          width: '100%',
          maxWidth: '680px',
          marginTop: '140px',
        }}>

          {/* Badge superior */}
          <div className="hero-badge" style={{
            display: 'inline-block',
            background: 'rgba(37, 99, 235, 0.9)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '2px',
            padding: '6px 16px',
            borderRadius: '20px',
            marginBottom: '20px',
          }}>
            MARKETPLACE VERIFICADO · CHILE
          </div>

          {/* Título */}
          <h1 className="hero-title hero-title-text" style={{
  fontSize: '4.5rem',
  fontWeight: '900',
  color: '#fff',
  letterSpacing: '10px',
  marginBottom: '16px',
  lineHeight: 1,
  textShadow: '0 4px 24px rgba(0,0,0,0.5)',
}}>
  VERICAR
</h1>

          {/* Subtítulo */}
          <p className="hero-sub" style={{
            fontSize: '1.05rem',
            color: 'rgba(255,255,255,0.65)',
            marginBottom: '36px',
            fontWeight: '400',
            lineHeight: 1.6,
          }}>
            Compra y vende autos con identidad verificada.<br />
            Sin estafas, sin fantasmas, sin riesgos.
          </p>

          {/* Buscador */}
          <div className="hero-search" style={{
            display: 'flex',
            background: '#fff',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            marginBottom: '32px',
          }}>
            <input
              type="text"
              placeholder="Buscar marca, modelo, año..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              style={{
                flex: 1,
                padding: '18px 24px',
                fontSize: '15px',
                border: 'none',
                outline: 'none',
                color: '#000',
                background: 'transparent',
              }}
            />
            <button className="btn-buscar" onClick={handleBuscar} style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '18px 32px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}>
              Buscar
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats hero-stats-container" style={{ display: 'flex', justifyContent: 'center', gap: '48px' }}>
            {[
              { num: '1.200+', label: 'Autos publicados' },
              { num: '100%', label: 'Vendedores verificados' },
              { num: '4.9★', label: 'Calificación promedio' },
            ].map((stat) => (
              <div key={stat.num} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{stat.num}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', letterSpacing: '0.5px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Ola animada en la parte baja del hero */}
        <div className="wave-container">
          <svg
            className="wave-svg"
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1440,40 L1440,80 L0,80 Z"
              fill="#fff"
            />
          </svg>
        </div>

      </div>

      {/* Sección de características — 4 pilares de VeriCar */}
      <Features />

      {/* Cómo funciona — 3 pasos explicados */}
      <ComoFunciona />

      {/* Autos destacados — datos reales desde Supabase */}
      <FeaturedCars />

      {/* Repuestos destacados — datos reales desde Supabase */}
      <FeaturedRepuestos />

      {/* Talleres destacados — datos reales desde Supabase */}
      <FeaturedTalleres />

      {/* Footer */}
      <Footer />

    </main>

  )

} 