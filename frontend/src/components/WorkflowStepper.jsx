import { Check } from 'lucide-react';
import { useApp } from '../App';

const WORKFLOW = [
  { id: 'CREATED',   icon: '🟡' },
  { id: 'GIVEN',     icon: '✂️' },
  { id: 'STITCHING', icon: '🪡' },
  { id: 'BUTTONS',   icon: '🔘' },
  { id: 'PRESS',     icon: '🔥' },
  { id: 'DELIVERED', icon: '✅' },
];

export const WORKFLOW_IDS = WORKFLOW.map(w => w.id);

// Compact mode: icons only, no text, no overflow
// Full mode: icons + labels below
export default function WorkflowStepper({ currentStatus, onStatusSelect, compact = false }) {
  const { t } = useApp();
  const currentIndex = WORKFLOW.findIndex(w => w.id === currentStatus);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progress = safeIndex / (WORKFLOW.length - 1);

  const circleSize = compact ? 'w-[26px] h-[26px] text-[11px]' : 'w-9 h-9 text-base';
  const checkSize = compact ? 10 : 16;

  return (
    <div className={`relative flex w-full items-center justify-between ${compact ? 'py-1' : 'py-2 pb-7'}`}>

      {/* Track background */}
      <div className="absolute left-[13px] right-[13px] top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full z-0" />

      {/* Progress fill */}
      <div
        className="absolute left-[13px] top-1/2 -translate-y-1/2 h-[2px] bg-indigo-500 dark:bg-indigo-400 rounded-full z-0 transition-all duration-500"
        style={{ width: `calc(${progress * 100}% - 26px)` }}
      />

      {/* Steps */}
      {WORKFLOW.map((step, idx) => {
        const isCompleted = idx < safeIndex;
        const isCurrent = idx === safeIndex;

        return (
          <button
            key={step.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (confirm(`${t('advance_conf')} ${t('status_' + step.id)}?`)) {
                onStatusSelect(step.id);
              }
            }}
            className="relative flex flex-col items-center z-10 flex-shrink-0 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 rounded-full active:scale-90 transition-transform"
            title={t('status_' + step.id)}
          >
            {/* Circle */}
            <div className={`
              flex items-center justify-center rounded-full border-2 transition-all
              ${circleSize}
              ${isCurrent
                ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-300 dark:border-indigo-700 shadow-md scale-110'
                : isCompleted
                  ? 'bg-green-500 dark:bg-green-600 border-green-300 dark:border-green-700'
                  : 'bg-white dark:bg-[#2a2a2a] border-gray-300 dark:border-gray-600'
              }
            `}>
              {isCompleted
                ? <Check size={checkSize} className="text-white" strokeWidth={3} />
                : <span className="leading-none">{step.icon}</span>
              }
            </div>

            {/* Label — only in full (non-compact) mode */}
            {!compact && (
              <span className={`
                absolute top-full mt-1 text-[9px] font-bold text-center whitespace-nowrap max-w-[48px] leading-tight
                ${isCurrent ? 'text-indigo-700 dark:text-indigo-400' : isCompleted ? 'text-green-600 dark:text-green-500' : 'text-gray-400 dark:text-gray-500'}
              `}>
                {t('status_' + step.id).split(' ').slice(0,2).join(' ')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
