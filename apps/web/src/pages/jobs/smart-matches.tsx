import type { GetServerSideProps } from "next";

export default function SmartMatchesRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/jobs/ready", permanent: true },
});
