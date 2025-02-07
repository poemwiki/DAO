import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ROUTES } from '@/constants'

// Layouts
import AppLayout from '@/layouts/app'

// Pages
import Home from '@/pages/Home'
import Proposal from '@/pages/Proposal'
import NotFound from '@/pages/NotFound'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path={ROUTES.PROPOSAL} element={<Proposal />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
