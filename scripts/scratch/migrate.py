import re
import sys

with open("src/actions/autoActions.ts", "r") as f:
    content = f.read()

# Remove import
content = re.sub(r'import\s+{\s*getDb,\s*saveDb\s*}\s*from\s*"@/lib/localDb";\n', '', content)

# getVehicles
content = re.sub(
    r'export async function getVehicles\(agencyId: string\) \{.*?return db\.vehicles\.filter.*?;?\s*\}',
    '''export async function getVehicles(agencyId: string) {
  const { data, error } = await (supabase.from('vehicles') as any).select('*').eq('agency_id', agencyId);
  if (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
  return data || [];
}''', content, flags=re.DOTALL)

# getVehicleById
content = re.sub(
    r'export async function getVehicleById\(vehicleId: string\) \{.*?return db\.vehicles\.find.*?;?\s*\}',
    '''export async function getVehicleById(vehicleId: string) {
  const { data, error } = await (supabase.from('vehicles') as any).select('*').eq('id', vehicleId).single();
  if (error) {
    console.error("Error fetching vehicle by id:", error);
    return null;
  }
  return data;
}''', content, flags=re.DOTALL)

# createVehicle
content = re.sub(
    r'const db = getDb\(\);\s*if \(\!db\.vehicles\) db\.vehicles = \[\];\s*const newVehicle = \{.*?\};\s*db\.vehicles\.unshift\(newVehicle\);\s*saveDb\(db\);',
    '''const newVehicle = {
    agency_id: "demo-agency-id",
    ...validated,
    images: finalImages.length > 0 ? finalImages : ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"],
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
  };

  const { data, error } = await (supabase.from('vehicles') as any).insert([newVehicle]).select().single();
  if (error) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: "Failed to create vehicle" };
  }
  const createdVehicle = data;''', content, flags=re.DOTALL)
content = re.sub(r'id: `veh-\$\{Date.now\(\)\}`,?\n\s*', '', content)
content = re.sub(r'created_at: new Date\(\)\.toISOString\(\),?\n\s*', '', content)
# Fix data return in createVehicle
content = content.replace('return { success: true, data: newVehicle };', 'return { success: true, data: createdVehicle || newVehicle };')

# updateVehicle
content = re.sub(
    r'const db = getDb\(\);.*?const existingVehicle = db\.vehicles\.find\(\(v: any\) => v\.id === vehicleId\);',
    '''const { data: existingVehicle, error: fetchError } = await (supabase.from('vehicles') as any).select('*').eq('id', vehicleId).single();
  if (fetchError || !existingVehicle) {
    return { success: false, error: "Vehículo no encontrado" };
  }''', content, flags=re.DOTALL)

content = re.sub(
    r'const index = db\.vehicles\.findIndex\(\(v: any\) => v\.id === vehicleId\);\s*db\.vehicles\[index\] = \{.*?\};\s*saveDb\(db\);',
    '''const updatePayload = {
    ...validated,
    images: finalImages,
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
  };

  const { data: updatedVehicle, error: updateError } = await (supabase.from('vehicles') as any)
    .update(updatePayload)
    .eq('id', vehicleId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating vehicle:", updateError);
    return { success: false, error: "Failed to update vehicle" };
  }''', content, flags=re.DOTALL)
content = content.replace('return { success: true, data: db.vehicles[index] };', 'return { success: true, data: updatedVehicle };')

# deleteVehicle
content = re.sub(
    r'export async function deleteVehicle\(vehicleId: string\) \{.*?saveDb\(db\);',
    '''export async function deleteVehicle(vehicleId: string) {
  const { error } = await (supabase.from('vehicles') as any).delete().eq('id', vehicleId);
  if (error) {
    return { success: false, error: "Vehículo no encontrado o no se pudo eliminar" };
  }''', content, flags=re.DOTALL)

# getAutoLeads
content = re.sub(
    r'export async function getAutoLeads\(agencyId: string\) \{.*?return db\.auto_leads\.filter.*?;?\s*\}',
    '''export async function getAutoLeads(agencyId: string) {
  const { data, error } = await (supabase.from('auto_leads') as any).select('*').eq('agency_id', agencyId);
  if (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
  return data || [];
}''', content, flags=re.DOTALL)

# createAutoLead
content = re.sub(
    r'const db = getDb\(\);\s*if \(\!db\.auto_leads\) db\.auto_leads = \[\];\s*const newLead = \{.*?\};\s*db\.auto_leads\.push\(newLead\);\s*saveDb\(db\);',
    '''const newLead = {
    agency_id: "demo-agency-id",
    name: lead.name,
    email: lead.email || "",
    phone: lead.phone || "",
    vehicle: lead.vehicle,
    vehicle_id: lead.vehicleId,
    message: lead.message || "Interesado en vehículo.",
    status: "nuevo",
    time: "Ahora",
    assigned_agent_id: "agent-1" // default assign
  };

  const { data, error } = await (supabase.from('auto_leads') as any).insert([newLead]).select().single();
  if (error) {
    console.error("Error creating auto lead:", error);
    return { success: false, error: "Error creating lead" };
  }
  const createdLead = data;''', content, flags=re.DOTALL)
content = content.replace('return { success: true, data: newLead };', 'return { success: true, data: createdLead || newLead };')
content = re.sub(r'id: `alead-\$\{Date.now\(\)\}`,?\n\s*', '', content)

# updateAutoLeadStatus
content = re.sub(
    r'export async function updateAutoLeadStatus\(leadId: string, status: string\) \{.*?saveDb\(db\);',
    '''export async function updateAutoLeadStatus(leadId: string, status: string) {
  const { data, error } = await (supabase.from('auto_leads') as any)
    .update({ status })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Lead no encontrado" };
  }''', content, flags=re.DOTALL)
content = content.replace('return { success: true, data: db.auto_leads[index] };', 'return { success: true, data };')

# deleteAutoLead
content = re.sub(
    r'export async function deleteAutoLead\(leadId: string\) \{.*?saveDb\(db\);',
    '''export async function deleteAutoLead(leadId: string) {
  const { error } = await (supabase.from('auto_leads') as any).delete().eq('id', leadId);
  if (error) {
    return { success: false, error: "Lead no encontrado" };
  }''', content, flags=re.DOTALL)

# getAutoStats
content = re.sub(
    r'export async function getAutoStats\(agencyId: string\) \{.*?(const agencyVehicles =.*?)\s*const stockCount',
    '''export async function getAutoStats(agencyId: string) {
  const { data: agencyVehicles } = await (supabase.from('vehicles') as any).select('status').eq('agency_id', agencyId);
  const { data: agencyLeads } = await (supabase.from('auto_leads') as any).select('status').eq('agency_id', agencyId);
  
  const vehiclesList = agencyVehicles || [];
  const leadsList = agencyLeads || [];
  
  const stockCount = vehiclesList.filter((v: any) => v.status === "disponible").length;
  const reservedCount = vehiclesList.filter((v: any) => v.status === "reservado").length;
  const soldCount = vehiclesList.filter((v: any) => v.status === "vendido").length;

  const totalLeads = leadsList.length;
  const newLeads = leadsList.filter((l: any) => l.status === "nuevo").length;
  const contactLeads = leadsList.filter((l: any) => l.status === "contactado").length;
  const testDriveLeads = leadsList.filter((l: any) => l.status === "test_drive").length;
  const negotiationLeads = leadsList.filter((l: any) => l.status === "negociacion").length;
  const closedLeads = leadsList.filter((l: any) => l.status === "cerrado").length;

  return {
    vehicles: {
      total: vehiclesList.length,
      disponible: stockCount,
      reservado: reservedCount,
      vendido: soldCount
    },
    leads: {
      total: totalLeads,
      nuevo: newLeads,
      contactado: contactLeads,
      test_drive: testDriveLeads,
      negociacion: negotiationLeads,
      cerrado: closedLeads
    }
  };
}
function dummy() {''', content, flags=re.DOTALL)
content = re.sub(r'function dummy\(\) \{.*?return \{\n\s*vehicles', 'return {\n    vehicles', content, flags=re.DOTALL)

# Fix syncMercadoLibreListings vehicle sync
content = re.sub(
    r'const db = getDb\(\);\s*if \(\!db\.vehicles\) db\.vehicles = \[\];\s*const getAttr =',
    'const getAttr =', content, flags=re.DOTALL
)
content = re.sub(
    r'db\.vehicles\.push\(matchingVehicle\);\s*saveDb\(db\);',
    '''delete (matchingVehicle as any).id;
            const { data, error } = await (supabase.from('vehicles') as any).insert([matchingVehicle]).select().single();
            if (!error && data) {
              matchingVehicle = data;
            }''', content, flags=re.DOTALL
)

# Fix inbox_conversations
content = re.sub(
    r'const db = getDb\(\);\s*let conversations = \[\.\.\.\(db\.inbox_conversations \|\| \[\]\)\];',
    '''const { data: dbConvs } = await (supabase.from('inbox_conversations') as any).select('*');
  let conversations = dbConvs || [];''', content, flags=re.DOTALL
)

content = re.sub(
    r'const db = getDb\(\);\s*if \(\!db\.inbox_conversations\) db\.inbox_conversations = \[\];\s*const conversation = db\.inbox_conversations\.find\(\(c: any\) => c\.id === conversationId\);\s*if \(\!conversation\) \{',
    '''const { data: conversation, error: fetchErr } = await (supabase.from('inbox_conversations') as any).select('*').eq('id', conversationId).single();
  if (fetchErr || !conversation) {''', content, flags=re.DOTALL
)

content = re.sub(
    r'conversation\.messages\.push\(newMsg\);\s*conversation\.last_message = text;\s*conversation\.last_message_time = timeStr;\s*conversation\.unread = false;\s*saveDb\(db\);',
    '''const newMessages = [...(conversation.messages || []), newMsg];
  const { data: updatedConv, error: updateErr } = await (supabase.from('inbox_conversations') as any)
    .update({ messages: newMessages, last_message: text, last_message_time: timeStr, unread: false })
    .eq('id', conversationId)
    .select()
    .single();
  if (updateErr) {
    console.error("Error updating conversation:", updateErr);
  } else {
    conversation.messages = updatedConv.messages;
    conversation.last_message = updatedConv.last_message;
    conversation.last_message_time = updatedConv.last_message_time;
    conversation.unread = updatedConv.unread;
  }''', content, flags=re.DOTALL
)

content = re.sub(
    r'conversation\.messages\.push\(newMsg\);\s*conversation\.last_message = replyText;\s*conversation\.last_message_time = timeStr;\s*conversation\.unread = true;\s*saveDb\(db\);',
    '''const newMessages = [...(conversation.messages || []), newMsg];
  const { data: updatedConv, error: updateErr } = await (supabase.from('inbox_conversations') as any)
    .update({ messages: newMessages, last_message: replyText, last_message_time: timeStr, unread: true })
    .eq('id', conversationId)
    .select()
    .single();
  if (!updateErr && updatedConv) {
    conversation.messages = updatedConv.messages;
    conversation.last_message = updatedConv.last_message;
    conversation.last_message_time = updatedConv.last_message_time;
    conversation.unread = updatedConv.unread;
  }''', content, flags=re.DOTALL
)

content = re.sub(
    r'conversation\.unread = false;\s*saveDb\(db\);',
    '''await (supabase.from('inbox_conversations') as any).update({ unread: false }).eq('id', conversationId);''', content, flags=re.DOTALL
)

content = re.sub(
    r'conversation\.notes = notes;\s*saveDb\(db\);',
    '''await (supabase.from('inbox_conversations') as any).update({ notes }).eq('id', conversationId);''', content, flags=re.DOTALL
)

# Fix importSocialPost
content = re.sub(
    r'const db = getDb\(\);\s*if \(\!db\.vehicles\) db\.vehicles = \[\];',
    '', content, flags=re.DOTALL
)
content = re.sub(
    r'db\.vehicles\.push\(newVehicle\);\s*saveDb\(db\);',
    '''delete (newVehicle as any).id;
  const { data: createdVehicle, error: vError } = await (supabase.from('vehicles') as any).insert([newVehicle]).select().single();
  if (vError || !createdVehicle) {
    console.error("Error creating vehicle:", vError);
    return { success: false, error: "Failed to create vehicle" };
  }
  newVehicle.id = createdVehicle.id;''', content, flags=re.DOTALL
)


with open("src/actions/autoActions.ts", "w") as f:
    f.write(content)
