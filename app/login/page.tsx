// Página de login de VeriCar
// Conectada a Supabase — verifica usuario y contraseña reales

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Login() {

  const router = useRouter()
  const [metodo, setMetodo] = useState('correo')

  // Estados para los campos
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estados para errores y carga
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Función que se ejecuta al hacer clic en Ingresar
  const handleLogin = async () => {

    if (!email) { setError('Por favor ingresa tu correo'); return }
    if (!password) { setError('Por favor ingresa tu contraseña'); return }

    setCargando(true)
    setError('')

    try {
      // signInWithPassword verifica el email y contraseña en Supabase
      // Si son correctos, crea una sesión automáticamente
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError('Correo o contraseña incorrectos')
        setCargando(false)
        return
      }

      // Si el login fue exitoso, redirigir al inicio
      router.push('/')

    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
      setCargando(false)
    }
  }

  return (
    <main style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>

      <style>{`
        .input-field { transition: border 0.2s; }
        .input-field:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-metodo { transition: all 0.2s ease; cursor: pointer; }
        .btn-submit { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-submit:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .link-hover:hover { color: #1d4ed8 !important; }
      `}</style>

      {/* Imagen de fondo */}
      <img
        src="/hero-car.jpg"
        alt=""
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(12px)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />

      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(245, 245, 245, 0.55)',
        zIndex: 1,
      }} />

      <Navbar />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '80px 20px 40px',
        position: 'relative',
        zIndex: 10,
      }}>

        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid #eee',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}>

          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <div style={{fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#000', marginBottom: '8px'}}>
              VERICAR
            </div>
            <h1 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>
              Bienvenido de vuelta
            </h1>
            <p style={{fontSize: '14px', color: '#888'}}>
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Selector correo / teléfono */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px'}}>
            <div className="btn-metodo" onClick={() => setMetodo('correo')} style={{
              background: metodo === 'correo' ? '#000' : '#f5f5f5',
              color: metodo === 'correo' ? '#fff' : '#666',
              border: metodo === 'correo' ? '1.5px solid #000' : '1.5px solid #e5e5e5',
              borderRadius: '10px', padding: '14px', textAlign: 'center',
            }}>
              <div style={{fontSize: '20px', marginBottom: '4px'}}>✉️</div>
              <div style={{fontSize: '13px', fontWeight: '600'}}>Correo</div>
            </div>
            <div className="btn-metodo" onClick={() => setMetodo('telefono')} style={{
              background: metodo === 'telefono' ? '#000' : '#f5f5f5',
              color: metodo === 'telefono' ? '#fff' : '#666',
              border: metodo === 'telefono' ? '1.5px solid #000' : '1.5px solid #e5e5e5',
              borderRadius: '10px', padding: '14px', textAlign: 'center',
            }}>
              <div style={{fontSize: '20px', marginBottom: '4px'}}>📱</div>
              <div style={{fontSize: '13px', fontWeight: '600'}}>Teléfono</div>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Email */}
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
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
            </div>

            {/* Contraseña */}
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px'}}>
                  CONTRASEÑA
                </label>
                <a href="#" className="link-hover" style={{fontSize: '12px', color: '#2563eb', fontWeight: '600', textDecoration: 'none'}}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                type="password"
                placeholder="Tu contraseña"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            {/* Botón ingresar */}
            <button
              className="btn-submit"
              onClick={handleLogin}
              disabled={cargando}
              style={{
                background: cargando ? '#93c5fd' : '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: cargando ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div style={{display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0'}}>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
              <span style={{fontSize: '12px', color: '#aaa'}}>o</span>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
            </div>

            <p style={{textAlign: 'center', fontSize: '14px', color: '#666'}}>
              ¿No tienes cuenta?{' '}
              <a href="/registro" className="link-hover" style={{color: '#2563eb', fontWeight: '600', textDecoration: 'none'}}>
                Regístrate gratis
              </a>
            </p>

          </div>
        </div>
      </div>
    </main>
  )
}