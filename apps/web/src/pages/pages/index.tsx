import { PagesHub } from '@/components/PagesHub'
import Layout from '@/layout'
import React from 'react'

const Pages = () => {
  return (
    <Layout activeSection={"pages"}>
      <PagesHub />
    </Layout>
  )
}

export default Pages