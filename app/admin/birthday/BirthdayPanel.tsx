'use client'

import { useState } from 'react'

type BirthdayMember = {
  email: string
  nome_completo: string
  nickname: string
  data_nasc: string
  foto_url?: string | null
  criado_em?: string | null
  daysUntil?: number
}

export default function BirthdayPanel({
  todayBirthdays,
  upcoming,
  noDataCount,
}: {
  todayBirthdays: BirthdayMember[]
  upcoming: BirthdayMember[]
  noDataCount: number
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState('')

  async function handleSendAll() {
    if (todayBirthdays.length === 0) return
    if (!confirm(`Enviar emails de parabéns a ${todayBirthdays.length} membro(s)?`)) return
    setLoading(true); setError(''); setResult(null)

    const res = await fetch('/api/admin/send-birthday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()

    if (!res.ok || data.error) {
      setError(data.error ?? 'Erro ao enviar.')
    } else {
      setResult({ sent: data.sent, total: data.total })
    }
    setLoading(false)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', timeZone: 'UTC' })
  }

  function getAge(dataNasc: string) {
    const now = new Date()
    const birth = new Date(dataNasc)
    let age = now.getUTCFullYear() - birth.getUTCFullYear()
    const m = (now.getUTCMonth() + 1) - (birth.getUTCMonth() + 1)
    if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--
    return age
  }

  return (
    <div className="space-y-5">
      {/* Today's birthdays */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">🎂 Hoje</h2>
            <p className="text-sm text-gray-500">
              {todayBirthdays.length === 0
                ? 'Nenhum aniversário hoje.'
                : `${todayBirthdays.length} membro${todayBirthdays.length > 1 ? 's' : ''} fazem anos hoje.`}
            </p>
          </div>
          {todayBirthdays.length > 0 && (
            <button
              onClick={handleSendAll}
              disabled={loading || result !== null}
              className="text-sm py-2 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold disabled:opacity-50 transition-colors"
            >
              {loading ? '📧 A enviar...' : result ? '✅ Enviado!' : '🎉 Enviar Parabéns'}
            </button>
          )}
        </div>

        {todayBirthdays.length === 0 ? (
          <p className="text-gray-600 text-sm italic">Nenhum membro faz anos hoje.</p>
        ) : (
          <div className="space-y-2">
            {todayBirthdays.map(m => (
              <div key={m.email} className="flex items-center gap-3 bg-yellow-900/10 border border-yellow-700/30 rounded-lg px-4 py-3">
                {m.foto_url
                  ? <img src={m.foto_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-yellow-500/50" />
                  : <div className="w-10 h-10 rounded-full bg-yellow-700/30 text-yellow-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {m.nickname.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">{m.nickname}</div>
                  <div className="text-xs text-gray-400">{m.nome_completo}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-yellow-400 font-bold text-sm">{getAge(m.data_nasc)} anos 🎂</div>
                  <div className="text-xs text-gray-500">{formatDate(m.data_nasc)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="mt-3 bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-3 text-green-400 text-sm font-bold">
            ✅ {result.sent} de {result.total} emails enviados com sucesso!
          </div>
        )}
        {error && (
          <div className="mt-3 bg-red-900/20 border border-red-700/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Upcoming 30 days */}
      {upcoming.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">📅 Próximos 30 dias</h2>
          <div className="space-y-2">
            {upcoming.map(m => (
              <div key={m.email} className="flex items-center gap-3 bg-black/20 rounded-lg px-4 py-2.5">
                {m.foto_url
                  ? <img src={m.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 opacity-80" />
                  : <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.nickname.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{m.nickname}</div>
                  <div className="text-xs text-gray-500">{formatDate(m.data_nasc)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-blue-400 font-bold text-sm">em {m.daysUntil}d</div>
                  <div className="text-xs text-gray-600">faz {getAge(m.data_nasc) + 1} anos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info about members without birthdate */}
      {noDataCount > 0 && (
        <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3">
          <p className="text-gray-500 text-sm">
            ℹ️ {noDataCount} membro{noDataCount > 1 ? 's' : ''} sem data de nascimento registada.
            Podem actualizar o perfil em <a href="https://app.beiraf1fanatics.com/perfil" className="text-f1red hover:underline">Perfil</a>.
          </p>
        </div>
      )}
    </div>
  )
}
