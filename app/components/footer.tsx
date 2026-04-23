// Footer de VeriCar
// Aparece en la página de inicio al final

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{background: '#0f0f0f', color: '#fff', padding: '60px 40px 32px'}}>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-logo-col {
            grid-column: 1 / -1 !important;
          }
          .footer-bottom {
            flex-direction: column !important;
            gap: 16px !important;
            text-align: center !important;
          }
          .footer-links {
            justify-content: center !important;
          }
          footer {
            padding: 48px 20px 24px !important;
          }
        }
      `}</style>

      <div style={{maxWidth: '1200px', margin: '0 auto'}}>

        {/* Fila superior — logo + secciones */}
        <div className="footer-grid" style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px'}}>

          {/* Logo y descripción */}
          <div className="footer-logo-col">
            <div style={{fontSize: '22px', fontWeight: '900', letterSpacing: '4px', color: '#fff', marginBottom: '16px'}}>
              VERICAR
            </div>
            <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8, maxWidth: '280px'}}>
              El marketplace verificado de autos y repuestos en Chile. Compra y vende con identidad verificada.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{fontSize: '12px', fontWeight: '700', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px'}}>
              Marketplace
            </h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {[
                { label: 'Autos', href: '/autos' },
                { label: 'Repuestos', href: '/repuestos' },
                { label: 'Talleres', href: '/talleres' },
              ].map((link) => (
                <Link key={link.label} href={link.href} style={{color: '#666', fontSize: '14px', textDecoration: 'none'}}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mi cuenta */}
          <div>
            <h4 style={{fontSize: '12px', fontWeight: '700', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px'}}>
              Mi cuenta
            </h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {[
                { label: 'Registrarse', href: '/registro' },
                { label: 'Ingresar', href: '/login' },
                { label: 'Mi perfil', href: '/perfil' },
                { label: 'Publicar auto', href: '/publicar-auto' },
              ].map((link) => (
                <Link key={link.label} href={link.href} style={{color: '#666', fontSize: '14px', textDecoration: 'none'}}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Seguridad */}
          <div>
            <h4 style={{fontSize: '12px', fontWeight: '700', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px'}}>
              Seguridad
            </h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {[
                { label: 'Cómo funciona', href: '#' },
                { label: 'Vendedores verificados', href: '#' },
                { label: 'Patente protegida', href: '#' },
                { label: 'Reportar problema', href: '#' },
              ].map((link) => (
                <Link key={link.label} href={link.href} style={{color: '#666', fontSize: '14px', textDecoration: 'none'}}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Separador */}
        <div style={{height: '1px', background: '#1a1a1a', marginBottom: '24px'}} />

        {/* Fila inferior — copyright */}
        <div className="footer-bottom" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <p style={{fontSize: '13px', color: '#444'}}>
            © {new Date().getFullYear()} VeriCar — Marketplace verificado de Chile
          </p>
          <div className="footer-links" style={{display: 'flex', gap: '24px'}}>
            {[
              { label: 'Términos', href: '/terminos' },
              { label: 'Privacidad', href: '#' },
              { label: 'Contacto', href: '#' },
            ].map((link) => (
              <Link key={link.label} href={link.href} style={{color: '#444', fontSize: '13px', textDecoration: 'none'}}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}