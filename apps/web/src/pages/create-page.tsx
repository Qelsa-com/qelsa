import React from 'react'
import Layout from '../layout'
import { CreatePageFlow } from '../components/CreatePageFlow'

const CreatePage = () => {
  return (
    <Layout activeSection={"pages"}>
      <CreatePageFlow />;
    </Layout>
  )
}

export default CreatePage