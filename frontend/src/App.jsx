import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { SocketContextProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatContainer } from './components/ChatContainer';
import { CallModal } from './components/CallModal';
import { AuthModal } from './components/AuthModal';

export const App = () => {
  const { authUser, theme, checkAuth } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <SocketContextProvider>
      <div className="h-screen flex flex-col bg-base-100 text-base-content overflow-hidden select-none">
        <Navbar />

        <main className="flex-1 flex overflow-hidden relative">
          <Sidebar />
          <ChatContainer />
          {!authUser && <AuthModal />}
        </main>

        {/* Video call modal */}
        <CallModal />
      </div>
    </SocketContextProvider>
  );
};

export default App;
