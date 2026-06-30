'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createLead } from '@/lib/api';

interface FormValues {
  name: string;
  email: string;
  campaignId: string;
}

interface LeadFormProps {
  onSuccess: () => void;
}

export default function LeadForm({ onSuccess }: LeadFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(false);
    try {
      await createLead(values);
      setSuccess(true);
      reset();
      onSuccess();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-5">Create New Lead</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Budi Santoso"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            {...register('name', {
              required: 'Name is required',
              maxLength: { value: 100, message: 'Name must not exceed 100 characters' },
            })}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="e.g. budi@example.com"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Campaign ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. CAMP-2024-Q3"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.campaignId ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            {...register('campaignId', {
              required: 'Campaign ID is required',
              maxLength: { value: 50, message: 'Campaign ID must not exceed 50 characters' },
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: 'Only letters, numbers, hyphens, and underscores allowed',
              },
            })}
          />
          {errors.campaignId && (
            <p className="mt-1 text-xs text-red-500">{errors.campaignId.message}</p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Lead created successfully and queued for processing!
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Lead'}
        </button>
      </form>
    </section>
  );
}
