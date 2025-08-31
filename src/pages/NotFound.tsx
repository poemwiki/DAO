import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Link
        to={ROUTES.HOME}
        className="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
      >
        Go back home
      </Link>
    </div>
  )
}
