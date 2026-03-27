import axios from 'axios';
import { config } from '../config';
import { prisma } from '../db/client';

type StoreLike = {
  id: string;
  sallaAccessToken: string;
  sallaRefreshToken: string;
};

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
}

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.sallaClientId,
    client_secret: config.sallaClientSecret,
    code,
    redirect_uri: `${config.apiUrl}/auth/salla/callback`,
  });

  const { data } = await axios.post<OAuthTokenResponse>(`${config.sallaOAuthBaseUrl}/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data;
}

export async function refreshSallaAccessToken(storeId: string): Promise<StoreLike> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.sallaClientId,
    client_secret: config.sallaClientSecret,
    refresh_token: store.sallaRefreshToken,
  });

  const { data } = await axios.post<OAuthTokenResponse>(`${config.sallaOAuthBaseUrl}/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      sallaAccessToken: data.access_token,
      sallaRefreshToken: data.refresh_token,
    },
  });

  return {
    id: updated.id,
    sallaAccessToken: updated.sallaAccessToken,
    sallaRefreshToken: updated.sallaRefreshToken,
  };
}

async function sallaGet<T>(store: StoreLike, path: string): Promise<T> {
  try {
    const { data } = await axios.get<T>(`${config.sallaApiBaseUrl}${path}`, {
      headers: { Authorization: `Bearer ${store.sallaAccessToken}` },
    });
    return data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const refreshed = await refreshSallaAccessToken(store.id);
      const { data } = await axios.get<T>(`${config.sallaApiBaseUrl}${path}`, {
        headers: { Authorization: `Bearer ${refreshed.sallaAccessToken}` },
      });
      return data;
    }
    throw error;
  }
}

async function sallaPost<T>(store: StoreLike, path: string, payload: unknown): Promise<T> {
  try {
    const { data } = await axios.post<T>(`${config.sallaApiBaseUrl}${path}`, payload, {
      headers: { Authorization: `Bearer ${store.sallaAccessToken}` },
    });
    return data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const refreshed = await refreshSallaAccessToken(store.id);
      const { data } = await axios.post<T>(`${config.sallaApiBaseUrl}${path}`, payload, {
        headers: { Authorization: `Bearer ${refreshed.sallaAccessToken}` },
      });
      return data;
    }
    throw error;
  }
}

export async function fetchStoreProfile(accessToken: string): Promise<{ id: string; name: string; domain: string }> {
  const { data } = await axios.get<any>(`${config.sallaApiBaseUrl}/store/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const store = data?.data ?? data;
  return {
    id: String(store.id),
    name: store.name ?? 'Salla Store',
    domain: store.domain ?? '',
  };
}

export async function registerAbandonedCartWebhook(store: StoreLike): Promise<void> {
  await sallaPost(store, '/webhooks', {
    name: 'baqi - Abandoned Cart',
    event: 'abandoned.cart',
    url: `${config.apiUrl}/webhook/salla/${store.id}`,
    secret: config.sallaWebhookSecret,
  });
}

export async function isCartConverted(storeId: string, cartId: string): Promise<boolean> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');

  const response = await sallaGet<any>(
    {
      id: store.id,
      sallaAccessToken: store.sallaAccessToken,
      sallaRefreshToken: store.sallaRefreshToken,
    },
    `/abandoned-carts/${cartId}`,
  );

  const cart = response?.data ?? response;
  return Boolean(cart?.converted || cart?.order_id || cart?.status === 'completed');
}
