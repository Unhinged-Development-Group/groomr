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
    const { id, first_name, last_name, email_addresses } = evt.data
    const email = email_addresses?.[0]?.email_address ?? null

    const { data, error } = await supabaseAdmin.from('profiles').insert({
      id: crypto.randomUUID(),
      clerk_id: id,
      full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      email,
      is_admin: false,
      roles: '{owner}',
    })

    console.log('user.created — profile insert:', data, error)
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data

    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('clerk_id', id)

    console.log('user.deleted — profile delete:', error ?? 'ok')
  }

  if (evt.type === 'user.updated') {
    const { id, first_name, last_name, email_addresses } = evt.data
    const email = email_addresses?.[0]?.email_address ?? null

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id)

    console.log('user.updated — profile sync:', error ?? 'ok')
  }

  return new Response('OK', { status: 200 })
}