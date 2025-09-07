import styles from './Loading.module.css'
import { useTranslation } from 'react-i18next'

export function Loading({ text }: { text?: string }) {
  const { t } = useTranslation('common')
  const label = text ?? t('loading')
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center" role="status">
      <div className="flex items-center gap-3 text-sm text-secondary">
        <span className={styles.box} aria-hidden />
        <span>{label}</span>
      </div>
    </div>
  )
}

export default Loading
