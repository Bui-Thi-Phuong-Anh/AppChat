import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPeopleChatHistory } from "../features/messages/messagesSlice";
import type { AppDispatch } from "../store/store";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { Chat } from "../types/chat";
import type { RootState } from "../store/store";
import { leaveRoomThunk } from "../features/rooms/roomsSlice";

type ChatWindowProps = {
    chat: Chat | null;
    currentUserId: string;
    onMessageSent?: () => void;
    onRoomLeft?: () => void;
};

export default function ChatWindow({chat, currentUserId, onMessageSent, onRoomLeft,}: ChatWindowProps) {
    const dispatch = useDispatch<AppDispatch>();
    const leaving = useSelector((state: RootState) => state.rooms.leaving);

    const handleLeaveRoom = async () => {
        if (!chat || chat.kind !== "group" || leaving) return;

        const confirmed = window.confirm(`Bạn có chắc chắn muốn rời phòng "${chat.name}" không?`);

        if (!confirmed) return;

        const result = await dispatch(leaveRoomThunk(chat.name));

        if (leaveRoomThunk.fulfilled.match(result)) {
            onRoomLeft?.();
        }
    };

    // Tải lịch sử tin nhắn cá nhân.
    useEffect(() => {
        if (!chat || chat.kind !== "people") return;

        void dispatch(fetchPeopleChatHistory({username: chat.name, chatId: chat.id, page: 1,}));
    }, [chat?.id, chat?.kind, chat?.name, dispatch]);

    if (!chat) {
        return (
            <main className="chat-window chat-window-empty">
                <div className="empty-chat">
                    <div className="empty-chat-icon"></div>
                    <h2>Chào mừng đến với AppChat</h2>
                    <p>Chưa chọn đoạn chat nào</p>
                </div>
            </main>
        );
    }

    const isPeopleChat = chat.kind === "people";

    return (
        <main className="chat-window">
            <header className="chat-window-header">
                <div className="chat-avatar" style={{ backgroundColor: chat.avatarColor }}>
                    {chat.avatar}
                </div>

                <div className="chat-header-info">
                    <h2>{chat.name}</h2>
                    <span>
                        {isPeopleChat ? chat.online ? "Đang hoạt động" : "Ngoại tuyến" : "Phòng chat"}
                    </span>
                </div>

                {chat.kind === "group" && (
                    <button type="button" className="leave-room-header-button" onClick={handleLeaveRoom} disabled={leaving}>
                        {leaving ? "Đang rời..." : "Rời phòng"}
                    </button>
                )}
            </header>

            <MessageList
                chatId={chat.id}
                currentUserId={currentUserId}
                username={chat.name}
                isPeopleChat={isPeopleChat}
            />

            <MessageInput
                chatId={chat.id}
                currentUserId={currentUserId}
                isPeopleChat={isPeopleChat}
                onMessageSent={onMessageSent}
            />
        </main>
    );
}
