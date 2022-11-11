import { defineStyle, defineStyleConfig } from '@chakra-ui/react'

const outline = defineStyle({
  borderRadius: 'xl',
  fontWeight: 'normal',
  background: 'transparent',
})

export const iconButtonTheme = defineStyleConfig({
  variants: { outline }
})