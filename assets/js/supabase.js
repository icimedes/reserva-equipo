(function(){
  const SUPABASE_URL = "https://xwwnkhfhrcezvanywxec.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_6vgXwVL3yYDLnHfSw-TtKQ_cvRcs7tQ";

  if (!window.supabase || !window.supabase.createClient){
    console.error("Supabase JS no se cargo. Verifique el CDN.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
})();
