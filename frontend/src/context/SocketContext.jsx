import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingState, setTypingState] = useState(null); // { user, roomId, receiverId }
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (authUser) {
      const newSocket = io('/', {
        query: {
          userId: authUser._id,
          username: authUser.username,
        },
      });

      setSocket(newSocket);

      newSocket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('userTyping', (data) => {
        setTypingState(data);
      });

      newSocket.on('userStoppedTyping', (data) => {
        setTypingState((prev) => {
          if (prev && prev.user?._id === data.user?._id) return null;
          return prev;
        });
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingState }}>
      {children}
    </SocketContext.Provider>
  );
};
