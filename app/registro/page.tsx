// app/registro/page.tsx
// Página de registro de VeriCar
// Conectada a Supabase — guarda usuarios reales en la base de datos
// Solo registro por correo + contraseña

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Registro() {

  const router = useRouter()

  // Estados para los campos del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')

  // Estados para manejar errores y carga
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Función que se ejecuta cuando el usuario hace clic en "Crear cuenta"
  const handleRegistro = async () => {

    // Validación básica
    if (!nombre) { setError('Por favor ingresa tu nombre'); return }
    if (!email) { setError('Por favor ingresa tu correo'); return }
    if (!password || password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }

    setCargando(true)
    setError('')

    try {
      // Paso 1: crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setCargando(false)
        return
      }

      // Paso 2: guardar datos adicionales en la tabla perfiles
      // Supabase Auth solo guarda email y contraseña
      // El nombre y otros datos van en nuestra tabla perfiles
      if (authData.user) {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .insert({
            id: authData.user.id,
            nombre,
            email,
            verificado: false,
          })

        if (perfilError) {
          setError('Error al crear el perfil: ' + perfilError.message)
          setCargando(false)
          return
        }
      }

      // Si todo salió bien, redirigir al inicio
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
        .btn-submit { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-submit:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .link-hover:hover { color: #1d4ed8 !important; }
      `}</style>

      {/* Imagen de fondo difuminada igual que login */}
      <img
        src="/hero-car.jpg"
        alt=""
        style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px)', transform: 'scale(1.1)', zIndex: 0}}
      />

      {/* Overlay */}
      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(245,245,245,0.55)', zIndex: 1}} />

      <Navbar />

      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 20px 40px', position: 'relative', zIndex: 10}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '480px', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>

          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <div style={{fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#000', marginBottom: '8px'}}>VERICAR</div>
            <h1 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Crea tu cuenta</h1>
            <p style={{fontSize: '14px', color: '#888'}}>Únete a VeriCar gratis</p>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Nombre completo */}
            <div>
              <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                NOMBRE COMPLETO
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="input-field"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
            </div>

            {/* Correo electrónico */}
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
              <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegistro()}
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
                {error}
              </div>
            )}

            {/* Botón crear cuenta */}
            <button
              className="btn-submit"
              onClick={handleRegistro}
              disabled={cargando}
              style={{background: cargando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '8px'}}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <div style={{display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0'}}>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
              <span style={{fontSize: '12px', color: '#aaa'}}>o</span>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
            </div>

            {/* Link a login */}
            <p style={{textAlign: 'center', fontSize: '14px', color: '#666'}}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="link-hover" style={{color: '#2563eb', fontWeight: '600', textDecoration: 'none'}}>
                Ingresa aquí
              </a>
            </p>

          </div>
        </div>
      </div>
    </main>
  )
}