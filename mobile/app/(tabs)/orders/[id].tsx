import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { queryKeys } from '@/constants/queryKeys';
import { sl } from '@/constants/i18n';
import { LoadingView } from '@/components/ui/LoadingView';
import { ErrorView } from '@/components/ui/ErrorView';
import { RoleGate } from '@/components/RoleGate';
import { formatApiError } from '@/lib/http/errors';
import { NEXT_STATUS, canAdvance } from '@/lib/orders/statusFlow';
import { ORDER_STATUS_VALUES, type OrderStatus } from '@/types/api';

const STATUS_COLORS: Record<OrderStatus, string> = {
  Requested: '#f59e0b',
  Approved:  '#0ea5e9',
  Delivered: '#22c55e',
  Closed:    '#94a3b8',
};

export default function OrderDetailScreen(): React.ReactElement {
  const { id }      = useLocalSearchParams<{ id: string }>();
  const router      = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.orderDetail(id!),
    queryFn:  () => ordersApi.getById(id!),
    enabled:  !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(id!, ORDER_STATUS_VALUES[status]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(id!) });
    },
    onError: (err) => Alert.alert(sl.common.error, formatApiError(err)),
  });

  if (isLoading) return <LoadingView />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  const color = STATUS_COLORS[data.status];
  const next  = NEXT_STATUS[data.status];

  const confirmAdvance = (target: OrderStatus) => {
    Alert.alert(
      sl.orders.updateStatus,
      `${sl.orders.statuses[data.status]} → ${sl.orders.statuses[target]}`,
      [
        { text: sl.common.cancel, style: 'cancel' },
        { text: sl.common.save,   onPress: () => statusMutation.mutate(target) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBtn}>← Nazaj</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>#{data.id.slice(0, 8)}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusCard, { borderLeftColor: color }]}>
          <Text style={styles.fieldLabel}>{sl.orders.status}</Text>
          <Text style={[styles.statusValue, { color }]}>{sl.orders.statuses[data.status]}</Text>
        </View>

        <Field label={sl.orders.quantity}     value={String(data.quantity)} />
        <Field label={sl.orders.product}      value={data.productId}   mono />
        <Field label={sl.orders.warehouse}    value={data.warehouseId} mono />
        <Field label={sl.orders.company}      value={data.companyId}   mono />
        <Field label={sl.orders.driver}       value={data.driverId}    mono />
        <Field label={sl.orders.deliveryDate} value={data.deliveryDate ? new Date(data.deliveryDate).toLocaleString('sl-SI') : '—'} />
        <Field label="Ustvarjeno"             value={new Date(data.createdAt).toLocaleString('sl-SI')} />

        {canAdvance(data.status) && next && (
          <RoleGate feature="ORDERS_STATUS_UPDATE">
            <TouchableOpacity
              style={[styles.advBtn, statusMutation.isPending && styles.btnDisabled]}
              onPress={() => confirmAdvance(next)}
              disabled={statusMutation.isPending}
            >
              <Text style={styles.advBtnText}>→ {sl.orders.statuses[next]}</Text>
            </TouchableOpacity>
          </RoleGate>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }): React.ReactElement {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f1f5f9' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerBtn:   { color: '#3b82f6', fontSize: 15 },
  title:       { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1, textAlign: 'center' },
  content:     { padding: 16, gap: 4 },
  statusCard:  { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderLeftWidth: 3 },
  statusValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  field:       { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  fieldLabel:  { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  fieldValue:  { fontSize: 15, color: '#1e293b' },
  mono:        { fontFamily: 'monospace', fontSize: 11, color: '#475569' },
  advBtn:      { marginTop: 12, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  advBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
