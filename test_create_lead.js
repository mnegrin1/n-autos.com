const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://joadvlatdeyamtspvruu.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYWR2bGF0ZGV5YW10c3B2cnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzc5MDQsImV4cCI6MjA5OTg1MzkwNH0.ZLFeBWKReUnDL6HLp0EUbmZ2Exxqs_3Bkx_7rxwenUg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const newLead = {
    id: crypto.randomUUID(),
    agency_id: "00000000-0000-0000-0000-000000000000",
    name: "Test Contact",
    email: "test@test.com",
    phone: "12345",
    vehicle: "Sin vehículo",
    vehicle_id: null,
    message: "Test msg",
    status: "nuevo",
    tags: ["Test"],
    time: "Ahora",
    assigned_agent_id: null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('auto_leads').insert([newLead]);
  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert();
