import { Link, Navigate, useParams } from 'react-router-dom';
import { topicById } from '../data';
import { dueWords } from '../lib/session';
import { isDue, isMastered } from '../lib/srs';
import { useStore } from '../store';
import { Header, SpeakButton, WordImage } from '../components/ui';
import type { CardState } from '../types';

function status(s: CardState | undefined, now: number) {
  if (!s) return { cls: 'new', label: '新' };
  if (isDue(s, now)) return { cls: 'due', label: '待复习' };
  if (isMastered(s)) return { cls: 'mastered', label: '已掌握' };
  return { cls: 'learning', label: '学习中' };
}

export default function TopicPage() {
  const { topicId = '' } = useParams();
  const topic = topicById.get(topicId);
  const { progress } = useStore();
  if (!topic) return <Navigate to="/" replace />;

  const now = Date.now();
  const fresh = topic.words.filter((w) => !progress[w.id]).length;
  const due = dueWords(topic.words, progress, now).length;

  return (
    <div className="page">
      <Header title={`${topic.icon} ${topic.zh}`} back="/" />
      <p className="muted center">
        {topic.en} · {topic.words.length} 词 · {fresh} 个新词 · {due} 个待复习
      </p>
      <div className="mode-buttons">
        <Link className="mode-btn" to={`/study/browse/${topic.id}`}>
          <span>📖</span>浏览
        </Link>
        <Link className="mode-btn" to={`/study/flash/${topic.id}`}>
          <span>🃏</span>闪卡
        </Link>
        <Link className="mode-btn" to={`/study/quiz/${topic.id}`}>
          <span>✏️</span>测验
        </Link>
      </div>
      <ul className="word-list">
        {topic.words.map((w) => {
          const st = status(progress[w.id], now);
          return (
            <li key={w.id}>
              <WordImage word={w} size="small" />
              <div className="word-list-text">
                <span className="en">{w.en}</span>
                <span className="zh">{w.zh}</span>
              </div>
              <span className={`badge ${st.cls}`}>{st.label}</span>
              <SpeakButton text={w.en} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
