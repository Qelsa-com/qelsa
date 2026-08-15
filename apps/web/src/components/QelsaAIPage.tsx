import { useEffect, useState } from "react";
import { ModernAIChatInterface } from "./ModernAIChatInterface";

interface QelsaAIPageProps {}

export function QelsaAIPage({}: QelsaAIPageProps) {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Get user name from localStorage
    const storedUserData = localStorage.getItem("qelsa-user-data");
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserName(userData.fullName || "User");
    }
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden">
      <ModernAIChatInterface userName={userName} />
    </div>
  );
}
