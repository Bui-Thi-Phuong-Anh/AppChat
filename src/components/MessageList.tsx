import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import MessageItem from "./MessageItem";

type MessageListProps = {
    chatId: string;
    currentUserId: string;
};

export default function MessageList({chatId, currentUserId,}: MessageListProps) {
    const messages = useSelector((state: RootState) => state.messages.messages,);
    const bottomRef = useRef<HTMLDivElement>(null);

    const chatMessages = messages.filter((message) => message.chatId === chatId)
        .slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),);

    useEffect(() => {bottomRef.current?.scrollIntoView({behavior: "smooth", block: "end",});}, [chatMessages.length, chatId]);

    return (<div className="message-list">
                {chatMessages.length === 0 ? (
                    <p className="empty-messages">Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</p>
                ) : (chatMessages.map((message) => (
                    <MessageItem key={message.id} message={message} currentUserId={currentUserId}/>
                ))
            )}
            <div ref={bottomRef} />
        </div>
    );
}