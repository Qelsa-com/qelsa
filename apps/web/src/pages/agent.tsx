import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../layout";
import { QelsaAgentChat } from "../components/agent/QelsaAgentChat";

const AgentPage = () => {
  const router = useRouter();
  const strippedPrompt = useRef(false);

  const initialPrompt = useMemo(() => {
    const value = router.query.prompt;
    return typeof value === "string" ? value.slice(0, 2000) : undefined;
  }, [router.query.prompt]);

  // The prompt is a one-time deep-link handoff; keep it out of the address bar so
  // a refresh (or sharing the URL) doesn't refill the composer.
  useEffect(() => {
    if (strippedPrompt.current || !router.isReady || typeof router.query.prompt !== "string") return;
    strippedPrompt.current = true;
    const query = { ...router.query };
    delete query.prompt;
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router]);

  return (
    <Layout activeSection="agent">
      <QelsaAgentChat initialPrompt={initialPrompt} />
    </Layout>
  );
};

export default AgentPage;
