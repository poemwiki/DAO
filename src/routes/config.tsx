import { lazy } from 'react'
import { ROUTES } from '@/constants'
import AppLayout from '@/layouts/app'

// Lazy pages
const Home = lazy(() => import('@/pages/Home'))
const Proposal = lazy(() => import('@/pages/Proposal'))
const CreateProposal = lazy(() => import('@/pages/CreateProposal'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// WHY: Central single source route objects for Data Router.
export const routeObjects = [
  {
    path: ROUTES.HOME,
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: ROUTES.PROPOSAL.substring(1), element: <Proposal /> },
      { path: ROUTES.CREATE_PROPOSAL.substring(1), element: <CreateProposal /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
