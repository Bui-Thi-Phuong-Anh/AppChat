import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { ChatList } from "./components/ChatList";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import ChatWindow from "./components/ChatWindow";

import { mockChats } from "./data/mockChats";
import type { Chat } from "./types/chat";
import type { RootState } from "./store/store";

import "./App.css";

function App() {
    const [query, setQuery] = useState("");
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [activeSection, setActiveSection] = useState("Tin nhắn");

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const messages = useSelector(
        (state: RootState) => state.messages.messages
    );

    const handleLogin = (userId: string, code: string) => {
        setCurrentUserId(userId);

        console.log("Đăng nhập thành công!");
        console.log("User:", userId);
        console.log("RE_LOGIN_CODE:", code);
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

    if (!currentUserId) {
        return <Login onLogin={handleLogin} />;
    }

    return (<main className="app-shell">
                <Sidebar activeSection={activeSection} onSectionChange={setActiveSection}/>

                <ChatList chats={filteredChats} selectedId={selectedChat?.id} onSelect={setSelectedChat}
                          query={query} onQueryChange={setQuery}/>

                <section className="conversation-panel" aria-label="Nội dung cuộc trò chuyện">
                    <ChatWindow chat={selectedChat} currentUserId={currentUserId}/>
                </section>
            </main>
    );
}

export default App;
