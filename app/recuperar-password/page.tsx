// app/recuperar-password/page.tsx
// Página donde el usuario ingresa su correo para recibir el enlace de recuperación
// Supabase envía un email automáticamente con el enlace

'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const handleRecuperar = async () => {
    if (!email) { setError('Por favor ingresa tu correo'); return }

    setCargando(true)
    setError('')

    // resetPasswordForEmail le envía al usuario un email con un enlace
    // El enlace redirige a /reset-password donde podrá poner su nueva contraseña
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError('No se pudo enviar el correo. Verifica la dirección.')
      setCargando(false)
      return
    }

    setEnviado(true)
    setCargando(false)
  }

  return (
    <main style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>
      <style>{`
        .input-field:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-submit:hover { background: #1d4ed8 !important; }
      `}</style>

      {/* Fondo difuminado igual que login */}
      <img src="/hero-car.jpg" alt="" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px)', transform: 'scale(1.1)', zIndex: 0}} />
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(245,245,245,0.55)', zIndex: 1}} />

      <Navbar />

      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 20px 40px', position: 'relative', zIndex: 10}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '480px', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>

          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <div style={{fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#000', marginBottom: '8px'}}>VERICAR</div>
            <h1 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Recuperar contraseña</h1>
            <p style={{fontSize: '14px', color: '#888'}}>Te enviaremos un enlace para crear una nueva contraseña</p>
          </div>

          {/* Si ya se envió el correo, mostrar confirmación */}
          {enviado ? (
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>📬</div>
              <p style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '8px'}}>Revisa tu correo</p>
              <p style={{fontSize: '14px', color: '#888', marginBottom: '24px'}}>
                Enviamos un enlace a <strong>{email}</strong>. Puede tardar unos minutos.
              </p>
              <a href="/login" style={{color: '#2563eb', fontWeight: '600', fontSize: '14px', textDecoration: 'none'}}>
                ← Volver al login
              </a>
            </div>
          ) : (
            // Formulario para ingresar el correo
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                  CORREO ELECTRÓNICO
                </label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRecuperar()}
                  style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
                />
              </div>

              {error && (
                <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
                  {error}
                </div>
              )}

              <button
                className="btn-submit"
                onClick={handleRecuperar}
                disabled={cargando}
                style={{background: cargando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background 0.2s'}}
              >
                {cargando ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <p style={{textAlign: 'center', fontSize: '14px'}}>
                <a href="/login" style={{color: '#2563eb', fontWeight: '600', textDecoration: 'none'}}>
                  ← Volver al login
                </a>
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}