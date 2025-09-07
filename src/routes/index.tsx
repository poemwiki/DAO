import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/constants'

// Layouts
import AppLayout from '@/layouts/app'

import CreateProposal from '@/pages/CreateProposal'
// Pages
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import Proposal from '@/pages/Proposal'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path={ROUTES.PROPOSAL} element={<Proposal />} />
        <Route path={ROUTES.CREATE_PROPOSAL} element={<CreateProposal />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
