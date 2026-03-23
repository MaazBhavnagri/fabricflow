import localforage from 'localforage';

localforage.config({
  name: 'FabricFlowDB',
  storeName: 'fabric_data'
});

export const dbItems = {
  ORDERS: 'orders_queue',
  TAILORS: 'tailors_list',
  OFFLINE_ACTIONS: 'offline_actions_queue'
};

export const getStore = async (key) => {
  return (await localforage.getItem(key)) || [];
};

export const setStore = async (key, value) => {
  return await localforage.setItem(key, value);
};

export const addOfflineAction = async (actionType, payload) => {
  const actions = await getStore(dbItems.OFFLINE_ACTIONS);
  const action = {
    id: Date.now().toString(),
    payload: { type: actionType, payload: { ...payload, offline_id: Date.now().toString() } }
  };
  actions.push(action);
  await setStore(dbItems.OFFLINE_ACTIONS, actions);
};
