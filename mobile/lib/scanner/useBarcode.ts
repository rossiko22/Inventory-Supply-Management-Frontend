// Barcode scanner helpers.
// Full flow is pending /products/by-sku endpoint (ARCHITECTURE_GAPS.md Gap 5).
// This pass: permission flow + scan callback wired; product lookup is a stub.

import { useState, useCallback } from 'react';
import { Camera, useCameraPermissions } from 'expo-camera';

export interface BarcodeScanResult {
  type: string;
  data: string;
}

export function useBarcode(onScanned: (result: BarcodeScanResult) => void) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(
    (result: BarcodeScanResult) => {
      if (scanned) return;
      setScanned(true);
      onScanned(result);
    },
    [scanned, onScanned],
  );

  const reset = useCallback(() => setScanned(false), []);

  return {
    hasPermission: permission?.granted ?? false,
    canAskPermission: permission?.canAskAgain ?? true,
    requestPermission,
    scanned,
    handleScan,
    reset,
  };
}
