import { useState, useEffect } from 'react';
import { Camera, Save, Scissors, Image as ImageIcon, Volume2 } from 'lucide-react';
import { getOrders, getTailors, saveOrder, updateOrder } from '../store/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import { speak } from '../utils/audio';
import { getLang } from '../utils/i18n';
import { useApp } from '../App';

const CLOTH_TYPES = [
  'Shirt', 'Pant', 'Jeans', 'T-Shirt', 'Kurta', 'Kurta Pajama',
  'Pathani Suit', 'Aligadhi Suit', 'Sherwani', 'Bandhgala', 'Blazer',
  'Coat', 'Waistcoat (Nehru Jacket)', 'Safari Suit', 'Dhoti Kurta',
  'Lungi', 'Track Pant', 'Shorts', 'Formal Suit', 'Other'
];

export default function AddOrder() {
  const navigate = useNavigate();
  const { id } = useParams();   // order_id when editing
  const { t } = useApp();

  const [customerName,   setCustomerName]   = useState('');
  const [customerPhone,  setCustomerPhone]  = useState('');
  const [clothType,      setClothType]      = useState([]);
  const [customCloth,    setCustomCloth]    = useState('');
  const [fabricImage,    setFabricImage]    = useState(null);
  const [measureImage,   setMeasureImage]   = useState(null);
  const [instructions,   setInstructions]   = useState('');
  const [tailorId,       setTailorId]       = useState('');
  const [tailors,        setTailors]        = useState([]);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    const load = async () => {
      const tList = await getTailors();
      setTailors(tList);

      if (id) {
        // Edit mode — load existing order from IndexedDB
        const orders = await getOrders();
        const order = orders.find(o => o.order_id === id);
        if (order) {
          setCustomerName(order.customer_name || '');
          setCustomerPhone(order.customer_phone || '');
          const existingClothTypeArray = Array.isArray(order.cloth_type) 
            ? order.cloth_type 
            : typeof order.cloth_type === 'string' && order.cloth_type !== ''
              ? [order.cloth_type] 
              : [];
          
          const standardTypes = [];
          const customTypes = [];

          existingClothTypeArray.forEach(type => {
            if (CLOTH_TYPES.includes(type)) {
              standardTypes.push(type);
            } else {
              customTypes.push(type);
            }
          });

          if (customTypes.length > 0) {
            standardTypes.push('Other');
            setCustomCloth(customTypes.join(', '));
          }

          setClothType(standardTypes);
          setFabricImage(order.image_url || null);
          setMeasureImage(order.measurement_image_url || null);
          setInstructions(order.instructions_text || '');
          setTailorId(order.tailor_id || '');
        }
      } else if (tList.length > 0) {
        setTailorId(tList[0].id);
      }
    };
    load();
  }, [id]);

  const handleImage = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result);  // stores as base64 data-URI
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let finalCloth = [...clothType];
    if (finalCloth.includes('Other')) {
      finalCloth = finalCloth.filter(t => t !== 'Other');
      if (customCloth) {
        finalCloth.push(customCloth);
      }
    }

    if (!customerName || finalCloth.length === 0 || !customerPhone) {
      return alert(t('req_fields_err'));
    }

    setSaving(true);
    try {
      const payload = {
        customer_name:         customerName,
        customer_phone:        customerPhone,
        cloth_type:            finalCloth,
        instructions_text:     instructions,
        tailor_id:             tailorId || null,
        image_url:             fabricImage,            // base64 stored in IndexedDB
        measurement_image_url: measureImage,
      };

      if (id) {
        // Update existing
        await updateOrder(id, payload);
      } else {
        // Create new
        await saveOrder(payload);
      }

      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-[12px] sm:p-4 md:p-10 rounded-xl md:rounded-[2.5rem] shadow-sm md:shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto space-y-4 md:space-y-8 mb-6 md:mb-12 transition-colors">

      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-gray-100 dark:border-gray-800 pb-3 md:pb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 md:p-4 rounded-lg md:rounded-2xl text-indigo-600 dark:text-indigo-400">
          <Scissors size={20} className="md:w-8 md:h-8" />
        </div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase">
          {id ? t('edit_order') : t('new_order')}
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-4 md:space-y-8">

        {/* Name + Phone */}
        <div className="space-y-3 md:space-y-5">
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg mb-1.5 md:mb-3">{t('customer_name')}</label>
            <VoiceInput
              value={customerName}
              onChange={setCustomerName}
              placeholder={t('customer_name_ph')}
              className="w-full text-sm md:text-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-bold text-gray-900 dark:text-white"
              required={true}
            />
          </div>
          <div>
            <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg mb-1.5 md:mb-3">{t('customer_phone')}</label>
            <VoiceInput
              type="tel"
              value={customerPhone}
              onChange={setCustomerPhone}
              placeholder={t('customer_phone_ph')}
              className="w-full text-sm md:text-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-bold tracking-widest text-gray-900 dark:text-white"
              required={true}
              isNumeric={true}
            />
          </div>
        </div>

        {/* Cloth type */}
        <div>
          <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg mb-2 md:mb-4 border-t border-gray-100 dark:border-gray-800 md:border-t-2 pt-3 md:pt-6">
            {t('select_cloth')}
          </label>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {CLOTH_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setClothType(prev => 
                  prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                )}
                className={`py-[6px] px-3 md:py-3 md:px-5 rounded-lg md:rounded-xl text-xs md:text-base font-bold transition-all border flex-grow sm:flex-grow-0 text-center ${
                  clothType.includes(type)
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 shadow-sm'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {clothType.includes('Other') && (
            <div className="mt-3 md:mt-5 animate-in fade-in slide-in-from-top-2">
              <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg mb-1.5 md:mb-3">{t('custom_cloth')}</label>
              <VoiceInput
                value={customCloth}
                onChange={setCustomCloth}
                placeholder={t('custom_cloth_ph')}
                className="w-full text-sm md:text-xl p-3 md:p-5 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all font-bold text-gray-900 dark:text-white"
                required={clothType.includes('Other')}
              />
            </div>
          )}
        </div>

        {/* Images */}
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          {[
            { label: t('fabric_photo'),  img: fabricImage,  setter: setFabricImage,  Icon: Camera },
            { label: t('measurement'),   img: measureImage, setter: setMeasureImage, Icon: ImageIcon },
          ].map(({ label, img, setter, Icon }) => (
            <div key={label} className="flex flex-col gap-1.5 md:gap-3">
              <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg">{label}</label>
              <label className="flex flex-col items-center justify-center p-3 md:p-6 border md:border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl md:rounded-3xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors h-24 md:h-40 relative overflow-hidden group">
                {img ? (
                  <img loading="lazy" src={img} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                ) : (
                  <><Icon size={24} className="text-gray-400 dark:text-gray-500 mb-1 md:mb-3 md:w-10 md:h-10" /><span className="text-gray-500 dark:text-gray-400 font-bold text-[10px] md:text-sm text-center">{t('tap_snap')}</span></>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImage(e, setter)} />
              </label>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50/70 dark:bg-yellow-900/10 p-3 md:p-6 rounded-xl md:rounded-3xl border md:border-2 border-yellow-100 dark:border-yellow-900/50">
          <label className="block text-yellow-900 dark:text-yellow-600 font-bold md:font-extrabold text-sm md:text-xl flex justify-between items-center mb-2 md:mb-4">
            <span>{t('special_inst')}</span>
            <button
              type="button"
              onClick={() => speak(instructions || 'No instructions.', getLang() === 'gu' ? 'gu-IN' : 'hi-IN')}
              className="p-1.5 md:p-2 bg-white dark:bg-[#2a2a2a] shadow-sm border border-yellow-200 dark:border-gray-700 text-yellow-700 dark:text-yellow-500 rounded-lg md:rounded-xl hover:bg-yellow-100 transition-colors active:scale-95 flex items-center justify-center"
            >
              <Volume2 size={16} className="md:w-6 md:h-6" />
            </button>
          </label>
          <VoiceInput
            value={instructions}
            onChange={setInstructions}
            placeholder={t('inst_ph')}
            className="w-full text-sm md:text-xl p-3 md:p-5 border md:border-2 border-yellow-200 dark:border-yellow-900/50 bg-white dark:bg-[#1e1e1e] rounded-xl md:rounded-2xl focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all shadow-inner text-gray-900 dark:text-gray-100"
            multiline={true}
            rows={3}
          />
        </div>

        {/* Assign tailor */}
        <div>
          <label className="block text-gray-800 dark:text-gray-300 font-bold text-sm md:text-lg mb-2 md:mb-4 border-t pt-3 md:border-t-2 md:pt-6 border-gray-100 dark:border-gray-800">
            {t('assign_tailor')}
          </label>
          {tailors.length === 0 ? (
            <div className="p-4 md:p-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-xl md:rounded-2xl font-bold border md:border-2 border-red-200 dark:border-red-900/50 shadow-inner text-sm md:text-lg text-center">
              {t('no_tailors_warn')}
            </div>
          ) : (
            <div className="relative">
              <select
                value={tailorId}
                onChange={e => setTailorId(e.target.value)}
                className="w-full text-sm md:text-xl font-bold md:font-extrabold p-3 md:p-5 border md:border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all appearance-none cursor-pointer text-indigo-900 dark:text-indigo-400 shadow-sm"
              >
                {tailors.map((tObj, idx) => (
                  <option key={tObj.id || idx} value={tObj.id}>{tObj.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 md:px-6 text-gray-700 dark:text-gray-400">
                <svg className="fill-current h-4 w-4 md:h-6 md:w-6" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white font-bold md:font-black py-3 md:py-5 mt-4 md:mt-8 rounded-xl md:rounded-[2rem] text-base md:text-2xl flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-all outline-none focus:ring-4 md:focus:ring-8 focus:ring-green-200 dark:focus:ring-green-900 border border-green-400 md:border-4 dark:border-none shadow-sm md:shadow-lg disabled:opacity-70"
        >
          <Save size={20} className="md:w-8 md:h-8" />
          {saving ? '...' : (id ? t('update_order') : t('save_order'))}
        </button>
      </form>
    </div>
  );
}
