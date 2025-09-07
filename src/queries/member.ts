// Member-related query keys and data composition utilities
// WHY: Centralizes member data fetching logic and React Query key patterns

export const memberQueryKeys = {
  all: ['member'] as const,
  lists: () => [...memberQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...memberQueryKeys.lists(), { filters }] as const,
  details: () => [...memberQueryKeys.all, 'detail'] as const,
  detail: (address: string) => [...memberQueryKeys.details(), address] as const,
  transfers: (address: string, page?: number) => [...memberQueryKeys.detail(address), 'transfers', { page }] as const,
  votes: (address: string, page?: number) => [...memberQueryKeys.detail(address), 'votes', { page }] as const,
  proposals: (address: string) => [...memberQueryKeys.detail(address), 'proposals'] as const,
} as const
