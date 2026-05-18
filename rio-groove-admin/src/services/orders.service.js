import api from './api';

export const getOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const getOrderById = async (reference) => {
  const response = await api.get(`/orders/${reference}`);
  return response.data;
};

export const updateOrderStatus = async (reference, status) => {
  // Exemplo de como seria a rota de atualização (ainda precisa ser criada no backend se necessário)
  const response = await api.patch(`/orders/${reference}/status`, { status });
  return response.data;
};
