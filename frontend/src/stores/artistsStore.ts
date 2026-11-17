import { create } from 'zustand';
import artistsService from '../services/artists';
import { apiError } from '../services/auth';
import type { Artist } from '../types/artist';

// Tiempo que la lista guardada en memoria se considera al día.
const FRESH_MS = 60_000;

// Store global de artistas: varias vistas (Artistas, Gestión, Otras exposiciones)
// comparten la misma lista y no la vuelven a pedir al servidor si ya está en memoria.
interface ArtistsState {
  artists: Artist[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string;
  loadedAt: number;
  // force = true la pide de nuevo aunque esté guardada (después de crear, editar o borrar).
  load: (force?: boolean) => Promise<void>;
}

let pending: Promise<void> | null = null;

export const useArtistsStore = create<ArtistsState>()((set, get) => ({
  artists: [],
  status: 'idle',
  error: '',
  loadedAt: 0,

  load(force = false) {
    const { status, loadedAt } = get();
    if (!force && status === 'ready' && Date.now() - loadedAt < FRESH_MS) return Promise.resolve();
    // Si otra vista ya la está pidiendo, se espera esa misma petición.
    if (pending && !force) return pending;
    // Si ya hay datos se siguen mostrando mientras se recarga.
    if (get().status !== 'ready') set({ status: 'loading', error: '' });
    const current = artistsService.getAll()
      .then(artists => {
        if (pending === current) set({ artists, status: 'ready', error: '', loadedAt: Date.now() });
      })
      .catch((reason: unknown) => {
        if (pending !== current) return;
        // Si ya había una lista, se mantiene y solo se avisa del error.
        set(state => ({ status: state.loadedAt ? 'ready' : 'error', error: apiError(reason) }));
      })
      .finally(() => { if (pending === current) pending = null; });
    pending = current;
    return current;
  },
}));
