// Componente de secciones principales de VeriCar
// Muestra los 3 servicios que ofrece la plataforma
// Cada tarjeta lleva a su sección correspondiente

import Link from 'next/link'

const secciones = [
  {
    icon: '🚗',
    title: 'Compra y venta de autos',
    desc: 'Compra y vende vehículos con identidad verificada. Sin estafas, sin fantasmas, sin riesgos.',
    color: '#eff6ff',
    colorBorde: '#bfdbfe',
    ruta: '/autos',
    label: 'Ver autos',
  },
  {
    icon: '🔧',
    title: 'Repuestos y accesorios',
    desc: 'Encuentra repuestos originales y alternativos para tu auto. Vendedores verificados en todo Chile.',
    color: '#f0fdf4',
    colorBorde: '#bbf7d0',
    ruta: '/repuestos',
    label: 'Ver repuestos',
  },
  {
    icon: '🏪',
    title: 'Talleres mecánicos',
    desc: 'Encuentra talleres verificados cerca de ti. Filtra por servicio, región y comuna. Contacta directo.',
    color: '#fefce8',
    colorBorde: '#fde68a',
    ruta: '/talleres',
    label: 'Ver talleres',
  },
]

export default function Features() {
  return (
    <section style={{background: '#f5f5f5', padding: '80px 40px'}}>

      <style>{`
        .feature-card { transition: transform 0.25s ease, box-shadow 0.25s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 48px rgba(37,99,235,0.1) !important; }
        .feature-link { transition: color 0.2s; }
        .feature-link:hover { color: #1d4ed8 !important; }
      `}</style>

      {/* Encabezado */}
      <div style={{textAlign: 'center', marginBottom: '56px'}}>
        <p style={{
          color: '#2563eb', fontSize: '12px', fontWeight: '700',
          letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px',
        }}>
          Todo en un solo lugar
        </p>
        <h2 style={{fontSize: '2.2rem', fontWeight: '900', color: '#000', lineHeight: 1.2, marginBottom: '16px'}}>
          El ecosistema completo<br />para tu vehículo
        </h2>
        <p style={{fontSize: '15px', color: '#888', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7}}>
          Autos, repuestos y talleres — todo verificado en una sola plataforma
        </p>
      </div>

      {/* Grid de 3 secciones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        {secciones.map((s) => (
          <div key={s.title} className="feature-card" style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '20px',
            padding: '36px 28px',
            textAlign: 'center',
          }}>

            {/* Ícono con fondo de color */}
            <div style={{
              width: '72px', height: '72px',
              background: s.color,
              border: `1.5px solid ${s.colorBorde}`,
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', margin: '0 auto 20px',
            }}>
              {s.icon}
            </div>

            {/* Título */}
            <h3 style={{fontSize: '17px', fontWeight: '800', color: '#000', marginBottom: '12px'}}>
              {s.title}
            </h3>

            {/* Descripción */}
            <p style={{fontSize: '14px', color: '#888', lineHeight: 1.7, marginBottom: '24px'}}>
              {s.desc}
            </p>

            {/* Botón */}
            <Link href={s.ruta} style={{textDecoration: 'none'}}>
              <div className="feature-link" style={{
                display: 'inline-block',
                fontSize: '13px', color: '#2563eb',
                fontWeight: '700', cursor: 'pointer',
              }}>
                {s.label} →
              </div>
            </Link>

          </div>
        ))}
      </div>
    </section>
  )
}