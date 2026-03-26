'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  storeId: string;
};

export default function QRScanner({ storeId }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const wsUrl = useMemo(() => `ws://localhost:3001/api/ws?storeId=${storeId}`, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'qr') setQr(payload.data);
      if (payload.type === 'ready') setReady(true);
    };
    return () => ws.close();
  }, [storeId, wsUrl]);

  return (
    <div className="rounded-xl bg-white p-5 border border-slate-200" dir="rtl" lang="ar">
      <h3 className="font-semibold mb-3">مسح QR لربط واتساب</h3>
      {ready ? (
        <div className="text-emerald-700 font-semibold">تم ربط واتساب بنجاح ✅</div>
      ) : qr ? (
        <img src={qr} alt="WhatsApp QR" className="w-64 h-64 mx-auto" />
      ) : (
        <div className="text-slate-500">جاري انتظار رمز QR...</div>
      )}
    </div>
  );
}
