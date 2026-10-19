import React from "react";
import Layout from "../layout";
import { QelsaAgentChat } from "../components/agent/QelsaAgentChat";

const AgentPage = () => {
  return (
    <Layout activeSection="agent">
      <QelsaAgentChat />
    </Layout>
  );
};

export default AgentPage;
