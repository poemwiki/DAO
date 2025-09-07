import { Outlet } from 'react-router-dom'
import ConnectWallet from '@/components/ConnectButton'
import LanguageSwitch from '@/components/LanguageSwitch'
import ThemeSelect from '@/components/ThemeSelect'
import { DefaultLogo } from '@/components/ui/DefaultLogo'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full py-2 border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold"></span>
              {import.meta.env.VITE_APP_LOGO ? (
                <img
                  src={import.meta.env.VITE_APP_LOGO}
                  alt="Logo"
                  className="h-16 w-16"
                />
              ) : (
                // Fallback logo now provided by <DefaultLogo /> component (inline SVG, themable via currentColor)
                <DefaultLogo className="h-16 w-16 text-foreground" />
              )}
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <div className="flex items-center gap-2">
              <ThemeSelect />
              <LanguageSwitch />
              <ConnectWallet />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container pt-6 pb-12">
        <Outlet />
      </main>
      <footer className="w-full border-t bg-background">
        <div className="container py-4 text-center text-sm text-secondary">
          Powered by
          <a
            className="hover:underline decoration-primary hover:text-primary"
            href="https://github.com/poemwiki/govo"
          >
            {import.meta.env.VITE_APP_NAME}
          </a>
        </div>
      </footer>
    </div>
  )
}
