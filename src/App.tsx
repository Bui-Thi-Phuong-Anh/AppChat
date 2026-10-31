import { useMemo, useState } from 'react'
import { ChatList } from './components/ChatList'
import { Sidebar } from './components/Sidebar'
import { mockChats } from './data/mockChats'
import type { Chat } from './types/chat'
import './App.css'
import ChatWindow from './components/ChatWindow'

function App() {
  const [query, setQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeSection, setActiveSection] = useState('Tin nh\u1EAFn')
  const filteredChats = useMemo(() => mockChats.filter((chat) => chat.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query])

  return <main className="app-shell">
    <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
    <ChatList chats={filteredChats} selectedId={selectedChat?.id} onSelect={setSelectedChat} query={query} onQueryChange={setQuery} />
    <section className="conversation-panel" aria-label="N&#7897;i dung cu&#7897;c tr&#242; chuy&#7879;n">
      <ChatWindow chat={selectedChat} currentUserId="user-001"/>
    </section>
  </main>
}

export default App
