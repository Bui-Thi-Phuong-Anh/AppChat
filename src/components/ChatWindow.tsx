import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { leaveRoomThunk } from "../features/rooms/roomsSlice";
import type { AppDispatch, RootState } from "../store/store";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { Chat } from "../types/chat";
import {roomService,type RoomMember,} from "../services/roomService";

type ChatWindowProps = {
    chat: Chat | null;
    currentUserId: string;
    onMessageSent?: () => void;
    onRoomLeft?: () => void;
};

export default function ChatWindow({chat, currentUserId, onMessageSent, onRoomLeft,}: ChatWindowProps) {
    const dispatch = useDispatch<AppDispatch>();

    const leaving = useSelector(
        (state: RootState) => state.rooms.leaving
    );

    const roomError = useSelector(
        (state: RootState) => state.rooms.error
    );

    const [members, setMembers] = useState<RoomMember[]>([]);
    const [showMembers, setShowMembers] = useState(false);

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
            setMembers([]);
            setShowMembers(false);
            onRoomLeft?.();
        }
    };

    // Lấy danh sách thành viên
    useEffect(() => {
        if (!chat || chat.kind !== "group") {
            return;
        }

        let cancelled = false;

        roomService.getRoomHistory(chat.name, 1)
            .then((room) => {
                if (cancelled) return;
                setMembers(room.user);
            })
            .catch(() => {
                if (cancelled) return;
                setMembers([]);
            });

        return () => {
            cancelled = true;
        };
    }, [chat]);

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
                        {isPeopleChat ? chat.online ? "Đang hoạt động" : "Ngoại tuyến" : `Phòng chat`}
                    </span>
                </div>

                {chat.kind === "group" && (
                    <div className="chat-header-actions">
                        <button type="button" className="show-members-button" onClick={() => setShowMembers((prev) => !prev)}>
                            <i className="bi bi-people"></i>
                            Thành viên ({members.length})
                        </button>

                        <button type="button" className="leave-room-header-button" onClick={handleLeaveRoom} disabled={leaving}>
                            {leaving ? "Đang rời..." : "Rời phòng"}
                        </button>
                    </div>
                )}
            </header>

            {chat.kind === "group" && roomError && (
                <div className="room-error-message" role="alert">
                    {roomError}
                </div>
            )}

            {chat.kind === "group" && showMembers && (
                <div className="room-members-panel">
                    <div className="room-members-panel-header">
                        <h3>Thành viên ({members.length})</h3>

                        <button type="button" onClick={() => setShowMembers(false)}>
                            x
                        </button>
                    </div>

                    {members.length > 0 ? (
                        members.map((member) => (
                            <div className="room-member-item" key={member.id}>
                                <div className="room-member-avatar">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>

                                <span>{member.name}</span>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có thông tin thành viên.</p>
                    )}
                </div>
            )}

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
        </main>
    );
}
