import { ProfilePage } from "@/components/profile/ProfilePage";
import Layout from "@/layout";

const Profile = () => {
  return (
    <Layout activeSection={"profile"}>
      <ProfilePage isOwner />
    </Layout>
  );
};

export default Profile;
