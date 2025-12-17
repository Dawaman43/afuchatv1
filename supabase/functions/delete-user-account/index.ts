import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-user-account] Processing request...');

    // Create Supabase client with the user's token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[delete-user-account] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[delete-user-account] Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for admin deletion
    let targetUserId = user.id;
    let body: { userId?: string } = {};
    
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, use authenticated user's ID
    }

    // If a userId is provided, check if the caller is an admin
    if (body.userId && body.userId !== user.id) {
      // Create admin client to check admin status
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      // Check if the calling user is an admin using the has_role function
      const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (roleError) {
        console.error('[delete-user-account] Error checking admin role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify admin status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isAdmin) {
        console.error('[delete-user-account] Non-admin attempted to delete another user');
        return new Response(
          JSON.stringify({ error: 'Admin privileges required to delete other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = body.userId;
      console.log('[delete-user-account] Admin deleting user:', targetUserId);
    }

    console.log('[delete-user-account] Deleting account for user:', targetUserId);

    // Use admin client for all delete operations to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Delete user data in order (to respect foreign key constraints)
    
    // Delete message reactions
    await supabaseAdmin.from('message_reactions').delete().eq('user_id', targetUserId);
    
    // Delete message status
    await supabaseAdmin.from('message_status').delete().eq('user_id', targetUserId);
    
    // Delete messages sent by user
    await supabaseAdmin.from('messages').delete().eq('sender_id', targetUserId);
    
    // Delete chat memberships
    await supabaseAdmin.from('chat_members').delete().eq('user_id', targetUserId);
    
    // Delete chats created by user
    await supabaseAdmin.from('chats').delete().eq('created_by', targetUserId);
    
    // Delete post acknowledgments
    await supabaseAdmin.from('post_acknowledgments').delete().eq('user_id', targetUserId);
    
    // Delete post replies
    await supabaseAdmin.from('post_replies').delete().eq('author_id', targetUserId);
    
    // Delete post images
    const { data: userPosts } = await supabaseAdmin.from('posts').select('id').eq('author_id', targetUserId);
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      await supabaseAdmin.from('post_images').delete().in('post_id', postIds);
      await supabaseAdmin.from('post_link_previews').delete().in('post_id', postIds);
    }
    
    // Delete posts
    await supabaseAdmin.from('posts').delete().eq('author_id', targetUserId);
    
    // Delete follows
    await supabaseAdmin.from('follows').delete().eq('follower_id', targetUserId);
    await supabaseAdmin.from('follows').delete().eq('following_id', targetUserId);
    
    // Delete tips
    await supabaseAdmin.from('tips').delete().eq('sender_id', targetUserId);
    await supabaseAdmin.from('tips').delete().eq('receiver_id', targetUserId);
    
    // Delete gifts
    await supabaseAdmin.from('gift_transactions').delete().eq('sender_id', targetUserId);
    await supabaseAdmin.from('gift_transactions').delete().eq('receiver_id', targetUserId);
    
    // Delete red envelopes
    await supabaseAdmin.from('red_envelope_claims').delete().eq('claimer_id', targetUserId);
    await supabaseAdmin.from('red_envelopes').delete().eq('sender_id', targetUserId);
    
    // Delete game data
    await supabaseAdmin.from('game_scores').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('game_sessions').delete().eq('player_id', targetUserId);
    await supabaseAdmin.from('game_challenges').delete().eq('challenger_id', targetUserId);
    await supabaseAdmin.from('game_challenges').delete().eq('opponent_id', targetUserId);
    
    // Delete shop purchases and listings
    await supabaseAdmin.from('marketplace_listings').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('user_shop_purchases').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('bids').delete().eq('user_id', targetUserId);
    
    // Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('notifications').delete().eq('actor_id', targetUserId);
    
    // Delete user achievements and activity
    await supabaseAdmin.from('user_achievements').delete().eq('user_id', targetUserId);
    await supabaseAdmin.from('user_activity_log').delete().eq('user_id', targetUserId);
    
    // Delete ACoin transactions
    await supabaseAdmin.from('acoin_transactions').delete().eq('user_id', targetUserId);
    
    // Delete XP transfers
    await supabaseAdmin.from('xp_transfers').delete().eq('sender_id', targetUserId);
    await supabaseAdmin.from('xp_transfers').delete().eq('receiver_id', targetUserId);
    
    // Delete referrals
    await supabaseAdmin.from('referrals').delete().eq('referrer_id', targetUserId);
    await supabaseAdmin.from('referrals').delete().eq('referred_id', targetUserId);
    
    // Delete push subscriptions
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', targetUserId);
    
    // Delete security alerts
    await supabaseAdmin.from('security_alerts').delete().eq('user_id', targetUserId);
    
    // Delete active sessions
    await supabaseAdmin.from('active_sessions').delete().eq('user_id', targetUserId);
    
    // Delete login history
    await supabaseAdmin.from('login_history').delete().eq('user_id', targetUserId);
    
    // Delete stories
    await supabaseAdmin.from('story_views').delete().eq('viewer_id', targetUserId);
    await supabaseAdmin.from('stories').delete().eq('user_id', targetUserId);
    
    // Delete affiliate requests
    await supabaseAdmin.from('affiliate_requests').delete().eq('user_id', targetUserId);
    
    // Delete verification requests
    await supabaseAdmin.from('verification_requests').delete().eq('user_id', targetUserId);
    
    // Delete mini program installations
    await supabaseAdmin.from('user_mini_programs').delete().eq('user_id', targetUserId);
    
    // Delete user roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId);
    
    // Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
    
    // Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    
    if (deleteAuthError) {
      console.error('[delete-user-account] Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete authentication record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user-account] Account successfully deleted');

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[delete-user-account] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
