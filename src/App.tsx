import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { ChatList } from "./components/ChatList";
import { ContactDirectory } from "./components/ContactDirectory";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import ChatWindow from "./components/ChatWindow";
import { mockChats } from "./data/mockChats";
import { clearCredentials, setCredentials } from "./features/auth/authSlice";
import { authService } from "./services/authService";
import type { AppDispatch, RootState } from "./store/store";
import type { Chat } from "./types/chat";
import "./App.css";

function ChatWorkspace({ currentUserId }: { currentUserId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [activeSection, setActiveSection] = useState("Tin nhắn");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const messages = useSelector((state: RootState) => state.messages.messages);

  const handleLogout = () => {
    try {
      authService.logout();
    } catch {
      // Clear local authentication even when the WebSocket is unavailable.
    }
    dispatch(clearCredentials());
    navigate("/login", { replace: true });
  };

  const filteredChats = useMemo(() => mockChats
    .map((chat) => {
      const latestMessage = messages
        .filter((message) => message.chatId === chat.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return {
        ...chat,
        lastMessage: latestMessage
          ? `${latestMessage.senderId === currentUserId ? "Bạn: " : ""}${latestMessage.content}`
          : chat.lastMessage,
        time: latestMessage
          ? new Date(latestMessage.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          : chat.time,
      };
    })
    .filter((chat) => chat.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
  [query, messages, currentUserId]);

  return <main className={`app-shell ${theme === "dark" ? "theme-dark" : ""} ${activeSection === "Danh bạ" ? "contacts-view" : ""}`}>
    <Sidebar
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      settingsOpen={settingsOpen}
      onSettingsToggle={() => setSettingsOpen((open) => !open)}
      theme={theme}
      onThemeChange={setTheme}
      onLogout={handleLogout}
    />

    {activeSection === "Danh bạ" ? <ContactDirectory /> : <>
      <ChatList
        chats={filteredChats}
        selectedId={selectedChat?.id}
        onSelect={setSelectedChat}
        query={query}
        onQueryChange={setQuery}
      />
      <section className="conversation-panel" aria-label="Nội dung cuộc trò chuyện">
        <ChatWindow chat={selectedChat} currentUserId={currentUserId} />
      </section>
    </>}
  </main>;
}

function ProtectedChatRoute() {
  const { isAuthenticated, userId } = useSelector((state: RootState) => state.auth);
  return isAuthenticated && userId
    ? <ChatWorkspace currentUserId={userId} />
    : <Navigate to="/login" replace />;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handleLogin = (userId: string, reLoginCode: string) => {
    dispatch(setCredentials({ userId, reLoginCode }));
    navigate("/chat", { replace: true });
  };

  return <Routes>
    <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} />
    <Route path="/login" element={isAuthenticated
      ? <Navigate to="/chat" replace />
      : <Login onLogin={handleLogin} onRegister={() => navigate("/register")} />} />
    <Route path="/register" element={isAuthenticated
      ? <Navigate to="/chat" replace />
      : <Register onBackToLogin={() => navigate("/login")} />} />
    <Route path="/chat" element={<ProtectedChatRoute />} />
    <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} />
  </Routes>;
}

export default App;
