import React, { useState } from 'react';
import { View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/inventory';
import { warehousesApi } from '@/lib/api/warehouses';
import { productsApi } from '@/lib/api/products';
import { queryKeys } from '@erp/domain';
import { formatApiError } from '@/lib/http/errors';
import { sl } from '@/constants/i18n';
import type { WarehouseResponse, ProductResponse } from '@erp/api-types';

export default function AddStockScreen(): React.ReactElement {
  const router       = useRouter();
  const queryClient  = useQueryClient();

  const [warehouseId, setWarehouseId] = useState('');
  const [productId,   setProductId]   = useState('');
  const [quantity,    setQuantity]     = useState('');
  const [minQuantity, setMinQuantity]  = useState('');
  const [maxQuantity, setMaxQuantity]  = useState('');

  const { data: warehouses } = useQuery({ queryKey: queryKeys.warehouses, queryFn: warehousesApi.getAll });
  const { data: products }   = useQuery({ queryKey: queryKeys.products,   queryFn: productsApi.getAll });

  const mutation = useMutation({
    mutationFn: () => inventoryApi.addStock({
      warehouseId,
      productId,
      quantity: parseInt(quantity, 10),
      // Send thresholds only when the user actually typed something. Backend
      // treats null as "leave existing values alone" (Gap 13 semantics).
      minQuantity: minQuantity.trim() ? parseInt(minQuantity, 10) : null,
      maxQuantity: maxQuantity.trim() ? parseInt(maxQuantity, 10) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAll });
      if (warehouseId) queryClient.invalidateQueries({ queryKey: queryKeys.stockByWarehouse(warehouseId) });
      router.back();
    },
    onError: (err) => Alert.alert(sl.common.error, formatApiError(err)),
  });

  const minNum = minQuantity.trim() ? parseInt(minQuantity, 10) : null;
  const maxNum = maxQuantity.trim() ? parseInt(maxQuantity, 10) : null;
  const thresholdsValid =
    (minNum === null || minNum >= 0) &&
    (maxNum === null || maxNum >= 0) &&
    (minNum === null || maxNum === null || maxNum >= minNum);
  const canSubmit = warehouseId && productId && parseInt(quantity, 10) > 0 && thresholdsValid;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>{sl.common.cancel}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{sl.stock.addStock}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>{sl.stock.warehouse}</Text>
        <PickerList
          items={warehouses ?? []}
          selected={warehouseId}
          onSelect={setWarehouseId}
          getLabel={(w: WarehouseResponse) => w.name}
          getId={(w) => w.id}
        />

        <Text style={styles.label}>{sl.stock.product}</Text>
        <PickerList
          items={products ?? []}
          selected={productId}
          onSelect={setProductId}
          getLabel={(p: ProductResponse) => `${p.name} (${p.sku})`}
          getId={(p) => p.id}
        />

        <Text style={styles.label}>{sl.stock.quantity}</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="0"
        />

        <View style={styles.thresholdsRow}>
          <View style={styles.thresholdCol}>
            <Text style={styles.label}>{sl.stock.minQuantity}</Text>
            <TextInput
              style={styles.input}
              value={minQuantity}
              onChangeText={setMinQuantity}
              keyboardType="number-pad"
              placeholder="—"
            />
          </View>
          <View style={styles.thresholdCol}>
            <Text style={styles.label}>{sl.stock.maxQuantity}</Text>
            <TextInput
              style={styles.input}
              value={maxQuantity}
              onChangeText={setMaxQuantity}
              keyboardType="number-pad"
              placeholder="—"
            />
          </View>
        </View>
        {!thresholdsValid && (
          <Text style={styles.thresholdWarn}>{sl.stock.thresholdInvalid}</Text>
        )}

        <TouchableOpacity
          style={[styles.btn, (!canSubmit || mutation.isPending) && styles.btnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{sl.stock.addStock}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PickerList<T>({
  items, selected, onSelect, getLabel, getId,
}: {
  items: T[];
  selected: string;
  onSelect: (id: string) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
}): React.ReactElement {
  return (
    <View style={pl.list}>
      {items.map((item) => {
        const id = getId(item);
        const active = id === selected;
        return (
          <TouchableOpacity
            key={id}
            style={[pl.item, active && pl.itemActive]}
            onPress={() => onSelect(id)}
          >
            <Text style={[pl.itemText, active && pl.itemTextActive]} numberOfLines={1}>
              {getLabel(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pl = StyleSheet.create({
  list:          { gap: 4, marginBottom: 16 },
  item:          { padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  itemActive:    { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  itemText:      { fontSize: 13, color: '#374151' },
  itemTextActive:{ color: '#3b82f6', fontWeight: '600' },
});

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f1f5f9' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cancel:     { color: '#3b82f6', fontSize: 15 },
  title:      { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  content:    { padding: 16 },
  label:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  input:      { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fff', marginBottom: 16 },
  thresholdsRow:   { flexDirection: 'row', gap: 12 },
  thresholdCol:    { flex: 1 },
  thresholdWarn:   { color: '#b45309', fontSize: 12, marginTop: -8, marginBottom: 12 },
  btn:        { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});
