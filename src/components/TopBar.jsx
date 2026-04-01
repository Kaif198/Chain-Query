import React from 'react';
import Icon from './Icon';

export default function TopBar({ mode, setMode, theme, toggleTheme, openSchema, openHistory, openGlossary }) {
  const tabs = [
    { id: 'library', label: 'Library' },
    { id: 'editor', label: 'Editor' },
    { id: 'ai', label: 'AI Assistant' },
    { id: 'ml', label: 'ML Models' },
    { id: 'dashboard', label: 'Dashboards' },
  ];
  return (
    <header className="h-12 w-full flex items-center justify-between px-4 sticky top-0 z-50 bg-surface border-b border-outline/20">
      <div className="flex items-center gap-8">
        <span className="text-lg font-semibold tracking-tight text-on-background font-headline">ChainQuery</span>
        <nav className="hidden md:flex h-12 items-center">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`h-12 flex items-center px-4 text-sm tracking-tight transition-colors border-b-2 gap-2 ${
                mode === t.id
                  ? 'text-on-background border-primary font-medium'
                  : 'text-secondary border-transparent hover:text-on-background'
              }`}
            >
              {t.id === 'dashboard' && <Icon name="dashboard" size={16} />}
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-medium text-secondary opacity-70 hidden lg:block tracking-wide">
          Made by <span className="text-on-surface opacity-100">Mohammed Kaif Ahmed</span>
        </span>
        <div className="flex items-center gap-1">
          <button onClick={openGlossary} className="p-2 text-secondary hover:bg-surface-container-high transition-colors rounded" title="Business Glossary">
          <Icon name="menu_book" />
        </button>
        <button onClick={openSchema} className="p-2 text-secondary hover:bg-surface-container-high transition-colors rounded" title="Schema Explorer">
          <Icon name="database" />
        </button>
        <button onClick={openHistory} className="p-2 text-secondary hover:bg-surface-container-high transition-colors rounded" title="Query History">
          <Icon name="history" />
        </button>
        <button onClick={toggleTheme} className="p-2 text-secondary hover:bg-surface-container-high transition-colors rounded" title="Toggle theme">
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>
        </div>
      </div>
    </header>
  );
}
