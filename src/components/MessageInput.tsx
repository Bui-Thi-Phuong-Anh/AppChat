import {type FormEvent, useState} from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { addMessage } from "../features/messages/messagesSlice";


type MessageInputProps = { chatId: string; currentUserId: string; };

export default function MessageInput({chatId, currentUserId,}: MessageInputProps) {
    const [content, setContent] = useState("");
    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent) return;

        dispatch(addMessage({id: crypto.randomUUID(), chatId, senderId: currentUserId, content: trimmedContent, createdAt: new Date().toISOString(),}),);
        setContent("");
    };

    return (<form className="message-input-container" onSubmit={handleSubmit}>
                <input className="message-input" type="text" placeholder="Nhập tin nhắn..." value={content}
                    onChange={(event) => setContent(event.target.value)} aria-label="Nội dung tin nhắn"/>

                <button className="send-button" type="submit" disabled={!content.trim()}>Gửi</button>
            </form>);
}