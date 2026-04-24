// Página de talleres
// Feed con filtros lateral + tarjetas de talleres
// Gratis al principio — en el futuro los destacados pagan

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
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

const SERVICIOS = ['Mantención', 'Frenos', 'Suspensión', 'Electricidad', 'Pintura', 'Diagnóstico', 'Aire acondicionado', 'Transmisión']

export default function Talleres() {

  const [talleres, setTalleres] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [region, setRegion] = useState('')
  const [comuna, setComuna] = useState('')
  const [servicio, setServicio] = useState('')

  const router = useRouter()
  const comunasDisponibles = region ? (COMUNAS[region] || []) : []

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
    })
    cargarTalleres()
  }, [])

  const cargarTalleres = async () => {
    setCargando(true)
    let query = supabase.from('talleres').select('*')
    if (region) query = query.eq('region', region)
    if (comuna) query = query.eq('comuna', comuna)
    if (servicio) query = query.ilike('servicios', `%${servicio}%`)
    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) console.error('Error:', error)
    else setTalleres(data || [])
    setCargando(false)
  }

  const limpiarFiltros = () => {
    setRegion(''); setComuna(''); setServicio(''); setBusqueda('')
  }

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

  // Panel de filtros reutilizado en desktop y drawer móvil
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

      <div style={{marginBottom: '24px'}}>
        <label style={labelStyle}>SERVICIO</label>
        <select style={selectStyle} value={servicio} onChange={(e) => setServicio(e.target.value)}>
          <option value="">Todos los servicios</option>
          {SERVICIOS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <button onClick={() => { cargarTalleres(); setFiltrosAbiertos(false) }} style={{
        width: '100%', background: '#2563eb', color: '#fff',
        border: 'none', padding: '13px', borderRadius: '10px',
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        marginBottom: '16px',
      }}>
        Aplicar filtros
      </button>

      {separador}

      {/* Banner registrar taller */}
      <div style={{background: '#f0f9ff', borderRadius: '12px', padding: '20px', border: '1px solid #bae6fd'}}>
        <div style={{fontSize: '20px', marginBottom: '8px'}}>🏪</div>
        <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '6px'}}>
          ¿Tienes un taller?
        </h3>
        <p style={{fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.6}}>
          Regístralo gratis y llega a miles de clientes en tu zona
        </p>
        <button
          onClick={() => router.push('/registrar-taller')}
          style={{
            width: '100%', background: '#2563eb', color: '#fff',
            border: 'none', padding: '10px', borderRadius: '8px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          Registrar mi taller
        </button>
      </div>
    </div>
  )

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .taller-card { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .taller-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(37,99,235,0.12) !important; }
        .btn-contactar { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.05); }
        .input-buscar:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .servicio-pill { transition: all 0.2s; cursor: pointer; }
        .servicio-pill:hover { background: #eff6ff !important; color: #2563eb !important; border-color: #2563eb !important; }

        .filtros-desktop { display: block; }
        .filtros-btn-movil { display: none; }
        .talleres-grid { grid-template-columns: repeat(3, 1fr) !important; }

        @media (max-width: 768px) {
          .filtros-desktop { display: none !important; }
          .filtros-btn-movil { display: flex !important; }
          .talleres-grid { grid-template-columns: 1fr !important; }
          .buscador-bar { padding: 12px 16px !important; }
          .talleres-content { padding: 16px !important; }
          .pills-bar { padding: 12px 16px !important; }
        }
      `}</style>

      <Navbar activa="Talleres" />

      <div style={{paddingTop: '104px'}}>

        {/* Buscador superior */}
        <div className="buscador-bar" style={{background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 40px', display: 'flex', gap: '12px'}}>
          <input
            type="text"
            placeholder="Buscar taller por nombre..."
            className="input-buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargarTalleres()}
            style={{flex: 1, padding: '12px 20px', fontSize: '14px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', outline: 'none'}}
          />
          <button onClick={cargarTalleres} style={{background: '#2563eb', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}>
            Buscar
          </button>
        </div>

        {/* Pills de servicios */}
        <div className="pills-bar" style={{background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '12px 40px', display: 'flex', gap: '8px', overflowX: 'auto'}}>
          <div className="servicio-pill" onClick={() => setServicio('')} style={{background: servicio === '' ? '#2563eb' : '#fff', color: servicio === '' ? '#fff' : '#666', border: `1.5px solid ${servicio === '' ? '#2563eb' : '#e5e5e5'}`, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'}}>
            Todos
          </div>
          {SERVICIOS.map((s) => (
            <div key={s} className="servicio-pill" onClick={() => setServicio(s)} style={{background: servicio === s ? '#2563eb' : '#fff', color: servicio === s ? '#fff' : '#666', border: `1.5px solid ${servicio === s ? '#2563eb' : '#e5e5e5'}`, padding: '6px 16px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap'}}>
              {s}
            </div>
          ))}
        </div>

        {/* Drawer filtros móvil */}
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
          <div className="filtros-desktop" style={{width: '260px', minWidth: '260px', background: '#fff', borderRight: '1px solid #e5e5e5', minHeight: 'calc(100vh - 160px)'}}>
            {panelFiltros}
          </div>

          {/* Contenido principal */}
          <div className="talleres-content" style={{flex: 1, padding: '24px 32px'}}>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
              <p style={{fontSize: '14px', color: '#888'}}>
                <span style={{fontWeight: '700', color: '#000'}}>{talleres.length} talleres</span> disponibles
              </p>
              {/* Botón filtros móvil */}
              <button
                className="filtros-btn-movil"
                onClick={() => setFiltrosAbiertos(true)}
                style={{
                  display: 'none', background: '#fff',
                  border: '1.5px solid #e5e5e5', color: '#333',
                  padding: '8px 16px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  alignItems: 'center', gap: '6px',
                }}
              >
                ⚙️ Filtros
              </button>
            </div>

            {cargando ? (
              <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>Cargando talleres...</div>
            ) : talleres.length === 0 ? (
              <div style={{textAlign: 'center', padding: '60px'}}>
                <div style={{fontSize: '40px', marginBottom: '16px'}}>🏪</div>
                <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '8px'}}>No encontramos talleres</p>
                <p style={{fontSize: '14px', color: '#888'}}>Intenta con otros filtros</p>
              </div>
            ) : (
              <div className="talleres-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                {talleres.map((taller) => (
                  <div key={taller.id} className="taller-card" onClick={() => router.push(`/talleres/${taller.id}`)} style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer'}}>

                    <div style={{width: '100%', height: '160px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
                      {taller.foto_url
                        ? <img src={taller.foto_url} alt={taller.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        : <span style={{fontSize: '44px'}}>🏪</span>
                      }
                    </div>

                    <div style={{padding: '16px 18px'}}>
                      <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{taller.nombre}</div>
                      <div style={{fontSize: '12px', color: '#888', marginBottom: '10px'}}>📍 {taller.direccion} · {getNombreRegion(taller.region)}</div>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px'}}>
                        {taller.servicios?.split(',').slice(0, 3).map((s: string) => (
                          <div key={s} style={{background: '#eff6ff', color: '#2563eb', fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px'}}>
                            {s.trim()}
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize: '12px', color: '#888', marginBottom: '14px'}}>🕐 {taller.horario}</div>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f0f0f0'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                          <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                          <span style={{fontSize: '12px', color: '#888'}}>{taller.comuna}</span>
                        </div>
                        <button className="btn-contactar" onClick={(e) => { e.stopPropagation(); router.push(`/chat?vendedor_id=${taller.propietario_id}`) }} style={{background: '#2563eb', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'}}>
                          Contactar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}