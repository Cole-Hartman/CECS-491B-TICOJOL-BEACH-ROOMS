import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Report, ReportCategory } from '@/types/database';

interface SubmitReportData {
  classroomId?: string;
  reportType: ReportCategory;
  description: string;
  contactEmail?: string;
}

interface UseReportsResult {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitReport: (data: SubmitReportData) => Promise<Report>;
  fetchUserReports: () => Promise<void>;
}

function getDeviceInfo(): { platform: string; os_version?: string } {
  return {
    platform: Platform.OS,
    os_version: Platform.Version?.toString(),
  };
}

function getAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

export function useReports(): UseReportsResult {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setReports(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserReports();
    }
  }, [user, fetchUserReports]);

  const submitReport = useCallback(
    async (data: SubmitReportData): Promise<Report> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const reportData = {
          user_id: user?.id || null,
          classroom_id: data.classroomId || null,
          report_type: data.reportType,
          description: data.description,
          status: 'submitted' as const,
          contact_email: data.contactEmail || null,
          device_info: getDeviceInfo(),
          app_version: getAppVersion(),
        };

        const { data: insertedReport, error: insertError } = await supabase
          .from('reports')
          .insert(reportData)
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Refresh the reports list if user is logged in
        if (user) {
          await fetchUserReports();
        }

        return insertedReport;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit report';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, fetchUserReports]
  );

  return {
    reports,
    isLoading,
    error,
    isSubmitting,
    submitReport,
    fetchUserReports,
  };
}
