// Página de detalle de un taller
// Muestra info completa, servicios, horario y botón de contacto
// Contacto por WhatsApp con ícono oficial, horario de atención y efectos visuales
// Solo usuarios verificados pueden contactar al taller

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { getNombreRegion } from '../../lib/regiones'

// Ícono SVG oficial de WhatsApp — reutilizable dentro del archivo
const IconoWhatsApp = ({ size = 20, color = 'currentColor' }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill={color}>
    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.418-2.004A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.858l-.486-.29-5.001 1.191 1.216-4.87-.317-.5A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.906c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.266.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.2-1.681-.619-3.202-1.977-1.184-1.056-1.983-2.36-2.215-2.758-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.2-.232.266-.398.398-.664.133-.265.067-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.652-.672-.897-.685l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.395 1.362-1.395 3.325s1.428 3.857 1.627 4.123c.2.265 2.81 4.29 6.808 6.017.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.89.332-.929.332-1.726.232-1.89-.099-.165-.365-.265-.763-.464z"/>
  </svg>
)

export default function DetalleTaller() {

  const params = useParams()
  const router = useRouter()
  const [taller, setTaller] = useState<any>(null)
  const [propietario, setPropietario] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [perfilVerificado, setPerfilVerificado] = useState(false)

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

    const cargarTaller = async () => {
      const { data, error } = await supabase
        .from('talleres').select('*').eq('id', params.id).single()
      if (error || !data) { router.push('/talleres'); return }
      setTaller(data)

      if (data.propietario_id) {
        // Traer whatsapp y horario del propietario para el botón de contacto
        const { data: perfilData } = await supabase
          .from('perfiles').select('*').eq('id', data.propietario_id).single()
        setPropietario(perfilData)
      }
      setCargando(false)
    }

    cargarTaller()
  }, [params.id])

  // Verificar si la hora actual está dentro del horario del propietario
  const dentroDeHorario = () => {
    if (!propietario?.whatsapp) return false
    const horaActual = new Date().getHours()
    const inicio = propietario?.horario_inicio ?? 9
    const fin = propietario?.horario_fin ?? 20
    return horaActual >= inicio && horaActual < fin
  }

  // Abrir WhatsApp con mensaje predeterminado del taller
  const contactarWhatsApp = () => {
    const numero = `56${propietario.whatsapp}`
    const mensaje = encodeURIComponent(
      `Hola, vengo de la app VeriCar. Me interesa contactar el taller: ${taller.nombre}, ubicado en ${taller.comuna}. ¿Están disponibles?`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  if (cargando) {
    return (
      <main style={{minHeight: '100vh', background: '#f5f5f5'}}>
        <Navbar />
        <div style={{paddingTop: '104px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 104px)'}}>
          <p style={{color: '#888', fontSize: '14px'}}>Cargando taller...</p>
        </div>
      </main>
    )
  }

  if (!taller) return null

  const propietarioTieneWhatsapp = !!propietario?.whatsapp
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
        .btn-llamar { transition: all 0.2s; }
        .btn-llamar:hover { background: #f5f5f5 !important; border-color: #333 !important; }
        .btn-volver { transition: color 0.2s; }
        .btn-volver:hover { color: #2563eb !important; }
        .taller-grid { grid-template-columns: 1fr 340px !important; }

        @media (max-width: 768px) {
          .taller-grid { grid-template-columns: 1fr !important; }
          .taller-padding { padding: 104px 16px 60px !important; }
        }
      `}</style>

      <Navbar />

      <div className="taller-padding" style={{paddingTop: '104px', maxWidth: '1000px', margin: '0 auto', padding: '120px 40px 60px'}}>

        <button className="btn-volver" onClick={() => router.back()} style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#888', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', fontWeight: '500'}}>
          ← Volver a talleres
        </button>

        <div className="taller-grid" style={{display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px'}}>

          {/* Columna izquierda */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

            {/* Imagen */}
            <div style={{width: '100%', height: '300px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee'}}>
              {taller.foto_url
                ? <img src={taller.foto_url} alt={taller.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                : <span style={{fontSize: '80px'}}>🏪</span>
              }
            </div>

            {/* Descripción */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '12px'}}>Sobre el taller</h3>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>{taller.descripcion}</p>
            </div>

            {/* Servicios */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Servicios</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                {taller.servicios?.split(',').map((s: string) => (
                  <div key={s} style={{background: '#eff6ff', color: '#2563eb', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bfdbfe'}}>
                    {s.trim()}
                  </div>
                ))}
              </div>
            </div>

            {/* Información */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Información</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[
                  { icono: '📍', label: 'Dirección', valor: `${taller.direccion}, ${getNombreRegion(taller.region)}` },
                  { icono: '🕐', label: 'Horario', valor: taller.horario },
                  { icono: '📞', label: 'Teléfono', valor: taller.telefono },
                ].map((info) => (
                  <div key={info.label} style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                    <span style={{fontSize: '18px', flexShrink: 0}}>{info.icono}</span>
                    <div>
                      <div style={{fontSize: '11px', color: '#aaa', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{info.label}</div>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>{info.valor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Card principal */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h1 style={{fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '6px'}}>{taller.nombre}</h1>
              <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>📍 {taller.comuna}</p>
              <div style={{height: '1px', background: '#f0f0f0', margin: '0 0 16px'}} />

              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

                {/* CASO 1 — Sin sesión */}
                {!usuario && (
                  <>
                    <p style={{fontSize: '13px', color: '#888', textAlign: 'center'}}>
                      Inicia sesión para contactar al taller
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
                      <IconoWhatsApp />
                      Ingresar para contactar
                    </button>
                  </>
                )}

                {/* CASO 2 — Con sesión pero sin verificar */}
                {usuario && !perfilVerificado && (
                  <>
                    <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px'}}>
                      <div style={{fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '4px'}}>⚠ Verificación requerida</div>
                      <div style={{fontSize: '12px', color: '#b45309'}}>Solo usuarios verificados pueden contactar talleres.</div>
                    </div>
                    <button
                      onClick={() => router.push('/verificar?origen=talleres')}
                      style={{width: '100%', background: '#000', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'}}
                    >
                      Verificar mi cuenta
                    </button>
                  </>
                )}

                {/* CASO 3 — Verificado pero sin WhatsApp configurado */}
                {usuario && perfilVerificado && !propietarioTieneWhatsapp && (
                  <div style={{background: '#f9f9f9', border: '1px solid #eee', borderRadius: '10px', padding: '14px 16px', textAlign: 'center'}}>
                    <p style={{fontSize: '13px', color: '#888'}}>El taller aún no ha configurado su contacto WhatsApp</p>
                  </div>
                )}

                {/* CASO 4 — Verificado y con WhatsApp */}
                {usuario && perfilVerificado && propietarioTieneWhatsapp && (
                  <>
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
                      <IconoWhatsApp color={estaEnHorario ? '#fff' : '#aaa'} />
                      {estaEnHorario ? 'Contactar por WhatsApp' : 'Fuera de horario'}
                    </button>

                    {/* Mensaje de horario */}
                    {estaEnHorario ? (
                      <p style={{fontSize: '12px', color: '#16a34a', textAlign: 'center', fontWeight: '600'}}>
                        ✓ Disponible ahora · Atención de {propietario.horario_inicio}:00 a {propietario.horario_fin}:00
                      </p>
                    ) : (
                      <p style={{fontSize: '12px', color: '#f59e0b', textAlign: 'center', fontWeight: '600'}}>
                        ⏰ Fuera de horario · Atención de {propietario.horario_inicio}:00 a {propietario.horario_fin}:00
                      </p>
                    )}
                  </>
                )}

                {/* Botón llamar — siempre visible si hay sesión */}
                {usuario && (
                  <button
                    className="btn-llamar"
                    onClick={() => window.location.href = `tel:${taller.telefono}`}
                    style={{
                      width: '100%', background: '#fff', color: '#333',
                      border: '1.5px solid #e5e5e5', padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    📞 Llamar al taller
                  </button>
                )}
              </div>
            </div>

            {/* Card propietario */}
            {propietario && (
              <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
                <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>Propietario</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '48px', height: '48px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0}}>
                    {propietario?.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{fontSize: '15px', fontWeight: '600', color: '#000'}}>{propietario.nombre}</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px'}}>
                      <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                      <span style={{fontSize: '12px', color: '#22c55e', fontWeight: '600'}}>Verificado</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}