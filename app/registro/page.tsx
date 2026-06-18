// app/registro/page.tsx
// Página de registro de Unimotor
// Conectada a Supabase — guarda usuarios reales en la base de datos
// Solo registro por correo + contraseña

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Registro() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [fuerzaPassword, setFuerzaPassword] = useState(0)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const calcularFuerzaPassword = (pass: string) => {
    let fuerza = 0
    if (pass.length >= 8) fuerza++
    if (pass.length >= 12) fuerza++
    if (/[A-Z]/.test(pass)) fuerza++
    if (/[0-9]/.test(pass)) fuerza++
    if (/[^A-Za-z0-9]/.test(pass)) fuerza++
    return fuerza
  }

  const handleRegistro = async () => {
    const nuevosErrores: Record<string, string> = {}

    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    } else if (nombreLimpio.length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (nombreLimpio.length > 60) {
      nuevosErrores.nombre = 'El nombre no puede superar los 60 caracteres'
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombreLimpio)) {
      nuevosErrores.nombre = 'El nombre solo puede contener letras y espacios'
    }

    const emailLimpio = email.trim().toLowerCase()
    if (!emailLimpio) {
      nuevosErrores.email = 'El correo es obligatorio'
    } else if (!validarEmail(emailLimpio)) {
      nuevosErrores.email = 'Ingresa un correo electrónico válido'
    }

    if (!password) {
      nuevosErrores.password = 'La contraseña es obligatoria'
    } else if (password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/[A-Z]/.test(password)) {
      nuevosErrores.password = 'Debe contener al menos una letra mayúscula'
    } else if (!/[0-9]/.test(password)) {
      nuevosErrores.password = 'Debe contener al menos un número'
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    setErrores({})
    setCargando(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLimpio,
        password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setErrores({ email: 'Este correo ya está registrado. ¿Quieres iniciar sesión?' })
        } else {
          setErrores({ general: authError.message })
        }
        setCargando(false)
        return
      }

      if (authData.user) {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .insert({
            id: authData.user.id,
            nombre: nombreLimpio,
            email: emailLimpio,
            verificado: false,
          })

        if (perfilError) {
          setErrores({ general: 'Error al crear el perfil: ' + perfilError.message })
          setCargando(false)
          return
        }
      }

      router.push('/')
    } catch (err) {
      setErrores({ general: 'Ocurrió un error inesperado. Intenta de nuevo.' })
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

      <img
        src="/hero-car.jpg"
        alt=""
        style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px)', transform: 'scale(1.1)', zIndex: 0}}
      />

      <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(245,245,245,0.55)', zIndex: 1}} />

      <Navbar />

      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 20px 40px', position: 'relative', zIndex: 10}}>
        <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '480px', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>

          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <div style={{fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#000', marginBottom: '8px'}}>UNIMOTOR</div>
            <h1 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Crea tu cuenta</h1>
            <p style={{fontSize: '14px', color: '#888'}}>Únete a Unimotor gratis</p>
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
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: `1.5px solid ${errores.nombre ? '#dc2626' : '#e5e5e5'}`, borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
              {errores.nombre && (
                <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  ⚠ {errores.nombre}
                </p>
              )}
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
                style={{width: '100%', padding: '14px 16px', fontSize: '15px', border: `1.5px solid ${errores.email ? '#dc2626' : '#e5e5e5'}`, borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
              />
              {errores.email && (
                <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  ⚠ {errores.email}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                CONTRASEÑA
              </label>
              <div style={{position: 'relative'}}>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="input-field"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFuerzaPassword(calcularFuerzaPassword(e.target.value)) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegistro()}
                  style={{width: '100%', padding: '14px 48px 14px 16px', fontSize: '15px', border: `1.5px solid ${errores.password ? '#dc2626' : '#e5e5e5'}`, borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box'}}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '16px'}}
                >
                  {mostrarPassword ? '🙈' : '👁'}
                </button>
              </div>
              {password && (
                <div style={{marginTop: '8px'}}>
                  <div style={{display: 'flex', gap: '4px', marginBottom: '4px'}}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{flex: 1, height: '4px', borderRadius: '2px', background: fuerzaPassword >= n ? (fuerzaPassword <= 2 ? '#ef4444' : fuerzaPassword <= 3 ? '#f59e0b' : '#22c55e') : '#e5e5e5', transition: 'background 0.2s'}}/>
                    ))}
                  </div>
                  <p style={{fontSize: '11px', color: fuerzaPassword <= 2 ? '#ef4444' : fuerzaPassword <= 3 ? '#f59e0b' : '#22c55e'}}>
                    {fuerzaPassword <= 2 ? 'Contraseña débil' : fuerzaPassword <= 3 ? 'Contraseña regular' : 'Contraseña fuerte'}
                  </p>
                </div>
              )}
              {errores.password && (
                <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                  ⚠ {errores.password}
                </p>
              )}
            </div>

            {/* Error general */}
            {errores.general && (
              <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
                ⚠ {errores.general}
              </div>
            )}

            {/* Términos y condiciones */}
            <div
              onClick={() => setAceptaTerminos(!aceptaTerminos)}
              style={{display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '4px 0'}}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                border: aceptaTerminos ? '2px solid #2563eb' : '2px solid #ddd',
                background: aceptaTerminos ? '#2563eb' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {aceptaTerminos && <span style={{color: '#fff', fontSize: '11px', fontWeight: '700'}}>✓</span>}
              </div>
              <p style={{fontSize: '13px', color: '#666', lineHeight: 1.5}}>
                Acepto los{' '}
                <a
                  href="/terminos"
                  onClick={(e) => e.stopPropagation()}
                  style={{color: '#2563eb', fontWeight: '600', textDecoration: 'none'}}
                >
                  términos y condiciones
                </a>
                {' '}y la política de privacidad de Unimotor
              </p>
            </div>

            {/* Botón crear cuenta */}
            <button
              className="btn-submit"
              onClick={handleRegistro}
              disabled={cargando || !aceptaTerminos}
              style={{background: cargando || !aceptaTerminos ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando || !aceptaTerminos ? 'not-allowed' : 'pointer', marginTop: '8px'}}
            >
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            {/* Requisitos de contraseña */}
            <div style={{background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', border: '1px solid #e2e8f0'}}>
              <p style={{fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px'}}>REQUISITOS DE CONTRASEÑA</p>
              {[
                { texto: 'Mínimo 8 caracteres', ok: password.length >= 8 },
                { texto: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
                { texto: 'Un número', ok: /[0-9]/.test(password) },
              ].map(req => (
                <p key={req.texto} style={{fontSize: '12px', color: req.ok ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0'}}>
                  {req.ok ? '✓' : '○'} {req.texto}
                </p>
              ))}
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0'}}>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
              <span style={{fontSize: '12px', color: '#aaa'}}>o</span>
              <div style={{flex: 1, height: '1px', background: '#eee'}} />
            </div>

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
