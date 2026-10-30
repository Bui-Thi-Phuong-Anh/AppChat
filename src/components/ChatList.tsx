import type { Chat } from '../types/chat'
import { ChatItem } from './ChatItem'

type ChatListProps = { chats: Chat[]; selectedId?: string; onSelect: (chat: Chat) => void; query: string; onQueryChange: (query: string) => void }

export function ChatList({ chats, selectedId, onSelect, query, onQueryChange }: ChatListProps) {
  return <section className="chat-list-panel" aria-label="Danh s&#225;ch cu&#7897;c tr&#242; chuy&#7879;n">
    <header className="chat-list-header"><div className="list-title-row"><div><p className="eyebrow">KH&#212;NG GIAN C&#7910;A B&#7840;N</p><h1>Tin nh&#7855;n</h1></div><button className="compose-button" aria-label="T&#7841;o tin nh&#7855;n m&#7899;i">+</button></div>
      <label className="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="T&#236;m ki&#7871;m cu&#7897;c tr&#242; chuy&#7879;n" aria-label="T&#236;m ki&#7871;m theo t&#234;n" />{query && <button onClick={() => onQueryChange('')} aria-label="X&#243;a t&#236;m ki&#7871;m">&#215;</button>}</label>
      <div className="section-heading"><h2>T&#7845;t c&#7843; tin nh&#7855;n</h2><span>{chats.length}</span></div>
    </header>
    <div className="chat-items">{chats.length ? chats.map((chat) => <ChatItem key={chat.id} chat={chat} selected={chat.id === selectedId} onSelect={onSelect} />) : <div className="list-empty"><span className="empty-search-icon">&#8981;</span><strong>Kh&#244;ng t&#236;m th&#7845;y cu&#7897;c tr&#242; chuy&#7879;n</strong><p>Th&#7917; t&#236;m b&#7857;ng m&#7897;t t&#234;n kh&#225;c nh&#233;.</p></div>}</div>
  </section>
}
