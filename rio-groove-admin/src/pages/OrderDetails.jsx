import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../services/orders.service';
import BrandTitle from '../components/BrandTitle';
import { ArrowLeft, Package, CreditCard, Truck, User, Copy, MessageCircle, ExternalLink, Activity, Mail, MapPin } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(id);
      setOrderData(data.order);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
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

  const getShippingStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20">Entregue</span>;
      case 'posted':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-blue-500/10 text-blue-500 border border-blue-500/20">Pedido Postado</span>;
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-brand-DEFAULT/10 text-brand-DEFAULT border border-brand-DEFAULT/20">Etiqueta Paga</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Aguardando Pagamento</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-oswald font-medium uppercase tracking-[0.1em] bg-white/[0.03] text-text-secondary border border-surface-border">{status || 'Aguardando'}</span>;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <div className="p-10 text-center text-text-secondary font-inter">Carregando central operacional...</div>;
  }

  if (!orderData) {
    return <div className="p-10 text-center text-text-secondary font-inter">Pedido não encontrado.</div>;
  }

  const { items = [], ...order } = orderData;

  const isPaid = order.payment_status === 'approved' || order.payment_status === 'paid';
  const shippingStatus = order.shipping_status || 'created';
  
  const isEnvioCriado = shippingStatus !== 'created' || !!order.shipment_id;
  const isEtiquetaPaga = ['paid', 'posted', 'delivered'].includes(shippingStatus);
  const isPedidoEnviado = ['posted', 'delivered'].includes(shippingStatus);
  const isEntregue = shippingStatus === 'delivered';

  const getStepStatus = (step) => {
    let lastConcluded = 1;
    if (isEntregue) lastConcluded = 6;
    else if (isPedidoEnviado) lastConcluded = 5;
    else if (isEtiquetaPaga) lastConcluded = 4;
    else if (isEnvioCriado) lastConcluded = 3;
    else if (isPaid) lastConcluded = 2;

    if (step <= lastConcluded) return 'concluded';
    if (step === lastConcluded + 1) return 'current';
    return 'pending';
  };

  const getStepStyle = (step) => {
    const status = getStepStatus(step);
    if (status === 'concluded') {
      return {
        dot: 'bg-[#00FF9D] shadow-[0_0_10px_rgba(0,255,157,0.4)]',
        text: 'text-text-primary'
      };
    } else if (status === 'current') {
      return {
        dot: 'bg-brand-DEFAULT shadow-[0_0_10px_rgba(255,42,31,0.6)]',
        text: 'text-brand-DEFAULT'
      };
    } else {
      return {
        dot: 'bg-surface-primary border-2 border-surface-border',
        text: 'text-text-secondary'
      };
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary hover:text-white transition-colors mb-8 uppercase">
        <ArrowLeft size={16} />
        VOLTAR PARA PEDIDOS
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
            <BrandTitle text={`PEDIDO #${order.order_number}`} />
          </h1>
          <div className="flex items-center gap-3 text-text-secondary text-[14px] font-inter">
            <span>{new Date(order.created_at).toLocaleString('pt-BR')}</span>
            <span className="w-1 h-1 rounded-full bg-surface-border"></span>
            <span className="text-white font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}</span>
            <span className="w-1 h-1 rounded-full bg-surface-border"></span>
            <button onClick={() => copyToClipboard(order.order_number)} className="flex items-center gap-1.5 hover:text-white transition-colors group">
              <Copy size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              Copiar ID
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-transparent border border-surface-border text-text-primary rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:bg-white/[0.04] transition-all">
            IMPRIMIR PEDIDO
          </button>
          <button className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)]">
            ATUALIZAR STATUS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Itens do Pedido & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl shadow-lg">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase mb-6 flex items-center gap-2">
              <Package size={18} className="text-text-secondary" />
              PRODUTOS
            </h2>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-5 pb-5 border-b border-white/[0.02] last:border-0 last:pb-0 group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="w-20 h-20 object-cover rounded-xl border border-surface-border" />
                  ) : (
                    <div className="w-20 h-20 bg-surface-primary border border-surface-border rounded-xl flex items-center justify-center">
                      <Package size={24} className="text-text-secondary opacity-30" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-[20px] font-display uppercase tracking-[-0.01em] text-text-primary group-hover:text-brand-DEFAULT transition-colors">{item.product_name}</p>
                    <div className="flex gap-4 text-[13px] font-inter text-text-secondary mt-1">
                      {item.size && <span>Tamanho: <strong className="text-text-primary font-medium">{item.size}</strong></span>}
                      {item.color && <span>Cor: <strong className="text-text-primary font-medium">{item.color}</strong></span>}
                      <span>Qtd: <strong className="text-text-primary font-medium">{item.quantity}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-inter font-medium text-text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.line_total || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/[0.05] flex flex-col gap-3 max-w-sm ml-auto">
              <div className="flex justify-between text-[14px] font-inter text-text-secondary">
                <span>Subtotal</span>
                <span className="text-text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.subtotal_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-[14px] font-inter text-text-secondary">
                <span>Frete ({order.shipping_method || 'Padrão'})</span>
                <span className="text-text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.shipping_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-[24px] font-display uppercase tracking-[-0.01em] text-text-primary mt-4 pt-4 border-t border-surface-border">
                <span>Total</span>
                <span className="text-brand-DEFAULT">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl shadow-lg">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase mb-8 flex items-center gap-2">
              <Activity size={18} className="text-text-secondary" />
              TIMELINE OPERACIONAL
            </h2>
            
            <div className="flex flex-col gap-6 pl-2">
              <div className="relative border-l border-surface-border pl-6 pb-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(1).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(1).text} mb-1`}>PEDIDO CRIADO</p>
                <p className="text-[14px] font-inter text-text-secondary">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>
              
              <div className="relative border-l border-surface-border pl-6 pb-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(2).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(2).text} mb-1`}>PAGAMENTO APROVADO</p>
                <p className="text-[14px] font-inter text-text-secondary">{isPaid ? 'Pagamento confirmado' : 'Aguardando confirmação'}</p>
              </div>
              
              <div className="relative border-l border-surface-border pl-6 pb-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(3).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(3).text} mb-1`}>ENVIO CRIADO</p>
                <p className="text-[14px] font-inter text-text-secondary">{isEnvioCriado ? 'Envio preparado' : 'Aguardando integração'}</p>
              </div>

              <div className="relative border-l border-surface-border pl-6 pb-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(4).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(4).text} mb-1`}>ETIQUETA PAGA</p>
                <p className="text-[14px] font-inter text-text-secondary">{isEtiquetaPaga ? 'Etiqueta de envio gerada' : 'Aguardando pagamento no Melhor Envio'}</p>
              </div>

              <div className="relative border-l border-surface-border pl-6 pb-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(5).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(5).text} mb-1`}>PEDIDO ENVIADO</p>
                <p className="text-[14px] font-inter text-text-secondary">{isPedidoEnviado ? 'Pacote postado na transportadora' : 'Aguardando postagem'}</p>
              </div>

              <div className="relative pl-6">
                <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${getStepStyle(6).dot}`}></div>
                <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${getStepStyle(6).text} mb-1`}>ENTREGUE</p>
                <p className="text-[14px] font-inter text-text-secondary">{isEntregue ? 'Pedido entregue ao cliente' : 'Aguardando entrega ao destinatário'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Informações de Operação */}
        <div className="flex flex-col gap-8">
          
          {/* Cliente */}
          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl shadow-lg">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase mb-6 flex items-center gap-2">
              <User size={18} className="text-text-secondary" />
              CLIENTE
            </h2>
            <div className="flex flex-col gap-5 font-inter text-[14px] text-text-secondary">
              <div>
                <p className="text-[20px] font-display uppercase tracking-[-0.01em] text-text-primary mb-1">{order.customer_name}</p>
                {order.customer_cpf && <p className="text-[13px]">CPF: {order.customer_cpf}</p>}
              </div>
              
              <div className="flex items-center justify-between group bg-white/[0.02] p-3 rounded-xl border border-surface-border hover:bg-white/[0.04] transition-colors">
                <span className="truncate mr-4 text-text-primary">{order.customer_email}</span>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(order.customer_email)} className="text-text-secondary hover:text-white transition-colors" title="Copiar email">
                    <Copy size={16} />
                  </button>
                  <a href={`mailto:${order.customer_email}`} className="text-text-secondary hover:text-white transition-colors" title="Enviar email">
                    <Mail size={16} />
                  </a>
                </div>
              </div>
              
              <div className="flex items-center justify-between group bg-white/[0.02] p-3 rounded-xl border border-surface-border hover:bg-white/[0.04] transition-colors">
                <span className="text-text-primary">{order.customer_phone}</span>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(order.customer_phone)} className="text-text-secondary hover:text-white transition-colors" title="Copiar telefone">
                    <Copy size={16} />
                  </button>
                  <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[#00FF9D]/70 hover:text-[#00FF9D] transition-colors" title="Chamar no WhatsApp">
                    <MessageCircle size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl shadow-lg">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase mb-6 flex items-center gap-2">
              <CreditCard size={18} className="text-text-secondary" />
              PAGAMENTO
            </h2>
            <div className="flex flex-col gap-4 font-inter text-[14px] text-text-secondary">
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-surface-border">
                <span>Status</span>
                {getPaymentStatusBadge(order.payment_status)}
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-surface-border">
                <span>Método</span>
                <span className="capitalize text-text-primary font-medium">{order.payment_provider || 'Manual'}</span>
              </div>
              {order.payment_id && (
                <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-surface-border">
                  <span>ID Transação</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-text-primary">{order.payment_id}</span>
                    <button onClick={() => copyToClipboard(order.payment_id)} className="text-text-secondary hover:text-white transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logística */}
          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl shadow-lg">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase mb-6 flex items-center gap-2">
              <Truck size={18} className="text-text-secondary" />
              LOGÍSTICA
            </h2>
            <div className="flex flex-col gap-4 font-inter text-[14px] text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Status</span>
                {getShippingStatusBadge(shippingStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span>Modalidade</span>
                <span className="text-text-primary font-medium">{order.shipping_method || 'Não definido'}</span>
              </div>
              
              {order.shipment_id && (
                <div className="flex items-center justify-between">
                  <span>Envio ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-text-primary font-bold">{order.shipment_id}</span>
                    <button onClick={() => copyToClipboard(order.shipment_id)} className="text-text-secondary hover:text-white transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {order.tracking_code && (
                <div className="flex items-center justify-between">
                  <span>Rastreio</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-brand-DEFAULT font-bold">{order.tracking_code}</span>
                    <a href={`https://melhorrastreio.com.br/rastreio/${order.tracking_code}`} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-white transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => copyToClipboard(order.tracking_code)} className="text-text-secondary hover:text-white transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-6 border-t border-surface-border">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary uppercase">
                    ENDEREÇO
                  </p>
                  <button onClick={() => copyToClipboard(`${order.shipping_street}, ${order.shipping_number} - ${order.shipping_city}/${order.shipping_state} CEP: ${order.shipping_cep}`)} className="text-text-secondary hover:text-white transition-colors" title="Copiar Endereço">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-surface-border text-text-primary leading-relaxed">
                  <p className="font-medium">{order.shipping_street}, {order.shipping_number}</p>
                  {order.shipping_complement && <p>{order.shipping_complement}</p>}
                  <p>{order.shipping_neighborhood}</p>
                  <p>{order.shipping_city} - {order.shipping_state}</p>
                  <p className="text-text-secondary mt-2 text-[12px]">CEP: {order.shipping_cep}</p>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-3">
                <a href="https://melhorenvio.com.br/carrinho" target="_blank" rel="noopener noreferrer" className="w-full py-3.5 bg-surface-primary border border-surface-border hover:bg-white/[0.04] text-[12px] font-oswald font-medium tracking-[0.12em] uppercase text-text-primary transition-all rounded-xl flex items-center justify-center gap-2 group">
                  <ExternalLink size={16} className="text-text-secondary group-hover:text-white transition-colors" /> 
                  CONTINUAR EXPEDIÇÃO
                </a>
                <button className="w-full py-3.5 bg-transparent border border-transparent hover:bg-white/[0.02] text-[12px] font-oswald font-medium tracking-[0.12em] uppercase text-text-secondary transition-all rounded-xl flex items-center justify-center gap-2">
                  MARCAR COMO ENVIADO
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
