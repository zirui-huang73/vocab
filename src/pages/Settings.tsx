import { useRef, useState, useSyncExternalStore } from 'react';
import { allWords } from '../data';
import { dayKey } from '../lib/session';
import { baseName, currentVoice, getVoices, setPreferredVoice, speak, subscribeVoices, voiceQuality, type VoiceQuality } from '../lib/speech';
import { parseSaved, useStore, type SavedData } from '../store';
import { Header, SpeakerIcon } from '../components/ui';

const SAMPLE = 'Hello! This is how words will sound. Put the milk in the refrigerator.';
const QUALITY_LABEL: Record<VoiceQuality, string> = { premium: '高级', enhanced: '增强', standard: '标准' };

export default function Settings() {
  const store = useStore();
  const { settings, updateSettings, replaceAll } = store;
  const voices = useSyncExternalStore(subscribeVoices, getVoices);
  const voice = voices.length ? currentVoice() : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportData = () => {
    const data: SavedData = { version: 1, progress: store.progress, settings: store.settings, streak: store.streak };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `everyday-words-${dayKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const data = parseSaved(JSON.parse(await file.text()));
      if (!confirm(`导入 ${Object.keys(data.progress).length} 个单词的进度？当前进度会被覆盖。`)) return;
      replaceAll(data);
      setMessage('导入成功');
    } catch (e) {
      setMessage(`导入失败：${(e as Error).message}`);
    }
  };

  const reset = () => {
    if (confirm('确定清空所有学习进度？此操作无法撤销。')) {
      replaceAll({ version: 1, progress: {}, settings });
      setMessage('进度已清空');
    }
  };

  return (
    <div className="page">
      <Header title="设置" back="/" />

      <section className="settings">
        <h2>闪卡正面</h2>
        <div className="segmented">
          <button className={settings.flashFront === 'image' ? 'active' : ''} onClick={() => updateSettings({ flashFront: 'image' })}>
            图片 → 单词
          </button>
          <button className={settings.flashFront === 'word' ? 'active' : ''} onClick={() => updateSettings({ flashFront: 'word' })}>
            单词 → 图片
          </button>
        </div>

        <h2>发音</h2>
        <label className="toggle">
          <span>自动播放发音</span>
          <input type="checkbox" checked={settings.autoplay} onChange={(e) => updateSettings({ autoplay: e.target.checked })} />
        </label>
        {voices.length > 0 && (
          <select
            className="select"
            value={voice?.voiceURI}
            onChange={(e) => {
              updateSettings({ voice: e.target.value });
              setPreferredVoice(e.target.value);
              speak(SAMPLE);
            }}
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {baseName(v)} · {QUALITY_LABEL[voiceQuality(v)]}
              </option>
            ))}
          </select>
        )}
        <button className="btn with-icon" onClick={() => speak(SAMPLE)}>
          <SpeakerIcon />
          试听发音
        </button>
        {!voice ? (
          <p className="muted">未检测到美式英语语音。iPhone 可在「设置 → 辅助功能 → 朗读内容 → 声音 → 英语」中下载。</p>
        ) : (
          !voices.some((v) => voiceQuality(v) !== 'standard') && (
            <p className="muted">
              想要更自然的声音：iPhone 打开「设置 → 辅助功能 → 朗读内容 → 声音 → 英语」，下载 Ava、Zoe 或 Evan 的高级（Premium）或增强（Enhanced）版本，然后彻底关闭本应用再打开，在上面选择新声音。
            </p>
          )
        )}

        <h2>进度备份</h2>
        <p className="muted">
          已学习 {Object.keys(store.progress).length} / {allWords.length} 个单词。进度只保存在这台设备上，换手机前请先导出。
        </p>
        <div className="row">
          <button className="btn" onClick={exportData}>
            导出进度
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            导入进度
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importData(f);
              e.target.value = '';
            }}
          />
        </div>
        <button className="btn danger" onClick={reset}>
          清空进度
        </button>
        {message && <p className="message">{message}</p>}

        <h2>关于</h2>
        <p className="muted">图片来自 Wikimedia Commons，作者与许可证显示在每张卡片底部。</p>
      </section>
    </div>
  );
}
