// Página de verificación de identidad
// El usuario ingresa su RUT y sube foto del carnet por ambos lados
// El admin revisa y aprueba desde el panel de administración
// Acepta parámetro ?origen= para redirigir después de verificar

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

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
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  const [rut, setRut] = useState('')
  const [rutValido, setRutValido] = useState<boolean | null>(null)
  const [fotoAnverso, setFotoAnverso] = useState<File | null>(null)
  const [fotoReverso, setFotoReverso] = useState<File | null>(null)
  const [previewAnverso, setPreviewAnverso] = useState('')
  const [previewReverso, setPreviewReverso] = useState('')

  const inputAnversoRef = useRef<HTMLInputElement>(null)
  const inputReversoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const iniciar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUsuario(session.user)

      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', session.user.id).single()
      setPerfil(perfilData)

      if (perfilData?.verificado) {
        router.push(origen ? `/${origen}` : '/perfil')
        return
      }

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

  const handleAnverso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setFotoAnverso(archivo)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewAnverso(e.target?.result as string)
    reader.readAsDataURL(archivo)
  }

  const handleReverso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setFotoReverso(archivo)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewReverso(e.target?.result as string)
    reader.readAsDataURL(archivo)
  }

  const handleEnviar = async () => {
    setError('')
    if (!rut) { setError('Ingresa tu RUT'); return }
    if (!rutValido) { setError('El RUT ingresado no es válido'); return }
    if (!fotoAnverso) { setError('Sube la foto del anverso de tu carnet'); return }
    if (!fotoReverso) { setError('Sube la foto del reverso de tu carnet'); return }

    setEnviando(true)
    try {
      const nombreAnverso = `${usuario.id}/anverso-${Date.now()}.jpg`
      const { error: errorAnverso } = await supabase.storage
        .from('carnets').upload(nombreAnverso, fotoAnverso, { upsert: true })
      if (errorAnverso) { setError('Error subiendo anverso: ' + errorAnverso.message); setEnviando(false); return }

      const nombreReverso = `${usuario.id}/reverso-${Date.now()}.jpg`
      const { error: errorReverso } = await supabase.storage
        .from('carnets').upload(nombreReverso, fotoReverso, { upsert: true })
      if (errorReverso) { setError('Error subiendo reverso: ' + errorReverso.message); setEnviando(false); return }

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          rut,
          foto_carnet: JSON.stringify({ anverso: nombreAnverso, reverso: nombreReverso }),
        })
        .eq('id', usuario.id)

      if (updateError) { setError('Error guardando datos: ' + updateError.message); setEnviando(false); return }
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

  // Pantalla de éxito
  if (exito) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 104px)'}}>
          <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>
              Solicitud enviada
            </h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '8px', lineHeight: 1.7}}>
              Revisaremos tu identidad en un plazo de <strong>24 horas hábiles</strong>. Te notificaremos cuando tu cuenta esté verificada.
            </p>
            <p style={{fontSize: '13px', color: '#aaa', marginBottom: '32px'}}>
              {origen
                ? 'Una vez verificado podrás continuar con tu publicación.'
                : 'Mientras tanto puedes seguir navegando y guardando favoritos.'}
            </p>
            <button
              onClick={() => router.push(origen ? `/${origen}` : '/perfil')}
              style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}
            >
              {origen ? 'Volver e intentar de nuevo' : 'Volver a mi perfil'}
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
        .foto-slot { transition: border-color 0.2s, background 0.2s; }
        .foto-slot:hover { border-color: #2563eb !important; background: #f0f6ff !important; }
        .btn-enviar { transition: background 0.2s, transform 0.15s; }
        .btn-enviar:hover { background: #1d4ed8 !important; transform: scale(1.02); }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '120px', padding: '120px 40px 60px', maxWidth: '600px', margin: '0 auto'}}>

        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>
            Verificar identidad
          </h1>
          <p style={{fontSize: '14px', color: '#888', lineHeight: 1.7}}>
            {origen
              ? 'Para publicar en VeriCar necesitas verificar tu identidad primero.'
              : 'Para garantizar la seguridad de todos los usuarios, necesitamos verificar tu identidad.'}
          </p>
        </div>

        {/* Banner origen */}
        {origen && (
          <div style={{background: '#fffbeb', borderRadius: '12px', padding: '16px 20px', border: '1px solid #fde68a', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
            <span style={{fontSize: '20px', flexShrink: 0}}>⚠️</span>
            <div>
              <div style={{fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px'}}>
                Verificación requerida
              </div>
              <div style={{fontSize: '12px', color: '#b45309', lineHeight: 1.6}}>
                Solo usuarios verificados pueden publicar en VeriCar. Completa tu verificación y el admin la aprobará en menos de 24 horas.
              </div>
            </div>
          </div>
        )}

        <div style={{background: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #bfdbfe', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
          <span style={{fontSize: '20px', flexShrink: 0}}>🔒</span>
          <div>
            <div style={{fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px'}}>
              Tus datos están protegidos
            </div>
            <div style={{fontSize: '12px', color: '#3b82f6', lineHeight: 1.6}}>
              Tu cédula es revisada únicamente por el equipo de VeriCar y nunca es compartida con terceros.
            </div>
          </div>
        </div>

        <div style={{background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '24px'}}>

          {/* RUT */}
          <div>
            <label style={{fontSize: '12px', fontWeight: '700', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '8px'}}>RUT</label>
            <div style={{position: 'relative'}}>
              <input
                className="input-rut"
                type="text"
                placeholder="Ej: 12.345.678-9"
                value={rut}
                onChange={handleRutChange}
                maxLength={12}
                style={{
                  width: '100%', padding: '12px 16px', fontSize: '16px',
                  border: `1.5px solid ${rutValido === false ? '#fecaca' : rutValido === true ? '#bbf7d0' : '#e5e5e5'}`,
                  borderRadius: '10px', background: '#fafafa', color: '#000',
                  boxSizing: 'border-box', outline: 'none', fontWeight: '600', letterSpacing: '1px',
                }}
              />
              {rutValido !== null && (
                <div style={{position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px'}}>
                  {rutValido ? '✅' : '❌'}
                </div>
              )}
            </div>
            {rutValido === false && <p style={{fontSize: '12px', color: '#dc2626', marginTop: '6px'}}>RUT inválido — verifica el dígito verificador</p>}
            {rutValido === true && <p style={{fontSize: '12px', color: '#16a34a', marginTop: '6px'}}>✓ RUT válido</p>}
          </div>

          <div style={{height: '1px', background: '#f0f0f0'}} />

          {/* Fotos carnet */}
          <div>
            <label style={{fontSize: '12px', fontWeight: '700', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '16px'}}>
              FOTO DE LA CÉDULA DE IDENTIDAD
            </label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <p style={{fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '600'}}>Parte delantera</p>
                <div className="foto-slot" onClick={() => inputAnversoRef.current?.click()} style={{height: '160px', borderRadius: '12px', border: '2px dashed #e5e5e5', background: previewAnverso ? 'transparent' : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'}}>
                  {previewAnverso ? <img src={previewAnverso} alt="Anverso" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{textAlign: 'center'}}><div style={{fontSize: '28px', marginBottom: '8px'}}>📷</div><div style={{fontSize: '12px', color: '#aaa'}}>Subir foto</div></div>}
                </div>
                <input ref={inputAnversoRef} type="file" accept="image/*" onChange={handleAnverso} style={{display: 'none'}} />
              </div>
              <div>
                <p style={{fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '600'}}>Parte trasera</p>
                <div className="foto-slot" onClick={() => inputReversoRef.current?.click()} style={{height: '160px', borderRadius: '12px', border: '2px dashed #e5e5e5', background: previewReverso ? 'transparent' : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'}}>
                  {previewReverso ? <img src={previewReverso} alt="Reverso" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{textAlign: 'center'}}><div style={{fontSize: '28px', marginBottom: '8px'}}>📷</div><div style={{fontSize: '12px', color: '#aaa'}}>Subir foto</div></div>}
                </div>
                <input ref={inputReversoRef} type="file" accept="image/*" onChange={handleReverso} style={{display: 'none'}} />
              </div>
            </div>
            <p style={{fontSize: '12px', color: '#aaa', marginTop: '12px', lineHeight: 1.6}}>
              Asegúrate que la foto sea legible y el RUT visible. Formatos: JPG, PNG.
            </p>
          </div>

          {error && (
            <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
              {error}
            </div>
          )}

          <button className="btn-enviar" onClick={handleEnviar} disabled={enviando} style={{background: enviando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: enviando ? 'not-allowed' : 'pointer'}}>
            {enviando ? 'Enviando solicitud...' : 'Enviar solicitud de verificación'}
          </button>

          <p style={{fontSize: '12px', color: '#aaa', textAlign: 'center', lineHeight: 1.6}}>
            Al enviar confirmas que los datos son tuyos y aceptas los{' '}
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