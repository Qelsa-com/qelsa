import { PlaceholderPage } from "../components/PlaceholderPage";
import Layout from "../layout";

const Settings = () => {
  return (
    <Layout activeSection={"pages"}>
      <PlaceholderPage title="Settings" description="Customize your experience, manage notifications, privacy settings, and account preferences." icon={Settings} />;
    </Layout>
  );
};

export default Settings;
