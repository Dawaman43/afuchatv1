import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// TELEGRAM API HELPERS
// ============================================

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

async function sendPhoto(chatId: number, photoUrl: string, caption?: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getFile(fileId: string) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
  return response.json();
}

async function downloadFile(filePath: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`);
  return response.arrayBuffer();
}

// ============================================
// USER MANAGEMENT
// ============================================

async function getOrCreateTelegramUser(telegramUser: any) {
  const { data: existing } = await supabase
    .from('telegram_users')
    .select('*, profiles(*)')
    .eq('telegram_id', telegramUser.id)
    .single();
  
  if (existing) return existing;
  
  const { data: newUser } = await supabase
    .from('telegram_users')
    .insert({
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username,
      telegram_first_name: telegramUser.first_name,
      telegram_last_name: telegramUser.last_name,
    })
    .select()
    .single();
  
  return newUser;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  return !!data;
}

// ============================================
// MENU BUILDERS
// ============================================

function buildMainMenu(isLinked: boolean, profile?: any, isAdminUser = false) {
  const greeting = profile ? `👋 Welcome back, <b>${profile.display_name}</b>!` : '👋 Welcome to <b>AfuChat Bot</b>!';
  const balance = profile ? `\n\n💰 <b>Nexa:</b> ${profile.xp?.toLocaleString() || 0}\n🪙 <b>ACoin:</b> ${profile.acoin?.toLocaleString() || 0}` : '';
  const grade = profile?.current_grade ? `\n🎖️ <b>Grade:</b> ${profile.current_grade}` : '';
  const streak = profile?.login_streak ? `\n🔥 <b>Streak:</b> ${profile.login_streak} days` : '';
  
  const text = `${greeting}${balance}${grade}${streak}

<b>AfuChat</b> - Your social platform on Telegram!

${isLinked ? '✅ Your account is linked' : '🔗 Link your account to access all features'}`;

  const buttons = isLinked ? [
    [{ text: '📰 Feed', callback_data: 'menu_feed' }, { text: '💬 Chats', callback_data: 'menu_chats' }],
    [{ text: '💰 Wallet', callback_data: 'menu_wallet' }, { text: '🎁 Gifts', callback_data: 'menu_gifts' }],
    [{ text: '👤 Profile', callback_data: 'menu_profile' }, { text: '🔔 Notifications', callback_data: 'menu_notifications' }],
    [{ text: '📱 Stories', callback_data: 'menu_stories' }, { text: '🎮 Games', callback_data: 'menu_games' }],
    [{ text: '🏆 Leaderboard', callback_data: 'menu_leaderboard' }, { text: '🛍️ Mini Apps', callback_data: 'menu_mini_apps' }],
    [{ text: '👥 Discover Users', callback_data: 'suggested_users' }],
    [{ text: '⚙️ Settings', callback_data: 'menu_settings' }],
    ...(isAdminUser ? [[{ text: '🔐 Admin Panel', callback_data: 'admin_menu' }]] : []),
  ] : [
    [{ text: '🔗 Link Existing Account', callback_data: 'link_account' }],
    [{ text: '📝 Create New Account', callback_data: 'create_account' }],
    [{ text: 'ℹ️ About AfuChat', callback_data: 'about' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFeedMenu(posts: any[]) {
  let text = '📰 <b>Latest Posts</b>\n\n';
  
  if (posts.length === 0) {
    text += 'No posts yet. Be the first to post!';
  } else {
    posts.slice(0, 5).forEach((post, i) => {
      const author = post.profiles?.display_name || 'Unknown';
      const verified = post.profiles?.is_verified ? '✅' : '';
      const content = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '');
      const hasImage = post.image_url || (post.post_images && post.post_images.length > 0) ? '🖼️' : '';
      text += `${i + 1}. <b>${author}</b> ${verified} ${hasImage}\n${content}\n❤️ ${post.likes || 0} | 💬 ${post.replies || 0} | 👁️ ${post.view_count || 0}\n\n`;
    });
  }

  const buttons = [
    [{ text: '✍️ New Post', callback_data: 'new_post' }, { text: '📷 Post with Image', callback_data: 'new_post_image' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_feed' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildWalletMenu(profile: any) {
  const text = `💰 <b>Your Wallet</b>

<b>Nexa Balance:</b> ${profile?.xp?.toLocaleString() || 0} ⚡
<b>ACoin Balance:</b> ${profile?.acoin?.toLocaleString() || 0} 🪙

<b>Current Grade:</b> ${profile?.current_grade || 'Newcomer'}
<b>Login Streak:</b> ${profile?.login_streak || 0} days 🔥

━━━━━━━━━━━━━━━━━━━━
<i>Earn Nexa by posting, engaging, and daily logins!</i>`;

  const buttons = [
    [{ text: '💱 Convert Nexa → ACoin', callback_data: 'convert_nexa' }],
    [{ text: '📤 Send Nexa', callback_data: 'send_nexa' }, { text: '📤 Send ACoin', callback_data: 'send_acoin' }],
    [{ text: '📊 Transaction History', callback_data: 'tx_history' }],
    [{ text: '🧧 Red Envelopes', callback_data: 'menu_red_envelopes' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildGiftsMenu() {
  const text = `🎁 <b>Gifts</b>

Send beautiful gifts to your friends and earn rare collectibles!

<b>Features:</b>
• Browse all available gifts
• Send gifts to friends
• View your gift collection
• Trade rare gifts on marketplace`;

  const buttons = [
    [{ text: '🛍️ Browse Gifts', callback_data: 'browse_gifts' }],
    [{ text: '📦 My Collection', callback_data: 'my_gifts' }],
    [{ text: '🏪 Marketplace', callback_data: 'gift_marketplace' }],
    [{ text: '📊 Gift Statistics', callback_data: 'gift_stats' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildChatsMenu(chats: any[]) {
  let text = '💬 <b>Your Chats</b>\n\n';
  
  if (chats.length === 0) {
    text += 'No conversations yet. Start chatting!';
  } else {
    chats.slice(0, 5).forEach((chat, i) => {
      const name = chat.name || 'Private Chat';
      const isGroup = chat.is_group ? '👥' : '👤';
      const isChannel = chat.is_channel ? '📢' : '';
      text += `${i + 1}. ${isGroup}${isChannel} <b>${name}</b>\n`;
    });
  }

  const buttons = [
    [{ text: '➕ New Chat', callback_data: 'new_chat' }],
    [{ text: '👥 Create Group', callback_data: 'create_group' }, { text: '📢 Create Channel', callback_data: 'create_channel' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_chats' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildProfileMenu(profile: any, followerCount = 0, followingCount = 0) {
  const verified = profile?.is_verified ? '✅' : '';
  const premium = profile?.is_verified ? '⭐ Premium' : '';
  const business = profile?.is_business_mode ? '💼 Business Mode' : '';
  const privateProfile = profile?.is_private ? '🔒 Private' : '🌐 Public';
  const onlineStatus = profile?.show_online_status ? '🟢 Online Status Visible' : '⚫ Online Status Hidden';
  
  const text = `👤 <b>Your Profile</b>

<b>Name:</b> ${profile?.display_name || 'Not set'} ${verified}
<b>Handle:</b> @${profile?.handle || 'not_set'}
<b>Bio:</b> ${profile?.bio || 'No bio yet'}
<b>Country:</b> ${profile?.country || 'Not set'}
<b>Date of Birth:</b> ${profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not set'}

<b>Privacy:</b> ${privateProfile}
<b>Status:</b> ${onlineStatus}
${business}

<b>Stats:</b>
• Grade: ${profile?.current_grade || 'Newcomer'}
• Nexa: ${profile?.xp?.toLocaleString() || 0}
• ACoin: ${profile?.acoin?.toLocaleString() || 0}
• Followers: ${followerCount}
• Following: ${followingCount}
• Login Streak: ${profile?.login_streak || 0} days 🔥

${premium}`;

  const buttons = [
    [{ text: '✏️ Edit Profile', callback_data: 'edit_profile' }],
    [{ text: '📷 Change Avatar', callback_data: 'change_avatar' }],
    [{ text: '📊 View Stats', callback_data: 'view_stats' }],
    [{ text: `👥 Followers (${followerCount})`, callback_data: 'my_followers' }, { text: `👥 Following (${followingCount})`, callback_data: 'my_following' }],
    [{ text: '🔐 Privacy Settings', callback_data: 'privacy_settings' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildEditProfileMenu(profile: any) {
  const text = `✏️ <b>Edit Profile</b>

Current values:
• <b>Name:</b> ${profile?.display_name || 'Not set'}
• <b>Username:</b> @${profile?.handle || 'not_set'}
• <b>Bio:</b> ${profile?.bio || 'No bio yet'}
• <b>Country:</b> ${profile?.country || 'Not set'}
• <b>Date of Birth:</b> ${profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not set'}

Select what you want to edit:`;

  const buttons = [
    [{ text: '📝 Edit Name', callback_data: 'edit_display_name' }],
    [{ text: '📝 Edit Username', callback_data: 'edit_handle' }],
    [{ text: '📝 Edit Bio', callback_data: 'edit_bio' }],
    [{ text: '🌍 Edit Country', callback_data: 'edit_country' }],
    [{ text: '🎂 Edit Date of Birth', callback_data: 'edit_dob' }],
    [{ text: '📷 Change Avatar', callback_data: 'change_avatar' }],
    [{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildPrivacySettingsMenu(profile: any) {
  const isPrivate = profile?.is_private;
  const showOnline = profile?.show_online_status;
  const showBalance = profile?.show_balance;
  
  const text = `🔐 <b>Privacy Settings</b>

Control who can see your profile and activity.

<b>Current Settings:</b>
• Profile: ${isPrivate ? '🔒 Private' : '🌐 Public'}
• Online Status: ${showOnline ? '🟢 Visible' : '⚫ Hidden'}
• Balance Display: ${showBalance !== false ? '💰 Visible' : '🙈 Hidden'}`;

  const buttons = [
    [{ text: isPrivate ? '🌐 Make Profile Public' : '🔒 Make Profile Private', callback_data: 'toggle_private' }],
    [{ text: showOnline ? '⚫ Hide Online Status' : '🟢 Show Online Status', callback_data: 'toggle_online_status' }],
    [{ text: showBalance !== false ? '🙈 Hide Balance' : '💰 Show Balance', callback_data: 'toggle_balance' }],
    [{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildGamesMenu() {
  const text = `🎮 <b>AfuChat Games</b>

Play games, earn Nexa, and compete with friends!

<b>Available Games:</b>
🧩 Puzzle Game - Match tiles to score
🧠 Memory Game - Test your memory
❓ Trivia - Answer questions to win
⚔️ Afu Arena - Battle other players`;

  const buttons = [
    [{ text: '🧩 Puzzle Game', callback_data: 'game_puzzle' }, { text: '🧠 Memory Game', callback_data: 'game_memory' }],
    [{ text: '❓ Trivia', callback_data: 'game_trivia' }, { text: '⚔️ Afu Arena', callback_data: 'game_arena' }],
    [{ text: '🏆 My Scores', callback_data: 'my_game_scores' }],
    [{ text: '🏆 Leaderboard', callback_data: 'menu_leaderboard' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildLeaderboardMenu(leaderboard: any[], userRank?: number) {
  let text = '🏆 <b>Nexa Leaderboard</b>\n\nTop Players:\n\n';
  
  const medals = ['🥇', '🥈', '🥉'];
  
  leaderboard.slice(0, 10).forEach((user, i) => {
    const medal = i < 3 ? medals[i] : `${i + 1}.`;
    const verified = user.is_verified ? '✅' : '';
    text += `${medal} <b>${user.display_name}</b> ${verified}\n   @${user.handle} • ${user.xp?.toLocaleString() || 0} Nexa\n`;
  });
  
  if (userRank) {
    text += `\n━━━━━━━━━━━━━━━━━━━━\n📊 Your Rank: #${userRank}`;
  }

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'menu_leaderboard' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildStoriesMenu(stories: any[]) {
  let text = '📱 <b>Stories</b>\n\n';
  
  if (stories.length === 0) {
    text += 'No stories from people you follow. Create one!';
  } else {
    text += '<b>Recent Stories:</b>\n';
    stories.slice(0, 10).forEach((story, i) => {
      const author = story.profiles?.display_name || 'Unknown';
      const timeAgo = getTimeAgo(story.created_at);
      text += `${i + 1}. <b>${author}</b> - ${timeAgo}\n`;
    });
  }

  const buttons = [
    [{ text: '📷 Create Story', callback_data: 'create_story' }],
    [{ text: '📸 Create Text Story', callback_data: 'create_text_story' }],
    [{ text: '👁️ My Story Views', callback_data: 'my_story_views' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_stories' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildMiniAppsMenu() {
  const text = `🛍️ <b>Mini Apps</b>

Access AfuChat's mini applications:`;

  const buttons = [
    [{ text: '🛒 Shop', callback_data: 'app_shop' }, { text: '✈️ Travel', callback_data: 'app_travel' }],
    [{ text: '🍔 Food Delivery', callback_data: 'app_food' }, { text: '🚕 Rides', callback_data: 'app_rides' }],
    [{ text: '📅 Bookings', callback_data: 'app_bookings' }, { text: '📧 AfuMail', callback_data: 'app_afumail' }],
    [{ text: '💰 Finance', callback_data: 'app_finance' }, { text: '🎉 Events', callback_data: 'app_events' }],
    [{ text: '🌐 Open in Web', url: 'https://afuchat.com/mini-programs' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildRedEnvelopeMenu(profile: any) {
  const text = `🧧 <b>Red Envelopes</b>

Send lucky money to your friends!

Your balance: ${profile?.xp?.toLocaleString() || 0} Nexa

<b>Options:</b>
• Create a new red envelope
• View unclaimed envelopes
• History of sent/received`;

  const buttons = [
    [{ text: '🧧 Create Red Envelope', callback_data: 'create_red_envelope' }],
    [{ text: '📦 My Envelopes', callback_data: 'my_red_envelopes' }],
    [{ text: '📜 History', callback_data: 'red_envelope_history' }],
    [{ text: '⬅️ Back to Wallet', callback_data: 'menu_wallet' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFollowersMenu(followers: any[], page = 0, totalCount = 0) {
  let text = `👥 <b>Your Followers</b>\n\nTotal: ${totalCount}\n\n`;
  
  if (followers.length === 0) {
    text += 'No followers yet.';
  } else {
    followers.forEach((f, i) => {
      const verified = f.is_verified ? '✅' : '';
      text += `${page * 5 + i + 1}. <b>${f.display_name}</b> ${verified}\n   @${f.handle}\n`;
    });
  }

  const buttons: any[] = [];
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `followers_page_${page - 1}` });
  if (totalCount > (page + 1) * 5) navButtons.push({ text: 'Next ➡️', callback_data: `followers_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFollowingMenu(following: any[], page = 0, totalCount = 0) {
  let text = `👥 <b>Following</b>\n\nTotal: ${totalCount}\n\n`;
  
  if (following.length === 0) {
    text += 'Not following anyone yet.';
  } else {
    following.forEach((f, i) => {
      const verified = f.is_verified ? '✅' : '';
      text += `${page * 5 + i + 1}. <b>${f.display_name}</b> ${verified}\n   @${f.handle}\n`;
    });
  }

  const buttons: any[] = [];
  
  following.forEach(f => {
    buttons.push([{ text: `❌ Unfollow @${f.handle}`, callback_data: `unfollow_${f.id}` }]);
  });
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `following_page_${page - 1}` });
  if (totalCount > (page + 1) * 5) navButtons.push({ text: 'Next ➡️', callback_data: `following_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildNotificationsMenu(notifications: any[]) {
  let text = '🔔 <b>Notifications</b>\n\n';
  
  if (notifications.length === 0) {
    text += 'No new notifications!';
  } else {
    notifications.slice(0, 10).forEach((notif) => {
      const icon = notif.type === 'new_like' ? '❤️' : 
                   notif.type === 'new_follower' ? '👤' :
                   notif.type === 'new_reply' ? '💬' :
                   notif.type === 'gift' ? '🎁' : 
                   notif.type === 'mention' ? '@' :
                   notif.type === 'red_envelope' ? '🧧' : '📢';
      const unread = !notif.is_read ? '🔵 ' : '';
      text += `${unread}${icon} ${notif.message || notif.type}\n`;
    });
  }

  const buttons = [
    [{ text: '✅ Mark All Read', callback_data: 'mark_read' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_notifications' }],
    [{ text: '🔔 Notification Settings', callback_data: 'notif_settings' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildSettingsMenu() {
  const text = `⚙️ <b>Settings</b>

Manage your AfuChat account settings.`;

  const buttons = [
    [{ text: '🔔 Notification Settings', callback_data: 'notif_settings' }],
    [{ text: '🔒 Privacy Settings', callback_data: 'privacy_settings' }],
    [{ text: '🎨 Appearance', callback_data: 'appearance_settings' }],
    [{ text: '🔐 Security', callback_data: 'security_settings' }],
    [{ text: '🔗 Unlink Account', callback_data: 'unlink_account' }],
    [{ text: '🌐 Open Web App', url: 'https://afuchat.com' }],
    [{ text: '📞 Support', callback_data: 'support' }],
    [{ text: '🗑️ Delete Account', callback_data: 'delete_account' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildNotificationSettingsMenu(prefs: any) {
  const text = `🔔 <b>Notification Settings</b>

Control what notifications you receive.`;

  const buttons = [
    [{ text: prefs?.push_likes ? '❤️ Likes: ON' : '❤️ Likes: OFF', callback_data: 'toggle_notif_likes' }],
    [{ text: prefs?.push_follows ? '👥 Follows: ON' : '👥 Follows: OFF', callback_data: 'toggle_notif_follows' }],
    [{ text: prefs?.push_comments ? '💬 Comments: ON' : '💬 Comments: OFF', callback_data: 'toggle_notif_comments' }],
    [{ text: prefs?.push_messages ? '📨 Messages: ON' : '📨 Messages: OFF', callback_data: 'toggle_notif_messages' }],
    [{ text: prefs?.push_gifts ? '🎁 Gifts: ON' : '🎁 Gifts: OFF', callback_data: 'toggle_notif_gifts' }],
    [{ text: '⬅️ Back to Settings', callback_data: 'menu_settings' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildSuggestedUsersMenu(users: any[], followingIds: string[]) {
  let text = '👥 <b>Suggested Users to Follow</b>\n\n';
  text += 'Follow users to see their posts!\n\n';
  
  if (users.length === 0) {
    text += 'No suggested users available at the moment.';
  } else {
    users.forEach((user, i) => {
      const verified = user.is_verified ? '✅' : '';
      const business = user.is_business_mode ? '💼' : '';
      const following = followingIds.includes(user.id) ? '✓ Following' : '';
      text += `${i + 1}. <b>${user.display_name}</b> ${verified}${business}\n   @${user.handle} ${following}\n`;
      if (user.bio) text += `   <i>${user.bio.slice(0, 50)}${user.bio.length > 50 ? '...' : ''}</i>\n`;
      text += '\n';
    });
  }

  const buttons = users.map(user => {
    const isFollowing = followingIds.includes(user.id);
    return [{ 
      text: isFollowing ? `✓ Following @${user.handle}` : `➕ Follow @${user.handle}`, 
      callback_data: `follow_${user.id}` 
    }];
  });
  
  buttons.push([{ text: '🔄 Refresh', callback_data: 'suggested_users' }]);
  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildDeleteAccountMenu() {
  const text = `⚠️ <b>Delete Account</b>

<b>WARNING:</b> This action is <b>PERMANENT</b> and cannot be undone!

Deleting your account will remove:
• All your posts and replies
• All your messages and chats
• All your followers and following
• Your Nexa and ACoin balance
• All gifts sent and received
• All your data

Are you absolutely sure you want to delete your account?`;

  const buttons = [
    [{ text: '⚠️ Yes, Delete My Account', callback_data: 'confirm_delete_account' }],
    [{ text: '❌ Cancel', callback_data: 'menu_settings' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildLinkAccountMenu() {
  const text = `🔗 <b>Link Your AfuChat Account</b>

Choose how you want to link your account:

<b>🔐 Secure Email Verification</b>
We'll send a 6-digit code to your email to verify ownership.

<b>🔑 Link Code</b>
Get a code from AfuChat Settings → Security → Link Telegram`;

  const buttons = [
    [{ text: '📧 Secure Email Verification', callback_data: 'link_via_email' }],
    [{ text: '🔑 Enter Link Code', callback_data: 'enter_link_code' }],
    [{ text: '⬅️ Back', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildCreateAccountMenu() {
  const text = `📝 <b>Create New AfuChat Account</b>

Create a new AfuChat account directly from Telegram!

Your Telegram info will be used:
• Name: Will use your Telegram name
• Username: Will try to use your Telegram username

You'll need to provide:
• Email address
• Password`;

  const buttons = [
    [{ text: '✅ Start Registration', callback_data: 'start_registration' }],
    [{ text: '⬅️ Back', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildBrowseGiftsMenu(gifts: any[]) {
  let text = '🛍️ <b>Available Gifts</b>\n\n';
  
  gifts.slice(0, 8).forEach((gift) => {
    const price = Math.ceil(gift.base_xp_cost * (gift.price_multiplier || 1));
    const rarity = gift.rarity === 'legendary' ? '🌟' : gift.rarity === 'rare' ? '💎' : gift.rarity === 'uncommon' ? '✨' : '';
    text += `${gift.emoji} <b>${gift.name}</b> ${rarity} - ${price} Nexa\n`;
  });

  const buttons = gifts.slice(0, 8).map(gift => ([
    { text: `${gift.emoji} ${gift.name}`, callback_data: `gift_${gift.id}` }
  ]));
  
  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildMyGiftsMenu(gifts: any[]) {
  let text = '📦 <b>My Gift Collection</b>\n\n';
  
  if (gifts.length === 0) {
    text += 'No gifts received yet. Send and receive gifts to build your collection!';
  } else {
    const grouped: Record<string, number> = {};
    gifts.forEach(g => {
      const key = g.gifts?.name || 'Unknown';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    Object.entries(grouped).forEach(([name, count]) => {
      text += `• ${name}: x${count}\n`;
    });
  }

  const buttons = [
    [{ text: '🛍️ Browse Gifts', callback_data: 'browse_gifts' }],
    [{ text: '⬅️ Back', callback_data: 'menu_gifts' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildTransactionHistoryMenu(transactions: any[]) {
  let text = '📊 <b>Transaction History</b>\n\n';
  
  if (transactions.length === 0) {
    text += 'No transactions yet.';
  } else {
    transactions.slice(0, 10).forEach((tx) => {
      const type = tx.transaction_type;
      const icon = type === 'conversion' ? '💱' : 
                   type === 'gift_sent' ? '🎁➡️' :
                   type === 'gift_received' ? '🎁⬅️' :
                   type === 'tip_sent' ? '📤' :
                   type === 'tip_received' ? '📥' :
                   type === 'red_envelope' ? '🧧' : '💰';
      const amount = tx.amount > 0 ? `+${tx.amount}` : tx.amount;
      const date = new Date(tx.created_at).toLocaleDateString();
      text += `${icon} ${type}: ${amount} ACoin (${date})\n`;
    });
  }

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'tx_history' }],
    [{ text: '⬅️ Back to Wallet', callback_data: 'menu_wallet' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

// ============================================
// ADMIN MENU BUILDERS
// ============================================

function buildAdminMenu() {
  const text = `🔐 <b>Admin Dashboard</b>

Manage the AfuChat platform:`;

  const buttons = [
    [{ text: '👥 Manage Users', callback_data: 'admin_users' }],
    [{ text: '📰 Manage Posts', callback_data: 'admin_posts' }],
    [{ text: '💰 Manage Wallets', callback_data: 'admin_wallets' }],
    [{ text: '📊 Platform Stats', callback_data: 'admin_stats' }],
    [{ text: '🎁 Manage Gifts', callback_data: 'admin_gifts' }],
    [{ text: '⭐ Subscriptions', callback_data: 'admin_subscriptions' }],
    [{ text: '🚨 Reports', callback_data: 'admin_reports' }],
    [{ text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminStatsMenu() {
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  const { count: activeSubCount } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: giftTxCount } = await supabase.from('gift_transactions').select('*', { count: 'exact', head: true });
  const { count: storyCount } = await supabase.from('stories').select('*', { count: 'exact', head: true });
  const { data: totalNexa } = await supabase.from('profiles').select('xp');
  const { data: totalACoin } = await supabase.from('profiles').select('acoin');
  
  const totalNexaSum = totalNexa?.reduce((acc: number, p: any) => acc + (p.xp || 0), 0) || 0;
  const totalACoinSum = totalACoin?.reduce((acc: number, p: any) => acc + (p.acoin || 0), 0) || 0;
  
  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const { count: newUsersToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today);
  const { count: postsToday } = await supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today);
  
  const text = `📊 <b>Platform Statistics</b>

<b>Users:</b>
👥 Total Users: ${userCount?.toLocaleString() || 0}
🆕 New Today: ${newUsersToday?.toLocaleString() || 0}
⭐ Active Subscriptions: ${activeSubCount?.toLocaleString() || 0}

<b>Content:</b>
📰 Total Posts: ${postCount?.toLocaleString() || 0}
📝 Posts Today: ${postsToday?.toLocaleString() || 0}
💬 Total Messages: ${messageCount?.toLocaleString() || 0}
📱 Total Stories: ${storyCount?.toLocaleString() || 0}
🎁 Gift Transactions: ${giftTxCount?.toLocaleString() || 0}

<b>Economy:</b>
⚡ Total Nexa in Circulation: ${totalNexaSum.toLocaleString()}
🪙 Total ACoin in Circulation: ${totalACoinSum.toLocaleString()}`;

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'admin_stats' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminUsersMenu(page = 0) {
  const pageSize = 5;
  const { data: users, count } = await supabase
    .from('profiles')
    .select('id, display_name, handle, xp, acoin, is_verified, is_business_mode, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  let text = `👥 <b>User Management</b>\n\nPage ${page + 1} of ${Math.ceil((count || 0) / pageSize)}\n\n`;
  
  (users || []).forEach((u: any, i: number) => {
    const verified = u.is_verified ? '✅' : '';
    const business = u.is_business_mode ? '💼' : '';
    text += `${page * pageSize + i + 1}. <b>${u.display_name}</b> ${verified}${business}\n   @${u.handle} | ${u.xp} Nexa\n\n`;
  });

  const buttons = (users || []).map((u: any) => ([
    { text: `👤 ${u.display_name}`, callback_data: `admin_user_${u.id}` }
  ]));
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `admin_users_page_${page - 1}` });
  if ((count || 0) > (page + 1) * pageSize) navButtons.push({ text: 'Next ➡️', callback_data: `admin_users_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '🔍 Search User', callback_data: 'admin_search_user' }]);
  buttons.push([{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminUserDetailMenu(userId: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!user) {
    return { text: '❌ User not found', reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'admin_users' }]] } };
  }

  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId);
  const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  
  const verified = user.is_verified ? '✅' : '❌';
  const business = user.is_business_mode ? '💼 Business' : '👤 Personal';
  const banned = user.is_banned ? '🚫 BANNED' : '';
  
  const text = `👤 <b>${user.display_name}</b> ${banned}

<b>Handle:</b> @${user.handle}
<b>Bio:</b> ${user.bio || 'No bio'}
<b>Country:</b> ${user.country || 'Not set'}

<b>Status:</b>
• Verified: ${verified}
• Account Type: ${business}
• Grade: ${user.current_grade || 'Newcomer'}

<b>Economy:</b>
• Nexa: ${user.xp?.toLocaleString() || 0}
• ACoin: ${user.acoin?.toLocaleString() || 0}

<b>Stats:</b>
• Posts: ${postCount || 0}
• Followers: ${followerCount || 0}
• Login Streak: ${user.login_streak || 0} days

<b>Created:</b> ${new Date(user.created_at).toLocaleDateString()}`;

  const buttons = [
    [{ text: '➕ Give Nexa', callback_data: `admin_give_nexa_${userId}` }, { text: '➕ Give ACoin', callback_data: `admin_give_acoin_${userId}` }],
    [{ text: user.is_verified ? '❌ Remove Verified' : '✅ Verify User', callback_data: `admin_toggle_verify_${userId}` }],
    [{ text: user.is_banned ? '✅ Unban User' : '🚫 Ban User', callback_data: `admin_toggle_ban_${userId}` }],
    [{ text: '📧 Send Message', callback_data: `admin_message_user_${userId}` }],
    [{ text: '🗑️ Delete User', callback_data: `admin_delete_user_${userId}` }],
    [{ text: '⬅️ Back to Users', callback_data: 'admin_users' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminPostsMenu(page = 0) {
  const pageSize = 5;
  const { data: posts, count } = await supabase
    .from('posts')
    .select('id, content, author_id, created_at, profiles(display_name, handle)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  let text = `📰 <b>Post Management</b>\n\nPage ${page + 1} of ${Math.ceil((count || 0) / pageSize)}\n\n`;
  
  (posts || []).forEach((p: any, i: number) => {
    const content = p.content.slice(0, 50) + (p.content.length > 50 ? '...' : '');
    text += `${page * pageSize + i + 1}. <b>${p.profiles?.display_name || 'Unknown'}</b>\n   ${content}\n\n`;
  });

  const buttons = (posts || []).map((p: any) => ([
    { text: `📄 Post by ${p.profiles?.display_name || 'Unknown'}`, callback_data: `admin_post_${p.id}` }
  ]));
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `admin_posts_page_${page - 1}` });
  if ((count || 0) > (page + 1) * pageSize) navButtons.push({ text: 'Next ➡️', callback_data: `admin_posts_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminPostDetailMenu(postId: string) {
  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(display_name, handle)')
    .eq('id', postId)
    .single();
  
  if (!post) {
    return { text: '❌ Post not found', reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'admin_posts' }]] } };
  }

  const { count: likeCount } = await supabase.from('post_acknowledgments').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  const { count: replyCount } = await supabase.from('post_replies').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  
  const text = `📰 <b>Post Details</b>

<b>Author:</b> ${post.profiles?.display_name} (@${post.profiles?.handle})
<b>Created:</b> ${new Date(post.created_at).toLocaleString()}

<b>Content:</b>
${post.content}

<b>Stats:</b>
❤️ ${likeCount || 0} likes | 💬 ${replyCount || 0} replies | 👁️ ${post.view_count || 0} views`;

  const buttons = [
    [{ text: '🗑️ Delete Post', callback_data: `admin_delete_post_${postId}` }],
    [{ text: '⬅️ Back to Posts', callback_data: 'admin_posts' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminSubscriptionsMenu() {
  const { data: subs, count } = await supabase
    .from('user_subscriptions')
    .select('*, profiles(display_name, handle), subscription_plans(name)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10);

  let text = `⭐ <b>Active Subscriptions</b>\n\nTotal Active: ${count || 0}\n\n`;
  
  (subs || []).forEach((s: any, i: number) => {
    text += `${i + 1}. <b>${s.profiles?.display_name}</b> (@${s.profiles?.handle})\n   Plan: ${s.subscription_plans?.name || 'Unknown'}\n   Expires: ${new Date(s.expires_at).toLocaleDateString()}\n\n`;
  });

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'admin_subscriptions' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminReportsMenu() {
  const { data: reports, count } = await supabase
    .from('post_reports')
    .select('*, posts(content, profiles(display_name)), profiles!post_reports_reporter_id_fkey(display_name)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  let text = `🚨 <b>Pending Reports</b>\n\nTotal Pending: ${count || 0}\n\n`;
  
  if ((reports?.length || 0) === 0) {
    text += 'No pending reports! 🎉';
  } else {
    (reports || []).forEach((r: any, i: number) => {
      text += `${i + 1}. <b>${r.reason}</b>\n   Post: "${r.posts?.content?.slice(0, 30)}..."\n   By: ${r.profiles?.display_name}\n\n`;
    });
  }

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'admin_reports' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminGiftsMenu() {
  const { data: gifts } = await supabase
    .from('gifts')
    .select('*, gift_statistics(total_sent, price_multiplier)')
    .order('base_xp_cost', { ascending: true });

  let text = `🎁 <b>Gift Management</b>\n\n`;
  
  (gifts || []).forEach((g: any) => {
    const stats = g.gift_statistics;
    const price = Math.ceil(g.base_xp_cost * (stats?.price_multiplier || 1));
    text += `${g.emoji} <b>${g.name}</b> (${g.rarity})\n   Base: ${g.base_xp_cost} | Current: ${price} | Sent: ${stats?.total_sent || 0}\n`;
  });

  const buttons = [
    [{ text: '➕ Create Gift', callback_data: 'admin_create_gift' }],
    [{ text: '🔄 Reset Prices', callback_data: 'admin_reset_gift_prices' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function uploadAvatarFromTelegram(fileId: string, userId: string): Promise<string | null> {
  try {
    // Get file info from Telegram
    const fileInfo = await getFile(fileId);
    if (!fileInfo.ok || !fileInfo.result.file_path) {
      console.error('Failed to get file info:', fileInfo);
      return null;
    }
    
    // Download the file
    const fileData = await downloadFile(fileInfo.result.file_path);
    
    // Generate unique filename
    const ext = fileInfo.result.file_path.split('.').pop() || 'jpg';
    const filename = `${userId}/avatar_${Date.now()}.${ext}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, fileData, {
        contentType: `image/${ext}`,
        upsert: true
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

// ============================================
// CALLBACK HANDLER
// ============================================

async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const telegramUser = callbackQuery.from;
  
  await answerCallbackQuery(callbackQuery.id);
  
  const tgUser = await getOrCreateTelegramUser(telegramUser);
  const isLinked = tgUser?.is_linked && tgUser?.user_id;
  const profile = tgUser?.profiles;
  const isAdminUser = isLinked && tgUser?.user_id ? await isAdmin(tgUser.user_id) : false;

  switch (data) {
    case 'main_menu': {
      const menu = buildMainMenu(isLinked, profile, isAdminUser);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_feed': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to access the feed.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle, is_verified), post_images(image_url)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const { data: replyCounts } = await supabase.from('post_replies').select('post_id');
      const { data: likeCounts } = await supabase.from('post_acknowledgments').select('post_id');
      
      const postsWithCounts = (posts || []).map(post => ({
        ...post,
        replies: replyCounts?.filter(r => r.post_id === post.id).length || 0,
        likes: likeCounts?.filter(l => l.post_id === post.id).length || 0,
      }));
      
      const menu = buildFeedMenu(postsWithCounts);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_wallet': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildWalletMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_gifts': {
      const menu = buildGiftsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'browse_gifts': {
      const { data: gifts } = await supabase
        .from('gifts')
        .select('*, gift_statistics(price_multiplier)')
        .order('base_xp_cost', { ascending: true })
        .limit(8);
      
      const giftsWithMultiplier = (gifts || []).map(g => ({
        ...g,
        price_multiplier: g.gift_statistics?.price_multiplier || 1
      }));
      
      const menu = buildBrowseGiftsMenu(giftsWithMultiplier);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'my_gifts': {
      if (!isLinked) return;
      
      const { data: receivedGifts } = await supabase
        .from('gift_transactions')
        .select('*, gifts(name, emoji)')
        .eq('receiver_id', tgUser.user_id)
        .order('created_at', { ascending: false });
      
      const menu = buildMyGiftsMenu(receivedGifts || []);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_chats': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: chatMembers } = await supabase
        .from('chat_members')
        .select('chat_id, chats(name, is_group, is_channel)')
        .eq('user_id', tgUser.user_id)
        .limit(5);
      
      const chats = (chatMembers || []).map((cm: any) => ({
        name: cm.chats?.name,
        is_group: cm.chats?.is_group,
        is_channel: cm.chats?.is_channel
      }));
      
      const menu = buildChatsMenu(chats);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_profile': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', tgUser.user_id);
      const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', tgUser.user_id);
      
      const menu = buildProfileMenu(freshProfile, followerCount || 0, followingCount || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'edit_profile': {
      if (!isLinked) return;
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildEditProfileMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'edit_display_name': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_display_name' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 Enter your new display name:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_handle': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_handle' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 Enter your new username (letters, numbers, underscores only):\n\n<i>Note: You can only change your username once every 30 days.</i>', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_bio': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_bio' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 Enter your new bio (max 160 characters):', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_country': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_country' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🌍 Enter your country name (e.g., United States, Uganda, Germany):', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_dob': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_dob' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🎂 Enter your date of birth (format: YYYY-MM-DD):\n\nExample: 1995-06-15', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'change_avatar': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_avatar' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📷 <b>Change Profile Picture</b>\n\nSend me a photo to use as your new profile picture.\n\n<i>For best results, use a square image.</i>', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'privacy_settings': {
      if (!isLinked) return;
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildPrivacySettingsMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'toggle_private': {
      if (!isLinked) return;
      
      const { data: currentProfile } = await supabase.from('profiles').select('is_private').eq('id', tgUser.user_id).single();
      await supabase.from('profiles').update({ is_private: !currentProfile?.is_private }).eq('id', tgUser.user_id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildPrivacySettingsMenu(freshProfile);
      await editMessage(chatId, messageId, `✅ Profile is now ${freshProfile?.is_private ? 'private' : 'public'}!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'toggle_online_status': {
      if (!isLinked) return;
      
      const { data: currentProfile } = await supabase.from('profiles').select('show_online_status').eq('id', tgUser.user_id).single();
      await supabase.from('profiles').update({ show_online_status: !currentProfile?.show_online_status }).eq('id', tgUser.user_id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildPrivacySettingsMenu(freshProfile);
      await editMessage(chatId, messageId, `✅ Online status is now ${freshProfile?.show_online_status ? 'visible' : 'hidden'}!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'toggle_balance': {
      if (!isLinked) return;
      
      const { data: currentProfile } = await supabase.from('profiles').select('show_balance').eq('id', tgUser.user_id).single();
      await supabase.from('profiles').update({ show_balance: currentProfile?.show_balance === false ? true : false }).eq('id', tgUser.user_id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildPrivacySettingsMenu(freshProfile);
      await editMessage(chatId, messageId, `✅ Balance display is now ${freshProfile?.show_balance !== false ? 'visible' : 'hidden'}!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_games': {
      const menu = buildGamesMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'game_puzzle':
    case 'game_memory':
    case 'game_trivia':
    case 'game_arena': {
      const gameName = data.replace('game_', '');
      await editMessage(chatId, messageId, `🎮 <b>Play ${gameName.charAt(0).toUpperCase() + gameName.slice(1)}</b>\n\nOpen the game in the AfuChat web app to play!`, {
        inline_keyboard: [
          [{ text: '🎮 Play Now', url: `https://afuchat.com/games/${gameName}` }],
          [{ text: '⬅️ Back to Games', callback_data: 'menu_games' }]
        ]
      });
      break;
    }
    
    case 'my_game_scores': {
      if (!isLinked) return;
      
      const { data: scores } = await supabase
        .from('game_scores')
        .select('game_type, score, difficulty, created_at')
        .eq('user_id', tgUser.user_id)
        .order('score', { ascending: false })
        .limit(10);
      
      let text = '🏆 <b>My Game Scores</b>\n\n';
      
      if ((scores?.length || 0) === 0) {
        text += 'No scores yet. Play some games!';
      } else {
        scores?.forEach((s, i) => {
          text += `${i + 1}. <b>${s.game_type}</b> (${s.difficulty})\n   Score: ${s.score} | ${new Date(s.created_at).toLocaleDateString()}\n`;
        });
      }
      
      await editMessage(chatId, messageId, text, {
        inline_keyboard: [
          [{ text: '🎮 Play Games', callback_data: 'menu_games' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      });
      break;
    }
    
    case 'menu_leaderboard': {
      const { data: leaderboard } = await supabase
        .from('profiles')
        .select('id, display_name, handle, xp, is_verified')
        .order('xp', { ascending: false })
        .limit(10);
      
      let userRank = undefined;
      if (isLinked && tgUser.user_id) {
        const { data: userProfile } = await supabase.from('profiles').select('xp').eq('id', tgUser.user_id).single();
        if (userProfile) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('xp', userProfile.xp);
          userRank = (count || 0) + 1;
        }
      }
      
      const menu = buildLeaderboardMenu(leaderboard || [], userRank);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_stories': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      // Get stories from users you follow
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', tgUser.user_id);
      
      const followingIds = (following || []).map((f: any) => f.following_id);
      followingIds.push(tgUser.user_id); // Include own stories
      
      const { data: stories } = await supabase
        .from('stories')
        .select('*, profiles(display_name)')
        .in('user_id', followingIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      const menu = buildStoriesMenu(stories || []);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'create_story': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_story_image' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📷 <b>Create Story</b>\n\nSend me a photo to create a story.\n\n<i>Stories expire after 24 hours.</i>', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_stories' }]]
      });
      break;
    }
    
    case 'create_text_story': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_story_text' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 <b>Create Text Story</b>\n\nSend me the text for your story:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_stories' }]]
      });
      break;
    }
    
    case 'menu_mini_apps': {
      const menu = buildMiniAppsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'app_shop':
    case 'app_travel':
    case 'app_food':
    case 'app_rides':
    case 'app_bookings':
    case 'app_afumail':
    case 'app_finance':
    case 'app_events': {
      const appName = data.replace('app_', '');
      const appUrls: Record<string, string> = {
        shop: 'shop',
        travel: 'travel',
        food: 'food-delivery',
        rides: 'rides',
        bookings: 'bookings',
        afumail: 'afumail',
        finance: 'finance',
        events: 'events'
      };
      
      await editMessage(chatId, messageId, `🛍️ <b>${appName.charAt(0).toUpperCase() + appName.slice(1)}</b>\n\nOpen in the AfuChat web app for the full experience!`, {
        inline_keyboard: [
          [{ text: '🌐 Open App', url: `https://afuchat.com/${appUrls[appName]}` }],
          [{ text: '⬅️ Back to Mini Apps', callback_data: 'menu_mini_apps' }]
        ]
      });
      break;
    }
    
    case 'menu_red_envelopes': {
      if (!isLinked) return;
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildRedEnvelopeMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'create_red_envelope': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_red_envelope_amount' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🧧 <b>Create Red Envelope</b>\n\nEnter the total Nexa amount to put in the envelope:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_red_envelopes' }]]
      });
      break;
    }
    
    case 'menu_notifications': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const menu = buildNotificationsMenu(notifications || []);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'mark_read': {
      if (isLinked) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', tgUser.user_id);
      }
      await editMessage(chatId, messageId, '✅ All notifications marked as read!', {
        inline_keyboard: [[{ text: '🔔 Notifications', callback_data: 'menu_notifications' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'menu_settings': {
      const menu = buildSettingsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'notif_settings': {
      if (!isLinked) return;
      
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .single();
      
      const menu = buildNotificationSettingsMenu(prefs || {
        push_likes: true,
        push_follows: true,
        push_comments: true,
        push_messages: true,
        push_gifts: true
      });
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'toggle_notif_likes':
    case 'toggle_notif_follows':
    case 'toggle_notif_comments':
    case 'toggle_notif_messages':
    case 'toggle_notif_gifts': {
      if (!isLinked) return;
      
      const field = data.replace('toggle_notif_', 'push_');
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .single();
      
      const currentValue = prefs?.[field] !== false;
      
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: tgUser.user_id,
          [field]: !currentValue
        }, { onConflict: 'user_id' });
      
      const { data: updatedPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .single();
      
      const menu = buildNotificationSettingsMenu(updatedPrefs);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'support': {
      await editMessage(chatId, messageId, `📞 <b>Support</b>

Need help? Contact us:

📧 Email: support@afuchat.com
🌐 Web: https://afuchat.com/support

Or describe your issue and we'll help you!`, {
        inline_keyboard: [
          [{ text: '📧 Email Support', url: 'mailto:support@afuchat.com' }],
          [{ text: '⬅️ Back to Settings', callback_data: 'menu_settings' }]
        ]
      });
      break;
    }
    
    case 'link_account': {
      const menu = buildLinkAccountMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'create_account': {
      const menu = buildCreateAccountMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'link_via_email': {
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_email_link' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, `📧 <b>Secure Email Verification</b>

Enter your AfuChat email address.
We'll send a 6-digit verification code to confirm you own this account.

⚠️ This is required for security - we never link accounts without verification.`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
      });
      break;
    }
    
    case 'resend_verification': {
      const email = tgUser?.menu_data?.email;
      if (!email) {
        await editMessage(chatId, messageId, '❌ Session expired. Please start again.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }]]
        });
        break;
      }
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_email_link' }).eq('telegram_id', telegramUser.id);
      await handleEmailLink(chatId, telegramUser, tgUser, email);
      break;
    }
    
    case 'enter_link_code': {
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_link_code' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🔑 Please enter your link code:\n\n<i>Get this code from AfuChat Settings → Security → Link Telegram</i>', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
      });
      break;
    }
    
    case 'start_registration': {
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_email' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📧 Please enter your email address:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'about': {
      const aboutText = `ℹ️ <b>About AfuChat</b>

AfuChat is a social platform where you can:

📰 Share posts and stories
💬 Chat with friends
🎁 Send and receive gifts
💰 Earn Nexa rewards
🏆 Climb the leaderboard
🎮 Play games
🛍️ Access mini apps

<b>Website:</b> afuchat.com
<b>Support:</b> support@afuchat.com`;

      await editMessage(chatId, messageId, aboutText, {
        inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'new_post': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_post_content' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '✍️ <b>Create New Post</b>\n\nSend me the content for your post:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_feed' }]]
      });
      break;
    }
    
    case 'new_post_image': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_post_image' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📷 <b>Create Post with Image</b>\n\nSend me an image with a caption for your post:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_feed' }]]
      });
      break;
    }
    
    case 'convert_nexa': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_convert_amount' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, `💱 <b>Convert Nexa to ACoin</b>

Current balance: ${profile?.xp?.toLocaleString() || 0} Nexa
Conversion rate: 5.99% fee

Enter the amount of Nexa to convert:`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'send_nexa': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_send_recipient' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, `📤 <b>Send Nexa</b>

Current balance: ${profile?.xp?.toLocaleString() || 0} Nexa

Enter the recipient's username (without @):`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'send_acoin': {
      if (!isLinked) return;
      await supabase.from('telegram_users').update({ current_menu: 'awaiting_acoin_recipient' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, `📤 <b>Send ACoin</b>

Current balance: ${profile?.acoin?.toLocaleString() || 0} ACoin

Enter the recipient's username (without @):`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'tx_history': {
      if (!isLinked) return;
      
      const { data: transactions } = await supabase
        .from('acoin_transactions')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const menu = buildTransactionHistoryMenu(transactions || []);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'unlink_account': {
      await editMessage(chatId, messageId, '⚠️ <b>Unlink Account</b>\n\nAre you sure you want to unlink your AfuChat account from this Telegram?', {
        inline_keyboard: [
          [{ text: '✅ Yes, Unlink', callback_data: 'confirm_unlink' }],
          [{ text: '❌ Cancel', callback_data: 'menu_settings' }]
        ]
      });
      break;
    }
    
    case 'confirm_unlink': {
      await supabase.from('telegram_users').update({ user_id: null, is_linked: false }).eq('telegram_id', telegramUser.id);
      const menu = buildMainMenu(false, null);
      await editMessage(chatId, messageId, '✅ Account unlinked successfully!\n\n' + menu.text, menu.reply_markup);
      break;
    }
    
    case 'delete_account': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 No account linked to delete.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      const menu = buildDeleteAccountMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'confirm_delete_account': {
      if (!isLinked || !tgUser.user_id) {
        await editMessage(chatId, messageId, '❌ No account to delete.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      await editMessage(chatId, messageId, '⏳ <b>Deleting your account...</b>\n\nThis may take a moment...', { inline_keyboard: [] });
      
      try {
        const userId = tgUser.user_id;
        
        // Delete user data
        await supabase.from('message_reactions').delete().eq('user_id', userId);
        await supabase.from('message_status').delete().eq('user_id', userId);
        await supabase.from('messages').delete().eq('sender_id', userId);
        await supabase.from('chat_members').delete().eq('user_id', userId);
        await supabase.from('chats').delete().eq('created_by', userId);
        await supabase.from('post_acknowledgments').delete().eq('user_id', userId);
        await supabase.from('post_replies').delete().eq('author_id', userId);
        
        const { data: userPosts } = await supabase.from('posts').select('id').eq('author_id', userId);
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p: any) => p.id);
          await supabase.from('post_images').delete().in('post_id', postIds);
          await supabase.from('post_link_previews').delete().in('post_id', postIds);
          await supabase.from('post_views').delete().in('post_id', postIds);
        }
        await supabase.from('posts').delete().eq('author_id', userId);
        await supabase.from('follows').delete().eq('follower_id', userId);
        await supabase.from('follows').delete().eq('following_id', userId);
        await supabase.from('tips').delete().eq('sender_id', userId);
        await supabase.from('tips').delete().eq('receiver_id', userId);
        await supabase.from('gift_transactions').delete().eq('sender_id', userId);
        await supabase.from('gift_transactions').delete().eq('receiver_id', userId);
        await supabase.from('pinned_gifts').delete().eq('user_id', userId);
        await supabase.from('red_envelope_claims').delete().eq('claimer_id', userId);
        await supabase.from('red_envelopes').delete().eq('sender_id', userId);
        await supabase.from('game_scores').delete().eq('user_id', userId);
        await supabase.from('game_sessions').delete().eq('player_id', userId);
        await supabase.from('game_challenges').delete().eq('challenger_id', userId);
        await supabase.from('game_challenges').delete().eq('opponent_id', userId);
        await supabase.from('marketplace_listings').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('actor_id', userId);
        await supabase.from('notification_preferences').delete().eq('user_id', userId);
        await supabase.from('user_achievements').delete().eq('user_id', userId);
        await supabase.from('user_activity_log').delete().eq('user_id', userId);
        await supabase.from('unlocked_accessories').delete().eq('user_id', userId);
        await supabase.from('acoin_transactions').delete().eq('user_id', userId);
        await supabase.from('referrals').delete().eq('referrer_id', userId);
        await supabase.from('referrals').delete().eq('referred_id', userId);
        await supabase.from('security_alerts').delete().eq('user_id', userId);
        await supabase.from('active_sessions').delete().eq('user_id', userId);
        await supabase.from('login_history').delete().eq('user_id', userId);
        await supabase.from('story_views').delete().eq('viewer_id', userId);
        await supabase.from('stories').delete().eq('user_id', userId);
        await supabase.from('chat_preferences').delete().eq('user_id', userId);
        await supabase.from('chat_folders').delete().eq('user_id', userId);
        await supabase.from('chat_labels').delete().eq('user_id', userId);
        await supabase.from('user_subscriptions').delete().eq('user_id', userId);
        await supabase.from('affiliate_requests').delete().eq('user_id', userId);
        await supabase.from('telegram_users').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        
        await supabase.from('telegram_users').insert({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name,
          is_linked: false
        });
        
        const menu = buildMainMenu(false, null);
        await editMessage(chatId, messageId, '✅ <b>Account Permanently Deleted</b>\n\nYour AfuChat account has been completely removed.\n\n' + menu.text, menu.reply_markup);
      } catch (error) {
        console.error('Delete account error:', error);
        await editMessage(chatId, messageId, '❌ Failed to delete account. Please try again or contact support.', {
          inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'confirm_delete_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'suggested_users': {
      if (!isLinked || !tgUser.user_id) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: suggestedUsers } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, avatar_url, is_verified, is_business_mode')
        .neq('id', tgUser.user_id)
        .order('xp', { ascending: false })
        .limit(5);
      
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', tgUser.user_id);
      
      const followingIds = (following || []).map((f: any) => f.following_id);
      const menu = buildSuggestedUsersMenu(suggestedUsers || [], followingIds);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'my_followers': {
      if (!isLinked) return;
      
      const { data: followers, count } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
        .eq('following_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .range(0, 4);
      
      const followerProfiles = (followers || []).map((f: any) => f.profiles).filter(Boolean);
      const menu = buildFollowersMenu(followerProfiles, 0, count || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'my_following': {
      if (!isLinked) return;
      
      const { data: following, count } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
        .eq('follower_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .range(0, 4);
      
      const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
      const menu = buildFollowingMenu(followingProfiles, 0, count || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    // ============================================
    // ADMIN CALLBACKS
    // ============================================
    
    case 'admin_menu': {
      if (!isLinked || !isAdminUser) {
        await editMessage(chatId, messageId, '❌ Access denied.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      const menu = buildAdminMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_stats': {
      if (!isAdminUser) return;
      const menu = await buildAdminStatsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_users': {
      if (!isAdminUser) return;
      const menu = await buildAdminUsersMenu(0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_posts': {
      if (!isAdminUser) return;
      const menu = await buildAdminPostsMenu(0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_subscriptions': {
      if (!isAdminUser) return;
      const menu = await buildAdminSubscriptionsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_reports': {
      if (!isAdminUser) return;
      const menu = await buildAdminReportsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_gifts': {
      if (!isAdminUser) return;
      const menu = await buildAdminGiftsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_search_user': {
      if (!isAdminUser) return;
      await supabase.from('telegram_users').update({ current_menu: 'admin_awaiting_user_search' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🔍 Enter username or display name to search:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'admin_users' }]]
      });
      break;
    }
    
    case 'admin_broadcast': {
      if (!isAdminUser) return;
      await supabase.from('telegram_users').update({ current_menu: 'admin_awaiting_broadcast' }).eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📢 <b>Broadcast Message</b>\n\nEnter the message to send to all users:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'admin_menu' }]]
      });
      break;
    }
    
    default: {
      // Handle dynamic callbacks
      await handleDynamicCallback(callbackQuery, data, chatId, messageId, telegramUser, tgUser, isLinked, isAdminUser);
    }
  }
}

async function handleDynamicCallback(
  callbackQuery: any, 
  data: string, 
  chatId: number, 
  messageId: number, 
  telegramUser: any, 
  tgUser: any, 
  isLinked: boolean,
  isAdminUser: boolean
) {
  // Admin pagination
  if (data.startsWith('admin_users_page_')) {
    if (!isAdminUser) return;
    const page = parseInt(data.replace('admin_users_page_', ''));
    const menu = await buildAdminUsersMenu(page);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_posts_page_')) {
    if (!isAdminUser) return;
    const page = parseInt(data.replace('admin_posts_page_', ''));
    const menu = await buildAdminPostsMenu(page);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_user_')) {
    if (!isAdminUser) return;
    const userId = data.replace('admin_user_', '');
    const menu = await buildAdminUserDetailMenu(userId);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_post_')) {
    if (!isAdminUser) return;
    const postId = data.replace('admin_post_', '');
    const menu = await buildAdminPostDetailMenu(postId);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_give_nexa_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_give_nexa_', '');
    await supabase.from('telegram_users').update({ current_menu: 'admin_awaiting_nexa_amount', menu_data: { target_user_id: targetUserId } }).eq('telegram_id', telegramUser.id);
    await editMessage(chatId, messageId, '➕ Enter the amount of Nexa to give:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
    });
    return;
  }
  
  if (data.startsWith('admin_give_acoin_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_give_acoin_', '');
    await supabase.from('telegram_users').update({ current_menu: 'admin_awaiting_acoin_amount', menu_data: { target_user_id: targetUserId } }).eq('telegram_id', telegramUser.id);
    await editMessage(chatId, messageId, '➕ Enter the amount of ACoin to give:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
    });
    return;
  }
  
  if (data.startsWith('admin_toggle_verify_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_toggle_verify_', '');
    const { data: user } = await supabase.from('profiles').select('is_verified').eq('id', targetUserId).single();
    await supabase.from('profiles').update({ is_verified: !user?.is_verified }).eq('id', targetUserId);
    const menu = await buildAdminUserDetailMenu(targetUserId);
    await editMessage(chatId, messageId, `✅ User verification ${user?.is_verified ? 'removed' : 'granted'}!\n\n` + menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_toggle_ban_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_toggle_ban_', '');
    const { data: user } = await supabase.from('profiles').select('is_banned').eq('id', targetUserId).single();
    await supabase.from('profiles').update({ is_banned: !user?.is_banned }).eq('id', targetUserId);
    const menu = await buildAdminUserDetailMenu(targetUserId);
    await editMessage(chatId, messageId, `✅ User ${user?.is_banned ? 'unbanned' : 'banned'}!\n\n` + menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_delete_user_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_delete_user_', '');
    await editMessage(chatId, messageId, '⚠️ Are you sure you want to DELETE this user? This cannot be undone!', {
      inline_keyboard: [
        [{ text: '⚠️ Yes, Delete User', callback_data: `admin_confirm_delete_user_${targetUserId}` }],
        [{ text: '❌ Cancel', callback_data: `admin_user_${targetUserId}` }]
      ]
    });
    return;
  }
  
  if (data.startsWith('admin_confirm_delete_user_')) {
    if (!isAdminUser) return;
    const targetUserId = data.replace('admin_confirm_delete_user_', '');
    await supabase.from('posts').delete().eq('author_id', targetUserId);
    await supabase.from('follows').delete().eq('follower_id', targetUserId);
    await supabase.from('follows').delete().eq('following_id', targetUserId);
    await supabase.from('notifications').delete().eq('user_id', targetUserId);
    await supabase.from('telegram_users').delete().eq('user_id', targetUserId);
    await supabase.from('profiles').delete().eq('id', targetUserId);
    
    const menu = await buildAdminUsersMenu(0);
    await editMessage(chatId, messageId, '✅ User deleted!\n\n' + menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('admin_delete_post_')) {
    if (!isAdminUser) return;
    const postId = data.replace('admin_delete_post_', '');
    await supabase.from('post_images').delete().eq('post_id', postId);
    await supabase.from('post_link_previews').delete().eq('post_id', postId);
    await supabase.from('post_acknowledgments').delete().eq('post_id', postId);
    await supabase.from('post_replies').delete().eq('post_id', postId);
    await supabase.from('posts').delete().eq('id', postId);
    
    const menu = await buildAdminPostsMenu(0);
    await editMessage(chatId, messageId, '✅ Post deleted!\n\n' + menu.text, menu.reply_markup);
    return;
  }
  
  // Gift selection
  if (data.startsWith('gift_')) {
    if (!isLinked) return;
    const giftId = data.replace('gift_', '');
    
    const { data: gift } = await supabase.from('gifts').select('*, gift_statistics(price_multiplier, total_sent)').eq('id', giftId).single();
    
    if (!gift) {
      await editMessage(chatId, messageId, '❌ Gift not found.', {
        inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'browse_gifts' }]]
      });
      return;
    }
    
    const price = Math.ceil(gift.base_xp_cost * (gift.gift_statistics?.price_multiplier || 1));
    
    await supabase.from('telegram_users').update({ current_menu: 'awaiting_gift_recipient', menu_data: { gift_id: giftId } }).eq('telegram_id', telegramUser.id);
    
    await editMessage(chatId, messageId, `${gift.emoji} <b>${gift.name}</b>

${gift.description || 'A beautiful gift!'}

<b>Rarity:</b> ${gift.rarity}
<b>Price:</b> ${price} Nexa
<b>Times Sent:</b> ${gift.gift_statistics?.total_sent || 0}

Enter the recipient's username (without @):`, {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'browse_gifts' }]]
    });
    return;
  }
  
  // Follow/unfollow
  if (data.startsWith('follow_')) {
    if (!isLinked || !tgUser.user_id) return;
    
    const targetUserId = data.replace('follow_', '');
    
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', tgUser.user_id)
      .eq('following_id', targetUserId)
      .single();
    
    if (existingFollow) {
      await supabase.from('follows').delete().eq('follower_id', tgUser.user_id).eq('following_id', targetUserId);
      await answerCallbackQuery(callbackQuery.id, 'Unfollowed!');
    } else {
      await supabase.from('follows').insert({ follower_id: tgUser.user_id, following_id: targetUserId });
      await answerCallbackQuery(callbackQuery.id, 'Followed!');
    }
    
    // Refresh suggested users
    const { data: suggestedUsers } = await supabase
      .from('profiles')
      .select('id, display_name, handle, bio, avatar_url, is_verified, is_business_mode')
      .neq('id', tgUser.user_id)
      .order('xp', { ascending: false })
      .limit(5);
    
    const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', tgUser.user_id);
    const followingIds = (following || []).map((f: any) => f.following_id);
    
    const menu = buildSuggestedUsersMenu(suggestedUsers || [], followingIds);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('unfollow_')) {
    if (!isLinked || !tgUser.user_id) return;
    
    const targetUserId = data.replace('unfollow_', '');
    await supabase.from('follows').delete().eq('follower_id', tgUser.user_id).eq('following_id', targetUserId);
    await answerCallbackQuery(callbackQuery.id, 'Unfollowed!');
    
    // Refresh following list
    const { data: following, count } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
      .eq('follower_id', tgUser.user_id)
      .order('created_at', { ascending: false })
      .range(0, 4);
    
    const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
    const menu = buildFollowingMenu(followingProfiles, 0, count || 0);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  // Pagination for followers/following
  if (data.startsWith('followers_page_')) {
    if (!isLinked) return;
    const page = parseInt(data.replace('followers_page_', ''));
    
    const { data: followers, count } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
      .eq('following_id', tgUser.user_id)
      .order('created_at', { ascending: false })
      .range(page * 5, (page + 1) * 5 - 1);
    
    const followerProfiles = (followers || []).map((f: any) => f.profiles).filter(Boolean);
    const menu = buildFollowersMenu(followerProfiles, page, count || 0);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
  
  if (data.startsWith('following_page_')) {
    if (!isLinked) return;
    const page = parseInt(data.replace('following_page_', ''));
    
    const { data: following, count } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
      .eq('follower_id', tgUser.user_id)
      .order('created_at', { ascending: false })
      .range(page * 5, (page + 1) * 5 - 1);
    
    const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
    const menu = buildFollowingMenu(followingProfiles, page, count || 0);
    await editMessage(chatId, messageId, menu.text, menu.reply_markup);
    return;
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  const telegramUser = message.from;
  const photo = message.photo;
  
  // Handle /start command
  if (text === '/start') {
    const tgUser = await getOrCreateTelegramUser(telegramUser);
    const isLinked = tgUser?.is_linked && tgUser?.user_id;
    
    let profile = null;
    let isAdminUser = false;
    if (isLinked && tgUser.user_id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      profile = data;
      isAdminUser = await isAdmin(tgUser.user_id);
    }
    
    const menu = buildMainMenu(isLinked, profile, isAdminUser);
    await sendTelegramMessage(chatId, menu.text, menu.reply_markup);
    return;
  }
  
  // Handle /menu command
  if (text === '/menu') {
    const tgUser = await getOrCreateTelegramUser(telegramUser);
    const isLinked = tgUser?.is_linked && tgUser?.user_id;
    let profile = null;
    let isAdminUser = false;
    if (isLinked && tgUser.user_id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      profile = data;
      isAdminUser = await isAdmin(tgUser.user_id);
    }
    const menu = buildMainMenu(isLinked, profile, isAdminUser);
    await sendTelegramMessage(chatId, menu.text, menu.reply_markup);
    return;
  }
  
  // Get user state
  const { data: tgUser } = await supabase
    .from('telegram_users')
    .select('*, profiles(*)')
    .eq('telegram_id', telegramUser.id)
    .single();
  
  if (!tgUser) return;
  
  const currentMenu = tgUser.current_menu;
  
  // Handle photo uploads
  if (photo && photo.length > 0) {
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;
    
    if (currentMenu === 'awaiting_avatar') {
      await handleAvatarUpload(chatId, telegramUser, tgUser, fileId);
      return;
    }
    
    if (currentMenu === 'awaiting_post_image') {
      await handlePostWithImage(chatId, telegramUser, tgUser, fileId, message.caption || '');
      return;
    }
    
    if (currentMenu === 'awaiting_story_image') {
      await handleStoryImageUpload(chatId, telegramUser, tgUser, fileId);
      return;
    }
  }
  
  // Handle text inputs
  if (!text) return;
  
  switch (currentMenu) {
    case 'awaiting_display_name':
      await handleDisplayNameUpdate(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_handle':
      await handleHandleUpdate(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_bio':
      await handleBioUpdate(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_country':
      await handleCountryUpdate(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_dob':
      await handleDobUpdate(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_post_content':
      await handleNewPost(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_story_text':
      await handleTextStory(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_convert_amount':
      await handleConvertNexa(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_send_recipient':
      await handleSendNexaRecipient(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_send_amount':
      await handleSendNexaAmount(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_acoin_recipient':
      await handleSendACoinRecipient(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_acoin_amount':
      await handleSendACoinAmount(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_gift_recipient':
      await handleGiftRecipient(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_red_envelope_amount':
      await handleRedEnvelopeAmount(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_red_envelope_count':
      await handleRedEnvelopeCount(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_link_code':
      await handleLinkCode(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_email':
      await handleRegistrationEmail(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_password':
      await handleRegistrationPassword(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_email_link':
      await handleEmailLink(chatId, telegramUser, tgUser, text);
      break;
      
    case 'awaiting_verification_code':
      await handleVerificationCode(chatId, telegramUser, tgUser, text);
      break;
      
    case 'admin_awaiting_user_search':
      await handleAdminUserSearch(chatId, telegramUser, tgUser, text);
      break;
      
    case 'admin_awaiting_nexa_amount':
      await handleAdminGiveNexa(chatId, telegramUser, tgUser, text);
      break;
      
    case 'admin_awaiting_acoin_amount':
      await handleAdminGiveACoin(chatId, telegramUser, tgUser, text);
      break;
      
    case 'admin_awaiting_broadcast':
      await handleAdminBroadcast(chatId, telegramUser, tgUser, text);
      break;
      
    default:
      await sendTelegramMessage(chatId, '🤖 Use /start or /menu to open the main menu!', {
        inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
  }
}

// ============================================
// INPUT HANDLERS
// ============================================

async function handleAvatarUpload(chatId: number, telegramUser: any, tgUser: any, fileId: string) {
  await sendTelegramMessage(chatId, '⏳ Uploading your new profile picture...');
  
  const avatarUrl = await uploadAvatarFromTelegram(fileId, tgUser.user_id);
  
  if (avatarUrl) {
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', tgUser.user_id);
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    
    const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
    const menu = buildEditProfileMenu(freshProfile);
    await sendTelegramMessage(chatId, '✅ Profile picture updated!\n\n' + menu.text, menu.reply_markup);
  } else {
    await sendTelegramMessage(chatId, '❌ Failed to upload image. Please try again.', {
      inline_keyboard: [[{ text: '📷 Try Again', callback_data: 'change_avatar' }], [{ text: '⬅️ Back', callback_data: 'edit_profile' }]]
    });
  }
}

async function handlePostWithImage(chatId: number, telegramUser: any, tgUser: any, fileId: string, caption: string) {
  await sendTelegramMessage(chatId, '⏳ Creating your post...');
  
  try {
    const fileInfo = await getFile(fileId);
    if (!fileInfo.ok || !fileInfo.result.file_path) throw new Error('Failed to get file');
    
    const fileData = await downloadFile(fileInfo.result.file_path);
    const ext = fileInfo.result.file_path.split('.').pop() || 'jpg';
    const filename = `${tgUser.user_id}/post_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('posts').upload(filename, fileData, { contentType: `image/${ext}` });
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filename);
    
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({ author_id: tgUser.user_id, content: caption || '📷', image_url: publicUrl })
      .select()
      .single();
    
    if (postError) throw postError;
    
    // Add to post_images
    await supabase.from('post_images').insert({ post_id: newPost.id, image_url: publicUrl, display_order: 0 });
    
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    
    await sendTelegramMessage(chatId, '✅ <b>Post created with image!</b>\n\nYour post is now live on AfuChat.', {
      inline_keyboard: [[{ text: '📰 View Feed', callback_data: 'menu_feed' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  } catch (error) {
    console.error('Post with image error:', error);
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, '❌ Failed to create post. Please try again.', {
      inline_keyboard: [[{ text: '📷 Try Again', callback_data: 'new_post_image' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  }
}

async function handleStoryImageUpload(chatId: number, telegramUser: any, tgUser: any, fileId: string) {
  await sendTelegramMessage(chatId, '⏳ Creating your story...');
  
  try {
    const fileInfo = await getFile(fileId);
    if (!fileInfo.ok || !fileInfo.result.file_path) throw new Error('Failed to get file');
    
    const fileData = await downloadFile(fileInfo.result.file_path);
    const ext = fileInfo.result.file_path.split('.').pop() || 'jpg';
    const filename = `${tgUser.user_id}/story_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('stories').upload(filename, fileData, { contentType: `image/${ext}` });
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(filename);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await supabase.from('stories').insert({
      user_id: tgUser.user_id,
      media_type: 'image',
      media_url: publicUrl,
      expires_at: expiresAt.toISOString()
    });
    
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    
    await sendTelegramMessage(chatId, '✅ <b>Story created!</b>\n\nYour story will be visible for 24 hours.', {
      inline_keyboard: [[{ text: '📱 View Stories', callback_data: 'menu_stories' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  } catch (error) {
    console.error('Story upload error:', error);
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, '❌ Failed to create story. Please try again.', {
      inline_keyboard: [[{ text: '📷 Try Again', callback_data: 'create_story' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  }
}

async function handleDisplayNameUpdate(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const newName = text.trim();
  
  if (newName.length < 1 || newName.length > 50) {
    await sendTelegramMessage(chatId, '❌ Name must be between 1 and 50 characters. Try again:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ display_name: newName }).eq('id', tgUser.user_id);
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
  const menu = buildEditProfileMenu(freshProfile);
  await sendTelegramMessage(chatId, `✅ Name updated to: <b>${newName}</b>\n\n` + menu.text, menu.reply_markup);
}

async function handleHandleUpdate(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const newHandle = text.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  if (newHandle.length < 3 || newHandle.length > 20) {
    await sendTelegramMessage(chatId, '❌ Username must be between 3 and 20 characters (letters, numbers, underscores only). Try again:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  // Check if handle is taken
  const { data: existingUser } = await supabase.from('profiles').select('id').eq('handle', newHandle).neq('id', tgUser.user_id).single();
  
  if (existingUser) {
    await sendTelegramMessage(chatId, '❌ This username is already taken. Please choose another:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ handle: newHandle }).eq('id', tgUser.user_id);
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
  const menu = buildEditProfileMenu(freshProfile);
  await sendTelegramMessage(chatId, `✅ Username updated to: @${newHandle}\n\n` + menu.text, menu.reply_markup);
}

async function handleBioUpdate(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const newBio = text.trim();
  
  if (newBio.length > 160) {
    await sendTelegramMessage(chatId, '❌ Bio must be 160 characters or less. Try again:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ bio: newBio }).eq('id', tgUser.user_id);
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
  const menu = buildEditProfileMenu(freshProfile);
  await sendTelegramMessage(chatId, '✅ Bio updated!\n\n' + menu.text, menu.reply_markup);
}

async function handleCountryUpdate(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const newCountry = text.trim();
  
  if (newCountry.length < 2 || newCountry.length > 100) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid country name:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ country: newCountry }).eq('id', tgUser.user_id);
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
  const menu = buildEditProfileMenu(freshProfile);
  await sendTelegramMessage(chatId, `✅ Country updated to: <b>${newCountry}</b>\n\n` + menu.text, menu.reply_markup);
}

async function handleDobUpdate(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const dobString = text.trim();
  const dobMatch = dobString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  
  if (!dobMatch) {
    await sendTelegramMessage(chatId, '❌ Invalid format. Please use YYYY-MM-DD (e.g., 1995-06-15):', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  const dob = new Date(dobString);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  
  if (age < 13 || age > 120) {
    await sendTelegramMessage(chatId, '❌ Invalid date of birth. You must be at least 13 years old.', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ date_of_birth: dobString }).eq('id', tgUser.user_id);
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
  const menu = buildEditProfileMenu(freshProfile);
  await sendTelegramMessage(chatId, `✅ Date of birth updated!\n\n` + menu.text, menu.reply_markup);
}

async function handleNewPost(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const { error } = await supabase.from('posts').insert({ author_id: tgUser.user_id, content: text.trim() });
  
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  if (error) {
    await sendTelegramMessage(chatId, '❌ Failed to create post. Please try again.', {
      inline_keyboard: [[{ text: '✍️ Try Again', callback_data: 'new_post' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  } else {
    await sendTelegramMessage(chatId, '✅ <b>Post created successfully!</b>\n\nYour post is now live on AfuChat.', {
      inline_keyboard: [[{ text: '📰 View Feed', callback_data: 'menu_feed' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  }
}

async function handleTextStory(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await supabase.from('stories').insert({
    user_id: tgUser.user_id,
    media_type: 'text',
    text_content: text.trim(),
    expires_at: expiresAt.toISOString()
  });
  
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, '✅ <b>Text story created!</b>\n\nYour story will be visible for 24 hours.', {
    inline_keyboard: [[{ text: '📱 View Stories', callback_data: 'menu_stories' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleConvertNexa(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid number:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  const { data: userProfile } = await supabase.from('profiles').select('xp, acoin').eq('id', tgUser.user_id).single();
  
  if (!userProfile || userProfile.xp < amount) {
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, `❌ Insufficient Nexa balance. You have ${userProfile?.xp?.toLocaleString() || 0} Nexa.`, {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  const { data: settings } = await supabase.from('currency_settings').select('nexa_to_acoin_rate, conversion_fee_percent').limit(1).single();
  
  const conversionRate = settings?.nexa_to_acoin_rate || 100;
  const feePercent = settings?.conversion_fee_percent || 5.99;
  
  const feeAmount = Math.ceil(amount * feePercent / 100);
  const nexaAfterFee = amount - feeAmount;
  const acoinReceived = Math.floor(nexaAfterFee / conversionRate);
  
  if (acoinReceived < 1) {
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, `❌ Conversion amount too small.`, {
      inline_keyboard: [[{ text: '💱 Try Again', callback_data: 'convert_nexa' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  const newNexa = userProfile.xp - amount;
  const newAcoin = (userProfile.acoin || 0) + acoinReceived;
  
  await supabase.from('profiles').update({ xp: newNexa, acoin: newAcoin }).eq('id', tgUser.user_id);
  await supabase.from('acoin_transactions').insert({
    user_id: tgUser.user_id,
    amount: acoinReceived,
    transaction_type: 'conversion',
    nexa_spent: amount,
    fee_charged: feeAmount
  });
  
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `✅ <b>Conversion Successful!</b>

Converted ${amount.toLocaleString()} Nexa to ${acoinReceived.toLocaleString()} ACoin
(Fee: ${feeAmount.toLocaleString()} Nexa)

<b>New Balances:</b>
⚡ Nexa: ${newNexa.toLocaleString()}
🪙 ACoin: ${newAcoin.toLocaleString()}`, {
    inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleSendNexaRecipient(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const recipientHandle = text.trim().replace('@', '').toLowerCase();
  
  const { data: recipient } = await supabase.from('profiles').select('id, display_name').ilike('handle', recipientHandle).single();
  
  if (!recipient) {
    await sendTelegramMessage(chatId, '❌ User not found. Please check the username:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  if (recipient.id === tgUser.user_id) {
    await sendTelegramMessage(chatId, '❌ You cannot send Nexa to yourself!', {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  await supabase.from('telegram_users').update({
    current_menu: 'awaiting_send_amount',
    menu_data: { recipient_id: recipient.id, recipient_name: recipient.display_name }
  }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `📤 Sending to: <b>${recipient.display_name}</b>\n\nEnter the amount of Nexa to send:`, {
    inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
  });
}

async function handleSendNexaAmount(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  const recipientId = tgUser.menu_data?.recipient_id;
  const recipientName = tgUser.menu_data?.recipient_name;
  
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid amount:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  const { data: senderProfile } = await supabase.from('profiles').select('xp').eq('id', tgUser.user_id).single();
  
  if (!senderProfile || senderProfile.xp < amount) {
    await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, `❌ Insufficient Nexa balance.`, {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  const { data: receiverProfile } = await supabase.from('profiles').select('xp').eq('id', recipientId).single();
  
  await supabase.from('profiles').update({ xp: senderProfile.xp - amount }).eq('id', tgUser.user_id);
  await supabase.from('profiles').update({ xp: (receiverProfile?.xp || 0) + amount }).eq('id', recipientId);
  await supabase.from('tips').insert({ sender_id: tgUser.user_id, receiver_id: recipientId, xp_amount: amount });
  
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `✅ <b>Transfer Successful!</b>\n\nYou sent ${amount.toLocaleString()} Nexa to ${recipientName}!`, {
    inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleSendACoinRecipient(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const recipientHandle = text.trim().replace('@', '').toLowerCase();
  
  const { data: recipient } = await supabase.from('profiles').select('id, display_name').ilike('handle', recipientHandle).single();
  
  if (!recipient) {
    await sendTelegramMessage(chatId, '❌ User not found.', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  if (recipient.id === tgUser.user_id) {
    await sendTelegramMessage(chatId, '❌ You cannot send ACoin to yourself!', {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  await supabase.from('telegram_users').update({
    current_menu: 'awaiting_acoin_amount',
    menu_data: { recipient_id: recipient.id, recipient_name: recipient.display_name }
  }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `📤 Sending to: <b>${recipient.display_name}</b>\n\nEnter the amount of ACoin to send:`, {
    inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
  });
}

async function handleSendACoinAmount(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  const recipientId = tgUser.menu_data?.recipient_id;
  const recipientName = tgUser.menu_data?.recipient_name;
  
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid amount:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  const { data: senderProfile } = await supabase.from('profiles').select('acoin').eq('id', tgUser.user_id).single();
  
  if (!senderProfile || (senderProfile.acoin || 0) < amount) {
    await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, `❌ Insufficient ACoin balance.`, {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  const { data: receiverProfile } = await supabase.from('profiles').select('acoin').eq('id', recipientId).single();
  
  await supabase.from('profiles').update({ acoin: (senderProfile.acoin || 0) - amount }).eq('id', tgUser.user_id);
  await supabase.from('profiles').update({ acoin: (receiverProfile?.acoin || 0) + amount }).eq('id', recipientId);
  
  await supabase.from('acoin_transactions').insert({ user_id: tgUser.user_id, amount: -amount, transaction_type: 'p2p_send' });
  await supabase.from('acoin_transactions').insert({ user_id: recipientId, amount: amount, transaction_type: 'p2p_receive' });
  
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `✅ <b>Transfer Successful!</b>\n\nYou sent ${amount.toLocaleString()} ACoin to ${recipientName}!`, {
    inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleGiftRecipient(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const recipientHandle = text.trim().replace('@', '').toLowerCase();
  const giftId = tgUser.menu_data?.gift_id;
  
  const { data: recipient } = await supabase.from('profiles').select('id, display_name').ilike('handle', recipientHandle).single();
  
  if (!recipient) {
    await sendTelegramMessage(chatId, '❌ User not found.', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'browse_gifts' }]]
    });
    return;
  }
  
  if (recipient.id === tgUser.user_id) {
    await sendTelegramMessage(chatId, '❌ You cannot send a gift to yourself!', {
      inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'browse_gifts' }]]
    });
    return;
  }
  
  const { data: gift } = await supabase.from('gifts').select('base_xp_cost, name').eq('id', giftId).single();
  const { data: giftStats } = await supabase.from('gift_statistics').select('price_multiplier').eq('gift_id', giftId).single();
  
  const giftPrice = Math.ceil((gift?.base_xp_cost || 0) * (giftStats?.price_multiplier || 1));
  
  const { data: senderProfile } = await supabase.from('profiles').select('xp').eq('id', tgUser.user_id).single();
  
  if (!senderProfile || senderProfile.xp < giftPrice) {
    await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, `❌ Insufficient Nexa. This gift costs ${giftPrice.toLocaleString()} Nexa.`, {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  await supabase.from('profiles').update({ xp: senderProfile.xp - giftPrice }).eq('id', tgUser.user_id);
  await supabase.from('gift_transactions').insert({ gift_id: giftId, sender_id: tgUser.user_id, receiver_id: recipient.id, xp_cost: giftPrice });
  await supabase.from('gift_statistics').upsert({
    gift_id: giftId,
    total_sent: (giftStats?.price_multiplier ? 1 : 0) + 1,
    price_multiplier: Math.min((giftStats?.price_multiplier || 1) + 0.01, 3.00),
    last_updated: new Date().toISOString()
  }, { onConflict: 'gift_id' });
  
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `🎉 <b>Gift Sent!</b>\n\nYou sent "${gift?.name}" to ${recipient.display_name}!`, {
    inline_keyboard: [[{ text: '🎁 Send More', callback_data: 'browse_gifts' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleRedEnvelopeAmount(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  
  if (isNaN(amount) || amount < 100) {
    await sendTelegramMessage(chatId, '❌ Minimum amount is 100 Nexa:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_red_envelopes' }]]
    });
    return;
  }
  
  const { data: userProfile } = await supabase.from('profiles').select('xp').eq('id', tgUser.user_id).single();
  
  if (!userProfile || userProfile.xp < amount) {
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, '❌ Insufficient Nexa balance.', {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  await supabase.from('telegram_users').update({
    current_menu: 'awaiting_red_envelope_count',
    menu_data: { envelope_amount: amount }
  }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, '🧧 How many people can claim this envelope? (1-100):', {
    inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_red_envelopes' }]]
  });
}

async function handleRedEnvelopeCount(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const count = parseInt(text.trim());
  const amount = tgUser.menu_data?.envelope_amount;
  
  if (isNaN(count) || count < 1 || count > 100) {
    await sendTelegramMessage(chatId, '❌ Please enter a number between 1 and 100:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_red_envelopes' }]]
    });
    return;
  }
  
  const { data: userProfile } = await supabase.from('profiles').select('xp').eq('id', tgUser.user_id).single();
  
  if (!userProfile || userProfile.xp < amount) {
    await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
    await sendTelegramMessage(chatId, '❌ Insufficient balance.', {
      inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }]]
    });
    return;
  }
  
  // Deduct from user
  await supabase.from('profiles').update({ xp: userProfile.xp - amount }).eq('id', tgUser.user_id);
  
  // Create red envelope
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const { data: envelope } = await supabase.from('red_envelopes').insert({
    sender_id: tgUser.user_id,
    total_amount: amount,
    remaining_amount: amount,
    total_count: count,
    remaining_count: count,
    expires_at: expiresAt.toISOString()
  }).select().single();
  
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  await sendTelegramMessage(chatId, `🧧 <b>Red Envelope Created!</b>

Amount: ${amount.toLocaleString()} Nexa
Can claim: ${count} people
Expires: 24 hours

Share this link:
https://afuchat.com/red-envelope/${envelope?.id}`, {
    inline_keyboard: [[{ text: '🧧 Create Another', callback_data: 'create_red_envelope' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
  });
}

async function handleLinkCode(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const { data: linkUser } = await supabase
    .from('telegram_users')
    .select('*')
    .eq('link_token', text.trim().toUpperCase())
    .gt('link_token_expires_at', new Date().toISOString())
    .single();
  
  if (linkUser && linkUser.user_id) {
    if (linkUser.telegram_id !== telegramUser.id) {
      await supabase.from('telegram_users').delete().eq('telegram_id', telegramUser.id);
    }
    
    await supabase.from('telegram_users').update({
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username,
      telegram_first_name: telegramUser.first_name,
      telegram_last_name: telegramUser.last_name,
      is_linked: true,
      link_token: null,
      link_token_expires_at: null,
      current_menu: 'main'
    }).eq('id', linkUser.id);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', linkUser.user_id).single();
    const isAdminUser = await isAdmin(linkUser.user_id);
    const menu = buildMainMenu(true, profile, isAdminUser);
    await sendTelegramMessage(chatId, `✅ Account linked successfully!\n\nWelcome, ${profile?.display_name}!\n\n` + menu.text, menu.reply_markup);
  } else {
    await sendTelegramMessage(chatId, '❌ Invalid or expired link code.', {
      inline_keyboard: [[{ text: '🔗 Try Again', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
  }
}

async function handleRegistrationEmail(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const email = text.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    await sendTelegramMessage(chatId, '❌ Invalid email format:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  await supabase.from('telegram_users').update({ current_menu: 'awaiting_password', menu_data: { email } }).eq('telegram_id', telegramUser.id);
  await sendTelegramMessage(chatId, '🔐 Great! Now enter a password (min 6 characters):', {
    inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
  });
}

async function handleRegistrationPassword(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const password = text.trim();
  
  if (password.length < 6) {
    await sendTelegramMessage(chatId, '❌ Password must be at least 6 characters:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
    });
    return;
  }
  
  const email = tgUser.menu_data?.email;
  const displayName = telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '');
  const handle = telegramUser.username || `user_${telegramUser.id}`;
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, handle }
  });
  
  if (authError || !authData.user) {
    await sendTelegramMessage(chatId, `❌ Registration failed: ${authError?.message || 'Unknown error'}`, {
      inline_keyboard: [[{ text: '📝 Try Again', callback_data: 'create_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
    return;
  }
  
  await supabase.from('telegram_users').update({ user_id: authData.user.id, is_linked: true, current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
  const menu = buildMainMenu(true, profile, false);
  
  await sendTelegramMessage(chatId, `🎉 <b>Account Created Successfully!</b>

Welcome to AfuChat, ${displayName}!

You can now log in at afuchat.com with:
📧 ${email}

` + menu.text, menu.reply_markup);
}

async function handleEmailLink(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const email = text.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    await sendTelegramMessage(chatId, '❌ Invalid email format. Please enter a valid email address:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
    });
    return;
  }
  
  await sendTelegramMessage(chatId, '⏳ Sending verification code to your email...');
  
  // Call the verification edge function to send the code
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-telegram-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: email,
        telegramChatId: String(chatId)
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      await sendTelegramMessage(chatId, `❌ ${result.error}`, {
        inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'link_via_email' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
      await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
      return;
    }
    
    // Store email and update state to wait for verification code
    await supabase.from('telegram_users').update({ 
      current_menu: 'awaiting_verification_code', 
      menu_data: { email, telegram_chat_id: String(chatId) } 
    }).eq('telegram_id', telegramUser.id);
    
    await sendTelegramMessage(chatId, `📧 <b>Verification Code Sent!</b>

A 6-digit verification code has been sent to:
<b>${email}</b>

Please check your email (and spam folder) and enter the code below.

⏱️ <i>The code expires in 10 minutes.</i>

⚠️ <b>Security Notice:</b> Never share this code with anyone. AfuChat staff will never ask for your verification code.`, {
      inline_keyboard: [[{ text: '📧 Resend Code', callback_data: 'resend_verification' }], [{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
    });
    
  } catch (error: any) {
    console.error('Error sending verification:', error);
    await sendTelegramMessage(chatId, '❌ Failed to send verification code. Please try again later.', {
      inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'link_via_email' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
    });
    await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  }
}

async function handleVerificationCode(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const code = text.trim();
  
  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    await sendTelegramMessage(chatId, '❌ Invalid code format. Please enter the 6-digit code from your email:', {
      inline_keyboard: [[{ text: '📧 Resend Code', callback_data: 'resend_verification' }], [{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
    });
    return;
  }
  
  await sendTelegramMessage(chatId, '⏳ Verifying code...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-telegram-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        telegramChatId: String(chatId),
        verificationCode: code
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      await sendTelegramMessage(chatId, `❌ ${result.error || 'Verification failed'}

Please try again:`, {
        inline_keyboard: [[{ text: '📧 Resend Code', callback_data: 'resend_verification' }], [{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
      });
      return;
    }
    
    // Successfully verified - update telegram_users to link the account
    await supabase.from('telegram_users').update({ 
      user_id: result.user.id, 
      is_linked: true, 
      current_menu: 'main',
      menu_data: {}
    }).eq('telegram_id', telegramUser.id);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', result.user.id).single();
    const isAdminUser = await isAdmin(result.user.id);
    const menu = buildMainMenu(true, profile, isAdminUser);
    
    await sendTelegramMessage(chatId, `✅ <b>Account Linked Successfully!</b>

🎉 Welcome, ${profile?.display_name || 'there'}!

Your AfuChat account is now securely linked to this Telegram.

` + menu.text, menu.reply_markup);
    
  } catch (error: any) {
    console.error('Error verifying code:', error);
    await sendTelegramMessage(chatId, '❌ Verification failed. Please try again.', {
      inline_keyboard: [[{ text: '📧 Resend Code', callback_data: 'resend_verification' }], [{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
    });
  }
}

async function handleAdminUserSearch(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const searchTerm = text.trim().toLowerCase();
  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name, handle, xp, is_verified')
    .or(`handle.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .limit(10);
  
  if (!users || users.length === 0) {
    await sendTelegramMessage(chatId, '❌ No users found.', {
      inline_keyboard: [[{ text: '🔍 Search Again', callback_data: 'admin_search_user' }], [{ text: '⬅️ Back', callback_data: 'admin_users' }]]
    });
  } else {
    let resultText = `🔍 <b>Search Results</b>\n\nFound ${users.length} user(s):\n\n`;
    users.forEach((u: any, i: number) => {
      const verified = u.is_verified ? '✅' : '';
      resultText += `${i + 1}. <b>${u.display_name}</b> ${verified}\n   @${u.handle} | ${u.xp} Nexa\n\n`;
    });
    
    const buttons = users.map((u: any) => ([{ text: `👤 ${u.display_name}`, callback_data: `admin_user_${u.id}` }]));
    buttons.push([{ text: '🔍 Search Again', callback_data: 'admin_search_user' }]);
    buttons.push([{ text: '⬅️ Back', callback_data: 'admin_users' }]);
    
    await sendTelegramMessage(chatId, resultText, { inline_keyboard: buttons });
  }
  
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
}

async function handleAdminGiveNexa(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  const targetUserId = tgUser.menu_data?.target_user_id;
  
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid positive number:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
    });
    return;
  }
  
  const { data: currentProfile } = await supabase.from('profiles').select('xp').eq('id', targetUserId).single();
  await supabase.from('profiles').update({ xp: (currentProfile?.xp || 0) + amount }).eq('id', targetUserId);
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  const menu = await buildAdminUserDetailMenu(targetUserId);
  await sendTelegramMessage(chatId, `✅ Added ${amount} Nexa to user!\n\n` + menu.text, menu.reply_markup);
}

async function handleAdminGiveACoin(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const amount = parseInt(text.trim());
  const targetUserId = tgUser.menu_data?.target_user_id;
  
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(chatId, '❌ Please enter a valid positive number:', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
    });
    return;
  }
  
  const { data: currentProfile } = await supabase.from('profiles').select('acoin').eq('id', targetUserId).single();
  await supabase.from('profiles').update({ acoin: (currentProfile?.acoin || 0) + amount }).eq('id', targetUserId);
  await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
  
  const menu = await buildAdminUserDetailMenu(targetUserId);
  await sendTelegramMessage(chatId, `✅ Added ${amount} ACoin to user!\n\n` + menu.text, menu.reply_markup);
}

async function handleAdminBroadcast(chatId: number, telegramUser: any, tgUser: any, text: string) {
  const message = text.trim();
  
  if (message.length < 1) {
    await sendTelegramMessage(chatId, '❌ Message cannot be empty.', {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'admin_menu' }]]
    });
    return;
  }
  
  // Get all linked telegram users
  const { data: telegramUsers } = await supabase
    .from('telegram_users')
    .select('telegram_id')
    .eq('is_linked', true);
  
  const totalUsers = telegramUsers?.length || 0;
  let sentCount = 0;
  
  await sendTelegramMessage(chatId, `📢 Broadcasting to ${totalUsers} users...`);
  
  for (const user of (telegramUsers || [])) {
    try {
      await sendTelegramMessage(user.telegram_id, `📢 <b>Announcement from AfuChat</b>\n\n${message}`);
      sentCount++;
    } catch (error) {
      console.error('Broadcast error for user:', user.telegram_id, error);
    }
  }
  
  await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
  
  const menu = buildAdminMenu();
  await sendTelegramMessage(chatId, `✅ Broadcast complete!\n\nSent to ${sentCount}/${totalUsers} users.\n\n` + menu.text, menu.reply_markup);
}

// ============================================
// SERVER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Telegram update:', JSON.stringify(update));
    
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing Telegram update:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
