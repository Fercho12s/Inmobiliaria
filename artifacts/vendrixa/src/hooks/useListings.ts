import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Listing, CreateListingInput } from "@/types";

// ── Query keys ──────────────────────────────────────────────────────────────

export const getGetListingsQueryKey = () => ["listings"] as const;

export const getGetListingByIdQueryKey = (id: number) =>
  ["listings", id] as const;

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useGetListings() {
  return useQuery({
    queryKey: getGetListingsQueryKey(),
    queryFn: () => apiClient.get<Listing[]>("/listings"),
  });
}

export function useGetListingById(id: number) {
  return useQuery({
    queryKey: getGetListingByIdQueryKey(id),
    queryFn: () => apiClient.get<Listing>(`/listings/${id}`),
    enabled: !!id,
  });
}

export function useCreateListing(options?: {
  mutation?: {
    onSuccess?: (data: Listing) => void;
    onError?: (err: unknown) => void;
  };
}) {
  return useMutation({
    mutationFn: ({ data }: { data: CreateListingInput }) =>
      apiClient.post<Listing>("/listings", data),
    ...options?.mutation,
  });
}

export function useGenerateListingContent(options?: {
  mutation?: {
    onSuccess?: (data: Listing) => void;
    onError?: (err: unknown) => void;
  };
}) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiClient.post<Listing>(`/listings/${id}/generate`, {}),
    ...options?.mutation,
  });
}

export function useDeleteListing(options?: {
  mutation?: {
    onSuccess?: () => void;
    onError?: (err: unknown) => void;
  };
}) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiClient.delete<void>(`/listings/${id}`),
    ...options?.mutation,
  });
}

export function useUploadImage(options?: {
  mutation?: {
    onSuccess?: (data: { url: string }) => void;
    onError?: (err: unknown) => void;
  };
}) {
  return useMutation({
    mutationFn: ({ file }: { file: File }) => apiClient.uploadImage(file),
    ...options?.mutation,
  });
}
