const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || '';
const LLM_API_URL = import.meta.env.VITE_LLM_API_URL || 'https://api.example.com/v1/chat/completions';

const stylePrompts = {
  narrative: '服务于高考/四六级写作与续写，侧重动作、环境与心理描写',
  argumentative: '服务于雅思/托福写作与阅读，侧重逻辑连接与观点论证',
};

const fallbackDefinitions = {
  resilience: {
    phonetic: '/rɪˈzɪliəns/',
    partOfSpeech: 'noun',
    translation: '韧性；在压力或挫折后恢复的能力',
    collocation: 'build resilience; emotional resilience; show resilience under pressure',
  },
  dilemma: {
    phonetic: '/dɪˈlemə/',
    partOfSpeech: 'noun',
    translation: '困境；进退两难的局面',
    collocation: 'face a dilemma; moral dilemma; resolve a dilemma',
  },
  coherent: {
    phonetic: '/koʊˈhɪrənt/',
    partOfSpeech: 'adjective',
    translation: '连贯的；条理清晰的',
    collocation: 'a coherent argument; coherent structure; remain coherent',
  },
  illuminate: {
    phonetic: '/ɪˈluːmɪneɪt/',
    partOfSpeech: 'verb',
    translation: '阐明；照亮；使更易理解',
    collocation: 'illuminate a problem; illuminate the room; illuminate a theme',
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateScenarioParagraph(words, style) {
  await sleep(820);

  const trimmedWords = words.map((word) => word.trim()).filter(Boolean);
  const joinedWords = trimmedWords.join(', ');

  if (LLM_API_KEY && import.meta.env.VITE_USE_REAL_LLM === 'true') {
    return callRealLlm(trimmedWords, style);
  }

  if (style === 'argumentative') {
    return {
      title: 'Why Vocabulary Learning Needs Context',
      paragraph: `A thoughtful learning system should not treat words such as ${joinedWords} as isolated labels. When a learner meets each term inside a meaningful academic context, the paragraph can show its function, strengthen long-term memory, and make the argument more precise. Therefore, vocabulary practice becomes more persuasive when examples, logic, and evidence work together.`,
    };
  }

  return {
    title: 'After the Rain at the School Gate',
    paragraph: `Rainwater shimmered along the empty road as Lina stood near the school gate, silently repeating ${joinedWords}. Each word seemed to belong to the scene: the wet pavement, the nervous breath, the pause before a difficult choice, and the small courage she gathered before walking on. By the time the clouds opened, those words no longer felt distant; they had become part of her memory.`,
  };
}

async function callRealLlm(words, style) {
  const response = await fetch(LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You create concise English learning paragraphs for Chinese learners. Return JSON with title and paragraph only.',
        },
        {
          role: 'user',
          content: `Create one English paragraph. Style target: ${stylePrompts[style]}. Include every word exactly once or naturally more than once: ${words.join(', ')}.`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('LLM request failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

export async function fetchDictionaryEntry(word, contextSentence = '') {
  const cleanWord = word.toLowerCase().replace(/[^a-z'-]/g, '');

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (!response.ok) throw new Error('Dictionary request failed');

    const [entry] = await response.json();
    const meaning = entry?.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition || '';

    return {
      word,
      phonetic: entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || '暂无音标',
      partOfSpeech: meaning?.partOfSpeech || '词性待补充',
      translation: buildChineseHint(cleanWord, definition, contextSentence),
      collocation: buildCollocation(cleanWord, meaning?.definitions?.[0]?.example),
    };
  } catch {
    return {
      word,
      ...(fallbackDefinitions[cleanWord] || {
        phonetic: '暂无音标',
        partOfSpeech: 'word',
        translation: `结合当前语境，可理解为与“${word}”相关的核心含义；接入 LLM 后可生成更精确中文释义。`,
        collocation: `use ${word} naturally; ${word} in context; a ${word} example`,
      }),
    };
  }
}

function buildChineseHint(word, definition, contextSentence) {
  if (fallbackDefinitions[word]) return fallbackDefinitions[word].translation;
  if (!definition) return `结合当前语境理解 ${word} 的含义。`;
  const contextHint = contextSentence ? '；已结合当前文段语境' : '';
  return `${definition}${contextHint}`;
}

function buildCollocation(word, example) {
  if (fallbackDefinitions[word]) return fallbackDefinitions[word].collocation;
  return example || `${word} in context; use ${word} to describe an idea; ${word} + key noun/verb`;
}
