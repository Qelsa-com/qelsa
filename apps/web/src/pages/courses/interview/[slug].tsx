import { InterviewPrepCourse } from "@/components/courses/InterviewPrepCourse";
import Layout from "../../../layout";
import { useRouter } from "next/router";

export default function InterviewPrepPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : undefined;

  return (
    <Layout activeSection="courses">
      <InterviewPrepCourse slug={slug} />
    </Layout>
  );
}
