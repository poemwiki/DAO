import { useGovernorParams } from './useGovernorParams'

export function useQuorumNumerator() {
  const { data } = useGovernorParams()
  return { data: data?.quorumNum as bigint | undefined }
}
