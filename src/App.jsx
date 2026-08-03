import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Loader2,
  PanelRightOpen,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { fetchDictionaryEntry, generateScenarioParagraph } from './api';

const MAX_WORDS = 15;

const styleOptions = [
  {
    value: 'narrative',
    label: '记叙文',
    english: 'Narrative',
    hint: '服务于高考/四六级写作与续写，侧重动作、环境与心理描写',
  },
  {
    value: 'argumentative',
    label: '议论文',
    english: 'Argumentative',
    hint: '服务于雅思/托福写作与阅读，侧重逻辑连接与观点论证',
  },
];

const starterText = 'resilience, dilemma, coherent, illuminate';

function parseWords(text) {
  return collectWords(text).slice(0, MAX_WORDS);
}

function collectWords(text) {
  const unique = [];
  text
    .split(/[\s,，;；]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .forEach((word) => {
      const normalized = word.toLowerCase();
      if (!unique.some((item) => item.toLowerCase() === normalized)) {
        unique.push(word);
      }
    });
  return unique;
}

function App() {
  const [rawWords, setRawWords] = useState(starterText);
  const [style, setStyle] = useState('narrative');
  const [article, setArticle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState(null);
  const [toast, setToast] = useState('');
  const [corpus, setCorpus] = useState(() => readCorpus());
  const [isCorpusOpen, setIsCorpusOpen] = useState(false);
  const [definitions, setDefinitions] = useState({});
  const [activeLookup, setActiveLookup] = useState('');
  const articleRef = useRef(null);
  const selectionTimer = useRef(null);

  const words = useMemo(() => parseWords(rawWords), [rawWords]);
  const activeStyle = styleOptions.find((item) => item.value === style);

  useEffect(() => {
    generateArticle();
  }, []);

  useEffect(() => {
    localStorage.setItem('myCorpus', JSON.stringify(corpus));
  }, [corpus]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1700);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleRawWordsChange(value) {
    const nextWords = collectWords(value);
    setRawWords(value);
    if (nextWords.length > MAX_WORDS) {
      setError(`最多支持 ${MAX_WORDS} 个单词，已按前 ${MAX_WORDS} 个处理。`);
    } else {
      setError('');
    }
  }

  async function generateArticle() {
    const nextWords = parseWords(rawWords);
    if (!nextWords.length) {
      setError('请先输入至少 1 个英文单词。');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDefinitions({});
    setSelectionPos(null);

    try {
      const result = await generateScenarioParagraph(nextWords, style);
      setArticle(result);
    } catch {
      setError('文段生成暂时失败，请稍后重试。');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleArticleMouseUp() {
    window.clearTimeout(selectionTimer.current);
    selectionTimer.current = window.setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2 || selection.isCollapsed || !articleRef.current) {
        setSelectionPos(null);
        setSelectedText('');
        return;
      }

      const range = selection.getRangeAt(0);
      const commonNode = range.commonAncestorContainer;
      const parentElement = commonNode.nodeType === Node.TEXT_NODE ? commonNode.parentElement : commonNode;

      if (!articleRef.current.contains(parentElement)) {
        setSelectionPos(null);
        setSelectedText('');
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionPos({
        top: rect.top + window.scrollY - 44,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }, 80);
  }

  function addSelectionToCorpus() {
    if (!selectedText) return;
    const item = {
      id: crypto.randomUUID(),
      text: selectedText,
      note: '',
      sourceTitle: article?.title || 'Generated paragraph',
      createdAt: new Date().toISOString(),
    };
    setCorpus((current) => [item, ...current]);
    setSelectionPos(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
    setToast('已添加到语料库');
  }

  async function lookupWord(word) {
    setActiveLookup(word);
    const context = article?.paragraph || '';
    const entry = await fetchDictionaryEntry(word, context);
    setDefinitions((current) => ({ ...current, [word.toLowerCase()]: entry }));
    setActiveLookup('');
  }

  function updateNote(id, note) {
    setCorpus((current) => current.map((item) => (item.id === id ? { ...item, note } : item)));
  }

  function removeCorpusItem(id) {
    setCorpus((current) => current.filter((item) => item.id !== id));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
    setToast('已复制');
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
              <BookOpen className="h-4 w-4" />
              Vocabulary & Corpus
            </div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">场景化背单词与个人语料库</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCorpusOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-500 hover:text-teal-700"
          >
            <PanelRightOpen className="h-4 w-4" />
            我的语料库
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">{corpus.length}</span>
          </button>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <InputPanel
            rawWords={rawWords}
            words={words}
            style={style}
            activeStyle={activeStyle}
            isGenerating={isGenerating}
            error={error}
            onRawWordsChange={handleRawWordsChange}
            onStyleChange={setStyle}
            onGenerate={generateArticle}
          />

          <div className="space-y-5">
            <ReaderPanel
              article={article}
              words={words}
              isGenerating={isGenerating}
              articleRef={articleRef}
              onMouseUp={handleArticleMouseUp}
            />
            <DictionaryPanel words={words} definitions={definitions} activeLookup={activeLookup} onLookup={lookupWord} />
          </div>
        </section>
      </div>

      {selectionPos && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addSelectionToCorpus}
          className="fixed z-40 inline-flex -translate-x-1/2 items-center gap-1 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-teal-700"
          style={{ top: selectionPos.top, left: selectionPos.left }}
        >
          <Plus className="h-3.5 w-3.5" />
          加入语料库
        </button>
      )}

      <CorpusDrawer
        isOpen={isCorpusOpen}
        corpus={corpus}
        onClose={() => setIsCorpusOpen(false)}
        onCopy={copyText}
        onNoteChange={updateNote}
        onRemove={removeCorpusItem}
      />

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-soft">
          <Check className="h-4 w-4 text-teal-300" />
          {toast}
        </div>
      )}
    </main>
  );
}

function InputPanel({ rawWords, words, style, activeStyle, isGenerating, error, onRawWordsChange, onStyleChange, onGenerate }) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-5 lg:self-start">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">单词与文体输入</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">支持逗号、空格或换行分隔，最多 15 个。</p>
        </div>
        <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{words.length}/{MAX_WORDS}</span>
      </div>

      <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="word-input">
        待记忆单词
      </label>
      <textarea
        id="word-input"
        value={rawWords}
        onChange={(event) => onRawWordsChange(event.target.value)}
        rows={8}
        className="w-full resize-none rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
        placeholder="例如：resilience, dilemma, coherent"
      />

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="style-select">
          文体目标
        </label>
        <div className="relative">
          <select
            id="style-select"
            value={style}
            onChange={(event) => onStyleChange(event.target.value)}
            className="h-11 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          >
            {styleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.english})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{activeStyle.hint}</p>
      </div>

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? '生成中' : '生成场景文段'}
      </button>
    </aside>
  );
}

function ReaderPanel({ article, words, isGenerating, articleRef, onMouseUp }) {
  return (
    <section className="min-h-[340px] rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">AI 生成文段与阅读区</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{article?.title || '等待生成文段'}</h2>
        </div>
        {isGenerating && <Loader2 className="h-5 w-5 animate-spin text-teal-600" />}
      </div>

      <div
        ref={articleRef}
        onMouseUp={onMouseUp}
        className="article-text min-h-[210px] rounded-md border border-slate-200 bg-slate-50 p-5 text-[17px] text-slate-800 sm:text-lg"
      >
        {isGenerating ? (
          <ReadingSkeleton />
        ) : article?.paragraph ? (
          <HighlightedText text={article.paragraph} words={words} />
        ) : (
          <p className="text-slate-500">输入单词并生成场景文段后，可在这里划选句子加入个人语料库。</p>
        )}
      </div>
    </section>
  );
}

function HighlightedText({ text, words }) {
  const terms = words.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!terms.length) return text;

  const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some((word) => word.toLowerCase() === part.toLowerCase());
    return isMatch ? (
      <strong key={`${part}-${index}`} className="font-bold text-indigo-600">
        {part}
      </strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

function DictionaryPanel({ words, definitions, activeLookup, onLookup }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-700">词典与翻译解析区</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">本次输入单词</h2>
        </div>
        <Search className="h-5 w-5 text-slate-400" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {words.map((word) => {
          const entry = definitions[word.toLowerCase()];
          const loading = activeLookup === word;
          return (
            <article key={word} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onLookup(word)}
                    className="text-left text-lg font-bold text-slate-950 transition hover:text-teal-700"
                  >
                    {word}
                  </button>
                  <p className="mt-1 text-sm text-slate-500">{entry?.phonetic || '点击查义'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onLookup(word)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                  title="查询释义"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
              {entry ? (
                <dl className="mt-4 space-y-3 text-sm leading-6">
                  <div>
                    <dt className="font-semibold text-slate-700">词性</dt>
                    <dd className="text-slate-600">{entry.partOfSpeech}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">中文释义</dt>
                    <dd className="text-slate-600">{entry.translation}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">搭配用法</dt>
                    <dd className="text-slate-600">{entry.collocation}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">查询后展示音标、词性、语境释义和搭配。</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CorpusDrawer({ isOpen, corpus, onClose, onCopy, onNoteChange, onRemove }) {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-950/30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-soft transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold text-teal-700">My Corpus</p>
            <h2 className="text-xl font-semibold text-slate-950">我的语料库</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {corpus.length ? (
            corpus.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-800">{item.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(item.text)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    复制
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
                <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <PencilLine className="h-3.5 w-3.5" />
                  收藏备注
                </label>
                <textarea
                  value={item.note}
                  onChange={(event) => onNoteChange(item.id, event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  placeholder="记录为什么收藏这个句型"
                />
              </article>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <Clipboard className="mb-3 h-9 w-9 text-slate-400" />
              <p className="font-semibold text-slate-800">还没有收藏语料</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">在文段中划选词组或句子后即可加入这里。</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ReadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-8/12 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function readCorpus() {
  try {
    const stored = JSON.parse(localStorage.getItem('myCorpus') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default App;
