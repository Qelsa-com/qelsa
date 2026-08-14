import { PageAdminView } from '@/components/PageAdminView'
import Layout from '@/layout'
import React from 'react'

const Manage = () => {
  return (
    <Layout activeSection={"pages"}>
      <PageAdminView />;
    </Layout>
  )
}

export default Manage