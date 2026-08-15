import { EducationEditorPage } from '@/components/EducationEditorPage'
import Layout from '@/layout'
import React from 'react'

const Educations = () => {
  return (
    <Layout activeSection={"profile"}>
      <EducationEditorPage />
    </Layout>
  )
}

export default Educations