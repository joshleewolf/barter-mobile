/**
 * Supabase Edge Function: Send Push Notification
 *
 * Sends push notifications to users via Expo Push API.
 * Call this function when new offers or messages are created.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

interface NotificationRequest {
  user_id: string
  title: string
  body: string
  data?: {
    type: 'new_offer' | 'offer_accepted' | 'offer_rejected' | 'new_message' | 'trade_completed'
    offer_id?: string
    listing_id?: string
    chat_id?: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, title, body, data }: NotificationRequest = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user's push tokens
    const { data: tokens, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push tokens found for user', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build push messages for each token
    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: data || {},
      sound: 'default',
      channelId: getChannelId(data?.type),
    }))

    // Send to Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const pushResult = await pushResponse.json()

    // Check for failed tokens and remove them
    if (pushResult.data) {
      const failedTokens: string[] = []
      pushResult.data.forEach((result: { status: string }, index: number) => {
        if (result.status === 'error') {
          failedTokens.push(tokens[index].token)
        }
      })

      // Remove invalid tokens from database
      if (failedTokens.length > 0) {
        await supabaseClient
          .from('push_tokens')
          .delete()
          .in('token', failedTokens)

        console.log(`Removed ${failedTokens.length} invalid push tokens`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: tokens.length,
        result: pushResult
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function getChannelId(type?: string): string {
  switch (type) {
    case 'new_offer':
    case 'offer_accepted':
    case 'offer_rejected':
      return 'offers'
    case 'new_message':
      return 'messages'
    case 'trade_completed':
      return 'trades'
    default:
      return 'general'
  }
}
