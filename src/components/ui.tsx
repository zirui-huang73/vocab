import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { speak, speechSupported } from '../lib/speech';
import type { Word } from '../types';

export function Header({ title, back, right }: { title: ReactNode; back?: string | true; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="header">
      {back ? (
        <button className="icon-btn" aria-label="返回" onClick={() => (back === true ? navigate(-1) : navigate(back))}>
          ‹
        </button>
      ) : (
        <span className="icon-btn" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="icon-btn" />}
    </header>
  );
}

export function SpeakButton({ text, large }: { text: string; large?: boolean }) {
  if (!speechSupported) return null;
  return (
    <button
      className={`speak-btn${large ? ' large' : ''}`}
      aria-label={`朗读 ${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      🔊
    </button>
  );
}

export function WordImage({ word, size = 'large' }: { word: Word; size?: 'large' | 'small' | 'option' }) {
  return (
    <div className={`word-image ${size}`}>
      {word.image ? <img src={word.image} alt="" loading="lazy" draggable={false} /> : <span className="no-image">{word.zh}</span>}
    </div>
  );
}

export function Credit({ word }: { word: Word }) {
  return word.credit ? <p className="credit">📷 {word.credit}</p> : null;
}

export function WordDetails({ word }: { word: Word }) {
  return (
    <div className="word-details">
      <div className="word-title">
        <span className="en">{word.en}</span>
        <SpeakButton text={word.en} />
      </div>
      <div className="ipa">
        {word.ipa}
        {word.uk && <span className="uk">UK: {word.uk}</span>}
      </div>
      <div className="zh">{word.zh}</div>
      <p className="example" onClick={() => speak(word.example)}>
        {word.example}
      </p>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="progress-bar">
      <div style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export function Done({ title, detail, again }: { title: string; detail?: ReactNode; again?: () => void }) {
  return (
    <div className="done">
      <div className="done-icon">🎉</div>
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
      <div className="done-actions">
        {again && (
          <button className="btn" onClick={again}>
            再来一组
          </button>
        )}
        <Link className="btn primary" to="/">
          回到首页
        </Link>
      </div>
    </div>
  );
}
