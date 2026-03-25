import { supabase } from './supabase';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * TAILOR PROFILES
 * ══════════════════════════════════════════════════════════════════════════
 */

// Fetch all tailor profiles along with their earned / paid totals for calculation
export async function getTailorProfiles() {
  const { data, error } = await supabase
    .from('tailor_profiles')
    .select(`
      id,
      name,
      phone,
      price_config,
      tailor_work_logs ( total_amount ),
      tailor_payments ( amount_paid )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('getTailorProfiles error:', error.message);
    return [];
  }

  // Calculate totals client-side since RPC or view isn't provided here
  return data.map(tailor => {
    const total_earned = tailor.tailor_work_logs?.reduce((acc, log) => acc + (Number(log.total_amount) || 0), 0) || 0;
    const total_paid = tailor.tailor_payments?.reduce((acc, pmt) => acc + (Number(pmt.amount_paid) || 0), 0) || 0;
    const balance = total_earned - total_paid;

    return {
      id: tailor.id,
      name: tailor.name,
      phone: tailor.phone,
      priceConfig: tailor.price_config || {},
      totalEarned: total_earned,
      totalPaid: total_paid,
      balance: balance
    };
  });
}

// Get a single tailor
export async function getTailorProfile(id) {
  const { data, error } = await supabase
    .from('tailor_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('getTailorProfile error:', error.message);
    return null;
  }
  return {
    ...data,
    priceConfig: data.price_config || {}
  };
}

export async function addTailorProfile(name, phone) {
  const { data, error } = await supabase
    .from('tailor_profiles')
    .insert([{ name: name.trim(), phone: (phone || '').trim() }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTailorPriceConfig(id, priceConfig, name, phone) {
  const updateData = { price_config: priceConfig };
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone.trim();

  const { data, error } = await supabase
    .from('tailor_profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTailorProfile(id) {
  // Assuming ON DELETE CASCADE is NOT set on FK, let's delete children first to be safe
  await supabase.from('tailor_payments').delete().eq('tailor_id', id);
  
  // To delete work items, we need log IDs
  const { data: logs } = await supabase.from('tailor_work_logs').select('id').eq('tailor_id', id);
  if (logs && logs.length > 0) {
    const logIds = logs.map(l => l.id);
    await supabase.from('tailor_work_items').delete().in('log_id', logIds);
    await supabase.from('tailor_work_logs').delete().eq('tailor_id', id);
  }

  // Delete tailor
  const { error } = await supabase.from('tailor_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * WORK LOGS & ITEMS
 * ══════════════════════════════════════════════════════════════════════════
 */

// Add a work log along with its items
export async function addWorkLog(tailorId, date, items, totalAmount) {
  // Insert log first
  const { data: logData, error: logError } = await supabase
    .from('tailor_work_logs')
    .insert([{ tailor_id: tailorId, date, total_amount: totalAmount }])
    .select()
    .single();

  if (logError) throw new Error(`Log Error: ${logError.message}`);

  const logId = logData.id;

  if (items.length > 0) {
    // Insert items
    const itemsToInsert = items.map(item => ({
      log_id: logId,
      cloth_type: item.cloth_type,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit
    }));

    const { error: itemsError } = await supabase
      .from('tailor_work_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error(`Items Error: ${itemsError.message}`);
  }

  return logData;
}

export async function updateWorkLog(logId, date, items, totalAmount) {
  // Update log
  const { error: logError } = await supabase
    .from('tailor_work_logs')
    .update({ date, total_amount: totalAmount })
    .eq('id', logId);

  if (logError) throw new Error(`Log Update Error: ${logError.message}`);

  // Delete old items
  const { error: delError } = await supabase
    .from('tailor_work_items')
    .delete()
    .eq('log_id', logId);

  if (delError) throw new Error(`Items Delete Error: ${delError.message}`);

  // Insert new items
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      log_id: logId,
      cloth_type: item.cloth_type,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit
    }));

    const { error: itemsError } = await supabase
      .from('tailor_work_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error(`Items Insert Error: ${itemsError.message}`);
  }
}

export async function getTailorLogs(tailorId) {
  // Fetch logs with their items array
  const { data, error } = await supabase
    .from('tailor_work_logs')
    .select(`
      id,
      date,
      total_amount,
      tailor_work_items (
        id,
        cloth_type,
        quantity,
        price_per_unit
      )
    `)
    .eq('tailor_id', tailorId)
    .order('date', { ascending: false });

  if (error) {
    console.error('getTailorLogs error:', error.message);
    return [];
  }
  return data || [];
}

export async function deleteWorkLog(logId) {
  const { error } = await supabase
    .from('tailor_work_logs')
    .delete()
    .eq('id', logId);

  if (error) throw new Error(error.message);
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * PAYMENTS
 * ══════════════════════════════════════════════════════════════════════════
 */

export async function addTailorPayment(tailorId, amount, date) {
  const { data, error } = await supabase
    .from('tailor_payments')
    .insert([{ tailor_id: tailorId, amount_paid: amount, date }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getTailorPayments(tailorId) {
  const { data, error } = await supabase
    .from('tailor_payments')
    .select('*')
    .eq('tailor_id', tailorId)
    .order('date', { ascending: false });

  if (error) {
    console.error('getTailorPayments error:', error.message);
    return [];
  }
  return data || [];
}

export async function deletePayment(paymentId) {
  const { error } = await supabase
    .from('tailor_payments')
    .delete()
    .eq('id', paymentId);

  if (error) throw new Error(error.message);
}
