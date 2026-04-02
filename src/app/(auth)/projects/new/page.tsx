'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProject } from '@/lib/queries/planify';

// ─── Schema ──────────────────────────────────────────────────────────────────

const COUNCILS = [
  'Carlow',
  'Cavan',
  'Clare',
  'Cork City',
  'Cork County',
  'Donegal',
  'Dublin City',
  'Dun Laoghaire-Rathdown',
  'Fingal',
  'Galway City',
  'Galway County',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'South Dublin',
  'Tipperary',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow',
] as const;

const DEVELOPMENT_TYPES = [
  'Residential Extension',
  'New Build',
  'Commercial',
  'Mixed Use',
  'Change of Use',
] as const;

const createProjectSchema = z.object({
  siteAddress: z.string().min(5, 'Site address must be at least 5 characters'),
  eircode: z.string().optional(),
  councilArea: z.string().min(1, 'Please select a council area'),
  developmentType: z.string().min(1, 'Please select a development type'),
  developmentDescription: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be under 2000 characters'),
  siteAreaSqm: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Must be a positive number')
    .optional()
    .or(z.literal('')),
  numberOfUnits: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number')
    .positive('Must be a positive number')
    .optional()
    .or(z.literal('')),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

// ─── Field Label ─────────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  label,
  required,
  hint,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      siteAddress: '',
      eircode: '',
      councilArea: '',
      developmentType: '',
      developmentDescription: '',
      siteAreaSqm: '' as unknown as undefined,
      numberOfUnits: '' as unknown as undefined,
    },
  });

  const onSubmit = async (data: CreateProjectForm) => {
    const payload = {
      siteAddress: data.siteAddress,
      eircode: data.eircode || undefined,
      councilArea: data.councilArea,
      developmentType: data.developmentType,
      developmentDescription: data.developmentDescription,
      siteAreaSqm:
        data.siteAreaSqm !== '' && data.siteAreaSqm != null
          ? Number(data.siteAreaSqm)
          : undefined,
      numberOfUnits:
        data.numberOfUnits !== '' && data.numberOfUnits != null
          ? Number(data.numberOfUnits)
          : undefined,
    };

    const created = await createProject.mutateAsync(payload);
    router.push(`/projects/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="space-y-2">
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </button>
        <h1 className="text-xl font-semibold text-foreground">New Project</h1>
        <p className="text-sm text-foreground-muted">
          Enter your site and development details. Our research agent will
          analyse council requirements and generate your application package.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold text-foreground">
            Development Details
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Site Address */}
            <div>
              <FieldLabel
                htmlFor="siteAddress"
                label="Site Address"
                required
              />
              <Input
                id="siteAddress"
                placeholder="e.g. 12 Maple Drive, Blackrock, Co. Dublin"
                {...register('siteAddress')}
              />
              {errors.siteAddress && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.siteAddress.message}
                </p>
              )}
            </div>

            {/* Eircode */}
            <div>
              <FieldLabel
                htmlFor="eircode"
                label="Eircode"
                hint="Optional but helps with precise location"
              />
              <Input
                id="eircode"
                placeholder="e.g. A94 X6T2"
                className="w-40"
                {...register('eircode')}
              />
            </div>

            {/* Council Area */}
            <div>
              <FieldLabel
                htmlFor="councilArea"
                label="Council Area"
                required
              />
              <Controller
                name="councilArea"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="councilArea">
                      <SelectValue placeholder="Select council area" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNCILS.map((council) => (
                        <SelectItem key={council} value={council}>
                          {council}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.councilArea && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.councilArea.message}
                </p>
              )}
            </div>

            {/* Development Type */}
            <div>
              <FieldLabel
                htmlFor="developmentType"
                label="Development Type"
                required
              />
              <Controller
                name="developmentType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="developmentType">
                      <SelectValue placeholder="Select development type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVELOPMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.developmentType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.developmentType.message}
                </p>
              )}
            </div>

            {/* Development Description */}
            <div>
              <FieldLabel
                htmlFor="developmentDescription"
                label="Development Description"
                required
                hint="Describe the proposed works in detail (min. 50 characters)"
              />
              <textarea
                id="developmentDescription"
                rows={4}
                placeholder="Describe the proposed development, including the nature and extent of works, materials, and any relevant details..."
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                {...register('developmentDescription')}
              />
              {errors.developmentDescription && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.developmentDescription.message}
                </p>
              )}
            </div>

            {/* Site Area & Units (side by side) */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel
                  htmlFor="siteAreaSqm"
                  label="Site Area (m\u00b2)"
                  hint="Optional"
                />
                <Input
                  id="siteAreaSqm"
                  type="number"
                  placeholder="e.g. 250"
                  {...register('siteAreaSqm', { valueAsNumber: true })}
                />
                {errors.siteAreaSqm && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.siteAreaSqm.message}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel
                  htmlFor="numberOfUnits"
                  label="Number of Units"
                  hint="Optional, for multi-unit developments"
                />
                <Input
                  id="numberOfUnits"
                  type="number"
                  placeholder="e.g. 4"
                  {...register('numberOfUnits', { valueAsNumber: true })}
                />
                {errors.numberOfUnits && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.numberOfUnits.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {createProject.error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {(createProject.error as Error).message ||
                  'Failed to create project. Please try again.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                className="gap-1.5 bg-brand-500 hover:bg-brand-600"
                disabled={isSubmitting || createProject.isPending}
              >
                {(isSubmitting || createProject.isPending) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create & Start Research
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/projects')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
