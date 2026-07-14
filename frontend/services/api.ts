import { Card, CardStatus, ReorderItem } from '@/types';
import { getSocketId } from './socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Every mutating request carries the current socket id so the backend can
// stamp broadcasts with an "originSocketId". The client that issued the
// request then ignores its own broadcast to avoid double-applying updates.
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const socketId = getSocketId();
  if (socketId) {
    (headers as Record<string, string>)['X-Socket-Id'] = socketId;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const body = await res.json();
  return body.data as T;
}

export const cardApi = {
  async getAll(): Promise<Card[]> {
    const res = await fetch(`${API_URL}/cards`, { cache: 'no-store' });
    return handleResponse<Card[]>(res);
  },

  async create(title: string, status: CardStatus = 'TODO'): Promise<Card> {
    const res = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ title, status }),
    });
    return handleResponse<Card>(res);
  },

  async rename(id: string, title: string): Promise<Card> {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse<Card>(res);
  },

  async updateStatus(id: string, status: CardStatus, position?: number): Promise<Card> {
    const res = await fetch(`${API_URL}/cards/${id}/status`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ status, position }),
    });
    return handleResponse<Card>(res);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/cards/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    return handleResponse<void>(res);
  },

  async reorder(cards: ReorderItem[]): Promise<Card[]> {
    const res = await fetch(`${API_URL}/cards/reorder`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ cards }),
    });
    return handleResponse<Card[]>(res);
  },
};
