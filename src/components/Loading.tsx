import styles from './Loading.module.css'

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center" role="status">
      <div className="flex items-center gap-3 text-sm text-secondary">
        <span className={styles.box} aria-hidden />
        <span>{text}</span>
      </div>
    </div>
  )
}

export default Loading
