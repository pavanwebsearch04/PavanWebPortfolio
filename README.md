# Pavan Vasita — Portfolio

Next.js 14 (App Router), TypeScript, Tailwind CSS and Framer Motion. The site is a "living spider web": a shared web engine, spider cursor and crawling spiders sit behind every page.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Pages

| Route | Content |
| --- | --- |
| `/` | Home: hero plus short introductions linking to each page |
| `/projects` | Project archive: every project, with category filters |
| `/experience` | Experience timeline; every card starts collapsed and opens on VIEW DETAILS (one at a time) |
| `/skills` | Skills web: one connected orb web from 1360px up, category panels below that |
| `/services` | Services |
| `/about` | About |
| `/lab` | Experiments: Spider Snake (canvas arcade game; arrows, WASD or swipe; best scores in localStorage), Spider vs Fly (tic-tac-toe against the computer: easy, normal, unbeatable minimax; tally in localStorage), Fly Catcher (30-second canvas reaction game; best scores in localStorage) |
| `/contact` | Contact form, links and footer |

Every page is wrapped in `components/shell/SiteShell.tsx`, which provides the web engine, cursor, header and background web.

## Content

All copy lives in `data/` (`projects.ts`, `websites.ts`, `experience.ts`, `skills.ts`, `services.ts`, `contact.ts`). Only real, verified information belongs there.

Projects live in one file, `data/websites.ts`, which both the Home page and `/projects` read:

- **Home** (`components/projects/SelectedWork.tsx`) shows the entries with `featured: true`, in `sortOrder`, capped at `MAX_FEATURED` (7). Card order and sizes are set by the `LAYOUT` array in that component (one slot per featured project).
- **/projects** (`components/projects/ProjectArchive.tsx`) lists every entry in `sortOrder`, with filters built from the data (`projectFilters`): "All Projects", "WordPress" (entries whose `technologies` include it) and one per `group` that has projects.
- Add a project by adding an entry (unique `slug`; a duplicate slug throws at import). Set `featured` and `sortOrder` to control the Home selection and ordering.
- `technologies` lists only what the live site's public markup confirms; `contribution` is shown only when set. Both are optional.
- Each thumbnail is a genuine 1440x900 homepage capture in `public/projects/<slug>.webp` (WebP, ~100 KB). Replace the file when a site's hero changes. An entry with no `image` shows a typographic placeholder (Webeyez, until a capture is added).
- `data/projects.ts` (earlier practice projects) is kept but not rendered.

## Contact form

`POST /api/contact` (`app/api/contact/route.ts`) sends email through [Resend](https://resend.com) using plain `fetch` (no extra dependency). Set the variables in `.env.example` in `.env.local` (or your host's environment settings). Until they are set the endpoint answers `503`, and the form tells the visitor that nothing was sent and offers a prefilled `mailto:` link. The form only ever says "message sent" after the email service accepts the message. To use a different provider, change the `fetch` call in the route; the form needs no changes.

The route has a honeypot field and a small per-instance rate limit; add platform-level rate limiting when deploying.

## SEO

Per-page `metadata` is set in `app/layout.tsx` and `app/lab/page.tsx`; the home page includes `Person` structured data built from `data/contact.ts`. Add `metadataBase`, canonical URLs and an Open Graph image once the production domain is known.

## Skills web and Lab internals

- `data/skills.ts` holds the skills, their real relationships (`skillLinks`), the "core" emphasis set and one-line descriptions. The web only highlights relationships listed there.
- `components/skills/skillsWebLayout.ts` builds the orb web (spokes, rings, frame), seats each skill on a junction and routes every relationship along the web's own strands. `SkillsWeb.tsx` renders it.
