import React, { Suspense } from 'react'
import ExplorePage from './Explore'

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
<ExplorePage />
</Suspense>
  )
}

export default page