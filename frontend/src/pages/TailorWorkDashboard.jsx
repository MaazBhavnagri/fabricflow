import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTailorProfiles, addTailorProfile, updateTailorPriceConfig, deleteTailorProfile } from '../store/tailorWorkService';
import VoiceInput from '../components/VoiceInput';
import { useApp } from '../App';

export const MASTER_CLOTH_LIST = [
  { id: 'shirt', name: 'Shirt', icon: '👕' },
  { id: 'pant', name: 'Pant', icon: '👖' },
  { id: 'kurta', name: 'Kurta', icon: '👘' },
  { id: 'jabba', name: 'Jabba', icon: '🥼' },
  { id: 'salwar', name: 'Salwar', icon: '👖' },
  { id: 'lengha', name: 'Lengha', icon: '👖' },
  { id: 'pathani_set', name: 'Pathani Set', icon: '🥼' },
  { id: 'sherwani', name: 'Sherwani', icon: '🧥' },
  { id: 'blazer', name: 'Blazer/Coat', icon: '👔' },
  { id: 'aligarhi', name: 'Aligarhi', icon: '👖' },
  { id: 'sherwani_set', name: 'Sherwani Set', icon: '🤵‍♂️' },
];

export default function TailorWorkDashboard() {
  const { t } = useApp();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingTailorId, setEditingTailorId] = useState(null); // null = New Tailor
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  // Cloth Config: array of { id, name, icon, price, active, isCustom }
  const [clothConfig, setClothConfig] = useState([]);

  const loadTailors = async () => {
    setLoading(true);
    const data = await getTailorProfiles();
    setTailors(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTailors();
  }, []);

  const openNewTailorModal = () => {
    setEditingTailorId(null);
    setFormName('');
    setFormPhone('');
    
    const initialConfig = MASTER_CLOTH_LIST.map(c => ({
      ...c,
      price: '',
      active: false
    }));
    setClothConfig(initialConfig);
    setShowConfigModal(true);
  };

  const openEditTailorModal = (tailor, e) => {
    e.stopPropagation(); 
    setEditingTailorId(tailor.id);
    setFormName(tailor.name);
    setFormPhone(tailor.phone);

    const existingConfig = Array.isArray(tailor.priceConfig) ? tailor.priceConfig : [];
    
    const standardConfigs = MASTER_CLOTH_LIST.map(masterItem => {
      const saved = existingConfig.find(sc => sc.id === masterItem.id);
      return saved ? { ...masterItem, price: saved.price, active: true } : { ...masterItem, price: '', active: false };
    });

    const customConfigs = existingConfig.filter(sc => sc.isCustom).map(sc => ({
      ...sc,
      active: true,
      price: sc.price || ''
    }));

    setClothConfig([...standardConfigs, ...customConfigs]);
    setShowConfigModal(true);
  };

  const toggleClothActive = (index) => {
    const nextConfig = [...clothConfig];
    nextConfig[index].active = !nextConfig[index].active;
    if (!nextConfig[index].active) {
      nextConfig[index].price = ''; 
    }
    setClothConfig(nextConfig);
  };

  const updateClothPrice = (index, val) => {
    const nextConfig = [...clothConfig];
    nextConfig[index].price = val;
    if (val && Number(val) > 0) {
      nextConfig[index].active = true; 
    }
    setClothConfig(nextConfig);
  };

  const addCustomCloth = () => {
    const newId = `custom_${Date.now()}`;
    setClothConfig([
      ...clothConfig,
      { id: newId, name: '', icon: '✏️', price: '', active: true, isCustom: true }
    ]);
  };

  const updateCustomClothName = (index, name) => {
    const nextConfig = [...clothConfig];
    nextConfig[index].name = name;
    setClothConfig(nextConfig);
  };

  const removeCustomCloth = (index) => {
    const nextConfig = [...clothConfig];
    nextConfig.splice(index, 1);
    setClothConfig(nextConfig);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!formName.trim()) { alert("Name is required"); return; }
    
    try {
      const finalConfigJson = clothConfig
        .filter(c => c.active && (c.isCustom ? c.name.trim() !== '' : true))
        .map(c => ({
          id: c.id,
          name: c.isCustom ? c.name.trim() : c.name,
          icon: c.icon,
          price: Number(c.price) || 0,
          isCustom: c.isCustom || false
        }));

      if (finalConfigJson.length === 0) {
        alert(t('no_cloth_config'));
        return;
      }

      if (editingTailorId) {
        await updateTailorPriceConfig(editingTailorId, finalConfigJson, formName, formPhone);
      } else {
        const newTailor = await addTailorProfile(formName, formPhone);
        await updateTailorPriceConfig(newTailor.id, finalConfigJson, formName, formPhone);
      }

      setShowConfigModal(false);
      setShowConfigModal(false);
      loadTailors();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const handleDeleteTailorCard = async (tailor, e) => {
    e.stopPropagation();
    if (window.confirm(t('del_tailor_conf') || "Are you sure you want to completely delete this tailor and ALL of their work history? This CANNOT be undone.")) {
      try {
        await deleteTailorProfile(tailor.id);
        loadTailors();
      } catch (err) {
        alert("Delete Error: " + err.message);
      }
    }
  };

  const containerStyle = "max-w-[420px] mx-auto w-full px-4 pt-4 pb-24";

  return (
    <div className={containerStyle}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="text-xl">✂️</span> {t('tailor_work')}
        </h2>
        {/* BIG ICON + SMALL TEXT BUTTON: ➕ Add Tailor */}
        <button
          onClick={openNewTailorModal}
          className="flex flex-col items-center justify-center p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors active:scale-95 w-16"
        >
          <span className="text-2xl leading-none mb-1">➕</span>
          <span className="text-[10px] font-black uppercase text-center w-full truncate">{t('tailor')}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 font-bold text-sm bg-gray-50 dark:bg-[#1e1e1e] rounded-2xl">{t('loading')}</div>
      ) : tailors.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 font-bold">{t('no_tailors')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tailors.map(tailor => (
            <div key={tailor.id} className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden block">
              <div className="p-4 flex justify-between items-center bg-gray-50/50 dark:bg-[#181818]/50 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="font-black text-lg text-gray-800 dark:text-gray-100">{tailor.name}</h3>
                  {tailor.phone && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tailor.phone}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {/* 🗑️ Delete Tailor */}
                  <button 
                    onClick={(e) => handleDeleteTailorCard(tailor, e)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors active:scale-95 shadow-sm border border-red-100 dark:border-red-800 w-12"
                  >
                    <span className="text-lg leading-none mb-1">🗑️</span>
                    <span className="text-[9px] font-black uppercase text-center truncate w-full">{t('del')}</span>
                  </button>
                  {/* ✏️ Edit Tailor */}
                  <button 
                    onClick={(e) => openEditTailorModal(tailor, e)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white dark:bg-[#252525] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-600 dark:text-gray-300 transition-colors active:scale-95 shadow-sm border border-gray-100 dark:border-gray-700 w-12"
                  >
                    <span className="text-lg leading-none mb-1">✏️</span>
                    <span className="text-[9px] font-black uppercase text-center truncate w-full">{t('edit')}</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 divide-x dark:divide-gray-800 border-b dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
                <div className="p-3 text-center flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-0.5">{t('earned')}</span>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm">₹{tailor.totalEarned}</span>
                </div>
                <div className="p-3 text-center flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-0.5">{t('paid')}</span>
                  <span className="font-black text-green-600 dark:text-green-400 text-sm">₹{tailor.totalPaid}</span>
                </div>
                <div className="p-3 text-center flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-0.5">{t('balance')}</span>
                  <span className={`font-black text-sm ${tailor.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    ₹{tailor.balance}
                  </span>
                </div>
              </div>

              <div className="flex bg-gray-50 dark:bg-[#181818] p-2 gap-2">
                {/* 📊 Details */}
                <button
                  onClick={() => navigate(`/tailor-work/${tailor.id}`)}
                  className="flex-1 flex flex-col items-center justify-center p-2 bg-white dark:bg-[#1e1e1e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-xl leading-none mb-1">📊</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 w-full truncate text-center">{t('details')}</span>
                </button>

                {/* ➕ Add Work */}
                <button
                  onClick={() => navigate(`/tailor-work/add?tailorId=${tailor.id}`)}
                  className="flex-1 flex flex-col items-center justify-center p-2 bg-white dark:bg-[#1e1e1e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-xl leading-none mb-1">➕</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 w-full truncate text-center">{t('add_work')}</span>
                </button>

                {/* 💰 Payment */}
                <button
                  onClick={() => navigate(`/tailor-work/${tailor.id}`)}
                  className="flex-1 flex flex-col items-center justify-center p-2 bg-white dark:bg-[#1e1e1e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-all active:scale-95 shadow-sm border border-gray-100 dark:border-gray-800"
                >
                  <span className="text-xl leading-none mb-1">💰</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 w-full truncate text-center">{t('payment')}</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* TAILOR CONFIG MODAL (STRICT UI) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-[#f9fafb] dark:bg-[#121212] z-50 overflow-y-auto">
          <div className="max-w-[420px] mx-auto w-full p-4 pb-24 min-h-full flex flex-col gap-4">
            
            {/* Header */}
            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-xl">⚙️</span> {editingTailorId ? t('edit_tailor') : t('new_tailor')}
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)} 
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 dark:bg-[#252525] px-3 py-2 rounded-xl"
              >
                {t('close')}
              </button>
            </div>

            {/* Form Section: Tailor Basic Info */}
            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">{t('tailor_details')}</h4>
              <div className="space-y-4">
                <div>
                  <VoiceInput
                    value={formName}
                    onChange={setFormName}
                    placeholder={t('tailor_name_ph')}
                    className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required={true}
                  />
                </div>
                <div>
                  <VoiceInput
                    type="tel"
                    isNumeric={true}
                    value={formPhone}
                    onChange={setFormPhone}
                    placeholder={t('customer_phone_ph')}
                    className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Section: Cloth Selection Grid */}
            <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm flex-1 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-400">{t('cloth_selection')}</h4>
                <button 
                  onClick={addCustomCloth} 
                  className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg active:scale-95"
                >
                  <span>✏️</span> {t('custom')}
                </button>
              </div>

              {/* 3 COLUMN GRID */}
              <div className="grid grid-cols-3 gap-2">
                {clothConfig.map((item, index) => (
                  <div 
                    key={item.id} 
                    onClick={() => !item.active && toggleClothActive(index)}
                    className={`relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all cursor-pointer ${
                      item.active 
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10' 
                        : 'border-transparent bg-gray-50 dark:bg-[#252525]'
                    }`}
                  >
                    {item.isCustom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeCustomCloth(index); }}
                        className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    )}

                    {/* STRICT: BIG ICON */}
                    <span className="text-3xl mb-1 mt-1 block select-none">
                      {item.icon}
                    </span>

                    {/* STRICT: SMALL TEXT */}
                    <div className="w-full px-1 mb-2">
                       {item.isCustom ? (
                         <input 
                           autoFocus
                           type="text"
                           value={item.name}
                           onChange={(e) => updateCustomClothName(index, e.target.value)}
                           placeholder={t('name')}
                           className="w-full text-[9px] font-black uppercase tracking-wider text-center bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none text-gray-800 dark:text-gray-200 p-0 m-0 leading-tight"
                         />
                       ) : (
                         <div className="text-[9px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 text-center leading-tight truncate">
                           {item.name}
                         </div>
                       )}
                    </div>

                    {/* PRICE INPUT */}
                    <div className="w-full relative mt-auto">
                      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black ${item.active ? 'text-indigo-600' : 'text-gray-400'}`}>₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateClothPrice(index, e.target.value)}
                        className={`w-full bg-white dark:bg-[#181818] border border-gray-100 dark:border-gray-800 rounded-lg pl-3 pr-1 py-1.5 text-[11px] font-black text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          item.active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                        }`}
                        placeholder={t('price')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50">
              <div className="max-w-[420px] mx-auto w-full">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full flex-col justify-center items-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-transform active:scale-[0.98] shadow-lg flex"
                >
                  <span className="text-xl leading-none md:-mb-1">💾</span>
                  <span className="text-[10px] font-black uppercase tracking-widest mt-1">{t('save_config')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
