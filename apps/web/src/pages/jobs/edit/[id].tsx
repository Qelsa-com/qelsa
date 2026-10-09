import { useRouter } from "next/router";
import { useEffect } from "react";

export default function EditJobRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      void router.replace(`/jobs/create-job?jobId=${id}`);
    }
  }, [id, router]);

  return null;
}
