// Página de repuestos y más
// Feed con filtros lateral + regiones y comunas de Chile integradas
// Cada tarjeta lleva al detalle del repuesto

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { getNombreRegion } from '../lib/regiones'

// Categorías de repuestos disponibles
const categorias = ['Motor', 'Carrocería', 'Frenos', 'Eléctrico', 'Interior', 'Neumáticos', 'Accesorios', 'Otros']

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
  '13': ['Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Maipú', 'La Florida', 'Pudahuel', 'Quilicura', 'Peñalolén', 'La Pintana', 'San Bernardo', 'Puente Alto'],
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

export default function Repuestos() {

  // Estados para los repuestos y carga
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  // Estados para los filtros
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [region, setRegion] = useState('')
  const [comuna, setComuna] = useState('')
  const [estado, setEstado] = useState('')
  const [garantia, setGarantia] = useState(false)

  // Comunas disponibles según región seleccionada
  const comunasDisponibles = region ? (COMUNAS[region] || []) : []

  // Cargar repuestos al inicio
  useEffect(() => { cargarRepuestos() }, [])

  // Cargar repuestos desde Supabase con los filtros aplicados
  const cargarRepuestos = async () => {
    setCargando(true)
    let query = supabase.from('repuestos').select('*')
    if (categoria) query = query.eq('categoria', categoria)
    if (region) query = query.eq('region', region)
    if (comuna) query = query.eq('comuna', comuna)
    if (estado) query = query.eq('estado', estado)
    if (garantia) query = query.eq('garantia', true)
    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) console.error('Error:', error)
    else setRepuestos(data || [])
    setCargando(false)
  }

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setCategoria('')
    setRegion('')
    setComuna('')
    setEstado('')
    setGarantia(false)
    setBusqueda('')
  }

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: '13px',
    border: '1.5px solid #e5e5e5', borderRadius: '8px',
    background: '#fafafa', color: '#333', cursor: 'pointer', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: '700', color: '#555',
    letterSpacing: '0.5px', display: 'block', marginBottom: '6px',
  }

  const separador = <div style={{height: '1px', background: '#f0f0f0', margin: '4px 0 18px'}} />

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .rep-card { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .rep-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(37,99,235,0.12) !important; }
        .btn-contactar { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.05); }
        .input-buscar:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .cat-pill { transition: all 0.2s; cursor: pointer; }
        .cat-pill:hover { background: #eff6ff !important; color: #2563eb !important; border-color: #2563eb !important; }
        .btn-limpiar:hover { color: #2563eb !important; }
        .btn-aplicar { transition: background 0.2s; }
        .btn-aplicar:hover { background: #1d4ed8 !important; }
        select:focus { border: 1.5px solid #2563eb !important; outline: none; }
      `}</style>

      {/* Navbar con tab Repuestos activa */}
      <Navbar activa="Repuestos y más" />

      <div style={{paddingTop: '104px'}}>

        {/* Buscador superior */}
        <div style={{background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 40px', display: 'flex', gap: '12px'}}>
          <input
            type="text"
            placeholder="Buscar repuesto, marca, modelo..."
            className="input-buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarRepuestos()}
            style={{flex: 1, padding: '12px 20px', fontSize: '14px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', outline: 'none'}}
          />
          <button onClick={cargarRepuestos} style={{background: '#2563eb', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
            Buscar
          </button>
        </div>

        {/* Pills de categorías con scroll horizontal */}
        <div style={{background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '12px 40px', display: 'flex', gap: '8px', overflowX: 'auto'}}>
          <div className="cat-pill" onClick={() => setCategoria('')} style={{background: categoria === '' ? '#2563eb' : '#fff', color: categoria === '' ? '#fff' : '#666', border: `1.5px solid ${categoria === '' ? '#2563eb' : '#e5e5e5'}`, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'}}>
            Todos
          </div>
          {categorias.map((cat) => (
            <div key={cat} className="cat-pill" onClick={() => setCategoria(cat)} style={{background: categoria === cat ? '#2563eb' : '#fff', color: categoria === cat ? '#fff' : '#666', border: `1.5px solid ${categoria === cat ? '#2563eb' : '#e5e5e5'}`, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap'}}>
              {cat}
            </div>
          ))}
        </div>

        {/* Layout: panel lateral + grid */}
        <div style={{display: 'flex'}}>

          {/* Panel de filtros */}
          <div style={{width: '260px', minWidth: '260px', background: '#fff', borderRight: '1px solid #e5e5e5', padding: '24px 20px', minHeight: 'calc(100vh - 160px)'}}>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
              <h3 style={{fontSize: '15px', fontWeight: '700', color: '#000'}}>Filtros</h3>
              <button className="btn-limpiar" onClick={limpiarFiltros} style={{fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s'}}>
                Limpiar todo
              </button>
            </div>

            {/* Región */}
            <div style={{marginBottom: '18px'}}>
              <label style={labelStyle}>REGIÓN</label>
              <select style={selectStyle} value={region} onChange={(e) => { setRegion(e.target.value); setComuna('') }}>
                <option value="">Todas las regiones</option>
                {REGIONES.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
            </div>

            {/* Comuna — solo visible cuando hay región */}
            {region && (
              <div style={{marginBottom: '18px'}}>
                <label style={labelStyle}>COMUNA</label>
                <select style={selectStyle} value={comuna} onChange={(e) => setComuna(e.target.value)}>
                  <option value="">Todas las comunas</option>
                  {comunasDisponibles.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {separador}

            {/* Marca compatible */}
            <div style={{marginBottom: '18px'}}>
              <label style={labelStyle}>MARCA COMPATIBLE</label>
              <select style={selectStyle}>
                <option value="">Todas las marcas</option>
                <option>Toyota</option><option>Mazda</option><option>Hyundai</option>
                <option>Kia</option><option>Chevrolet</option><option>Honda</option>
                <option>Nissan</option><option>Suzuki</option><option>BYD</option>
                <option>Ford</option><option>Volkswagen</option>
              </select>
            </div>

            {separador}

            {/* Estado */}
            <div style={{marginBottom: '18px'}}>
              <label style={labelStyle}>ESTADO</label>
              <select style={selectStyle} value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option>Nuevo</option>
                <option>Usado</option>
              </select>
            </div>

            {separador}

            {/* Precio */}
            <div style={{marginBottom: '18px'}}>
              <label style={labelStyle}>PRECIO</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                <select style={selectStyle}>
                  <option value="">Desde</option>
                  <option>$10.000</option><option>$50.000</option>
                  <option>$100.000</option><option>$200.000</option>
                </select>
                <select style={selectStyle}>
                  <option value="">Hasta</option>
                  <option>$50.000</option><option>$100.000</option>
                  <option>$300.000</option><option>$500.000</option>
                </select>
              </div>
            </div>

            {separador}

            {/* Garantía */}
            <div style={{marginBottom: '24px'}}>
              <label style={labelStyle}>OPCIONES</label>
              <div onClick={() => setGarantia(!garantia)} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0'}}>
                <div style={{width: '18px', height: '18px', borderRadius: '4px', border: garantia ? '2px solid #2563eb' : '2px solid #ddd', background: garantia ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s'}}>
                  {garantia && <span style={{color: '#fff', fontSize: '11px', fontWeight: '700'}}>✓</span>}
                </div>
                <span style={{fontSize: '13px', color: '#333'}}>Con garantía</span>
              </div>
            </div>

            <button className="btn-aplicar" onClick={cargarRepuestos} style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
              Aplicar filtros
            </button>

          </div>

          {/* Grid de tarjetas */}
          <div style={{flex: 1, padding: '24px 32px'}}>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
              <p style={{fontSize: '14px', color: '#888'}}>
                <span style={{fontWeight: '700', color: '#000'}}>{repuestos.length} repuestos</span> disponibles
              </p>
              <select style={{padding: '8px 16px', fontSize: '13px', border: '1.5px solid #e5e5e5', borderRadius: '8px', background: '#fff', color: '#333', cursor: 'pointer', outline: 'none'}}>
                <option>Más recientes</option>
                <option>Menor precio</option>
                <option>Mayor precio</option>
              </select>
            </div>

            {cargando ? (
              <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>Cargando repuestos...</div>
            ) : repuestos.length === 0 ? (
              <div style={{textAlign: 'center', padding: '60px'}}>
                <div style={{fontSize: '40px', marginBottom: '16px'}}>🔧</div>
                <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px'}}>No encontramos repuestos</p>
                <p style={{fontSize: '14px', color: '#888'}}>Intenta con otros filtros</p>
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                {repuestos.map((rep) => (

                  // Link que envuelve la tarjeta para navegar al detalle
                  <Link key={rep.id} href={`/repuestos/${rep.id}`} style={{textDecoration: 'none'}}>
                    <div className="rep-card" style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer'}}>

                      {/* Imagen del repuesto */}
                      <div style={{width: '100%', height: '160px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>

                        {/* Badge estado */}
                        <div style={{position: 'absolute', top: '10px', left: '10px', background: rep.estado === 'Nuevo' ? '#2563eb' : '#333', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', zIndex: 1}}>
                          {rep.estado}
                        </div>

                        {/* Badge garantía */}
                        {rep.garantia && (
                          <div style={{position: 'absolute', top: '10px', right: '10px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', zIndex: 1}}>
                            Con garantía
                          </div>
                        )}

                        {/* Foto real o placeholder */}
                        {(() => {
                          const fotosArray = typeof rep.fotos === 'string' && rep.fotos ? JSON.parse(rep.fotos) : rep.fotos
                          return fotosArray && fotosArray.length > 0
                            ? <img src={fotosArray[0]} alt={rep.nombre} style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0}} />
                            : <span style={{fontSize: '40px'}}>🔧</span>
                        })()}
                      </div>

                      {/* Cuerpo de la tarjeta */}
                      <div style={{padding: '16px 18px'}}>

                        {/* Badge categoría */}
                        <div style={{display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', marginBottom: '8px', letterSpacing: '0.5px'}}>
                          {rep.categoria}
                        </div>

                        {/* Nombre */}
                        <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '3px'}}>{rep.nombre}</div>

                        {/* Compatibilidad */}
                        <div style={{fontSize: '12px', color: '#888', marginBottom: '12px'}}>
                          Compatible: {rep.marca_compatible} {rep.modelo_compatible}
                        </div>

                        {/* Precio */}
                        <div style={{fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '14px'}}>
                          {formatPrecio(rep.precio)}
                        </div>

                        {/* Footer: región y botón */}
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f0f0f0'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                            <span style={{fontSize: '12px', color: '#888'}}>{getNombreRegion(rep.region)}</span>
                          </div>
                          <button
                            className="btn-contactar"
                            onClick={(e) => e.preventDefault()}
                            style={{background: '#2563eb', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'}}
                          >
                            Contactar
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}