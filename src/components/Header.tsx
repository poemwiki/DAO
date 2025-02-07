import React from 'react'
import { NavLink } from 'react-router-dom'
import ConnectButton from './ConnectButton'
import logo from '../assets/poemwiki.svg'
import { Button } from '@chakra-ui/react'

type PageNavProps = {
  to: string
  label: string
}
const PageNav = ({ to, label }: React.PropsWithChildren<PageNavProps>) => {
  const activeClassName = 'active'
  return (
    <li>
      <NavLink to={to} className={({ isActive }) => (isActive ? activeClassName : undefined)}>
        <Button variant="outline" size="lg">
          {label}
        </Button>
      </NavLink>
    </li>
  )
}

export default function Header() {
  return (
    <div className="header">
      {/* navbar */}
      <img className="logo" src={logo} alt="logo" />
      <nav>
        <ul>
          <PageNav to="/" label="提案"></PageNav>
          {/* <PageNav to="/vault" label="金库"></PageNav> */}
          <PageNav to="/contributors" label="贡献者"></PageNav>
          <li>
            <ConnectButton />
          </li>
        </ul>
      </nav>
    </div>
  )
}
