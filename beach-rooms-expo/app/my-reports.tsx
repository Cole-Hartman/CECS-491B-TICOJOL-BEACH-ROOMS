import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useReports } from '@/hooks/use-reports';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth-provider';
import type { ReportCategory, ReportStatus } from '@/types/database';

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: '#6c757d' },
  in_review: { label: 'In Review', color: '#007bff' },
  resolved: { label: 'Resolved', color: '#28a745' },
  closed: { label: 'Closed', color: '#5a6268' },
};

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  incorrect_time: 'Incorrect Time',
  incorrect_info: 'Incorrect Info',
  app_bug: 'App Bug',
  other: 'Other',
};

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { reports, isLoading, error, fetchUserReports } = useReports();

  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBgColor = useThemeColor(
    { light: 'rgba(0,0,0,0.03)', dark: 'rgba(255,255,255,0.05)' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.08)' },
    'text'
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isLoggedIn) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={tintColor} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            My Reports
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="log-in-outline" size={48} color={iconColor} />
          <ThemedText style={[styles.emptyText, { color: iconColor }]}>
            Sign in to view your reports
          </ThemedText>
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          My Reports
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={fetchUserReports}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={iconColor} />
          <ThemedText style={[styles.emptyText, { color: iconColor }]}>
            No reports yet
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: iconColor }]}>
            Submit a report to help improve BeachRooms
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchUserReports}
              tintColor={tintColor}
            />
          }
        >
          {reports.map((report) => {
            const statusConfig = STATUS_CONFIG[report.status];
            const categoryLabel = CATEGORY_LABELS[report.report_type];

            return (
              <View
                key={report.id}
                style={[styles.reportCard, { backgroundColor: cardBgColor, borderColor }]}
              >
                <View style={styles.reportHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                    <ThemedText style={styles.statusText}>{statusConfig.label}</ThemedText>
                  </View>
                  <ThemedText style={[styles.dateText, { color: iconColor }]}>
                    {formatDate(report.created_at)}
                  </ThemedText>
                </View>

                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag-outline" size={16} color={iconColor} />
                  <ThemedText style={[styles.categoryText, { color: iconColor }]}>
                    {categoryLabel}
                  </ThemedText>
                </View>

                <ThemedText style={styles.descriptionText} numberOfLines={3}>
                  {report.description}
                </ThemedText>

                <View style={styles.reportFooter}>
                  <ThemedText style={[styles.reportId, { color: iconColor }]}>
                    ID: {report.id.substring(0, 8)}...
                  </ThemedText>
                </View>
              </View>
            );
          })}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 44,
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  signInButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  reportFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
    paddingTop: 12,
  },
  reportId: {
    fontSize: 11,
  },
});
