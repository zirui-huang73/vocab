import { Link } from 'react-router-dom';
import { GROUPS, allWords, topics } from '../data';
import { currentStreak, dueWords } from '../lib/session';
import { isMastered } from '../lib/srs';
import { useStore } from '../store';
import { Header, ProgressBar } from '../components/ui';

export default function Home() {
  const { progress, streak } = useStore();
  const now = Date.now();
  const due = dueWords(allWords, progress, now).length;
  const learned = allWords.filter((w) => progress[w.id]).length;
  const days = currentStreak(streak, now);

  return (
    <div className="page">
      <Header
        title="Everyday Words"
        right={
          <Link className="icon-btn" to="/settings" aria-label="设置">
            ⚙︎
          </Link>
        }
      />

      <section className="review-card">
        <div className="review-stats">
          <div>
            <strong>{due}</strong>
            <span>今日待复习</span>
          </div>
          <div>
            <strong>{learned}</strong>
            <span>已学 / {allWords.length}</span>
          </div>
          <div>
            <strong>{days}</strong>
            <span>连续天数</span>
          </div>
        </div>
        {due > 0 ? (
          <div className="review-actions">
            <Link className="btn primary" to="/study/flash/review">
              闪卡复习
            </Link>
            <Link className="btn" to="/study/quiz/review">
              测验复习
            </Link>
          </div>
        ) : (
          <p className="muted">{learned ? '今天的复习已完成 👍 选一个主题学新词吧' : '从下面选一个主题开始学习吧'}</p>
        )}
      </section>

      <p className="legend">
        <span>
          <i className="learned" />
          学过
        </span>
        <span>
          <i />
          已掌握（复习间隔 ≥ 7 天）
        </span>
      </p>

      {GROUPS.map((g) => {
        const list = topics.filter((t) => t.group === g.id);
        if (!list.length) return null;
        return (
          <section key={g.id}>
            <h2 className="group-title">{g.zh}</h2>
            <div className="topic-grid">
              {list.map((t) => {
                const mastered = t.words.filter((w) => progress[w.id] && isMastered(progress[w.id])).length;
                const seen = t.words.filter((w) => progress[w.id]).length;
                return (
                  <Link key={t.id} to={`/topic/${t.id}`} className="topic-tile">
                    <span className="topic-icon">{t.icon}</span>
                    <span className="topic-zh">{t.zh}</span>
                    <span className="topic-en">{t.en}</span>
                    <ProgressBar value={mastered} secondary={seen} max={t.words.length} />
                    <span className="topic-count">
                      {seen}/{t.words.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
