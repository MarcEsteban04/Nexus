import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(app.getAppPath(), '.env.local') });

const isDev = !app.isPackaged;

interface PriceSearchResult {
  title: string;
  link: string;
  source: string;
  price: number | null;
  priceDisplay: string | null;
  rating: number | null;
  reviews: number | null;
  thumbnail: string | null;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonArray(text: string): any[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

ipcMain.handle(
  'shopping:search-prices',
  async (_event, { query }: { query: string }): Promise<{ results: PriceSearchResult[]; error: string | null }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { results: [], error: 'No OPENAI_API_KEY found in .env.local.' };
    if (!query.trim()) return { results: [], error: 'Enter a product to search for.' };

    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-search-preview',
          web_search_options: {},
          messages: [
            {
              role: 'system',
              content:
                'You are a shopping price-search assistant. Search the live web (Shopee, Lazada, Amazon, and other real online stores) for the exact product the user names, favoring the cheapest price and the best-rated listing. Return ONLY a raw JSON array (no markdown fences, no prose) of up to 10 real listings you found, each an object with keys: title (string), price (number, numeric amount only, no currency symbol), currency (string, e.g. "PHP" or "USD"), source (string, the store/site name, e.g. "Shopee", "Lazada", "Amazon"), link (string, full product URL), rating (number 0-5 or null), reviews (integer or null). If you find nothing real, return [].',
            },
            { role: 'user', content: query },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { results: [], error: `OpenAI request failed (${res.status}): ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      const items = extractJsonArray(content);

      const results: PriceSearchResult[] = items
        .filter((r) => r && typeof r.title === 'string' && typeof r.link === 'string')
        .map((r) => {
          const currency = typeof r.currency === 'string' ? r.currency : 'PHP';
          const symbol = currency === 'USD' ? '$' : currency === 'PHP' ? '₱' : `${currency} `;
          return {
            title: r.title,
            link: r.link,
            source: typeof r.source === 'string' ? r.source : 'Unknown store',
            price: typeof r.price === 'number' ? r.price : null,
            priceDisplay: typeof r.price === 'number' ? `${symbol}${r.price.toLocaleString()}` : null,
            rating: typeof r.rating === 'number' ? r.rating : null,
            reviews: typeof r.reviews === 'number' ? r.reviews : null,
            thumbnail: null,
          };
        });

      return { results, error: null };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { results: [], error: 'OpenAI request timed out after 45s. Check your connection and try again.' };
      }
      return { results: [], error: err instanceof Error ? err.message : 'Unknown error contacting OpenAI.' };
    }
  },
);

interface ExtractedCredential {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

ipcMain.handle(
  'vault:parse-import',
  async (_event, { text }: { text: string }): Promise<{ results: ExtractedCredential[]; error: string | null }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { results: [], error: 'No OPENAI_API_KEY found in .env.local.' };
    if (!text.trim()) return { results: [], error: 'Paste or select a file with your credentials first.' };

    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a data-extraction assistant. The user will paste raw, messy personal notes containing website/app login credentials (e.g. copied from a notepad file), in any layout — plain lines, "site: user: pass", tables, mixed formats. Extract every distinct credential you can find. Return ONLY a raw JSON array (no markdown fences, no prose) of objects with keys: title (string, the site or app name), username (string, empty string "" if not present), password (string, empty string "" if not present), url (string, empty string "" if not present), notes (string, empty string "" — any leftover relevant context like security questions). Never invent data that is not in the text. If you find nothing, return [].',
            },
            { role: 'user', content: text },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { results: [], error: `OpenAI request failed (${res.status}): ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      const items = extractJsonArray(content);

      const results: ExtractedCredential[] = items
        .filter((r) => r && typeof r.title === 'string')
        .map((r) => ({
          title: r.title,
          username: typeof r.username === 'string' ? r.username : '',
          password: typeof r.password === 'string' ? r.password : '',
          url: typeof r.url === 'string' ? r.url : '',
          notes: typeof r.notes === 'string' ? r.notes : '',
        }));

      return { results, error: null };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { results: [], error: 'OpenAI request timed out after 45s. Check your connection and try again.' };
      }
      return { results: [], error: err instanceof Error ? err.message : 'Unknown error contacting OpenAI.' };
    }
  },
);

function extractJsonObject(text: string): any | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

interface ScannedReceipt {
  store: string;
  product: string;
  amount: number | null;
  category: string;
  purchaseDate: string;
}

ipcMain.handle(
  'receipts:scan',
  async (_event, { imageDataUrl }: { imageDataUrl: string }): Promise<{ result: ScannedReceipt | null; error: string | null }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { result: null, error: 'No OPENAI_API_KEY found in .env.local.' };
    if (!imageDataUrl) return { result: null, error: 'No receipt photo provided.' };

    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a receipt-scanning assistant. Look at the photo of a store receipt and extract: store (string, the merchant/store name), product (string, a short 3-8 word summary of what was purchased — e.g. "Groceries" or "Coffee and pastry"), amount (number, the final total paid, numeric only, no currency symbol), category (string, a short spending category like "Groceries", "Dining", "Transport", "Utilities"), purchaseDate (string, YYYY-MM-DD, use the date printed on the receipt; if you cannot find one, omit it). Return ONLY a raw JSON object (no markdown fences, no prose) with exactly those keys. If a field truly cannot be read, use an empty string for text fields or null for amount.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract the purchase details from this receipt photo.' },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { result: null, error: `OpenAI request failed (${res.status}): ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      const obj = extractJsonObject(content);
      if (!obj) return { result: null, error: "Couldn't read that receipt. Try a clearer photo." };

      const result: ScannedReceipt = {
        store: typeof obj.store === 'string' ? obj.store : '',
        product: typeof obj.product === 'string' ? obj.product : '',
        amount: typeof obj.amount === 'number' ? obj.amount : null,
        category: typeof obj.category === 'string' ? obj.category : '',
        purchaseDate: typeof obj.purchaseDate === 'string' ? obj.purchaseDate : '',
      };
      return { result, error: null };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { result: null, error: 'OpenAI request timed out after 45s. Check your connection and try again.' };
      }
      return { result: null, error: err instanceof Error ? err.message : 'Unknown error contacting OpenAI.' };
    }
  },
);

interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

ipcMain.handle(
  'assistant:ask',
  async (
    _event,
    { messages, context }: { messages: AssistantChatMessage[]; context: string },
  ): Promise<{ reply: string | null; error: string | null }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { reply: null, error: 'No OPENAI_API_KEY found in .env.local.' };
    if (!messages.length) return { reply: null, error: 'Ask something first.' };

    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                "You are Nexus AI, built into the user's offline-first personal desktop app. Below is a snapshot of their app data — Money Manager, Calendar, Gaming, Receipt Vault, and Shopping wishlist. Their Password Vault is intentionally never included here for privacy. Answer questions about their data directly and concisely, doing any math yourself (totals, comparisons, date logic). If something isn't in the snapshot, say so plainly instead of guessing or inventing data. Keep currency symbols exactly as given (₱ for PHP, $ for USD).\n\n" +
                context,
            },
            ...messages,
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { reply: null, error: `OpenAI request failed (${res.status}): ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';
      return content ? { reply: content, error: null } : { reply: null, error: 'Empty response from the model.' };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { reply: null, error: 'OpenAI request timed out after 45s. Check your connection and try again.' };
      }
      return { reply: null, error: err instanceof Error ? err.message : 'Unknown error contacting OpenAI.' };
    }
  },
);

interface DetectedShortcut {
  name: string;
  path: string;
  targetPath: string | null;
  spawnPath: string | null;
  icon: string | null;
}

function parseUrlShortcut(fullPath: string): { url: string | null; iconFile: string | null } {
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const url = content.match(/^URL=(.+)$/m)?.[1]?.trim() ?? null;
    const iconFile = content.match(/^IconFile=(.+)$/m)?.[1]?.trim() ?? null;
    return { url, iconFile };
  } catch {
    return { url: null, iconFile: null };
  }
}

function resolveSpawnPath(ext: string, fullPath: string, targetPath: string | null): string | null {
  if (ext === '.exe') return fullPath;
  if (ext === '.lnk' && targetPath && path.extname(targetPath).toLowerCase() === '.exe' && fs.existsSync(targetPath)) {
    return targetPath;
  }
  return null;
}

async function resolveIcon(candidatePaths: (string | null)[]): Promise<string | null> {
  for (const candidate of candidatePaths) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    try {
      const image = await app.getFileIcon(candidate, { size: 'normal' });
      if (!image.isEmpty()) return image.toDataURL();
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function scanDesktopFolder(dir: string): Promise<DetectedShortcut[]> {
  if (!fs.existsSync(dir)) return [];
  const found: DetectedShortcut[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== '.lnk' && ext !== '.exe' && ext !== '.url') continue;
    const fullPath = path.join(dir, entry.name);
    const name = path.basename(entry.name, ext);

    let targetPath: string | null = null;
    let iconFile: string | null = null;
    if (ext === '.lnk') {
      try {
        targetPath = shell.readShortcutLink(fullPath).target || null;
      } catch {
        targetPath = null;
      }
    } else if (ext === '.url') {
      const parsed = parseUrlShortcut(fullPath);
      targetPath = parsed.url;
      iconFile = parsed.iconFile;
    }

    const spawnPath = resolveSpawnPath(ext, fullPath, targetPath);
    const icon = await resolveIcon([iconFile, targetPath, fullPath]);
    found.push({ name, path: fullPath, targetPath, spawnPath, icon });
  }
  return found;
}

ipcMain.handle('games:scan-desktop', async (): Promise<{ results: DetectedShortcut[]; error: string | null }> => {
  try {
    const desktops = [path.join(os.homedir(), 'Desktop'), 'C:\\Users\\Public\\Desktop'];
    const seen = new Set<string>();
    const results: DetectedShortcut[] = [];
    for (const dir of desktops) {
      for (const shortcut of await scanDesktopFolder(dir)) {
        const key = shortcut.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(shortcut);
      }
    }
    results.sort((a, b) => a.name.localeCompare(b.name));
    return { results, error: null };
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : 'Could not scan the desktop.' };
  }
});

const activeGameSessions = new Map<string, { child: ChildProcess; startedAt: number }>();

ipcMain.handle(
  'games:launch',
  async (
    event,
    { gameId, execPath, spawnPath }: { gameId: string; execPath: string; spawnPath: string | null },
  ): Promise<{ error: string | null; tracked: boolean }> => {
    if (spawnPath && fs.existsSync(spawnPath)) {
      try {
        const child = spawn(spawnPath, [], { detached: true, stdio: 'ignore', cwd: path.dirname(spawnPath) });
        activeGameSessions.set(gameId, { child, startedAt: Date.now() });
        child.on('exit', () => {
          const session = activeGameSessions.get(gameId);
          activeGameSessions.delete(gameId);
          if (session) {
            const hours = (Date.now() - session.startedAt) / 3_600_000;
            event.sender.send('games:session-ended', { gameId, hours });
          }
        });
        child.unref();
        return { error: null, tracked: true };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Could not launch game.', tracked: false };
      }
    }

    if (!fs.existsSync(execPath)) return { error: 'That file no longer exists at the saved path.', tracked: false };
    const result = await shell.openPath(execPath);
    return { error: result || null, tracked: false };
  },
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#101010',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('maximize', () => win.webContents.send('window:maximized', true));
  win.on('unmaximize', () => win.webContents.send('window:maximized', false));

  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:toggle-maximize', () => (win.isMaximized() ? win.unmaximize() : win.maximize()));
  ipcMain.on('window:close', () => win.close());
  ipcMain.handle('window:is-maximized', () => win.isMaximized());

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
