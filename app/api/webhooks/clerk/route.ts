import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid webhook signature', { status: 400 })
  }

  console.log('Webhook received:', evt.type)

  if (evt.type === 'user.created') {
    const { id, first_name, last_name } = evt.data
    console.log('Creating profile for:', id, first_name, last_name)

    const { data, error } = await supabaseAdmin.from('profiles').insert({
      id: crypto.randomUUID(),
      clerk_id: id,
      full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      is_admin: false,
      roles: '{owner}',
    })

    console.log('Insert result:', data, error)
  }

  return new Response('OK', { status: 200 })
}