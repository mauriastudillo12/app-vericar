// Componente de talleres destacados
// Lee talleres reales desde Supabase donde destacado = true

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getNombreRegion } from '../lib/regiones'

export default function FeaturedTalleres() {

  const [talleres, setTalleres] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const cargarTalleres = async () => {
      const { data, error } = await supabase
        .from('talleres')
        .select('*')
        .eq('destacado', true)
        .order('created_at', { ascending: false })

      if (error) console.error('Error cargando talleres:', error)
      else setTalleres(data || [])
      setCargando(false)
    }
    cargarTalleres()
  }, [])

  return (
    <section className="section-padding" style={{background: '#f5f5f5', padding: '80px 40px'}}>

      <style>{`
        .taller-card-home { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .taller-card-home:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(37,99,235,0.15) !important; }
        .btn-ver-talleres { transition: background 0.2s ease, color 0.2s ease; }
        .btn-ver-talleres:hover { background: #000 !important; color: #fff !important; }
      `}</style>

      {/* Encabezado con botón ver todos */}
      <div className="section-header" style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 40px'}}>
        <div>
          <p style={{color: '#2563eb', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px'}}>
            Talleres mecánicos
          </p>
          <h2 style={{fontSize: '2rem', fontWeight: '800', color: '#000', lineHeight: 1.2, marginBottom: '6px'}}>
            Talleres destacados
          </h2>
          <p style={{fontSize: '14px', color: '#888'}}>
            Talleres verificados cerca de ti
          </p>
        </div>
        <button
          className="btn-ver-talleres"
          onClick={() => router.push('/talleres')}
          style={{background: 'transparent', border: '1.5px solid #000', color: '#000', padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'}}
        >
          Ver todos los talleres →
        </button>
      </div>

      {/* Estado de carga */}
      {cargando ? (
        <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>Cargando talleres...</div>
      ) : talleres.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px', color: '#888', fontSize: '14px'}}>No hay talleres destacados por ahora</div>
      ) : (
        /* Grid responsive — 3 columnas en desktop, 1 en móvil */
        <div className="grid-responsive" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto'}}>
          {talleres.map((taller) => (
            <div
              key={taller.id}
              className="taller-card-home"
              onClick={() => router.push(`/talleres/${taller.id}`)}
              style={{background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee', cursor: 'pointer'}}
            >
              {/* Imagen */}
              <div style={{width: '100%', height: '180px', background: 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                {taller.foto_url
                  ? <img src={taller.foto_url} alt={taller.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  : <span style={{fontSize: '48px'}}>🏪</span>
                }
              </div>

              {/* Cuerpo */}
              <div style={{padding: '18px 20px'}}>
                <div style={{fontSize: '16px', fontWeight: '700', color: '#000', marginBottom: '4px'}}>{taller.nombre}</div>
                <div style={{fontSize: '12px', color: '#888', marginBottom: '10px'}}>📍 {taller.direccion} · {taller.comuna}</div>

                {/* Servicios */}
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px'}}>
                  {taller.servicios?.split(',').slice(0, 3).map((s: string) => (
                    <div key={s} style={{background: '#eff6ff', color: '#2563eb', fontSize: '10px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px'}}>
                      {s.trim()}
                    </div>
                  ))}
                </div>

                <div style={{fontSize: '12px', color: '#888', marginBottom: '14px'}}>🕐 {taller.horario}</div>

                <div style={{display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '12px', borderTop: '1px solid #f0f0f0'}}>
                  <div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e'}} />
                  <span style={{fontSize: '12px', color: '#888'}}>{taller.comuna}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}