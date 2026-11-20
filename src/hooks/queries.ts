import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AppointmentFilters } from '../lib/types';

export const keys = {
  professionals: ['professionals'] as const,
  services: ['services'] as const,
  appointments: (filters: AppointmentFilters) => ['appointments', filters] as const,
  availability: (professionalId: string, serviceId: string, date: string) =>
    ['availability', professionalId, serviceId, date] as const,
};

export const useProfessionals = () =>
  useQuery({ queryKey: keys.professionals, queryFn: api.listProfessionals });

export const useServices = () => useQuery({ queryKey: keys.services, queryFn: api.listServices });

export const useAppointments = (filters: AppointmentFilters) =>
  useQuery({ queryKey: keys.appointments(filters), queryFn: () => api.listAppointments(filters) });

/** Free slots for a professional + service + date. Only runs when all three are chosen. */
export function useAvailability(professionalId: string, serviceId: string, date: string) {
  return useQuery({
    queryKey: keys.availability(professionalId, serviceId, date),
    queryFn: () => api.getAvailability(professionalId, serviceId, date),
    enabled: Boolean(professionalId && serviceId && /^\d{4}-\d{2}-\d{2}$/.test(date)),
    staleTime: 0, // slots change fast: always refetch when the selection changes
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAppointment,
    onSettled: () => {
      // The list and the free slots are both out of date after a booking attempt
      // (even a 409 means someone else took the slot).
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelAppointment,
    onSettled: () => {
      // Cancelling frees the slot, so availability must be refreshed too.
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
