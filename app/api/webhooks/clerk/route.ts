export const runtime = 'nodejs'

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const { id, first_name, last_name, email_addresses, image_url, public_metadata } = evt.data
    const email = email_addresses?.[0]?.email_address ?? null

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        clerk_id: id,
        full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        email,
        avatar_url: image_url ?? null,
        is_admin: false,
        roles: '{owner}',
      })
      .select('id')
      .single()

    console.log('user.created — profile insert:', profileData?.id, profileError)

    // If this sign-up was triggered by a team invite, link the team_members row.
    // Matching on invite_token (unique, secret) + atomic UPDATE WHERE invite_status='pending'
    // prevents both email-spoofing and the TOCTOU race where two concurrent webhook
    // deliveries both win a SELECT before either commits an UPDATE.
    const meta = public_metadata as Record<string, unknown> | undefined
    const isTeamInvite = meta?.groomr_team_invite === true
    const inviteToken = meta?.invite_token as string | undefined

    if (isTeamInvite && inviteToken && profileData) {
      const { data: claimed } = await supabaseAdmin
        .from('team_members')
        .update({
          user_id: profileData.id,
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('invite_token', inviteToken)
        .eq('invite_status', 'pending')
        .select('id')
        .single()

      if (claimed) {
        await supabaseAdmin
          .from('profiles')
          .update({ roles: '{owner,groomer}' })
          .eq('id', profileData.id)

        console.log('user.created — team invite accepted for', claimed.id)
      }
    }
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data

    // Soft-delete: retain for 30 days for dispute/financial record lookups (UK GDPR)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('clerk_id', id)

    console.log('user.deleted — profile soft-deleted:', error ?? 'ok')
  }

  if (evt.type === 'user.updated') {
    const { id, first_name, last_name, email_addresses, image_url } = evt.data
    const email = email_addresses?.[0]?.email_address ?? null

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        email,
        avatar_url: image_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id)

    console.log('user.updated — profile sync:', error ?? 'ok')
  }

  return new Response('OK', { status: 200 })
}
