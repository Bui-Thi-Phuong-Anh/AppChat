import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {clearRoomsError, joinRoomThunk,} from "../../features/rooms/roomsSlice";
import type { Room } from "../../services/roomService";

interface Props {
    onClose: () => void;
    onSuccess: (room: Room) => void;
}

export function JoinRoomModal({ onClose, onSuccess }: Props) {
    const dispatch = useDispatch<AppDispatch>();
    const [name, setName] = useState("");
    const joining = useSelector((state: RootState) => state.rooms.joining);
    const error = useSelector((state: RootState) => state.rooms.error);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const roomName = name.trim();

        if (!roomName || joining) return;

        dispatch(clearRoomsError());

        try {
            const room = await dispatch(joinRoomThunk(roomName)).unwrap();

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
                if (!joining) onClose();
            }}>
            <div className="room-modal"
                onClick={(event) => event.stopPropagation()}>
                <div className="room-modal-header">
                    <div>
                        <h2>Tham gia phòng</h2>
                        <p>Nhập tên phòng bạn muốn tham gia.</p>
                    </div>

                    <button type="button" className="room-modal-close" onClick={onClose} aria-label="Đóng" disabled={joining}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="join-room-name">
                        Tên phòng
                    </label>

                    <input
                        id="join-room-name" type="text" value={name}
                        onChange={(event) =>
                            handleNameChange(event.target.value)
                        }
                        placeholder="Nhập tên phòng"
                        maxLength={100}
                        autoFocus
                        required
                        disabled={joining}/>

                    {error && (<p className="room-form-error">{error}</p>)}

                    <div className="room-modal-actions">
                        <button type="button" className="room-button-secondary" onClick={onClose} disabled={joining}>
                            Hủy
                        </button>

                        <button type="submit" className="room-button-primary" disabled={!name.trim() || joining}>
                            {joining ? "Đang tham gia..." : "Tham gia"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
