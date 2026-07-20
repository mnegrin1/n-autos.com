require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const newConv = {
    id: `conv-wa-${Date.now()}`,
    agency_id: "00000000-0000-0000-0000-000000000000",
    lead_name: "Cliente Prueba",
    lead_avatar: "WA",
    channel: "whatsapp",
    last_message: "Prueba desde Node",
    last_message_time: new Date().toISOString(),
    unread: true,
    messages: [{
      id: `msg-${Date.now()}`,
      sender: 'lead',
      text: "Prueba desde Node",
      time: new Date().toISOString(),
      status: 'read'
    }],
    channel_sender_id: "123456789"
  };

  console.log("Intentando insertar en Supabase...");
  const { data, error } = await supabase.from("inbox_conversations").insert(newConv).select();
  
  if (error) {
    console.error("❌ ERROR AL INSERTAR:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ INSERTADO CORRECTAMENTE:", data);
  }
}

testInsert();
