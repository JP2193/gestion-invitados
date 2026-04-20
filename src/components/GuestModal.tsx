'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Invitado } from '@/lib/types'

type Props = {
  invitado?: Invitado | null
  titulares: Invitado[]
  onClose: () => void
  onSaved: () => void
}

export default function GuestModal({ invitado, titulares, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    restriccion_alimentaria: '',
    es_acompanante: false,
    invitado_principal_id: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (invitado) {
      setForm({
        nombre: invitado.nombre,
        apellido: invitado.apellido ?? '',
        email: invitado.email ?? '',
        telefono: invitado.telefono ?? '',
        restriccion_alimentaria: invitado.restriccion_alimentaria ?? '',
        es_acompanante: invitado.es_acompanante,
        invitado_principal_id: invitado.invitado_principal_id ?? '',
      })
    }
  }, [invitado])

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim() || null,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      restriccion_alimentaria: form.restriccion_alimentaria.trim() || null,
      es_acompanante: form.es_acompanante,
      invitado_principal_id: form.es_acompanante && form.invitado_principal_id
        ? form.invitado_principal_id : null,
    }

    if (invitado) {
      await supabase.from('invitados').update(payload).eq('id', invitado.id)
    } else {
      await supabase.from('invitados').insert(payload)
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-gray-100 shadow-xl p-5 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">
            {invitado ? 'Editar invitado' : 'Agregar invitado'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre *" value={form.nombre} onChange={v => set('nombre', v)} required />
            <Field label="Apellido" value={form.apellido} onChange={v => set('apellido', v)} />
          </div>
          <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Teléfono" value={form.telefono} onChange={v => set('telefono', v)} />
          <Field label="Restricción alimentaria" value={form.restriccion_alimentaria} onChange={v => set('restriccion_alimentaria', v)} />

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="es_ac"
              checked={form.es_acompanante}
              onChange={e => set('es_acompanante', e.target.checked)}
              className="rounded-sm border-gray-300 text-gray-700 focus:ring-0"
            />
            <label htmlFor="es_ac" className="text-xs text-gray-500">Es acompañante de...</label>
          </div>

          {form.es_acompanante && (
            <select
              value={form.invitado_principal_id}
              onChange={e => set('invitado_principal_id', e.target.value)}
              className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-200 bg-gray-50"
            >
              <option value="">— Seleccionar titular —</option>
              {titulares.map(t => (
                <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
              ))}
            </select>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-100 rounded-lg py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-800 text-white rounded-lg py-1.5 text-xs hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:bg-white transition-colors"
      />
    </div>
  )
}
