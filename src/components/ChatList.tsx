import { useEffect, useMemo, useState } from "react";
import type { Chat } from "../types/chat";
import { ChatItem } from "./ChatItem";
import { userService } from "../services/userService";

import { CreateRoomModal } from "./rooms/CreateRoomModal";
import { JoinRoomModal } from "./rooms/JoinRoomModal";
import type { Room } from "../services/roomService";

type ChatListProps = {
  chats: Chat[];
  selectedId?: string;
  onSelect: (chat: Chat) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearchUser: (username: string) => void;
  searchingUser: boolean;
  onRoomReady: (room: Room) => void;
  chatFilter: "all" | "unread";
  onChatFilterChange: (filter: "all" | "unread") => void;
  totalUnread: number;
};

type SearchResult = {
  keyword: string;
  username: string | null;
  error: string;
};

export function ChatList({chats, selectedId, onSelect, query, onQueryChange, onSearchUser, searchingUser, onRoomReady, chatFilter, onChatFilterChange, totalUnread,}: ChatListProps) {  const [checkingKeyword, setCheckingKeyword] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);

  const keyword = query.trim();

  // Các cuộc trò chuyện hiện có
  const filteredChats = useMemo(() =>
          chats.filter((chat) =>
              chat.name.toLowerCase().includes(keyword.toLowerCase())
          ), [chats, keyword]
  );

  // Kiểm tra username có tồn tại trong danh sách chat hay chưa.
  const existingChat = useMemo(() =>
          chats.find(
              (chat) =>
                  chat.name.toLowerCase() === keyword.toLowerCase()
          ), [chats, keyword]
  );

  // Chỉ lấy kết quả tương ứng với từ khóa hiện tại.
  const currentSearchResult = searchResult?.keyword.toLowerCase() === keyword.toLowerCase() ? searchResult : null;
  const foundUser = currentSearchResult?.username ?? null;
  const searchError = currentSearchResult?.error ?? "";

  // Tìm kiếm tài khoản sau khi người dùng ngừng gõ 500ms.
  useEffect(() => {
    if (!keyword || existingChat) {
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      if (cancelled) return;

      setCheckingKeyword(keyword);

      try {
        const exists = await userService.checkUserExist(keyword);

        if (cancelled) return;

        setSearchResult({
          keyword,
          username: exists ? keyword : null,
          error: exists ? "" : "Không tìm thấy tài khoản.",
        });
      } catch {
        if (cancelled) return;
        setSearchResult({
          keyword,
          username: null,
          error: "Không thể tìm kiếm người dùng.",
        });
      } finally {
        if (!cancelled) {
          setCheckingKeyword("");
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [keyword, existingChat]);

  // Tạo Chat cho tài khoản tìm thấy.
  const foundUserChat: Chat | null = foundUser ? {
        id: foundUser,
        name: foundUser,
        avatar: foundUser.slice(0, 2).toUpperCase(),
        avatarColor: "#989bff",
        lastMessage: "Bắt đầu cuộc trò chuyện",
        time: "",
        kind: "people",
      }
      : null;

  // Mở cuộc trò chuyện với tài khoản vừa tìm thấy.
  const handleOpenFoundUser = () => {
    if (!foundUserChat) return;

    onSearchUser(foundUserChat.name);
    setSearchResult(null);
  };

  // Tạo phòng.
  const handleOpenCreateRoom = () => {
    setShowRoomMenu(false);
    setShowCreateRoom(true);
  };

  // Tham gia phòng.
  const handleOpenJoinRoom = () => {
    setShowRoomMenu(false);
    setShowJoinRoom(true);
  };

  return (
      <section className="chat-list-panel" aria-label="Danh sách cuộc trò chuyện">
        <header className="chat-list-header">
          <div className="list-title-row">
            <div>
              <h1>Tin nhắn</h1>
            </div>

            <div className="compose-wrapper">
              <button type="button" className="compose-button" aria-label="Tạo hoặc tham gia phòng" aria-expanded={showRoomMenu}
                  onClick={() =>
                      setShowRoomMenu((prev) => !prev)
                  }>
                +
              </button>

              {showRoomMenu && (
                  <div className="room-action-menu">
                    <button type="button" onClick={handleOpenCreateRoom}>
                      <span>+</span>

                      <span>
                        <strong>Tạo phòng mới</strong>
                        <small>Tạo nhóm chat mới</small>
                      </span>
                    </button>

                    <button type="button" onClick={handleOpenJoinRoom}>
                      <span>/</span>

                      <span>
                        <strong>Tham gia phòng</strong>
                        <small>Tham gia phòng đã có</small>
                      </span>
                    </button>
                  </div>
              )}
            </div>
          </div>

          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <input type="text" value={query}
                onChange={(event) =>
                    onQueryChange(event.target.value)
                }
                placeholder="Tìm cuộc trò chuyện hoặc username..."
                aria-label="Tìm cuộc trò chuyện hoặc username"
            />

            {query && (
                <button type="button" onClick={() => onQueryChange("")} aria-label="Xóa tìm kiếm">
                  x
                </button>
            )}
          </label>

          <div className="chat-filter">
            <button
                type="button"
                className={chatFilter === "all" ? "active" : ""}
                onClick={() => onChatFilterChange("all")}
            >
              Tất cả
            </button>

            <button
                type="button"
                className={chatFilter === "unread" ? "active" : ""}
                onClick={() => onChatFilterChange("unread")}
            >
              Chưa đọc
              {totalUnread > 0 && (
                  <span className="chat-filter-count">
                {totalUnread}
            </span>
              )}
            </button>
          </div>
        </header>

        <div className="chat-items">
          {filteredChats.map((chat) => (
              <ChatItem
                  key={chat.id}
                  chat={chat}
                  selected={chat.id === selectedId}
                  onSelect={onSelect}
              />
          ))}

          {foundUserChat && (
              <div className="search-result">
                <div className="search-result-label">
                  Kết quả tìm kiếm
                </div>

                <ChatItem
                    key={`search-${foundUserChat.id}`}
                    chat={foundUserChat}
                    selected={false}
                    onSelect={handleOpenFoundUser}
                />
              </div>
          )}

          {keyword && !existingChat && !foundUserChat && filteredChats.length === 0 && (
                  <div className="list-empty">
                    <strong>
                      {searchingUser || checkingKeyword === keyword ? "Đang tìm người dùng..." : searchError || "Đang tìm kiếm..."}
                    </strong>
                  </div>
              )}

          {!keyword && filteredChats.length === 0 && (
              <div className="list-empty">
                <strong>
                  {chatFilter === "unread"
                      ? "Không có tin nhắn chưa đọc"
                      : "Chưa có cuộc trò chuyện"}
                </strong>
              </div>
          )}
        </div>

        {showCreateRoom && (
            <CreateRoomModal
                onClose={() => setShowCreateRoom(false)}
                onSuccess={onRoomReady}
            />
        )}

        {showJoinRoom && (
            <JoinRoomModal
                onClose={() => setShowJoinRoom(false)}
                onSuccess={onRoomReady}
            />
        )}
      </section>
  );
}
