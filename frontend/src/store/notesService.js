import { supabase } from './supabase';

export async function getNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getNotes error:', error.message);
    throw new Error(error.message);
  }
  return data || [];
}

export async function addNote(content, is_pinned = false) {
  const { data, error } = await supabase
    .from('notes')
    .insert([{ content, is_pinned }])
    .select()
    .single();

  if (error) {
    console.error('addNote error:', error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateNote(id, changes) {
  const { data, error } = await supabase
    .from('notes')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateNote error:', error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteNote(id) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteNote error:', error.message);
    throw new Error(error.message);
  }
}
