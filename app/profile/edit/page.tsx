export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from './EditProfileForm'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: member } = await (supabase as any)
    .from('members')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!member) redirect('/register')

  return (
    <div className="max-w-xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-2 mt-8">Editar Perfil</h1>
      <p className="text-gray-400 mb-6 text-sm">Actualiza as tuas informações de membro.</p>
      <EditProfileForm member={member} />
    </div>
  )
}
