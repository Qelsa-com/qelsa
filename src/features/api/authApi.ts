// src/store/api/authApi.ts
import type { User } from "@/types/user";
import { createApi, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store"; // adjust path
import { logOut, setCredentials, updateUser } from "../slices/authSlice";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Provide your API base url via env
const AUTH_API_BASE = "/api/auth";

// raw baseQuery reads token from Redux state (not localStorage directly)
const rawBaseQuery = fetchBaseQuery({
  baseUrl: AUTH_API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | { url: string; method?: string; body?: unknown }, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  // 1) execute original request
  let result = await rawBaseQuery(args, api, extraOptions);

  // 2) if 401 -> try refresh
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth?.refreshToken;

    // if no refresh available -> fully logout
    if (!refreshToken) {
      api.dispatch(logOut({ message: "Session expired. Please login again." }));
      return result;
    }

    // avoid trying to refresh while already calling refresh endpoint
    const isRefreshCall = typeof args === "string" ? args.includes("/refresh") : (args as any).url?.includes("/refresh");
    if (isRefreshCall) {
      api.dispatch(logOut({ message: "Session expired. Please login again." }));
      return result;
    }

    // call refresh endpoint
    const refreshResult = await rawBaseQuery({ url: "/refresh", method: "POST", body: { refreshToken } }, api, extraOptions);

    if (refreshResult.data) {
      const {
        accessToken,
        refreshToken: newRefresh,
        user,
      } = refreshResult.data as RefreshResponse & {
        user?: User;
      };

      // update redux creds (and persist via slice)
      api.dispatch(setCredentials({ accessToken, refreshToken: newRefresh, user: user || null }));

      // retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // refresh failed
      api.dispatch(logOut({ message: "Session expired. Please login again." }));
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({ url: "/login", method: "POST", body: credentials }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          // store tokens + optional user in auth slice
          dispatch(setCredentials({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user || null }));
          // invalidate profile queries so getProfile will refetch
          dispatch(authApi.util.invalidateTags(["Profile"]));
        } catch (err) {
          // handle error already (no side effects)
          console.error("login failed", err);
        }
      },
    }),

    register: builder.mutation<void, RegisterRequest>({
      query: (body) => ({ url: "/register", method: "POST", body }),
    }),

    getProfile: builder.query<User, void>({
      query: () => "/me",
      providesTags: ["Profile"],
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        // if query succeeded we can update the user in slice
        try {
          const { data } = await queryFulfilled;
          dispatch(updateUser(data));
        } catch {
          // ignore
        }
      },
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (profile) => ({ url: "/edit-profile", method: "PUT", body: profile }),
      invalidatesTags: ["Profile"],
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(updateUser(data));
        } catch {
          // ignore
        }
      },
    }),

    googleLogin: builder.mutation<AuthResponse, { email: string; name: string; picture?: string }>({
      query: (userDetails) => ({ url: "/google-login", method: "POST", body: userDetails }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user || null }));
          dispatch(authApi.util.invalidateTags(["Profile"]));
        } catch (err) {
          console.error("Google Login error:", err);
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery, useUpdateProfileMutation, useGoogleLoginMutation } = authApi;
