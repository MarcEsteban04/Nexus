import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
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
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
      return { results: [], error: err instanceof Error ? err.message : 'Unknown error contacting OpenAI.' };
    }
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
