import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./features/api/authApi";
import { companiesApi } from "./features/api/companiesApi";
import { educationsApi } from "./features/api/educationsApi";
import { experiencesApi } from "./features/api/experiencesApi";
import { jobApplicationsApi } from "./features/api/jobApplicationsApi";
import { jobsApi } from "./features/api/jobsApi";
import { jobTitlesApi } from "./features/api/jobTitlesApi";
import { pagesApi } from "./features/api/pagesApi";
import { resumesApi } from "./features/api/resumeApi";
import { seedApi } from "./features/api/seedApi";
import { userSkillsApi } from "./features/api/userSkillsApi";
import authReducer from "./features/slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [pagesApi.reducerPath]: pagesApi.reducer,
    [jobApplicationsApi.reducerPath]: jobApplicationsApi.reducer,
    [educationsApi.reducerPath]: educationsApi.reducer,
    [experiencesApi.reducerPath]: experiencesApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [jobTitlesApi.reducerPath]: jobTitlesApi.reducer,
    [seedApi.reducerPath]: seedApi.reducer,
    [userSkillsApi.reducerPath]: userSkillsApi.reducer,
    [resumesApi.reducerPath]: resumesApi.reducer,
    // add other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(jobsApi.middleware)
      .concat(authApi.middleware)
      .concat(pagesApi.middleware)
      .concat(jobApplicationsApi.middleware)
      .concat(educationsApi.middleware)
      .concat(experiencesApi.middleware)
      .concat(companiesApi.middleware)
      .concat(jobTitlesApi.middleware)
      .concat(seedApi.middleware)
      .concat(userSkillsApi.middleware)
      .concat(resumesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
