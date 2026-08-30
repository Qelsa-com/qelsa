import { ForCandidatesPage } from "@/components/ForCandidatesPage";

/**
 * /for_candidates — the candidate-facing marketing landing page.
 *
 * Renders without Layout: the design ships its own marketing header and footer,
 * so the app shell (guest navbar + mobile tab bar) would duplicate the chrome.
 */
const ForCandidates = () => {
  return <ForCandidatesPage />;
};

export default ForCandidates;
