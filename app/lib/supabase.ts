// Cliente de Supabase
// Este archivo crea la conexión con la base de datos
// Lo importamos en cualquier parte de la app que necesite datos

import { createClient } from '@supabase/supabase-js'

// Leemos las variables de entorno que definimos en .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creamos y exportamos el cliente
// El ! al final le dice a TypeScript que estamos seguros que el valor existe
export const supabase = createClient(supabaseUrl, supabaseKey)