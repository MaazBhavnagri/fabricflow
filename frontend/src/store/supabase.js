/**
 * supabase.js — Single source of truth for all database and storage operations.
 *
 * Replaces db.js + sync.js entirely.
 * All functions are async and return { data, error } or throw-safe values.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nowISO() {
  return new Date().toISOString();
}

function localId() {
  return crypto.randomUUID();
}

// Generate next order ID based on existing max
async function nextOrderId() {
  const { data } = await supabase
    .from('orders')
    .select('order_id')
    .order('order_id', { ascending: false })
    .limit(200);

  const nums = (data || [])
    .map(o => parseInt((o.order_id || '').replace('ORD-', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `ORD-${String(next).padStart(4, '0')}`;
}

// ════════════════════════════════════════════════════════════════════════════════
//  IMAGE STORAGE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Upload a base64 data-URI image to Supabase Storage.
 * Returns the public URL or null on failure.
 */
export async function uploadImage(dataUri, bucket) {
  if (!dataUri || !dataUri.startsWith('data:image')) return dataUri; // already URL or empty
  try {
    // Decode base64
    const [header, b64] = dataUri.split(',');
    const ext = header.split(';')[0].split('/')[1] || 'jpg';
    const byteChars = atob(b64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const file = new Blob([byteArr], { type: `image/${ext}` });

    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { upsert: false, contentType: `image/${ext}` });

    if (error) { 
      throw new Error(`Supabase Storage Error: ${error.message}. Please unlock Storage RLS policies.`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.error('Image encode error:', e);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════════════════════════

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('order_id', { ascending: false });
  if (error) { console.error('getOrders:', error.message); return []; }
  return data || [];
}

export async function saveOrder(orderData) {
  const order_id = await nextOrderId();

  // Upload images to Supabase Storage if they're base64
  const image_url = await uploadImage(orderData.image_url, 'fabric-images');
  const measurement_image_url = await uploadImage(orderData.measurement_image_url, 'measurement-images');

  const order = {
    order_id,
    customer_name:         orderData.customer_name || '',
    customer_phone:        orderData.customer_phone || '',
    cloth_type:            orderData.cloth_type || '',
    instructions_text:     orderData.instructions_text || '',
    tailor_id:             orderData.tailor_id || null,
    image_url:             image_url || null,
    measurement_image_url: measurement_image_url || null,
    measurement_text:      orderData.measurement_text || '',
    status:                orderData.status || 'CREATED',
    created_at:            nowISO()
  };

  const { data, error } = await supabase.from('orders').insert([order]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrder(order_id, changes) {
  // Upload new images if provided as base64
  if (changes.image_url?.startsWith('data:')) {
    changes.image_url = await uploadImage(changes.image_url, 'fabric-images');
  }
  if (changes.measurement_image_url?.startsWith('data:')) {
    changes.measurement_image_url = await uploadImage(changes.measurement_image_url, 'measurement-images');
  }

  const { data, error } = await supabase
    .from('orders')
    .update(changes)
    .eq('order_id', order_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrderStatus(order_id, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_id', order_id);
  if (error) throw new Error(error.message);
}

export async function deleteOrder(order_id) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('order_id', order_id);
  if (error) throw new Error(error.message);
}

// ════════════════════════════════════════════════════════════════════════════════
//  TAILORS
// ════════════════════════════════════════════════════════════════════════════════

export async function getTailors() {
  const { data, error } = await supabase
    .from('tailors')
    .select('*');
  if (error) { console.error('getTailors:', error.message); return []; }
  return data || [];
}

export async function addTailor({ name, phone = '' }) {
  const tailor = {
    id:         localId(),
    name:       name.trim(),
    phone:      phone.trim()
  };
  const { data, error } = await supabase.from('tailors').insert([tailor]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTailor(id, changes) {
  const { data, error } = await supabase
    .from('tailors')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTailor(id) {
  const { error } = await supabase.from('tailors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
