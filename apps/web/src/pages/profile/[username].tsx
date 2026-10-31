import { ProfilePage } from "@/components/profile/ProfilePage";
import { Seo } from "@/components/Seo";
import { api } from "@/lib/convexApi";
import Layout from "@/layout";
import { ConvexHttpClient } from "convex/browser";
import type { GetServerSideProps } from "next";

interface ProfileMeta {
  name: string;
  description: string;
  imageUrl?: string;
}

interface PublicProfileProps {
  username: string;
  meta: ProfileMeta | null;
}

function clip(value: string, max = 160) {
  if (value.length <= max) return value;
  const slice = value.slice(0, max);
  const breakAt = slice.lastIndexOf(" ");
  return `${slice.slice(0, breakAt > 80 ? breakAt : max).trimEnd()}…`;
}

export const getServerSideProps: GetServerSideProps<PublicProfileProps> = async (ctx) => {
  const username = ctx.params?.username;
  if (typeof username !== "string") return { notFound: true };

  try {
    const client = new ConvexHttpClient(
      process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210",
    );
    const profile = await client.query(api.users.publicProfileMeta, { username });
    if (!profile) return { notFound: true };

    const name = (profile.name as string) || "Candidate";
    const summary =
      (profile.headline as string) ||
      (profile.professional_summary as string) ||
      (profile.about as string) ||
      "";
    const description = summary
      ? clip(summary.replace(/\s+/g, " ").trim())
      : `${name}'s skills, experience, and job readiness on Qelsa.`;

    return {
      props: {
        username,
        meta: {
          name,
          description,
          ...(typeof profile.profile_image === "string" && profile.profile_image
            ? { imageUrl: profile.profile_image }
            : {}),
        },
      },
    };
  } catch (error) {
    console.error("[PublicProfile SSR] Error fetching profile metadata:", error);
    return { props: { username, meta: null } };
  }
};

const PublicProfile = ({ username, meta }: PublicProfileProps) => {
  return (
    <Layout activeSection={"profile"}>
      {meta ? (
        <Seo
          title={meta.name}
          description={meta.description}
          path={`/profile/${username}`}
          image={meta.imageUrl}
          noindex
        />
      ) : (
        <Seo
          title="Profile"
          description="Candidate profile on Qelsa."
          path={`/profile/${username}`}
          noindex
        />
      )}
      <ProfilePage username={username} />
    </Layout>
  );
};

export default PublicProfile;
