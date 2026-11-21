import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "../../types/chat";
import { peopleChatService } from "../../services/peopleChatService";
import { roomService, type Room } from "../../services/roomService";
import { updateRoomDetails } from "../rooms/roomsSlice";

type ConversationHistoryState = {
  loading: boolean;
  error: string | null;
  loadedPages: number[];
  hasMore: boolean;
};

interface MessagesState {
  messages: ChatMessage[];
  historyByChat: Record<string, ConversationHistoryState>;
}

type FetchHistoryArgs = { username: string; chatId: string; page?: number };
type FetchRoomHistoryArgs = { roomName: string; chatId: string; page?: number };
type FetchHistoryResult = { chatId: string; page: number; messages: ChatMessage[] };

function canFetchPage(chatId: string, page: number, getState: () => unknown) {
  const state = getState() as { messages: MessagesState };
  const history = state.messages.historyByChat[chatId];
  return !history?.loading && !history?.loadedPages.includes(page);
}

export const fetchPeopleChatHistory = createAsyncThunk<
  FetchHistoryResult,
  FetchHistoryArgs,
  { rejectValue: string }
>("messages/fetchPeopleChatHistory", async ({ username, chatId, page = 1 }, { rejectWithValue }) => {
  try {
    const messages = await peopleChatService.getHistory(username, page);
    return { chatId, page, messages };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Không tải được lịch sử tin nhắn.");
  }
}, {
  condition: ({ chatId, page = 1 }, { getState }) => canFetchPage(chatId, page, getState),
});

export const fetchRoomChatHistory = createAsyncThunk<
  FetchHistoryResult,
  FetchRoomHistoryArgs,
  { rejectValue: string }
>("messages/fetchRoomChatHistory", async ({ roomName, chatId, page = 1 }, { dispatch, rejectWithValue }) => {
  try {
    const room: Room = await roomService.getRoomHistory(roomName, page);
    dispatch(updateRoomDetails(room));
    const messages = room.chatMess.slice(0, 50).map((message) => ({
      id: String(message.id),
      chatId,
      senderId: message.name,
      senderName: message.name,
      recipientId: message.to,
      recipientName: message.to,
      content: message.mes,
      createdAt: message.createAt,
      type: message.type,
    }));
    return { chatId, page, messages };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Không tải được lịch sử phòng chat.");
  }
}, {
  condition: ({ chatId, page = 1 }, { getState }) => canFetchPage(chatId, page, getState),
});

const initialState: MessagesState = {
  messages: [],
  historyByChat: {},
};

function initialHistory(): ConversationHistoryState {
  return { loading: false, error: null, loadedPages: [], hasMore: false };
}

function replaceHistoryPage(state: MessagesState, chatId: string, page: number, messages: ChatMessage[]) {
  const history = state.historyByChat[chatId] ?? initialHistory();
  state.historyByChat[chatId] = history;

  if (page === 1) {
    const currentMessages = state.messages.filter((message) => message.chatId === chatId);
    const loadedIds = new Set(messages.map((message) => message.id));
    const realtimeMessages = currentMessages.filter((message) => message.orderAt && !loadedIds.has(message.id));
    state.messages = state.messages.filter((message) => message.chatId !== chatId);
    state.messages.push(...messages, ...realtimeMessages);
  } else {
    const existingIds = new Set(state.messages.filter((message) => message.chatId === chatId).map((message) => message.id));
    state.messages.push(...messages.filter((message) => !existingIds.has(message.id)));
  }

  history.loading = false;
  history.error = null;
  if (!history.loadedPages.includes(page)) history.loadedPages.push(page);
  history.loadedPages.sort((a, b) => a - b);
  history.hasMore = messages.length === 50;
}

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const alreadyAdded = state.messages.some((message) =>
        message.chatId === action.payload.chatId &&
        message.id === action.payload.id &&
        message.senderId === action.payload.senderId &&
        message.recipientId === action.payload.recipientId &&
        message.content === action.payload.content &&
        message.createdAt === action.payload.createdAt,
      );
      if (!alreadyAdded) state.messages.push(action.payload);
    },
    replaceMessage: (state, action: PayloadAction<{ id: string; message: ChatMessage }>) => {
      const chatId = action.payload.message.chatId;
      const optimisticIndex = state.messages.findIndex((message) => message.chatId === chatId && message.id === action.payload.id);
      if (optimisticIndex < 0) return;
      const confirmedIndex = state.messages.findIndex((message) => message.chatId === chatId && message.id === action.payload.message.id);
      if (confirmedIndex >= 0 && confirmedIndex !== optimisticIndex) {
        state.messages.splice(optimisticIndex, 1);
        return;
      }
      state.messages[optimisticIndex] = action.payload.message;
    },
    removeMessage: (state, action: PayloadAction<{ chatId: string; id: string }>) => {
      state.messages = state.messages.filter((message) => message.chatId !== action.payload.chatId || message.id !== action.payload.id);
    },
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter((message) => message.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    const setPending = (state: MessagesState, chatId: string) => {
      const history = state.historyByChat[chatId] ?? initialHistory();
      history.loading = true;
      history.error = null;
      state.historyByChat[chatId] = history;
    };
    const setRejected = (state: MessagesState, chatId: string, error: string) => {
      const history = state.historyByChat[chatId];
      if (!history) return;
      history.loading = false;
      history.error = error;
    };

    builder
      .addCase(fetchPeopleChatHistory.pending, (state, action) => setPending(state, action.meta.arg.chatId))
      .addCase(fetchPeopleChatHistory.fulfilled, (state, action) => replaceHistoryPage(state, action.payload.chatId, action.payload.page, action.payload.messages))
      .addCase(fetchPeopleChatHistory.rejected, (state, action) => setRejected(state, action.meta.arg.chatId, action.payload ?? action.error.message ?? "Không tải được lịch sử tin nhắn."))
      .addCase(fetchRoomChatHistory.pending, (state, action) => setPending(state, action.meta.arg.chatId))
      .addCase(fetchRoomChatHistory.fulfilled, (state, action) => replaceHistoryPage(state, action.payload.chatId, action.payload.page, action.payload.messages))
      .addCase(fetchRoomChatHistory.rejected, (state, action) => setRejected(state, action.meta.arg.chatId, action.payload ?? action.error.message ?? "Không tải được lịch sử phòng chat."));
  },
});

export const { addMessage, replaceMessage, removeMessage, deleteMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
