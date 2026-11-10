import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { mockFriends, mockGroups } from "../../data/mockContacts";
import type { ContactEntry } from "../../types/contact";

type ContactsState = {
  friends: ContactEntry[];
  groups: ContactEntry[];
};

const initialState: ContactsState = {
  friends: mockFriends,
  groups: mockGroups,
};

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setFriends: (state, action: PayloadAction<ContactEntry[]>) => {
      state.friends = action.payload;
    },
    addFriend: (state, action: PayloadAction<ContactEntry>) => {
      state.friends.push(action.payload);
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter((friend) => friend.id !== action.payload);
    },
    setGroups: (state, action: PayloadAction<ContactEntry[]>) => {
      state.groups = action.payload;
    },
    addGroup: (state, action: PayloadAction<ContactEntry>) => {
      state.groups.push(action.payload);
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((group) => group.id !== action.payload);
    },
  },
});

export const { setFriends, addFriend, removeFriend, setGroups, addGroup, removeGroup } = contactsSlice.actions;
export default contactsSlice.reducer;
