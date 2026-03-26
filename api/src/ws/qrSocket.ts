import { Server } from 'http';
import { WebSocketServer } from 'ws';

const socketsByStore = new Map<string, Set<any>>();

export function initQrWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (socket, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const storeId = url.searchParams.get('storeId');
    if (!storeId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Missing storeId' }));
      socket.close();
      return;
    }

    if (!socketsByStore.has(storeId)) {
      socketsByStore.set(storeId, new Set());
    }
    socketsByStore.get(storeId)?.add(socket);

    socket.on('close', () => {
      socketsByStore.get(storeId)?.delete(socket);
    });
  });
}

export function emitQr(storeId: string, qrDataUrl: string): void {
  const sockets = socketsByStore.get(storeId);
  if (!sockets) return;

  const payload = JSON.stringify({ type: 'qr', data: qrDataUrl });
  for (const socket of sockets) {
    socket.send(payload);
  }
}

export function emitWhatsappReady(storeId: string): void {
  const sockets = socketsByStore.get(storeId);
  if (!sockets) return;

  const payload = JSON.stringify({ type: 'ready' });
  for (const socket of sockets) {
    socket.send(payload);
  }
}
