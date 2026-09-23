import { UserManagement } from "@/components/UserManagement";
import Layout from "@/layout";
import { useParams } from "next/navigation";
import React from "react";

const Manage = () => {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <Layout activeSection={"pages"}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-20">
        {id ? <UserManagement pageId={String(id)} showHeader={true} /> : null}
      </div>
    </Layout>
  );
};

export default Manage;