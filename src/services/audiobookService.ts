import type { AudiobookItem, Track } from '../types/music';
import { streamResolver } from './streamResolver';

export interface AudiobookProgress {
  trackId: string;
  audiobookId?: string;
  trackTitle?: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

const PROGRESS_STORAGE_KEY = 'mixtape_audiobook_progress_v1';

function parseDurationString(raw?: string | number): number {
  if (typeof raw === 'number' && isFinite(raw)) return Math.round(raw);
  if (!raw) return 0;
  const str = String(raw).trim();
  if (/^\d+(\.\d+)?$/.test(str)) return Math.round(parseFloat(str));
  const parts = str.split(':').map(Number);
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

class AudiobookService {
  private archiveSearchCache = new Map<string, { data: AudiobookItem[]; expiresAt: number }>();
  private ytSearchCache = new Map<string, { data: AudiobookItem[]; expiresAt: number }>();
  private chaptersCache = new Map<string, { data: Track[]; expiresAt: number }>();

  /**
   * Search public-domain audiobooks (LibriVox & Poetry/Books) on Internet Archive (CORS *)
   */
  async searchArchiveAudiobooks(query: string = '', limit: number = 18): Promise<AudiobookItem[]> {
    const clean = query.trim();
    const cacheKey = `${clean.toLowerCase()}_${limit}`;
    const cached = this.archiveSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const baseFilter = 'collection:(librivoxaudio OR audio_bookspoetry) AND language:(Spanish OR spa)';
      const q = clean
        ? `${baseFilter} AND (title:(${clean}) OR creator:(${clean}) OR subject:(${clean}))`
        : baseFilter;

      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
        q
      )}&fl[]=identifier,title,creator,description,downloads&sort[]=downloads+desc&rows=${limit}&output=json`;

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      const json = await res.json();
      const docs = json?.response?.docs || [];

      const items: AudiobookItem[] = docs
        .filter((d: any) => d.identifier && d.title)
        .map((d: any) => {
          const creator = Array.isArray(d.creator) ? d.creator.join(', ') : d.creator || 'Autor clásico';
          const desc = Array.isArray(d.description) ? d.description[0] : d.description;
          return {
            id: `ia_${d.identifier}`,
            archiveId: String(d.identifier),
            title: String(d.title),
            author: String(creator),
            artwork: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
            provider: 'archive' as const,
            description: desc ? String(desc).replace(/<[^>]+>/g, '').trim() : undefined,
            language: 'es',
          };
        });

      this.archiveSearchCache.set(cacheKey, {
        data: items,
        expiresAt: Date.now() + 20 * 60 * 1000,
      });
      return items;
    } catch (err) {
      console.warn('Archive.org audiobook search error:', err);
      return [];
    }
  }

  /**
   * Fetch MP3 chapters for an Internet Archive audiobook (CORS *)
   */
  async getArchiveChapters(book: AudiobookItem): Promise<Track[]> {
    if (!book.archiveId) return [];
    const cached = this.chaptersCache.get(book.archiveId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const url = `https://archive.org/metadata/${encodeURIComponent(book.archiveId)}/files`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) return [];
      const json = await res.json();
      const allFiles: any[] = json?.result || [];

      // Prefer 64Kbps MP3 (fast streaming, clean LibriVox chapters); fallback to VBR MP3
      let mp3s = allFiles.filter(
        (f) => f.format === '64Kbps MP3' || (typeof f.name === 'string' && f.name.endsWith('_64kb.mp3'))
      );
      if (mp3s.length === 0) {
        mp3s = allFiles.filter(
          (f) =>
            (f.format === 'VBR MP3' || (typeof f.name === 'string' && f.name.toLowerCase().endsWith('.mp3'))) &&
            !String(f.name).includes('_128kb')
        );
      }

      // Sort by track number if available, else alphabetically by filename
      mp3s.sort((a, b) => {
        const ta = parseInt(String(a.track || '').split('/')[0], 10);
        const tb = parseInt(String(b.track || '').split('/')[0], 10);
        if (!isNaN(ta) && !isNaN(tb) && ta !== tb) return ta - tb;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

      const chapters: Track[] = mp3s.map((f, idx) => ({
        id: `ab_ia_${book.archiveId}_${idx}`,
        title: f.title || `Capítulo ${idx + 1}`,
        artist: book.author,
        album: book.title,
        duration: parseDurationString(f.length),
        thumbnail: book.artwork,
        source: 'audiobook' as const,
        audioUrl: `https://archive.org/download/${encodeURIComponent(book.archiveId!)}/${encodeURIComponent(
          f.name
        )}`,
        audiobookId: book.id,
      }));

      this.chaptersCache.set(book.archiveId, {
        data: chapters,
        expiresAt: Date.now() + 20 * 60 * 1000,
      });
      return chapters;
    } catch (err) {
      console.warn('Archive.org chapters fetch error:', err);
      return [];
    }
  }

  /**
   * Search full audiobooks in Spanish via YouTube (played ad-free via yt-comp1..5)
   */
  async searchYouTubeAudiobooks(query: string): Promise<AudiobookItem[]> {
    const clean = query.trim();
    const effectiveQuery = clean
      ? /audiolibro/i.test(clean)
        ? clean
        : `${clean} audiolibro completo español`
      : 'audiolibro completo español novela';

    const cacheKey = effectiveQuery.toLowerCase();
    const cached = this.ytSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const tracks = await streamResolver.search(effectiveQuery, 'youtube', 1);
      // Prefer full-length audiobooks (>= 15 min), fallback to all results if fewer than 4
      const longOnes = tracks.filter((t) => (t.duration || 0) >= 900);
      const pool = longOnes.length >= 4 ? longOnes : tracks;

      const items: AudiobookItem[] = pool.slice(0, 18).map((t) => ({
        id: `ytab_${t.youtubeId || t.id}`,
        youtubeId: t.youtubeId || t.id,
        title: t.title,
        author: t.artist || 'YouTube Audiolibros',
        artwork: t.thumbnail,
        provider: 'youtube' as const,
        duration: t.duration || 0,
        language: 'es',
      }));

      this.ytSearchCache.set(cacheKey, {
        data: items,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
      return items;
    } catch (err) {
      console.warn('YouTube audiobook search error:', err);
      return [];
    }
  }

  /**
   * Build a playable Track object for a YouTube audiobook
   */
  toYouTubeTrack(book: AudiobookItem): Track {
    return {
      id: book.id,
      title: book.title,
      artist: book.author,
      album: 'Audiolibro',
      duration: book.duration || 0,
      thumbnail: book.artwork,
      source: 'audiobook',
      youtubeId: book.youtubeId,
      audiobookId: book.id,
    };
  }

  /**
   * Hybrid search across YouTube and Internet Archive
   */
  async searchHybrid(
    query: string,
    provider: 'all' | 'youtube' | 'archive' = 'all'
  ): Promise<AudiobookItem[]> {
    const [ytRes, iaRes] = await Promise.allSettled([
      provider === 'all' || provider === 'youtube'
        ? this.searchYouTubeAudiobooks(query)
        : Promise.resolve([]),
      provider === 'all' || provider === 'archive'
        ? this.searchArchiveAudiobooks(query, provider === 'archive' ? 24 : 12)
        : Promise.resolve([]),
    ]);

    const yt = ytRes.status === 'fulfilled' ? ytRes.value : [];
    const ia = iaRes.status === 'fulfilled' ? iaRes.value : [];

    if (provider === 'youtube') return yt;
    if (provider === 'archive') return ia;

    // Interleave results so both sources are well represented
    const merged: AudiobookItem[] = [];
    const maxLen = Math.max(yt.length, ia.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < yt.length) merged.push(yt[i]);
      if (i < ia.length) merged.push(ia[i]);
    }
    return merged;
  }

  // ---- Per-chapter / per-book playback progress persistence ----

  private loadProgressMap(): Record<string, AudiobookProgress> {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveProgress(
    trackId: string,
    currentTime: number,
    duration: number,
    audiobookId?: string,
    trackTitle?: string
  ): void {
    if (!trackId || currentTime < 5) return;
    try {
      const map = this.loadProgressMap();
      if (duration > 0 && currentTime >= duration - 15) {
        delete map[trackId];
      } else {
        map[trackId] = {
          trackId,
          audiobookId,
          trackTitle,
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration || 0),
          updatedAt: Date.now(),
        };
      }
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }

  getProgress(trackId: string): AudiobookProgress | null {
    const map = this.loadProgressMap();
    return map[trackId] || null;
  }

  getBookLatestProgress(audiobookId: string): AudiobookProgress | null {
    const map = this.loadProgressMap();
    const matches = Object.values(map).filter(
      (p) => p.audiobookId === audiobookId || p.trackId === audiobookId
    );
    if (matches.length === 0) return null;
    matches.sort((a, b) => b.updatedAt - a.updatedAt);
    return matches[0];
  }
}

export const audiobookService = new AudiobookService();
