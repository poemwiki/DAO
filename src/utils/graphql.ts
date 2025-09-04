import { config } from '@/config'

// Generic GraphQL response container. Caller supplies concrete T.
// No default = forces explicit type at callsite or inference from usage.
export interface GraphQLResponse<T> {
  data: T
  errors?: Array<{
    message: string
    locations: Array<{
      line: number
      column: number
    }>
    path: string[]
  }>
}

type Variables = Record<string, unknown> | undefined

export async function fetchGraphQL<T>(
  query: string,
  variables?: Variables,
): Promise<GraphQLResponse<T>> {
  const response = await fetch(config.api.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: unknown = await response.json()

  // Basic runtime validation (narrow shape) before casting.
  if (!result || typeof result !== 'object' || !('data' in result)) {
    throw new Error('Invalid GraphQL response shape')
  }
  const r = result as GraphQLResponse<T>
  if (r.errors && r.errors.length) {
    throw new Error(r.errors[0].message)
  }
  return r
}
