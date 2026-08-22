import { ProfileEditor } from "@/components/profile/ProfileEditor";
import Layout from "@/layout";

const EditProfile = () => {
  return (
    <Layout activeSection={"profile"}>
      <ProfileEditor />
    </Layout>
  );
};

export default EditProfile;
