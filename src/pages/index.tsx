"use client";

import { useEffect, useRef, useState } from "react";
import { OnboardingFlow } from "../components/OnboardingFlow";

import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import { Provider } from "react-redux";
import Layout from "../layout";
import { store } from "../store";

export default function App() {
  const { user } = useAuth();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      setIsFirstTimeUser(!user.username || user.username.trim() === "" || (!user.find_job && !user.explore_career && !user.upskill_and_learn && !user.prepare_interview));
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, []);

  // Show onboarding for first-time users
  if (isFirstTimeUser) {
    return (
      <Provider store={store}>
        <OnboardingFlow />;
      </Provider>
    );
  }

  // Home is the signed-in user's own profile: the same page /profile/[username]
  // serves to visitors, plus the Add/Edit affordances.
  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
}
