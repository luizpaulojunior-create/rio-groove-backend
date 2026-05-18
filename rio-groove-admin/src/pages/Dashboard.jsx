import React from 'react';
import { Calendar, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight, MapPin, Ticket } from 'lucide-react';
import BrandTitle from '../components/BrandTitle';

const Dashboard = () => {
  const stats = [
    { name: 'RECEITA TOTAL', value: '142K', icon: DollarSign, change: '+12.5%', changeType: 'increase' },
    { name: 'EVENTOS ATIVOS', value: '12', icon: Calendar, change: '+2.4%', changeType: 'increase' },
    { name: 'PÚBLICO TOTAL', value: '24.5K', icon: Users, change: '+18.2%', changeType: 'increase' },
    { name: 'ENGAJAMENTO', value: '84%', icon: Activity, change: '-4.1%', changeType: 'decrease' },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-6xl md:text-[80px] font-display text-text-primary uppercase tracking-[-0.03em] leading-[0.92] mb-4">
            <BrandTitle text="VISÃO GERAL" />
          </h1>
          <p className="text-text-secondary text-base font-inter max-w-lg">
            Sistema operacional interno da Rio Groove Store. Monitore coleções, eventos e dados de público em tempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-transparent border border-surface-border text-text-primary rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:bg-white/[0.04] transition-all">
            VER RELATÓRIOS
          </button>
          <button className="px-8 py-3 bg-brand-DEFAULT text-white rounded-full font-oswald text-[14px] uppercase tracking-[0.12em] font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(255,42,31,0.2)]">
            NOVA OPERAÇÃO
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-surface-card rounded-3xl border border-surface-border p-8 backdrop-blur-xl relative group hover:-translate-y-[2px] hover:bg-surface-cardHover hover:shadow-[0_0_30px_rgba(255,42,31,0.05)] transition-all duration-300">
            
            <div className="flex items-center justify-between mb-6">
              <p className="text-[12px] font-oswald font-medium text-text-secondary uppercase tracking-[0.12em]">{stat.name}</p>
              <stat.icon size={20} className="text-text-secondary opacity-40" strokeWidth={1.5} />
            </div>
            
            <p className="text-[64px] font-display text-text-primary tracking-[-0.03em] leading-[0.9] mb-4">{stat.value}</p>
            
            <div className="flex items-center gap-1.5 font-inter text-[14px] font-medium">
              <span className={`flex items-center ${stat.changeType === 'increase' ? 'text-[#00FF9D]' : 'text-brand-DEFAULT'}`}>
                {stat.changeType === 'increase' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {stat.change}
              </span>
              <span className="text-text-secondary text-xs">vs. último mês</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Events Table */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase">
              <BrandTitle text="OPERAÇÕES RECENTES" />
            </h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              { id: 1, name: 'ZÉ PILINTRA', type: 'STREETWEAR EXCLUSIVE', date: '15 MAI', location: 'ONLINE', tickets: '95%', status: 'ATIVO' },
              { id: 2, name: 'BAILE CHARME', type: 'DROP LIMITADO', date: '18 MAI', location: 'LOJA FÍSICA', tickets: '72%', status: 'VENDAS' },
              { id: 3, name: 'PEDRA DO SAL', type: 'COLAB', date: '20 MAI', location: 'ONLINE', tickets: 'AGUARDANDO', status: 'BREVE' },
            ].map((event) => (
              <div key={event.id} className="bg-surface-card border border-surface-border rounded-2xl p-6 flex items-center justify-between group hover:bg-surface-cardHover hover:-translate-y-[2px] transition-all duration-300">
                <div className="flex-1">
                  <p className="text-[28px] font-display text-text-primary tracking-[-0.02em] leading-[1] uppercase group-hover:text-white transition-colors">{event.name}</p>
                  <p className="text-[12px] font-oswald font-medium tracking-[0.12em] text-text-secondary mt-2 uppercase">{event.type}</p>
                </div>
                
                <div className="flex-[0.8] hidden sm:block">
                  <p className="text-[14px] font-inter font-medium text-text-primary">{event.date}</p>
                  <div className="flex items-center gap-1.5 text-[12px] font-inter text-text-secondary mt-1">
                    <MapPin size={12} className="text-text-secondary opacity-60" />
                    {event.location}
                  </div>
                </div>
                
                <div className="flex-[0.5] hidden md:flex items-center gap-2">
                  <Ticket size={16} className="text-text-secondary opacity-40" />
                  <span className="text-[14px] font-inter font-medium text-text-primary">{event.tickets}</span>
                </div>
                
                <div className="flex justify-end">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-oswald font-medium uppercase tracking-[0.1em] border ${
                    event.status === 'ATIVO' 
                      ? 'bg-brand-DEFAULT/10 text-brand-DEFAULT border-brand-DEFAULT/20' 
                      : 'bg-white/[0.03] text-text-secondary border-surface-border'
                  }`}>
                    {event.status === 'ATIVO' && <span className="w-1.5 h-1.5 rounded-full bg-brand-DEFAULT animate-pulse shadow-[0_0_8px_rgba(255,42,31,0.8)]" />}
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex flex-col">
          <div className="mb-6">
            <h2 className="text-[14px] font-oswald font-medium tracking-[0.12em] text-text-primary uppercase">
              <BrandTitle text="FEED DA EQUIPE" />
            </h2>
          </div>
          
          <div className="bg-surface-card rounded-3xl border border-surface-border p-8 flex-1">
            <div className="space-y-8">
              {[
                { title: 'NOVA VENDA', detail: 'Camiseta Zé Pilintra - GG', time: 'AGORA', active: true },
                { title: 'ALERTA DE ESTOQUE', detail: 'Tamanho M esgotando', time: '1H ATRÁS', active: false },
                { title: 'LOGIN NO SISTEMA', detail: 'Diretor Criativo', time: '5H ATRÁS', active: false },
                { title: 'RELATÓRIO', detail: 'Exportação Mensal Concluída', time: 'ONTEM', active: false },
              ].map((activity, i) => (
                <div key={i} className="flex gap-5 relative group">
                  {i !== 3 && <div className="absolute left-[3px] top-6 w-[2px] h-[calc(100%-8px)] bg-white/[0.04]" />}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 relative z-10 transition-all duration-300 ${activity.active ? 'bg-brand-DEFAULT shadow-[0_0_10px_rgba(255,42,31,0.6)]' : 'bg-surface-border'}`} />
                  <div>
                    <p className={`text-[12px] font-oswald font-medium tracking-[0.12em] uppercase ${activity.active ? 'text-text-primary' : 'text-text-secondary'}`}>{activity.title}</p>
                    <p className="text-[14px] font-inter text-text-secondary mt-1">{activity.detail}</p>
                    <p className="text-[10px] font-oswald font-medium text-text-secondary/50 mt-3 uppercase tracking-widest">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-10 w-full py-3 bg-transparent border border-surface-border hover:bg-white/[0.04] text-[12px] font-oswald font-medium tracking-[0.12em] uppercase text-text-primary transition-all rounded-full">
              VER TODAS ATIVIDADES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
