// Página de verificación de identidad
// Tesseract.js lee automáticamente el RUT del carnet chileno
// Recorta zonas específicas del carnet para mejor precisión
// Si falla la lectura automática, va a revisión manual del admin

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

// Extrae el RUT del texto — busca patrón "RUN XX.XXX.XXX-X"
const extraerRUTdeTexto = (texto: string): string | null => {
  const textoLimpio = texto.replace(/\n/g, ' ').replace(/\s+/g, ' ')

  // Patrón 1 — "RUN 11.630.621-2" (formato exacto del carnet chileno)
  const match1 = textoLimpio.match(/RUN\s*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i)
  if (match1) return match1[1]

  // Patrón 2 — "RUN" seguido de número sin puntos
  const match2 = textoLimpio.match(/RUN\s*(\d{7,8}-[\dkK])/i)
  if (match2) return match2[1]

  // Patrón 3 — número con formato XX.XXX.XXX-X sin "RUN"
  const match3 = textoLimpio.match(/\d{1,2}\.\d{3}\.\d{3}-[\dkK]/)
  if (match3) return match3[0]

  // Patrón 4 — número sin puntos con guión
  const match4 = textoLimpio.match(/\d{7,8}-[\dkK]/)
  if (match4) return match4[0]

  return null
}

// Normaliza RUT para comparar — quita puntos y guión
const normalizarRUT = (rut: string): string => {
  return rut.replace(/\./g, '').replace(/-/g, '').toLowerCase().trim()
}

// Recorta una zona de la imagen y mejora contraste para Tesseract
const recortarZona = (
  imagen: HTMLImageElement,
  xPct: number, yPct: number,
  wPct: number, hPct: number
): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const x = imagen.width * xPct
  const y = imagen.height * yPct
  const w = imagen.width * wPct
  const h = imagen.height * hPct
  canvas.width = w * 2
  canvas.height = h * 2
  ctx.scale(2, 2)
  ctx.filter = 'contrast(1.8) brightness(1.1) grayscale(1)'
  ctx.drawImage(imagen, x, y, w, h, 0, 0, w, h)
  return canvas.toDataURL('image/png')
}

// Convierte dataURL a Blob para Tesseract
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
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
  const [iniciado, setIniciado] = useState(false)

  const [rut, setRut] = useState('')
  const [rutValido, setRutValido] = useState<boolean | null>(null)
  const [fotoAnverso, setFotoAnverso] = useState<File | null>(null)
  const [fotoReverso, setFotoReverso] = useState<File | null>(null)
  const [previewAnverso, setPreviewAnverso] = useState('')
  const [previewReverso, setPreviewReverso] = useState('')

  // Estados Tesseract
  const [leyendoCarnet, setLeyendoCarnet] = useState(false)
  const [rutCarnet, setRutCarnet] = useState<string | null>(null)
  const [coincidencia, setCoincidencia] = useState<boolean | null>(null)
  const [lecturaFallida, setLecturaFallida] = useState(false)

  const inputAnversoRef = useRef<HTMLInputElement>(null)
  const inputReversoRef = useRef<HTMLInputElement>(null)

 useEffect(() => {
  if (iniciado) return
  setIniciado(true)
  const iniciar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUsuario(session.user)
      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', session.user.id).single()
      setPerfil(perfilData)
      if (perfilData?.verificado) {
  // Evitar loop — solo redirigir si no estamos ya en el destino
  const destino = origen ? `/${origen}` : '/perfil'
  if (typeof window !== 'undefined' && window.location.pathname !== destino) {
    router.push(destino)
  }
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
    if (rutCarnet && formateado.length >= 9) {
      setCoincidencia(normalizarRUT(formateado) === normalizarRUT(rutCarnet))
    }
  }

  // Leer RUT del carnet con Tesseract
  // Prueba múltiples zonas del carnet en orden de probabilidad
  const leerRUTcarnet = async (archivo: File) => {
    setLeyendoCarnet(true)
    setRutCarnet(null)
    setCoincidencia(null)
    setLecturaFallida(false)

    try {
      const { createWorker } = await import('tesseract.js')

      const imagenURL = URL.createObjectURL(archivo)
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = imagenURL
      })

      // Zonas del carnet chileno en orden de probabilidad:
      // 1. Inferior izquierda — "RUN XX.XXX.XXX-X" debajo de la foto
      // 2. Superior derecha — número pequeño junto a hologram
      // 3. Mitad inferior completa
      // 4. Imagen completa como último recurso
      const zonas = [
        { x: 0,    y: 0.65, w: 0.5,  h: 0.25 },
        { x: 0.6,  y: 0.25, w: 0.4,  h: 0.2  },
        { x: 0,    y: 0.55, w: 1,    h: 0.45 },
        { x: 0,    y: 0,    w: 1,    h: 1    },
      ]

      const worker = await createWorker('spa', 1, { logger: () => {} })

      let rutEncontrado: string | null = null

      for (const zona of zonas) {
        const recorte = recortarZona(img, zona.x, zona.y, zona.w, zona.h)
        const blob = dataURLtoBlob(recorte)
        const { data: { text } } = await worker.recognize(blob)
        rutEncontrado = extraerRUTdeTexto(text)
        if (rutEncontrado) break
      }

      await worker.terminate()
      URL.revokeObjectURL(imagenURL)

      if (rutEncontrado) {
        setRutCarnet(rutEncontrado)
        if (rut && rutValido) {
          setCoincidencia(normalizarRUT(rut) === normalizarRUT(rutEncontrado))
        }
      } else {
        setLecturaFallida(true)
      }
    } catch (err) {
      setLecturaFallida(true)
    }

    setLeyendoCarnet(false)
  }

  const handleAnverso = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setFotoAnverso(archivo)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewAnverso(e.target?.result as string)
    reader.readAsDataURL(archivo)
    await leerRUTcarnet(archivo)
  }

  const handleReverso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setFotoReverso(archivo)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewReverso(e.target?.result as string)
    reader.readAsDataURL(archivo)
  }

  // Eliminar foto anverso
  const eliminarAnverso = () => {
    setFotoAnverso(null)
    setPreviewAnverso('')
    setRutCarnet(null)
    setCoincidencia(null)
    setLecturaFallida(false)
    if (inputAnversoRef.current) inputAnversoRef.current.value = ''
  }

  // Eliminar foto reverso
  const eliminarReverso = () => {
    setFotoReverso(null)
    setPreviewReverso('')
    if (inputReversoRef.current) inputReversoRef.current.value = ''
  }

  const handleEnviar = async () => {
    setError('')
    if (!rut) { setError('Ingresa tu RUT'); return }
    if (!rutValido) { setError('El RUT ingresado no es válido'); return }
    if (!fotoAnverso) { setError('Sube la foto del anverso de tu carnet'); return }
    if (!fotoReverso) { setError('Sube la foto del reverso de tu carnet'); return }
    if (coincidencia === false) {
      setError('⚠️ El RUT ingresado no coincide con el del carnet. Verifica que sean iguales.')
      return
    }

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
          foto_carnet: JSON.stringify({
            anverso: nombreAnverso,
            reverso: nombreReverso,
            rutLeido: rutCarnet || null,
            coincidencia: coincidencia,
          }),
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

  if (exito) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 104px)'}}>
          <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>Solicitud enviada</h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '8px', lineHeight: 1.7}}>
              Revisaremos tu identidad en un plazo de <strong>24 horas hábiles</strong>.
            </p>
            {coincidencia === true && (
              <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px'}}>
                <p style={{fontSize: '13px', color: '#16a34a', fontWeight: '600'}}>
                  ✓ RUT verificado automáticamente — el carnet coincide
                </p>
              </div>
            )}
            {lecturaFallida && (
              <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '16px'}}>
                <p style={{fontSize: '13px', color: '#92400e', fontWeight: '600'}}>
                  ⚠ El admin verificará tu carnet manualmente
                </p>
              </div>
            )}
            <p style={{fontSize: '13px', color: '#aaa', marginBottom: '32px'}}>
              {origen ? 'Una vez verificado podrás continuar.' : 'Mientras tanto puedes navegar y guardar favoritos.'}
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
        .btn-eliminar-foto { transition: background 0.2s; }
        .btn-eliminar-foto:hover { background: rgba(0,0,0,0.8) !important; }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '120px', padding: '120px 40px 60px', maxWidth: '600px', margin: '0 auto'}}>

        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>Verificar identidad</h1>
          <p style={{fontSize: '14px', color: '#888', lineHeight: 1.7}}>
            {origen ? 'Para publicar en VeriCar necesitas verificar tu identidad primero.' : 'Para garantizar la seguridad de todos los usuarios, necesitamos verificar tu identidad.'}
          </p>
        </div>

        {origen && (
          <div style={{background: '#fffbeb', borderRadius: '12px', padding: '16px 20px', border: '1px solid #fde68a', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
            <span style={{fontSize: '20px', flexShrink: 0}}>⚠️</span>
            <div>
              <div style={{fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px'}}>Verificación requerida</div>
              <div style={{fontSize: '12px', color: '#b45309', lineHeight: 1.6}}>Solo usuarios verificados pueden publicar en VeriCar.</div>
            </div>
          </div>
        )}

        <div style={{background: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #bfdbfe', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
          <span style={{fontSize: '20px', flexShrink: 0}}>🔒</span>
          <div>
            <div style={{fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginBottom: '4px'}}>Tus datos están protegidos</div>
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
            <label style={{fontSize: '12px', fontWeight: '700', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '4px'}}>
              FOTO DE LA CÉDULA DE IDENTIDAD
            </label>
            <p style={{fontSize: '11px', color: '#aaa', marginBottom: '16px', lineHeight: 1.6}}>
              Al subir la foto delantera, leeremos automáticamente el RUT y lo compararemos con el ingresado.
            </p>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>

              {/* Anverso */}
              <div>
                <p style={{fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '600'}}>Parte delantera</p>
                <div
                  className="foto-slot"
                  onClick={() => !previewAnverso && inputAnversoRef.current?.click()}
                  style={{
                    height: '160px', borderRadius: '12px',
                    border: `2px dashed ${coincidencia === true ? '#bbf7d0' : coincidencia === false ? '#fecaca' : '#e5e5e5'}`,
                    background: previewAnverso ? 'transparent' : '#fafafa',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: previewAnverso ? 'default' : 'pointer', overflow: 'hidden', position: 'relative',
                  }}
                >
                  {previewAnverso
                    ? <img src={previewAnverso} alt="Anverso" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    : <div style={{textAlign: 'center'}}><div style={{fontSize: '28px', marginBottom: '8px'}}>📷</div><div style={{fontSize: '12px', color: '#aaa'}}>Subir foto</div></div>
                  }
                  {/* Overlay Tesseract leyendo */}
                  {leyendoCarnet && (
                    <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                      <div style={{fontSize: '24px'}}>🔍</div>
                      <p style={{color: '#fff', fontSize: '11px', fontWeight: '700', textAlign: 'center'}}>Leyendo RUT...</p>
                      <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '10px', textAlign: 'center'}}>Esto puede tomar unos segundos</p>
                    </div>
                  )}
                  {/* Botón eliminar anverso */}
                  {previewAnverso && !leyendoCarnet && (
                    <button
                      className="btn-eliminar-foto"
                      onClick={(e) => { e.stopPropagation(); eliminarAnverso() }}
                      style={{position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input ref={inputAnversoRef} type="file" accept="image/*" onChange={handleAnverso} style={{display: 'none'}} />

                {/* Resultado lectura Tesseract */}
                {!leyendoCarnet && rutCarnet && (
                  <div style={{marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: coincidencia === true ? '#f0fdf4' : coincidencia === false ? '#fef2f2' : '#f5f5f5', border: `1px solid ${coincidencia === true ? '#bbf7d0' : coincidencia === false ? '#fecaca' : '#e5e5e5'}`}}>
                    <p style={{fontSize: '11px', color: '#888', marginBottom: '2px'}}>RUT leído del carnet:</p>
                    <p style={{fontSize: '13px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{rutCarnet}</p>
                    {coincidencia === true && <p style={{fontSize: '11px', color: '#16a34a', fontWeight: '700'}}>✓ Coincide con el RUT ingresado</p>}
                    {coincidencia === false && <p style={{fontSize: '11px', color: '#dc2626', fontWeight: '700'}}>✗ No coincide — verifica tu RUT</p>}
                    {coincidencia === null && <p style={{fontSize: '11px', color: '#888'}}>Ingresa tu RUT arriba para comparar</p>}
                  </div>
                )}

                {!leyendoCarnet && lecturaFallida && previewAnverso && (
                  <div style={{marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a'}}>
                    <p style={{fontSize: '11px', color: '#92400e', fontWeight: '600'}}>⚠ No se pudo leer el RUT — el admin lo verificará manualmente</p>
                  </div>
                )}
              </div>

              {/* Reverso */}
              <div>
                <p style={{fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '600'}}>Parte trasera</p>
                <div
                  className="foto-slot"
                  onClick={() => !previewReverso && inputReversoRef.current?.click()}
                  style={{
                    height: '160px', borderRadius: '12px',
                    border: '2px dashed #e5e5e5',
                    background: previewReverso ? 'transparent' : '#fafafa',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: previewReverso ? 'default' : 'pointer', overflow: 'hidden', position: 'relative',
                  }}
                >
                  {previewReverso
                    ? <img src={previewReverso} alt="Reverso" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    : <div style={{textAlign: 'center'}}><div style={{fontSize: '28px', marginBottom: '8px'}}>📷</div><div style={{fontSize: '12px', color: '#aaa'}}>Subir foto</div></div>
                  }
                  {/* Botón eliminar reverso */}
                  {previewReverso && (
                    <button
                      className="btn-eliminar-foto"
                      onClick={(e) => { e.stopPropagation(); eliminarReverso() }}
                      style={{position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    >
                      ✕
                    </button>
                  )}
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

          <button
            className="btn-enviar"
            onClick={handleEnviar}
            disabled={enviando || leyendoCarnet}
            style={{background: enviando || leyendoCarnet ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: enviando || leyendoCarnet ? 'not-allowed' : 'pointer'}}
          >
            {leyendoCarnet ? '🔍 Leyendo carnet...' : enviando ? 'Enviando solicitud...' : 'Enviar solicitud de verificación'}
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