// Componente de repuestos destacados
// Lee repuestos reales desde Supabase donde destacado = true

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function FeaturedRepuestos() {

  const [repuestos, setRepuestos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const cargarRepuestos = async () => {
      const { data, error } = await supabase
        .from('repuestos')
        .select('*')
        .eq('destacado', true)
        .order('created_at', { ascending: false })

      if (error) console.error('Error cargando repuestos:', error)
      else setRepuestos(data || [])
      setCargando(false)
    }
    cargarRepuestos()
  }, [])

  const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CL')

  return (
    <section className="section-padding" style={{background: '#fff', padding: '80px 40px'}}>

      <style>{`
        .repuesto-card-home { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .repuesto-card-home:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(37,99,235,0.15) !important; }
        .btn-ver-repuestos { transition: background 0.2s ease, color 0.2s ease; }
        .btn-ver-repuestos:hover { background: #000 !important; color: #fff !important; }
      `}</style>

      {/* Encabezado con botón ver todos */}
      <div className="section-header" style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 40px'}}>
        <div>
          <p style={{color: '#2563eb', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px'}}>
            Repuestos y accesorios
          </p>
          <h2 style={{fontSize: '2rem', fontWeight: '800', color: '#000', lineHeight: 1.2, marginBottom: '6px'}}>
            Repuestos destacados
          </h2>
          <p style={{fontSize: '14px', color: '#888'}}>
            Vendedores verificados en todo Chile
          </p>
        </div>
        <button
          className="btn-ver-repuestos"
          onClick={() => router.push('/repuestos')}
          style={{background: 'transparent', border: '1.5px solid #000', color: '#000', padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'}}
        >
          Ver todos los repuestos →
        </button>
      </div>

      {/* Estado de carga */}
      {cargando ? (
        <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>Cargando repuestos...</div>
      ) : repuestos.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>No hay repuestos destacados por ahora</div>
      ) : (
        /* Grid responsive — 3 columnas en desktop, 1 en móvil */
        <div className="grid-responsive" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto'}}>
          {repuestos.map((rep) => (
            <div
              key={rep.id}
              className="repuesto-card-home"
              onClick={() => router.push(`/repuestos/${rep.id}`)}
              style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer'}}
            >
              {/* Imagen */}
              <div style={{width: '100%', height: '180px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                {(() => {
                  const fotosArray = typeof rep.fotos === 'string' && rep.fotos
                    ? JSON.parse(rep.fotos)
                    : rep.fotos
                  return fotosArray && fotosArray.length > 0
                    ? <img src={fotosArray[0]} alt={rep.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    : <span style={{fontSize: '48px'}}>🔧</span>
                })()}
              </div>

              {/* Cuerpo */}
              <div style={{padding: '18px 20px'}}>
                <div style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{rep.nombre}</div>
                <div style={{fontSize: '12px', color: '#888', marginBottom: '8px'}}>
                  {rep.marca_compatible} {rep.modelo_compatible}
                </div>

                {/* Pills estado y garantía */}
                <div style={{display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap'}}>
                  <div style={{background: rep.estado === 'nuevo' ? '#f0fdf4' : '#fefce8', color: rep.estado === 'nuevo' ? '#16a34a' : '#ca8a04', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px'}}>
                    {rep.estado === 'nuevo' ? 'Nuevo' : 'Usado'}
                  </div>
                  {rep.garantia && (
                    <div style={{background: '#eff6ff', color: '#2563eb', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px'}}>
                      Con garantía
                    </div>
                  )}
                  {rep.categoria && (
                    <div style={{background: '#f5f5f5', color: '#666', fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px'}}>
                      {rep.categoria}
                    </div>
                  )}
                </div>

                {/* Precio y región */}
                <div style={{fontSize: '20px', fontWeight: '800', color: '#000', marginBottom: '12px'}}>
                  {formatPrecio(rep.precio)}
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '12px', borderTop: '1px solid #f0f0f0'}}>
                  <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                  <span style={{fontSize: '12px', color: '#888'}}>{rep.region}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}