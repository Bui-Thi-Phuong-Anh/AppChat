
import {type WebSocketMessage, websocketService,} from "./websocket";

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

type RoomEvent = "CREATE_ROOM" | "JOIN_ROOM";

const RESPONSE_TIMEOUT = 10000;

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
        throw new Error(`Dữ liệu phòng không hợp lệ. Các trường backend trả về: ${Object.keys(data).join(", ")}.`);
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

function requestRoom(event: RoomEvent, name: string): Promise<Room> {
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

            websocketService.send(event, {
                name: roomName,
            });
        } catch (error) {
            finish(() => {
                reject(error instanceof Error ? error : new Error("Không thể gửi yêu cầu WebSocket."));
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
};
