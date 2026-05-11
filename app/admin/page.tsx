// Panel de administración de VeriCar
// Solo accesible para usuarios con es_admin = true
// Gestiona usuarios, publicaciones, destacados y verificaciones de identidad
// Verificaciones: busca verificacion_pendiente = true, aprueba/rechaza manualmente

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Admin() {

  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [tabActiva, setTabActiva] = useState<'stats' | 'verificaciones' | 'autos' | 'repuestos' | 'talleres' | 'usuarios'>('stats')

  const [stats, setStats] = useState({ autos: 0, repuestos: 0, talleres: 0, usuarios: 0, pendientes: 0 })
  const [autos, setAutos] = useState<any[]>([])
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [talleres, setTalleres] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [verificacionesPendientes, setVerificacionesPendientes] = useState<any[]>([])

  useEffect(() => {
    const verificarAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('es_admin')
        .eq('id', session.user.id)
        .single()

      if (!perfil?.es_admin) { router.push('/'); return }

      await cargarTodo()
      setCargando(false)
    }

    verificarAdmin()
  }, [])

  const cargarTodo = async () => {

    // Cargar verificaciones pendientes — usuarios con verificacion_pendiente = true
    const { data: pendientesData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('verificado', false)
      .eq('verificacion_pendiente', true)

    setVerificacionesPendientes(pendientesData || [])

    // Stats
    const [autosRes, repuestosRes, talleresRes, usuariosRes] = await Promise.all([
      supabase.from('autos').select('id', { count: 'exact' }),
      supabase.from('repuestos').select('id', { count: 'exact' }),
      supabase.from('talleres').select('id', { count: 'exact' }),
      supabase.from('perfiles').select('id', { count: 'exact' }),
    ])

    setStats({
      autos: autosRes.count || 0,
      repuestos: repuestosRes.count || 0,
      talleres: talleresRes.count || 0,
      usuarios: usuariosRes.count || 0,
      pendientes: (pendientesData || []).length,
    })

    // Autos
    const { data: autosData } = await supabase
      .from('autos').select('*').order('created_at', { ascending: false })
    setAutos(autosData || [])

    // Repuestos
    const { data: repuestosData } = await supabase
      .from('repuestos').select('*').order('created_at', { ascending: false })
    setRepuestos(repuestosData || [])

    // Talleres
    const { data: talleresData } = await supabase
      .from('talleres').select('*').order('created_at', { ascending: false })
    setTalleres(talleresData || [])

    // Usuarios
    const { data: usuariosData } = await supabase
      .from('perfiles').select('*')
    setUsuarios(usuariosData || [])
  }

  // Aprobar verificación — marca verificado y limpia pendiente
  const aprobarVerificacion = async (userId: string) => {
    await supabase.from('perfiles').update({
      verificado: true,
      verificacion_pendiente: false,
    }).eq('id', userId)
    setVerificacionesPendientes(prev => prev.filter(u => u.id !== userId))
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, verificado: true, verificacion_pendiente: false } : u))
    setStats(prev => ({ ...prev, pendientes: prev.pendientes - 1 }))
  }

  // Rechazar verificación — limpia pendiente para que pueda volver a intentarlo
  const rechazarVerificacion = async (userId: string) => {
    const confirmar = window.confirm('¿Rechazar esta solicitud? El usuario deberá enviar una nueva.')
    if (!confirmar) return
    await supabase.from('perfiles').update({
      verificacion_pendiente: false,
    }).eq('id', userId)
    setVerificacionesPendientes(prev => prev.filter(u => u.id !== userId))
    setStats(prev => ({ ...prev, pendientes: prev.pendientes - 1 }))
  }

  // Toggle destacado auto
  const toggleDestacadoAuto = async (id: string, actual: boolean) => {
    await supabase.from('autos').update({ destacado: !actual }).eq('id', id)
    setAutos(prev => prev.map(a => a.id === id ? { ...a, destacado: !actual } : a))
  }

  // Toggle destacado repuesto
  const toggleDestacadoRepuesto = async (id: string, actual: boolean) => {
    await supabase.from('repuestos').update({ destacado: !actual }).eq('id', id)
    setRepuestos(prev => prev.map(r => r.id === id ? { ...r, destacado: !actual } : r))
  }

  // Toggle destacado taller
  const toggleDestacadoTaller = async (id: string, actual: boolean) => {
    await supabase.from('talleres').update({ destacado: !actual }).eq('id', id)
    setTalleres(prev => prev.map(t => t.id === id ? { ...t, destacado: !actual } : t))
  }

  // Eliminar auto
  const eliminarAuto = async (id: string) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    await supabase.from('autos').delete().eq('id', id)
    setAutos(prev => prev.filter(a => a.id !== id))
    setStats(prev => ({ ...prev, autos: prev.autos - 1 }))
  }

  // Eliminar repuesto
  const eliminarRepuesto = async (id: string) => {
    if (!window.confirm('¿Eliminar este repuesto?')) return
    await supabase.from('repuestos').delete().eq('id', id)
    setRepuestos(prev => prev.filter(r => r.id !== id))
    setStats(prev => ({ ...prev, repuestos: prev.repuestos - 1 }))
  }

  // Eliminar taller
  const eliminarTaller = async (id: string) => {
    if (!window.confirm('¿Eliminar este taller?')) return
    await supabase.from('talleres').delete().eq('id', id)
    setTalleres(prev => prev.filter(t => t.id !== id))
    setStats(prev => ({ ...prev, talleres: prev.talleres - 1 }))
  }

  // Toggle verificado usuario — para aprobar/revocar manualmente desde la tabla de usuarios
  const toggleVerificado = async (id: string, actual: boolean) => {
    await supabase.from('perfiles').update({ verificado: !actual }).eq('id', id)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, verificado: !actual } : u))
  }

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  const tabStyle = (tab: string) => ({
    padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
    cursor: 'pointer', border: 'none',
    background: tabActiva === tab ? '#2563eb' : '#fff',
    color: tabActiva === tab ? '#fff' : '#888',
    transition: 'all 0.2s', position: 'relative' as const,
  })

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando panel...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .admin-row { transition: background 0.15s; }
        .admin-row:hover { background: #fafafa !important; }
        .btn-toggle-on { transition: all 0.2s; }
        .btn-toggle-on:hover { background: #f0fdf4 !important; }
        .btn-toggle-off { transition: all 0.2s; }
        .btn-toggle-off:hover { background: #eff6ff !important; }
        .btn-del { transition: all 0.2s; }
        .btn-del:hover { background: #fef2f2 !important; color: #dc2626 !important; border-color: #fecaca !important; }
        .btn-aprobar { transition: all 0.2s; }
        .btn-aprobar:hover { background: #15803d !important; }
        .btn-rechazar { transition: all 0.2s; }
        .btn-rechazar:hover { background: #fef2f2 !important; }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '104px', maxWidth: '1200px', margin: '0 auto', padding: '120px 40px 60px'}}>

        {/* Encabezado */}
        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '28px', fontWeight: '900', color: '#000', marginBottom: '6px'}}>
            Panel de administración
          </h1>
          <p style={{fontSize: '14px', color: '#888'}}>
            Gestiona publicaciones, destacados, verificaciones y usuarios de VeriCar
          </p>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap'}}>
          <button style={tabStyle('stats')} onClick={() => setTabActiva('stats')}>📊 Estadísticas</button>

          {/* Tab verificaciones con badge de pendientes */}
          <button style={tabStyle('verificaciones')} onClick={() => setTabActiva('verificaciones')}>
            🔐 Verificaciones
            {stats.pendientes > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: '#ef4444', color: '#fff',
                fontSize: '10px', fontWeight: '800',
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stats.pendientes}
              </span>
            )}
          </button>

          <button style={tabStyle('autos')} onClick={() => setTabActiva('autos')}>🚗 Autos ({stats.autos})</button>
          <button style={tabStyle('repuestos')} onClick={() => setTabActiva('repuestos')}>🔧 Repuestos ({stats.repuestos})</button>
          <button style={tabStyle('talleres')} onClick={() => setTabActiva('talleres')}>🏪 Talleres ({stats.talleres})</button>
          <button style={tabStyle('usuarios')} onClick={() => setTabActiva('usuarios')}>👥 Usuarios ({stats.usuarios})</button>
        </div>

        {/* Tab Estadísticas */}
        {tabActiva === 'stats' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px'}}>
            {[
              { label: 'Autos publicados', valor: stats.autos, icono: '🚗', color: '#eff6ff', borde: '#bfdbfe' },
              { label: 'Repuestos publicados', valor: stats.repuestos, icono: '🔧', color: '#f0fdf4', borde: '#bbf7d0' },
              { label: 'Talleres registrados', valor: stats.talleres, icono: '🏪', color: '#fefce8', borde: '#fde68a' },
              { label: 'Usuarios registrados', valor: stats.usuarios, icono: '👥', color: '#fdf4ff', borde: '#e9d5ff' },
              { label: 'Verificaciones pendientes', valor: stats.pendientes, icono: '🔐', color: '#fef2f2', borde: '#fecaca' },
            ].map((stat) => (
              <div key={stat.label} style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee', textAlign: 'center'}}>
                <div style={{width: '52px', height: '52px', borderRadius: '14px', background: stat.color, border: `1.5px solid ${stat.borde}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 14px'}}>
                  {stat.icono}
                </div>
                <div style={{fontSize: '32px', fontWeight: '900', color: '#000', marginBottom: '6px'}}>{stat.valor}</div>
                <div style={{fontSize: '12px', color: '#888', fontWeight: '500'}}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Verificaciones */}
        {tabActiva === 'verificaciones' && (
          <div style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>
                Solicitudes de verificación
              </h3>
              {stats.pendientes > 0 && (
                <span style={{background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fecaca'}}>
                  {stats.pendientes} pendiente{stats.pendientes > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {verificacionesPendientes.length === 0 ? (
              <div style={{padding: '48px', textAlign: 'center'}}>
                <div style={{fontSize: '40px', marginBottom: '12px'}}>✅</div>
                <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '6px'}}>No hay solicitudes pendientes</p>
                <p style={{fontSize: '14px', color: '#888'}}>Todas las solicitudes han sido procesadas</p>
              </div>
            ) : (
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{background: '#fafafa', borderBottom: '1px solid #f0f0f0'}}>
                    <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>USUARIO</th>
                    <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>RUT</th>
                    <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>FECHA SOLICITUD</th>
                    <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {verificacionesPendientes.map((u) => (
                    <tr key={u.id} className="admin-row" style={{borderBottom: '1px solid #f5f5f5'}}>
                      <td style={{padding: '14px 20px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0}}>
                            {u.nombre?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{u.nombre || 'Sin nombre'}</div>
                            <div style={{fontSize: '12px', color: '#aaa'}}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: '14px 20px'}}>
                        <span style={{fontSize: '14px', fontWeight: '700', color: '#000', background: '#f9f9f9', padding: '4px 12px', borderRadius: '6px', border: '1px solid #eee'}}>
                          {u.rut || '—'}
                        </span>
                      </td>
                      <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>
                        {new Date(u.created_at).toLocaleDateString('es-CL')}
                      </td>
                      <td style={{padding: '14px 20px', textAlign: 'center'}}>
                        <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                          <button
                            className="btn-aprobar"
                            onClick={() => aprobarVerificacion(u.id)}
                            style={{padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff'}}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            className="btn-rechazar"
                            onClick={() => rechazarVerificacion(u.id)}
                            style={{padding: '7px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #fecaca', background: '#fff', color: '#dc2626'}}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Autos */}
        {tabActiva === 'autos' && (
          <div style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid #f0f0f0'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>Todas las publicaciones de autos</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#fafafa', borderBottom: '1px solid #f0f0f0'}}>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>AUTO</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>PRECIO</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>REGIÓN</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>DESTACADO</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {autos.map((auto) => (
                  <tr key={auto.id} className="admin-row" style={{borderBottom: '1px solid #f5f5f5'}}>
                    <td style={{padding: '14px 20px'}}>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{auto.nombre}</div>
                      <div style={{fontSize: '12px', color: '#aaa'}}>{auto.km?.toLocaleString('es-CL')} km · {auto.combustible}</div>
                    </td>
                    <td style={{padding: '14px 20px', fontSize: '14px', fontWeight: '700', color: '#000'}}>{formatPrecio(auto.precio)}</td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>{auto.region}</td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <button
                        className={auto.destacado ? 'btn-toggle-on' : 'btn-toggle-off'}
                        onClick={() => toggleDestacadoAuto(auto.id, auto.destacado)}
                        style={{padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: auto.destacado ? '#f0fdf4' : '#f5f5f5', color: auto.destacado ? '#16a34a' : '#888'}}
                      >
                        {auto.destacado ? '★ Destacado' : 'Sin destacar'}
                      </button>
                    </td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        <Link href={`/autos/${auto.id}`} style={{textDecoration: 'none'}}>
                          <button style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#333'}}>Ver</button>
                        </Link>
                        <button className="btn-del" onClick={() => eliminarAuto(auto.id)} style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#888'}}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Repuestos */}
        {tabActiva === 'repuestos' && (
          <div style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid #f0f0f0'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>Todas las publicaciones de repuestos</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#fafafa', borderBottom: '1px solid #f0f0f0'}}>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>REPUESTO</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>PRECIO</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>CATEGORÍA</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>DESTACADO</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {repuestos.map((rep) => (
                  <tr key={rep.id} className="admin-row" style={{borderBottom: '1px solid #f5f5f5'}}>
                    <td style={{padding: '14px 20px'}}>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{rep.nombre}</div>
                      <div style={{fontSize: '12px', color: '#aaa'}}>{rep.marca_compatible} {rep.modelo_compatible}</div>
                    </td>
                    <td style={{padding: '14px 20px', fontSize: '14px', fontWeight: '700', color: '#000'}}>{formatPrecio(rep.precio)}</td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>{rep.categoria}</td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <button
                        className={rep.destacado ? 'btn-toggle-on' : 'btn-toggle-off'}
                        onClick={() => toggleDestacadoRepuesto(rep.id, rep.destacado)}
                        style={{padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: rep.destacado ? '#f0fdf4' : '#f5f5f5', color: rep.destacado ? '#16a34a' : '#888'}}
                      >
                        {rep.destacado ? '★ Destacado' : 'Sin destacar'}
                      </button>
                    </td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        <Link href={`/repuestos/${rep.id}`} style={{textDecoration: 'none'}}>
                          <button style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#333'}}>Ver</button>
                        </Link>
                        <button className="btn-del" onClick={() => eliminarRepuesto(rep.id)} style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#888'}}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Talleres */}
        {tabActiva === 'talleres' && (
          <div style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid #f0f0f0'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>Todos los talleres registrados</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#fafafa', borderBottom: '1px solid #f0f0f0'}}>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>TALLER</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>COMUNA</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>TELÉFONO</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>DESTACADO</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {talleres.map((taller) => (
                  <tr key={taller.id} className="admin-row" style={{borderBottom: '1px solid #f5f5f5'}}>
                    <td style={{padding: '14px 20px'}}>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{taller.nombre}</div>
                      <div style={{fontSize: '12px', color: '#aaa'}}>{taller.direccion}</div>
                    </td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>{taller.comuna}</td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>{taller.telefono}</td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <button
                        className={taller.destacado ? 'btn-toggle-on' : 'btn-toggle-off'}
                        onClick={() => toggleDestacadoTaller(taller.id, taller.destacado)}
                        style={{padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: taller.destacado ? '#f0fdf4' : '#f5f5f5', color: taller.destacado ? '#16a34a' : '#888'}}
                      >
                        {taller.destacado ? '★ Destacado' : 'Sin destacar'}
                      </button>
                    </td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        <Link href={`/talleres/${taller.id}`} style={{textDecoration: 'none'}}>
                          <button style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#333'}}>Ver</button>
                        </Link>
                        <button className="btn-del" onClick={() => eliminarTaller(taller.id)} style={{padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #e5e5e5', background: '#fff', color: '#888'}}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Usuarios */}
        {tabActiva === 'usuarios' && (
          <div style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid #f0f0f0'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>Todos los usuarios registrados</h3>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#fafafa', borderBottom: '1px solid #f0f0f0'}}>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>USUARIO</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>RUT</th>
                  <th style={{padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>FECHA</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ESTADO</th>
                  <th style={{padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#aaa', letterSpacing: '1px'}}>ADMIN</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="admin-row" style={{borderBottom: '1px solid #f5f5f5'}}>
                    <td style={{padding: '14px 20px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0}}>
                          {u.nombre?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{u.nombre || 'Sin nombre'}</div>
                          <div style={{fontSize: '12px', color: '#aaa'}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>{u.rut || '—'}</td>
                    <td style={{padding: '14px 20px', fontSize: '13px', color: '#888'}}>
                      {new Date(u.created_at).toLocaleDateString('es-CL')}
                    </td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      {/* Muestra pendiente si tiene solicitud en espera */}
                      {u.verificacion_pendiente && !u.verificado ? (
                        <span style={{fontSize: '12px', fontWeight: '700', color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fde68a'}}>
                          ⏳ Pendiente
                        </span>
                      ) : (
                        <button
                          className={u.verificado ? 'btn-toggle-on' : 'btn-toggle-off'}
                          onClick={() => toggleVerificado(u.id, u.verificado)}
                          style={{padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', background: u.verificado ? '#f0fdf4' : '#f5f5f5', color: u.verificado ? '#16a34a' : '#888'}}
                        >
                          {u.verificado ? '✓ Verificado' : 'Sin verificar'}
                        </button>
                      )}
                    </td>
                    <td style={{padding: '14px 20px', textAlign: 'center'}}>
                      {u.es_admin ? (
                        <span style={{fontSize: '12px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px'}}>Admin</span>
                      ) : (
                        <span style={{fontSize: '12px', color: '#ccc'}}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  )
}