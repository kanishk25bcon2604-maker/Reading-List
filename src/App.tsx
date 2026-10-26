import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle2, BookMarked, Loader, AlertCircle, Library } from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; icon: typeof BookOpen; color: string }> = {
  want: { label: 'Want to Read', icon: BookMarked, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  reading: { label: 'Reading', icon: Loader, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  finished: { label: 'Finished', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

const STATUS_ORDER: Status[] = ['want', 'reading', 'finished'];
const STORAGE_KEY = 'reading-list-books';

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const MAX_LENGTH = 60;

  const addBook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    if (books.some(b => b.title.toLowerCase().replace(/\s+/g, ' ') === normalized)) {
      setError('This book is already in your reading list.');
      return;
    }
    setError('');
    setBooks(prev => [...prev, { id: self.crypto.randomUUID(), title: trimmed, status: 'want' }]);
    setTitle('');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (error) setError('');
  };

  const changeStatus = (id: string, status: Status) =>
    setBooks(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));

  const removeBook = (id: string) => setBooks(prev => prev.filter(b => b.id !== id));

  const counts = {
    all: books.length,
    want: books.filter(b => b.status === 'want').length,
    reading: books.filter(b => b.status === 'reading').length,
    finished: books.filter(b => b.status === 'finished').length,
  };

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-stone-50">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reading List</h1>
              <p className="text-sm text-stone-500">Track your books and reading progress</p>
            </div>
          </div>
        </header>

        {/* Add form */}
        <form onSubmit={addBook} className="mb-6 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter a book title..."
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Filters */}
        {books.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>
              All
            </FilterButton>
            {STATUS_ORDER.map(s => (
              <FilterButton key={s} active={filter === s} onClick={() => setFilter(s)} count={counts[s]}>
                {STATUS_META[s].label}
              </FilterButton>
            ))}
          </div>
        )}

        {/* Summary */}
        {books.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <SummaryCard icon={Library} label="Total Books" count={counts.all} tone="stone" />
            <SummaryCard icon={Loader} label="Currently Reading" count={counts.reading} tone="blue" />
            <SummaryCard icon={CheckCircle2} label="Finished" count={counts.finished} tone="emerald" />
          </div>
        )}

        {/* Empty state */}
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
              <BookOpen className="h-7 w-7 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">Your reading list is empty. Add your first book.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center">
            <p className="text-sm text-stone-500">No books in this category.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onStatusChange={changeStatus}
                onRemove={removeBook}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: typeof BookOpen;
  label: string;
  count: number;
  tone: 'stone' | 'blue' | 'emerald';
}) {
  const tones = {
    stone: 'bg-stone-100 text-stone-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-stone-800">{count}</p>
        <p className="mt-1 truncate text-xs text-stone-500">{label}</p>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-stone-900 bg-stone-900 text-stone-50'
          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
      }`}
    >
      {children}
      <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-stone-700 text-stone-100' : 'bg-stone-100 text-stone-500'}`}>
        {count}
      </span>
    </button>
  );
}

function BookCard({
  book,
  onStatusChange,
  onRemove,
}: {
  book: Book;
  onStatusChange: (id: string, status: Status) => void;
  onRemove: (id: string) => void;
}) {
  const meta = STATUS_META[book.status];
  const Icon = meta.icon;

  return (
    <li className="group flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-stone-800">{book.title}</h3>
        <button
          onClick={() => onRemove(book.id)}
          className="shrink-0 rounded-lg p-1 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Remove book"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>

        <select
          value={book.status}
          onChange={e => onStatusChange(book.id, e.target.value as Status)}
          className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600 outline-none transition hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
        >
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

export default App;
