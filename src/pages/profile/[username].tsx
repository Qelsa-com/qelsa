import { ProfilePage } from "@/components/profile/ProfilePage";
import Layout from "@/layout";
import { useRouter } from "next/router";

const PublicProfile = () => {
  const router = useRouter();
  const username = typeof router.query.username === "string" ? router.query.username : undefined;

  return (
    <Layout activeSection={"profile"}>
      <ProfilePage username={username} />
    </Layout>
  );
};

export default PublicProfile;
