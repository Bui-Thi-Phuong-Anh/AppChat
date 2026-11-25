import type { Chat } from '../types/chat'

type ChatItemProps = { chat: Chat; selected: boolean; onSelect: (chat: Chat) => void }

export function ChatItem({ chat, selected, onSelect }: ChatItemProps) {
  const hasUnread = (chat.unreadCount ?? 0) > 0
  return <button className={`chat-item ${selected ? 'is-selected' : ''} ${hasUnread ? 'has-unread' : ''}`} onClick={() => onSelect(chat)} aria-pressed={selected}>
    <span className="chat-avatar" style={{ backgroundColor: chat.avatarColor }}>{chat.avatar}{chat.online && <i className="online-dot" />}</span>
    <span className="chat-copy"><span className="chat-heading"><strong>{chat.name}</strong><time>{chat.time}</time></span><span className="chat-preview">{chat.lastMessage}</span></span>
    {hasUnread ? (<span className="unread-badge" aria-label={`${chat.unreadCount} tin nhắn chưa đọc`}>{chat.unreadCount}</span>) : null}  </button>
}
