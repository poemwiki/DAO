import React from 'react'
import { Outlet } from 'react-router-dom'

import Header from '../components/Header'
import './app.scss'

export default function AppLayout() {
  return (
    <>
      <Header />
      <div className="main">
        <Outlet />
      </div>
    </>
  )
}