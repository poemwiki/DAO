import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlineChair } from 'react-icons/md'
import { useAccount } from 'wagmi'
import DelegateModal from '@/components/DelegateModal'
import { Button } from '@/components/ui/button'
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
        variant={isDelegated ? 'outline' : 'default'}
        onClick={() => setOpen(true)}
      >
        <MdOutlineChair />
        {isDelegated
          ? t('delegate.changeButton', 'Change Delegate')
          : t('delegate.setButton', 'Set Delegate')}
      </Button>
      {open && <DelegateModal open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
