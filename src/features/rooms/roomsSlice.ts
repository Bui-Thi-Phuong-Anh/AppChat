import {createAsyncThunk, createSlice, type PayloadAction,} from "@reduxjs/toolkit";
import type { Room, RoomMember } from "../../services/roomService";
import { roomService } from "../../services/roomService";

interface RoomsState {
    rooms: Room[];
    membersByRoom: Record<string, RoomMembersState>;
    loading: boolean;
    creating: boolean;
    joining: boolean;
    leaving: boolean;
    error: string | null;
    selectedRoomId: string | null;
}

interface RoomMembersState {
    members: RoomMember[];
    loading: boolean;
    error: string | null;
}

const initialState: RoomsState = {
    rooms: [],
    membersByRoom: {},
    loading: false,
    creating: false,
    joining: false,
    leaving: false,
    error: null,
    selectedRoomId: null,
};

type ThunkConfig = {
    rejectValue: string;
};

const roomKey = (name: string) => name.trim().toLowerCase();

function setRoomMembers(state: RoomsState, name: string, members: RoomMember[]) {
    state.membersByRoom[roomKey(name)] = { members, loading: false, error: null };
}

export const fetchRoomMembersThunk = createAsyncThunk<RoomMember[], string, ThunkConfig>(
    "rooms/fetchMembers",
    async (name, { rejectWithValue }) => {
        try {
            const roomName = name.trim();
            if (!roomName) return rejectWithValue("Chưa chọn phòng chat.");
            const room = await roomService.getRoomHistory(roomName, 1);
            return room.user;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Không tải được danh sách thành viên.");
        }
    },
    {
        condition: (name, { getState }) => {
            const state = getState() as { rooms: RoomsState };
            const cached = state.rooms.membersByRoom[roomKey(name)];
            return !cached?.loading && (!cached || cached.error !== null);
        },
    },
);

// Tạo phòng
export const createRoomThunk = createAsyncThunk<Room, string, ThunkConfig>(
    "rooms/createRoom",
    async (name, { rejectWithValue }) => {
        try {
            const roomName = name.trim();

            if (!roomName) {
                return rejectWithValue("Tên phòng không được để trống.");
            }

            return await roomService.createRoom(roomName);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Không thể tạo phòng.");
        }
    }
);

// Tham gia phòng
export const joinRoomThunk = createAsyncThunk<Room, string, ThunkConfig>(
    "rooms/joinRoom",
    async (name, { rejectWithValue }) => {
        try {
            const roomName = name.trim();

            if (!roomName) {
                return rejectWithValue("Tên phòng không được để trống.");
            }

            return await roomService.joinRoom(roomName);
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Không thể tham gia phòng.");
        }
    }
);

// Rời phòng
export const leaveRoomThunk = createAsyncThunk<string, string, ThunkConfig>(
    "rooms/leaveRoom",
    async (name, { rejectWithValue }) => {
        try {
            const roomName = name.trim();

            if (!roomName) {
                return rejectWithValue("Tên phòng không được để trống.");
            }

            await roomService.leaveRoom(roomName);

            return roomName;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Không thể rời phòng.");
        }
    }
);

// Thêm hoặc cập nhật phòng, tránh trùng tên
function saveRoom(state: RoomsState, room: Room) {
    const index = state.rooms.findIndex((item) => item.name.toLowerCase() === room.name.toLowerCase());

    if (index !== -1) {
        state.rooms[index] = room;
    } else {
        state.rooms.push(room);
    }

    setRoomMembers(state, room.name, room.user);
    state.selectedRoomId = room.name;
}

const roomsSlice = createSlice({
    name: "rooms",
    initialState,

    reducers: {
        setRooms(state, action: PayloadAction<Room[]>) {
            state.rooms = action.payload;
        },

        addRoom(state, action: PayloadAction<Room>) {
            saveRoom(state, action.payload);
        },

        updateRoomDetails(state, action: PayloadAction<Room>) {
            const index = state.rooms.findIndex(
                (room) => roomKey(room.name) === roomKey(action.payload.name),
            );
            if (index >= 0) state.rooms[index] = { ...state.rooms[index], ...action.payload };
            else state.rooms.push(action.payload);

            setRoomMembers(state, action.payload.name, action.payload.user);
        },

        setSelectedRoomId(state, action: PayloadAction<string | null>) {
            state.selectedRoomId = action.payload;
        },

        clearRoomsError(state) {
            state.error = null;
        },

        clearRooms(state) {
            state.rooms = [];
            state.membersByRoom = {};
            state.selectedRoomId = null;
            state.error = null;
            state.loading = false;
            state.creating = false;
            state.joining = false;
            state.leaving = false;
        },
    },

    extraReducers: (builder) => {
        builder
            // CREATE_ROOM
            .addCase(createRoomThunk.pending, (state) => {
                state.creating = true;
                state.error = null;
            })
            .addCase(createRoomThunk.fulfilled, (state, action) => {
                state.creating = false;
                saveRoom(state, action.payload);
            })
            .addCase(createRoomThunk.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload ?? "Không thể tạo phòng.";
            })

            // JOIN_ROOM
            .addCase(joinRoomThunk.pending, (state) => {
                state.joining = true;
                state.error = null;
            })
            .addCase(joinRoomThunk.fulfilled, (state, action) => {
                state.joining = false;
                saveRoom(state, action.payload);
            })
            .addCase(joinRoomThunk.rejected, (state, action) => {
                state.joining = false;
                state.error = action.payload ?? "Không thể tham gia phòng.";
            })

            // OUT_ROOM
            .addCase(leaveRoomThunk.pending, (state) => {
                state.leaving = true;
                state.error = null;
            })
            .addCase(leaveRoomThunk.fulfilled, (state, action) => {
                state.leaving = false;

                const roomName = action.payload.toLowerCase();

                state.rooms = state.rooms.filter((room) => room.name.toLowerCase() !== roomName);

                if (state.selectedRoomId?.toLowerCase() === roomName) {
                    state.selectedRoomId = null;
                }
            })
            .addCase(leaveRoomThunk.rejected, (state, action) => {
                state.leaving = false;
                state.error = action.payload ?? "Không thể rời phòng.";
            })
            .addCase(fetchRoomMembersThunk.pending, (state, action) => {
                const key = roomKey(action.meta.arg);
                state.membersByRoom[key] ??= { members: [], loading: false, error: null };
                state.membersByRoom[key].loading = true;
                state.membersByRoom[key].error = null;
            })
            .addCase(fetchRoomMembersThunk.fulfilled, (state, action) => {
                setRoomMembers(state, action.meta.arg, action.payload);
            })
            .addCase(fetchRoomMembersThunk.rejected, (state, action) => {
                const key = roomKey(action.meta.arg);
                state.membersByRoom[key] ??= { members: [], loading: false, error: null };
                state.membersByRoom[key].loading = false;
                state.membersByRoom[key].error = action.payload ?? "Không tải được danh sách thành viên.";
            });
    },
});

export const {
    setRooms,
    addRoom,
    updateRoomDetails,
    setSelectedRoomId,
    clearRoomsError,
    clearRooms,
} = roomsSlice.actions;

export default roomsSlice.reducer;
