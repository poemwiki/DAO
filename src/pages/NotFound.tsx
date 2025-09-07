import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">{t('notFound.title')}</p>
      <p className="text-sm text-secondary max-w-md text-center">
        {t('notFound.description')}
      </p>
      <Link
        to={ROUTES.HOME}
        className="text-primary hover:text-primary/90 underline-offset-4 hover:underline"
      >
        {t('notFound.back')}
      </Link>
    </div>
  )
}
