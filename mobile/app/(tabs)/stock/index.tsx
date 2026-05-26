import React, { useState } from 'react';
import { View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { inventoryApi } from '@/lib/api/inventory';
import { warehousesApi } from '@/lib/api/warehouses';
import { queryKeys } from '@erp/domain';
import { sl } from '@/constants/i18n';
import { LoadingView } from '@/components/ui/LoadingView';
import { ErrorView } from '@/components/ui/ErrorView';
import { RoleGate } from '@/components/RoleGate';
import type { InventoryResponse, WarehouseResponse } from '@/types/api';

export default function StockScreen(): React.ReactElement {
  const router = useRouter();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const { data: warehouses } = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn:  warehousesApi.getAll,
  });

  const stockQuery = useQuery({
    queryKey: selectedWarehouse ? queryKeys.stockByWarehouse(selectedWarehouse) : queryKeys.stockAll,
    queryFn:  () => selectedWarehouse
      ? inventoryApi.getByWarehouse(selectedWarehouse)
      : inventoryApi.getAll(),
  });

  const warehouseMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    warehouses?.forEach((w) => { m[w.id] = w.name; });
    return m;
  }, [warehouses]);

  if (stockQuery.isLoading) return <LoadingView />;
  if (stockQuery.isError)   return <ErrorView onRetry={stockQuery.refetch} />;

  const items = stockQuery.data ?? [];

  return (
    <SafeAreaView style={styles.root}>
      {/* Warehouse filter chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, !selectedWarehouse && styles.chipActive]}
          onPress={() => setSelectedWarehouse(null)}
        >
          <Text style={[styles.chipText, !selectedWarehouse && styles.chipTextActive]}>
            {sl.stock.allWarehouses}
          </Text>
        </TouchableOpacity>
        {warehouses?.map((w) => (
          <TouchableOpacity
            key={w.id}
            style={[styles.chip, selectedWarehouse === w.id && styles.chipActive]}
            onPress={() => setSelectedWarehouse(w.id)}
          >
            <Text style={[styles.chipText, selectedWarehouse === w.id && styles.chipTextActive]}>
              {w.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={stockQuery.isFetching} onRefresh={stockQuery.refetch} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.empty}>{sl.stock.noItems}</Text>
            <RoleGate feature="INVENTORY_WRITE">
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/stock/add')}
              >
                <Text style={styles.emptyCtaText}>{sl.stock.addStock}</Text>
              </TouchableOpacity>
            </RoleGate>
          </View>
        }
        renderItem={({ item }) => (
          <StockCard item={item} warehouseName={warehouseMap[item.warehouseId] ?? item.warehouseId} />
        )}
      />

      {/* Add stock FAB — INVENTORY_WRITE gated */}
      <RoleGate feature="INVENTORY_WRITE">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/stock/add')}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </RoleGate>
    </SafeAreaView>
  );
}

function StockCard({ item, warehouseName }: { item: InventoryResponse; warehouseName: string }): React.ReactElement {
  // Gap 13 closed: use the server-supplied min threshold when present.
  // Items still without thresholds (created pre-migration) get a sensible
  // default so the badge stays visible for the warehouse manager.
  const minQty = item.minQuantity ?? 10;
  const isLow  = item.quantity < minQty;
  return (
    <View style={[styles.card, isLow && styles.cardLow]}>
      <View style={styles.cardHeader}>
        <Text style={styles.productId} numberOfLines={1}>
          {sl.stock.product}: {item.productId}
        </Text>
        {isLow && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{sl.stock.lowStock}</Text>
          </View>
        )}
      </View>
      <Text style={styles.warehouse}>{sl.stock.warehouse}: {warehouseName}</Text>
      <Text style={styles.quantity}>{item.quantity}</Text>
      <Text style={styles.quantityLabel}>
        {sl.stock.quantity}
        {item.minQuantity != null && ` · min ${item.minQuantity}`}
        {item.maxQuantity != null && ` · max ${item.maxQuantity}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f1f5f9' },
  filterRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive:     { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  chipText:       { fontSize: 12, color: '#64748b' },
  chipTextActive: { color: '#3b82f6', fontWeight: '600' },
  list:           { padding: 12, gap: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyState:     { alignItems: 'center', gap: 12 },
  emptyIcon:      { fontSize: 48 },
  empty:          { color: '#94a3b8', fontSize: 14 },
  emptyCta:       { marginTop: 4, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyCtaText:   { color: '#fff', fontWeight: '600', fontSize: 13 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardLow:        { borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productId:      { fontSize: 13, color: '#475569', flex: 1 },
  badge:          { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText:      { fontSize: 10, color: '#d97706', fontWeight: '600' },
  warehouse:      { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  quantity:       { fontSize: 32, fontWeight: '800', color: '#1e293b' },
  quantityLabel:  { fontSize: 11, color: '#94a3b8' },
  fab:            { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText:        { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
