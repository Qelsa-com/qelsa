import { useRouter } from "next/router";
import { useEffect } from "react";

const MyJobsIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jobs/my-jobs/saved");
  }, [router]);

  return null;
};

export default MyJobsIndex;
