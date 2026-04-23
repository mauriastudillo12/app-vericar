// Componente de autos destacados
// Lee autos reales desde Supabase donde destacado = true
// Cada tarjeta lleva al detalle del auto

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { getNombreRegion } from '../lib/regiones'

export default function FeaturedCars() {

  const [autos, setAutos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarAutos = async () => {
      const { data, error } = await supabase
        .from('autos')
        .select('*')
        .eq('destacado', true)
        .order('created_at', { ascending: false })

      if (error) console.error('Error cargando autos:', error)
      else setAutos(data || [])
      setCargando(false)
    }
    cargarAutos()
  }, [])

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  return (
    <section style={{ background: '#f5f5f5', padding: '80px 40px' }}>

      <style>{`
        .car-card { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .car-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(37,99,235,0.15) !important; }
        .btn-contactar { transition: background 0.2s ease, transform 0.15s ease; }
        .btn-contactar:hover { background: #1d4ed8 !important; transform: scale(1.05); }
        .btn-ver-todos { transition: background 0.2s ease, color 0.2s ease; }
        .btn-ver-todos:hover { background: #000 !important; color: #fff !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 40px' }}>
        <div>
          <p style={{ color: '#2563eb', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Mayor visibilidad
          </p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#000', lineHeight: 1.2, marginBottom: '6px' }}>
            Autos destacados
          </h2>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Vendedores verificados con RUT y cédula
          </p>
        </div>
        <Link href="/autos" style={{ textDecoration: 'none' }}>
          <button className="btn-ver-todos" style={{ background: 'transparent', border: '1.5px solid #000', color: '#000', padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Ver todos los autos →
          </button>
        </Link>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px' }}>Cargando autos...</div>
      ) : autos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px' }}>No hay autos destacados por ahora</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {autos.map((auto) => (
            <Link key={auto.id} href={`/autos/${auto.id}`} style={{ textDecoration: 'none' }}>
              <div className="car-card" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer' }}>

                <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {(() => {
                    const fotosArray = typeof auto.fotos === 'string' && auto.fotos
                      ? JSON.parse(auto.fotos)
                      : auto.fotos
                    return fotosArray && fotosArray.length > 0
                      ? <img src={fotosArray[0]} alt={auto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                      : <span style={{ fontSize: '52px' }}>🚗</span>
                  })()}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', letterSpacing: '1px', zIndex: 1 }}>
                    ★ DESTACADO
                  </div>
                  {auto.negociable && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', border: '1px solid #bbf7d0', zIndex: 1 }}>
                      Negociable
                    </div>
                  )}
                </div>

                <div style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '4px' }}>{auto.nombre}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px' }}>
                    {auto.km?.toLocaleString('es-CL')} km · {auto.transmision} · {auto.combustible}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#000', marginBottom: '16px' }}>
                    {formatPrecio(auto.precio)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#888' }}>{getNombreRegion(auto.region)}</span>
                    </div>
                    <button className="btn-contactar" onClick={(e) => e.preventDefault()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      Contactar
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}