// Página de perfil de usuario
// Muestra datos del usuario logueado y sus publicaciones de autos y repuestos
// Permite editar el nombre y eliminar publicaciones
// Tab de favoritos con autos guardados
// Sección de contacto WhatsApp con horario de atención configurable
// La card de WhatsApp tiene modo vista y modo edición

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { getNombreRegion } from '../lib/regiones'

export default function Perfil() {

  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [autos, setAutos] = useState<any[]>([])
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [favoritos, setFavoritos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [tabActiva, setTabActiva] = useState<'autos' | 'repuestos' | 'favoritos'>('autos')

  // Estados para editar nombre
  const [editando, setEditando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  // Estados para WhatsApp y horario de contacto
  const [whatsapp, setWhatsapp] = useState('')
  const [horarioInicio, setHorarioInicio] = useState(9)
  const [horarioFin, setHorarioFin] = useState(20)
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [editandoContacto, setEditandoContacto] = useState(false)

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUsuario(session.user)

      const { data: perfilData } = await supabase
        .from('perfiles').select('*').eq('id', session.user.id).single()
      setPerfil(perfilData)
      setNuevoNombre(perfilData?.nombre || '')

      // Cargar datos de contacto
      setWhatsapp(perfilData?.whatsapp || '')
      setHorarioInicio(perfilData?.horario_inicio ?? 9)
      setHorarioFin(perfilData?.horario_fin ?? 20)

      const { data: autosData } = await supabase
        .from('autos').select('*').eq('vendedor_id', session.user.id).order('created_at', { ascending: false })
      setAutos(autosData || [])

      const { data: repuestosData } = await supabase
        .from('repuestos').select('*').eq('vendedor_id', session.user.id).order('created_at', { ascending: false })
      setRepuestos(repuestosData || [])

      const { data: favoritosData } = await supabase
        .from('favoritos').select('*, autos(*)').eq('usuario_id', session.user.id).order('created_at', { ascending: false })
      setFavoritos(favoritosData || [])
      setCargando(false)
    }
    cargarPerfil()
  }, [])

  // Guardar nombre del perfil
  const guardarPerfil = async () => {
    if (!nuevoNombre.trim()) return
    setGuardando(true)
    const { error } = await supabase.from('perfiles').update({ nombre: nuevoNombre.trim() }).eq('id', usuario.id)
    if (!error) {
      setPerfil((prev: any) => ({ ...prev, nombre: nuevoNombre.trim() }))
      setEditando(false)
      setMensajeExito('Perfil actualizado correctamente')
      setTimeout(() => setMensajeExito(''), 3000)
    }
    setGuardando(false)
  }

  // Guardar WhatsApp y horario de contacto
  const guardarContacto = async () => {
    if (!whatsapp.trim()) return
    setGuardandoContacto(true)
    const { error } = await supabase.from('perfiles').update({
      whatsapp: whatsapp.trim(),
      horario_inicio: horarioInicio,
      horario_fin: horarioFin,
    }).eq('id', usuario.id)
    if (!error) {
      setPerfil((prev: any) => ({ ...prev, whatsapp: whatsapp.trim(), horario_inicio: horarioInicio, horario_fin: horarioFin }))
      setEditandoContacto(false) // Volver a modo vista
      setMensajeExito('Datos de contacto actualizados')
      setTimeout(() => setMensajeExito(''), 3000)
    }
    setGuardandoContacto(false)
  }

  const eliminarAuto = async (autoId: string) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    const { error } = await supabase.from('autos').delete().eq('id', autoId)
    if (!error) setAutos(prev => prev.filter(a => a.id !== autoId))
  }

  const eliminarRepuesto = async (repuestoId: string) => {
    if (!window.confirm('¿Eliminar este repuesto?')) return
    const { error } = await supabase.from('repuestos').delete().eq('id', repuestoId)
    if (!error) setRepuestos(prev => prev.filter(r => r.id !== repuestoId))
  }

  const quitarFavorito = async (autoId: string) => {
    await supabase.from('favoritos').delete().eq('usuario_id', usuario.id).eq('auto_id', autoId)
    setFavoritos(prev => prev.filter(f => f.auto_id !== autoId))
  }

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  const calcularAntiguedad = (fecha: string) => {
    const inicio = new Date(fecha)
    const ahora = new Date()
    const meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 + (ahora.getMonth() - inicio.getMonth())
    if (meses < 1) return 'Menos de un mes'
    if (meses === 1) return '1 mes'
    if (meses < 12) return `${meses} meses`
    const años = Math.floor(meses / 12)
    return años === 1 ? '1 año' : `${años} años`
  }

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando perfil...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .pub-card { transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .pub-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(37,99,235,0.1) !important; }
        .btn-eliminar { transition: all 0.2s; }
        .btn-eliminar:hover { background: #fef2f2 !important; color: #dc2626 !important; border-color: #fecaca !important; }
        .btn-editar { transition: background 0.2s; }
        .btn-editar:hover { background: #f0f0f0 !important; }
        .btn-guardar { transition: background 0.2s; }
        .btn-guardar:hover { background: #1d4ed8 !important; }
        .input-nombre:focus { border: 1.5px solid #2563eb !important; outline: none; }
        .tab-btn { transition: all 0.2s; cursor: pointer; }
        .perfil-grid { grid-template-columns: 300px 1fr !important; }
        .pub-card-inner { flex-direction: row !important; }
        .pub-card-img { width: 160px !important; min-width: 160px !important; height: 120px !important; }

        @media (max-width: 768px) {
          .perfil-grid { grid-template-columns: 1fr !important; }
          .perfil-padding { padding: 104px 16px 60px !important; }
          .pub-card-inner { flex-direction: column !important; }
          .pub-card-img { width: 100% !important; min-width: unset !important; height: 180px !important; }
          .tabs-row { flex-direction: column !important; align-items: flex-start !important; }
          .tabs-btns { flex-wrap: wrap !important; }
        }
      `}</style>

      <Navbar />

      <div className="perfil-padding" style={{paddingTop: '104px', maxWidth: '1000px', margin: '0 auto', padding: '120px 40px 60px'}}>

        {mensajeExito && (
          <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', marginBottom: '20px', textAlign: 'center'}}>
            ✓ {mensajeExito}
          </div>
        )}

        <div className="perfil-grid" style={{display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start'}}>

          {/* Columna izquierda */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Card principal del perfil */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '32px 24px', border: '1px solid #eee', textAlign: 'center'}}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: '#2563eb', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: '800', margin: '0 auto 16px',
              }}>
                {perfil?.nombre?.[0]?.toUpperCase() || usuario?.email?.[0]?.toUpperCase()}
              </div>

              {editando ? (
                <div style={{marginBottom: '16px'}}>
                  <input
                    className="input-nombre"
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && guardarPerfil()}
                    style={{width: '100%', padding: '10px 14px', fontSize: '15px', border: '1.5px solid #e5e5e5', borderRadius: '10px', background: '#fafafa', color: '#000', boxSizing: 'border-box', textAlign: 'center', marginBottom: '10px'}}
                    autoFocus
                  />
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button className="btn-guardar" onClick={guardarPerfil} disabled={guardando} style={{flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => { setEditando(false); setNuevoNombre(perfil?.nombre || '') }} style={{flex: 1, background: '#fff', color: '#666', border: '1px solid #e5e5e5', padding: '8px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'}}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 style={{fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '4px'}}>
                    {perfil?.nombre || 'Sin nombre'}
                  </h1>
                  <p style={{fontSize: '13px', color: '#888', marginBottom: '16px'}}>{usuario?.email}</p>
                </>
              )}

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: perfil?.verificado ? '#f0fdf4' : '#fafafa',
                border: `1px solid ${perfil?.verificado ? '#bbf7d0' : '#e5e5e5'}`,
                color: perfil?.verificado ? '#16a34a' : '#888',
                padding: '6px 14px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '600', marginBottom: '20px',
              }}>
                {perfil?.verificado ? '✓ Verificado' : '⚠ Sin verificar'}
              </div>

              {!editando && (
                <button className="btn-editar" onClick={() => setEditando(true)} style={{width: '100%', background: '#fff', border: '1.5px solid #e5e5e5', color: '#333', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'}}>
                  Editar perfil
                </button>
              )}
            </div>

            {/* Card estadísticas */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Estadísticas</h3>
              {[
                { label: 'Autos publicados', valor: autos.length },
                { label: 'Repuestos publicados', valor: repuestos.length },
                { label: 'Favoritos guardados', valor: favoritos.length },
                { label: 'Antigüedad', valor: perfil?.created_at ? calcularAntiguedad(perfil.created_at) : '—' },
                { label: 'Calificación', valor: '—' },
              ].map((stat) => (
                <div key={stat.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5'}}>
                  <span style={{fontSize: '13px', color: '#888'}}>{stat.label}</span>
                  <span style={{fontSize: '13px', fontWeight: '700', color: '#000'}}>{stat.valor}</span>
                </div>
              ))}
            </div>

            {/* Card contacto WhatsApp */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000'}}>
                  📱 Contacto WhatsApp
                </h3>
                {/* Botón editar — solo visible en modo vista cuando ya hay datos */}
                {perfil?.whatsapp && !editandoContacto && (
                  <button
                    onClick={() => setEditandoContacto(true)}
                    style={{background: 'none', border: 'none', fontSize: '12px', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0}}
                  >
                    Editar
                  </button>
                )}
              </div>

              {/* Modo vista — muestra datos guardados */}
              {perfil?.whatsapp && !editandoContacto ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{background: '#f9f9f9', borderRadius: '10px', padding: '12px 16px'}}>
                    <div style={{fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Número</div>
                    <div style={{fontSize: '14px', fontWeight: '700', color: '#000'}}>🇨🇱 +56 {perfil.whatsapp}</div>
                  </div>
                  <div style={{background: '#f9f9f9', borderRadius: '10px', padding: '12px 16px'}}>
                    <div style={{fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Horario de atención</div>
                    <div style={{fontSize: '14px', fontWeight: '700', color: '#000'}}>{perfil.horario_inicio}:00 — {perfil.horario_fin}:00</div>
                  </div>
                </div>

              ) : (
                // Modo edición — formulario para ingresar o editar datos
                <div>
                  <div style={{marginBottom: '16px'}}>
                    <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                      NÚMERO WHATSAPP
                    </label>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <div style={{padding: '10px 12px', background: '#f5f5f5', border: '1.5px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', color: '#555', fontWeight: '600', whiteSpace: 'nowrap'}}>
                        🇨🇱 +56
                      </div>
                      <input
                        type="tel"
                        placeholder="9 1234 5678"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        maxLength={9}
                        style={{flex: 1, padding: '10px 12px', fontSize: '14px', border: '1.5px solid #e5e5e5', borderRadius: '8px', background: '#fafafa', color: '#000', outline: 'none'}}
                      />
                    </div>
                  </div>

                  <div style={{marginBottom: '16px'}}>
                    <label style={{fontSize: '12px', fontWeight: '600', color: '#555', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'}}>
                      HORARIO DE ATENCIÓN
                    </label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <select
                        value={horarioInicio}
                        onChange={(e) => setHorarioInicio(Number(e.target.value))}
                        style={{flex: 1, padding: '10px 8px', fontSize: '13px', border: '1.5px solid #e5e5e5', borderRadius: '8px', background: '#fafafa', color: '#000', outline: 'none'}}
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                      <span style={{fontSize: '13px', color: '#888', fontWeight: '600'}}>a</span>
                      <select
                        value={horarioFin}
                        onChange={(e) => setHorarioFin(Number(e.target.value))}
                        style={{flex: 1, padding: '10px 8px', fontSize: '13px', border: '1.5px solid #e5e5e5', borderRadius: '8px', background: '#fafafa', color: '#000', outline: 'none'}}
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                    </div>
                    <p style={{fontSize: '11px', color: '#aaa', marginTop: '6px'}}>
                      Fuera de este horario el botón de contacto se deshabilitará
                    </p>
                  </div>

                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      onClick={guardarContacto}
                      disabled={guardandoContacto || !whatsapp.trim()}
                      style={{
                        flex: 1,
                        background: guardandoContacto || !whatsapp.trim() ? '#93c5fd' : '#2563eb',
                        color: '#fff', border: 'none', padding: '10px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '700',
                        cursor: guardandoContacto || !whatsapp.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {guardandoContacto ? 'Guardando...' : 'Guardar'}
                    </button>
                    {/* Botón cancelar — solo visible si ya había datos guardados */}
                    {perfil?.whatsapp && (
                      <button
                        onClick={() => {
                          setEditandoContacto(false)
                          setWhatsapp(perfil.whatsapp)
                          setHorarioInicio(perfil.horario_inicio ?? 9)
                          setHorarioFin(perfil.horario_fin ?? 20)
                        }}
                        style={{flex: 1, background: '#fff', color: '#666', border: '1px solid #e5e5e5', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'}}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card verificación — solo visible si no está verificado */}
            {!perfil?.verificado && (
              <div style={{background: '#fffbeb', borderRadius: '16px', padding: '20px', border: '1px solid #fde68a'}}>
                <div style={{fontSize: '20px', marginBottom: '8px'}}>🔐</div>
                <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '6px'}}>Verifica tu identidad</h3>
                <p style={{fontSize: '12px', color: '#888', marginBottom: '12px', lineHeight: 1.6}}>
                  Con RUT y cédula de identidad para publicar y contactar vendedores
                </p>
                <button onClick={() => router.push('/verificar')} style={{width: '100%', background: '#000', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>
                  Verificar ahora
                </button>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div>

            {/* Tabs y botón publicar */}
            <div className="tabs-row" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px'}}>
              <div className="tabs-btns" style={{display: 'flex', gap: '8px'}}>
                {(['autos', 'repuestos', 'favoritos'] as const).map((tab) => (
                  <div key={tab} className="tab-btn" onClick={() => setTabActiva(tab)} style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                    background: tabActiva === tab ? '#2563eb' : '#fff',
                    color: tabActiva === tab ? '#fff' : '#888',
                    border: `1.5px solid ${tabActiva === tab ? '#2563eb' : '#e5e5e5'}`,
                  }}>
                    {tab === 'autos' ? `Autos${autos.length > 0 ? ` (${autos.length})` : ''}` :
                     tab === 'repuestos' ? `Repuestos${repuestos.length > 0 ? ` (${repuestos.length})` : ''}` :
                     `Favoritos${favoritos.length > 0 ? ` (${favoritos.length})` : ''}`}
                  </div>
                ))}
              </div>

              {tabActiva === 'autos' && (
                <Link href="/publicar-auto" style={{textDecoration: 'none'}}>
                  <button style={{background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>
                    + Publicar auto
                  </button>
                </Link>
              )}
              {tabActiva === 'repuestos' && (
                <Link href="/publicar-repuesto" style={{textDecoration: 'none'}}>
                  <button style={{background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>
                    + Publicar repuesto
                  </button>
                </Link>
              )}
            </div>

            {/* Lista de autos */}
            {tabActiva === 'autos' && (
              autos.length === 0 ? (
                <div style={{background: '#fff', borderRadius: '16px', padding: '48px', border: '1px solid #eee', textAlign: 'center'}}>
                  <div style={{fontSize: '40px', marginBottom: '12px'}}>🚗</div>
                  <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '6px'}}>No tienes autos publicados</p>
                  <p style={{fontSize: '14px', color: '#888'}}>Publica tu primer auto y llega a miles de compradores</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {autos.map((auto) => (
                    <div key={auto.id} className="pub-card" style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
                      <div className="pub-card-inner" style={{display: 'flex'}}>
                        <div className="pub-card-img" style={{width: '160px', minWidth: '160px', height: '120px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                          {(() => {
                            const fotosArray = typeof auto.fotos === 'string' && auto.fotos ? JSON.parse(auto.fotos) : auto.fotos
                            return fotosArray && fotosArray.length > 0
                              ? <img src={fotosArray[0]} alt={auto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              : <span style={{fontSize: '36px'}}>🚗</span>
                          })()}
                        </div>
                        <div style={{padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                          <div>
                            <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{auto.nombre}</div>
                            <div style={{fontSize: '12px', color: '#888'}}>{auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}</div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'}}>
                            <div style={{fontSize: '18px', fontWeight: '800', color: '#000'}}>{formatPrecio(auto.precio)}</div>
                            <div style={{display: 'flex', gap: '8px'}}>
                              <Link href={`/autos/${auto.id}`} style={{textDecoration: 'none'}}>
                                <button style={{background: '#fff', color: '#333', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>Ver</button>
                              </Link>
                              <button className="btn-eliminar" onClick={() => eliminarAuto(auto.id)} style={{background: '#fff', color: '#888', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Lista de repuestos */}
            {tabActiva === 'repuestos' && (
              repuestos.length === 0 ? (
                <div style={{background: '#fff', borderRadius: '16px', padding: '48px', border: '1px solid #eee', textAlign: 'center'}}>
                  <div style={{fontSize: '40px', marginBottom: '12px'}}>🔧</div>
                  <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '6px'}}>No tienes repuestos publicados</p>
                  <p style={{fontSize: '14px', color: '#888'}}>Publica tu primer repuesto y llega a compradores</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {repuestos.map((rep) => (
                    <div key={rep.id} className="pub-card" style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
                      <div className="pub-card-inner" style={{display: 'flex'}}>
                        <div className="pub-card-img" style={{width: '160px', minWidth: '160px', height: '120px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                          {(() => {
                            const fotosArray = typeof rep.fotos === 'string' && rep.fotos ? JSON.parse(rep.fotos) : rep.fotos
                            return fotosArray && fotosArray.length > 0
                              ? <img src={fotosArray[0]} alt={rep.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              : <span style={{fontSize: '36px'}}>🔧</span>
                          })()}
                        </div>
                        <div style={{padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                          <div>
                            <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{rep.nombre}</div>
                            <div style={{fontSize: '12px', color: '#888'}}>{rep.categoria} · Compatible: {rep.marca_compatible} {rep.modelo_compatible}</div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'}}>
                            <div style={{fontSize: '18px', fontWeight: '800', color: '#000'}}>{formatPrecio(rep.precio)}</div>
                            <div style={{display: 'flex', gap: '8px'}}>
                              <Link href={`/repuestos/${rep.id}`} style={{textDecoration: 'none'}}>
                                <button style={{background: '#fff', color: '#333', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>Ver</button>
                              </Link>
                              <button className="btn-eliminar" onClick={() => eliminarRepuesto(rep.id)} style={{background: '#fff', color: '#888', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Lista de favoritos */}
            {tabActiva === 'favoritos' && (
              favoritos.length === 0 ? (
                <div style={{background: '#fff', borderRadius: '16px', padding: '48px', border: '1px solid #eee', textAlign: 'center'}}>
                  <div style={{fontSize: '40px', marginBottom: '12px'}}>❤️</div>
                  <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '6px'}}>No tienes favoritos aún</p>
                  <p style={{fontSize: '14px', color: '#888'}}>Guarda autos desde el detalle de cada publicación</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {favoritos.map((fav) => {
                    const auto = fav.autos
                    if (!auto) return null
                    return (
                      <div key={fav.id} className="pub-card" style={{background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden'}}>
                        <div className="pub-card-inner" style={{display: 'flex'}}>
                          <div className="pub-card-img" style={{width: '160px', minWidth: '160px', height: '120px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                            {(() => {
                              const fotosArray = typeof auto.fotos === 'string' && auto.fotos ? JSON.parse(auto.fotos) : auto.fotos
                              return fotosArray && fotosArray.length > 0
                                ? <img src={fotosArray[0]} alt={auto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                : <span style={{fontSize: '36px'}}>🚗</span>
                            })()}
                          </div>
                          <div style={{padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                            <div>
                              <div style={{fontSize: '15px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{auto.nombre}</div>
                              <div style={{fontSize: '12px', color: '#888'}}>{auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}</div>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'}}>
                              <div style={{fontSize: '18px', fontWeight: '800', color: '#000'}}>{formatPrecio(auto.precio)}</div>
                              <div style={{display: 'flex', gap: '8px'}}>
                                <Link href={`/autos/${auto.id}`} style={{textDecoration: 'none'}}>
                                  <button style={{background: '#fff', color: '#333', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>Ver</button>
                                </Link>
                                <button className="btn-eliminar" onClick={() => quitarFavorito(auto.id)} style={{background: '#fff', color: '#888', border: '1px solid #e5e5e5', padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'}}>
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  )
}