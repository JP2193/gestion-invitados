import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('invitados')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(i => ({
    'Nombre':                 i.nombre,
    'Apellido':               i.apellido ?? '',
    'Email':                  i.email ?? '',
    'Teléfono':               i.telefono ?? '',
    'Restricción alimentaria':i.restriccion_alimentaria ?? '',
    'Es acompañante':         i.es_acompanante ? 'Sí' : 'No',
    'Parentesco':             i.parentesco ?? '',
    'Edad':                   i.edad_tipo === 'menor' ? 'Menor' : 'Mayor',
    'Invitado de':            i.invitado_de ?? '',
    'Save the date':          i.save_the_date ?? '',
    'Invitación':             i.invitacion ?? '',
    'Confirma':               i.confirma ?? '',
    'Fecha registro':         new Date(i.created_at).toLocaleDateString('es-AR'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invitados')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="invitados.xlsx"',
    },
  })
}
