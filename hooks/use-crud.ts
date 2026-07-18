import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

// ============================================
// useGetAll - Fetch all items
// @param queryKey - Cache key
// @param getAllFn - API function
// @returns { data, isLoading, error }
// ============================================
export function useGetAll<T = unknown>(
  queryKey: QueryKey,
  getAllFn: () => Promise<T[]>
) {
  return useQuery({
    queryKey,
    queryFn: getAllFn,
  });
}

// ============================================
// useGetById - Fetch single item
// @param queryKey - Cache key
// @param getByIdFn - API function
// @param id - Item ID
// @returns { data, isLoading, error }
// ============================================
export function useGetById<T = unknown>(
  queryKey: QueryKey,
  getByIdFn: (id: string | number) => Promise<T>,
  id: string | number
) {
  return useQuery({
    queryKey,
    queryFn: () => getByIdFn(id),
    enabled: !!id,
  });
}

// ============================================
// useCreate - Create item with auto-refetch
// @param queryKey - Cache key to refresh
// @param createFn - API function
// @returns { mutate, isPending }
// ============================================
export function useCreate<T = unknown, TInput = Record<string, unknown>>(
  queryKey: QueryKey,
  createFn: (data: TInput) => Promise<T>
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createFn,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

// ============================================
// useUpdate - Update item with auto-refetch
// @param queryKey - Cache key to refresh
// @param updateFn - API function
// @returns { mutate, isPending }
// ============================================
export function useUpdate<T = unknown, TInput = Record<string, unknown>>(
  queryKey: QueryKey,
  updateFn: (id: string | number, data: TInput) => Promise<T>
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: TInput }) =>
      updateFn(id, data),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

// ============================================
// useDelete - Delete item with auto-refetch
// @param queryKey - Cache key to refresh
// @param deleteFn - API function
// @returns { mutate, isPending }
// ============================================
export function useDelete<T = unknown>(
  queryKey: QueryKey,
  deleteFn: (id: string | number) => Promise<T>
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteFn,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}