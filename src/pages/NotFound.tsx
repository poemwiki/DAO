import React from 'react'
import { Link } from 'react-router-dom'
import { Box, Heading, Text } from '@chakra-ui/react'

export default function NotFound() {
  return (
    <Box sx={{
      minHeight: '40vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }} m={3}>
      <Heading color="text">404</Heading>
      <Text>Page Not Found</Text>
      <Link to="/">Go Home</Link>
    </Box>
  )
}