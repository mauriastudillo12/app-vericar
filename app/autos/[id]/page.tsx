// Página de detalle de un auto
// Incluye galería de fotos con miniaturas navegables
// Botón de favoritos funcional
// Contacto por WhatsApp con ícono oficial, horario de atención y efectos visuales
// Solo usuarios verificados pueden contactar al vendedor

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { getNombreRegion } from '../../lib/regiones'

function Galeria({ fotos, nombre, destacado, negociable }: {
  fotos: string[]
  nombre: string
  destacado: boolean
  negociable: boolean
}) {
  const [fotoActiva, setFotoActiva] = useState(0)

  return (
    <div>
      <div style={{
        width: '100%', height: '360px',
        background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)',
        borderRadius: '16px', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', border: '1px solid #eee', marginBottom: '12px',
      }}>
        {fotos.length > 0 ? (
          <img src={fotos[fotoActiva]} alt={nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <span style={{fontSize: '80px'}}>🚗</span>
        )}

        {destacado && (
          <div style={{position: 'absolute', top: '16px', left: '16px', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '4px', letterSpacing: '1px'}}>
            ★ DESTACADO
          </div>
        )}

        {negociable && (
          <div style={{position: 'absolute', top: '16px', right: '16px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '4px', border: '1px solid #bbf7d0'}}>
            Negociable
          </div>
        )}

        {fotos.length > 1 && (
          <>
            <button onClick={() => setFotoActiva(prev => prev === 0 ? fotos.length - 1 : prev - 1)} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>‹</button>
            <button onClick={() => setFotoActiva(prev => prev === fotos.length - 1 ? 0 : prev + 1)} style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>›</button>
            <div style={{position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px'}}>
              {fotoActiva + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div style={{display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px'}}>
          {fotos.map((foto, index) => (
            <div key={index} onClick={() => setFotoActiva(index)} style={{width: '80px', minWidth: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: fotoActiva === index ? '2.5px solid #2563eb' : '2.5px solid transparent', opacity: fotoActiva === index ? 1 : 0.55, transition: 'all 0.2s'}}>
              <img src={foto} alt={`Foto ${index + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DetalleAuto() {

  const params = useParams()
  const router = useRouter()
  const [auto, setAuto] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [perfilVerificado, setPerfilVerificado] = useState(false)
  const [esFavorito, setEsFavorito] = useState(false)
  const [guardandoFavorito, setGuardandoFavorito] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) {
        verificarFavorito(session.user.id)
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('verificado')
          .eq('id', session.user.id)
          .single()
        setPerfilVerificado(perfil?.verificado || false)
      }
    })

    const cargarAuto = async () => {
      const { data, error } = await supabase
        .from('autos').select('*').eq('id', params.id).single()
      if (error || !data) { router.push('/autos'); return }
      setAuto(data)

      if (data.vendedor_id) {
        // Traer whatsapp y horario del vendedor para el botón de contacto
        const { data: perfilData } = await supabase
          .from('perfiles').select('*').eq('id', data.vendedor_id).single()
        setVendedor(perfilData)
      }
      setCargando(false)
    }

    cargarAuto()
  }, [params.id])

  const verificarFavorito = async (userId: string) => {
    const { data } = await supabase
      .from('favoritos').select('id')
      .eq('usuario_id', userId).eq('auto_id', params.id).maybeSingle()
    setEsFavorito(!!data)
  }

  const toggleFavorito = async () => {
    if (!usuario) { router.push('/login'); return }
    setGuardandoFavorito(true)
    if (esFavorito) {
      await supabase.from('favoritos').delete().eq('usuario_id', usuario.id).eq('auto_id', auto.id)
      setEsFavorito(false)
    } else {
      await supabase.from('favoritos').insert({ usuario_id: usuario.id, auto_id: auto.id })
      setEsFavorito(true)
    }
    setGuardandoFavorito(false)
  }

  // Verificar si la hora actual está dentro del horario del vendedor
  const dentroDeHorario = () => {
    if (!vendedor?.whatsapp) return false
    const horaActual = new Date().getHours()
    const inicio = vendedor?.horario_inicio ?? 9
    const fin = vendedor?.horario_fin ?? 20
    return horaActual >= inicio && horaActual < fin
  }

  // Abrir WhatsApp con mensaje predeterminado
  const contactarWhatsApp = () => {
    const numero = `56${vendedor.whatsapp}`
    const mensaje = encodeURIComponent(
      `Hola, vengo de la app VeriCar. Me interesa tu publicación: ${auto.nombre} (${auto.año}, ${auto.km?.toLocaleString('es-CL')} km). ¿Está disponible?`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando auto...</p>
        </div>
      </main>
    )
  }

  if (!auto) return null

  const fotosArray = typeof auto.fotos === 'string' && auto.fotos
    ? JSON.parse(auto.fotos) : auto.fotos || []

  const vendedorTieneWhatsapp = !!vendedor?.whatsapp
  const estaEnHorario = dentroDeHorario()

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .btn-wsp {
          transition: all 0.2s ease;
        }
        .btn-wsp:hover {
          background: #128c7e !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(37,211,102,0.45) !important;
        }
        .btn-wsp:active {
          transform: translateY(0px) !important;
        }
        .btn-favorito { transition: all 0.2s; }
        .btn-favorito:hover { border-color: #2563eb !important; color: #2563eb !important; }
        .btn-volver { transition: color 0.2s; }
        .btn-volver:hover { color: #2563eb !important; }
        .detalle-grid { grid-template-columns: 1fr 380px !important; }
        .specs-grid { grid-template-columns: 1fr 1fr !important; }

        @media (max-width: 768px) {
          .detalle-grid { grid-template-columns: 1fr !important; }
          .detalle-padding { padding: 104px 16px 60px !important; }
          .specs-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <Navbar />

      <div className="detalle-padding" style={{paddingTop: '104px', maxWidth: '1000px', margin: '0 auto', padding: '120px 40px 60px'}}>

        <button className="btn-volver" onClick={() => router.back()} style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', fontWeight: '500'}}>
          ← Volver al feed
        </button>

        <div className="detalle-grid" style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px'}}>

          {/* Columna izquierda — galería, descripción, specs */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

            <Galeria fotos={fotosArray} nombre={auto.nombre} destacado={auto.destacado} negociable={auto.negociable} />

            {/* Descripción */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '12px'}}>Descripción del vendedor</h3>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>{auto.descripcion}</p>
            </div>

            {/* Especificaciones */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Especificaciones</h3>
              <div className="specs-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                {[
                  { label: 'Marca', valor: auto.marca },
                  { label: 'Modelo', valor: auto.modelo },
                  { label: 'Año', valor: auto.año },
                  { label: 'Kilometraje', valor: `${auto.km?.toLocaleString('es-CL')} km` },
                  { label: 'Combustible', valor: auto.combustible },
                  { label: 'Transmisión', valor: auto.transmision },
                  { label: 'Región', valor: getNombreRegion(auto.region) },
                ].map((spec) => (
                  <div key={spec.label} style={{background: '#f9f9f9', borderRadius: '10px', padding: '12px 16px'}}>
                    <div style={{fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{spec.label}</div>
                    <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{spec.valor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha — precio, contacto, vendedor */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Card precio y contacto */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h1 style={{fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '4px'}}>{auto.nombre}</h1>
              <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>
                {auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}
              </p>
              <div style={{fontSize: '32px', fontWeight: '900', color: '#000', marginBottom: '6px'}}>
                {formatPrecio(auto.precio)}
              </div>
              {auto.negociable && (
                <p style={{fontSize: '13px', color: '#16a34a', fontWeight: '600', marginBottom: '20px'}}>Precio negociable</p>
              )}

              <div style={{height: '1px', background: '#f0f0f0', margin: '16px 0'}} />

              {/* CASO 1 — Sin sesión */}
              {!usuario && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <p style={{fontSize: '13px', color: '#888', textAlign: 'center'}}>
                    Inicia sesión para contactar al vendedor
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      width: '100%', background: '#25d366', color: '#fff',
                      border: 'none', padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.418-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.858l-.486-.29-5.001 1.191 1.216-4.87-.317-.5A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.906c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.266.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.619-3.202-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.398-.664.133-.265.067-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.652-.672-.897-.685l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.395 1.362-1.395 3.325s1.428 3.857 1.627 4.123c.2.265 2.81 4.29 6.808 6.017.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.89.332-.929.332-1.726.232-1.89-.099-.165-.365-.265-.763-.464z"/>
                    </svg>
                    Ingresar para contactar
                  </button>
                </div>
              )}

              {/* CASO 2 — Con sesión pero sin verificar */}
              {usuario && !perfilVerificado && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px'}}>
                    <div style={{fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px'}}>⚠ Verificación requerida</div>
                    <div style={{fontSize: '12px', color: '#b45309'}}>Solo usuarios verificados pueden contactar vendedores.</div>
                  </div>
                  <button
                    onClick={() => router.push('/verificar?origen=autos')}
                    style={{width: '100%', background: '#000', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}
                  >
                    Verificar mi cuenta
                  </button>
                </div>
              )}

              {/* CASO 3 — Verificado pero vendedor sin WhatsApp */}
              {usuario && perfilVerificado && !vendedorTieneWhatsapp && (
                <div style={{background: '#f9f9f9', border: '1px solid #eee', borderRadius: '10px', padding: '14px 16px', textAlign: 'center'}}>
                  <p style={{fontSize: '13px', color: '#888'}}>El vendedor aún no ha configurado su contacto WhatsApp</p>
                </div>
              )}

              {/* CASO 4 — Verificado y vendedor con WhatsApp */}
              {usuario && perfilVerificado && vendedorTieneWhatsapp && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>

                  {/* Botón WhatsApp */}
                  <button
                    className={estaEnHorario ? 'btn-wsp' : ''}
                    onClick={estaEnHorario ? contactarWhatsApp : undefined}
                    disabled={!estaEnHorario}
                    style={{
                      width: '100%',
                      background: estaEnHorario ? '#25d366' : '#e5e5e5',
                      color: estaEnHorario ? '#fff' : '#aaa',
                      border: 'none', padding: '14px 20px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700',
                      cursor: estaEnHorario ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: estaEnHorario ? '0 4px 16px rgba(37,211,102,0.35)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Ícono SVG oficial de WhatsApp */}
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.418-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.858l-.486-.29-5.001 1.191 1.216-4.87-.317-.5A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.906c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.266.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.619-3.202-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.398-.664.133-.265.067-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.652-.672-.897-.685l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.395 1.362-1.395 3.325s1.428 3.857 1.627 4.123c.2.265 2.81 4.29 6.808 6.017.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.89.332-.929.332-1.726.232-1.89-.099-.165-.365-.265-.763-.464z"/>
                    </svg>
                    {estaEnHorario ? 'Contactar por WhatsApp' : 'Fuera de horario'}
                  </button>

                  {/* Mensaje de horario */}
                  {estaEnHorario ? (
                    <p style={{fontSize: '12px', color: '#16a34a', textAlign: 'center', fontWeight: '600'}}>
                      ✓ Disponible ahora · Atención de {vendedor.horario_inicio}:00 a {vendedor.horario_fin}:00
                    </p>
                  ) : (
                    <p style={{fontSize: '12px', color: '#f59e0b', textAlign: 'center', fontWeight: '600'}}>
                      ⏰ Fuera de horario · Atención de {vendedor.horario_inicio}:00 a {vendedor.horario_fin}:00
                    </p>
                  )}
                </div>
              )}

              {/* Botón favorito — visible para todos los usuarios con sesión */}
              {usuario && (
                <div style={{marginTop: '10px'}}>
                  <button
                    className="btn-favorito"
                    onClick={toggleFavorito}
                    disabled={guardandoFavorito}
                    style={{
                      width: '100%',
                      background: esFavorito ? '#eff6ff' : '#fff',
                      color: esFavorito ? '#2563eb' : '#333',
                      border: `1.5px solid ${esFavorito ? '#2563eb' : '#e5e5e5'}`,
                      padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {esFavorito ? '❤️ Guardado en favoritos' : '🤍 Guardar en favoritos'}
                  </button>
                </div>
              )}
            </div>

            {/* Card vendedor */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Vendedor</h3>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '48px', height: '48px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0}}>
                  {vendedor?.nombre?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: '#000'}}>{vendedor?.nombre || 'Usuario verificado'}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px'}}>
                    <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                    <span style={{fontSize: '12px', color: '#22c55e', fontWeight: '600'}}>Verificado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patente oculta */}
            <div style={{background: '#f9f9f9', borderRadius: '16px', padding: '16px 20px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '20px'}}>🔒</span>
              <div>
                <div style={{fontSize: '13px', fontWeight: '600', color: '#333'}}>Patente oculta</div>
                <div style={{fontSize: '12px', color: '#aaa', marginTop: '2px'}}>Se revela al iniciar contacto verificado</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}