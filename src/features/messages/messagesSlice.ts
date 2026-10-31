import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "../../types/chat";

interface MessagesState {
    messages: ChatMessage[];
}

const initialState: MessagesState = {
    messages: [
        {
            id: "msg-001",
            chatId: "minh-anh",
            senderId: "user-002",
            content: "Chào bạn! Bạn đang làm gì vậy?",
            createdAt: "2026-10-31T08:00:00.000Z",
        },
        {
            id: "msg-002",
            chatId: "minh-anh",
            senderId: "user-001",
            content: "Mình đang làm bài tập nhóm.",
            createdAt: "2026-10-31T08:01:00.000Z",
        },
        {
            id: "msg-003",
            chatId: "minh-anh",
            senderId: "user-002",
            content: "Bạn làm đến đâu rồi?",
            createdAt: "2026-10-31T08:02:00.000Z",
        },
    ],
};

const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<ChatMessage>) =>
        {state.messages.push(action.payload);},

        deleteMessage: (state, action: PayloadAction<string>) =>
        {state.messages = state.messages.filter((message) => message.id !== action.payload,);},
    },
});

export const { addMessage, deleteMessage } = messagesSlice.actions;

export default messagesSlice.reducer;