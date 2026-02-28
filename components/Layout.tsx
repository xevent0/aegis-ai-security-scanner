
import React, { useState } from 'react';
import { Shield, LayoutDashboard, Search, History, Settings, Bell, User, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'scan', icon: Search, label: 'New Scan' },
    { id: 'history', icon: History, label: 'Scan History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 border-r border-slate-800 bg-slate-900 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">AEGIS AI</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-400' : 'group-hover:text-slate-200'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Security Auditor</p>
              <p className="text-xs text-slate-500 truncate">Free Tier</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
