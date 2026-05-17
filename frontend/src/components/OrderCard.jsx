import { Phone, Edit2, Trash2, Camera, Navigation, Scissors, Volume2, X, Calendar } from 'lucide-react';
import { useState } from 'react';
import WorkflowStepper from './WorkflowStepper';
import { speak } from '../utils/audio';
import { getLang } from '../utils/i18n';
import { useApp } from '../App';

const WORKFLOW = ['CREATED', 'GIVEN', 'STITCHING', 'BUTTONS', 'PRESS', 'DELIVERED'];

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return `http://localhost:5000${url}`; // legacy fallback if relative
  // Supabase URLs are absolute "https://...", so they will match above.
};

const getClothTypesArray = (clothType) => {
  if (!clothType) return [];
  if (Array.isArray(clothType)) return clothType;
  if (typeof clothType === 'string') {
    const trimmed = clothType.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback
      }
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [String(clothType)];
};

export default function OrderCard({ order, tailors, onUpdateStatus, onEdit, onDelete }) {
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showFabricModal, setShowFabricModal] = useState(false);
  const { t } = useApp();
  const isCompleted = order.status === 'DELIVERED';
  const tailor = tailors.find(tObj => tObj.id == order.tailor_id || tObj.name === order.tailor_id) || { name: t('unassigned') };

  const currentIndex = WORKFLOW.indexOf(order.status) === -1 ? 0 : WORKFLOW.indexOf(order.status);
  const nextStatus = currentIndex < WORKFLOW.length - 1 ? WORKFLOW[currentIndex + 1] : null;

  return (
    <div className={`
      bg-white dark:bg-[#1e1e1e] rounded-xl border shadow-sm
      p-[10px] md:p-4
      flex flex-col gap-2
      overflow-hidden relative transition-colors
      ${isCompleted
        ? 'border-green-200 dark:border-green-800/50'
        : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
      }
    `}>

      {/* ── Row 1: Image + Customer Info ── */}
      <div className="flex gap-2.5 w-full min-w-0">

        {/* Fabric image – strict 60×60 */}
        <div 
          className={`w-[56px] h-[56px] md:w-[68px] md:h-[68px] rounded-lg bg-gray-100 dark:bg-black/40 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center ${order.image_url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={() => { if(order.image_url) setShowFabricModal(true); }}
        >
          {order.image_url
            ? <img loading="lazy" src={getImageUrl(order.image_url)} alt="Fabric" className="w-full h-full object-cover pointer-events-none" />
            : <Camera size={18} className="text-gray-400" />
          }
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 pr-7 md:pr-8">

          {/* Customer name + Date */}
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-[14px] md:text-[16px] font-bold text-gray-900 dark:text-white leading-tight truncate uppercase">
              {order.customer_name}
            </h3>
            {order.created_at && (
              <span className="text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap mt-0.5 font-medium">
                {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Cloth type badges + Order ID */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1 min-w-0">
            <Scissors size={9} className="text-gray-400 shrink-0" />
            <div id="clothdisplay" className="flex flex-wrap gap-1 items-center min-w-0">
              {getClothTypesArray(order.cloth_type).map((type, idx) => (
                <span
                  key={idx}
                  className="text-[9px] md:text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider whitespace-nowrap"
                >
                  {type}
                </span>
              ))}
            </div>
            <span className="text-gray-300 dark:text-gray-700 shrink-0 text-[10px]">•</span>
            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px] md:text-[11px] shrink-0">{order.order_id || t('syncing')}</span>
          </div>

          {/* Tailor + Phone */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[11px] md:text-[12px] font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[90px]">
              🧵 {tailor.name}
            </span>
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="flex items-center gap-0.5 text-[10px] md:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 px-1.5 py-0.5 rounded-md shrink-0"
              >
                <Phone size={8} /> {order.customer_phone}
              </a>
            )}
          </div>

          {/* Delivery Date */}
          {order.delivery_date && (
            <div className="text-[10px] md:text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-1.5 py-0.5 rounded-md w-fit">
              <Calendar size={10} className="shrink-0" />
              <span>{t('delivery_date')}: {new Date(order.delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Edit / Delete – absolute top-right */}
        {order.order_id && (
          <div className="absolute top-[6px] right-[6px] flex flex-col gap-0.5">
            <button
              onClick={() => onEdit(order.order_id)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-90"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(order.order_id)}
              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors active:scale-90"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {order.measurement_image_url && (
        <div 
          className="w-full h-[60px] md:h-[80px] rounded-lg bg-gray-100 dark:bg-black/40 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowMeasurementModal(true)}
        >
          <img id="measurefield" loading="lazy" src={getImageUrl(order.measurement_image_url)} alt="Measurement" className="w-full h-full object-cover object-top pointer-events-none" />
        </div>
      )}

      {/* ── Row 2: Special Instructions ── */}
      {order.instructions_text && (
        <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg px-2 py-1.5">
          <p className="text-[10px] md:text-[11px] text-gray-700 dark:text-gray-300 flex-1 min-w-0 break-words whitespace-pre-wrap leading-relaxed">
            <span className="font-bold text-amber-700 dark:text-amber-500">{t('special_inst')}: </span>
            {order.instructions_text}
          </p>
          <button
            onClick={() => speak(order.instructions_text, getLang() === 'gu' ? 'gu-IN' : 'hi-IN')}
            className="shrink-0 text-indigo-500 dark:text-indigo-400 p-0.5 active:scale-90 mt-0.5"
          >
            <Volume2 size={12} />
          </button>
        </div>
      )}

      {/* ── Row 3: Workflow Stepper (icons only, no overflow) ── */}
      <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-lg px-2 py-0.5 overflow-hidden">
        <WorkflowStepper
          currentStatus={order.status}
          onStatusSelect={(s) => onUpdateStatus(order, s)}
          compact={true}
        />
      </div>

      {/* ── Row 4: Action Button ── */}
      {!isCompleted && nextStatus && (
        <button
          onClick={() => {
            if (confirm(`${t('advance_conf')} ${t('status_' + nextStatus)}?`)) {
              onUpdateStatus(order, nextStatus);
            }
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-1.5 md:py-2 rounded-lg text-[12px] md:text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all border-none outline-none shadow-sm"
        >
          <Navigation size={12} className="rotate-90" />
          {t('mark')} {t('status_' + nextStatus)}
        </button>
      )}

      {/* ── Measurement Fullscreen Modal ── */}
      {showMeasurementModal && order.measurement_image_url && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000e6] p-4 backdrop-blur-sm" onClick={() => setShowMeasurementModal(false)}>
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 z-[101] transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowMeasurementModal(false); }}
          >
            <X size={24} />
          </button>
          <img 
            src={getImageUrl(order.measurement_image_url)} 
            alt="Measurement Fullscreen" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Fabric Fullscreen Modal ── */}
      {showFabricModal && order.image_url && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000e6] p-4 backdrop-blur-sm" onClick={() => setShowFabricModal(false)}>
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 z-[101] transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowFabricModal(false); }}
          >
            <X size={24} />
          </button>
          <img 
            src={getImageUrl(order.image_url)} 
            alt="Fabric Fullscreen" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
