/** Host half of the MV Studio bundle: save uploaded character references. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MAX_BYTES = 12 * 1024 * 1024;
const MIME_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function safeName(value, fallback = 'character') {
  const name = String(value || '').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').slice(0, 60);
  return name || fallback;
}

function readBody(req, limit = MAX_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('图片太大，请控制在 12MB 以内。'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function saveCharacter({ baseDir, name, data }) {
  const match = String(data || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error('图片数据格式不正确。');
  const mime = match[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) throw new Error('只支持 PNG、JPEG、WebP 或 GIF。');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) throw new Error('图片是空的。');
  if (bytes.length > MAX_BYTES) throw new Error('图片太大，请控制在 12MB 以内。');
  if (bytes.length < 8) throw new Error('图片文件不完整。');

  const dir = join(baseDir, 'character-library');
  await mkdir(dir, { recursive: true });
  const stem = safeName(name).replace(/\.[^.]+$/, '');
  const filename = `${Date.now()}-${stem}${ext}`;
  const absolute = join(dir, filename);
  await writeFile(absolute, bytes);
  return {
    path: `character-library/${filename}`,
    absolute,
    name: stem,
    bytes: bytes.length,
  };
}

export const inject = ['webServer'];

export function apply(ctx) {
  return ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/mv-studio/character-upload',
    handler: async (req, res) => {
      const send = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(body));
      };
      if (req.method !== 'POST') {
        send(405, { error: '只接受 POST。' });
        return;
      }
      try {
        const body = await readBody(req);
        const input = JSON.parse(body);
        const workspace = ctx.get('workingDirectory')?.defaultDirectory || process.cwd();
        const saved = await saveCharacter({
          baseDir: workspace,
          name: input?.name,
          data: input?.data,
        });
        send(200, saved);
      } catch (error) {
        send(400, { error: error instanceof Error ? error.message : String(error) });
      }
    },
  }));
}
