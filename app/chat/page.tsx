// Página de chat entre usuarios
// Mensajes en tiempo real con polling cada 3 segundos
// Marca mensajes como leídos al abrir la conversación
// En móvil: muestra lista de conversaciones o chat, no ambos a la vez

'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoId = searchParams.get('auto_id')
  const vendedorId = searchParams.get('vendedor_id')

  const [usuario, setUsuario] = useState<any>(null)
  const [conversaciones, setConversaciones] = useState<any[]>([])
  const [conversacionActiva, setConversacionActiva] = useState<any>(null)
  const [mensajes, setMensajes] = useState<any[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'chat'>('lista')
  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<any>(null)
  const convActivaIdRef = useRef<string | null>(null)
  const usuarioIdRef = useRef<string | null>(null)

  const scrollAlFinal = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const crearOBuscarConversacion = async (compradorId: string, autoId: string, vendedorId: string) => {
    const { data: existente } = await supabase
      .from('conversaciones').select('*')
      .eq('auto_id', autoId).eq('comprador_id', compradorId).eq('vendedor_id', vendedorId).single()
    if (existente) return existente
    const { data: nueva } = await supabase
      .from('conversaciones').insert({ auto_id: autoId, comprador_id: compradorId, vendedor_id: vendedorId }).select().single()
    return nueva
  }

  const cargarConversaciones = async (userId: string) => {
    const { data } = await supabase
      .from('conversaciones').select('*')
      .or(`comprador_id.eq.${userId},vendedor_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    const lista = data || []
    const conversacionesCompletas = await Promise.all(lista.map(async (conv: any) => {
      const { data: autoData } = await supabase.from('autos').select('nombre, fotos').eq('id', conv.auto_id).single()
      const otroId = conv.comprador_id === userId ? conv.vendedor_id : conv.comprador_id
      const { data: otroData } = await supabase.from('perfiles').select('nombre, email').eq('id', otroId).single()
      return { ...conv, auto: autoData, otroUsuarioData: otroData }
    }))

    const vistas = new Set()
    return conversacionesCompletas.filter((conv: any) => {
      const otroId = conv.comprador_id === userId ? conv.vendedor_id : conv.comprador_id
      const clave = `${conv.auto_id}-${otroId}`
      if (vistas.has(clave)) return false
      vistas.add(clave)
      return true
    })
  }

  const cargarMensajes = async (convId: string, userId?: string) => {
    const { data } = await supabase
      .from('mensajes').select('*').eq('conversacion_id', convId).order('created_at', { ascending: true })
    if (data) { setMensajes(data); setTimeout(scrollAlFinal, 100) }
    const uid = userId || usuarioIdRef.current
    if (uid) {
      await supabase.from('mensajes').update({ leido: true })
        .eq('conversacion_id', convId).neq('emisor_id', uid).eq('leido', false)
    }
  }

  const abrirConversacion = async (conv: any, userId?: string) => {
    setConversacionActiva(conv)
    convActivaIdRef.current = conv.id
    setVistaMovil('chat')
    await cargarMensajes(conv.id, userId)
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      if (convActivaIdRef.current) await cargarMensajes(convActivaIdRef.current)
    }, 3000)
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUsuario(session.user)
      usuarioIdRef.current = session.user.id

      let convId = null
      if (autoId && vendedorId && vendedorId !== session.user.id) {
        const conv = await crearOBuscarConversacion(session.user.id, autoId, vendedorId)
        convId = conv?.id
      }

      const lista = await cargarConversaciones(session.user.id)
      setConversaciones(lista)

      if (lista.length > 0) {
        const aAbrir = convId ? lista.find((c: any) => c.id === convId) || lista[0] : lista[0]
        await abrirConversacion(aAbrir, session.user.id)
      }

      setCargando(false)
    }

    iniciar()
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !convActivaIdRef.current || !usuarioIdRef.current) return
    const texto = nuevoMensaje.trim()
    setNuevoMensaje('')
    await supabase.from('mensajes').insert({
      conversacion_id: convActivaIdRef.current,
      emisor_id: usuarioIdRef.current,
      contenido: texto,
    })
    await cargarMensajes(convActivaIdRef.current)
  }

  const otroUsuario = (conv: any) => conv.otroUsuarioData?.nombre || conv.otroUsuarioData?.email || 'Usuario'

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando chat...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .conv-item { transition: background 0.15s; cursor: pointer; }
        .conv-item:hover { background: #f5f5f5 !important; }
        .conv-activa { background: #eff6ff !important; border-left: 3px solid #2563eb !important; }
        .btn-enviar { transition: background 0.2s; }
        .btn-enviar:hover { background: #1d4ed8 !important; }
        .input-mensaje:focus { outline: none; border-color: #2563eb !important; }

        /* En desktop muestra ambos paneles */
        .chat-lista { display: flex !important; }
        .chat-mensajes { display: flex !important; }

        @media (max-width: 768px) {
          /* En móvil muestra solo uno según vistaMovil */
          .chat-lista-oculta { display: none !important; }
          .chat-mensajes-ocultos { display: none !important; }
          .chat-lista { width: 100% !important; min-width: unset !important; border-right: none !important; }
          .chat-mensajes { width: 100% !important; }
        }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '104px', height: '100vh', display: 'flex', flexDirection: 'column'}}>
        <div style={{flex: 1, display: 'flex', overflow: 'hidden', background: '#fff', borderTop: '1px solid #e5e5e5'}}>

          {/* Panel izquierdo — lista de conversaciones */}
          <div
            className={`chat-lista ${vistaMovil === 'chat' ? 'chat-lista-oculta' : ''}`}
            style={{width: '320px', minWidth: '320px', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}
          >
            <div style={{padding: '20px', borderBottom: '1px solid #f0f0f0'}}>
              <h2 style={{fontSize: '18px', fontWeight: '800', color: '#000'}}>Mensajes</h2>
              <p style={{fontSize: '12px', color: '#888', marginTop: '2px'}}>{conversaciones.length} conversaciones</p>
            </div>

            <div style={{flex: 1, overflowY: 'auto'}}>
              {conversaciones.length === 0 ? (
                <div style={{padding: '40px 20px', textAlign: 'center'}}>
                  <div style={{fontSize: '32px', marginBottom: '8px'}}>💬</div>
                  <p style={{fontSize: '14px', color: '#888'}}>No tienes conversaciones aún</p>
                </div>
              ) : (
                conversaciones.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conv-item ${conversacionActiva?.id === conv.id ? 'conv-activa' : ''}`}
                    onClick={() => abrirConversacion(conv)}
                    style={{padding: '16px 20px', borderBottom: '1px solid #f5f5f5', borderLeft: '3px solid transparent'}}
                  >
                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                      <div style={{width: '44px', height: '44px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0}}>
                        {otroUsuario(conv)?.[0]?.toUpperCase()}
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{fontSize: '14px', fontWeight: '600', color: '#000', marginBottom: '2px'}}>{otroUsuario(conv)}</div>
                        <div style={{fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{conv.auto?.nombre || 'Auto'}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel derecho — mensajes */}
          {conversacionActiva ? (
            <div
              className={`chat-mensajes ${vistaMovil === 'lista' ? 'chat-mensajes-ocultos' : ''}`}
              style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}
            >
              {/* Header con botón volver en móvil */}
              <div style={{padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px'}}>
                {/* Botón volver — solo visible en móvil */}
                <button
                  onClick={() => setVistaMovil('lista')}
                  style={{
                    background: 'none', border: 'none', fontSize: '20px',
                    cursor: 'pointer', color: '#888', padding: '0',
                    display: 'none',
                  }}
                  className="btn-volver-movil"
                >
                  ←
                </button>
                <div style={{width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700'}}>
                  {otroUsuario(conversacionActiva)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '700', color: '#000'}}>{otroUsuario(conversacionActiva)}</div>
                  <div style={{fontSize: '12px', color: '#888'}}>{conversacionActiva.auto?.nombre}</div>
                </div>
              </div>

              {/* Mensajes */}
              <div style={{flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fafafa'}}>
                {mensajes.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '14px'}}>Inicia la conversación</div>
                ) : (
                  mensajes.map((msg) => {
                    const esMio = msg.emisor_id === usuario?.id
                    return (
                      <div key={msg.id} style={{display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start'}}>
                        <div style={{
                          maxWidth: '70%',
                          background: esMio ? '#2563eb' : '#fff',
                          color: esMio ? '#fff' : '#000',
                          padding: '10px 16px',
                          borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: '14px', lineHeight: 1.5,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          border: esMio ? 'none' : '1px solid #eee',
                        }}>
                          <div>{msg.contenido}</div>
                          <div style={{fontSize: '10px', color: esMio ? 'rgba(255,255,255,0.6)' : '#aaa', marginTop: '4px', textAlign: esMio ? 'right' : 'left'}}>
                            {new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input */}
              <div style={{padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px', alignItems: 'center', background: '#fff'}}>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="input-mensaje"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                  style={{flex: 1, padding: '12px 18px', fontSize: '14px', border: '1.5px solid #e5e5e5', borderRadius: '24px', background: '#fafafa', color: '#000', outline: 'none'}}
                />
                <button className="btn-enviar" onClick={enviarMensaje} style={{width: '44px', height: '44px', borderRadius: '50%', background: '#2563eb', color: '#fff', border: 'none', fontSize: '18px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  ➤
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`chat-mensajes ${vistaMovil === 'lista' ? 'chat-mensajes-ocultos' : ''}`}
              style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa'}}
            >
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>💬</div>
                <p style={{fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '6px'}}>Selecciona una conversación</p>
                <p style={{fontSize: '14px', color: '#888'}}>O contacta a un vendedor desde el detalle de un auto</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estilos extra para el botón volver en móvil */}
      <style>{`
        @media (max-width: 768px) {
          .btn-volver-movil { display: block !important; }
        }
      `}</style>
    </main>
  )
}

export default function Chat() {
  return (
    <Suspense fallback={<div style={{paddingTop: '104px', textAlign: 'center', color: '#888'}}>Cargando...</div>}>
      <ChatContent />
    </Suspense>
  )
}