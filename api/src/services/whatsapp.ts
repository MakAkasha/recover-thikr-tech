import path from 'path';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { prisma } from '../db/client';
import { emitQr, emitWhatsappReady } from '../ws/qrSocket';

const sessions = new Map<string, Client>();
const lastSeenByStore = new Map<string, string>();

export function getSessionHealth() {
  const stores = Array.from(sessions.keys());
  return {
    connectedStores: stores.length,
    stores,
  };
}

export function listSessionStatuses() {
  return Array.from(new Set([...sessions.keys(), ...lastSeenByStore.keys()])).map((storeId) => ({
    storeId,
    connected: sessions.has(storeId),
    lastSeen: lastSeenByStore.get(storeId) ?? null,
  }));
}

export async function getOrCreateSession(storeId: string): Promise<Client> {
  if (sessions.has(storeId)) return sessions.get(storeId)!;

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: storeId,
      dataPath: path.join('/data/whatsapp-sessions'),
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    },
  });

  client.on('qr', async (qr) => {
    const dataUrl = await QRCode.toDataURL(qr);
    emitQr(storeId, dataUrl);
  });

  client.on('ready', async () => {
    lastSeenByStore.set(storeId, new Date().toISOString());
    await prisma.store.update({
      where: { id: storeId },
      data: {
        whatsappConnected: true,
        whatsappNumber: client.info.wid.user,
        whatsappSessionId: storeId,
      },
    });
    emitWhatsappReady(storeId);
  });

  client.on('disconnected', async () => {
    sessions.delete(storeId);
    lastSeenByStore.set(storeId, new Date().toISOString());
    await prisma.store.update({ where: { id: storeId }, data: { whatsappConnected: false } });
  });

  await client.initialize();
  sessions.set(storeId, client);
  return client;
}

export async function sendMessage(storeId: string, phone: string, message: string): Promise<void> {
  const client = sessions.get(storeId);
  if (!client) throw new Error('WhatsApp session not found');

  const chatId = phone.replace('+', '') + '@c.us';
  await client.sendMessage(chatId, message);
}
