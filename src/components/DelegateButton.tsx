import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import DelegateModal from '@/components/DelegateModal'
import { useIsDelegated } from '@/hooks/useIsDelegated'

export default function DelegateButton() {
  const { address } = useAccount()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { isMember, isDelegated } = useIsDelegated()

  if (!address || !isMember) {
    return null
  }

  return (
    <>
      <Button
        variant={isDelegated ? 'ghost' : 'default'}
        onClick={() => setOpen(true)}
      >
        {isDelegated
          ? t('delegate.changeButton', 'Change Delegate')
          : t('delegate.setButton', 'Set Delegate')}
      </Button>
      {open && <DelegateModal open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
