'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Packing } from '@/types/api';

export function usePackings() {
  return useQuery<Packing[]>({
    queryKey: ['packings'],
    queryFn: () => api.get('/packings').then((r) => r.data),
  });
}

export function usePacking(id: string | null) {
  return useQuery<Packing>({
    queryKey: ['packings', id],
    queryFn: () => api.get(`/packings/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePacking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fileName: string; clientId: string }) =>
      api.post('/packings', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packings'] });
    },
  });
}

export function useFinalizePacking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/packings/${id}/finalize`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packings'] });
      qc.invalidateQueries({ queryKey: ['bars'] });
    },
  });
}

export function useValidatePacking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      bars,
    }: {
      id: string;
      bars: Array<{
        barId: string;
        barNumber?: string;
        grossWeight: number;
        purity: number;
        leyAg?: number;
        photoUrl?: string;
      }>;
    }) => api.post(`/packings/${id}/validate`, { bars }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packings'] });
      qc.invalidateQueries({ queryKey: ['bars'] });
    },
  });
}
