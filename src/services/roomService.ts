
import {type WebSocketMessage, websocketService,} from "./websocket";

import { ensureAuthenticatedConnection } from "./peopleChatService";
import type { ChatMessage } from "../types/chat";

export interface RoomMember {
    id: number;
    name: string;
}

export interface RoomMessage {
    id: number;
    name: string;
    to: string;
    mes: string;
    createAt: string;
    type: number;
}

export interface Room {
    id?: number | string;
    name: string;
    own?: string | number;
    createTime?: string;
    user: RoomMember[];
    chatMess: RoomMessage[];
}

type RoomEvent = "CREATE_ROOM" | "JOIN_ROOM" | "OUT_ROOM" | "GET_ROOM_CHAT_MES";

const RESPONSE_TIMEOUT = 10000;
let roomHistoryQueue: Promise<void> = Promise.resolve();
let roomSendQueue: Promise<void> = Promise.resolve();

class RoomSendConfirmationMissingError extends Error {}

function mapRoomMessage(message: RoomMessage, roomName: string): ChatMessage {
    return {
        id: String(message.id),
        chatId: roomName,
        senderId: message.name,
        senderName: message.name,
        recipientId: message.to,
        recipientName: message.to,
        content: message.mes,
        createdAt: message.createAt,
        type: message.type,
    };
}

function mapSentRoomMessage(
    data: Partial<RoomMessage> | null,
    sender: string,
    roomName: string,
    content: string,
): ChatMessage {
    return {
        id: String(data?.id ?? crypto.randomUUID()),
        chatId: roomName,
        senderId: data?.name ?? sender,
        senderName: data?.name ?? sender,
        recipientId: data?.to ?? roomName,
        recipientName: data?.to ?? roomName,
        content: data?.mes ?? content,
        createdAt: data?.createAt ?? new Date().toISOString(),
        type: data?.type ?? 1,
    };
}

function requestRoomMessage(sender: string, roomName: string, content: string): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
        let settled = false;
        let unsubscribeMessage = () => {};
        let unsubscribeStatus = () => {};
        const cleanup = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            unsubscribeMessage();
            unsubscribeStatus();
        };
        const timeout = setTimeout(() => {
            cleanup();
            reject(new RoomSendConfirmationMissingError("Chưa nhận được xác nhận từ máy chủ."));
        }, RESPONSE_TIMEOUT);

        unsubscribeMessage = websocketService.on("SEND_CHAT", (response) => {
            const data = response.data as Partial<RoomMessage> | null;
            const message = response.mes ?? "";
            if (data?.type !== undefined && data.type !== 1) return;
            if (data?.name && data.name.toLowerCase() !== sender.toLowerCase()) return;
            if (data?.to && data.to.toLowerCase() !== roomName.toLowerCase()) return;
            if (data?.mes && data.mes !== content) return;

            if (response.status === "error") {
                if (!data && !/room|phòng/i.test(message)) return;
                cleanup();
                reject(new Error(message || "Không gửi được tin nhắn vào phòng."));
                return;
            }

            if (response.status !== "success" && !(data?.to && data.mes === content)) return;
            cleanup();
            resolve(response);
        });

        unsubscribeStatus = websocketService.onStatus((status) => {
            if (status === "ERROR" || status === "DISCONNECTED") {
                cleanup();
                reject(new RoomSendConfirmationMissingError("Mất kết nối khi gửi tin nhắn."));
            }
        });

        try {
            websocketService.send("SEND_CHAT", { type: "room", to: roomName, mes: content });
        } catch {
            cleanup();
            reject(new Error("Mất kết nối. Tin nhắn chưa được gửi."));
        }
    });
}

function isObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function normalizeRoom(payload: unknown): Room {
    let data = payload;

    if (!isObject(data)) {
        throw new Error("Dữ liệu phòng không hợp lệ.");
    }

    if (isObject(data.room)) {
        data = data.room;
    } else if (!("name" in data) && isObject(data.data)) {
        data = data.data;
    }

    if (!isObject(data)) {
        throw new Error("Dữ liệu phòng không hợp lệ.");
    }

    const user = data.user ?? data.userList;
    const chatMess = data.chatMess ?? data.chatData;

    if (typeof data.name !== "string" || !data.name.trim() || !Array.isArray(user)) {
        throw new Error(`Dữ liệu phòng không hợp lệ. Backend trả về: ${Object.keys(data).join(", ")}.`);
    }

    return {
        ...(typeof data.id === "number" ||
        typeof data.id === "string" ? { id: data.id } : {}),
        name: data.name,
        ...(typeof data.own === "string" ||
        typeof data.own === "number" ? { own: data.own } : {}),
        ...(typeof data.createTime === "string" ? { createTime: data.createTime } : {}),
        user: user as RoomMember[],
        chatMess: Array.isArray(chatMess) ? chatMess as RoomMessage[] : [],
    };
}

function requestRoom(event: RoomEvent, name: string, page = 1): Promise<Room> {
    return new Promise((resolve, reject) => {
        let completed = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let unsubscribe = () => {};

        const cleanup = () => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
                timeout = undefined;
            }

            unsubscribe();
        };

        const finish = (callback: () => void) => {
            if (completed) return;

            completed = true;
            cleanup();
            callback();
        };

        const handleResponse = (message: WebSocketMessage) => {
            if (message.status === "error") {
                finish(() => {
                    reject(new Error(message.mes || "Thao tác với phòng thất bại."));
                });
                return;
            }

            if (message.status !== "success") {
                finish(() => {
                    reject(new Error("Máy chủ trả về trạng thái không hợp lệ."));
                });
                return;
            }

            try {
                const room = normalizeRoom(message.data);

                finish(() => resolve(room));
            } catch (error) {
                finish(() => {
                    reject(error instanceof Error ? error : new Error("Không thể xử lý dữ liệu phòng."));
                });
            }
        };

        try {
            const roomName = name.trim();

            if (!roomName) {
                throw new Error("Tên phòng không được để trống.");
            }

            if (!websocketService.isConnected()) {
                throw new Error("WebSocket chưa kết nối. Vui lòng thử lại.");
            }

            unsubscribe = websocketService.on(event, handleResponse);

            timeout = setTimeout(() => {
                finish(() => {
                    reject(new Error("Máy chủ không phản hồi. Vui lòng thử lại."));
                });
            }, RESPONSE_TIMEOUT);

            websocketService.send(event, event === "GET_ROOM_CHAT_MES"
                ? { name: roomName, page }
                : { name: roomName });
        } catch (error) {
            finish(() => {
                reject(error instanceof Error ? error : new Error("Không thể gửi yêu cầu WebSocket."));
            });
        }
    });
}

function requestLeaveRoom(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let completed = false;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let unsubscribe = () => {};

        const cleanup = () => {
            if (timeout !== undefined) {
                clearTimeout(timeout);
                timeout = undefined;
            }

            unsubscribe();
        };

        const finish = (callback: () => void) => {
            if (completed) return;

            completed = true;
            cleanup();
            callback();
        };

        const handleResponse = (message: WebSocketMessage) => {
            finish(() => {
                if (message.status === "success") {
                    resolve();
                } else {
                    reject(new Error(message.mes || "Không thể rời phòng chat."));
                }
            });
        };

        try {
            const roomName = name.trim();

            if (!roomName) {
                throw new Error("Tên phòng không được để trống.");
            }

            if (!websocketService.isConnected()) {
                throw new Error("WebSocket chưa kết nối. Vui lòng thử lại.");
            }

            unsubscribe = websocketService.on("OUT_ROOM", handleResponse);

            timeout = setTimeout(() => {
                finish(() => {
                    reject(new Error("Máy chủ không phản hồi. Vui lòng thử lại."));
                });
            }, RESPONSE_TIMEOUT);

            websocketService.send("OUT_ROOM", {
                name: roomName,
            });
        } catch (error) {
            finish(() => {
                reject(error instanceof Error ? error : new Error("Không thể gửi yêu cầu rời phòng."));
            });
        }
    });
}

export const roomService = {
    createRoom(name: string): Promise<Room> {
        return requestRoom("CREATE_ROOM", name);
    },

    joinRoom(name: string): Promise<Room> {
        return requestRoom("JOIN_ROOM", name);
    },

    leaveRoom(name: string): Promise<void> {
        return requestLeaveRoom(name);
    },

    async getRoomHistory(name: string, page = 1): Promise<Room> {
        const roomName = name.trim();
        if (!roomName) throw new Error("Chưa chọn phòng chat.");

        await ensureAuthenticatedConnection();
        const request = roomHistoryQueue.then(() => requestRoom("GET_ROOM_CHAT_MES", roomName, page));
        roomHistoryQueue = request.then(() => undefined, () => undefined);
        return request;
    },

    async sendRoomMessage(sender: string, roomName: string, content: string, knownMessageIds: string[] = []) {
        const message = content.trim();
        const target = roomName.trim();
        const senderName = sender.trim() || localStorage.getItem("userId")?.trim() || "";
        if (!message) throw new Error("Nhập nội dung tin nhắn.");

        await ensureAuthenticatedConnection();
        const request = roomSendQueue.then(() => requestRoomMessage(senderName, target, message));
        roomSendQueue = request.then(() => undefined, () => undefined);

        try {
            const response = await request;
            const data = response.data as Partial<RoomMessage> | null;
            return mapSentRoomMessage(data, senderName, target, message);
        } catch (error) {
            if (!(error instanceof RoomSendConfirmationMissingError)) throw error;

            try {
                const room = await this.getRoomHistory(target, 1);
                const knownIds = new Set(knownMessageIds);
                const confirmed = room.chatMess
                    .slice(0, 50)
                    .find((item) =>
                        !knownIds.has(String(item.id)) &&
                        item.name.toLowerCase() === senderName.toLowerCase() &&
                        item.to.toLowerCase() === target.toLowerCase() &&
                        item.mes === message,
                    );
                return confirmed ? mapRoomMessage(confirmed, target) : null;
            } catch {
                return null;
            }
        }
    },
};
