import type { GetServerSideProps } from "next";

/** Old skills editor route — send people to the profile edit-skills modal. */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/profile?edit=skills",
    permanent: false,
  },
});

export default function EditSkills() {
  return null;
}
