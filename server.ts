import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");
const VITE_WATCH_IGNORED = ["**/data.json", "**/dist/**"];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(404).json({ error: "Data not found" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const nextData = JSON.stringify(req.body, null, 2);

      try {
        const existingData = await fs.readFile(DATA_FILE, "utf-8");
        if (existingData === nextData) {
          res.json({ success: true, unchanged: true });
          return;
        }
      } catch (error) {
        // Ignore missing file reads and continue with the write below.
      }

      await fs.writeFile(DATA_FILE, nextData);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: VITE_WATCH_IGNORED,
        },
      },
      appType: "spa",
    });
    // Keep server-side persistence writes from forcing a full browser reload in dev.
    vite.watcher.unwatch(DATA_FILE);
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
