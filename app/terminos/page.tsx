// Página de Términos y Condiciones de VeriCar
// Información legal básica sobre el uso de la plataforma

import Navbar from '../components/Navbar'
import Footer from '../components/footer'

export default function Terminos() {
  return (
    <main style={{minHeight: '100vh', background: '#f5f5f5'}}>

      <Navbar />

      <div style={{paddingTop: '104px', maxWidth: '800px', margin: '0 auto', padding: '120px 40px 80px'}}>

        {/* Encabezado */}
        <div style={{marginBottom: '40px'}}>
          <h1 style={{fontSize: '2.2rem', fontWeight: '900', color: '#000', marginBottom: '12px'}}>
            Términos y Condiciones
          </h1>
          <p style={{fontSize: '14px', color: '#888'}}>
            Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Contenido */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>

          {[
            {
              titulo: '1. Aceptación de los términos',
              contenido: 'Al registrarte y usar VeriCar, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar la plataforma. VeriCar se reserva el derecho de modificar estos términos en cualquier momento, notificando a los usuarios registrados.',
            },
            {
              titulo: '2. Descripción del servicio',
              contenido: 'VeriCar es un marketplace verificado de compra y venta de autos, repuestos y servicios automotrices en Chile. Actuamos como intermediario entre compradores y vendedores, facilitando el contacto entre ambas partes. VeriCar no es parte de ninguna transacción entre usuarios.',
            },
            {
              titulo: '3. Registro y verificación',
              contenido: 'Para publicar o contactar vendedores debes registrarte con datos reales. La verificación de identidad con RUT y cédula de identidad es obligatoria para acceder a todas las funciones de la plataforma. Te comprometes a proporcionar información verdadera y actualizada.',
            },
            {
              titulo: '4. Publicaciones',
              contenido: 'Eres el único responsable del contenido que publicas. Las publicaciones deben corresponder a vehículos o repuestos reales que sean de tu propiedad o que tengas autorización para vender. Está prohibido publicar información falsa, engañosa o duplicada. VeriCar puede eliminar publicaciones que violen estas normas sin previo aviso.',
            },
            {
              titulo: '5. Prohibiciones',
              contenido: 'Está estrictamente prohibido: publicar autos o repuestos que no sean de tu propiedad, realizar estafas o intentos de fraude, usar información de otros usuarios sin su consentimiento, publicar contenido ilegal o inapropiado, crear múltiples cuentas para evadir restricciones, y cualquier actividad que perjudique a otros usuarios de la plataforma.',
            },
            {
              titulo: '6. Patente y datos del vehículo',
              contenido: 'La patente del vehículo se mantiene oculta hasta que ambas partes — comprador y vendedor — hayan establecido contacto verificado dentro de la plataforma. Esta medida existe para proteger a los usuarios de fraudes y duplicaciones. Proporcionar una patente falsa es motivo de suspensión inmediata de la cuenta.',
            },
            {
              titulo: '7. Responsabilidad de VeriCar',
              contenido: 'VeriCar facilita el contacto entre usuarios pero no garantiza la calidad, seguridad o legalidad de los vehículos publicados. No somos responsables de las transacciones realizadas fuera de la plataforma. Recomendamos siempre verificar el estado del vehículo con un mecánico de confianza antes de concretar cualquier compra.',
            },
            {
              titulo: '8. Privacidad y datos personales',
              contenido: 'Tus datos personales son tratados con confidencialidad y no son vendidos a terceros. La información de RUT y cédula es utilizada únicamente para verificación de identidad. Al registrarte aceptas que VeriCar pueda contactarte con información relevante sobre tu cuenta y publicaciones.',
            },
            {
              titulo: '9. Suspensión de cuentas',
              contenido: 'VeriCar puede suspender o eliminar cuentas que violen estos términos, realicen actividades fraudulentas, reciban múltiples reportes negativos de otros usuarios, o proporcionen información falsa durante el registro o verificación.',
            },
            {
              titulo: '10. Ley aplicable',
              contenido: 'Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a los tribunales competentes de Santiago de Chile. Al usar VeriCar confirmas que tienes al menos 18 años de edad.',
            },
          ].map((seccion) => (
            <div key={seccion.titulo} style={{background: '#fff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #eee'}}>
              <h2 style={{fontSize: '17px', fontWeight: '800', color: '#000', marginBottom: '12px'}}>
                {seccion.titulo}
              </h2>
              <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>
                {seccion.contenido}
              </p>
            </div>
          ))}

          {/* Contacto */}
          <div style={{background: '#eff6ff', borderRadius: '16px', padding: '28px 32px', border: '1px solid #bfdbfe'}}>
            <h2 style={{fontSize: '17px', fontWeight: '800', color: '#000', marginBottom: '12px'}}>
              ¿Tienes dudas?
            </h2>
            <p style={{fontSize: '14px', color: '#666', lineHeight: 1.8}}>
              Si tienes preguntas sobre estos términos o sobre el funcionamiento de VeriCar, puedes contactarnos a través del formulario de contacto o directamente al correo <strong>contacto@vericar.cl</strong>
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  )
}