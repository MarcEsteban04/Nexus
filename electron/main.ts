import { app, BrowserWindow, shell, ipcMain, nativeImage } from 'electron';
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

type AssistantProvider = 'openai' | 'groq';

const ASSISTANT_PROVIDERS: Record<
  AssistantProvider,
  { envKey: string; endpoint: string; model: string; label: string }
> = {
  openai: {
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    label: 'OpenAI',
  },
  groq: {
    envKey: 'GROK_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    label: 'Groq',
  },
};

const ASSISTANT_SYSTEM_PROMPT =
  "You are Nexus AI, a warm, witty personal assistant built into the user's offline-first desktop app. Below is a snapshot of their app data. Their Password Vault is intentionally never included here for privacy.\n\n" +
  "Personality: talk like a sharp, friendly assistant who actually knows this person's life, not a dry report generator. Be conversational and a little lively — light humor, genuine reactions (\"nice, that's a solid balance\" / \"heads up, that bill's due soon\"), and a bit of personality are welcome. Never sound robotic or like a form letter.\n\n" +
  "Depth: don't just answer the literal question — go a layer deeper. Surface relevant context the user didn't explicitly ask for but would want (e.g. if asked about spending, mention what's driving it or what's coming up; if asked about balance, note anything notable like a bill due soon or a low account). Break down numbers instead of just stating a total — show the pieces that make it up when it's useful. Proactively flag anything that looks off, urgent, or noteworthy in the data (unpaid bills close to due, a debt with high interest, an upcoming event clash), but only when it's genuinely relevant to what was asked.\n\n" +
  "Formatting: use markdown — headers, bullet points, bold for key numbers — so longer answers are easy to scan rather than one dense paragraph. Keep short factual questions short; expand when the question or the data calls for it.\n\n" +
  "Actions: you have functions available to create an account, log a transaction, add a calendar event, mark a bill paid, or add a wishlist item — the user will confirm before anything is actually executed, so it's safe to propose one when they clearly ask you to. Call a function ONLY when the user's message is an imperative request to create/change something (\"add\", \"log\", \"create\", \"mark ... paid\", \"remind me to\", etc.) — never for a question about existing data (\"how many\", \"what's\", \"how much\", \"do I have\", \"is there\"), even right after a previous action. If the user asks a question, always just answer it in text from the snapshot below and do not call any function, even if a recent turn involved an action. If a request doesn't match any available function (e.g. editing or deleting something), say so instead of forcing it into the closest tool. NEVER invent a value for a required parameter the user hasn't actually given you (an account name, an amount, a title, etc.) — a vague request like \"create another account\" or \"add an expense\" has no real name/amount to use, so ask a short clarifying question in plain text instead of guessing or making up a placeholder like \"BDO Savings\" or \"₱500\". Only call the function once every required value has genuinely come from the user. NEVER write a plain-text sentence claiming something was created/logged/added/marked (e.g. anything starting with a checkmark) — that confirmation is generated by the app itself, only after the user approves your function call. If you want an action to happen, the ONLY way is to call the function; describing it as already done in your own words, even conversationally, is always false since it hasn't happened yet.\n\n" +
  "Accuracy: do all math yourself (totals, comparisons, date logic) using only the real numbers in the snapshot below. If a data domain isn't in the snapshot (it may have been turned off, or genuinely has nothing in it), say so plainly instead of guessing or inventing data. Keep currency symbols exactly as given (₱ for PHP, $ for USD).\n\n";

interface StreamRequest {
  requestId: string;
  messages: AssistantChatMessage[];
  context: string;
  provider: AssistantProvider;
  tools?: unknown[];
}

ipcMain.on('assistant:ask-stream', async (event, { requestId, messages, context, provider, tools }: StreamRequest) => {
  const send = (payload: Record<string, unknown>) => {
    if (!event.sender.isDestroyed()) event.sender.send('assistant:stream-chunk', { requestId, ...payload });
  };
  const finish = (payload: { content: string; toolCalls: unknown[] | null; error: string | null }) => {
    if (!event.sender.isDestroyed()) event.sender.send('assistant:stream-done', { requestId, ...payload });
  };

  const config = ASSISTANT_PROVIDERS[provider] ?? ASSISTANT_PROVIDERS.openai;
  const apiKey = process.env[config.envKey];
  if (!apiKey) return finish({ content: '', toolCalls: null, error: `No ${config.envKey} found in .env.local.` });
  if (!messages.length) return finish({ content: '', toolCalls: null, error: 'Ask something first.' });

  try {
    const res = await fetchWithTimeout(
      config.endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          messages: [{ role: 'system', content: ASSISTANT_SYSTEM_PROMPT + context }, ...messages],
          ...(tools && tools.length ? { tools, tool_choice: 'auto' } : {}),
        }),
      },
      120_000,
    );

    if (!res.ok || !res.body) {
      const body = res.body ? await res.text() : '';
      return finish({ content: '', toolCalls: null, error: `${config.label} request failed (${res.status}): ${body.slice(0, 200)}` });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    const toolCallsAcc: Record<number, { id: string; name: string; arguments: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json?.choices?.[0]?.delta;
          if (typeof delta?.content === 'string' && delta.content) {
            content += delta.content;
            send({ delta: delta.content });
          }
          if (Array.isArray(delta?.tool_calls)) {
            for (const tc of delta.tool_calls) {
              const idx = typeof tc.index === 'number' ? tc.index : 0;
              if (!toolCallsAcc[idx]) toolCallsAcc[idx] = { id: '', name: '', arguments: '' };
              if (tc.id) toolCallsAcc[idx].id = tc.id;
              if (tc.function?.name) toolCallsAcc[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCallsAcc[idx].arguments += tc.function.arguments;
            }
          }
        } catch {
          // ignore malformed SSE chunk
        }
      }
    }

    const toolCalls = Object.values(toolCallsAcc);
    finish({ content, toolCalls: toolCalls.length ? toolCalls : null, error: null });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return finish({ content: '', toolCalls: null, error: `${config.label} request timed out. Check your connection and try again.` });
    }
    finish({ content: '', toolCalls: null, error: err instanceof Error ? err.message : `Unknown error contacting ${config.label}.` });
  }
});

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
  for (const rawCandidate of candidatePaths) {
    if (!rawCandidate) continue;
    // Strip a trailing ",<index>" icon-index suffix some .url IconFile values include.
    const candidate = rawCandidate.replace(/,-?\d+$/, '');
    if (!fs.existsSync(candidate)) continue;

    // .ico files hold the icon's actual image data — app.getFileIcon extracts the shell
    // icon associated with a file's *type* instead, which for .ico is a generic image
    // icon, not the icon's own pixels. nativeImage decodes it directly.
    if (path.extname(candidate).toLowerCase() === '.ico') {
      try {
        const image = nativeImage.createFromPath(candidate);
        if (!image.isEmpty()) return image.toDataURL();
      } catch {
        // try next candidate
      }
      continue;
    }

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
