import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import contactsReducer from "../features/contacts/contactsSlice";
import messagesReducer from "../features/messages/messagesSlice";
import roomsReducer from "../features/rooms/roomsSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        contacts: contactsReducer,
        messages: messagesReducer,
        rooms: roomsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;