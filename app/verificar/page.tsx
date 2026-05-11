// app/verificar/page.tsx
// Verificación de identidad por RUT
// Valida matemáticamente el dígito verificador en el frontend
// Guarda el RUT y queda pendiente de aprobación manual del admin
//
// INTEGRACIÓN BOOSTR (PENDIENTE — activar antes de presentación):
// 1. Crear cuenta en https://my.boostr.cl y obtener API KEY
// 2. Agregar NEXT_PUBLIC_BOOSTR_API_KEY en variables de entorno
// 3. Descomentar el bloque "BOOSTR API" en handleEnviar
// La llamada retorna el nombre asociado al RUT desde el SII
// Si coincide con el nombre del perfil → verificación automática sin admin

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

// Validación matemática del RUT chileno — algoritmo módulo 11
const validarRUT = (rut: string): boolean => {
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').toLowerCase()
  if (rutLimpio.length < 2) return false
  const numero = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)
  if (!/^\d+$/.test(numero)) return false
  let suma = 0
  let multiplicador = 2
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : String(dvEsperado)
  return dv === dvCalculado
}

// Formatea el RUT mientras el usuario escribe — XX.XXX.XXX-X
const formatearRUT = (rut: string): string => {
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').replace(/[^0-9kK]/g, '')
  if (rutLimpio.length <= 1) return rutLimpio
  const numero = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)
  const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${numeroFormateado}-${dv}`
}

function VerificarContent() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const origen = searchParams.get('origen')

  const [usuario, setUsuario] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')
  const [iniciado, setIniciado] = useState(false)

  const [rut, setRut] = useState('')
  const [rutValido, setRutValido] = useState<boolean | null>(null)

  useEffect(() => {
    if (iniciado) return
    setIniciado(true)
    const iniciar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUsuario(session.user)

      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', session.user.id).single()

      // Si ya está verificado redirigir
      if (perfilData?.verificado) {
        const destino = origen ? `/${origen}` : '/perfil'
        if (typeof window !== 'undefined' && window.location.pathname !== destino) {
          router.push(destino)
        }
        return
      }

      // Si ya tenía un RUT guardado, prellenar
      if (perfilData?.rut) setRut(perfilData.rut)

      setCargando(false)
    }
    iniciar()
  }, [])

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formateado = formatearRUT(e.target.value)
    setRut(formateado)
    if (formateado.length >= 9) setRutValido(validarRUT(formateado))
    else setRutValido(null)
  }

  const handleEnviar = async () => {
    setError('')
    if (!rut) { setError('Ingresa tu RUT'); return }
    if (!rutValido) { setError('El RUT ingresado no es válido'); return }

    setEnviando(true)

    try {

      // ================================================================
      // BOOSTR API — DESCOMENTAR ANTES DE LA PRESENTACIÓN
      // Requiere: NEXT_PUBLIC_BOOSTR_API_KEY en variables de entorno
      // Verifica que el RUT exista en el SII y obtiene el nombre asociado
      // ================================================================
      //
      // const rutSinFormato = rut.replace(/\./g, '').replace(/-/g, '')
      // const apiKey = process.env.NEXT_PUBLIC_BOOSTR_API_KEY
      // if (apiKey) {
      //   try {
      //     const res = await fetch(
      //       `https://api.boostr.cl/rut/name/${rutSinFormato}.json`,
      //       { headers: { 'Authorization': `Bearer ${apiKey}` } }
      //     )
      //     const data = await res.json()
      //     if (data?.data?.name) {
      //       // RUT existe en el SII — verificación automática
      //       await supabase.from('perfiles').update({
      //         rut,
      //         verificado: true,
      //         nombre_sii: data.data.name,
      //       }).eq('id', usuario.id)
      //       setExito(true)
      //       setEnviando(false)
      //       return
      //     }
      //   } catch (errBoostr) {
      //     console.log('Boostr no disponible, continuando con revisión manual')
      //   }
      // }
      // ================================================================

      // Sin Boostr activo — guardar RUT y dejar pendiente para el admin
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          rut,
          verificacion_pendiente: true,
        })
        .eq('id', usuario.id)

      if (updateError) {
        setError('Error guardando datos: ' + updateError.message)
        setEnviando(false)
        return
      }

      setExito(true)

    } catch (err) {
      setError('Ocurrió un error inesperado')
    }

    setEnviando(false)
  }

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando...</p>
        </div>
      </main>
    )
  }

  if (exito) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 104px)'}}>
          <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>Solicitud enviada</h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.7}}>
              Revisaremos tu RUT en un plazo de <strong>24 horas hábiles</strong> y te notificaremos cuando estés verificado.
            </p>
            <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px'}}>
              <p style={{fontSize: '13px', color: '#92400e', fontWeight: '600'}}>
                ⚠ Tu cuenta será verificada manualmente por el equipo de VeriCar
              </p>
            </div>
            <button
              onClick={() => router.push(origen ? `/${origen}` : '/perfil')}
              style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}
            >
              {origen ? 'Volver' : 'Volver a mi perfil'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .input-rut:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-enviar { transition: background 0.2s, transform 0.15s; }
        .btn-enviar:hover { background: #1d4ed8 !important; transform: scale(1.02); }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '120px', padding: '120px 40px 60px', maxWidth: '520px', margin: '0 auto'}}>

        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>Verificar identidad</h1>
          <p style={{fontSize: '14px', color: '#888', lineHeight: 1.7}}>
            {origen
              ? 'Para continuar en VeriCar necesitas verificar tu identidad.'
              : 'Para garantizar la seguridad de todos los usuarios, necesitamos verificar tu identidad.'}
          </p>
        </div>

        {origen && (
          <div style={{background: '#fffbeb', borderRadius: '12px', padding: '16px 20px', border: '1px solid #fde68a', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
            <span style={{fontSize: '20px', flexShrink: 0}}>⚠️</span>
            <div>
              <div style={{fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px'}}>Verificación requerida</div>
              <div style={{fontSize: '12px', color: '#b45309', lineHeight: 1.6}}>Solo usuarios verificados pueden usar todas las funciones de VeriCar.</div>
            </div>
          </div>
        )}

        <div style={{background: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #bfdbfe', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
          <span style={{fontSize: '20px', flexShrink: 0}}>🔒</span>
          <div>
            <div style={{fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px'}}>Tus datos están protegidos</div>
            <div style={{fontSize: '12px', color: '#3b82f6', lineHeight: 1.6}}>
              Tu RUT es usado únicamente para verificar tu identidad y nunca es compartido con terceros.
            </div>
          </div>
        </div>

        <div style={{background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '24px'}}>

          {/* Campo RUT */}
          <div>
            <label style={{fontSize: '12px', fontWeight: '700', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '8px'}}>
              RUT
            </label>
            <div style={{position: 'relative'}}>
              <input
                className="input-rut"
                type="text"
                placeholder="Ej: 12.345.678-9"
                value={rut}
                onChange={handleRutChange}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                maxLength={12}
                style={{
                  width: '100%', padding: '14px 48px 14px 16px',
                  fontSize: '18px', fontWeight: '700', letterSpacing: '2px',
                  border: `1.5px solid ${rutValido === false ? '#fecaca' : rutValido === true ? '#bbf7d0' : '#e5e5e5'}`,
                  borderRadius: '10px', background: '#fafafa', color: '#000',
                  boxSizing: 'border-box', outline: 'none',
                }}
              />
              {/* Indicador visual de validez */}
              {rutValido !== null && (
                <div style={{position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px'}}>
                  {rutValido ? '✅' : '❌'}
                </div>
              )}
            </div>
            {/* Mensajes de validación */}
            {rutValido === false && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '6px', fontWeight: '600'}}>
                RUT inválido — verifica el dígito verificador
              </p>
            )}
            {rutValido === true && (
              <p style={{fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: '600'}}>
                ✓ RUT válido
              </p>
            )}
          </div>

          {/* Cómo funciona */}
          <div style={{background: '#f9f9f9', borderRadius: '10px', padding: '16px'}}>
            <p style={{fontSize: '12px', fontWeight: '700', color: '#555', marginBottom: '10px', letterSpacing: '0.5px'}}>
              ¿CÓMO FUNCIONA?
            </p>
            {[
              { icono: '1️⃣', texto: 'Ingresas tu RUT y lo validamos al instante' },
              { icono: '2️⃣', texto: 'El equipo de VeriCar revisa tu solicitud en 24 hrs' },
              { icono: '3️⃣', texto: 'Recibes confirmación y puedes usar todas las funciones' },
            ].map((paso) => (
              <div key={paso.icono} style={{display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px'}}>
                <span style={{fontSize: '14px', flexShrink: 0}}>{paso.icono}</span>
                <p style={{fontSize: '12px', color: '#888', lineHeight: 1.5}}>{paso.texto}</p>
              </div>
            ))}
          </div>

          {error && (
            <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600'}}>
              {error}
            </div>
          )}

          <button
            className="btn-enviar"
            onClick={handleEnviar}
            disabled={enviando || !rutValido}
            style={{
              background: enviando ? '#93c5fd' : !rutValido ? '#e5e5e5' : '#2563eb',
              color: enviando ? '#fff' : !rutValido ? '#aaa' : '#fff',
              border: 'none', padding: '16px', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700',
              cursor: enviando || !rutValido ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar solicitud de verificación'}
          </button>

          <p style={{fontSize: '12px', color: '#aaa', textAlign: 'center', lineHeight: 1.6}}>
            Al enviar confirmas que el RUT es tuyo y aceptas los{' '}
            <a href="/terminos" style={{color: '#2563eb', textDecoration: 'none'}}>Términos y Condiciones</a>{' '}
            de VeriCar.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function Verificar() {
  return (
    <Suspense fallback={<div style={{paddingTop: '104px', textAlign: 'center', color: '#888'}}>Cargando...</div>}>
      <VerificarContent />
    </Suspense>
  )
}