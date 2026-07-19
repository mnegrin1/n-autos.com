import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno (intentar varias ubicaciones)
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.dev.vars') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ ERROR: Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Asegúrate de agregar SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local para ejecutar este script.");
  process.exit(1);
}

// Inicializar Supabase con Service Role Key (permite saltar RLS y usar la API de Admin)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSuperadmin() {
  console.log("Iniciando configuración del Superadmin...");

  // 1. Crear Organización "Test-Automotora"
  console.log("1. Buscando o creando organización 'Test-Automotora'...");
  let agencyId;
  const { data: existingAgency } = await supabase
    .from('agencies')
    .select('id')
    .eq('subdomain', 'testauto')
    .single();

  if (existingAgency) {
    console.log("✅ Organización existente encontrada con ID:", existingAgency.id);
    agencyId = existingAgency.id;
  } else {
    const { data: newAgency, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        name: 'Test-Automotora',
        subdomain: 'testauto',
        primary_color: '#ef4444',
        secondary_color: '#991b1b'
      })
      .select('id')
      .single();

    if (agencyError) {
      console.error("❌ Error creando organización:", agencyError);
      process.exit(1);
    }
    console.log("✅ Organización creada exitosamente con ID:", newAgency.id);
    agencyId = newAgency.id;
  }

  // 2. Crear usuario mauricio@automotora.com en auth.users
  console.log("2. Buscando o creando usuario en auth.users...");
  const email = "mauricio@automotora.com";
  const password = "admin";
  let authUserId;

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  const existingUser = usersData?.users.find(u => u.email === email);

  if (existingUser) {
    console.log("✅ Usuario existente encontrado en Auth con ID:", existingUser.id);
    authUserId = existingUser.id;
    // Opcional: Actualizar contraseña si es necesario
    await supabase.auth.admin.updateUserById(authUserId, { password: password });
    console.log("✅ Contraseña actualizada a 'admin'.");
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      console.error("❌ Error creando usuario de autenticación:", authError);
      process.exit(1);
    }
    console.log("✅ Usuario de autenticación creado con ID:", authData.user.id);
    authUserId = authData.user.id;
  }

  // 3. Vincular el usuario a la organización en la tabla public.users
  console.log("3. Vinculando usuario a la organización en public.users...");
  const { data: existingPublicUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUserId)
    .single();

  if (existingPublicUser) {
    console.log("✅ El usuario ya está vinculado en la base pública.");
  } else {
    const { error: publicUserError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        agency_id: agencyId,
        name: "Mauricio Negrin",
        email: email,
        role: "admin" // Este es el rol dentro de la agencia
      });

    if (publicUserError) {
      console.error("❌ Error vinculando usuario en public.users:", publicUserError);
      process.exit(1);
    }
    console.log("✅ Usuario vinculado exitosamente.");
  }

  console.log("🎉 Configuración de entorno Superadmin completada con éxito.");
  console.log(`
  Credenciales para probar:
  Email: ${email}
  Contraseña: ${password}
  Organización: Test-Automotora
  `);
}

setupSuperadmin();
