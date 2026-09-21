# Universal Rule: Auto-Deploy to Vercel and Cloud Tools

All approved changes must be deployed to production (Vercel) and synchronized with all connected services (Google Drive / Apps Script, Upstash KV, environment variables).

## Requirements:
1. Run pre-flight checks: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
2. Commit changes with a semantic message: `git add .` and `git commit -m "..."`.
3. Push immediately to `origin/main`: `git push origin main` to trigger Vercel production deployment.
4. Synchronize `.env.example` and notify user of any required dashboard settings.
5. Provide live production links for immediate validation.
