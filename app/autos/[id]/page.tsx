// Página de detalle de un auto
// Incluye galería de fotos con miniaturas navegables
// Botón de favoritos funcional

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'
import { getNombreRegion } from '../../lib/regiones'

// Componente separado para la galería de fotos
function Galeria({ fotos, nombre, destacado, negociable }: {
  fotos: string[]
  nombre: string
  destacado: boolean
  negociable: boolean
}) {

  const [fotoActiva, setFotoActiva] = useState(0)

  return (
    <div>
      {/* Foto principal */}
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

        {/* Flechas de navegación */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setFotoActiva(prev => prev === 0 ? fotos.length - 1 : prev - 1)}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                width: '36px', height: '36px', borderRadius: '50%',
                fontSize: '16px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
            <button
              onClick={() => setFotoActiva(prev => prev === fotos.length - 1 ? 0 : prev + 1)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                width: '36px', height: '36px', borderRadius: '50%',
                fontSize: '16px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>

            {/* Contador */}
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              fontSize: '12px', fontWeight: '600',
              padding: '4px 10px', borderRadius: '20px',
            }}>
              {fotoActiva + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div style={{display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px'}}>
          {fotos.map((foto, index) => (
            <div
              key={index}
              onClick={() => setFotoActiva(index)}
              style={{
                width: '80px', minWidth: '80px', height: '60px',
                borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                border: fotoActiva === index ? '2.5px solid #2563eb' : '2.5px solid transparent',
                opacity: fotoActiva === index ? 1 : 0.55,
                transition: 'all 0.2s',
              }}
            >
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

  // Estado de favorito
  const [esFavorito, setEsFavorito] = useState(false)
  const [guardandoFavorito, setGuardandoFavorito] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      if (session?.user) verificarFavorito(session.user.id)
    })

    const cargarAuto = async () => {
      const { data, error } = await supabase
        .from('autos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) { router.push('/autos'); return }

      setAuto(data)

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

    cargarAuto()
  }, [params.id])

  // Verificar si el auto ya está en favoritos del usuario
  const verificarFavorito = async (userId: string) => {
    const { data } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', userId)
      .eq('auto_id', params.id)
      .single()

    setEsFavorito(!!data)
  }

  // Agregar o quitar de favoritos
  const toggleFavorito = async () => {
    if (!usuario) { router.push('/login'); return }
    setGuardandoFavorito(true)

    if (esFavorito) {
      // Quitar de favoritos
      await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', usuario.id)
        .eq('auto_id', auto.id)
      setEsFavorito(false)
    } else {
      // Agregar a favoritos
      await supabase
        .from('favoritos')
        .insert({ usuario_id: usuario.id, auto_id: auto.id })
      setEsFavorito(true)
    }

    setGuardandoFavorito(false)
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

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .btn-contactar { transition: background 0.2s, transform 0.15s; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .btn-favorito { transition: all 0.2s; }
        .btn-favorito:hover { border-color: #2563eb !important; color: #2563eb !important; }
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
          ← Volver al feed
        </button>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px'}}>

          {/* Columna izquierda */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

            <Galeria
              fotos={fotosArray}
              nombre={auto.nombre}
              destacado={auto.destacado}
              negociable={auto.negociable}
            />

            {/* Descripción */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '12px'}}>
                Descripción del vendedor
              </h3>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>
                {auto.descripcion}
              </p>
            </div>

            {/* Especificaciones */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '16px'}}>
                Especificaciones
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
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

          {/* Columna derecha */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Card precio */}
            <div style={{background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #eee'}}>

              <h1 style={{fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '4px'}}>
                {auto.nombre}
              </h1>
              <p style={{fontSize: '13px', color: '#888', marginBottom: '20px'}}>
                {auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}
              </p>
              <div style={{fontSize: '32px', fontWeight: '900', color: '#000', marginBottom: '6px'}}>
                {formatPrecio(auto.precio)}
              </div>
              {auto.negociable && (
                <p style={{fontSize: '13px', color: '#16a34a', fontWeight: '600', marginBottom: '20px'}}>
                  Precio negociable
                </p>
              )}

              <div style={{height: '1px', background: '#f0f0f0', margin: '16px 0'}} />

              {/* Botones */}
              {usuario ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <button
                    className="btn-contactar"
                    onClick={() => router.push(`/chat?auto_id=${auto.id}&vendedor_id=${auto.vendedor_id}`)}
                    style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer'}}
                  >
                    Contactar vendedor
                  </button>

                  {/* Botón favorito */}
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
              ) : (
                <div>
                  <p style={{fontSize: '13px', color: '#888', marginBottom: '12px', textAlign: 'center'}}>
                    Inicia sesión para contactar al vendedor
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="btn-contactar"
                    style={{width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer'}}
                  >
                    Ingresar para contactar
                  </button>
                </div>
              )}
            </div>

            {/* Card vendedor */}
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

            {/* Patente oculta */}
            <div style={{background: '#f9f9f9', borderRadius: '16px', padding: '16px 20px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '20px'}}>🔒</span>
              <div>
                <div style={{fontSize: '13px', fontWeight: '600', color: '#333'}}>Patente oculta</div>
                <div style={{fontSize: '12px', color: '#aaa', marginTop: '2px'}}>
                  Se revela al iniciar contacto verificado
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}