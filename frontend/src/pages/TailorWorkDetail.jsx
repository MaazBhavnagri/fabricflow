import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTailorProfile, getTailorLogs, getTailorPayments, addTailorPayment, deleteWorkLog, deletePayment, deleteTailorProfile } from '../store/tailorWorkService';
import { useApp } from '../App';

export default function TailorWorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();

  const [loading, setLoading] = useState(true);
  const [tailor, setTailor] = useState(null);
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isPaying, setIsPaying] = useState(false);

  // Edit password state
  const [editPromptLog, setEditPromptLog] = useState(null);
  const [password, setPassword] = useState('');
  
  // Pagination State
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, lData, pData] = await Promise.all([
        getTailorProfile(id),
        getTailorLogs(id),
        getTailorPayments(id)
      ]);
      setTailor(tData);
      setLogs(lData || []);
      setPayments(pData || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load details.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const totalEarned = useMemo(() => {
    return logs.reduce((sum, log) => sum + (Number(log.total_amount) || 0), 0);
  }, [logs]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, pmt) => sum + (Number(pmt.amount_paid) || 0), 0);
  }, [payments]);

  const balance = totalEarned - totalPaid;

  const allocatedLogs = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    let remainingPaid = totalPaid;

    const mapped = sortedLogs.map(log => {
      const amount = Number(log.total_amount) || 0;
      const allocated = Math.min(amount, remainingPaid);
      remainingPaid -= allocated;
      
      const isFullPaid = allocated >= amount;
      const unpaidAmount = amount - allocated;
      
      return {
        ...log,
        allocatedPaid: allocated,
        unpaidAmount,
        isFullPaid
      };
    });
    return mapped.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, totalPaid]);

  const displayedLogs = showAllLogs ? allocatedLogs : allocatedLogs.slice(0, 10);
  const displayedPayments = showAllPayments ? payments : payments.slice(0, 10);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    
    setIsPaying(true);
    try {
      await addTailorPayment(id, Number(paymentAmount), paymentDate);
      setPaymentAmount('');
      loadData();
    } catch (err) {
      alert("Payment Error: " + err.message);
    }
    setIsPaying(false);
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this work log? This action cannot be undone.")) {
      try {
        await deleteWorkLog(logId);
        loadData();
      } catch (err) {
        alert("Delete Error: " + err.message);
      }
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm(t('del_payment_conf') || "Are you sure you want to delete this payment? This action cannot be undone.")) {
      try {
        await deletePayment(paymentId);
        loadData();
      } catch (err) {
        alert("Delete Error: " + err.message);
      }
    }
  };

  const verifyAndEdit = () => {
    if (password !== '123') {
      alert('Incorrect password!');
      return;
    }
    navigate(`/tailor-work/add?tailorId=${id}`, { state: { editLog: editPromptLog } });
  };

  const handleDeleteTailor = async () => {
    if (window.confirm(t('del_tailor_conf') || "Are you sure you want to completely delete this tailor and ALL of their work history? This CANNOT be undone.")) {
      try {
        await deleteTailorProfile(id);
        navigate('/tailor-work');
      } catch (err) {
        alert("Delete Error: " + err.message);
      }
    }
  };

  if (loading || !tailor) {
    return <div className="text-center py-10 text-gray-400 font-bold bg-[#f9fafb] dark:bg-[#121212] min-h-screen">{t('loading')}</div>;
  }

  // Define icons mapping for fast lookup inside the table
  const getClothIcon = (clothName) => {
    const n = clothName.toLowerCase();
    if (n.includes('shirt')) return '👕';
    if (n.includes('pant')) return '👖';
    if (n.includes('kurta')) return '👘';
    if (n.includes('sherwani set')) return '🤵‍♂️';
    if (n.includes('sherwani')) return '🧥';
    if (n.includes('blazer') || n.includes('coat')) return '👔';
    if (n.includes('lengha')) return '👖';
    if (n.includes('salwar')) return '👖';
    if (n.includes('aligarhi')) return '👖';
    if (n.includes('pathani')) return '🥼';
    if (n.includes('jabba')) return '🥼';
    return '✂️';
  };

  // UI styling variables
  const containerStyle = "max-w-[420px] mx-auto w-full px-4 pt-4 pb-24 bg-[#f9fafb] dark:bg-[#121212] min-h-screen";

  return (
    <div className={containerStyle}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#1e1e1e] p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
          >
            <span className="text-lg leading-none block">🔙</span>
          </button>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 leading-tight uppercase tracking-wider truncate">{tailor.name}</h2>
            {tailor.phone && <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{tailor.phone}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            {/* DELETE TAILOR BUTTON */}
            <button
              onClick={handleDeleteTailor}
              className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl p-2 min-w-[3.5rem] active:scale-95 transition-all text-center border border-red-100 dark:border-red-800"
            >
              <span className="text-lg leading-none mb-0.5">🗑️</span>
              <span className="text-[8px] font-black uppercase tracking-wider">{t('del')}</span>
            </button>
            {/* ACTION BUTTON (ICON + TEXT) */}
            <button
              onClick={() => navigate(`/tailor-work/add?tailorId=${id}`)}
              className="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl p-2 min-w-[3.5rem] active:scale-95 transition-all text-center border border-indigo-100 dark:border-indigo-800"
            >
              <span className="text-lg leading-none mb-0.5">➕</span>
              <span className="text-[8px] font-black uppercase tracking-wider">{t('add_work')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">{t('earned')}</span>
          <span className="text-base font-black text-gray-800 dark:text-gray-100 leading-none">₹{totalEarned}</span>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">{t('paid')}</span>
          <span className="text-base font-black text-green-600 dark:text-green-400 leading-none">₹{totalPaid}</span>
        </div>
        <div className={`rounded-xl p-3 shadow-sm border flex flex-col items-center justify-center ${balance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-white dark:bg-[#1e1e1e] border-gray-100 dark:border-gray-800'}`}>
          <span className={`text-[9px] uppercase font-black tracking-widest mb-0.5 ${balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>{t('balance')}</span>
          <span className={`text-base font-black leading-none ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>₹{balance}</span>
        </div>
      </div>

      {/* PAYMENT ENTRY */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
        <form onSubmit={handleAddPayment} className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-2 text-[10px] font-bold text-gray-800 dark:text-gray-100 focus:outline-none"
            />
            <div className="relative w-full">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-black">₹</span>
              <input
                type="number"
                required
                min="1"
                placeholder={t('amount')}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl pl-6 pr-2 py-2 text-xs font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            </div>
          </div>
          {/* ACTION BUTTON (ICON + TEXT) */}
          <button
            type="submit"
            disabled={isPaying || !paymentAmount}
            className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 disabled:opacity-50 rounded-xl w-16 h-[4.25rem] active:scale-95 transition-all text-center border border-green-200 dark:border-green-800 shadow-sm"
          >
            <span className="text-xl leading-none mb-1">💰</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{t('payment')}</span>
          </button>
        </form>
      </div>

      {/* WORK HISTORY TABLE */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">{t('work_history')}</h3>
        </div>
        
        {allocatedLogs.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-6 font-bold uppercase tracking-widest">{t('no_work_logs')}</p>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#1e1e1e] border-b-2 border-gray-100 dark:border-gray-800 text-[8px] uppercase tracking-widest text-gray-400">
                  <th className="p-2 font-black">📅 {t('date')}</th>
                  <th className="p-2 font-black">🧵 {t('cloth')}</th>
                  <th className="p-2 font-black">💰 {t('total')}</th>
                  <th className="p-2 font-black">💳 {t('status')}</th>
                  <th className="p-2 font-black text-center">⚙️</th>
                </tr>
              </thead>
              <tbody className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                {displayedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#252525]/30">
                    <td className="p-2 align-middle whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString(t('en-GB'), { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-2 align-middle text-[9px] leading-tight">
                      {log.tailor_work_items?.map(item => (
                        <div key={item.id} className="whitespace-nowrap flex items-center gap-0.5">
                          <span className="text-xs">{getClothIcon(item.cloth_type)}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap">
                      ₹{log.total_amount}
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap">
                      {log.isFullPaid ? (
                        <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1 py-0.5 rounded shadow-sm leading-none border border-green-200 dark:border-green-800 text-[9px]">
                          ✅ {t('paid_status')}
                        </span>
                      ) : (
                        <span className="inline-block bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1 py-0.5 rounded shadow-sm leading-none border border-red-200 dark:border-red-800 text-[9px]">
                          🔴 {t('unpaid_status')} ₹{log.unpaidAmount}
                        </span>
                      )}
                    </td>
                    <td className="p-2 align-middle text-center">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <button
                          onClick={() => setEditPromptLog(log)}
                          className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md w-7 h-7 active:scale-95 transition-all text-center border border-blue-100 dark:border-blue-800"
                        >
                          <span className="text-xs leading-none mb-0.5">✏️</span>
                          <span className="text-[5px] font-black uppercase tracking-widest leading-none">{t('edit')}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md w-7 h-7 active:scale-95 transition-all text-center border border-red-100 dark:border-red-800"
                        >
                          <span className="text-xs leading-none mb-0.5">🗑️</span>
                          <span className="text-[5px] font-black uppercase tracking-widest leading-none">{t('del')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* VIEW ALL BUTTON */}
            {allocatedLogs.length > 10 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-center bg-gray-50/50 dark:bg-[#181818]/50">
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="px-4 py-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm active:scale-95 transition-transform"
                >
                  {showAllLogs ? t('show_less') : t('view_all')} ({allocatedLogs.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PAYMENT HISTORY TABLE */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] flex items-center gap-2">
          <span className="text-lg">💸</span>
          <h3 className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">{t('payment_history')}</h3>
        </div>
        
        {payments.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-6 font-bold uppercase tracking-widest">{t('no_payments')}</p>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#1e1e1e] border-b-2 border-gray-100 dark:border-gray-800 text-[8px] uppercase tracking-widest text-gray-400">
                  <th className="p-2 font-black w-24">📅 {t('date')}</th>
                  <th className="p-2 font-black">💰 {t('amount')}</th>
                  <th className="p-2 font-black text-center w-12">⚙️</th>
                </tr>
              </thead>
              <tbody className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                {displayedPayments.map((pmt) => (
                  <tr key={pmt.id} className="border-b border-gray-200 dark:border-gray-700/60 last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#252525]/30">
                    <td className="p-2 align-middle whitespace-nowrap">
                      {new Date(pmt.date).toLocaleDateString(t('en-GB'), { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-2 align-middle whitespace-nowrap text-green-600 dark:text-green-400 font-black">
                      ₹{pmt.amount_paid}
                    </td>
                    <td className="p-2 align-middle text-center">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <button
                          onClick={() => handleDeletePayment(pmt.id)}
                          className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md w-7 h-7 active:scale-95 transition-all text-center border border-red-100 dark:border-red-800"
                        >
                          <span className="text-xs leading-none mb-0.5">🗑️</span>
                          <span className="text-[5px] font-black uppercase tracking-widest leading-none">{t('del')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* VIEW ALL BUTTON */}
            {payments.length > 10 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-center bg-gray-50/50 dark:bg-[#181818]/50">
                <button
                  onClick={() => setShowAllPayments(!showAllPayments)}
                  className="px-4 py-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm active:scale-95 transition-transform"
                >
                  {showAllPayments ? t('show_less') : t('view_all')} ({payments.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PASSWORD MODAL */}
      {editPromptLog && (
        <div className="fixed inset-0 bg-[#f9fafb]/80 dark:bg-[#121212]/80 backdrop-blur-md z-50 flex flex-col justify-center p-4">
          <div className="max-w-[340px] w-full mx-auto bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
              <span className="text-xl">🔒</span> {t('verification')}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-6">
              {t('password_prompt')}
            </p>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-6"
              placeholder="Enter password"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEditPromptLog(null); setPassword(''); }}
                className="flex-1 flex flex-col items-center justify-center py-2 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-xl active:scale-95 transition-all border border-gray-200 dark:border-gray-700"
              >
                <span className="text-base mb-0.5">❌</span>
                <span className="text-[8px] font-black uppercase tracking-widest">{t('cancel')}</span>
              </button>
              <button
                type="button"
                onClick={verifyAndEdit}
                className="flex-1 flex flex-col items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-all shadow-md shadow-blue-200 dark:shadow-none"
              >
                <span className="text-base mb-0.5">✅</span>
                <span className="text-[8px] font-black uppercase tracking-widest">{t('verify_edit')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
