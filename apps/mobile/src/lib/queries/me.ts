import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  meSchema,
  type CompleteOnboardingInput,
  type Me,
  type UpdateProfileInput,
  type UpdateUserInput,
} from '@tlc/shared';
import { api } from '../api';
import { keys } from './keys';

export function useMe(enabled = true) {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get('/me', meSchema),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => api.patch('/me', input, meSchema),
    onSuccess: (me) => qc.setQueryData<Me>(keys.me, me),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.patch('/me/profile', input, meSchema),
    onSuccess: (me) => qc.setQueryData<Me>(keys.me, me),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) => api.post('/me/onboarding', input, meSchema),
    onSuccess: (me) => qc.setQueryData<Me>(keys.me, me),
  });
}

/** DELETE /me — ainda não consta da lista de endpoints da API; ver README. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.delete('/me'),
  });
}
