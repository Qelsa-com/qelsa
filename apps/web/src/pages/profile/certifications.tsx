import { CertificationsEditorPage } from '@/components/CertificationsEditorPage'
import Layout from '@/layout'
import React from 'react'

const Certifications = () => {
  return (
    <Layout activeSection={"profile"}>
      <CertificationsEditorPage />
    </Layout>
  )
}

export default Certifications
