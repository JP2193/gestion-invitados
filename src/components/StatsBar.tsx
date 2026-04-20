'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Invitado } from '@/lib/types'

type Props = {
  invitados: Invitado[]
  cubiertos: number
}

export default function StatsBar({ invitados, cubiertos: initialCubiertos }: Props) {
  const [cubiertos, setCubiertos] = useState(initialCubiertos)
  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(String(initialCubiertos))

  const activos         = invitados.filter(i => i.confirma !== 'no')
  const total           = activos.length
  const mayores         = activos.filter(i => i.edad_tipo === 'mayor').length
  const menores         = activos.filter(i => i.edad_tipo === 'menor').length
  const faltanConfirmar = activos.filter(i => i.confirma === null).length
  const diff            = cubiertos - mayores

  async function saveCubiertos() {
    const val = parseInt(draft)
    if (!isNaN(val)) {
      setCubiertos(val)
      const supabase = createClient()
      await supabase.from('config').update({ value: String(val) }).eq('key', 'cubiertos')
    }
    setEditing(false)
  }

  return (
    <div className="px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex items-stretch gap-3">

        {/* Total */}
        <StatCard
          icon={<IconUsers color="text-blue-500" bg="bg-blue-50" />}
          label="Total invitados"
          value={total}
          valueColor="text-blue-600"
        />

        {/* Cubiertos */}
        <StatCard
          icon={<IconSeat color="text-violet-500" bg="bg-violet-50" />}
          label="Cubiertos"
          valueColor="text-violet-600"
          valueNode={
            <div className="flex items-baseline gap-1.5">
              {editing ? (
                <input
                  type="number"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={saveCubiertos}
                  onKeyDown={e => e.key === 'Enter' && saveCubiertos()}
                  autoFocus
                  className="w-14 text-xl font-bold text-violet-600 border-b-2 border-violet-300 focus:outline-none bg-transparent"
                />
              ) : (
                <button
                  onClick={() => { setDraft(String(cubiertos)); setEditing(true) }}
                  className="text-xl font-bold text-violet-600 hover:text-violet-800 underline decoration-dashed underline-offset-2 cursor-pointer"
                >
                  {cubiertos}
                </button>
              )}
              <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                {diff >= 0 ? `+${diff} libres` : `${Math.abs(diff)} sobre`}
              </span>
            </div>
          }
        />

        {/* Mayores */}
        <StatCard
          icon={<IconPerson color="text-emerald-500" bg="bg-emerald-50" />}
          label="Mayores"
          value={mayores}
          valueColor="text-emerald-600"
        />

        {/* Menores */}
        <StatCard
          icon={<IconChild color="text-orange-500" bg="bg-orange-50" />}
          label="Menores"
          value={menores}
          valueColor="text-orange-500"
        />

        {/* Faltan confirmar */}
        <StatCard
          icon={<IconClock color="text-rose-500" bg="bg-rose-50" />}
          label="Faltan confirmar"
          value={faltanConfirmar}
          valueColor={faltanConfirmar > 0 ? 'text-rose-500' : 'text-gray-700'}
          highlight={faltanConfirmar > 0}
        />

      </div>
    </div>
  )
}

/* ── Stat card ── */
function StatCard({ icon, label, value, valueColor, valueNode, highlight }: {
  icon: React.ReactNode
  label: string
  value?: number
  valueColor: string
  valueNode?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border ${highlight ? 'border-rose-100 bg-rose-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide leading-none mb-1">{label}</p>
        {valueNode ?? (
          <p className={`text-xl font-bold leading-none ${valueColor}`}>{value}</p>
        )}
      </div>
    </div>
  )
}

/* ── Icons ── */
function IconUsers({ color, bg }: { color: string; bg: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  )
}

function IconSeat({ color, bg }: { color: string; bg: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h2v6H3v-6zm16 0h2v6h-2v-6zM5 16h14v2H5v-2zM7 6a5 5 0 0110 0v4H7V6z" />
      </svg>
    </div>
  )
}

function IconPerson({ color, bg }: { color: string; bg: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  )
}

function IconChild({ color, bg }: { color: string; bg: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6a2 2 0 100-4 2 2 0 000 4zm-4 8a4 4 0 018 0v4H8v-4zm4-4a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    </div>
  )
}

function IconClock({ color, bg }: { color: string; bg: string }) {
  return (
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
      <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}
