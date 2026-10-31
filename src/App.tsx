import { useMemo, useState } from 'react'
import { ChatList } from './components/ChatList'
import { Sidebar } from './components/Sidebar'
import { mockChats } from './data/mockChats'
import type { Chat } from './types/chat'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [activeSection, setActiveSection] = useState('Tin nh\u1EAFn')
  const filteredChats = useMemo(() => mockChats.filter((chat) => chat.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query])

  return <main className="app-shell">
    <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
    <ChatList chats={filteredChats} selectedId={selectedChat?.id} onSelect={setSelectedChat} query={query} onQueryChange={setQuery} />
    <section className="conversation-panel" aria-label="N&#7897;i dung cu&#7897;c tr&#242; chuy&#7879;n">
      {selectedChat ? <div className="conversation-placeholder"><span className="placeholder-avatar" style={{ backgroundColor: selectedChat.avatarColor }}>{selectedChat.avatar}</span><h2>{selectedChat.name}</h2><p>Kh&#244;ng gian tr&#242; chuy&#7879;n c&#7911;a b&#7841;n s&#7869; xu&#7845;t hi&#7879;n &#7903; &#273;&#226;y.</p><span className="integration-note">Khu v&#7921;c d&#224;nh cho n&#7897;i dung chat</span></div> : <div className="conversation-placeholder"><span className="welcome-icon"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 22a15 15 0 0 1-15 15H12l-3 5v-11a15 15 0 1 1 29-9Z"/><path d="M18 22h.1M24 22h.1M30 22h.1"/></svg></span><h2>Ch&#224;o b&#7841;n, Anh!</h2><p>Ch&#7885;n m&#7897;t cu&#7897;c tr&#242; chuy&#7879;n &#273;&#7875; b&#7855;t &#273;&#7847;u k&#7871;t n&#7889;i.</p></div>}
    </section>
  </main>
}

export default App
