import { useMemo, useState } from 'react'
import { ChatList } from './components/ChatList'
import { Sidebar } from './components/Sidebar'
import { mockChats } from './data/mockChats'
import type { Chat } from './types/chat'
import './App.css'
import ChatWindow from './components/ChatWindow';
import { useSelector } from "react-redux";
import type { RootState } from "./store/store";

function App() {
  const [query, setQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeSection, setActiveSection] = useState('Tin nh\u1EAFn')

  const currentUserId = "user-001";
  const messages = useSelector((state: RootState) => state.messages.messages);
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
                ? `${latestMessage.senderId === currentUserId ? "Bạn: " : ""}${latestMessage.content}` : chat.lastMessage,
            time: latestMessage
                ? new Date(latestMessage.createdAt).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                )
                : chat.time,
          };
        })
        .filter((chat) =>
            chat.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
        );
  }, [query, messages]);

  return <main className="app-shell">
    <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
    <ChatList chats={filteredChats} selectedId={selectedChat?.id} onSelect={setSelectedChat} query={query} onQueryChange={setQuery} />
    <section className="conversation-panel" aria-label="N&#7897;i dung cu&#7897;c tr&#242; chuy&#7879;n">
      <ChatWindow chat={selectedChat} currentUserId={currentUserId}/>
    </section>
  </main>
}

export default App
