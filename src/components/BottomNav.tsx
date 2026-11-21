import React from 'react';
import { Home, Search, Library, Podcast } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'explore', label: 'Buscar', icon: Search },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'podcasts', label: 'Podcasts', icon: Podcast },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-sidebar)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] safe-bottom">
      <div className="grid grid-cols-4 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'library' &&
              (activeTab === 'favorites' || activeTab.startsWith('playlist:')));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive ? 'text-[var(--theme-accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
