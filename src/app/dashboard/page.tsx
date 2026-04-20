'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Invitado } from '@/lib/types'
import StatsBar from '@/components/StatsBar'
import GuestTable from '@/components/GuestTable'
import GuestModal from '@/components/GuestModal'

export default function DashboardPage() {
  const [invitados, setInvitados]   = useState<Invitado[]>([])
  const [cubiertos, setCubiertos]   = useState(0)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [search, setSearch]         = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Invitado | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: invData }, { data: cfgData }] = await Promise.all([
      supabase.from('invitados').select('*').order('created_at', { ascending: true }),
      supabase.from('config').select('value').eq('key', 'cubiertos').single(),
    ])
    if (invData) setInvitados(invData as Invitado[])
    if (cfgData) setCubiertos(parseInt(cfgData.value))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function handleOptimisticUpdate(id: string, field: string, value: string | null) {
    setInvitados(prev =>
      prev.map(inv => inv.id === id ? { ...inv, [field]: value } : inv)
    )
  }

  function handleEdit(inv: Invitado) {
    setEditTarget(inv)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditTarget(null)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!selected.size) return
    if (!confirm(`¿Eliminar ${selected.size} invitado${selected.size > 1 ? 's' : ''}?`)) return
    const supabase = createClient()
    await supabase.from('invitados').delete().in('id', Array.from(selected))
    setSelected(new Set())
    fetchData()
  }

  function handleExport() {
    window.open('/api/export', '_blank')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const selCount   = selected.size
  const editTarget1 = selCount === 1
    ? invitados.find(i => i.id === Array.from(selected)[0]) ?? null
    : null

  const titulares = invitados.filter(i => !i.es_acompanante)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100">

        {/* Top row: title + actions */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestión de Invitados</h1>
            <p className="text-xs text-gray-400 mt-0.5">Administrá tu lista de invitados</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Contextual toolbar */}
            {selCount === 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar Excel
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer font-medium shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar invitado
                </button>
              </>
            )}

            {selCount === 1 && (
              <>
                <span className="text-xs text-gray-400 mr-1">1 seleccionado</span>
                <button
                  onClick={() => editTarget1 && handleEdit(editTarget1)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar Excel
                </button>
              </>
            )}

            {selCount > 1 && (
              <>
                <span className="text-xs text-gray-400 mr-1">{selCount} seleccionados</span>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar ({selCount})
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar Excel
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors cursor-pointer ml-1"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="px-6 pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 placeholder-gray-300 transition-all"
            />
          </div>
        </div>

      </header>

      {/* ── Stats ── */}
      <StatsBar invitados={invitados} cubiertos={cubiertos} />

      {/* ── Table ── */}
      <div className="flex-1 px-6 py-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <GuestTable
            invitados={invitados}
            selected={selected}
            search={search}
            onSelect={setSelected}
            onEdit={handleEdit}
            onOptimisticUpdate={handleOptimisticUpdate}
            onDeleted={fetchData}
          />
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <GuestModal
          invitado={editTarget}
          titulares={titulares}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); setSelected(new Set()); fetchData() }}
        />
      )}
    </div>
  )
}
