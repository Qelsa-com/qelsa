import React from "react";
import Layout from "../layout";
import { QelsaAgentChat } from "../components/agent/QelsaAgentChat";

// The agent used to live at /qelsa-ai behind a mock UI. Keep the URL working
// for existing links while the header points at /agent.
const QelsaAI = () => {
  return (
    <Layout activeSection="agent">
      <QelsaAgentChat />
    </Layout>
  );
};

export default QelsaAI;
