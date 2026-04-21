'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type RegisterForm = {
  full_name: string
  email: string
  whatsapp: string
  city: string
  country: string
  favorite_team: string
  experience_level: string
}

const initialForm: RegisterForm = {
  full_name: '',
  email: '',
  whatsapp: '',
  city: '',
  country: '',
  favorite_team: '',
  experience_level: '',
}

export default function RegisterPage() {
  const router = useRouter()

  const [userEmail, setUserEmail] = useState<string>('')
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.email) {
          router.push('/auth/login')
          return
        }

        setUserEmail(user.email)

        const normalizedEmail = user.email.trim().toLowerCase()

        setForm((prev) => ({
          ...prev,
          email: normalizedEmail,
        }))

        const { data, error } = await (supabase as any)
          .from('members')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle()

        if (error) {
          console.error('Error loading member:', error)
        }

        if (data) {
          setForm({
            full_name: data.full_name ?? '',
            email: data.email ?? normalizedEmail,
            whatsapp: data.whatsapp ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
            favorite_team: data.favorite_team ?? '',
            experience_level: data.experience_level ?? '',
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setMessage('Failed to load your account details.')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const payload = {
        ...form,
        email: (form.email || userEmail).trim().toLowerCase(),
      }

      const { error } = await (supabase as any)
        .from('members')
        .upsert(payload, { onConflict: 'email' })

      if (error) {
        throw error
      }

      setMessage('Registration saved successfully.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving registration:', error)
      setMessage('Failed to save registration.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading registration...</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Complete your registration</h1>
        <p className="text-white/70 mb-8">
          Fill in your member details to join Beira F1 Fanatics.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div>
            <label htmlFor="full_name" className="mb-2 block text-sm font-medium">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="mb-2 block text-sm font-medium">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="text"
              value={form.whatsapp}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
              placeholder="+258..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-2 block text-sm font-medium">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
                placeholder="Beira"
              />
            </div>

            <div>
              <label htmlFor="country" className="mb-2 block text-sm font-medium">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={form.country}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
                placeholder="Mozambique"
              />
            </div>
          </div>

          <div>
            <label htmlFor="favorite_team" className="mb-2 block text-sm font-medium">
              Favorite F1 team
            </label>
            <input
              id="favorite_team"
              name="favorite_team"
              type="text"
              value={form.favorite_team}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
              placeholder="Ferrari, Red Bull, Mercedes..."
            />
          </div>

          <div>
            <label
              htmlFor="experience_level"
              className="mb-2 block text-sm font-medium"
            >
              Experience level
            </label>
            <select
              id="experience_level"
              name="experience_level"
              value={form.experience_level}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
            >
              <option value="">Select one</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {message ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save registration'}
          </button>
        </form>
      </div>
    </main>
  )
}