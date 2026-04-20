export type Invitado = {
  id: string
  created_at: string
  nombre: string
  apellido: string | null
  email: string | null
  telefono: string | null
  restriccion_alimentaria: string | null
  rsvp_id: string | null
  es_acompanante: boolean
  invitado_principal_id: string | null
  parentesco: 'familia' | 'amigos' | null
  edad_tipo: 'mayor' | 'menor'
  invitado_de: 'novio' | 'novia' | null
  save_the_date: 'enviado' | null
  invitacion: 'enviada' | null
  confirma: 'si' | 'no' | null
}
