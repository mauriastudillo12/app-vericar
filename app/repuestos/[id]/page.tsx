// Página de detalle de un repuesto
// La URL es /repuestos/[id] donde id es el uuid del repuesto en Supabase

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { getNombreRegion } from '../../lib/regiones'

export default function DetalleRepuesto() {

  const params = useParams()
  const router = useRouter()
  const [repuesto, setRepuesto] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [perfilVerificado, setPerfilVerificado] = useState(false)
  const [esFavorito, setEsFavorito] = useState(false)
  const [guardandoFavorito, setGuardandoFavorito] = useState(false)

  useEffect(() => {

    // Verificar sesión activa
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

    // Cargar datos del repuesto desde Supabase
    const cargarRepuesto = async () => {
      const { data, error } = await supabase
        .from('repuestos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/repuestos')
        return
      }

      setRepuesto(data)

      // Cargar perfil del vendedor si existe
      if (data.vendedor_id) {
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', data.vendedor_id)
          .single()

        setVendedor(perfilData)
      }

      setCargando(false)
    }

    cargarRepuesto()
  }, [params.id])

  const dentroDeHorario = () => {
    if (!vendedor?.whatsapp) return false
    const horaActual = new Date().getHours()
    const inicio = vendedor?.horario_inicio ?? 9
    const fin = vendedor?.horario_fin ?? 20
    return horaActual >= inicio && horaActual < fin
  }

  const verificarFavorito = async (userId: string) => {
    const { data } = await supabase
      .from('favoritos').select('id')
      .eq('usuario_id', userId).eq('repuesto_id', params.id).maybeSingle()
    setEsFavorito(!!data)
  }

  const toggleFavorito = async () => {
    if (!usuario) { router.push('/login'); return }
    setGuardandoFavorito(true)
    if (esFavorito) {
      await supabase.from('favoritos').delete().eq('usuario_id', usuario.id).eq('repuesto_id', repuesto.id)
      setEsFavorito(false)
    } else {
      await supabase.from('favoritos').insert({ usuario_id: usuario.id, repuesto_id: repuesto.id })
      setEsFavorito(true)
    }
    setGuardandoFavorito(false)
  }

  const contactarWhatsApp = () => {
    const numero = `56${vendedor.whatsapp}`
    const mensaje = encodeURIComponent(
      `Hola, vengo de la app Unimotor. Me interesa tu repuesto: ${repuesto.nombre}, compatible con ${repuesto.marca_compatible} ${repuesto.modelo_compatible}. ¿Está disponible?`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando repuesto...</p>
        </div>
      </main>
    )
  }

  if (!repuesto) return null

  const vendedorTieneWhatsapp = !!vendedor?.whatsapp
  const estaEnHorario = dentroDeHorario()

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .btn-wsp { transition: all 0.2s ease; }
        .btn-wsp:hover { background: #128c7e !important; transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(37,211,102,0.45) !important; }
        .btn-wsp:active { transform: translateY(0px) !important; }
        .btn-volver { transition: color 0.2s; }
        .btn-volver:hover { color: #2563eb !important; }
      `}</style>

      <Navbar />

      <div style={{paddingTop: '104px', maxWidth: '1000px', margin: '0 auto', padding: '120px 40px 60px'}}>

        {/* Botón volver */}
        <button
          className="btn-volver"
          onClick={() => router.back()}
          style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', fontWeight: '500'}}
        >
          ← Volver a repuestos
        </button>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px'}}>

          {/* Columna izquierda */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

            {/* Imagen principal */}
            <div style={{
              width: '100%', height: '360px',
              background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)',
              borderRadius: '16px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', border: '1px solid #eee',
            }}>

              {/* Badge estado */}
              <div style={{
                position: 'absolute', top: '16px', left: '16px',
                background: repuesto.estado === 'Nuevo' ? '#2563eb' : '#333',
                color: '#fff', fontSize: '11px', fontWeight: '700',
                padding: '5px 12px', borderRadius: '4px',
              }}>
                {repuesto.estado}
              </div>

              {/* Badge garantía */}
              {repuesto.garantia && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: '#f0fdf4', color: '#16a34a',
                  fontSize: '11px', fontWeight: '700',
                  padding: '5px 12px', borderRadius: '4px',
                  border: '1px solid #bbf7d0',
                }}>
                  Con garantía
                </div>
              )}

              {/* Badge destacado */}
              {repuesto.destacado && (
                <div style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  background: '#2563eb', color: '#fff',
                  fontSize: '11px', fontWeight: '700',
                  padding: '5px 14px', borderRadius: '4px',
                  letterSpacing: '1px', zIndex: 1,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                }}>
                  ★ DESTACADO
                </div>
              )}

              {/* Foto real o placeholder */}
              {(() => {
                const fotosArray = typeof repuesto.fotos === 'string' && repuesto.fotos
                  ? JSON.parse(repuesto.fotos) : repuesto.fotos
                return fotosArray && fotosArray.length > 0
                  ? <img src={fotosArray[0]} alt={repuesto.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  : <span style={{fontSize: '80px'}}>🔧</span>
              })()}
            </div>

            {/* Descripción */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '12px'}}>
                Descripción del vendedor
              </h3>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>
                {repuesto.descripcion}
              </p>
            </div>

            {/* Especificaciones */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                Especificaciones
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                {[
                  { label: 'Categoría', valor: repuesto.categoria },
                  { label: 'Estado', valor: repuesto.estado },
                  { label: 'Marca compatible', valor: repuesto.marca_compatible },
                  { label: 'Modelo compatible', valor: repuesto.modelo_compatible },
                  { label: 'Garantía', valor: repuesto.garantia ? 'Sí' : 'No' },
                  { label: 'Región', valor: getNombreRegion(repuesto.region) },
                ].map((spec) => (
                  <div key={spec.label} style={{background: '#f9f9f9', borderRadius: '10px', padding: '12px 16px'}}>
                    <div style={{fontSize: '11px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                      {spec.label}
                    </div>
                    <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>
                      {spec.valor}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Columna derecha — precio y contacto */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Card de precio */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>

              {/* Badge categoría */}
              <div style={{
                display: 'inline-block',
                background: '#eff6ff', color: '#2563eb',
                fontSize: '11px', fontWeight: '700',
                padding: '4px 10px', borderRadius: '4px',
                marginBottom: '12px', letterSpacing: '0.5px',
              }}>
                {repuesto.categoria}
              </div>

              {/* Nombre */}
              <h1 style={{fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '4px'}}>
                {repuesto.nombre}
              </h1>

              {/* Compatible con */}
              <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>
                Compatible con {repuesto.marca_compatible} {repuesto.modelo_compatible}
              </p>

              {/* Precio */}
              <div style={{fontSize: '32px', fontWeight: '900', color: '#000', marginBottom: '20px'}}>
                {formatPrecio(repuesto.precio)}
              </div>

              <div style={{height: '1px', background: '#f0f0f0', margin: '0 0 16px'}} />

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
                    onClick={() => router.push('/verificar?origen=repuestos')}
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
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.418-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.858l-.486-.29-5.001 1.191 1.216-4.87-.317-.5A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.906c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.266.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.619-3.202-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.398-.664.133-.265.067-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.652-.672-.897-.685l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.395 1.362-1.395 3.325s1.428 3.857 1.627 4.123c.2.265 2.81 4.29 6.808 6.017.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.89.332-.929.332-1.726.232-1.89-.099-.165-.365-.265-.763-.464z"/>
                    </svg>
                    {estaEnHorario ? 'Contactar por WhatsApp' : 'Fuera de horario'}
                  </button>
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
                      transition: 'all 0.2s',
                    }}
                  >
                    {esFavorito ? '❤️ Guardado en favoritos' : '🤍 Guardar en favoritos'}
                  </button>
                </div>
              )}
            </div>

            {/* Card del vendedor */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                Vendedor
              </h3>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#2563eb', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: '700', flexShrink: 0,
                }}>
                  {vendedor?.nombre?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: '#000'}}>
                    {vendedor?.nombre || 'Usuario verificado'}
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px'}}>
                    <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                    <span style={{fontSize: '12px', color: '#22c55e', fontWeight: '600'}}>Verificado</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}