import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPeopleChatHistory } from '../features/messages/messagesSlice'
import type { AppDispatch } from '../store/store'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import type { Chat } from '../types/chat'

type ChatWindowProps = {
    chat: Chat | null
    currentUserId: string
    onMessageSent?: () => void
}

export default function ChatWindow({chat, currentUserId, onMessageSent,}: ChatWindowProps) {
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (chat?.kind !== 'people') return
        void dispatch(fetchPeopleChatHistory({username: chat.name, chatId: chat.id, page: 1}))
    }, [chat?.id, chat?.kind, chat?.name, dispatch])

    if (!chat) {
        return (<main className="chat-window chat-window-empty">
                    <div className="empty-chat">
                        <div className="empty-chat-icon"></div>
                        <h2>Chào mừng đến với AppChat</h2>
                        <p>Chưa chọn đoạn chat nào</p>
                    </div>
                </main>
        )
    }

    return (<main className="chat-window">
                <header className="chat-window-header">
                    <div className="chat-avatar" style={{ backgroundColor: chat.avatarColor }}>
                        {chat.avatar}
                    </div>

                    <div className="chat-header-info">
                        <h2>{chat.name}</h2>
                        <span>
                            {chat.online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                        </span>
                    </div>
                </header>

                <MessageList
                    chatId={chat.id}
                    currentUserId={currentUserId}
                    username={chat.name}
                    isPeopleChat={chat.kind === 'people'}
                />

                <MessageInput
                    chatId={chat.id}
                    currentUserId={currentUserId}
                    onMessageSent={onMessageSent}
                />
            </main>
    )
}
