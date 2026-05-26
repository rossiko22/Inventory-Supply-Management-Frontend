// Barcode scanner.
// Resolves SKU client-side by fetching the product list (cached 5 min via React Query).
// When backend ships GET /products/by-sku (Gap 5), swap resolveScannedCode internals.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView } from 'expo-camera';
import { useBarcode } from '@/lib/scanner/useBarcode';
import { resolveScannedCode } from '@/lib/scanner/resolveScannedCode';
import { sl } from '@/constants/i18n';
import type { ProductResponse } from '@erp/api-types';

type LookupState =
  | { kind: 'idle' }
  | { kind: 'searching'; sku: string }
  | { kind: 'found'; product: ProductResponse }
  | { kind: 'notFound'; sku: string }
  | { kind: 'error'; sku: string; message: string };

export default function ScannerScreen(): React.ReactElement {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const [manualSku, setManualSku] = useState('');
  const [state, setState] = useState<LookupState>({ kind: 'idle' });

  const lookup = async (sku: string) => {
    setState({ kind: 'searching', sku });
    try {
      const product = await resolveScannedCode(queryClient, sku);
      setState(product ? { kind: 'found', product } : { kind: 'notFound', sku });
    } catch (err) {
      setState({ kind: 'error', sku, message: err instanceof Error ? err.message : 'Napaka' });
    }
  };

  const { hasPermission, canAskPermission, requestPermission, scanned, handleScan, reset } =
    useBarcode((result) => { void lookup(result.data); });

  const resetAll = () => { setState({ kind: 'idle' }); setManualSku(''); reset(); };

  const handleManualSubmit = () => {
    const sku = manualSku.trim();
    if (!sku) return;
    void lookup(sku);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Nazaj</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{sl.scanner.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      {!hasPermission ? (
        <View style={styles.permBox}>
          <Text style={styles.permMsg}>{sl.scanner.permissionMsg}</Text>
          {canAskPermission && (
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>{sl.scanner.permissionBtn}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'qr'] }}
            onBarcodeScanned={scanned ? undefined : (result) =>
              handleScan({ type: result.type, data: result.data })
            }
          />
          {scanned && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
              <Text style={styles.resetText}>{sl.scanner.scanning}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ResultPanel
        state={state}
        onOpen={(id) => router.push({ pathname: '/(tabs)/more/products/[id]', params: { id } })}
        onDismiss={resetAll}
      />

      <View style={styles.manual}>
        <Text style={styles.manualLabel}>{sl.scanner.manualEntry}</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualSku}
            onChangeText={setManualSku}
            placeholder="SKU…"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.manualBtn} onPress={handleManualSubmit} disabled={state.kind === 'searching'}>
            <Text style={styles.manualBtnText}>{state.kind === 'searching' ? '…' : 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ResultPanel({ state, onOpen, onDismiss }: { state: LookupState; onOpen: (id: string) => void; onDismiss: () => void }): React.ReactElement | null {
  if (state.kind === 'idle') return null;

  if (state.kind === 'searching') {
    return (
      <View style={styles.resultCard}>
        <ActivityIndicator color="#93c5fd" />
        <Text style={styles.resultMeta}>SKU: {state.sku}</Text>
      </View>
    );
  }

  if (state.kind === 'found') {
    return (
      <View style={[styles.resultCard, styles.resultFound]}>
        <Text style={styles.resultTitle}>{state.product.name}</Text>
        <Text style={styles.resultMeta}>SKU: {state.product.sku}  ·  {state.product.weight} kg</Text>
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.resultBtnPrimary} onPress={() => onOpen(state.product.id)}>
            <Text style={styles.resultBtnPrimaryText}>Odpri produkt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultBtnSecondary} onPress={onDismiss}>
            <Text style={styles.resultBtnSecondaryText}>{sl.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (state.kind === 'notFound') {
    return (
      <View style={[styles.resultCard, styles.resultWarn]}>
        <Text style={styles.resultTitle}>{sl.scanner.notFound}</Text>
        <Text style={styles.resultMeta}>SKU: {state.sku}</Text>
        <TouchableOpacity style={styles.resultBtnSecondary} onPress={onDismiss}>
          <Text style={styles.resultBtnSecondaryText}>{sl.common.cancel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.resultCard, styles.resultError]}>
      <Text style={styles.resultTitle}>{sl.common.error}</Text>
      <Text style={styles.resultMeta}>{state.message}</Text>
      <TouchableOpacity style={styles.resultBtnSecondary} onPress={onDismiss}>
        <Text style={styles.resultBtnSecondaryText}>{sl.common.retry}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:                  { flex: 1, backgroundColor: '#0f172a' },
  header:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1e293b' },
  back:                  { color: '#93c5fd', fontSize: 15 },
  title:                 { fontSize: 16, fontWeight: '700', color: '#fff' },
  permBox:               { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permMsg:               { color: '#94a3b8', textAlign: 'center', marginBottom: 20, fontSize: 14 },
  permBtn:               { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText:           { color: '#fff', fontWeight: '600' },
  cameraBox:             { flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden' },
  camera:                { flex: 1 },
  resetBtn:              { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  resetText:             { color: '#fff', fontWeight: '600' },
  resultCard:            { margin: 16, marginTop: 0, backgroundColor: '#1e293b', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  resultFound:           { borderLeftColor: '#10b981' },
  resultWarn:            { borderLeftColor: '#f59e0b' },
  resultError:           { borderLeftColor: '#dc2626' },
  resultTitle:           { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  resultMeta:            { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  resultActions:         { flexDirection: 'row', gap: 8 },
  resultBtnPrimary:      { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  resultBtnPrimaryText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  resultBtnSecondary:    { flex: 1, borderWidth: 1, borderColor: '#334155', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  resultBtnSecondaryText:{ color: '#cbd5e1', fontWeight: '600', fontSize: 13 },
  manual:                { padding: 16, backgroundColor: '#1e293b' },
  manualLabel:           { color: '#94a3b8', fontSize: 12, marginBottom: 6 },
  manualRow:             { flexDirection: 'row', gap: 8 },
  manualInput:           { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  manualBtn:             { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  manualBtnText:         { color: '#fff', fontWeight: '700' },
});
