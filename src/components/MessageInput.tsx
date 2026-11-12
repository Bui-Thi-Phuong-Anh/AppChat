import { type FormEvent, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { addMessage } from "../features/messages/messagesSlice";
import {websocketService} from "../services/websocket.ts";

type SendChatResponse = {
    name: string;
    to: string;
    mes: string;
    type: number;
};

type MessageInputProps = {
    chatId: string;
    currentUserId: string;
    onMessageSent?: () => void;
};

export default function MessageInput({chatId, currentUserId, onMessageSent,}: MessageInputProps) {
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent || sending) return;

        setSending(true);

        let unsubscribe: () => void = () => {};

        const timeout = setTimeout(() => {
            unsubscribe();
            setSending(false);
            alert("Máy chủ không phản hồi khi gửi tin nhắn.");
        }, 10000);

        unsubscribe = websocketService.on("SEND_CHAT", (message) => {
            clearTimeout(timeout);
            unsubscribe();
            setSending(false);

            if (message.status !== "success") {
                alert(message.mes || "Gửi tin nhắn thất bại.");
                return;
            }

            const response = message.data as SendChatResponse;

            dispatch(addMessage({
                id: crypto.randomUUID(),
                chatId,
                senderId: currentUserId,
                content: response.mes || trimmedContent,
                createdAt: new Date().toISOString(),
            }));

            setContent("");
            onMessageSent?.();
        });

        try {
            websocketService.send("SEND_CHAT", {
                type: "people",
                to: chatId,
                mes: trimmedContent,
            });
        } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            setSending(false);

            alert(error instanceof Error ? error.message : "Không thể gửi tin nhắn.");
        }
    };

    return (
        <form className="message-input-container" onSubmit={handleSubmit}>
            <input
                className="message-input"
                type="text"
                placeholder="Nhập tin nhắn..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                aria-label="Nội dung tin nhắn"
                disabled={sending}
            />

            <button className="send-button" type="submit" disabled={!content.trim() || sending}>
                {sending ? "Đang gửi..." : "Gửi"}
            </button>
        </form>
    );
}