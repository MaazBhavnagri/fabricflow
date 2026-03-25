import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getTailorProfile, addWorkLog, updateWorkLog } from '../store/tailorWorkService';
import { useApp } from '../App';

export default function AddTailorWork() {
  const [searchParams] = useSearchParams();
  const tailorId = searchParams.get('tailorId');
  const navigate = useNavigate();
  const location = useLocation();
  const editLog = location.state?.editLog; 
  const { t } = useApp();

  const [loading, setLoading] = useState(true);
  const [tailor, setTailor] = useState(null);
  
  const [date, setDate] = useState(() => editLog ? editLog.date : new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!tailorId) {
      navigate('/tailor-work');
      return;
    }
    loadTailor();
  }, [tailorId]);

  const loadTailor = async () => {
    setLoading(true);
    const data = await getTailorProfile(tailorId);
    if (!data) {
      alert("Tailor not found.");
      navigate('/tailor-work');
      return;
    }
    setTailor(data);
    
    const configList = Array.isArray(data.priceConfig) ? data.priceConfig : [];
    const initialItems = {};
    
    configList.forEach(cloth => {
      let qty = 0;
      let price = cloth.price || 0;
      
      if (editLog && editLog.tailor_work_items) {
        const foundItem = editLog.tailor_work_items.find(i => i.cloth_type === cloth.name);
        if (foundItem) {
          qty = foundItem.quantity;
          price = foundItem.price_per_unit;
        }
      }

      initialItems[cloth.id] = {
        quantity: qty,
        price: price,
        icon: cloth.icon,
        name: cloth.name
      };
    });

    setItems(initialItems);
    setLoading(false);
  };

  const currentTotal = useMemo(() => {
    let total = 0;
    Object.values(items).forEach(item => {
      total += item.quantity * item.price;
    });
    return total;
  }, [items]);

  const updateQuantity = (id, delta) => {
    setItems(prev => {
      const current = prev[id].quantity;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: { ...prev[id], quantity: next } };
    });
  };

  const updatePrice = (id, newPrice) => {
    const p = parseFloat(newPrice) || 0;
    setItems(prev => ({ ...prev, [id]: { ...prev[id], price: p } }));
  };

  const handleSave = async () => {
    const selectedItems = Object.values(items)
      .filter(c => c.quantity > 0)
      .map(c => ({
        cloth_type: c.name,
        quantity: c.quantity,
        price_per_unit: c.price
      }));

    if (selectedItems.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    try {
      setIsSaving(true);
      if (editLog) {
        await updateWorkLog(editLog.id, date, selectedItems, currentTotal);
      } else {
        await addWorkLog(tailorId, date, selectedItems, currentTotal);
      }
      navigate(`/tailor-work/${tailorId}`);
    } catch (err) {
      alert("Error saving: " + err.message);
      setIsSaving(false);
    }
  };

  if (loading || !tailor) {
    return <div className="text-center py-10 text-gray-400 font-bold bg-[#f9fafb] dark:bg-[#121212] min-h-screen">{t('loading')}</div>;
  }

  const clothKeys = Object.keys(items);
  const containerStyle = "max-w-[420px] mx-auto w-full px-4 pt-4 pb-24 bg-[#f9fafb] dark:bg-[#121212] min-h-screen flex flex-col gap-4";

  return (
    <div className={containerStyle}>
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
        >
          <span className="text-lg leading-none block">🔙</span>
        </button>
        <div className="overflow-hidden">
          <h2 className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5 truncate">
            {editLog ? t('edit_work') : t('add_work')}
          </h2>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-tight tracking-wide truncate">{tailor.name}</p>
        </div>
      </div>

      {/* DATE INPUT SECTION */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-400 text-xl border border-indigo-100 dark:border-indigo-800 shrink-0">
          📅
        </div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">{t('date')}</label>
          <input 
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-gray-800 dark:text-gray-100 font-black focus:outline-none"
          />
        </div>
      </div>

      {/* CLOTH SELECTION GRID */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-1">
        <h3 className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4 text-center">{t('cloth_selection')}</h3>
        
        {clothKeys.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 font-bold text-xs uppercase tracking-widest">
            <p>{t('no_cloth_config')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {clothKeys.map(key => {
              const itemData = items[key];
              const isActive = itemData.quantity > 0;
              
              return (
                <div 
                  key={key} 
                  className={`relative bg-gray-50 dark:bg-[#252525] rounded-2xl border-2 transition-all p-2.5 flex flex-col items-center justify-between shadow-sm ${
                    isActive ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-900/10' : 'border-transparent dark:border-[#333]'
                  }`}
                >
                  {/* ICON ON TOP (LARGE), TEXT BELOW (SMALL), CENTER ALIGNED */}
                  <div className="flex flex-col items-center mb-3">
                    <span className="text-4xl select-none filter drop-shadow-sm mb-1">{itemData.icon}</span>
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest text-center leading-tight">
                      {itemData.name}
                    </span>
                  </div>

                  <div className="w-full space-y-2 mt-auto">
                    {/* QUANTITY CONTROLS */}
                    <div className="flex w-full items-center justify-between bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 p-1">
                      <button 
                        type="button"
                        onClick={() => updateQuantity(key, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-400 active:scale-95 transition-transform"
                      >
                        ➖
                      </button>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg w-6 text-center select-none">
                        {itemData.quantity}
                      </span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(key, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-400 active:scale-95 transition-transform"
                      >
                        ➕
                      </button>
                    </div>

                    {/* PRICE INPUT */}
                    <div className="w-full relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 dark:text-gray-500">₹</span>
                      <input
                        type="number"
                        value={itemData.price || ''}
                        onChange={(e) => updatePrice(key, e.target.value)}
                        className="w-full bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-xl pl-6 pr-2 py-1.5 text-[11px] font-black text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-[420px] mx-auto flex items-center gap-4">
          <div className="pl-2 flex-1 overflow-hidden">
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-0.5 truncate">{t('total_amount')}</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">₹{currentTotal}</p>
          </div>
          {/* ICON ON TOP (LARGE), TEXT BELOW (SMALL) */}
          <button
            onClick={handleSave}
            disabled={isSaving || currentTotal === 0}
            className="w-32 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl flex flex-col justify-center items-center py-2.5 shadow-md shadow-indigo-200 dark:shadow-none transition-transform active:scale-[0.98] shrink-0"
          >
            <span className="text-2xl leading-none mb-1">{editLog ? '🔄' : '💾'}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{isSaving ? t('saving') : (editLog ? t('update_work') : t('save_work'))}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
