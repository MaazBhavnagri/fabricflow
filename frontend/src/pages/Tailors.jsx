import { useState, useEffect } from 'react';
import { Users, Plus, Phone, Edit2, Trash2, X } from 'lucide-react';
import { getStore, dbItems, addOfflineAction } from '../store/db';
import { syncOfflineActions } from '../store/sync';
import VoiceInput from '../components/VoiceInput';
import { useApp } from '../App';

export default function Tailors() {
  const { t } = useApp();
  const [tailors, setTailors] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const loadTailors = async () => {
    const data = await getStore(dbItems.TAILORS);
    const actions = await getStore(dbItems.OFFLINE_ACTIONS);
    
    let currentTailors = data ? [...data] : [];
    
    actions.forEach(a => {
      if (a.payload.type === 'ADD_TAILOR') {
        currentTailors.push(a.payload.payload);
      } else if (a.payload.type === 'UPDATE_TAILOR') {
        const idx = currentTailors.findIndex(t => t.id === a.payload.payload.server_id);
        if (idx > -1) {
          if (a.payload.payload.name) currentTailors[idx].name = a.payload.payload.name;
          if (a.payload.payload.phone) currentTailors[idx].phone = a.payload.payload.phone;
        }
      } else if (a.payload.type === 'DELETE_TAILOR') {
        currentTailors = currentTailors.filter(t => t.id !== a.payload.payload.server_id);
      }
    });
    
    setTailors(currentTailors);
  };

  useEffect(() => {
    loadTailors();
    const handler = () => loadTailors();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name) return;
    
    if (editingId) {
      if (!String(editingId).startsWith('17')) { 
         await addOfflineAction('UPDATE_TAILOR', { server_id: editingId, name, phone });
      }
      setEditingId(null);
    } else {
      await addOfflineAction('ADD_TAILOR', { name, phone });
    }
    
    setName('');
    setPhone('');
    setShowAdd(false);
    loadTailors();
    syncOfflineActions();
  };
  
  const handleDelete = async (id) => {
    if (confirm(t('del_tailor_conf'))) {
      await addOfflineAction('DELETE_TAILOR', { server_id: id });
      loadTailors();
      syncOfflineActions();
    }
  };
  
  const startEdit = (tObj) => {
    if (!tObj.id) return alert(t('wait_sync'));
    setEditingId(tObj.id);
    setName(tObj.name);
    setPhone(tObj.phone || '');
    setShowAdd(true);
  };

  return (
    <div className="space-y-4 md:space-y-6 mb-4 md:mb-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-3 md:p-4 rounded-xl md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h2 className="text-xl md:text-3xl font-black flex items-center gap-2 md:gap-3 text-gray-900 dark:text-gray-100">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-indigo-600 dark:text-indigo-400">
             <Users size={20} className="md:w-7 md:h-7" />
          </div>
          {t('tailors')}
        </h2>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); setName(''); setPhone(''); }}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-1.5 md:gap-2 shadow-sm md:shadow-md active:scale-95 transition-transform text-sm md:text-lg"
        >
          {showAdd ? <X size={16} className="md:w-5 md:h-5" /> : <Plus size={16} className="md:w-5 md:h-5" />} <span className="hidden sm:inline">{showAdd ? t('cancel') : t('new_tailor')}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-[#1e1e1e] p-[12px] sm:p-4 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-sm md:shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-3 md:gap-5 animate-in fade-in slide-in-from-top-4 transition-colors">
          <h3 className="font-bold md:font-extrabold text-base md:text-2xl text-gray-800 dark:text-gray-200 mb-0.5 md:mb-2">{editingId ? t('edit_order') : t('new_tailor')}</h3>
          
          <div className="space-y-1.5 md:space-y-2">
            <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-xl">{t('tailor_name')}</label>
            <VoiceInput 
              value={name}
              onChange={setName}
              placeholder={t('tailor_name_ph')}
              className="w-full text-sm md:text-xl p-3 md:p-5 border md:border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
              required={true}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
             <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-xl">{t('customer_phone')}</label>
             <input 
               type="tel" 
               placeholder={t('phone_optional')}
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               className="w-full text-sm md:text-xl p-3 md:p-5 border md:border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all font-bold tracking-widest text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600" 
             />
          </div>

          <button type="submit" className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white py-2.5 md:py-4 rounded-xl md:rounded-2xl font-bold md:font-black text-sm md:text-xl shadow-sm md:shadow-lg active:scale-95 transition-all mt-1 md:mt-4">
            {editingId ? t('update_tailor') : t('save_tailor')}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {tailors.length === 0 && <div className="text-center md:col-span-2 lg:col-span-3 text-gray-400 dark:text-gray-500 py-10 md:py-16 bg-white dark:bg-[#1a1a1a] rounded-xl md:rounded-3xl shadow-sm font-bold text-sm md:text-xl border md:border-2 border-dashed border-gray-200 dark:border-gray-800">{t('no_tailors')}</div>}
        {tailors.map((tObj, idx) => (
          <div key={tObj.id || idx} className="bg-white dark:bg-[#1e1e1e] p-[12px] md:p-6 rounded-xl md:rounded-3xl shadow-sm border md:border-2 border-gray-100 dark:border-gray-800 flex justify-between items-center group hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
            <div className="flex flex-col gap-1 md:gap-2 min-w-0 pr-2">
              <h3 className="text-base md:text-2xl font-bold md:font-black text-gray-900 dark:text-gray-100 truncate">{tObj.name}</h3>
              {tObj.phone && (
                <a href={`tel:${tObj.phone}`} className="flex items-center justify-center sm:justify-start gap-1 md:gap-2 text-indigo-600 dark:text-indigo-400 text-xs md:text-base font-bold bg-indigo-50 dark:bg-indigo-900/20 w-max px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg active:scale-95 transition-transform truncate">
                  <Phone size={12} className="md:w-4 md:h-4" /> {tObj.phone}
                </a>
              )}
              {!tObj.id && <span className="text-[10px] md:text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-500 inline-flex self-start px-1.5 md:px-2 py-0.5 rounded font-bold">{t('syncing')}</span>}
            </div>
            {tObj.id && (
              <div className="flex gap-1.5 md:gap-2 md:flex-col lg:flex-row flex-shrink-0">
                <button onClick={() => startEdit(tObj)} className="p-1.5 md:p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg md:rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-90 transition-all shadow-sm">
                  <Edit2 size={16} className="md:w-5 md:h-5" />
                </button>
                <button onClick={() => handleDelete(tObj.id)} className="p-1.5 md:p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg md:rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-90 transition-all shadow-sm">
                  <Trash2 size={16} className="md:w-5 md:h-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
