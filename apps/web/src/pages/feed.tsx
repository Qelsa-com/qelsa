import React, { useState } from 'react'
import Layout from '../layout'
import { SocialFeed } from '../components/SocialFeed';

const Feed = () => {
  const [sharedBlogPosts, setSharedBlogPosts] = useState<any[]>([]);
  

  return (
    <Layout activeSection={"home"}>
      <SocialFeed sharedBlogPosts={sharedBlogPosts} />;
    </Layout>
  )
}

export default Feed