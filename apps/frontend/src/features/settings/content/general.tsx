import { useProvidersQuery } from '../../../data/queries/api/use-providers-query'

export function GeneralSettings() {
  const providersQuery = useProvidersQuery()

  return <pre>{JSON.stringify(providersQuery.data, null, 2)}</pre>
}
