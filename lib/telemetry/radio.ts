import { createServiceClient } from '@/lib/supabase/service'
import { of1, type SessionMeta } from './openf1'

// Team radio as text: OpenF1 lists the clips the broadcast picked (mp3 on livetiming.formula1.com). Each clip is
// transcribed once (English, original) and translated once (Portuguese); both texts are stored and shared by every viewer.
// Only drivers of Mercedes, Red Bull, Ferrari and McLaren. Nothing runs unless the admin switched the panel on.

const TEAMS = ['Mercedes', 'Red Bull Racing', 'Ferrari', 'McLaren']
const MAX_NEW_PER_CALL = 2
const SHOWN = 25

interface OF1Radio { date: string; driver_number: number; recording_url: string; session_key: number }
interface OF1Drv { driver_number: number; name_acronym: string; team_name: string; team_colour: string; full_name: string }

export interface RadioItem { id: string; code: string; colour: string; team: string; at: string; en: string; pt: string }
export interface RadioResponse {
  enabled: boolean
  configured: boolean
  items: RadioItem[]
  pending: number
  note?: string
}

export const radioConfigured = (): boolean => !!process.env.OPENAI_API_KEY

const JARGON = 'Formula 1 team radio. Drivers and race engineers. Terms: box box, plan A, plan B, delta, undercut, overcut, DRS, VSC, safety car, red flag, softs, mediums, hards, inters, degradation, deg, graining, blistering, understeer, oversteer, brake bias, differential, engine mode, push, lift and coast, copy, understood, P1, P2, gap, tyres, pit stop, track limits.'

async function transcribe(url: string): Promise<string> {
  const audio = await fetch(url, { cache: 'no-store' })
  if (!audio.ok) throw new Error(`áudio HTTP ${audio.status}`)
  const blob = await audio.blob()
  if (blob.size < 2000) return ''
  const form = new FormData()
  form.append('file', new File([blob], 'radio.mp3', { type: 'audio/mpeg' }))
  form.append('model', process.env.RADIO_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe')
  form.append('language', 'en')
  form.append('prompt', JARGON)
  form.append('response_format', 'json')
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form })
  if (!res.ok) throw new Error(`transcrição HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`)
  const j = await res.json() as { text?: string }
  return (j.text ?? '').trim()
}

const TRANSLATE_PROMPT = 'Traduz esta mensagem de rádio de Fórmula 1 (piloto ↔ engenheiro) do inglês para português, em linguagem simples para quem não conhece F1. Mantém nomes, siglas dos pilotos e números; explica o jargão técnico com palavras comuns (ex.: "box" = ir às boxes, "deg" = desgaste dos pneus). Se houver palavrões, mantém o sentido de forma suave. Responde só com a tradução, numa ou duas frases curtas, sem aspas.'

async function translate(en: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.RADIO_TRANSLATE_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: TRANSLATE_PROMPT, messages: [{ role: 'user', content: en }] }),
    })
    if (!res.ok) throw new Error(`tradução HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`)
    const j = await res.json() as { content?: { type: string; text?: string }[] }
    return (j.content?.find(c => c.type === 'text')?.text ?? '').trim()
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.RADIO_TRANSLATE_MODEL || 'gpt-4o-mini', temperature: 0.2, messages: [{ role: 'system', content: TRANSLATE_PROMPT }, { role: 'user', content: en }] }),
  })
  if (!res.ok) throw new Error(`tradução HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`)
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  return (j.choices?.[0]?.message?.content ?? '').trim()
}

// Lists the session's radio clips from our drivers, processes a few new ones (newest first) and returns the stored texts.
export async function radioFeed(sessionKey: number, live: boolean): Promise<RadioResponse> {
  const configured = radioConfigured()
  const db = createServiceClient()
  const ttl = live ? 15 : 600
  const [drivers, clips] = await Promise.all([
    of1<OF1Drv>('drivers', [['session_key', '', sessionKey]], 3600),
    of1<OF1Radio>('team_radio', [['session_key', '', sessionKey]], ttl).catch(() => [] as OF1Radio[]),
  ])
  const by = new Map(drivers.filter(d => TEAMS.includes(d.team_name)).map(d => [d.driver_number, d]))
  const mine = clips.filter(c => by.has(c.driver_number) && c.recording_url).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

  const { data: stored } = await db.from('radio_transcripts').select('id, status, en, pt, updated_at').eq('session_key', sessionKey)
  const row = new Map((stored ?? []).map(r => [r.id as string, r]))

  if (configured) {
    const staleBefore = Date.now() - 3 * 60_000
    const todo = mine.filter(c => {
      const r = row.get(c.recording_url)
      if (!r) return true
      if (r.status === 'done') return false
      if (r.status === 'failed') return Date.parse(r.updated_at as string) < Date.now() - 10 * 60_000   // retry a failure after 10 min
      return Date.parse(r.updated_at as string) < staleBefore                                              // pending too long: the worker died
    }).slice(0, MAX_NEW_PER_CALL)

    await Promise.all(todo.map(async c => {
      const d = by.get(c.driver_number)!
      const base = { id: c.recording_url, session_key: sessionKey, driver_number: c.driver_number, code: d.name_acronym, said_at: c.date }
      try {
        await db.from('radio_transcripts').upsert({ ...base, status: 'pending', updated_at: new Date().toISOString() })
        const en = await transcribe(c.recording_url)
        const words = en.split(/\s+/).filter(Boolean).length
        const pt = words >= 2 ? await translate(en) : ''
        const rec = { ...base, status: 'done', en, pt, error: null, updated_at: new Date().toISOString() }
        await db.from('radio_transcripts').upsert(rec)
        row.set(c.recording_url, { id: c.recording_url, status: 'done', en, pt, updated_at: rec.updated_at })
      } catch (e) {
        const msg = String(e instanceof Error ? e.message : e).slice(0, 200)
        await db.from('radio_transcripts').upsert({ ...base, status: 'failed', error: msg, updated_at: new Date().toISOString() })
        row.set(c.recording_url, { id: c.recording_url, status: 'failed', en: null, pt: null, updated_at: new Date().toISOString() })
      }
    }))
  }

  const items: RadioItem[] = []
  for (const c of mine) {
    const r = row.get(c.recording_url)
    if (!r || r.status !== 'done' || !(r.en as string)?.trim()) continue
    const d = by.get(c.driver_number)!
    items.push({ id: c.recording_url, code: d.name_acronym, colour: `#${d.team_colour || '888888'}`, team: d.team_name, at: c.date, en: r.en as string, pt: (r.pt as string) ?? '' })
    if (items.length >= SHOWN) break
  }
  const pending = configured ? mine.filter(c => { const r = row.get(c.recording_url); return !r || r.status === 'pending' }).length : 0
  return { enabled: true, configured, items, pending }
}

export type { SessionMeta }
