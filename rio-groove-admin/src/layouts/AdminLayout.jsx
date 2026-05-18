import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Search, Bell, ShoppingBag, Layers } from 'lucide-react';
import BrandTitle from '../components/BrandTitle';

const AdminLayout = () => {
  const location = useLocation();

  const navigation = [
    { name: 'OVERVIEW', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'PEDIDOS', href: '/admin/orders', icon: ShoppingBag },
    { name: 'PRODUTOS', href: '/admin/products', icon: ShoppingBag },
    { name: 'COLEÇÕES', href: '/admin/collections', icon: Layers },
    { name: 'PÚBLICO', href: '/admin/users', icon: Users },
    { name: 'CONFIGURAÇÕES', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-surface-primary text-text-primary font-sans selection:bg-brand-DEFAULT/30 selection:text-white overflow-hidden">
      
      {/* Sidebar (260px) */}
      <aside className="w-[260px] bg-surface-primary border-r border-surface-border flex flex-col z-20">
        {/* Logo */}
        <div className="flex items-center h-20 px-8 border-b border-transparent">
          <h1 className="text-xl font-display uppercase tracking-[-0.03em] leading-[0.92] text-text-primary">
            <BrandTitle text="RIO GROOVE STORE" />
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-8 px-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-oswald text-[14px] uppercase tracking-[0.12em] font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-DEFAULT/10 text-white shadow-[0_0_15px_rgba(255,42,31,0.05)]' 
                        : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <item.icon 
                      size={18} 
                      className={isActive ? 'text-brand-DEFAULT' : 'text-text-secondary opacity-70'} 
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Logout */}
        <div className="p-6">
          <button className="flex items-center gap-4 px-4 py-3 w-full text-left text-text-secondary rounded-xl hover:bg-white/[0.04] hover:text-white font-oswald text-[14px] uppercase tracking-[0.12em] font-medium transition-all duration-200 group">
            <LogOut size={18} className="text-text-secondary opacity-70 group-hover:text-white transition-colors" strokeWidth={1.5} />
            SAIR
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-y-auto">
        
        {/* Header (80px) */}
        <header className="h-[80px] border-b border-surface-border flex items-center justify-between px-10 bg-surface-primary/80 backdrop-blur-xl sticky top-0 z-30">
          
          <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-white/10 transition-all w-64">
            <Search size={16} className="text-text-secondary opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 w-full transition-all font-inter"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-text-secondary hover:text-white transition-colors">
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-brand-DEFAULT rounded-full shadow-[0_0_8px_rgba(255,42,31,0.6)]"></span>
            </button>
            <div className="h-6 w-px bg-surface-border"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors font-inter">Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-xs font-oswald text-text-primary tracking-widest group-hover:border-white/20 transition-all">
                RG
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-10 relative z-10 w-full">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
