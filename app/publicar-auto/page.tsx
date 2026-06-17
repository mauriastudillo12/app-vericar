// Página para publicar un auto
// Solo accesible para usuarios con sesión iniciada
// Incluye subida de fotos a Supabase Storage
// Región y comuna de Chile con datos estáticos

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

export default function PublicarAuto() {

  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [exito, setExito] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputFotosRef = useRef<HTMLInputElement>(null)

  // Verificar sesión al cargar — redirigir al login si no hay sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUsuario(session.user)
    })
  }, [])

  // Estado del formulario con todos los campos
  const [form, setForm] = useState({
    marca: '', modelo: '', año: '', km: '', precio: '',
    combustible: '', transmision: '', region: '', comuna: '',
    descripcion: '', negociable: false,
  })

  // Actualiza un campo específico del formulario
  const updateForm = (campo: string, valor: any) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  // Formatea precio con puntos de miles (ej: 12.000.000) bloqueando letras
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

  // Publica el auto en Supabase
  const handlePublicar = async () => {
    const nuevosErrores: Record<string, string> = {}

    if (!form.marca) nuevosErrores.marca = 'Selecciona la marca del auto'

    const modeloLimpio = form.modelo.trim()
    if (!modeloLimpio) {
      nuevosErrores.modelo = 'Ingresa el modelo del auto'
    } else if (modeloLimpio.length < 2) {
      nuevosErrores.modelo = 'El modelo debe tener al menos 2 caracteres'
    } else if (modeloLimpio.length > 40) {
      nuevosErrores.modelo = 'El modelo no puede superar los 40 caracteres'
    }

    const añoNum = parseInt(form.año)
    const añoActual = new Date().getFullYear()
    if (!form.año) {
      nuevosErrores.año = 'Ingresa el año del auto'
    } else if (isNaN(añoNum) || añoNum < 1950 || añoNum > añoActual + 1) {
      nuevosErrores.año = `El año debe estar entre 1950 y ${añoActual + 1}`
    }

    const kmNum = parseInt(form.km)
    if (!form.km) {
      nuevosErrores.km = 'Ingresa el kilometraje'
    } else if (isNaN(kmNum) || kmNum < 0) {
      nuevosErrores.km = 'El kilometraje debe ser un número positivo'
    } else if (kmNum > 2000000) {
      nuevosErrores.km = 'El kilometraje ingresado parece incorrecto'
    }

    const precioNum = parseInt(form.precio.replace(/\./g, '').replace(/[^0-9]/g, ''))
    if (!form.precio) {
      nuevosErrores.precio = 'Ingresa el precio del auto'
    } else if (isNaN(precioNum) || precioNum <= 0) {
      nuevosErrores.precio = 'Ingresa un precio válido'
    } else if (precioNum < 100000) {
      nuevosErrores.precio = 'El precio mínimo es $100.000'
    } else if (precioNum > 500000000) {
      nuevosErrores.precio = 'El precio ingresado parece incorrecto'
    }

    if (!form.combustible) nuevosErrores.combustible = 'Selecciona el tipo de combustible'
    if (!form.transmision) nuevosErrores.transmision = 'Selecciona la transmisión'
    if (!form.region) nuevosErrores.region = 'Selecciona la región'
    if (form.region && !form.comuna) nuevosErrores.comuna = 'Selecciona la comuna'

    const descLimpia = form.descripcion.trim()
    if (!descLimpia) {
      nuevosErrores.descripcion = 'Escribe una descripción del auto'
    } else if (descLimpia.length < 20) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 20 caracteres'
    } else if (descLimpia.length > 1000) {
      nuevosErrores.descripcion = 'La descripción no puede superar los 1000 caracteres'
    }

    if (fotos.length < 3) nuevosErrores.fotos = 'Sube al menos 3 fotos del auto'

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
        const nombreArchivo = `${usuario.id}/${Date.now()}-${foto.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

        const { error: uploadError } = await supabase.storage
          .from('autos-fotos')
          .upload(nombreArchivo, foto)

        if (uploadError) { setErrores({ general: 'Error subiendo foto: ' + uploadError.message }); setCargando(false); return }

        const { data: urlData } = supabase.storage
          .from('autos-fotos')
          .getPublicUrl(nombreArchivo)

        urlsFotos.push(urlData.publicUrl)
      }

      const { error: insertError } = await supabase
        .from('autos')
        .insert({
          nombre: sanitizarTexto(`${form.marca} ${modeloLimpio} ${form.año}`),
          marca: form.marca,
          modelo: sanitizarTexto(modeloLimpio),
          año: añoNum,
          km: kmNum,
          precio: precioNum,
          combustible: form.combustible,
          transmision: form.transmision,
          region: form.region,
          comuna: form.comuna,
          descripcion: sanitizarTexto(descLimpia),
          negociable: form.negociable,
          destacado: false,
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

  // Pantalla de éxito después de publicar
  if (exito) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 104px)'}}>
          <div style={{background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #eee', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'}}>
            <div style={{fontSize: '56px', marginBottom: '16px'}}>✅</div>
            <h2 style={{fontSize: '1.6rem', fontWeight: '800', color: '#000', marginBottom: '8px'}}>¡Auto publicado!</h2>
            <p style={{fontSize: '14px', color: '#888', marginBottom: '32px'}}>Tu publicación ya está visible en el feed de autos.</p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => router.push('/autos')} style={{flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
                Ver feed
              </button>
              <button
                onClick={() => {
                  setExito(false)
                  setFotos([])
                  setPreviews([])
                  setForm({ marca: '', modelo: '', año: '', km: '', precio: '', combustible: '', transmision: '', region: '', comuna: '', descripcion: '', negociable: false })
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
    <ProtegerRuta requiereVerificado={true} origenVerificacion="publicar-auto">
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
          <h1 style={{fontSize: '2rem', fontWeight: '800', color: '#000', marginBottom: '6px'}}>Publicar auto</h1>
          <p style={{fontSize: '14px', color: '#888'}}>Completa todos los datos para que los compradores encuentren tu auto</p>
        </div>

        {/* Formulario */}
        <div style={{background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: '20px'}}>

          {/* Marca y modelo */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>MARCA</label>
              <select className="input-pub" style={{...inputStyle('marca'), cursor: 'pointer'}} value={form.marca} onChange={(e) => updateForm('marca', e.target.value)}>
                <option value="">Selecciona la marca</option>
                {MARCAS.map(m => <option key={m}>{m}</option>)}
                <option>Otra</option>
              </select>
              {errorMsg('marca')}
            </div>
            <div>
              <label style={labelStyle}>MODELO</label>
              <input className="input-pub" style={inputStyle('modelo')} type="text" placeholder="Ej: Corolla" value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} />
              {errorMsg('modelo')}
            </div>
          </div>

          {/* Año y kilometraje */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>AÑO</label>
              <input className="input-pub" style={inputStyle('año')} type="number" placeholder="Ej: 2020" value={form.año} onChange={(e) => updateForm('año', e.target.value)} />
              {errorMsg('año')}
            </div>
            <div>
              <label style={labelStyle}>KILOMETRAJE</label>
              <input className="input-pub" style={inputStyle('km')} type="number" placeholder="Ej: 45000" value={form.km} onChange={(e) => updateForm('km', e.target.value)} />
              {errorMsg('km')}
            </div>
          </div>

          {/* Combustible y transmisión */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>COMBUSTIBLE</label>
              <select className="input-pub" style={{...inputStyle('combustible'), cursor: 'pointer'}} value={form.combustible} onChange={(e) => updateForm('combustible', e.target.value)}>
                <option value="">Selecciona</option>
                <option>Bencina</option><option>Diésel</option>
                <option>Eléctrico</option><option>Híbrido</option>
              </select>
              {errorMsg('combustible')}
            </div>
            <div>
              <label style={labelStyle}>TRANSMISIÓN</label>
              <select className="input-pub" style={{...inputStyle('transmision'), cursor: 'pointer'}} value={form.transmision} onChange={(e) => updateForm('transmision', e.target.value)}>
                <option value="">Selecciona</option>
                <option>Automático</option><option>Manual</option>
              </select>
              {errorMsg('transmision')}
            </div>
          </div>

          {/* Precio y región */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <div>
              <label style={labelStyle}>PRECIO (en pesos)</label>
              {/* inputMode="numeric" muestra teclado numérico en móvil */}
              <input className="input-pub" style={inputStyle('precio')} type="text" inputMode="numeric" placeholder="Ej: 12.000.000" value={form.precio} onChange={(e) => handlePrecioChange(e.target.value)} />
              {errorMsg('precio')}
            </div>
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
          </div>

          {/* Comuna — solo visible cuando hay región seleccionada */}
          {form.region && (
            <div>
              <label style={labelStyle}>COMUNA</label>
              <select className="input-pub" style={{...inputStyle('comuna'), cursor: 'pointer'}} value={form.comuna} onChange={(e) => updateForm('comuna', e.target.value)}>
                <option value="">Selecciona la comuna</option>
                {(COMUNAS[form.region] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errorMsg('comuna')}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label style={labelStyle}>DESCRIPCIÓN</label>
            <textarea
              className="input-pub"
              placeholder="Describe tu auto con todo el detalle que quieras..."
              value={form.descripcion}
              onChange={(e) => updateForm('descripcion', e.target.value)}
              style={{...inputStyle('descripcion'), minHeight: '120px', resize: 'vertical', lineHeight: 1.6}}
            />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '4px'}}>
              {errores.descripcion && <p style={{fontSize: '12px', color: '#dc2626'}}>⚠ {errores.descripcion}</p>}
              <p style={{fontSize: '12px', color: form.descripcion.length > 900 ? '#f59e0b' : '#aaa', marginLeft: 'auto'}}>
                {form.descripcion.length}/1000
              </p>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label style={labelStyle}>FOTOS <span style={{color: '#aaa', fontWeight: '400'}}>(mínimo 3, máximo 10)</span></label>

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
              {fotos.length} de 10 fotos · {fotos.length < 3 ? `Faltan ${3 - fotos.length} para el mínimo` : '✓ Mínimo cumplido'}
            </p>
            {errores.fotos && (
              <p style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>⚠ {errores.fotos}</p>
            )}
          </div>

          {/* Precio negociable */}
          <div onClick={() => updateForm('negociable', !form.negociable)} style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 0'}}>
            <div style={{width: '20px', height: '20px', borderRadius: '5px', border: form.negociable ? '2px solid #2563eb' : '2px solid #ddd', background: form.negociable ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s'}}>
              {form.negociable && <span style={{color: '#fff', fontSize: '12px', fontWeight: '700'}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>Precio negociable</div>
              <div style={{fontSize: '12px', color: '#888'}}>Los compradores sabrán que pueden hacer una oferta</div>
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
            {cargando ? 'Publicando...' : 'Publicar auto'}
          </button>

        </div>
      </div>
    </main>
    </ProtegerRuta>
  )
}
