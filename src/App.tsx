import {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector, useStore} from "react-redux";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ChatList } from "./components/ChatList";
import { ContactDirectory } from "./components/ContactDirectory";
import { Sidebar } from "./components/Sidebar";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import ChatWindow from "./components/ChatWindow";
import {clearCredentials, setCredentials,} from "./features/auth/authSlice";
import { AuthInitializer } from "./features/auth/AuthInitializer";
import { authService } from "./services/authService";
import { contactService } from "./services/contactService";
import type { UserListItem } from "./services/contactService";
import {setContactsError, setContactsLoading, setFriends, setGroups,} from "./features/contacts/contactsSlice";
import type { AppDispatch, RootState } from "./store/store";
import type { Chat } from "./types/chat";
import type { ContactEntry } from "./types/contact";
import "./App.css";
import {userService} from "./services/userService.ts";

function mapUserToContact(item: UserListItem, type: "friend" | "group"): ContactEntry {
    return {
        id: item.name,
        name: item.name,
        initials: item.name.trim().slice(0, 2).toUpperCase(),
        color: type === "friend" ? "#989bff" : "#6ad1ff",
        detail: item.actionTime,
        online: undefined,
    };
}

function mapContactToChat(contact: ContactEntry, kind: "people" | "group"): Chat {
    return {
        id: contact.id,
        name: contact.name,
        avatar: contact.initials,
        avatarColor: contact.color,
        lastMessage: "",
        time: "",
        online: contact.online,
        kind,
    };
}


function ChatWorkspace({ currentUserId }: { currentUserId: string }) {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const store = useStore<RootState>();

    const [query, setQuery] = useState("");
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [activeSection, setActiveSection] = useState("Tin nhắn");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchingUser, setSearchingUser] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const friends = useSelector((state: RootState) => state.contacts.friends);
    const groups = useSelector((state: RootState) => state.contacts.groups);
    const messages = useSelector((state: RootState) => state.messages.messages);

    // Gộp bạn bè và nhóm thành danh sách
    const chats = useMemo(() => {
        const contactChats = [
            ...friends.map(contact => mapContactToChat(contact, "people")),
            ...groups.map(contact => mapContactToChat(contact, "group")),
        ];

        // Thêm cuộc trò chuyện vừa tìm thấy nếu chưa có trong danh sách.
        if (selectedChat && !contactChats.some(chat => chat.id.toLowerCase() === selectedChat.id.toLowerCase())) {
            contactChats.unshift(selectedChat);
        }

        return contactChats;
    }, [friends, groups, selectedChat]);

    const refreshUserList = async () => {
        try {
            const items = await contactService.getUserList();

            const serverFriends = items
                .filter(item => item.type === 0)
                .map(item => mapUserToContact(item, "friend"));

            const serverGroups = items
                .filter(item => item.type === 1)
                .map(item => mapUserToContact(item, "group"));

            // Lấy danh sách Redux mới nhất, tránh sử dụng friends từ closure cũ.
            const currentFriends = store.getState().contacts.friends;

            const mergedFriends = [...serverFriends];

            currentFriends.forEach(friend => {
                const existed = mergedFriends.some(
                    item => item.name.toLowerCase() === friend.name.toLowerCase()
                );

                if (!existed) {
                    mergedFriends.push(friend);
                }
            });

            dispatch(setFriends(mergedFriends));
            dispatch(setGroups(serverGroups));

        } catch (error) {
            console.error("Không thể cập nhật danh sách:", error);
        }
    };

    // Tìm tin nhắn mới nhất và lọc theo tên cuộc trò chuyện
    const filteredChats = useMemo(() => {
        return chats
            .map((chat) => {
                const latestMessage = messages
                    .filter((message) => message.chatId === chat.id)
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )[0];

                return {
                    ...chat,
                    lastMessage: latestMessage
                        ? `${latestMessage.senderId === currentUserId ? "Bạn: " : ""}${latestMessage.content}`
                        : "",
                    time: latestMessage
                        ? new Date(
                            latestMessage.createdAt
                        ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "",
                };
            })
            .filter((chat) =>
                chat.name
                    .toLocaleLowerCase()
                    .includes(query.trim().toLocaleLowerCase())
            );
    }, [chats, messages, currentUserId, query]);

    const handleLogout = () => {
        try {
            authService.logout();
        } catch {
            // Xóa xác thực cục bộ ngay cả khi WebSocket không khả dụng.
        }

        dispatch(clearCredentials());
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        let cancelled = false;

        const loadContacts = async () => {
            dispatch(setContactsLoading(true));
            dispatch(setContactsError(null));

            try {
                const items = await contactService.getUserList();

                if (cancelled) return;

                const friends = items
                    .filter(item => item.type === 0)
                    .map(item => mapUserToContact(item, "friend"));

                const groups = items
                    .filter(item => item.type === 1)
                    .map(item => mapUserToContact(item, "group"));

                dispatch(setFriends(friends));
                dispatch(setGroups(groups));

            } catch (error) {
                if (!cancelled) {
                    dispatch(
                        setContactsError(
                            error instanceof Error
                                ? error.message
                                : "Không thể tải danh bạ"
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    dispatch(setContactsLoading(false));
                }
            }
        };

        void loadContacts();

        return () => {
            cancelled = true;
        };
    }, [dispatch]);

    const handleSearchUser = async (username: string) => {
        const user = username.trim();

        if (!user || searchingUser) return;

        if (user.toLowerCase() === currentUserId.toLowerCase()) {
            alert("Bạn không thể tìm chính mình.");
            return;
        }

        setSearchingUser(true);

        try {
            const exists = await userService.checkUserExist(user);

            if (!exists) {
                alert("Không tìm thấy tài khoản.");
                return;
            }

            let online = false;

            try {
                online = await userService.checkUserOnline(user);
            } catch {
                // Không lấy được trạng thái online nhưng tài khoản vẫn tồn tại.
            }

            const chat: Chat = {
                id: user,
                name: user,
                avatar: user.slice(0, 2).toUpperCase(),
                avatarColor: "#989bff",
                lastMessage: "",
                time: "",
                online,
                kind: "people",
            };

            const newContact: ContactEntry = {
                id: user,
                name: user,
                initials: user.slice(0, 2).toUpperCase(),
                color: "#989bff",
                detail: "",
                online,
            };

            // Không thêm trùng tài khoản.
            const alreadyExists = friends.some(
                friend => friend.name.toLowerCase() === user.toLowerCase()
            );

            if (!alreadyExists) {
                dispatch(setFriends([...friends, newContact]));
            }

            // Mở cuộc trò chuyện.
            setSelectedChat(chat);
            setActiveSection("Tin nhắn");
            setQuery("");

        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Không thể tìm kiếm người dùng."
            );
        } finally {
            setSearchingUser(false);
        }
    };

    return (
        <main className={`app-shell ${theme === "dark" ? "theme-dark" : ""} ${activeSection === "Danh bạ" ? "contacts-view" : ""}`}>
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} settingsOpen={settingsOpen}
                onSettingsToggle={() =>
                    setSettingsOpen((open) => !open)
                }
                theme={theme} onThemeChange={setTheme} onLogout={handleLogout}/>

            {activeSection === "Danh bạ" ? (
                <ContactDirectory />
            ) : (
                <>
                    <ChatList
                        chats={filteredChats}
                        selectedId={selectedChat?.id}
                        onSelect={setSelectedChat}
                        query={query}
                        onQueryChange={setQuery}
                        onSearchUser={handleSearchUser}
                        searchingUser={searchingUser}
                    />

                    <section className="conversation-panel" aria-label="Nội dung cuộc trò chuyện">
                        <ChatWindow
                            chat={selectedChat}
                            currentUserId={currentUserId}
                            onMessageSent={refreshUserList}
                        />
                    </section>
                </>
            )}
        </main>
    );
}

function ProtectedChatRoute() {
    const { isAuthenticated, userId } = useSelector(
        (state: RootState) => state.auth
    );

    return isAuthenticated && userId ? (
        <ChatWorkspace currentUserId={userId} />
    ) : (
        <Navigate to="/login" replace />
    );
}

function AppRoutes() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const handleLogin = (userId: string, reLoginCode: string) => {
        dispatch(setCredentials({ userId, reLoginCode }));
        navigate("/chat", { replace: true });
    };

    return (
        <Routes>
            <Route path="/" element={
                <Navigate to={isAuthenticated ? "/chat" : "/login"} replace/>
            }
            />

            <Route path="/login" element={isAuthenticated ? (
                <Navigate to="/chat" replace />
            ) : (
                <Login onLogin={handleLogin} onRegister={() => navigate("/register")}/>
            )}
            />

            <Route path="/register" element={
                isAuthenticated ? (
                    <Navigate to="/chat" replace />
                ) : (
                    <Register onBackToLogin={() => navigate("/login")}/>
                )
                }
            />

            <Route path="/chat" element={<ProtectedChatRoute />}/>

            <Route path="*" element={
                <Navigate to={isAuthenticated ? "/chat" : "/login"} replace/>
            }/>
        </Routes>
    );
}

function App() {
    return (
        <AuthInitializer>
            <AppRoutes />
        </AuthInitializer>
    );
}

export default App;
