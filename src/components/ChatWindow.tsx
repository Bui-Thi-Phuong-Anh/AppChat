import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomMembersThunk, leaveRoomThunk } from "../features/rooms/roomsSlice";
import type { AppDispatch, RootState } from "../store/store";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { Chat } from "../types/chat";

type ChatWindowProps = {
    chat: Chat | null;
    currentUserId: string;
    onMessageSent?: () => void;
    onRoomLeft?: () => void;
};

export default function ChatWindow({ chat, currentUserId, onMessageSent, onRoomLeft }: ChatWindowProps) {
    const dispatch = useDispatch<AppDispatch>();
    const leaving = useSelector((state: RootState) => state.rooms.leaving);
    const roomError = useSelector((state: RootState) => state.rooms.error);
    const [showMembers, setShowMembers] = useState(false);
    const membersState = useSelector((state: RootState) =>
        chat?.kind === "group" ? state.rooms.membersByRoom[chat.name.trim().toLowerCase()] : undefined,
    );
    const members = membersState?.members ?? [];

    if (!chat) {
        return (
            <main className="chat-window chat-window-empty">
                <div className="empty-chat">
                    <div className="empty-chat-icon"></div>
                    <p>Chưa chọn đoạn chat nào</p>
                </div>
            </main>
        );
    }

    const isPeopleChat = chat.kind === "people";
    const toggleMembers = () => {
        if (showMembers) {
            setShowMembers(false);
            return;
        }
        setShowMembers(true);
        if (chat.kind === "group") void dispatch(fetchRoomMembersThunk(chat.name));
    };

    // Rời phòng
    const handleLeaveRoom = async () => {
        if (!chat || chat.kind !== "group" || leaving) {
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn rời phòng "${chat.name}" không?`
        );

        if (!confirmed) return;

        const result = await dispatch(
            leaveRoomThunk(chat.name)
        );

        if (leaveRoomThunk.fulfilled.match(result)) {
            setShowMembers(false);
            onRoomLeft?.();
        }
    };

    return (
        <main className="chat-window">
            <header className="chat-window-header">
                <div className="chat-avatar" style={{ backgroundColor: chat.avatarColor }}>
                    {chat.avatar}
                    {isPeopleChat && chat.online && <i className="online-dot" aria-label="Trực tuyến" />}
                </div>

                <div className="chat-header-info">
                    <h2>{chat.name}</h2>
                    <span>
                        {isPeopleChat
                            ? chat.online === undefined
                                ? "Đang kiểm tra trạng thái..."
                                : chat.online
                                    ? "Đang hoạt động"
                                    : "Ngoại tuyến"
                            : "Phòng chat"}
                    </span>
                </div>

                {chat.kind === "group" && (
                    <div className="chat-header-actions">
                        <button type="button" className="show-members-button" onClick={toggleMembers} aria-expanded={showMembers}>
                            <i className="bi bi-people" aria-hidden="true"></i>
                            Thành viên ({members.length})
                        </button>
                        <button type="button" className="leave-room-header-button" onClick={handleLeaveRoom} disabled={leaving}>
                            {leaving ? "Đang rời..." : "Rời phòng"}
                        </button>
                    </div>
                )}
            </header>

            {chat.kind === "group" && roomError && (
                <div className="room-error-message" role="alert">{roomError}</div>
            )}

            <div className="chat-content">
                <div className="chat-main">
                    <MessageList
                        chatId={chat.id}
                        currentUserId={currentUserId}
                        username={chat.name}
                        isPeopleChat={isPeopleChat}
                        isRoomChat={chat.kind === "group"}
                    />
                    <MessageInput
                        chatId={chat.id}
                        currentUserId={currentUserId}
                        isPeopleChat={isPeopleChat}
                        onMessageSent={onMessageSent}
                    />
                </div>

                {chat.kind === "group" && showMembers && (
                    <aside className="room-members-panel" aria-label={`Thành viên nhóm ${chat.name}`}>
                        <div className="room-members-panel-header">
                            <h3>Thành viên ({members.length})</h3>
                            <button type="button" onClick={() => setShowMembers(false)} aria-label="Đóng danh sách thành viên">×</button>
                        </div>

                        {membersState?.loading ? (
                            <p className="room-members-status">Đang tải thành viên...</p>
                        ) : membersState?.error ? (
                            <div className="room-members-status" role="alert">
                                <p>{membersState.error}</p>
                                <button type="button" onClick={() => void dispatch(fetchRoomMembersThunk(chat.name))}>Thử lại</button>
                            </div>
                        ) : members.length > 0 ? (
                            members.map((member) => (
                                <div className="room-member-item" key={`${member.id}-${member.name}`}>
                                    <span className="chat-avatar room-member-avatar" style={{ backgroundColor: "#989bff" }} aria-hidden="true">
                                        {member.name.trim().slice(0, 2).toUpperCase()}
                                    </span>
                                    <span className="room-member-name">{member.name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="room-members-status">Nhóm chưa có thành viên.</p>
                        )}
                    </aside>
                )}
            </div>
        </main>
    );
}
