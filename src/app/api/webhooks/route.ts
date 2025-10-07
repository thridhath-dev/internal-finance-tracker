import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  const eventType = evt.type
  console.log(`Received webhook with ID ${evt.data.id} and event type of ${eventType}`)

  // Handle user creation
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    try {
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
      const newUser = await prisma.user.create({
        data: {
          clerkUserId: id,
          email: email_addresses[0].email_address,
          name: fullName,
          imageUrl: image_url,
        },
      })
      console.log('✅ User created in database:', newUser.email)
      return new Response(JSON.stringify({ success: true, user: newUser }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('❌ Error creating user in database:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create user in database' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // Handle user updates
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    try {
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
      const updatedUser = await prisma.user.update({
        where: { clerkUserId: id },
        data: {
          email: email_addresses[0].email_address,
          name: fullName,
          imageUrl: image_url,
        },
      })
      console.log('✅ User updated in database:', updatedUser.email)
      return new Response(JSON.stringify({ success: true, user: updatedUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('❌ Error updating user in database:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update user in database' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // Handle user deletion
  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    try {
      const deletedUser = await prisma.user.delete({
        where: { clerkUserId: id as string },
      })
      console.log('✅ User deleted from database:', deletedUser.email)
      return new Response(JSON.stringify({ success: true, user: deletedUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('❌ Error deleting user from database:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from database' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return new Response(JSON.stringify({ success: true, message: 'Webhook received' }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}