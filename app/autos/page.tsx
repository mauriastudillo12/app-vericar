// Página de feed de autos
// Lee autos reales desde Supabase con filtros funcionales
// Recibe el parámetro q desde el buscador del inicio
// Botón Contactar redirige al chat con el vendedor
// Solo usuarios verificados pueden contactar

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { getNombreRegion } from '../lib/regiones'

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

function AutosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [autos, setAutos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [perfilVerificado, setPerfilVerificado] = useState(false)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [region, setRegion] = useState('')
  const [comuna, setComuna] = useState('')
  const [combustible, setCombustible] = useState('')
  const [transmision, setTransmision] = useState('')
  const [negociable, setNegociable] = useState(false)

  const comunasDisponibles = region ? (COMUNAS[region] || []) : []

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('verificado')
          .eq('id', session.user.id)
          .single()
        setPerfilVerificado(perfil?.verificado || false)
      }
    })
    const q = searchParams.get('q')
    if (q) setBusqueda(q)
    cargarAutos(q || '')
  }, [])

  const cargarAutos = async (busquedaParam?: string) => {
    setCargando(true)
    const textoBusqueda = busquedaParam !== undefined ? busquedaParam : busqueda
    let query = supabase.from('autos').select('*')
    if (region) query = query.eq('region', region)
    if (comuna) query = query.eq('comuna', comuna)
    if (combustible) query = query.eq('combustible', combustible)
    if (transmision) query = query.eq('transmision', transmision)
    if (negociable) query = query.eq('negociable', true)
    if (textoBusqueda) query = query.ilike('nombre', `%${textoBusqueda}%`)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) console.error('Error:', error)
    else setAutos(data || [])
    setCargando(false)
  }

  const limpiarFiltros = () => {
    setRegion(''); setComuna(''); setCombustible('')
    setTransmision(''); setNegociable(false); setBusqueda('')
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

  const panelFiltros = (
    <div style={{padding: '24px 20px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
        <h3 style={{fontSize: '15px', fontWeight: '700', color: '#000'}}>Filtros</h3>
        <button onClick={limpiarFiltros} style={{fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600'}}>
          Limpiar todo
        </button>
      </div>

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>REGIÓN</label>
        <select style={selectStyle} value={region} onChange={(e) => { setRegion(e.target.value); setComuna('') }}>
          <option value="">Todas las regiones</option>
          {REGIONES.map((r) => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
        </select>
      </div>

      {region && (
        <div style={{marginBottom: '18px'}}>
          <label style={labelStyle}>COMUNA</label>
          <select style={selectStyle} value={comuna} onChange={(e) => setComuna(e.target.value)}>
            <option value="">Todas las comunas</option>
            {comunasDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>MARCA</label>
        <select style={selectStyle}>
          <option value="">Todas las marcas</option>
          <option>Toyota</option><option>Mazda</option><option>Hyundai</option>
          <option>Kia</option><option>Chevrolet</option><option>Honda</option>
          <option>Nissan</option><option>Suzuki</option><option>BYD</option>
          <option>Ford</option><option>Volkswagen</option><option>Mitsubishi</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>CARROCERÍA</label>
        <select style={selectStyle}>
          <option value="">Todas</option>
          <option>Sedán</option><option>SUV</option><option>Hatchback</option>
          <option>Pickup</option><option>Furgón</option><option>Coupé</option>
          <option>Station Wagon</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>AÑO</label>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
          <select style={selectStyle}>
            <option value="">Desde</option>
            <option>2024</option><option>2022</option><option>2020</option>
            <option>2018</option><option>2015</option><option>2010</option>
          </select>
          <select style={selectStyle}>
            <option value="">Hasta</option>
            <option>2025</option><option>2023</option><option>2021</option>
            <option>2019</option><option>2017</option>
          </select>
        </div>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>PRECIO</label>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
          <select style={selectStyle}>
            <option value="">Desde</option>
            <option>$3.000.000</option><option>$5.000.000</option>
            <option>$8.000.000</option><option>$10.000.000</option>
          </select>
          <select style={selectStyle}>
            <option value="">Hasta</option>
            <option>$10.000.000</option><option>$15.000.000</option>
            <option>$20.000.000</option><option>$30.000.000</option>
          </select>
        </div>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>KILOMETRAJE MÁXIMO</label>
        <select style={selectStyle}>
          <option value="">Sin límite</option>
          <option>10.000 km</option><option>30.000 km</option>
          <option>50.000 km</option><option>80.000 km</option>
          <option>100.000 km</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>COMBUSTIBLE</label>
        <select style={selectStyle} value={combustible} onChange={(e) => setCombustible(e.target.value)}>
          <option value="">Todos</option>
          <option>Bencina</option><option>Diésel</option>
          <option>Eléctrico</option><option>Híbrido</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>TRANSMISIÓN</label>
        <select style={selectStyle} value={transmision} onChange={(e) => setTransmision(e.target.value)}>
          <option value="">Todas</option>
          <option>Automático</option><option>Manual</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '18px'}}>
        <label style={labelStyle}>CILINDRADA</label>
        <select style={selectStyle}>
          <option value="">Todas</option>
          <option>Menos de 1.000 cc</option><option>1.000 — 1.600 cc</option>
          <option>1.600 — 2.000 cc</option><option>2.000 — 2.500 cc</option>
          <option>Más de 2.500 cc</option>
        </select>
      </div>

      {separador}

      <div style={{marginBottom: '24px'}}>
        <label style={labelStyle}>OPCIONES</label>
        <div onClick={() => setNegociable(!negociable)} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 0'}}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '4px',
            border: negociable ? '2px solid #2563eb' : '2px solid #ddd',
            background: negociable ? '#2563eb' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}>
            {negociable && <span style={{color: '#fff', fontSize: '11px', fontWeight: '700'}}>✓</span>}
          </div>
          <span style={{fontSize: '13px', color: '#333'}}>Solo negociables</span>
        </div>
      </div>

      <button onClick={() => { cargarAutos(); setFiltrosAbiertos(false) }} style={{
        width: '100%', background: '#2563eb', color: '#fff',
        border: 'none', padding: '13px', borderRadius: '10px',
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
      }}>
        Aplicar filtros
      </button>
    </div>
  )

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .car-card { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .car-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(37,99,235,0.12) !important; }
        .btn-contactar { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.05); }
        .input-buscar:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .btn-buscar-main { transition: background 0.2s, transform 0.15s; }
        .btn-buscar-main:hover { background: #1d4ed8 !important; }

        .filtros-desktop { display: block; }
        .filtros-btn-movil { display: none; }
        .autos-grid { grid-template-columns: repeat(3, 1fr) !important; }

        @media (max-width: 768px) {
          .filtros-desktop { display: none !important; }
          .filtros-btn-movil { display: flex !important; }
          .autos-grid { grid-template-columns: 1fr !important; }
          .buscador-bar { padding: 12px 16px !important; }
          .autos-content { padding: 16px !important; }
        }
      `}</style>

      <Navbar activa="Autos" />

      <div style={{paddingTop: '104px'}}>

        {/* Buscador superior */}
        <div className="buscador-bar" style={{background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 40px', display: 'flex', gap: '12px'}}>
          <input
            type="text"
            placeholder="Buscar marca, modelo, año..."
            className="input-buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarAutos()}
            style={{flex: 1, padding: '12px 20px', fontSize: '14px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', outline: 'none'}}
          />
          <button className="btn-buscar-main" onClick={() => cargarAutos()} style={{
            background: '#2563eb', color: '#fff', border: 'none',
            padding: '12px 32px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
          }}>
            Buscar
          </button>
        </div>

        {/* Drawer de filtros en móvil */}
        {filtrosAbiertos && (
          <div onClick={() => setFiltrosAbiertos(false)} style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200}}>
            <div onClick={(e) => e.stopPropagation()} style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '80%', maxWidth: '320px', background: '#fff', overflowY: 'auto'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0'}}>
                <h3 style={{fontSize: '16px', fontWeight: '800', color: '#000'}}>Filtros</h3>
                <button onClick={() => setFiltrosAbiertos(false)} style={{background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888'}}>✕</button>
              </div>
              {panelFiltros}
            </div>
          </div>
        )}

        <div style={{display: 'flex'}}>

          {/* Panel lateral desktop */}
          <div className="filtros-desktop" style={{width: '260px', minWidth: '260px', background: '#fff', borderRight: '1px solid #e5e5e5', minHeight: 'calc(100vh - 104px)'}}>
            {panelFiltros}
          </div>

          {/* Contenido principal */}
          <div className="autos-content" style={{flex: 1, padding: '24px 32px'}}>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px'}}>
              <p style={{fontSize: '14px', color: '#888'}}>
                <span style={{fontWeight: '700', color: '#000'}}>{autos.length} autos</span> disponibles
              </p>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <button className="filtros-btn-movil" onClick={() => setFiltrosAbiertos(true)} style={{display: 'none', background: '#fff', border: '1.5px solid #e5e5e5', color: '#333', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', alignItems: 'center', gap: '6px'}}>
                  ⚙️ Filtros
                </button>
                <select style={{padding: '8px 16px', fontSize: '13px', border: '1.5px solid #e5e5e5', borderRadius: '8px', background: '#fff', color: '#333', cursor: 'pointer', outline: 'none'}}>
                  <option>Más recientes</option>
                  <option>Menor precio</option>
                  <option>Mayor precio</option>
                </select>
              </div>
            </div>

            {cargando ? (
              <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>Cargando autos...</div>
            ) : autos.length === 0 ? (
              <div style={{textAlign: 'center', padding: '60px'}}>
                <div style={{fontSize: '40px', marginBottom: '16px'}}>🔍</div>
                <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px'}}>No encontramos autos</p>
                <p style={{fontSize: '14px', color: '#888'}}>Intenta con otros filtros</p>
              </div>
            ) : (
              <div className="autos-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                {autos.map((auto) => (
                  <Link key={auto.id} href={`/autos/${auto.id}`} style={{textDecoration: 'none'}}>
                    <div className="car-card" style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer'}}>

                      <div style={{width: '100%', height: '180px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
                        {auto.negociable && (
                          <div style={{position: 'absolute', top: '10px', right: '10px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', zIndex: 1}}>
                            Negociable
                          </div>
                        )}
                        {(() => {
                          const fotosArray = typeof auto.fotos === 'string' && auto.fotos
                            ? JSON.parse(auto.fotos) : auto.fotos
                          return fotosArray && fotosArray.length > 0
                            ? <img src={fotosArray[0]} alt={auto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0}} />
                            : <span style={{fontSize: '44px'}}>🚗</span>
                        })()}
                      </div>

                      <div style={{padding: '16px 18px'}}>
                        <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '3px'}}>{auto.nombre}</div>
                        <div style={{fontSize: '12px', color: '#888', marginBottom: '12px'}}>
                          {auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}
                        </div>
                        <div style={{fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '14px'}}>
                          {formatPrecio(auto.precio)}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f0f0f0'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                            <span style={{fontSize: '12px', color: '#888'}}>{getNombreRegion(auto.region)}</span>
                          </div>
                          <button
                            className="btn-contactar"
                            onClick={(e) => {
                              e.preventDefault()
                              if (!usuario) {
                                router.push('/login')
                              } else if (!perfilVerificado) {
                                router.push('/verificar?origen=autos')
                              } else {
                                router.push(`/chat?auto_id=${auto.id}&vendedor_id=${auto.vendedor_id}`)
                              }
                            }}
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

export default function Autos() {
  return (
    <Suspense fallback={<div style={{paddingTop: '104px', textAlign: 'center', color: '#888'}}>Cargando...</div>}>
      <AutosContent />
    </Suspense>
  )
}