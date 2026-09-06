import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bodyMeasurementSchema,
  paginatedSchema,
  personalRecordSchema,
  progressOverviewSchema,
  type UpsertBodyMeasurementInput,
} from '@tlc/shared';
import { z } from 'zod';
import { api } from '../api';
import { keys } from './keys';

/** A API pode devolver lista simples ou paginada; aceitamos ambas. */
const listOrPage = <T extends z.ZodTypeAny>(item: T) =>
  z.union([z.array(item), paginatedSchema(item)]).transform((v) => (Array.isArray(v) ? v : v.items));

const measurementsSchema = listOrPage(bodyMeasurementSchema);
const recordsSchema = listOrPage(personalRecordSchema);

export function useProgressOverview() {
  return useQuery({
    queryKey: keys.progressOverview,
    queryFn: () => api.get('/progress/overview', progressOverviewSchema),
  });
}

export function useMeasurements() {
  return useQuery({
    queryKey: keys.measurements,
    queryFn: () => api.get('/progress/measurements', measurementsSchema),
  });
}

export function useRecords() {
  return useQuery({
    queryKey: keys.records,
    queryFn: () => api.get('/progress/records', recordsSchema),
  });
}

export function useUpsertMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertBodyMeasurementInput) =>
      api.put('/progress/measurements', input, bodyMeasurementSchema.optional()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
