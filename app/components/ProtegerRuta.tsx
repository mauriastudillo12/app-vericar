'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
  requiereVerificado?: boolean
  requiereAdmin?: boolean
  origenVerificacion?: string
}

export default function ProtegerRuta({ children, requiereVerificado = false, requiereAdmin = false, origenVerificacion }: Props) {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    const verificar = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      if (requiereVerificado || requiereAdmin) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('verificado, es_admin')
          .eq('id', session.user.id)
          .single()

        if (requiereAdmin && !perfil?.es_admin) {
          router.push('/')
          return
        }

        if (requiereVerificado && !perfil?.verificado) {
          router.push(`/verificar${origenVerificacion ? `?origen=${origenVerificacion}` : ''}`)
          return
        }
      }

      setAutorizado(true)
      setVerificando(false)
    }

    verificar()

    // Escuchar cambios de sesión — detectar expiración
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      }
      if (event === 'TOKEN_REFRESHED') {
        console.log('Sesión renovada automáticamente')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (verificando) {
    return (
      <div style={{minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{width: '40px', height: '40px', border: '3px solid #e5e5e5', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'}} />
          <p style={{color: '#888', fontSize: '14px'}}>Verificando acceso...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!autorizado) return null

  return <>{children}</>
}
