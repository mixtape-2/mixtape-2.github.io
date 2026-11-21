import type { ParsedSpotifyTrack, CsvParseResult } from './spotifyCsvParser';

export interface UrlImportResult extends CsvParseResult {
  platform: 'spotify' | 'apple-music';
  playlistTitle: string;
}

function parseMmSsToMs(val?: string): number | undefined {
  if (!val) return undefined;
  const m = val.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return undefined;
  if (m[3] !== undefined) {
    return (parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10)) * 1000;
  }
  return (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
}

/**
 * Normalizes a Spotify or Apple Music URL and identifies the platform + embed/public fetch URL.
 */
export function detectPlaylistUrl(rawUrl: string): {
  platform: 'spotify' | 'apple-music';
  fetchUrl: string;
  originalUrl: string;
} | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Spotify URI format: spotify:playlist:ID or spotify:album:ID
  const spotifyUriMatch = trimmed.match(/^spotify:(playlist|album):([a-zA-Z0-9]+)$/i);
  if (spotifyUriMatch) {
    const kind = spotifyUriMatch[1].toLowerCase();
    const id = spotifyUriMatch[2];
    return {
      platform: 'spotify',
      fetchUrl: `https://open.spotify.com/embed/${kind}/${id}`,
      originalUrl: `https://open.spotify.com/${kind}/${id}`,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // Spotify Web URL: open.spotify.com/(intl-xx/)?(embed/)?(playlist|album)/ID
  if (host.includes('spotify.com')) {
    const m = parsed.pathname.match(/\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album)\/([a-zA-Z0-9]+)/i);
    if (m) {
      const kind = m[1].toLowerCase();
      const id = m[2];
      return {
        platform: 'spotify',
        fetchUrl: `https://open.spotify.com/embed/${kind}/${id}`,
        originalUrl: `https://open.spotify.com/${kind}/${id}`,
      };
    }
  }

  // Apple Music Web URL: music.apple.com/{country}/(playlist|album)/...
  if (host.includes('music.apple.com')) {
    if (/\/(playlist|album)\//i.test(parsed.pathname)) {
      const cleanUrl = `${parsed.origin}${parsed.pathname}`;
      return {
        platform: 'apple-music',
        fetchUrl: cleanUrl,
        originalUrl: cleanUrl,
      };
    }
  }

  return null;
}

/**
 * Parses Spotify embed raw HTML (__NEXT_DATA__) into tracks.
 */
function parseSpotifyEmbedHtml(html: string): UrlImportResult | null {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const json = JSON.parse(m[1]);
    const entity = json?.props?.pageProps?.state?.data?.entity;
    const trackList = entity?.trackList;
    if (!Array.isArray(trackList) || trackList.length === 0) return null;

    const playlistTitle = (entity?.title || entity?.name || 'Playlist Spotify').trim();
    const tracks: ParsedSpotifyTrack[] = [];

    for (let i = 0; i < trackList.length; i++) {
      const item = trackList[i];
      const title = (item?.title || '').trim();
      const artist = (item?.subtitle || '').replace(/\u00A0/g, ' ').trim();
      if (!title || !artist) continue;
      tracks.push({
        id: `sp_url_${i}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        artist,
        durationMs: typeof item?.duration === 'number' ? item.duration : undefined,
      });
    }

    if (tracks.length === 0) return null;
    return {
      platform: 'spotify',
      playlistTitle,
      suggestedName: playlistTitle,
      tracks,
      totalFound: tracks.length,
    };
  } catch {
    return null;
  }
}

/**
 * Parses Spotify embed markdown returned by r.jina.ai.
 */
function parseSpotifyJinaMarkdown(md: string): UrlImportResult | null {
  const titleMatch = md.match(/^Title:\s*(.+?)(?:\s*[-|]\s*Spotify.*)?$/m);
  const playlistTitle = (titleMatch?.[1] || 'Playlist Spotify').trim();

  const tracks: ParsedSpotifyTrack[] = [];
  const regex = /\d+\.\s+###\s+([^\r\n]+)\r?\n+\s*####\s+([^\r\n]+)(?:\r?\n+\s*(\d{1,2}:\d{2}))?/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(md)) !== null) {
    const title = match[1].trim();
    // Strip Spotify's explicit "E " prefix if present
    const artist = match[2]
      .replace(/\u00A0/g, ' ')
      .replace(/^E\s+/, '')
      .trim();
    const durationMs = parseMmSsToMs(match[3]);
    if (!title || !artist) continue;

    tracks.push({
      id: `sp_url_${idx++}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      artist,
      durationMs,
    });
  }

  if (tracks.length === 0) return null;
  return {
    platform: 'spotify',
    playlistTitle,
    suggestedName: playlistTitle,
    tracks,
    totalFound: tracks.length,
  };
}

/**
 * Parses Apple Music raw HTML (serialized-server-data) into tracks.
 */
function parseAppleMusicHtml(html: string): UrlImportResult | null {
  const m = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    const tracks: ParsedSpotifyTrack[] = [];
    const seen = new Set<string>();
    let playlistTitle = '';

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }
      if (
        !playlistTitle &&
        (node.itemKind === 'playlist' || node.itemKind === 'album' || node.kind === 'playlist') &&
        typeof node.title === 'string' &&
        node.title.trim()
      ) {
        playlistTitle = node.title.trim();
      }
      if (
        (node.itemKind === 'trackLockup' || node.contentDescriptor?.kind === 'song') &&
        typeof node.title === 'string'
      ) {
        const title = node.title.trim();
        const artistList = Array.isArray(node.subtitleLinks)
          ? node.subtitleLinks.map((l: any) => l?.title).filter(Boolean)
          : [];
        const artist = (
          artistList.join(', ') ||
          node.artistName ||
          node.subtitle ||
          ''
        ).trim();
        const album = (node.tertiaryLinks?.[0]?.title || '').trim() || undefined;
        const durationMs =
          typeof node.duration === 'number'
            ? node.duration
            : typeof node.durationInMillis === 'number'
            ? node.durationInMillis
            : undefined;

        const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
        if (title && artist && !seen.has(key)) {
          seen.add(key);
          tracks.push({
            id: `am_url_${tracks.length}_${Math.random().toString(36).slice(2, 6)}`,
            title,
            artist,
            album,
            durationMs,
          });
        }
      }
      for (const k of Object.keys(node)) {
        walk(node[k]);
      }
    };

    walk(data);

    if (!playlistTitle) {
      const h1 = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
      playlistTitle = h1
        .replace(/\u200E/g, '')
        .replace(/\s*[-–]\s*(?:Playlist|Álbum|Album).*$/i, '')
        .replace(/\s*[-–]\s*Apple\s*Music.*$/i, '')
        .trim() || 'Playlist Apple Music';
    }

    if (tracks.length === 0) return null;
    return {
      platform: 'apple-music',
      playlistTitle,
      suggestedName: playlistTitle,
      tracks,
      totalFound: tracks.length,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts markdown link label `[Label](url)` even when `Label` contains nested brackets like `[From OST]`.
 */
function extractLinksFromBlock(block: string, pathSegment: string): string[] {
  const results: string[] = [];
  const lines = block.split(/\r?\n/);
  const targetMarker = `](https://music.apple.com/`;

  for (const line of lines) {
    if (!line.includes(targetMarker) || !line.includes(`/${pathSegment}/`)) continue;
    // Scan each occurrence of ](https://music.apple.com/.../{pathSegment}/...)
    let searchFrom = 0;
    while (true) {
      const mid = line.indexOf(targetMarker, searchFrom);
      if (mid === -1) break;
      const closeParen = line.indexOf(')', mid + 2);
      if (closeParen === -1) break;
      const href = line.slice(mid + 2, closeParen);
      if (href.includes(`/${pathSegment}/`)) {
        // Walk backwards from `mid` balancing nested brackets to find matching `[`
        let depth = 0;
        let openIdx = -1;
        for (let i = mid - 1; i >= 0; i--) {
          if (line[i] === ']') depth++;
          else if (line[i] === '[') {
            if (depth === 0) {
              openIdx = i;
              break;
            }
            depth--;
          }
        }
        if (openIdx !== -1) {
          const label = line.slice(openIdx + 1, mid).trim();
          if (label && !label.startsWith('![')) {
            results.push(label);
          }
        }
      }
      searchFrom = closeParen + 1;
    }
  }
  return results;
}

/**
 * Parses Apple Music public page markdown returned by r.jina.ai.
 */
function parseAppleMusicJinaMarkdown(md: string): UrlImportResult | null {
  const h1Match = md.match(/^#\s+(.+)$/m);
  const titleLine = md.match(/^Title:\s*(.+)$/m)?.[1] || '';
  const playlistTitle = (
    h1Match?.[1] ||
    titleLine
      .replace(/\u200E/g, '')
      .replace(/\s*[-–]\s*(?:Playlist|Álbum|Album).*$/i, '')
      .replace(/\s*[-–]\s*Apple\s*Music.*$/i, '') ||
    'Playlist Apple Music'
  ).trim();

  // Split markdown into chunks starting at each track row (marked by Apple Music song link lines)
  const lines = md.split(/\r?\n/);
  const songLineIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('](https://music.apple.com/') && lines[i].includes('/song/')) {
      songLineIndices.push(i);
    }
  }

  const tracks: ParsedSpotifyTrack[] = [];
  const seen = new Set<string>();

  for (let s = 0; s < songLineIndices.length; s++) {
    const start = songLineIndices[s];
    const end = s + 1 < songLineIndices.length ? songLineIndices[s + 1] : Math.min(lines.length, start + 14);
    const block = lines.slice(start, end).join('\n');

    const titles = extractLinksFromBlock(lines[start], 'song');
    const title = titles[0];
    if (!title) continue;

    // Artists appear on lines after the song line (Apple Music repeats artist line twice on desktop/mobile markup)
    const afterSongLines = lines.slice(start + 1, end);
    let artist = '';
    for (const l of afterSongLines) {
      const artistsOnLine = extractLinksFromBlock(l, 'artist');
      if (artistsOnLine.length > 0) {
        artist = artistsOnLine.join(', ');
        break;
      }
    }

    const albums = extractLinksFromBlock(block, 'album');
    const album = albums[0] || undefined;

    const durLine = afterSongLines.find((l) => /^\s*\d{1,2}:\d{2}\s*$/.test(l));
    const durationMs = parseMmSsToMs(durLine);

    if (!artist) {
      // Fallback for album pages where artist is shown at top header
      const headerArtist = extractLinksFromBlock(lines.slice(0, songLineIndices[0]).join('\n'), 'artist')[0];
      artist = headerArtist || '';
    }
    if (!artist) continue;

    const key = `${title.toLowerCase()}|${artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    tracks.push({
      id: `am_url_${tracks.length}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      artist,
      album,
      durationMs,
    });
  }

  if (tracks.length === 0) return null;
  return {
    platform: 'apple-music',
    playlistTitle,
    suggestedName: playlistTitle,
    tracks,
    totalFound: tracks.length,
  };
}

/**
 * Fetches and extracts track metadata directly from a public Spotify or Apple Music playlist/album URL.
 * Works both in local dev (via Vite middleware) and on static GitHub Pages (via CORS-enabled r.jina.ai reader).
 */
export async function importPlaylistFromUrl(rawUrl: string): Promise<UrlImportResult> {
  const detected = detectPlaylistUrl(rawUrl);
  if (!detected) {
    throw new Error(
      'URL no válida. Pega un enlace público de una playlist o álbum de Spotify (open.spotify.com) o Apple Music (music.apple.com).'
    );
  }

  // 1. Try local dev server proxy first (instant, direct HTML JSON parsing on localhost)
  try {
    const devRes = await fetch(`/api/playlist-url?url=${encodeURIComponent(detected.fetchUrl)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (devRes.ok) {
      const html = await devRes.text();
      if (html && !html.includes('<!doctype html>\n<html lang="es">')) {
        const parsed =
          detected.platform === 'spotify'
            ? parseSpotifyEmbedHtml(html)
            : parseAppleMusicHtml(html);
        if (parsed && parsed.tracks.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // Expected on static GitHub Pages
  }

  // 2. Production / GitHub Pages: CORS-enabled r.jina.ai reader (zero API keys, works directly from browser)
  const jinaUrl = `https://r.jina.ai/${detected.fetchUrl}`;
  const res = await fetch(jinaUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(
      `No se pudo leer la lista (HTTP ${res.status}). Asegúrate de que la playlist sea pública.`
    );
  }

  const markdown = await res.text();
  const parsed =
    detected.platform === 'spotify'
      ? parseSpotifyJinaMarkdown(markdown)
      : parseAppleMusicJinaMarkdown(markdown);

  if (!parsed || parsed.tracks.length === 0) {
    throw new Error(
      'No se encontraron canciones en esa URL. Verifica que la playlist sea pública y no privada.'
    );
  }

  return parsed;
}
