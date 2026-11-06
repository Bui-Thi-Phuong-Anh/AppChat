import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { ChatList } from "./components/ChatList";
import { ContactDirectory } from "./components/ContactDirectory";
import { Sidebar } from "./components/Sidebar";
import { authService } from "./services/authService";
import { Login } from "./components/Login";
import ChatWindow from "./components/ChatWindow";

import { mockChats } from "./data/mockChats";
import type { Chat } from "./types/chat";
import type { RootState } from "./store/store";

import "./App.css";
import { Register } from "./components/Register";

function App() {
    const [query, setQuery] = useState("");
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [activeSection, setActiveSection] = useState("Tin nhắn");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showRegister, setShowRegister] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const messages = useSelector(
        (state: RootState) => state.messages.messages
    );

    const handleLogin = (userId: string, code: string) => {
        setCurrentUserId(userId);

        console.log("Đăng nhập thành công!");
        console.log("User:", userId);
        console.log("RE_LOGIN_CODE:", code);
    };

    const handleLogout = () => {
        try {
            authService.logout();
        } catch {
            // Clear the local session even when the WebSocket is unavailable.
        }
        setCurrentUserId(null);
        setSelectedChat(null);
        setQuery("");
        setActiveSection("Tin nhắn");
        setSettingsOpen(false);
        setShowRegister(false);
    };

    const filteredChats = useMemo(() => {
        return mockChats
            .map((chat) => {
                const latestMessage = messages
                    .filter((message) => message.chatId === chat.id)
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )[0];

                return {
                    ...chat,

                    lastMessage: latestMessage
                        ? `${latestMessage.senderId === currentUserId ? "Bạn: " : ""}${latestMessage.content}`
                        : chat.lastMessage,

                    time: latestMessage
                        ? new Date(latestMessage.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            }
                        )
                        : chat.time,
                };
            })
            .filter((chat) =>
                chat.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
            );
    }, [query, messages, currentUserId]);

    if (!currentUserId && showRegister) {
        return (<Register onBackToLogin={() => setShowRegister(false)}/>);
    }

    if (!currentUserId) {
        return (<Login onLogin={handleLogin} onRegister={() => setShowRegister(true)}/>);
    }

    return (<main className={`app-shell ${theme === "dark" ? "theme-dark" : ""} ${activeSection === "Danh bạ" ? "contacts-view" : ""}`}>
                <Sidebar activeSection={activeSection} onSectionChange={setActiveSection}
                         settingsOpen={settingsOpen} onSettingsToggle={() => setSettingsOpen((open) => !open)}
                         theme={theme} onThemeChange={setTheme} onLogout={handleLogout}/>

                {activeSection === "Danh bạ" ? (
                    <ContactDirectory />
                ) : (
                    <>
                        <ChatList chats={filteredChats} selectedId={selectedChat?.id} onSelect={setSelectedChat}
                                  query={query} onQueryChange={setQuery}/>

                        <section className="conversation-panel" aria-label="Nội dung cuộc trò chuyện">
                            <ChatWindow chat={selectedChat} currentUserId={currentUserId}/>
                        </section>
                    </>
                )}
            </main>
    );
}

export default App;
