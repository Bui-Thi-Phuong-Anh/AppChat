import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  userId: string | null;
  reLoginCode: string | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  userId: null,
  reLoginCode: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ userId: string; reLoginCode: string }>) => {
      state.userId = action.payload.userId;
      state.reLoginCode = action.payload.reLoginCode;
      state.isAuthenticated = true;
    },
    clearCredentials: () => initialState,
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
