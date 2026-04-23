// Componente de búsqueda y filtros rápidos
// Incluye el campo de texto para buscar y los pills de filtro

export default function SearchBar() {
  return (
    // Contenedor general de búsqueda + filtros
    <div style={{background: '#0f0f0f'}}>

      {/* Campo de búsqueda */}
      <div style={{padding: '12px 20px', borderBottom: '0.5px solid #1a1a1a'}}>
        <input
          type="text"
          placeholder="Buscar marca, modelo, año..."
          style={{
            width: '100%',
            background: '#161616',
            border: '0.5px solid #2a2a2a',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Filtros rápidos — pills horizontales */}
      <div style={{display: 'flex', gap: '8px', padding: '10px 20px', borderBottom: '0.5px solid #1a1a1a', overflowX: 'auto'}}>
        
        {/* Pill activo — fondo blanco */}
        <div style={{background: '#fff', color: '#000', border: '0.5px solid #fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'}}>
          Todos
        </div>

        {/* Pills inactivos — fondo oscuro */}
        {['Santiago', 'Valparaíso', 'Bencina', 'Eléctrico', 'Manual', 'Hasta $10M'].map((filtro) => (
          <div key={filtro} style={{background: '#1a1a1a', color: '#aaa', border: '0.5px solid #2a2a2a', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'}}>
            {filtro}
          </div>
        ))}

      </div>

    </div>
  )
}