import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "../../types/chat";
import { peopleChatService } from "../../services/peopleChatService";

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
type FetchHistoryResult = { chatId: string; page: number; messages: ChatMessage[] };

export const fetchPeopleChatHistory = createAsyncThunk<
  FetchHistoryResult,
  FetchHistoryArgs,
  { rejectValue: string }
>("messages/fetchPeopleChatHistory", async ({ username, chatId, page = 1 }, { rejectWithValue }) => {
  try {
    const messages = await peopleChatService.getHistory(username, page);
    return { chatId, page, messages };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Không thể tải lịch sử tin nhắn.");
  }
}, {
  condition: ({ chatId, page = 1 }, { getState }) => {
    const state = getState() as { messages: MessagesState };
    const history = state.messages.historyByChat[chatId];
    return !history?.loading && !history?.loadedPages.includes(page);
  },
});

const initialState: MessagesState = {
  messages: [],
  historyByChat: {},
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter((message) => message.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeopleChatHistory.pending, (state, action) => {
        const chatId = action.meta.arg.chatId;
        const history = state.historyByChat[chatId] ?? {
          loading: false,
          error: null,
          loadedPages: [],
          hasMore: false,
        };
        history.loading = true;
        history.error = null;
        state.historyByChat[chatId] = history;
      })
      .addCase(fetchPeopleChatHistory.fulfilled, (state, action) => {
        const { chatId, page, messages } = action.payload;
        const history = state.historyByChat[chatId] ?? {
          loading: false,
          error: null,
          loadedPages: [],
          hasMore: false,
        };
        state.historyByChat[chatId] = history;

        if (page === 1) {
          state.messages = state.messages.filter((message) => message.chatId !== chatId);
          state.messages.push(...messages);
        } else {
          const existingIds = new Set(state.messages.filter((message) => message.chatId === chatId).map((message) => message.id));
          state.messages.push(...messages.filter((message) => !existingIds.has(message.id)));
        }

        history.loading = false;
        history.error = null;
        if (!history.loadedPages.includes(page)) history.loadedPages.push(page);
        history.loadedPages.sort((a, b) => a - b);
        history.hasMore = messages.length === 50;
      })
      .addCase(fetchPeopleChatHistory.rejected, (state, action) => {
        const chatId = action.meta.arg.chatId;
        const history = state.historyByChat[chatId];
        if (!history) return;
        history.loading = false;
        history.error = action.payload ?? action.error.message ?? "Không thể tải lịch sử tin nhắn.";
      });
  },
});

export const { addMessage, deleteMessage } = messagesSlice.actions;
export default messagesSlice.reducer;
