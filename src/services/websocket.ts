export interface WebSocketMessage<T = unknown> {
    event: string;
    status?: "success" | "error";
    data: T;
    mes?: string;
}

type MessageCallback = (message: WebSocketMessage) => void;
type StatusCallback = (status: WebSocketState) => void;

export type WebSocketState = | "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";

class WebSocketService {
    private socket: WebSocket | null = null;
    private status: WebSocketState = "DISCONNECTED";
    private messageListeners = new Map<string, Set<MessageCallback>>();
    private statusListeners = new Set<StatusCallback>();
    private readonly url = 'wss://chat.longapp.io.vn/chat/chat';

    getStatus(): WebSocketState {
        return this.status;
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    connect(): Promise<void> {
        if (this.socket?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (this.socket?.readyState === WebSocket.CONNECTING) {
            return new Promise((resolve, reject) => {
                const unsubscribe = this.onStatus((status) => {
                    if (status === "CONNECTED") {
                        unsubscribe();
                        resolve();
                    }

                    if (status === "ERROR" || status === "DISCONNECTED") {
                        unsubscribe();
                        reject(new Error("Không thể kết nối WebSocket."));
                    }
                });
            });
        }

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.url);
            this.socket = ws;
            this.notifyStatus("CONNECTING");

            ws.onopen = () => {
                if (this.socket !== ws) return;

                this.notifyStatus("CONNECTED");
                resolve();
            };

            ws.onmessage = (event: MessageEvent<string>) => {
                try {
                    const raw: unknown = JSON.parse(event.data);

                    if (typeof raw !== "object" || raw === null) {
                        return;
                    }

                    const response = raw as Record<string, unknown>;

                    const nestedData =
                        typeof response.data === "object" &&
                        response.data !== null ? response.data as Record<string, unknown> : null;

                    const message =
                        nestedData &&
                        typeof nestedData.event === "string" ? nestedData : response;

                    if (typeof message.event !== "string") {
                        return;
                    }

                    const status = response.status ?? message.status;
                    const mes = response.mes ?? message.mes;

                    this.notifyMessage({
                        event: message.event,
                        status: status === "success" || status === "error" ? status : undefined,
                        data: message.data,
                        mes: typeof mes === "string" ? mes : undefined,
                    });
                } catch {
                    // Bỏ qua response không phải JSON hợp lệ.
                }
            };

            ws.onerror = () => {
                if (this.socket !== ws) return;

                this.notifyStatus("ERROR");
                reject(new Error("Kết nối WebSocket thất bại."));
            };

            ws.onclose = () => {
                if (this.socket !== ws) return;

                this.socket = null;
                this.notifyStatus("DISCONNECTED");
            };
        });
    }

    send(event: string, data: unknown = {}): void {
        if (!this.isConnected()) {
            throw new Error("WebSocket chưa kết nối.");
        }

        const request = {
            action: "onchat",
            data: {
                event,
                data,
            },
        };

        this.socket!.send(JSON.stringify(request));
    }

    on(event: string, callback: MessageCallback): () => void {
        if (!this.messageListeners.has(event)) {
            this.messageListeners.set(event, new Set());
        }

        this.messageListeners.get(event)!.add(callback);

        return () => {
            const listeners = this.messageListeners.get(event);

            listeners?.delete(callback);

            if (listeners?.size === 0) {
                this.messageListeners.delete(event);
            }
        };
    }

    onStatus(callback: StatusCallback): () => void {
        this.statusListeners.add(callback);

        return () => {
            this.statusListeners.delete(callback);
        };
    }

    private notifyMessage(message: WebSocketMessage): void {
        this.messageListeners.get(message.event)?.forEach((callback) => callback(message));
    }

    private notifyStatus(status: WebSocketState): void {
        this.status = status;

        this.statusListeners.forEach((callback) => {
            callback(status);
        });
    }

    disconnect(): void {
        const socket = this.socket;

        this.socket = null;

        if (socket) {
            socket.close();
        }

        this.notifyStatus("DISCONNECTED");
    }
}

export const websocketService = new WebSocketService();
