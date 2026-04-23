// Página de detalle de un taller
// Muestra info completa, servicios, horario y botón de contacto

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { getNombreRegion } from '../../lib/regiones'

export default function DetalleTaller() {

  const params = useParams()
  const router = useRouter()
  const [taller, setTaller] = useState<any>(null)
  const [propietario, setPropietario] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {

    // Verificar sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
    })

    // Cargar datos del taller desde Supabase
    const cargarTaller = async () => {
      const { data, error } = await supabase
        .from('talleres')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/talleres')
        return
      }

      setTaller(data)

      // Cargar perfil del propietario si existe
      if (data.propietario_id) {
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', data.propietario_id)
          .single()

        setPropietario(perfilData)
      }

      setCargando(false)
    }

    cargarTaller()
  }, [params.id])

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

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .btn-contactar { transition: background 0.2s, transform 0.15s; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.02); }
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
          ← Volver a talleres
        </button>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px'}}>

          {/* Columna izquierda */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

            {/* Imagen del taller */}
            <div style={{
              width: '100%', height: '300px',
              background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)',
              borderRadius: '16px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #eee',
            }}>
              {taller.foto_url ? (
                <img src={taller.foto_url} alt={taller.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <span style={{fontSize: '80px'}}>🏪</span>
              )}
            </div>

            {/* Descripción */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '12px'}}>
                Sobre el taller
              </h3>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>
                {taller.descripcion}
              </p>
            </div>

            {/* Servicios */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                Servicios
              </h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                {taller.servicios?.split(',').map((s: string) => (
                  <div key={s} style={{
                    background: '#eff6ff', color: '#2563eb',
                    fontSize: '13px', fontWeight: '600',
                    padding: '8px 16px', borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                  }}>
                    {s.trim()}
                  </div>
                ))}
              </div>
            </div>

            {/* Información de contacto */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                Información
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[
                  { icono: '📍', label: 'Dirección', valor: `${taller.direccion}, ${getNombreRegion(taller.region)}` },
                  { icono: '🕐', label: 'Horario', valor: taller.horario },
                  { icono: '📞', label: 'Teléfono', valor: taller.telefono },
                ].map((info) => (
                  <div key={info.label} style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                    <span style={{fontSize: '18px', flexShrink: 0}}>{info.icono}</span>
                    <div>
                      <div style={{fontSize: '11px', color: '#aaa', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        {info.label}
                      </div>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#000'}}>
                        {info.valor}
                      </div>
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

              <h1 style={{fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '6px'}}>
                {taller.nombre}
              </h1>

              <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>
                📍 {taller.comuna}
              </p>

              <div style={{height: '1px', background: '#f0f0f0', margin: '0 0 16px'}} />

              {/* Botones de acción */}
              {usuario ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <button
                    className="btn-contactar"
                    onClick={() => router.push(`/chat?vendedor_id=${taller.propietario_id}`)}
                    style={{
                      width: '100%', background: '#2563eb', color: '#fff', border: 'none',
                      padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Contactar taller
                  </button>
                  
                   <button
  onClick={() => window.location.href = `tel:${taller.telefono}`}
  style={{
    width: '100%', background: '#fff', color: '#333',
    border: '1.5px solid #e5e5e5',
    padding: '14px', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  }}
>
  📞 Llamar al taller
</button>
                </div>
              ) : (
                <div>
                  <p style={{fontSize: '13px', color: '#888', marginBottom: '12px', textAlign: 'center'}}>
                    Inicia sesión para contactar al taller
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="btn-contactar"
                    style={{
                      width: '100%', background: '#2563eb', color: '#fff', border: 'none',
                      padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Ingresar para contactar
                  </button>
                </div>
              )}
            </div>

            {/* Card del propietario */}
            {propietario && (
              <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
                <h3 style={{fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                  Propietario
                </h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#2563eb', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: '700', flexShrink: 0,
                  }}>
                    {propietario?.nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{fontSize: '15px', fontWeight: '600', color: '#000'}}>
                      {propietario.nombre}
                    </div>
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