import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../../layout";
import { QelsaAgentChat } from "../../components/agent/QelsaAgentChat";

const EmployerAgentPage = () => {
  const router = useRouter();
  const strippedPrompt = useRef(false);

  const initialPrompt = useMemo(() => {
    const value = router.query.prompt;
    return typeof value === "string" ? value.slice(0, 2000) : undefined;
  }, [router.query.prompt]);

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

export default EmployerAgentPage;
