import React, { useEffect, useState } from 'react';
import { getOrders } from '../services/orders.service';
import BrandTitle from '../components/BrandTitle';
import { Search, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20">Aprovado</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Pendente</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-brand-DEFAULT/10 text-brand-DEFAULT border border-brand-DEFAULT/20">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-white/[0.03] text-text-secondary border border-surface-border">{status || 'Pendente'}</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
            <BrandTitle text="GESTÃO DE PEDIDOS" />
          </h1>
          <p className="text-text-secondary text-base font-inter max-w-lg">
            Acompanhe e gerencie todos os pedidos da Rio Groove Store em tempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-white/10 transition-all w-64">
            <Search size={16} className="text-text-secondary opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar pedido..." 
              className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 w-full transition-all font-inter"
            />
          </div>
          <button className="px-6 py-3 bg-surface-card border border-surface-border text-text-primary rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:bg-white/[0.04] transition-all flex items-center gap-2">
            <Filter size={16} />
            FILTRAR
          </button>
        </div>
      </div>

      <div className="bg-surface-card rounded-3xl border border-surface-border flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Pedido / Cliente</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Data</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Pagamento</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">Frete</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-right">Valor</th>
                <th className="py-5 px-8 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-secondary font-inter">Carregando pedidos...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-secondary font-inter">Nenhum pedido encontrado.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-5 px-8">
                      <p className="text-[18px] font-display text-text-primary tracking-[-0.02em] leading-[1] uppercase group-hover:text-white transition-colors">#{order.order_number}</p>
                      <p className="text-[14px] font-inter text-text-secondary mt-1">{order.customer_name}</p>
                    </td>
                    <td className="py-5 px-8">
                      <p className="text-[14px] font-inter font-medium text-text-primary">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="py-5 px-8">
                      {getPaymentStatusBadge(order.payment_status)}
                    </td>
                    <td className="py-5 px-8">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-white/[0.03] text-text-secondary border border-surface-border">
                        {order.status === 'created' ? 'Aguardando' : order.status}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className="text-[14px] font-inter font-medium text-text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <Link to={`/admin/orders/${order.external_reference || order.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-card border border-surface-border text-text-secondary hover:text-white hover:border-white/20 transition-all">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
