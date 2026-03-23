import { useState, useEffect, useMemo } from 'react';
import { getStore, dbItems, addOfflineAction } from '../store/db';
import { syncOfflineActions } from '../store/sync';
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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [tailors, setTailors] = useState([]);

  const loadData = async () => {
    const data = await getStore(dbItems.ORDERS);
    const tailorsData = await getStore(dbItems.TAILORS);
    setTailors(tailorsData || []);
    const actions = await getStore(dbItems.OFFLINE_ACTIONS);
    
    let currentOrders = data ? [...data] : [];
    actions.forEach(a => {
      if (a.payload.type === 'CREATE_ORDER') {
        currentOrders.unshift(a.payload.payload);
      } else if (a.payload.type === 'UPDATE_STATUS' || a.payload.type === 'UPDATE_ORDER') {
        const oIndex = currentOrders.findIndex(o => o.order_id === a.payload.payload.order_id);
        if (oIndex > -1) {
          currentOrders[oIndex] = { ...currentOrders[oIndex], ...a.payload.payload };
        }
      } else if (a.payload.type === 'DELETE_ORDER') {
        currentOrders = currentOrders.filter(o => o.order_id !== a.payload.payload.order_id);
      }
    });
    setOrders(currentOrders);
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, []);

  const handleUpdateStatus = async (order, newStatus) => {
    await addOfflineAction('UPDATE_STATUS', { order_id: order.order_id, status: newStatus });
    loadData();
    syncOfflineActions();
  };

  const handleEdit = (order_id) => {
    navigate(`/edit/${order_id}`);
  };

  const handleDelete = async (order_id) => {
    if (confirm(t('del_order_conf'))) {
      await addOfflineAction('DELETE_ORDER', { order_id });
      loadData();
      syncOfflineActions();
    }
  };

  // Setup dynamic fuzzy search
  const fuse = useMemo(() => new Fuse(orders, {
    keys: ['customer_name', 'order_id', 'customer_phone', 'cloth_type'],
    threshold: 0.3,
    minMatchCharLength: 2
  }), [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (search.trim()) {
      const searchResults = fuse.search(search.trim());
      result = searchResults.map(res => res.item);
    }
    
    return result.filter(o => {
      if (filterStatus === 'COMPLETED') return o.status === 'DELIVERED';
      if (filterStatus === 'IN_PROGRESS') return o.status !== 'DELIVERED';
      return true;
    });
  }, [orders, search, filterStatus, fuse]);

  return (
    <div className="space-y-3 md:space-y-6 pt-2 md:pt-4">
      <div className="flex bg-white dark:bg-[#1e1e1e] rounded-[20px] shadow-sm border border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-indigo-500 transition-all relative items-center h-[40px] md:h-[48px] md:max-w-[500px] md:mx-auto">
        <Search className="text-gray-400 absolute left-3 md:left-4 z-10" size={18} />
        <VoiceInput 
          value={search}
          onChange={setSearch}
          placeholder={t('search_ph')}
          className="w-full h-full pr-12 pl-10 md:pr-14 md:pl-12 outline-none text-[13px] md:text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-400 rounded-[20px]"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-12 md:right-14 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={16} className="md:w-5 md:h-5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 justify-start md:justify-center overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilterStatus('ALL')} className={`whitespace-nowrap px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-[11px] md:text-sm transition-all border ${filterStatus === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm md:scale-105' : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t('all_orders')}</button>
        <button onClick={() => setFilterStatus('IN_PROGRESS')} className={`whitespace-nowrap px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-[11px] md:text-sm transition-all border ${filterStatus === 'IN_PROGRESS' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm md:scale-105' : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t('in_progress')}</button>
        <button onClick={() => setFilterStatus('COMPLETED')} className={`whitespace-nowrap px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-[11px] md:text-sm transition-all border ${filterStatus === 'COMPLETED' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm md:scale-105' : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t('completed')}</button>
      </div>

      <div className="pb-6">
        {filteredOrders.length === 0 && <div className="text-center text-gray-400 py-16 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-sm font-bold text-xl border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">{t('no_orders')}</div>}
        
        {/* Tablet/Desktop Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px] md:gap-6">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.order_id || order.offline_id} 
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
