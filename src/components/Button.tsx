import { defineStyle, defineStyleConfig } from '@chakra-ui/react'

const outline = defineStyle({
  borderRadius: 'xl',
  fontSize: 'xl',
  fontWeight: 'normal',
  background: 'transparent'
})

export const buttonTheme = defineStyleConfig({
  variants: { outline },
})