import jazzicon from '@metamask/jazzicon'
import { memo, useEffect, useMemo, useRef } from 'react'
import { isAddress } from 'viem'

interface AvatarProps {
  address: string
  size?: number
  className?: string
}

// Helper function to validate and extract seed from address
function getJazziconSeed(address: string): number | null {
  // Validate address format
  if (!address || typeof address !== 'string') {
    return null
  }
  
  // Check if it's a valid Ethereum address
  if (!isAddress(address)) {
    return null
  }

  // Extract seed from address (ensure we have enough characters)
  if (address.length < 10) {
    return null
  }

  try {
    return parseInt(address.slice(2, 10), 16)
  } catch {
    return null
  }
}

// Helper function to create fallback element
function createFallbackElement(address: string, size: number): HTMLElement {
  const fallback = document.createElement('div')
  fallback.style.width = `${size}px`
  fallback.style.height = `${size}px`
  fallback.style.borderRadius = '50%'
  fallback.style.backgroundColor = '#6B7280' // gray-500
  fallback.style.display = 'flex'
  fallback.style.alignItems = 'center'
  fallback.style.justifyContent = 'center'
  fallback.style.color = 'white'
  fallback.style.fontSize = `${size * 0.4}px`
  fallback.style.fontWeight = 'bold'
  fallback.textContent = address.length >= 4 ? address.slice(2, 4).toUpperCase() : '?'
  return fallback
}

function AvatarComponent({ address, size = 40, className = '' }: AvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null)
  
  // Memoize seed calculation to avoid recalculation on every render
  const seed = useMemo(() => getJazziconSeed(address), [address])
  
  // Memoize whether the address is valid
  const isValidAddress = useMemo(() => !!address && isAddress(address), [address])

  useEffect(() => {
    if (!avatarRef.current) return

    // Clear previous content
    avatarRef.current.innerHTML = ''

    // If address is invalid, show fallback immediately
    if (!isValidAddress) {
      const fallback = createFallbackElement(address || '??', size)
      avatarRef.current.appendChild(fallback)
      return
    }

    try {
      if (seed !== null) {
        // Generate the jazzicon
        const jazziconElement = jazzicon(size, seed)
        
        // Apply styles to make it round and properly sized
        jazziconElement.style.borderRadius = '50%'
        jazziconElement.style.overflow = 'hidden'
        
        avatarRef.current.appendChild(jazziconElement)
      } else {
        throw new Error('Invalid seed')
      }
    } catch (error) {
      console.warn('Failed to generate jazzicon for address:', address, error)
      
      // Use fallback element
      const fallback = createFallbackElement(address, size)
      avatarRef.current.appendChild(fallback)
    }
  }, [address, size, seed, isValidAddress])

  if (!address) {
    return (
      <div
        className={`inline-block bg-gray-300 rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      ref={avatarRef}
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={isValidAddress ? `Address: ${address}` : 'Invalid address'}
    />
  )
}

// Memoize the component to prevent unnecessary re-renders
export const Avatar = memo(AvatarComponent)