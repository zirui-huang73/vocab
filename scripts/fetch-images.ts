// Usage: npm run images [-- <topicId>...] [--force]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface RawWord {
  en: string;
  wiki?: string;
  img?: string;
  noimg?: boolean;
}
interface RawTopic {
  id: string;
  words: RawWord[];
}
interface ImageEntry {
  file: string;
  credit: string;
  source: string;
  ref?: string;
}

const ROOT = join(import.meta.dirname, '..');
const TOPICS_DIR = join(ROOT, 'data/topics');
const IMAGES_JSON = join(ROOT, 'data/images.json');
const OUT_DIR = join(ROOT, 'public/images');
const TMP_DIR = join(ROOT, '.cache');
const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'learn-english-vocab/0.1 (personal study app; https://github.com/)';

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = new Set(args.filter((a) => !a.startsWith('--')));

const refOf = (w: RawWord) => (w.img ? `File:${w.img}` : (w.wiki ?? w.en));
const slugify = (en: string) => en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chunk = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

async function get(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res;
    if (attempt >= 4 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${url}`);
    await sleep(2000 * 2 ** attempt);
  }
}

async function api(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  return (await get(`${API}?${qs}`)).json();
}

async function resolvePageImages(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunk(titles, 50)) {
    const data = await api({ action: 'query', prop: 'pageimages', piprop: 'name', redirects: '1', titles: batch.join('|') });
    const alias = new Map<string, string>();
    for (const n of data.query.normalized ?? []) alias.set(n.from, n.to);
    for (const r of data.query.redirects ?? []) alias.set(r.from, r.to);
    const byTitle = new Map<string, string>();
    for (const p of data.query.pages) if (p.pageimage) byTitle.set(p.title, p.pageimage);
    for (const t of batch) {
      let final = t;
      for (let i = 0; i < 3 && alias.has(final); i++) final = alias.get(final)!;
      const img = byTitle.get(final);
      if (img) out.set(t, img);
    }
  }
  return out;
}

interface FileInfo {
  thumb: string;
  source: string;
  credit: string;
}

async function fileInfo(files: string[]): Promise<Map<string, FileInfo>> {
  const out = new Map<string, FileInfo>();
  for (const batch of chunk(files, 50)) {
    const data = await api({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '500',
      titles: batch.map((f) => `File:${f}`).join('|'),
    });
    const alias = new Map<string, string>();
    for (const n of data.query.normalized ?? []) alias.set(n.to, n.from);
    for (const p of data.query.pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const meta = ii.extmetadata ?? {};
      const artist = stripHtml(meta.Artist?.value ?? 'Unknown').slice(0, 60);
      const license = stripHtml(meta.LicenseShortName?.value ?? '');
      const key = (alias.get(p.title) ?? p.title).replace(/^File:/, '');
      out.set(key, {
        thumb: ii.thumburl ?? ii.url,
        source: ii.descriptionurl,
        credit: [artist, license, 'Wikimedia Commons'].filter(Boolean).join(' · '),
      });
    }
  }
  return out;
}

async function download(url: string, outFile: string): Promise<void> {
  const tmp = join(TMP_DIR, `dl-${process.pid}-${Math.random().toString(36).slice(2)}`);
  writeFileSync(tmp, Buffer.from(await (await get(url)).arrayBuffer()));
  try {
    execFileSync('cwebp', ['-quiet', '-q', '70', '-resize', '400', '0', '-metadata', 'none', tmp, '-o', outFile], { stdio: 'ignore' });
  } catch {
    throw new Error(`cwebp could not convert ${new URL(url).pathname.split('.').pop()} image`);
  } finally {
    rmSync(tmp, { force: true });
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
  const images: Record<string, ImageEntry> = JSON.parse(readFileSync(IMAGES_JSON, 'utf8'));
  const topics: RawTopic[] = readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(TOPICS_DIR, f), 'utf8')));

  const todo: { id: string; word: RawWord }[] = [];
  const noImage: string[] = [];
  for (const t of topics) {
    if (only.size && !only.has(t.id)) continue;
    for (const w of t.words) {
      const id = `${t.id}.${slugify(w.en)}`;
      if (w.noimg) {
        if (images[id]) rmSync(join(OUT_DIR, images[id].file), { force: true });
        delete images[id];
        noImage.push(id);
      } else if (force || !images[id] || images[id].ref !== refOf(w) || !existsSync(join(OUT_DIR, images[id].file))) {
        todo.push({ id, word: w });
      }
    }
  }
  console.log(`${todo.length} words need images`);

  const titles = [...new Set(todo.filter((x) => !x.word.img).map((x) => x.word.wiki ?? x.word.en))];
  const pageImages = await resolvePageImages(titles);
  const fileFor = new Map<string, string>();
  for (const { id, word } of todo) {
    const f = word.img ?? pageImages.get(word.wiki ?? word.en);
    if (f) fileFor.set(id, f);
  }
  const infos = await fileInfo([...new Set(fileFor.values())]);

  const failed: string[] = [];
  const queue = todo.filter(({ id }) => {
    const f = fileFor.get(id);
    if (f && infos.has(f)) return true;
    failed.push(`${id}  (${f ? `file not found: ${f}` : 'no page image'})`);
    return false;
  });

  let done = 0;
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const info = infos.get(fileFor.get(item.id)!)!;
      const file = `${item.id}.webp`;
      try {
        await download(info.thumb, join(OUT_DIR, file));
        images[item.id] = { file, credit: info.credit, source: info.source, ref: refOf(item.word) };
        process.stdout.write(`\r${++done} downloaded`);
      } catch (e) {
        failed.push(`${item.id}  (${(e as Error).message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log();

  const sorted = Object.fromEntries(Object.entries(images).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(IMAGES_JSON, JSON.stringify(sorted, null, 2) + '\n');

  const bySource = new Map<string, string[]>();
  for (const [id, e] of Object.entries(sorted)) bySource.set(e.source, [...(bySource.get(e.source) ?? []), id]);
  const dupes = [...bySource.values()].filter((ids) => ids.length > 1);

  if (failed.length) console.log(`\nMissing (${failed.length}):\n  ${failed.join('\n  ')}`);
  if (dupes.length) console.log(`\nSame image used by multiple words:\n  ${dupes.map((d) => d.join(', ')).join('\n  ')}`);
  if (noImage.length) console.log(`\nMarked noimg: ${noImage.length}`);
}

await main();
