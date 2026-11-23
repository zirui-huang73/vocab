import { useEffect, useState } from 'react';
import { formatInterval } from '../lib/session';
import { AUTOPLAY_DELAY, speak } from '../lib/speech';
import { schedule } from '../lib/srs';
import { useStore } from '../store';
import { Credit, Done, Header, ProgressBar, SpeakButton, WordDetails, WordImage } from '../components/ui';
import type { Rating } from '../types';
import type { SessionProps } from './Study';

const RATINGS: { rating: Rating; label: string; cls: string }[] = [
  { rating: 'again', label: '忘了', cls: 'danger' },
  { rating: 'hard', label: '模糊', cls: 'warning' },
  { rating: 'good', label: '记得', cls: 'success' },
  { rating: 'easy', label: '简单', cls: 'primary' },
];

export default function FlashSession({ words, title, back, onAgain }: SessionProps) {
  const { progress, settings, rate } = useStore();
  const [queue, setQueue] = useState(words);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = queue[0];
  const wordFront = settings.flashFront === 'word';

  useEffect(() => {
    if (!word || !settings.autoplay || flipped === wordFront) return;
    return speak(word.en, AUTOPLAY_DELAY);
  }, [word, flipped, wordFront, settings.autoplay]);

  const answer = (rating: Rating) => {
    rate(word.id, rating);
    setFlipped(false);
    setDone((d) => d + 1);
    setQueue(([head, ...rest]) => (rating === 'again' ? [...rest, head] : rest));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!word) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        answer(RATINGS[Number(e.key) - 1].rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!word) {
    return words.length ? (
      <Done title="这组闪卡完成了" detail={`共复习 ${done} 次`} again={onAgain} />
    ) : (
      <Done title="没有需要复习的卡片" />
    );
  }

  const now = Date.now();
  return (
    <div className="page study">
      <Header title={title} back={back} right={<span className="counter">剩 {queue.length}</span>} />
      <ProgressBar value={words.length - new Set(queue.map((w) => w.id)).size} max={words.length} />
      <div className={`card flashcard${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(true)}>
        {wordFront ? (
          <div className="front-word">
            <span>{word.en}</span>
            <SpeakButton text={word.en} large />
          </div>
        ) : (
          <WordImage word={word} />
        )}
        {flipped ? (
          <>
            {wordFront && <WordImage word={word} />}
            <WordDetails word={word} />
            <Credit word={word} />
          </>
        ) : (
          <p className="hint">{wordFront ? '想一想它是什么东西' : '这个用英语怎么说？'} · 点击翻面</p>
        )}
      </div>
      <div className="actions">
        {flipped ? (
          RATINGS.map(({ rating, label, cls }) => (
            <button key={rating} className={`btn rating ${cls}`} onClick={() => answer(rating)}>
              {label}
              <small>{formatInterval(schedule(progress[word.id], rating, now).due - now)}</small>
            </button>
          ))
        ) : (
          <button className="btn primary wide" onClick={() => setFlipped(true)}>
            翻面
          </button>
        )}
      </div>
    </div>
  );
}
