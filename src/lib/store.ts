import { configureStore } from "@reduxjs/toolkit";
import { platformApi } from "./api";

export const makeStore = () => configureStore({ reducer: { [platformApi.reducerPath]: platformApi.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(platformApi.middleware) });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
