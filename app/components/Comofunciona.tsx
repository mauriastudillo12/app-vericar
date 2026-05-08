// app/components/ComoFunciona.tsx
// Sección "Cómo funciona VeriCar"
// Explica el proceso en 4 pasos simples incluyendo talleres
// Va entre Features y los autos destacados
// Botones siempre visibles — si no está logueado mandan al login

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ComoFunciona() {

  // Detectar si hay sesión activa para redirigir correctamente los botones
  const [logueado, setLogueado] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLogueado(!!session)
    })
  }, [])

  return (
    <section className="section-padding" style={{background: '#fff', padding: '80px 40px'}}>

      <style>{`
        .paso-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .paso-card:hover { transform: translateY(-8px); box-shadow: 0 20px 48px rgba(37,99,235,0.1) !important; }
        .btn-banner { transition: background 0.2s, transform 0.15s; }
        .btn-banner:hover { transform: scale(1.03); }
        .btn-banner-outline { transition: all 0.2s; }
        .btn-banner-outline:hover { background: rgba(255,255,255,0.1) !important; transform: scale(1.03); }
      `}</style>

      <div style={{maxWidth: '1200px', margin: '0 auto'}}>

        {/* Encabezado de la sección */}
        <div style={{textAlign: 'center', marginBottom: '56px'}}>
          <p style={{color: '#2563eb', fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px'}}>
            Sin complicaciones
          </p>
          <h2 style={{fontSize: '2.4rem', fontWeight: '900', color: '#000', marginBottom: '16px', lineHeight: 1.2}}>
            ¿Cómo funciona VeriCar?
          </h2>
          <p style={{fontSize: '16px', color: '#888', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7}}>
            Compra, vende autos, encuentra repuestos y talleres de confianza — todo en un solo lugar verificado
          </p>
        </div>

        {/* Grid de 4 pasos */}
        <div className="grid-responsive" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '56px'}}>
          {[
            {
              numero: '01', icono: '🔐',
              titulo: 'Regístrate y verifica',
              descripcion: 'Crea tu cuenta con RUT y cédula de identidad. Tu identidad queda verificada y visible para todos los usuarios.',
              color: '#eff6ff', colorBorde: '#bfdbfe',
            },
            {
              numero: '02', icono: '🚗',
              titulo: 'Compra, vende o publica',
              descripcion: 'Publica tu auto o repuesto con fotos reales, o navega el feed con filtros por región, marca, precio y combustible.',
              color: '#f0fdf4', colorBorde: '#bbf7d0',
            },
            {
              numero: '03', icono: '🏪',
              titulo: 'Encuentra talleres verificados',
              descripcion: 'Busca talleres mecánicos de confianza cerca de ti. Filtra por servicio, región y comuna. Contacta directo sin intermediarios.',
              color: '#fefce8', colorBorde: '#fde68a',
            },
            {
              numero: '04', icono: '💬',
              titulo: 'Contacta con seguridad',
              descripcion: 'Chatea directamente con vendedores y talleres verificados. La patente se revela solo cuando ambas partes están listas.',
              color: '#fdf4ff', colorBorde: '#e9d5ff',
            },
          ].map((paso) => (
            <div key={paso.numero} className="paso-card" style={{
              background: '#fff', borderRadius: '20px',
              padding: '32px 24px', border: '1px solid #eee',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'center',
            }}>
              <div style={{fontSize: '11px', fontWeight: '800', color: '#2563eb', letterSpacing: '2px', marginBottom: '20px'}}>
                PASO {paso.numero}
              </div>
              <div style={{
                width: '68px', height: '68px', borderRadius: '18px',
                background: paso.color, border: `1.5px solid ${paso.colorBorde}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px', margin: '0 auto 20px',
              }}>
                {paso.icono}
              </div>
              <h3 style={{fontSize: '16px', fontWeight: '800', color: '#000', marginBottom: '10px', lineHeight: 1.3}}>
                {paso.titulo}
              </h3>
              <p style={{fontSize: '13px', color: '#888', lineHeight: 1.7}}>
                {paso.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* Banners inferiores */}
        <div className="grid-responsive-2" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>

          {/* Banner compra y venta */}
          <div style={{
            background: 'linear-gradient(135deg, #000 0%, #1e1e1e 100%)',
            borderRadius: '20px', padding: '36px 40px',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div>
              <h3 style={{fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px'}}>
                ¿Listo para comprar o vender?
              </h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6}}>
                Únete a miles de chilenos que ya usan VeriCar para comprar y vender autos con total seguridad.
              </p>
            </div>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              {/* Si no está logueado manda al login, si está logueado manda a publicar */}
              <Link href={logueado ? '/publicar-auto' : '/login'} style={{textDecoration: 'none'}}>
                <button className="btn-banner" style={{
                  background: '#2563eb', color: '#fff', border: 'none',
                  padding: '12px 24px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}>
                  Publicar auto
                </button>
              </Link>
              <Link href="/autos" style={{textDecoration: 'none'}}>
                <button className="btn-banner-outline" style={{
                  background: 'transparent', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  padding: '12px 24px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  Ver autos
                </button>
              </Link>
            </div>
          </div>

          {/* Banner talleres */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            borderRadius: '20px', padding: '36px 40px',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div>
              <h3 style={{fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '8px'}}>
                ¿Buscas un taller de confianza?
              </h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6}}>
                Encuentra talleres verificados cerca de ti. Mecánica, pintura, frenos y mucho más en tu región.
              </p>
            </div>
            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <Link href="/talleres" style={{textDecoration: 'none'}}>
                <button className="btn-banner" style={{
                  background: '#fff', color: '#2563eb', border: 'none',
                  padding: '12px 24px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}>
                  Ver talleres
                </button>
              </Link>
              {/* Si no está logueado manda al login, si está logueado manda a registrar taller */}
              <Link href={logueado ? '/registrar-taller' : '/login'} style={{textDecoration: 'none'}}>
                <button className="btn-banner-outline" style={{
                  background: 'transparent', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  padding: '12px 24px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  Registrar mi taller
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}