import { websocketService, type WebSocketMessage } from "./websocket";

type UserCheckResponse = { status: boolean };

let onlineCheckQueue: Promise<void> = Promise.resolve();

function parseOnlineStatus(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "online", "active"].includes(normalized)) return true;
        if (["false", "0", "offline", "inactive"].includes(normalized)) return false;
    }
    return undefined;
}

function readOnlineStatus(data: unknown): boolean {
    if (typeof data === "object" && data !== null) {
        const response = data as Record<string, unknown>;
        for (const value of [response.status, response.online, response.isOnline]) {
            const status = parseOnlineStatus(value);
            if (status !== undefined) return status;
        }
        if (response.data !== undefined) return readOnlineStatus(response.data);
    } else {
        const status = parseOnlineStatus(data);
        if (status !== undefined) return status;
    }

}

function sendRequest<T>(event: string, data: unknown,): Promise<WebSocketMessage<T>> {
    return new Promise((resolve, reject) => {
        let unsubscribe: () => void = () => {};

        const timeout = setTimeout(() => {
            unsubscribe();
            reject(new Error(`Máy chủ không phản hồi sự kiện ${event}.`));
        }, 10000);

        unsubscribe = websocketService.on(event, (message) => {
            clearTimeout(timeout);
            unsubscribe();

            if (message.status === "error") {
                reject(new Error(message.mes || `${event} thất bại.`));
                return;
            }

            resolve(message as WebSocketMessage<T>);
        });

        try {
            websocketService.send(event, data);
        } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
        }
    });
}

export const userService = {
    async checkUserExist(username: string): Promise<boolean> {
        const response = await sendRequest<UserCheckResponse>(
            "CHECK_USER_EXIST",
            { user: username },
        );

        return response.data?.status === true;
    },

    async checkUserOnline(username: string): Promise<boolean> {
        const request = onlineCheckQueue.then(async () => {
            const response = await sendRequest<unknown>(
                "CHECK_USER_ONLINE",
                { user: username },
            );
            return readOnlineStatus(response.data);
        });
        onlineCheckQueue = request.then(() => undefined, () => undefined);
        return request;
    },
};
