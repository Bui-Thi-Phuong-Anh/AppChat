export type Chat = {
  id: string
  name: string
  avatar: string
  avatarColor: string
  lastMessage: string
  time: string
  unreadCount?: number
  online?: boolean
}

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
};