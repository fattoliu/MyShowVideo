import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginsDir = path.join(root, 'plugins');

function extractMeta(src) {
  const head = src.slice(0, 4000);
  const id = (head.match(/\bid:\s*'([^']+)'/) || [])[1];
  const name = (head.match(/\bname:\s*'([^']+)'/) || [])[1];
  const version = (head.match(/\bversion:\s*'([^']+)'/) || [])[1];
  const description = (head.match(/\bdescription:\s*'([^']+)'/) || [])[1] || '';
  const mature = /\bmature:\s*true\b/.test(head);
  if (!id || !name || !version) throw new Error('missing meta fields');
  return { id, name, version, description, mature };
}

function entry(meta, file) {
  const item = {
    id: meta.id,
    name: meta.name,
    version: meta.version,
    url: 'plugins/' + file,
  };
  if (meta.description) item.description = meta.description;
  return item;
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const files = fs.readdirSync(pluginsDir).filter((f) => f.endsWith('.js')).sort();
const all = [];
const vod = [];
const adult = [];

for (const file of files) {
  const meta = extractMeta(fs.readFileSync(path.join(pluginsDir, file), 'utf8'));
  if (meta.id + '.js' !== file) {
    console.warn('filename/id mismatch:', file, meta.id);
  }
  const item = entry(meta, file);
  all.push(item);
  if (meta.mature) adult.push(item);
  else vod.push(item);
}

const lists = {
  all: {
    name: 'HGhub 插件集',
    description: 'HPP 1.0 单文件源合集。相对路径以本列表 URL 为基准。',
    plugins: all,
  },
  vod: {
    name: 'HGhub 影视源',
    description: '影视、动漫、短剧站点源（不含成人内容）。',
    plugins: vod,
  },
  adult: {
    name: 'HGhub 成人源',
    description: '成人站点源。宿主默认隐藏，需在设置中开启后再导入。',
    plugins: adult,
  },
};

fs.mkdirSync(path.join(root, 'subs'), { recursive: true });
writeJson(path.join(root, 'manifest.json'), lists.all);
writeJson(path.join(root, 'subs', 'all.json'), lists.all);
writeJson(path.join(root, 'subs', 'vod.json'), lists.vod);
writeJson(path.join(root, 'subs', '18.json'), lists.adult);

console.log('all', all.length, 'vod', vod.length, '18', adult.length);
