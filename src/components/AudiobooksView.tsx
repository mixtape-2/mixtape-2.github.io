import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, X, Sparkles, Clock } from 'lucide-react';
import type { AudiobookItem } from '../types/music';
import { audiobookService } from '../services/audiobookService';
import { useLibrary } from '../context/LibraryContext';
import { AudiobookDetailModal } from './AudiobookDetailModal';
import { formatDuration } from './TrackRow';

type ProviderFilter = 'all' | 'youtube' | 'archive';

const AUDIOBOOK_CATEGORIES = [
  { label: 'Destacados', query: '' },
  { label: 'Novela Negra', query: 'novela negra misterio' },
  { label: 'Ciencia Ficción', query: 'ciencia ficcion' },
  { label: 'Clásicos', query: 'cervantes verne poe' },
  { label: 'Historia', query: 'historia universal' },
  { label: 'Filosofía', query: 'filosofia estoicismo' },
  { label: 'Fantasía', query: 'fantasia aventura' },
  { label: 'Cuentos', query: 'cuentos relatos' },
];

export const AudiobooksView: React.FC = () => {
  const { savedAudiobooks } = useLibrary();

  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<ProviderFilter>('all');
  const [activeCategory, setActiveCategory] = useState(AUDIOBOOK_CATEGORIES[0].label);
  const [results, setResults] = useState<AudiobookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<AudiobookItem | null>(null);

  const runSearch = async (term: string, activeProvider: ProviderFilter = provider) => {
    setLoading(true);
    try {
      const list = await audiobookService.searchHybrid(term, activeProvider);
      setResults(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch('', 'all');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCategory('');
    runSearch(query.trim(), provider);
  };

  const providerTabs: { id: ProviderFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'archive', label: 'Clásicos (Capítulos)' },
  ];

  return (
    <div className="space-y-7 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Audiolibros
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Catálogo híbrido en español (YouTube sin anuncios + Clásicos por capítulos) con reanudación automática
        </p>
      </div>

      {/* Search Bar & Provider Filter */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar audiolibros por título, autor o género..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-[var(--theme-accent)] text-white font-bold text-sm hover:brightness-110 transition cursor-pointer"
          >
            Buscar
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {providerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setProvider(tab.id);
                const catObj = AUDIOBOOK_CATEGORIES.find((c) => c.label === activeCategory);
                runSearch(query.trim() || catObj?.query || '', tab.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                provider === tab.id
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </form>

      {/* Saved Audiobooks Shelf */}
      {savedAudiobooks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[var(--theme-accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Tus Audiolibros Guardados ({savedAudiobooks.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {savedAudiobooks.map((book) => {
              const prog = audiobookService.getBookLatestProgress(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="p-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 mb-2">
                    <img
                      src={book.artwork}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {prog && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-black/80 text-[var(--theme-badge-text)]">
                        {formatDuration(prog.currentTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {book.title}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                    {book.author}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories & Results */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Explorar por género</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {AUDIOBOOK_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => {
                setActiveCategory(cat.label);
                setQuery('');
                runSearch(cat.query, provider);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                activeCategory === cat.label
                  ? 'bg-[var(--theme-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-badge-border)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--theme-accent)] mb-2" />
            <p className="text-xs font-medium">Buscando audiolibros...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-muted)]">
            No se encontraron audiolibros para esta búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {results.map((book) => (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="p-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-black/30 mb-2.5">
                  {book.artwork ? (
                    <img
                      src={book.artwork}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/80 text-[var(--text-primary)]">
                    {book.provider === 'archive' ? 'Capítulos' : 'YouTube'}
                  </span>
                  {book.duration && book.duration > 0 ? (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-mono-tech font-semibold bg-black/85 text-[var(--text-primary)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(book.duration)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {book.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {book.author}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <AudiobookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
};
