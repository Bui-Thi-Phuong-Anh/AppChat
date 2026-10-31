import type { ChatMessage } from "../types/chat";

type MessageItemProps = {
    message: ChatMessage;
    currentUserId: string;
};

export default function MessageItem({message, currentUserId,}: MessageItemProps) {
    const isSent = message.senderId === currentUserId;

    const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {hour: "2-digit", minute: "2-digit",});

    return (<div className={`message-row ${isSent ? "sent" : "received"}`}>
            <div className="message-bubble">
                <p className="message-content">{message.content}</p>
                <span className="message-time">{time}</span>
            </div>
        </div>
    );
}