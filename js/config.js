const supabaseUrl = "https://udlkhxpgggozadbomxmk.supabase.co";
const supabaseAnonKey = "sb_publishable_1m9C5XBIjT57Cpg7XPiq9g_vWPq092-";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
window.supabaseClient = supabaseClient;

// ======================
// Telegram
// ======================

// BOT ADMIN
const TELEGRAM_ADMIN_BOT_TOKEN = "8645081171:AAHLzhGoCwGgtsl_fTINvlP8bj1hhJV58I0";
const TELEGRAM_ADMIN_CHAT_ID = "8568913499";

// BOT COMPRADOR
const TELEGRAM_BUYER_BOT_TOKEN = "8505982790:AAGHA5JGaNLaB4BLsU2VnWX8brJSgKmddAo";
const TELEGRAM_BUYER_CHAT_ID = "8568913499";