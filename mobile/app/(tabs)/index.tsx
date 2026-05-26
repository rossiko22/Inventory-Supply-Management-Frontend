import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
import { ordersApi } from '@/lib/api/orders';
import { notificationsApi } from '@/lib/api/notifications';
import { queryKeys } from '@erp/domain';
import { sl } from '@/constants/i18n';
import { LoadingView } from '@/components/ui/LoadingView';
import { useAuthStore } from '@/stores/authStore';

function KpiCard({ label, value, color = '#3b82f6' }: { label: string; value: string | number; color?: string }): React.ReactElement {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);

  const { data: warehouses, isLoading: wLoading, refetch: rWh } = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn:  warehousesApi.getAll,
  });

  const { data: orders, isLoading: oLoading, refetch: rOrd } = useQuery({
    queryKey: queryKeys.orders,
    queryFn:  ordersApi.getAll,
  });

  const { data: unread, isLoading: nLoading, refetch: rNot } = useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn:  notificationsApi.getUnread,
    refetchInterval: 30_000,
  });

  const isLoading = wLoading || oLoading || nLoading;
  const refreshing = false;

  const onRefresh = async () => { await Promise.all([rWh(), rOrd(), rNot()]); };

  if (isLoading) return <LoadingView />;

  const pendingOrders = orders?.filter((o) =>
    o.status === 'Requested' || o.status === 'Approved',
  ).length ?? 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Zdravo, {user?.name ?? 'uporabnik'} 👋</Text>

      <View style={styles.kpiRow}>
        <KpiCard label={sl.dashboard.warehouses} value={warehouses?.length ?? 0} color="#3b82f6" />
        <KpiCard label={sl.dashboard.orders}     value={orders?.length ?? 0}    color="#0ea5e9" />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard label="Aktivna naročila" value={pendingOrders}         color="#f59e0b" />
        <KpiCard label="Neprebrana obvestila" value={unread?.length ?? 0} color="#ef4444" />
      </View>

      {unread && unread.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sl.dashboard.recentAlerts}</Text>
          {unread.slice(0, 5).map((n) => (
            <View key={n.id} style={styles.alertCard}>
              <Text style={styles.alertTitle}>{n.title}</Text>
              <Text style={styles.alertBody}>{n.body}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f1f5f9' },
  content:      { padding: 16, paddingBottom: 32 },
  greeting:     { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  kpiRow:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  kpiValue:     { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  kpiLabel:     { fontSize: 12, color: '#64748b', marginTop: 2 },
  section:      { marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  alertCard:    { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#f59e0b', elevation: 1 },
  alertTitle:   { fontWeight: '600', color: '#1e293b', fontSize: 13 },
  alertBody:    { color: '#64748b', fontSize: 12, marginTop: 2 },
});
