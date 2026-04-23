// Barra de tabs de navegación principal
// Permite navegar entre las 4 secciones de VeriCar
// Link de Next.js para navegación rápida sin recargar

import Link from 'next/link'

// Definimos las tabs con su nombre y su ruta
const tabs = [
  { nombre: 'Autos',            ruta: '/autos'     },
  { nombre: 'Repuestos y más',  ruta: '/repuestos' },
  { nombre: 'Busco',            ruta: '/busco'     },
  { nombre: 'Talleres',         ruta: '/talleres'  },
]

// Recibe la prop "activa" para saber cuál tab resaltar
// Por ejemplo: <Sections activa="Autos" />
export default function Sections({ activa }: { activa?: string }) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e5e5e5',
      padding: '0 40px',
      display: 'flex',
      gap: '0',
    }}>

      {tabs.map((tab) => (
        <Link
          key={tab.nombre}
          href={tab.ruta}
          style={{textDecoration: 'none'}}
        >
          <div style={{
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: tab.nombre === activa ? '700' : '500',
            color: tab.nombre === activa ? '#000' : '#888',
            borderBottom: tab.nombre === activa ? '2px solid #2563eb' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}>
            {tab.nombre}
          </div>
        </Link>
      ))}

    </div>
  )
}