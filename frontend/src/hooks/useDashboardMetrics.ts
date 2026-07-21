'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardMetrics } from '@/types/api';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  clientId?: string;
}

export function useDashboardMetrics(filters?: DashboardFilters) {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.supplierId) params.set('supplierId', filters.supplierId);
  if (filters?.clientId) params.set('clientId', filters.clientId);
  const qs = params.toString();

  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics', filters],
    queryFn: () => api.get(`/dashboard/metrics${qs ? `?${qs}` : ''}`).then((r) => r.data),
    refetchInterval: 30_000,
  });
}
