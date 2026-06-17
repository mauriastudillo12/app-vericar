// Página para publicar un repuesto
// Solo accesible para usuarios con sesión iniciada
// Incluye subida de fotos a Supabase Storage

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

// Marcas de autos — lista ampliada con marcas europeas, americanas y asiáticas
const MARCAS = [
  'Alfa Romeo', 'Audi', 'BMW', 'BYD', 'Chery', 'Chevrolet', 'Citroën',
  'DFSK', 'Dodge', 'Fiat', 'Ford', 'GAC', 'Haval', 'Honda', 'Hyundai',
  'JAC', 'Jeep', 'Jetour', 'Kia', 'Land Rover', 'Mazda', 'Mercedes-Benz',
  'MG', 'Mitsubishi', 'Nissan', 'Peugeot', 'RAM', 'Renault', 'Subaru',
  'Suzuki', 'Toyota', 'Volkswagen', 'Volvo',
]

export default function PublicarRepuesto() {

  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [exito, setExito] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputFotosRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUsuario(session.user)
    })
  }, [])

  // Estado del formulario con todos los campos
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    marca_compatible: '',
    modelo_compatible: '',
    precio: '',
    estado: '',
    garantia: false,
    region: '',
    comuna: '',
    descripcion: '',
  })

  // Actualiza un campo específico del formulario
  const updateForm = (campo: string, valor: any) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  // Formatea precio con puntos de miles (ej: 45.000) bloqueando letras
  const handlePrecioChange = (valor: string) => {
    const soloNumeros = valor.replace(/\D/g, '')
    if (!soloNumeros) { updateForm('precio', ''); return }
    updateForm('precio', Number(soloNumeros).toLocaleString('es-CL'))
  }

  // Maneja la selección de fotos y crea previews
  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || [])
    if (archivos.length + fotos.length > 10) {
      setErrores(prev => ({ ...prev, fotos: 'Máximo 10 fotos por publicación' }))
      return
    }
    setFotos(prev => [...prev, ...archivos])
    archivos.forEach(archivo => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(archivo)
    })
  }

  // Elimina una foto de la lista
  const eliminarFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Publica el repuesto en Supabase
  const handlePublicar = async () => {
    const nuevosErrores: Record<string, string> = {}

    const nombreLimpio = form.nombre.trim()
    if (!nombreLimpio) {
      nuevosErrores.nombre = 'Ingresa el nombre del repuesto'
    } else if (nombreLimpio.length < 4) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 4 caracteres'
    } else if (nombreLimpio.length > 80) {
      nuevosErrores.nombre = 'El nombre no puede superar los 80 caracteres'
    }

    if (!form.categoria) nuevosErrores.categoria = 'Selecciona la categoría del repuesto'
    if (!form.marca_compatible) nuevosErrores.marca_compatible = 'Selecciona la marca compatible'
    if (!form.estado) nuevosErrores.estado = 'Selecciona el estado del repuesto'

    const modeloLimpio = form.modelo_compatible.trim()
    if (modeloLimpio.length > 40) {
      nuevosErrores.modelo_compatible = 'El modelo no puede superar los 40 caracteres'
    }

    const precioNum = parseInt(form.precio.replace(/[^0-9]/g, ''))
    if (!form.precio) {
      nuevosErrores.precio = 'Ingresa el precio del repuesto'
    } else if (isNaN(precioNum) || precioNum <= 0) {
      nuevosErrores.precio = 'Ingresa un precio válido'
    } else if (precioNum < 1000) {
      nuevosErrores.precio = 'El precio mínimo es $1.000'
    } else if (precioNum > 100000000) {
      nuevosErrores.precio = 'El precio ingresado parece incorrecto'
    }

    if (!form.region) nuevosErrores.region = 'Selecciona la región'

    const descLimpia = form.descripcion.trim()
    if (!descLimpia) {
      nuevosErrores.descripcion = 'Escribe una descripción del repuesto'
    } else if (descLimpia.length < 10) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 10 caracteres'
    } else if (descLimpia.length > 800) {
      nuevosErrores.descripcion = 'La descripción no puede superar los 800 caracteres'
    }

    if (fotos.length < 1) nuevosErrores.fotos = 'Sube al menos 1 foto del repuesto'

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      window.scrollTo({ top: 200, behavior: 'smooth' })
      return
    }

    setErrores({})
    setCargando(true)

    try {
      const urlsFotos: string[] = []
      for (const foto of fotos) {
        if (!foto.type.startsWith('image/')) {
          setErrores({ fotos: 'Solo se permiten archivos de imagen' })
          setCargando(false)
          return
        }
        if (foto.size > 5 * 1024 * 1024) {
          setErrores({ fotos: 'Cada foto debe pesar menos de 5MB' })
          setCargando(false)
          return
        }
        const nombreArchivo = `repuestos/${usuario.id}/${Date.now()}-${foto.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: uploadError } = await supabase.storage.from('autos-fotos').upload(nombreArchivo, foto)
        if (uploadError) { setErrores({ general: 'Error subiendo foto: ' + uploadError.message }); setCargando(false); return }
        const { data: urlData } = supabase.storage.from('autos-fotos').getPublicUrl(nombreArchivo)
        urlsFotos.push(urlData.publicUrl)
      }

      const { error: insertError } = await supabase.from('repuestos').insert({
        nombre: sanitizarTexto(nombreLimpio),
        categoria: form.categoria,
        marca_compatible: form.marca_compatible,
        modelo_compatible: sanitizarTexto(modeloLimpio) || 'Universal',
        precio: precioNum,
        estado: form.estado,
        garantia: form.garantia,
        region: form.region,
        comuna: form.comuna,
        descripcion: sanitizarTexto(descLimpia),
        vendedor_id: usuario?.id,
        fotos: JSON.stringify(urlsFotos),
      })

      if (insertError) { setErrores({ general: 'Error al publicar: ' + insertError.message }); setCargando(false); return }
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
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>¡Repuesto publicado!</h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '32px'}}>Tu publicación ya está visible en la sección de repuestos.</p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => router.push('/repuestos')} style={{flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
                Ver repuestos
              </button>
              <button
                onClick={() => {
                  setExito(false)
                  setFotos([])
                  setPreviews([])
                  setForm({ nombre: '', categoria: '', marca_compatible: '', modelo_compatible: '', precio: '', estado: '', garantia: false, region: '', comuna: '', descripcion: '' })
                }}
                style={{flex: 1, background: 'transparent', color: '#333', border: '1.5px solid #e5e5e5', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}
              >
                Publicar otro
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ProtegerRuta requiereVerificado={true} origenVerificacion="publicar-repuesto">
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .input-pub:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-pub { transition: background 0.2s, transform 0.15s; }
        .btn-pub:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .foto-slot { transition: border-color 0.2s; }
        .foto-slot:hover { border-color: #2563eb !important; }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '120px', padding: '120px 40px 60px', maxWidth: '720px', margin: '0 auto'}}>

        {/* Encabezado */}
        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Publicar repuesto</h1>
          <p style={{fontSize: '14px', color: '#888'}}>Completa los datos para que los compradores encuentren tu repuesto</p>
        </div>

        {/* Formulario */}
        <div style={{background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '20px'}}>

          {/* Nombre del repuesto */}
          <div>
            <label style={labelStyle}>NOMBRE DEL REPUESTO</label>
            <input
              className="input-pub"
              style={inputStyle('nombre')}
              type="text"
              placeholder="Ej: Motor de arranque Toyota Corolla"
              value={form.nombre}
              onChange={(e) => updateForm('nombre', e.target.value)}
            />
            {errorMsg('nombre')}
          </div>

          {/* Categoría y estado */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>CATEGORÍA</label>
              <select className="input-pub" style={{...inputStyle('categoria'), cursor: 'pointer'}} value={form.categoria} onChange={(e) => updateForm('categoria', e.target.value)}>
                <option value="">Selecciona la categoría</option>
                <option>Motor</option>
                <option>Carrocería</option>
                <option>Frenos</option>
                <option>Eléctrico</option>
                <option>Interior</option>
                <option>Neumáticos</option>
                <option>Accesorios</option>
                <option>Otros</option>
              </select>
              {errorMsg('categoria')}
            </div>
            <div>
              <label style={labelStyle}>ESTADO</label>
              <select className="input-pub" style={{...inputStyle('estado'), cursor: 'pointer'}} value={form.estado} onChange={(e) => updateForm('estado', e.target.value)}>
                <option value="">Selecciona el estado</option>
                <option>Nuevo</option>
                <option>Usado</option>
              </select>
              {errorMsg('estado')}
            </div>
          </div>

          {/* Marca y modelo compatible */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>MARCA COMPATIBLE</label>
              <select className="input-pub" style={{...inputStyle('marca_compatible'), cursor: 'pointer'}} value={form.marca_compatible} onChange={(e) => updateForm('marca_compatible', e.target.value)}>
                <option value="">Selecciona la marca</option>
                {MARCAS.map(m => <option key={m}>{m}</option>)}
                <option>Universal</option>
              </select>
              {errorMsg('marca_compatible')}
            </div>
            <div>
              <label style={labelStyle}>MODELO COMPATIBLE</label>
              <input
                className="input-pub"
                style={inputStyle('modelo_compatible')}
                type="text"
                placeholder="Ej: Corolla (opcional)"
                value={form.modelo_compatible}
                onChange={(e) => updateForm('modelo_compatible', e.target.value)}
              />
              {errorMsg('modelo_compatible')}
            </div>
          </div>

          {/* Precio */}
          <div>
            <label style={labelStyle}>PRECIO (en pesos)</label>
            {/* inputMode="numeric" + formato automático con puntos de miles */}
            <input
              className="input-pub"
              style={inputStyle('precio')}
              type="text"
              inputMode="numeric"
              placeholder="Ej: 45.000"
              value={form.precio}
              onChange={(e) => handlePrecioChange(e.target.value)}
            />
            {errorMsg('precio')}
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
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>DESCRIPCIÓN</label>
            <textarea
              className="input-pub"
              placeholder="Describe el repuesto, su condición, de qué auto fue desmontado..."
              value={form.descripcion}
              onChange={(e) => updateForm('descripcion', e.target.value)}
              style={{...inputStyle('descripcion'), minHeight: '120px', resize: 'vertical', lineHeight: 1.6}}
            />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
              {errores.descripcion && <p style={{fontSize: '12px', color: '#dc2626'}}>⚠ {errores.descripcion}</p>}
              <p style={{fontSize: '12px', color: form.descripcion.length > 700 ? '#f59e0b' : '#aaa', marginLeft: 'auto'}}>
                {form.descripcion.length}/800
              </p>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label style={labelStyle}>FOTOS <span style={{color: '#aaa', fontWeight: '400'}}>(mínimo 1, máximo 10)</span></label>

            {/* Grid de previews */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px'}}>

              {/* Previews de fotos seleccionadas */}
              {previews.map((preview, index) => (
                <div key={index} style={{position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e5e5'}}>
                  <img src={preview} alt={`Foto ${index + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <button
                    onClick={() => eliminarFoto(index)}
                    style={{position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Botón agregar fotos */}
              {fotos.length < 10 && (
                <div
                  className="foto-slot"
                  onClick={() => inputFotosRef.current?.click()}
                  style={{aspectRatio: '1', borderRadius: '10px', border: `2px dashed ${errores.fotos ? '#dc2626' : '#e5e5e5'}`, background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '6px'}}
                >
                  <span style={{fontSize: '24px', color: '#ccc'}}>+</span>
                  <span style={{fontSize: '11px', color: '#aaa'}}>Agregar</span>
                </div>
              )}
            </div>

            {/* Input de archivo oculto */}
            <input ref={inputFotosRef} type="file" accept="image/*" multiple onChange={handleFotos} style={{display: 'none'}} />

            <p style={{fontSize: '12px', color: '#aaa'}}>
              {fotos.length} de 10 fotos
            </p>
            {errores.fotos && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores.fotos}</p>
            )}
          </div>

          {/* Garantía */}
          <div onClick={() => updateForm('garantia', !form.garantia)} style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 0'}}>
            <div style={{width: '20px', height: '20px', borderRadius: '5px', border: form.garantia ? '2px solid #2563eb' : '2px solid #ddd', background: form.garantia ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s'}}>
              {form.garantia && <span style={{color: '#fff', fontSize: '12px', fontWeight: '700'}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>Incluye garantía</div>
              <div style={{fontSize: '12px', color: '#888'}}>Los compradores verán que el repuesto tiene garantía</div>
            </div>
          </div>

          {/* Error general */}
          {errores.general && (
            <div style={{background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}>
              ⚠ {errores.general}
            </div>
          )}

          {/* Botón publicar */}
          <button
            className="btn-pub"
            onClick={handlePublicar}
            disabled={cargando}
            style={{background: cargando ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '8px'}}
          >
            {cargando ? 'Publicando...' : 'Publicar repuesto'}
          </button>

        </div>
      </div>
    </main>
    </ProtegerRuta>
  )
}
