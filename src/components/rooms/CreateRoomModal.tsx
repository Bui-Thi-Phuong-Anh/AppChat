import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {clearRoomsError, createRoomThunk,} from "../../features/rooms/roomsSlice";
import type { Room } from "../../services/roomService";

interface Props {
    onClose: () => void;
    onSuccess: (room: Room) => void;
}

export function CreateRoomModal({onClose, onSuccess,}: Props) {
    const dispatch = useDispatch<AppDispatch>();
    const [name, setName] = useState("");
    const creating = useSelector((state: RootState) => state.rooms.creating);
    const error = useSelector((state: RootState) => state.rooms.error);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const roomName = name.trim();

        if (!roomName || creating) return;

        dispatch(clearRoomsError());

        try {
            const room = await dispatch(createRoomThunk(roomName)).unwrap();

            onSuccess(room);
            onClose();
        } catch {
            // Lỗi được lưu trong Redux.
        }
    };

    const handleNameChange = (value: string) => {
        setName(value);

        if (error) {
            dispatch(clearRoomsError());
        }
    };

    return (
        <div className="room-modal-overlay" onClick={() => {
                if (!creating) onClose();
            }}>
            <div className="room-modal"
                onClick={(event) => event.stopPropagation()}>
                <div className="room-modal-header">
                    <div>
                        <h2>Tạo phòng chat</h2>
                        <p>
                            Tạo phòng mới để trò chuyện cùng mọi người.
                        </p>
                    </div>

                    <button type="button" className="room-modal-close" onClick={onClose} aria-label="Đóng" disabled={creating}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="create-room-name">
                        Tên phòng
                    </label>

                    <input
                        id="create-room-name"
                        type="text"
                        value={name}
                        onChange={(event) =>
                            handleNameChange(event.target.value)
                        }
                        placeholder="Ví dụ: Nhóm học tập"
                        maxLength={100}
                        autoFocus
                        required
                        disabled={creating}
                    />

                    {error && (<p className="room-form-error">{error}</p>)}

                    <div className="room-modal-actions">
                        <button type="button" className="room-button-secondary" onClick={onClose} disabled={creating}>
                            Hủy
                        </button>

                        <button type="submit" className="room-button-primary" disabled={!name.trim() || creating}>
                            {creating ? "Đang tạo..." : "Tạo phòng"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
