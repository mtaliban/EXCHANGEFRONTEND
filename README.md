# Frontend — Kubadilishana Vituo

Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Pages

| Route | Description |
|---|---|
| `/` | Landing / Home |
| `/about` | Kuhusu sisi |
| `/services` | Huduma zetu |
| `/projects` | Miradi yetu (roadmap) |
| `/contact` | Wasiliana nasi |
| `/login` | Login form |
| `/register` | 4-step registration wizard |

## Colors (tumia via Tailwind classes)

| Rangi | Class |
|---|---|
| Blue | `bg-brand-blue`, `text-brand-blue`, `border-brand-blue` |
| Orange | `bg-brand-orange`, `text-brand-orange` |
| Red | `bg-brand-red`, `text-brand-red` |
| Grey | `bg-brand-grey`, `text-brand-grey-500`, etc. |
| Gold | `bg-brand-gold`, `text-brand-gold-600` |
| White | `bg-brand-white` (au tu `bg-white`) |

## Local dev

```bash
npm install
npm run dev       # http://localhost:3000
npm run test      # Vitest
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # production build
```

Frontend inaunganisha na backend APIs kupitia env vars kwenye `next.config.mjs`. Default:
- `NEXT_PUBLIC_AUTH_API=http://localhost:8001`
- `NEXT_PUBLIC_USER_API=http://localhost:8002`
- `NEXT_PUBLIC_LOCATION_API=http://localhost:8003`
- `NEXT_PUBLIC_MATCH_API=http://localhost:8004`

## Docker

```bash
docker build -t kv-frontend .
docker run -p 3000:3000 kv-frontend
```
