import { getStore, setStore, dbItems } from './db';

// const API_BASE = "http://10.236.166.70/api";  // network IP (only for LAN testing)
const API_BASE = 'http://localhost:5000/api';


export const syncOfflineActions = async () => {
  if (!navigator.onLine) return false;
  
  const actions = await getStore(dbItems.OFFLINE_ACTIONS);
  if (actions.length === 0) return true;

  try {
    const response = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actions.map(a => a.payload))
    });

    if (response.ok) {
      // Clear queue if fully synced
      await setStore(dbItems.OFFLINE_ACTIONS, []);
      // Refresh local cache directly so frontend updates real IDs immediately
      await fetchInitialData(); 
      // Fire widespread event so views auto-refresh
      window.dispatchEvent(new Event('sync-complete'));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Sync failed:", error);
    return false;
  }
};

export const fetchInitialData = async () => {
  if (navigator.onLine) {
    try {
      const ordersRes = await fetch(`${API_BASE}/orders`);
      const authRes = await fetch(`${API_BASE}/tailors`);
      
      if (ordersRes.ok && authRes.ok) {
        const orders = await ordersRes.json();
        const tailors = await authRes.json();
        await setStore(dbItems.ORDERS, orders);
        await setStore(dbItems.TAILORS, tailors);
        window.dispatchEvent(new Event('sync-complete'));
        return { orders, tailors };
      }
    } catch(e) {
      console.warn("Offline, returning local storage");
    }
  }
  
  const orders = await getStore(dbItems.ORDERS);
  const tailors = await getStore(dbItems.TAILORS);
  return { orders, tailors };
};
