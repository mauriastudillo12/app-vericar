// Página para registrar un taller
// Solo accesible para usuarios con sesión iniciada

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import ProtegerRuta from '../components/ProtegerRuta'
import { sanitizarTexto } from '../lib/sanitizar'

// Regiones de Chile
const REGIONES = [
  { codigo: '15', nombre: 'Arica y Parinacota' },
  { codigo: '01', nombre: 'Tarapacá' },
  { codigo: '02', nombre: 'Antofagasta' },
  { codigo: '03', nombre: 'Atacama' },
  { codigo: '04', nombre: 'Coquimbo' },
  { codigo: '05', nombre: 'Valparaíso' },
  { codigo: '13', nombre: 'Metropolitana de Santiago' },
  { codigo: '06', nombre: "O'Higgins" },
  { codigo: '07', nombre: 'Maule' },
  { codigo: '16', nombre: 'Ñuble' },
  { codigo: '08', nombre: 'Biobío' },
  { codigo: '09', nombre: 'La Araucanía' },
  { codigo: '14', nombre: 'Los Ríos' },
  { codigo: '10', nombre: 'Los Lagos' },
  { codigo: '11', nombre: 'Aysén' },
  { codigo: '12', nombre: 'Magallanes' },
]

// Comunas principales por región
const COMUNAS: Record<string, string[]> = {
  // Región Metropolitana — lista completa de comunas
  '13': [
    'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Conchalí',
    'Curacaví', 'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba',
    'Independencia', 'Isla de Maipo', 'La Cisterna', 'La Florida', 'La Granja',
    'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Prado',
    'Macul', 'Maipú', 'María Pinto', 'Melipilla', 'Padre Hurtado', 'Paine',
    'Peñaflor', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto',
    'Quilicura', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín',
    'San José de Maipo', 'San Pedro', 'San Ramón', 'Santiago', 'Talagante',
    'Vitacura', 'Ñuñoa',
  ],
  '05': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Los Andes', 'La Calera'],
  '08': ['Concepción', 'Talcahuano', 'Hualpén', 'San Pedro de la Paz', 'Coronel', 'Chiguayante'],
  '09': ['Temuco', 'Padre Las Casas', 'Angol', 'Victoria', 'Villarrica', 'Pucón'],
  '10': ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud'],
  '02': ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
  '01': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
  '04': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
  '03': ['Copiapó', 'Vallenar', 'Chañaral'],
  '06': ['Rancagua', 'San Fernando', 'Pichilemu', 'Machalí'],
  '07': ['Talca', 'Curicó', 'Linares', 'Constitución'],
  '16': ['Chillán', 'Chillán Viejo', 'San Carlos'],
  '14': ['Valdivia', 'La Unión', 'Río Bueno'],
  '15': ['Arica', 'Putre'],
  '11': ['Coyhaique', 'Puerto Aysén'],
  '12': ['Punta Arenas', 'Puerto Natales', 'Puerto Williams'],
}

// Servicios disponibles para seleccionar
// Mecánica general agregada como primera opción (servicio más buscado)
const SERVICIOS_DISPONIBLES = [
  'Mecánica general', 'Mantención', 'Frenos', 'Suspensión', 'Electricidad',
  'Pintura', 'Diagnóstico', 'Aire acondicionado', 'Transmisión',
  'Motor', 'Carrocería', 'Vidrios', 'Neumáticos',
]

export default function RegistrarTaller() {

  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [exito, setExito] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string>('')
  const inputFotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUsuario(session.user)
    })
  }, [])

  // Estado del formulario — teléfono eliminado (contacto se hace por WhatsApp del perfil)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    region: '',
    comuna: '',
    horario_inicio: 8,
    horario_fin: 19,
    servicios: [] as string[],
  })

  // Actualiza un campo del formulario
  const updateForm = (campo: string, valor: any) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  // Agrega o quita un servicio de la lista
  const toggleServicio = (servicio: string) => {
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter(s => s !== servicio)
        : [...prev.servicios, servicio]
    }))
  }

  // Maneja la selección de foto del taller
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setFotoFile(archivo)
    const reader = new FileReader()
    reader.onload = (e) => setFotoPreview(e.target?.result as string)
    reader.readAsDataURL(archivo)
  }

  // Registra el taller en Supabase
  const handleRegistrar = async () => {
    const nuevosErrores: Record<string, string> = {}

    const nombreLimpio = form.nombre.trim()
    if (!nombreLimpio) {
      nuevosErrores.nombre = 'Ingresa el nombre del taller'
    } else if (nombreLimpio.length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres'
    } else if (nombreLimpio.length > 80) {
      nuevosErrores.nombre = 'El nombre no puede superar los 80 caracteres'
    }

    const descLimpia = form.descripcion.trim()
    if (!descLimpia) {
      nuevosErrores.descripcion = 'Escribe una descripción del taller'
    } else if (descLimpia.length < 20) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 20 caracteres'
    } else if (descLimpia.length > 800) {
      nuevosErrores.descripcion = 'La descripción no puede superar los 800 caracteres'
    }

    const direccionLimpia = form.direccion.trim()
    if (!direccionLimpia) {
      nuevosErrores.direccion = 'Ingresa la dirección del taller'
    } else if (direccionLimpia.length < 5) {
      nuevosErrores.direccion = 'Ingresa una dirección válida'
    } else if (direccionLimpia.length > 120) {
      nuevosErrores.direccion = 'La dirección no puede superar los 120 caracteres'
    }

    if (!form.region) nuevosErrores.region = 'Selecciona la región'
    if (form.region && !form.comuna) nuevosErrores.comuna = 'Selecciona la comuna'

    if (form.horario_inicio >= form.horario_fin) {
      nuevosErrores.horario = 'La hora de inicio debe ser menor a la hora de cierre'
    }

    if (form.servicios.length === 0) {
      nuevosErrores.servicios = 'Selecciona al menos un servicio'
    }

    if (fotoFile) {
      if (!fotoFile.type.startsWith('image/')) {
        nuevosErrores.foto = 'Solo se permiten archivos de imagen'
      } else if (fotoFile.size > 5 * 1024 * 1024) {
        nuevosErrores.foto = 'La foto debe pesar menos de 5MB'
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      window.scrollTo({ top: 200, behavior: 'smooth' })
      return
    }

    setErrores({})
    setCargando(true)

    try {
      let foto_url = ''

      if (fotoFile) {
        const nombreArchivo = `talleres/${usuario.id}/${Date.now()}-${fotoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('autos-fotos').upload(nombreArchivo, fotoFile)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('autos-fotos').getPublicUrl(nombreArchivo)
          foto_url = urlData.publicUrl
        }
      }

      const { error: insertError } = await supabase.from('talleres').insert({
        nombre: sanitizarTexto(nombreLimpio),
        descripcion: sanitizarTexto(descLimpia),
        direccion: sanitizarTexto(direccionLimpia),
        region: form.region,
        comuna: form.comuna,
        horario: `${form.horario_inicio}:00 - ${form.horario_fin}:00`,
        horario_inicio: form.horario_inicio,
        horario_fin: form.horario_fin,
        servicios: form.servicios.join(','),
        foto_url,
        propietario_id: usuario?.id,
      })

      if (insertError) {
        setErrores({ general: 'Error al registrar: ' + insertError.message })
        setCargando(false)
        return
      }

      setExito(true)
    } catch (err) {
      setErrores({ general: 'Ocurrió un error inesperado. Intenta de nuevo.' })
    }
    setCargando(false)
  }

  const inputStyle = (campo: string): React.CSSProperties => ({
    width: '100%', padding: '12px 16px', fontSize: '14px',
    border: `1.5px solid ${errores[campo] ? '#dc2626' : '#e5e5e5'}`, borderRadius: '10px',
    background: '#fafafa', color: '#000', boxSizing: 'border-box', outline: 'none',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: '700', color: '#555',
    letterSpacing: '0.5px', display: 'block', marginBottom: '6px',
  }

  const errorMsg = (campo: string) => errores[campo] ? (
    <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores[campo]}</p>
  ) : null

  // Pantalla de éxito
  if (exito) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 104px)'}}>
          <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>¡Taller registrado!</h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '32px'}}>Tu taller ya está visible en el directorio.</p>
            <button onClick={() => router.push('/talleres')} style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
              Ver directorio de talleres
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ProtegerRuta requiereVerificado={true} origenVerificacion="registrar-taller">
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .input-pub:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-pub { transition: background 0.2s, transform 0.15s; }
        .btn-pub:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .foto-slot { transition: border-color 0.2s; }
        .foto-slot:hover { border-color: #2563eb !important; }
        .servicio-btn { transition: all 0.2s; cursor: pointer; }
        .servicio-btn:hover { border-color: #2563eb !important; color: #2563eb !important; }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '120px', padding: '120px 40px 60px', maxWidth: '720px', margin: '0 auto'}}>

        {/* Encabezado */}
        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Registrar taller</h1>
          <p style={{fontSize: '14px', color: '#888'}}>Gratis — llega a miles de clientes en tu zona</p>
        </div>

        {/* Formulario */}
        <div style={{background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '20px'}}>

          {/* Foto del taller */}
          <div>
            <label style={labelStyle}>FOTO DEL TALLER</label>
            <div
              className="foto-slot"
              onClick={() => inputFotoRef.current?.click()}
              style={{
                width: '100%', height: '180px',
                borderRadius: '12px',
                border: `2px dashed ${errores.foto ? '#dc2626' : '#e5e5e5'}`,
                background: fotoPreview ? 'transparent' : '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
              }}
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '32px', marginBottom: '8px'}}>📷</div>
                  <div style={{fontSize: '13px', color: '#aaa'}}>Haz clic para subir una foto</div>
                </div>
              )}
            </div>
            <input ref={inputFotoRef} type="file" accept="image/*" onChange={handleFoto} style={{display: 'none'}} />
            {errores.foto && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores.foto}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label style={labelStyle}>NOMBRE DEL TALLER</label>
            <input className="input-pub" style={inputStyle('nombre')} type="text" placeholder="Ej: Taller Mecánico El Rápido" value={form.nombre} onChange={(e) => updateForm('nombre', e.target.value)} />
            {errorMsg('nombre')}
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>DESCRIPCIÓN</label>
            <textarea
              className="input-pub"
              placeholder="Describe los servicios que ofreces, tu experiencia, especialidades..."
              value={form.descripcion}
              onChange={(e) => updateForm('descripcion', e.target.value)}
              style={{...inputStyle('descripcion'), minHeight: '100px', resize: 'vertical', lineHeight: 1.6}}
            />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
              {errores.descripcion && <p style={{fontSize: '12px', color: '#dc2626'}}>⚠ {errores.descripcion}</p>}
              <p style={{fontSize: '12px', color: form.descripcion.length > 700 ? '#f59e0b' : '#aaa', marginLeft: 'auto'}}>
                {form.descripcion.length}/800
              </p>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label style={labelStyle}>DIRECCIÓN</label>
            <input className="input-pub" style={inputStyle('direccion')} type="text" placeholder="Ej: Av. Grecia 1234" value={form.direccion} onChange={(e) => updateForm('direccion', e.target.value)} />
            {errorMsg('direccion')}
          </div>

          {/* Región y comuna */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>REGIÓN</label>
              <select className="input-pub" style={{...inputStyle('region'), cursor: 'pointer'}} value={form.region} onChange={(e) => { updateForm('region', e.target.value); updateForm('comuna', '') }}>
                <option value="">Selecciona la región</option>
                {REGIONES.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
              {errorMsg('region')}
            </div>
            <div>
              <label style={labelStyle}>COMUNA</label>
              <select
                className="input-pub"
                style={{...inputStyle('comuna'), cursor: 'pointer', opacity: !form.region ? 0.5 : 1}}
                value={form.comuna}
                onChange={(e) => updateForm('comuna', e.target.value)}
                disabled={!form.region}
              >
                <option value="">{!form.region ? 'Selecciona región primero' : 'Selecciona la comuna'}</option>
                {(COMUNAS[form.region] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errorMsg('comuna')}
            </div>
          </div>

          {/* Horario de atención — selectores de hora igual que en el perfil (se eliminó teléfono) */}
          <div>
            <label style={labelStyle}>HORARIO DE ATENCIÓN</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <select
                className="input-pub"
                value={form.horario_inicio}
                onChange={(e) => updateForm('horario_inicio', Number(e.target.value))}
                style={{...inputStyle('horario'), cursor: 'pointer', flex: 1}}
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
              <span style={{fontSize: '14px', color: '#888', fontWeight: '600', flexShrink: 0}}>a</span>
              <select
                className="input-pub"
                value={form.horario_fin}
                onChange={(e) => updateForm('horario_fin', Number(e.target.value))}
                style={{...inputStyle('horario'), cursor: 'pointer', flex: 1}}
              >
                {Array.from({length: 24}, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
            {errores.horario && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores.horario}</p>
            )}
          </div>

          {/* Servicios — selección múltiple con pills */}
          <div>
            <label style={labelStyle}>SERVICIOS <span style={{color: '#aaa', fontWeight: '400'}}>(selecciona todos los que ofreces)</span></label>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {SERVICIOS_DISPONIBLES.map((s) => (
                <div
                  key={s}
                  className="servicio-btn"
                  onClick={() => toggleServicio(s)}
                  style={{
                    background: form.servicios.includes(s) ? '#2563eb' : '#fff',
                    color: form.servicios.includes(s) ? '#fff' : '#555',
                    border: `1.5px solid ${form.servicios.includes(s) ? '#2563eb' : '#e5e5e5'}`,
                    padding: '8px 16px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '500',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {form.servicios.includes(s) ? '✓ ' : ''}{s}
                </div>
              ))}
            </div>
            {errores.servicios && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores.servicios}</p>
            )}
          </div>

          {/* Error general */}
          {errores.general && (
            <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
              ⚠ {errores.general}
            </div>
          )}

          {/* Botón registrar */}
          <button
            className="btn-pub"
            onClick={handleRegistrar}
            disabled={cargando}
            style={{background: cargando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '8px'}}
          >
            {cargando ? 'Registrando...' : 'Registrar taller gratis'}
          </button>

        </div>
      </div>
    </main>
    </ProtegerRuta>
  )
}
