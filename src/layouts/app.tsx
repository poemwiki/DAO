import { Outlet } from 'react-router-dom'
import ConnectWallet from '@/components/ConnectButton'
import LanguageSwitch from '@/components/LanguageSwitch'
import ThemeToggle from '@/components/ThemeToggle'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold"></span>
              <img
                src={import.meta.env.VITE_APP_LOGO}
                alt="Logo"
                className="h-16 w-16 rounded-sm"
              />
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitch />
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>
      <main className="container pt-6 pb-12">
        <Outlet />
      </main>
    </div>
  )
}
