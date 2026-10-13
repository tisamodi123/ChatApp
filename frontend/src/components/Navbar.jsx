import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { MessageSquare, Volume2, VolumeX, LogOut, Moon, Sun } from 'lucide-react';

export const Navbar = () => {
  const { authUser, logout, theme, setTheme } = useAuthStore();
  const { soundEnabled, toggleSound } = useChatStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-base-100 border-b border-base-300 h-14 px-4 flex items-center justify-between select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm tracking-tight text-base-content">ChatApp</h1>
          <span className="text-[11px] text-base-content/50 font-medium hidden sm:inline">• Real-time Team Chat</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
          title={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar & Logout */}
        {authUser && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-base-300">
            <div className="avatar">
              <div className="w-7 h-7 rounded-full bg-base-300">
                <img
                  src={authUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.fullName || authUser.username)}`}
                  alt={authUser.username}
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-base-content hidden sm:inline">
              {authUser.fullName || authUser.username}
            </span>
            <button
              onClick={logout}
              className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10 ml-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
