// Navbar de VeriCar
// Dos elementos con sesión: botón Publicar y avatar con menú desplegable
// Punto rojo en avatar y en opción Mensajes cuando hay mensajes sin leer
// Link al panel admin solo visible para administradores

'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const tabs = [
  { nombre: 'Autos', ruta: '/autos' },
  { nombre: 'Repuestos y más', ruta: '/repuestos' },
  { nombre: 'Talleres', ruta: '/talleres' },
]

export default function Navbar({ activa }: { activa?: string }) {

  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuPublicarAbierto, setMenuPublicarAbierto] = useState(false)
  const [mensajesSinLeer, setMensajesSinLeer] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuPublicarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) {
        cargarPerfil(session.user.id)
        verificarMensajesSinLeer(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
      if (session?.user) {
        cargarPerfil(session.user.id)
        verificarMensajesSinLeer(session.user.id)
      } else {
        setEsAdmin(false)
      }
    })

    // Cerrar menús al hacer clic fuera
    const handleClickFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
      if (menuPublicarRef.current && !menuPublicarRef.current.contains(e.target as Node)) {
        setMenuPublicarAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickFuera)
    }
  }, [])

  // Cargar nombre del perfil y verificar si es admin
  const cargarPerfil = async (userId: string) => {
    const { data } = await supabase
      .from('perfiles')
      .select('nombre, es_admin')
      .eq('id', userId)
      .single()
    setPerfil(data)
    setEsAdmin(data?.es_admin || false)
  }

  // Verificar mensajes sin leer para mostrar punto rojo
  const verificarMensajesSinLeer = async (userId: string) => {
    const { data: convs } = await supabase
      .from('conversaciones')
      .select('id')
      .or(`comprador_id.eq.${userId},vendedor_id.eq.${userId}`)

    if (!convs || convs.length === 0) return

    const convIds = convs.map((c: any) => c.id)

    const { data: mensajes } = await supabase
      .from('mensajes')
      .select('id')
      .in('conversacion_id', convIds)
      .eq('leido', false)
      .neq('emisor_id', userId)
      .limit(1)

    setMensajesSinLeer((mensajes?.length ?? 0) > 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuAbierto(false)
    router.push('/')
  }

  // Inicial para el avatar
  const inicial = perfil?.nombre?.[0]?.toUpperCase() || usuario?.email?.[0]?.toUpperCase()

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e5e5e5',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
    }}>

      <style>{`
        .btn-ingresar { transition: background 0.2s, transform 0.15s; }
        .btn-ingresar:hover { background: #1d4ed8 !important; transform: scale(1.03); }
        .btn-registrar { transition: background 0.2s; }
        .btn-registrar:hover { background: #f0f0f0 !important; }
        .nav-logo { transition: opacity 0.2s; }
        .nav-logo:hover { opacity: 0.7; }
        .nav-tab { transition: color 0.2s; }
        .nav-tab:hover { color: #000 !important; }
        .btn-publicar { transition: background 0.2s, transform 0.15s; }
        .btn-publicar:hover { background: #333 !important; }
        .menu-item { transition: background 0.15s; cursor: pointer; }
        .menu-item:hover { background: #f5f5f5 !important; }
        .menu-item-admin { transition: background 0.15s; cursor: pointer; }
        .menu-item-admin:hover { background: #eff6ff !important; }
        .menu-item-rojo { transition: all 0.15s; cursor: pointer; }
        .menu-item-rojo:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .avatar-btn { transition: opacity 0.2s; cursor: pointer; }
        .avatar-btn:hover { opacity: 0.85; }
        .publicar-item { transition: background 0.15s; cursor: pointer; }
        .publicar-item:hover { background: #f5f5f5 !important; }
      `}</style>

      {/* Fila 1: logo y botones */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px', height: '60px',
      }}>

        {/* Logo */}
        <Link href="/" className="nav-logo" style={{
          fontSize: '20px', fontWeight: '900',
          letterSpacing: '3px', color: '#000', textDecoration: 'none',
        }}>
          VERICAR
        </Link>

        {/* Botones según sesión */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

          {usuario ? (
            <>
              {/* Botón Publicar con menú desplegable */}
              <div ref={menuPublicarRef} style={{ position: 'relative' }}>
                <button
                  className="btn-publicar"
                  onClick={() => setMenuPublicarAbierto(!menuPublicarAbierto)}
                  style={{
                    background: '#000', border: 'none', color: '#fff',
                    padding: '8px 18px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  + Publicar
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
                </button>

                {/* Menú publicar */}
                {menuPublicarAbierto && (
                  <div style={{
                    position: 'absolute', top: '48px', left: 0,
                    background: '#fff', borderRadius: '12px',
                    border: '1px solid #e5e5e5', minWidth: '180px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden', zIndex: 200,
                  }}>



                    <Link href="/publicar-auto" style={{ textDecoration: 'none' }} onClick={() => setMenuPublicarAbierto(false)}>
                      <div className="publicar-item" style={{
                        padding: '12px 16px', fontSize: '13px',
                        color: '#333', fontWeight: '500',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <span>🚗</span> Publicar auto
                      </div>
                    </Link>
                    <div style={{ height: '1px', background: '#f0f0f0' }} />
                    <Link href="/publicar-repuesto" style={{ textDecoration: 'none' }} onClick={() => setMenuPublicarAbierto(false)}>
                      <div className="publicar-item" style={{
                        padding: '12px 16px', fontSize: '13px',
                        color: '#333', fontWeight: '500',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <span>🔧</span> Publicar repuesto
                      </div>
                    </Link>
                    <div style={{ height: '1px', background: '#f0f0f0' }} />
                    <Link href="/registrar-taller" style={{ textDecoration: 'none' }} onClick={() => setMenuPublicarAbierto(false)}>
                      <div className="publicar-item" style={{
                        padding: '12px 16px', fontSize: '13px',
                        color: '#333', fontWeight: '500',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <span>🏪</span> Registrar taller
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Avatar con punto rojo y menú desplegable */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <div
                  className="avatar-btn"
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  style={{ position: 'relative' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: '#2563eb', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: '700',
                    border: menuAbierto ? '2px solid #2563eb' : '2px solid transparent',
                    boxShadow: menuAbierto ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {inicial}
                  </div>

                  {/* Punto rojo sobre el avatar cuando hay mensajes sin leer */}
                  {mensajesSinLeer && (
                    <div style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#ef4444', border: '2px solid #fff',
                    }} />
                  )}
                </div>

                {/* Menú desplegable del avatar */}
                {menuAbierto && (
                  <div style={{
                    position: 'absolute', top: '48px', right: 0,
                    background: '#fff', borderRadius: '12px',
                    border: '1px solid #e5e5e5', minWidth: '220px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden', zIndex: 200,
                  }}>

                    {/* Info del usuario */}
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '2px' }}>
                        {perfil?.nombre || 'Mi cuenta'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {usuario?.email}
                      </div>
                    </div>

                    {/* Opciones del menú */}
                    <div style={{ padding: '8px 0' }}>

                      {/* Mi perfil */}
                      <Link href="/perfil" style={{ textDecoration: 'none' }} onClick={() => setMenuAbierto(false)}>
                        <div className="menu-item" style={{
                          padding: '10px 16px', fontSize: '13px',
                          color: '#333', fontWeight: '500',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <span>👤</span> Mi perfil
                        </div>
                      </Link>

                      {/* Mis publicaciones */}
                      <Link href="/perfil" style={{ textDecoration: 'none' }} onClick={() => setMenuAbierto(false)}>
                        <div className="menu-item" style={{
                          padding: '10px 16px', fontSize: '13px',
                          color: '#333', fontWeight: '500',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <span>📋</span> Mis publicaciones
                        </div>
                      </Link>

                      {/* Mensajes con punto rojo */}
                      <Link href="/chat" style={{ textDecoration: 'none' }} onClick={() => setMenuAbierto(false)}>
                        <div className="menu-item" style={{
                          padding: '10px 16px', fontSize: '13px',
                          color: '#333', fontWeight: '500',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <span>💬</span>
                          <span>Mensajes</span>
                          {mensajesSinLeer && (
                            <div style={{
                              marginLeft: 'auto',
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: '#ef4444',
                            }} />
                          )}
                        </div>
                      </Link>

                      {/* Panel admin — solo visible para administradores */}
                      {esAdmin && (
                        <>
                          <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }} />
                          <Link href="/admin" style={{ textDecoration: 'none' }} onClick={() => setMenuAbierto(false)}>
                            <div className="menu-item-admin" style={{
                              padding: '10px 16px', fontSize: '13px',
                              color: '#2563eb', fontWeight: '700',
                              display: 'flex', alignItems: 'center', gap: '10px',
                            }}>
                              <span>⚙️</span> Panel admin
                            </div>
                          </Link>
                        </>
                      )}

                      <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }} />

                      {/* Salir */}
                      <div
                        className="menu-item-rojo"
                        onClick={handleLogout}
                        style={{
                          padding: '10px 16px', fontSize: '13px',
                          color: '#888', fontWeight: '500',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}
                      >
                        <span>🚪</span> Salir
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Sin sesión */}
              <Link href="/registro" style={{ textDecoration: 'none' }}>
                <button className="btn-registrar" style={{
                  background: 'transparent', border: '1px solid #ddd',
                  color: '#333', padding: '8px 18px', borderRadius: '8px',
                  fontSize: '13px', cursor: 'pointer', fontWeight: '500',
                }}>
                  Registrarse
                </button>
              </Link>

              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-ingresar" style={{
                  background: '#2563eb', border: 'none', color: '#fff',
                  padding: '8px 18px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}>
                  Ingresar
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Fila 2: tabs */}
      <div style={{ display: 'flex', padding: '0 40px', borderTop: '1px solid #f0f0f0' }}>
        {tabs.map((tab) => (
          <Link key={tab.nombre} href={tab.ruta} className="nav-tab" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 20px', fontSize: '13px',
              fontWeight: tab.nombre === activa ? '700' : '500',
              color: tab.nombre === activa ? '#000' : '#888',
              borderBottom: tab.nombre === activa ? '2px solid #2563eb' : '2px solid transparent',
              whiteSpace: 'nowrap', cursor: 'pointer',
            }}>
              {tab.nombre}
            </div>
          </Link>
        ))}
      </div>

    </nav>
  )
}