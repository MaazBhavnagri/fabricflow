import { useState, useEffect, useMemo } from 'react';
import { getOrders, getTailors, updateOrderStatus, deleteOrder } from '../store/supabase';
import { Search, X } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import VoiceInput from '../components/VoiceInput';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import Fuse from 'fuse.js';

export default function Orders() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [orders, setOrders] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Load directly from IndexedDB — no backend dependency
  const loadData = async () => {
    const [o, t2] = await Promise.all([getOrders(), getTailors()]);
    setOrders(o);
    setTailors(t2);
  };

  useEffect(() => {
    loadData();
    // Refresh if background sync completed
    const handler = () => loadData();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, []);

  const handleUpdateStatus = async (order, newStatus) => {
    await updateOrderStatus(order.order_id, newStatus);
    setOrders(prev =>
      prev.map(o => o.order_id === order.order_id ? { ...o, status: newStatus } : o)
    );
  };

  const handleEdit = (order_id) => navigate(`/edit/${order_id}`);

  const handleDelete = async (order_id) => {
    if (!confirm(t('del_order_conf'))) return;
    await deleteOrder(order_id);
    setOrders(prev => prev.filter(o => o.order_id !== order_id));
  };

  // Fuzzy search on local data
  const fuse = useMemo(() => new Fuse(orders, {
    keys: ['customer_name', 'order_id', 'customer_phone', 'cloth_type'],
    threshold: 0.3,
    minMatchCharLength: 2
  }), [orders]);

  const filteredOrders = useMemo(() => {
    let result = search.trim()
      ? fuse.search(search.trim()).map(r => r.item)
      : orders;

    return result.filter(o => {
      if (filterStatus === 'COMPLETED')  return o.status === 'DELIVERED';
      if (filterStatus === 'IN_PROGRESS') return o.status !== 'DELIVERED';
      return true;
    });
  }, [orders, search, filterStatus, fuse]);

  return (
    <div className="space-y-3 md:space-y-5 pt-2 md:pt-4">

      {/* Search */}
      <div className="flex bg-white dark:bg-[#1e1e1e] rounded-[20px] shadow-sm border border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-indigo-500 transition-all relative items-center h-[40px] md:h-[48px] md:max-w-[500px] md:mx-auto">
        <Search className="text-gray-400 absolute left-3 z-10" size={16} />
        <VoiceInput
          value={search}
          onChange={setSearch}
          placeholder={t('search_ph')}
          className="w-full h-full pr-10 pl-9 outline-none text-[13px] md:text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 rounded-[20px]"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 justify-start md:justify-center overflow-x-auto pb-0.5 scrollbar-hide">
        {[
          ['ALL',         t('all_orders')],
          ['IN_PROGRESS', t('in_progress')],
          ['COMPLETED',   t('completed')],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`whitespace-nowrap px-4 py-1.5 md:px-5 md:py-2 rounded-full font-bold text-[11px] md:text-sm transition-all border ${
              filterStatus === key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="pb-4">
        {filteredOrders.length === 0 && (
          <div className="text-center text-gray-400 py-14 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm font-bold text-sm border-2 border-dashed border-gray-200 dark:border-gray-800">
            {t('no_orders')}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] md:gap-5">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.order_id}
              order={order}
              tailors={tailors}
              onUpdateStatus={handleUpdateStatus}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
