import type { ChatMessage } from "../types/chat";
import { websocketService, type WebSocketMessage } from "./websocket";

type ApiPeopleMessage = {
  id: string | number;
  name: string;
  to: string;
  mes: string;
  createAt: string;
  type: number;
};

let historyRequestQueue: Promise<void> = Promise.resolve();

function mapMessage(message: ApiPeopleMessage, chatId: string): ChatMessage {
  return {
    id: String(message.id),
    chatId,
    senderId: message.name,
    senderName: message.name,
    recipientId: message.to,
    recipientName: message.to,
    content: message.mes,
    createdAt: message.createAt,
    type: message.type,
  };
}

function validateMessages(data: unknown): ApiPeopleMessage[] {
  if (!Array.isArray(data)) {
    throw new Error("Không thể tải lịch sử tin nhắn.");
  }

  return data.map((item: unknown) => {
    if (!item || typeof item !== "object") {
      throw new Error("Dữ liệu tin nhắn không hợp lệ");
    }

    const message = item as Partial<ApiPeopleMessage>;
    if (
      (typeof message.id !== "string" && typeof message.id !== "number") ||
      typeof message.name !== "string" ||
      typeof message.to !== "string" ||
      typeof message.mes !== "string" ||
      typeof message.createAt !== "string" ||
      typeof message.type !== "number"
    ) {
      throw new Error("Dữ liệu tin nhắn không đầy đủ.");
    }

    return message as ApiPeopleMessage;
  });
}

function requestHistory(username: string, page: number): Promise<WebSocketMessage> {
  const request = historyRequestQueue.then(() => new Promise<WebSocketMessage>((resolve, reject) => {
    let unsubscribe = () => {};
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      unsubscribe();
      window.clearTimeout(timeout);
    };

    unsubscribe = websocketService.on("GET_PEOPLE_CHAT_MES", (message) => {
      cleanup();
      resolve(message);
    });

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Không nhận được phản hồi từ máy chủ."));
    }, 10000);

    try {
      websocketService.send("GET_PEOPLE_CHAT_MES", { name: username, page });
    } catch (error) {
      cleanup();
      reject(error);
    }
  }));

  historyRequestQueue = request.then(() => undefined, () => undefined);
  return request;
}

export const peopleChatService = {
  async getHistory(username: string, page = 1): Promise<ChatMessage[]> {
    if (!username.trim()) throw new Error("Vui lòng chọn người trò chuyện.");
    const pageNumber = Number.isInteger(page) && page > 0 ? page : 1;

    await websocketService.connect();
    const response = await requestHistory(username, pageNumber);

    if (response.status === "error") {
      const message = response.mes ?? "Không tải được lịch sử tin nhắn.";
      if (/no (message|history)|không có tin nhắn|chưa có tin nhắn/i.test(message)) {
        return [];
      }
      throw new Error(message);
    }

    const messages = validateMessages(response.data);
    return messages.slice(0, 50).map((message) => mapMessage(message, username));
  },
};
