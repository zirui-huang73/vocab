import { useEffect, useRef, useState } from 'react';
import { allWords, topicById } from '../data';
import { buildQuestion, checkSpelling, spellingHint, type Question } from '../lib/quiz';
import { speak } from '../lib/speech';
import { useStore } from '../store';
import { Done, Header, ProgressBar, SpeakButton, WordDetails, WordImage } from '../components/ui';
import type { Progress, Word } from '../types';
import type { SessionProps } from './Study';

function makeQuestion(word: Word, progress: Progress): Question {
  return buildQuestion(word, topicById.get(word.topicId)?.words ?? [], allWords, progress[word.id]);
}

export default function QuizSession({ words, title, back, onAgain }: SessionProps) {
  const { progress, settings, rate } = useStore();
  const [queue, setQueue] = useState(words);
  const [question, setQuestion] = useState(() => (words[0] ? makeQuestion(words[0], progress) : null));
  const [result, setResult] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const [typed, setTyped] = useState('');
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (question?.kind === 'audio2pic') speak(question.word.en);
    if (question?.kind === 'spell') inputRef.current?.focus();
  }, [question]);

  if (!question) {
    return words.length ? (
      <Done title="测验完成" detail={`一次答对 ${words.length - missed.size} / ${words.length}`} again={onAgain} />
    ) : (
      <Done title="没有需要复习的单词" />
    );
  }

  const { word, kind, options } = question;

  const submit = (correct: boolean, chosen?: string) => {
    if (result) return;
    setResult({ correct, chosen });
    rate(word.id, correct ? 'good' : 'again');
    if (!correct) setMissed((m) => new Set(m).add(word.id));
    if (settings.autoplay && kind !== 'audio2pic') speak(word.en);
  };

  const next = () => {
    const [head, ...rest] = queue;
    const nextQueue = result?.correct ? rest : [...rest, head];
    setQueue(nextQueue);
    setResult(null);
    setTyped('');
    setQuestion(nextQueue[0] ? makeQuestion(nextQueue[0], progress) : null);
  };

  const optionClass = (o: Word) =>
    !result ? '' : o.id === word.id ? ' correct' : o.id === result.chosen ? ' wrong' : ' dim';

  return (
    <div className="page study">
      <Header title={title} back={back} right={<span className="counter">剩 {queue.length}</span>} />
      <ProgressBar value={words.length - new Set(queue.map((w) => w.id)).size} max={words.length} />

      {kind === 'pic2word' && (
        <div className="card">
          <WordImage word={word} />
          <p className="prompt">这是什么？</p>
          <div className="choices">
            {options.map((o) => (
              <button key={o.id} className={`choice${optionClass(o)}`} onClick={() => submit(o.id === word.id, o.id)}>
                {o.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === 'audio2pic' && (
        <div className="card">
          <div className="listen">
            <SpeakButton text={word.en} large />
            <p className="prompt">听发音，选出对应的图片</p>
          </div>
          <div className="image-choices">
            {options.map((o) => (
              <button key={o.id} className={`image-choice${optionClass(o)}`} onClick={() => submit(o.id === word.id, o.id)}>
                <WordImage word={o} size="option" />
                {result && <span>{o.en}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === 'spell' && (
        <div className="card">
          <WordImage word={word} />
          <p className="prompt">
            {word.zh}
            <br />
            <span className="spell-hint">{spellingHint(word.en)}</span>
          </p>
          <form
            className="spell-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (result) next();
              else if (typed.trim()) submit(checkSpelling(typed, word));
            }}
          >
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="输入英文单词"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              readOnly={!!result}
              className={result ? (result.correct ? 'correct' : 'wrong') : ''}
            />
            {!result && (
              <div className="spell-actions">
                <button type="button" className="btn" onClick={() => submit(false)}>
                  不会
                </button>
                <button type="submit" className="btn primary">
                  确定
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {result && (
        <div className={`feedback ${result.correct ? 'ok' : 'bad'}`}>
          <p className="feedback-title">{result.correct ? '✓ 答对了' : '✗ 正确答案是'}</p>
          <WordDetails word={word} />
          <button className="btn primary wide" onClick={next} autoFocus>
            下一题 ›
          </button>
        </div>
      )}
    </div>
  );
}
