import { useEffect, useState } from 'react';
import { speak } from '../lib/speech';
import { useStore } from '../store';
import { Credit, Done, Header, ProgressBar, WordDetails, WordImage } from '../components/ui';
import type { SessionProps } from './Study';

export default function BrowseSession({ words, title, back }: SessionProps) {
  const { progress, settings, rate } = useStore();
  const [index, setIndex] = useState(() => Math.max(0, words.findIndex((w) => !progress[w.id])));
  const word = words[index];

  useEffect(() => {
    if (word && settings.autoplay) speak(word.en);
  }, [word, settings.autoplay]);

  if (!word) return <Done title="这个主题浏览完了" detail="去闪卡或测验里巩固一下吧" />;

  const isNew = !progress[word.id];
  const next = (rating?: 'again' | 'easy') => {
    if (rating) rate(word.id, rating);
    setIndex((i) => i + 1);
  };

  return (
    <div className="page study">
      <Header title={title} back={back} right={<span className="counter">{index + 1}/{words.length}</span>} />
      <ProgressBar value={index} max={words.length} />
      <div className="card">
        <WordImage word={word} />
        <WordDetails word={word} />
        <Credit word={word} />
      </div>
      <div className="actions">
        {index > 0 && (
          <button className="btn" onClick={() => setIndex((i) => i - 1)}>
            ‹ 上一个
          </button>
        )}
        {isNew ? (
          <>
            <button className="btn danger" onClick={() => next('again')}>
              不认识
            </button>
            <button className="btn success" onClick={() => next('easy')}>
              认识
            </button>
          </>
        ) : (
          <button className="btn primary" onClick={() => next()}>
            下一个 ›
          </button>
        )}
      </div>
    </div>
  );
}
