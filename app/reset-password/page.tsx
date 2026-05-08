// app/reset-password/page.tsx
// Página donde el usuario elige su nueva contraseña
// Supabase redirige aquí automáticamente desde el enlace del email
// El token viene en la URL y Supabase lo procesa solo con onAuthStateChange

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  const [sesionLista, setSesionLista] = useState(false)

  useEffect(() => {
    // Supabase detecta el token en la URL automáticamente
    // Cuando lo valida, dispara el evento PASSWORD_RECOVERY
    // Ahí habilitamos el formulario para que el usuario pueda cambiar su contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSesionLista(true)
      }
    })

    // Limpiar el listener al salir de la página
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password) { setError('Ingresa tu nueva contraseña'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setCargando(true)
    setError('')

    // updateUser actualiza la contraseña del usuario autenticado
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      setCargando(false)
      return
    }

    // Contraseña cambiada exitosamente — redirigir al login en 3 segundos
    setListo(true)
    setCargando(false)
    setTimeout(() => router.push('/login'), 3000)
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
            <h1 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Nueva contraseña</h1>
            <p style={{fontSize: '14px', color: '#888'}}>Elige una contraseña segura para tu cuenta</p>
          </div>

          {/* Contraseña cambiada exitosamente */}
          {listo ? (
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
              <p style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '8px'}}>¡Contraseña actualizada!</p>
              <p style={{fontSize: '14px', color: '#888'}}>Redirigiendo al login en unos segundos...</p>
            </div>

          ) : !sesionLista ? (
            // Mientras Supabase valida el token de la URL
            <div style={{textAlign: 'center', color: '#888', fontSize: '14px'}}>
              <p>Verificando enlace...</p>
              <p style={{marginTop: '16px', fontSize: '13px'}}>
                Si esto tarda mucho,{' '}
                <a href="/recuperar-password" style={{color: '#2563eb', textDecoration: 'none', fontWeight: '600'}}>
                  solicita un nuevo enlace
                </a>.
              </p>
            </div>

          ) : (
            // Formulario para ingresar la nueva contraseña
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                  NUEVA CONTRASEÑA
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
                />
              </div>

              <div>
                <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                  CONFIRMAR CONTRASEÑA
                </label>
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  className="input-field"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
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
                onClick={handleReset}
                disabled={cargando}
                style={{background: cargando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background 0.2s'}}
              >
                {cargando ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}