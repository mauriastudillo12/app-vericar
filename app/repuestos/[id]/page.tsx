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

  useEffect(() => {

    // Verificar sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
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

  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <style>{`
        .btn-contactar { transition: background 0.2s, transform 0.15s; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.02); }
        .btn-guardar { transition: background 0.2s; }
        .btn-guardar:hover { background: #f0f0f0 !important; }
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

              {/* Botones de acción */}
              {usuario ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <button
                    className="btn-contactar"
                    onClick={() => router.push(`/chat?repuesto_id=${repuesto.id}&vendedor_id=${repuesto.vendedor_id}`)}
                    style={{
                      width: '100%', background: '#2563eb', color: '#fff', border: 'none',
                      padding: '14px', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Contactar vendedor
                  </button>
                  <button className="btn-guardar" style={{
                    width: '100%', background: '#fff', color: '#333',
                    border: '1.5px solid #e5e5e5',
                    padding: '14px', borderRadius: '10px',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                  }}>
                    Guardar en favoritos
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