'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Invitado } from '@/lib/types'

type ColFilter = {
  parentesco: string
  edad_tipo: string
  invitado_de: string
  confirma: string
  save_the_date: string
  invitacion: string
}

type Props = {
  invitados: Invitado[]
  selected: Set<string>
  search: string
  onSelect: (ids: Set<string>) => void
  onEdit: (inv: Invitado) => void
  onOptimisticUpdate: (id: string, field: string, value: string | null) => void
  onDeleted: () => void
}

const EMPTY_COL_FILTERS: ColFilter = {
  parentesco: '', edad_tipo: '', invitado_de: '', confirma: '', save_the_date: '', invitacion: '',
}

/* ── Floating dropdown portal ── */
type DropdownItem = { value: string; label: string; color?: string }

function FloatingDropdown({ anchorRef, open, items, activeValue, onSelect, onClose }: {
  anchorRef: React.RefObject<HTMLElement | null>
  open: boolean
  items: DropdownItem[]
  activeValue: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[110px]"
    >
      {items.map(item => (
        <button
          key={item.value}
          onClick={() => { onSelect(item.value); onClose() }}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
            item.color ?? (activeValue === item.value ? 'text-gray-800 font-medium' : 'text-gray-500')
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  )
}

/* ── Inline cell with floating dropdown ── */
function InlineCell({ value, items, onChange }: {
  value: string
  items: DropdownItem[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const active = items.find(i => i.value === value)
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 hover:bg-gray-200 transition-colors cursor-pointer ${active?.color ?? (value ? 'text-gray-600' : 'text-gray-300')}`}
      >
        {active?.label ?? '—'}
        <span className="text-gray-300 text-[10px]">▾</span>
      </button>
      <FloatingDropdown
        anchorRef={btnRef}
        open={open}
        items={items}
        activeValue={value}
        onSelect={onChange}
        onClose={close}
      />
    </>
  )
}

/* ── Status badge (Pendiente/Enviado) ── */
function StatusBadge({ value, pendingLabel, sentLabel, sentValue, onChange }: {
  value: string | null
  pendingLabel: string
  sentLabel: string
  sentValue: string
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const sent = value === sentValue
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
          sent ? 'bg-green-50 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-400 hover:bg-red-200'
        }`}
      >
        {sent ? sentLabel : pendingLabel}
      </button>
      <FloatingDropdown
        anchorRef={btnRef}
        open={open}
        items={[
          { value: '', label: pendingLabel, color: 'text-red-400' },
          { value: sentValue, label: sentLabel, color: 'text-green-600' },
        ]}
        activeValue={value ?? ''}
        onSelect={v => onChange(v || null)}
        onClose={close}
      />
    </>
  )
}

/* ── Column filter header ── */
function FilterHeader({ label, field, active, options, colFilters, setColFilters }: {
  label: string
  field: string
  active: string
  options: DropdownItem[]
  colFilters: ColFilter
  setColFilters: React.Dispatch<React.SetStateAction<ColFilter>>
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])

  function handleSelect(v: string) {
    setColFilters(f => ({ ...f, [field]: f[field as keyof ColFilter] === v ? '' : v }))
    setOpen(false)
  }

  const allItems: DropdownItem[] = [{ value: '', label: 'Todos' }, ...options]

  return (
    <th className="px-4 py-3 text-left whitespace-nowrap bg-gray-50">
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider cursor-pointer ${active ? 'text-indigo-600' : 'text-indigo-400 hover:text-indigo-600'}`}
      >
        {label}
        {active
          ? <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block ml-0.5" />
          : <span className="text-indigo-200 text-[10px]">▾</span>
        }
      </button>
      <FloatingDropdown
        anchorRef={btnRef}
        open={open}
        items={allItems}
        activeValue={active}
        onSelect={handleSelect}
        onClose={close}
      />
    </th>
  )
}

/* ── Main component ── */
export default function GuestTable({ invitados, selected, search, onSelect, onOptimisticUpdate }: Props) {
  const [colFilters, setColFilters] = useState<ColFilter>(EMPTY_COL_FILTERS)

  const hasColFilters = Object.values(colFilters).some(Boolean)
  const hasAnyFilter = hasColFilters || !!search

  function clearAll() { setColFilters(EMPTY_COL_FILTERS) }

  function matchesFilters(inv: Invitado) {
    if (search) {
      const q = search.toLowerCase()
      if (
        !inv.nombre.toLowerCase().includes(q) &&
        !(inv.apellido ?? '').toLowerCase().includes(q) &&
        !(inv.email ?? '').toLowerCase().includes(q)
      ) return false
    }
    if (colFilters.parentesco    && inv.parentesco   !== colFilters.parentesco)    return false
    if (colFilters.edad_tipo     && inv.edad_tipo     !== colFilters.edad_tipo)     return false
    if (colFilters.invitado_de   && inv.invitado_de   !== colFilters.invitado_de)   return false
    if (colFilters.confirma      && inv.confirma      !== colFilters.confirma)      return false
    if (colFilters.save_the_date && inv.save_the_date !== colFilters.save_the_date) return false
    if (colFilters.invitacion    && inv.invitacion    !== colFilters.invitacion)    return false
    return true
  }

  // Construir grupos: titular + sus acompañantes siempre juntos
  const titulares    = invitados.filter(i => !i.es_acompanante)
  const companionsOf = (id: string) => invitados.filter(i => i.es_acompanante && i.invitado_principal_id === id)
  const orphans      = invitados.filter(i => i.es_acompanante && !i.invitado_principal_id)

  // Grupos activos primero, grupos con titular "no" al fondo
  const activeGroups = titulares.filter(t => t.confirma !== 'no')
  const noGroups     = titulares.filter(t => t.confirma === 'no')

  const orderedList: Invitado[] = []
  for (const titular of [...activeGroups, ...noGroups]) {
    orderedList.push(titular)
    orderedList.push(...companionsOf(titular.id))
  }
  orderedList.push(...orphans)

  // Aplicar filtros preservando el orden de grupos
  const filtered = orderedList.filter(inv => matchesFilters(inv))

  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id))

  function toggleAll() {
    if (allSelected) {
      const next = new Set(selected)
      filtered.forEach(i => next.delete(i.id))
      onSelect(next)
    } else {
      const next = new Set(selected)
      filtered.forEach(i => next.add(i.id))
      onSelect(next)
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelect(next)
  }

  async function updateField(id: string, field: string, value: string | null) {
    onOptimisticUpdate(id, field, value)
    const supabase = createClient()
    await supabase.from('invitados').update({ [field]: value }).eq('id', id)
  }

  return (
    <div className="flex-1">
      {hasAnyFilter && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-indigo-50/40">
          <span className="text-xs text-indigo-400 font-medium">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          {hasColFilters && (
            <button onClick={clearAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer">· Limpiar filtros</button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-300 text-sm">Sin resultados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 focus:ring-0 cursor-pointer accent-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[11px] text-indigo-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-[11px] text-indigo-500 uppercase tracking-wider">Apellido</th>
                <th className="px-4 py-3 text-left font-semibold text-[11px] text-indigo-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-[11px] text-indigo-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left font-semibold text-[11px] text-indigo-500 uppercase tracking-wider">Restricción</th>
                <FilterHeader label="Parentesco"    field="parentesco"    active={colFilters.parentesco}    options={[{value:'familia',label:'Familia'},{value:'amigos',label:'Amigos'}]}             colFilters={colFilters} setColFilters={setColFilters} />
                <FilterHeader label="Edad"          field="edad_tipo"     active={colFilters.edad_tipo}     options={[{value:'mayor',label:'Mayor'},{value:'menor',label:'Menor'}]}                 colFilters={colFilters} setColFilters={setColFilters} />
                <FilterHeader label="Invitado de"   field="invitado_de"   active={colFilters.invitado_de}   options={[{value:'novio',label:'Novio'},{value:'novia',label:'Novia'}]}                 colFilters={colFilters} setColFilters={setColFilters} />
                <FilterHeader label="Save the date" field="save_the_date" active={colFilters.save_the_date} options={[{value:'enviado',label:'Enviado'}]}                                          colFilters={colFilters} setColFilters={setColFilters} />
                <FilterHeader label="Invitación"    field="invitacion"    active={colFilters.invitacion}    options={[{value:'enviada',label:'Enviada'}]}                                          colFilters={colFilters} setColFilters={setColFilters} />
                <FilterHeader label="Confirma"      field="confirma"      active={colFilters.confirma}      options={[{value:'si',label:'Sí'},{value:'no',label:'No'}]}                            colFilters={colFilters} setColFilters={setColFilters} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={`border-b transition-colors ${
                    inv.confirma === 'no'
                      ? 'bg-gray-50 opacity-50 border-gray-100'
                      : selected.has(inv.id) ? 'bg-indigo-50/60 border-indigo-100'
                      : inv.es_acompanante ? 'bg-gray-50/60 border-gray-100 hover:bg-gray-100/60'
                      : idx % 2 === 0 ? 'bg-white border-gray-100 hover:bg-indigo-50/20'
                      : 'bg-gray-50/30 border-gray-100 hover:bg-indigo-50/20'
                  }`}
                >
                  <td className="px-4 py-2.5 w-10">
                    <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleOne(inv.id)} className="rounded border-gray-300 focus:ring-0 cursor-pointer accent-indigo-500" />
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">
                    {inv.es_acompanante && <span className="text-indigo-200 mr-1.5 font-normal">↳</span>}
                    {inv.nombre}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{inv.apellido ?? <Dash />}</td>
                  <td className="px-4 py-2.5 text-gray-400 max-w-[180px] truncate">{inv.email ?? <Dash />}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{inv.telefono ?? <Dash />}</td>
                  <td className="px-4 py-2.5 text-gray-400 max-w-[120px] truncate" title={inv.restriccion_alimentaria ?? ''}>{inv.restriccion_alimentaria ?? <Dash />}</td>

                  <td className="px-4 py-2.5">
                    {inv.confirma === 'no' ? <Dash /> : <InlineCell value={inv.parentesco ?? ''} items={[{value:'',label:'—'},{value:'familia',label:'Familia'},{value:'amigos',label:'Amigos'}]} onChange={v => updateField(inv.id, 'parentesco', v || null)} />}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.confirma === 'no' ? <Dash /> : <InlineCell value={inv.edad_tipo} items={[{value:'mayor',label:'Mayor'},{value:'menor',label:'Menor'}]} onChange={v => updateField(inv.id, 'edad_tipo', v)} />}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.confirma === 'no' ? <Dash /> : <InlineCell value={inv.invitado_de ?? ''} items={[{value:'',label:'—'},{value:'novio',label:'Novio'},{value:'novia',label:'Novia'}]} onChange={v => updateField(inv.id, 'invitado_de', v || null)} />}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.confirma === 'no' ? <Dash /> : <StatusBadge value={inv.save_the_date} pendingLabel="Pendiente" sentLabel="Enviado" sentValue="enviado" onChange={v => updateField(inv.id, 'save_the_date', v)} />}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.confirma === 'no' ? <Dash /> : <StatusBadge value={inv.invitacion} pendingLabel="Pendiente" sentLabel="Enviada" sentValue="enviada" onChange={v => updateField(inv.id, 'invitacion', v)} />}
                  </td>
                  <td className="px-4 py-2.5">
                    <InlineCell
                      value={inv.confirma ?? ''}
                      items={[
                        {value:'',label:'—',color:'text-gray-300'},
                        {value:'si',label:'Sí',color:'text-emerald-600'},
                        {value:'no',label:'No',color:'text-red-400'},
                      ]}
                      onChange={v => updateField(inv.id, 'confirma', v || null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Dash() {
  return <span className="text-gray-200">—</span>
}
