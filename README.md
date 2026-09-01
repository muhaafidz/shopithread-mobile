# 🧵 ShopiThread MY Mobile — Caption Studio PWA

> [!NOTE]
> **Fork notice:** Malaysia-localized companion app of the original
> [**ShopiThread** by **sodikinnaa**](https://github.com/sodikinnaa/shopithread) (MIT).
> All credit for the original engine architecture goes to the original creator —
> this project repackages it as a **phone-first PWA** for the Shopee Malaysia market.

Installable web app (PWA) for Shopee Malaysia affiliates: generate Threads captions
in **Bahasa Melayu** on your phone, manage your product list, and post to Threads
in one tap — no PC required for the posting workflow.

**Live:** https://muhaafidz.github.io/shopithread-mobile/

## ✨ Features

- **Caption Studio** — 7 Bahasa Melayu rojak templates (Racun Shopee, Honest Review,
  Flash Sale/Diskaun, Jom Jimat, Restock Alert, ...) with a spintax engine
- **AI mode (OpenRouter)** — bring your own API key, Gemini Flash default (great BM),
  model picker, style-locked prompting, template fallback when offline
- **Malaysia hashtags** — 40+ real MY affiliate tags across 6 categories
- **Products** — CSV import (desktop extension exports), manual add/edit, CSV export
- **Queue** — save ready captions, 1-tap post, posted tracking
- **Account profiles** — per-Threads-account caption style, hashtags, reply audience
- **1-tap posting** — official Threads web intent opens the Threads app pre-filled
- **Installable & offline** — PWA with service worker; add to home screen
- **100% client-side** — data stays in your device's IndexedDB; keys never leave the device

## 📱 Install on your phone

1. Open the live URL in Chrome (Android) or Safari (iOS)
2. **Android:** menu → *Add to Home screen* / *Install app*
   **iOS:** Share → *Add to Home Screen*
3. Launch from the home screen — full-screen app, works offline

## 🚀 Post to Threads

Tap **🚀 Post to Threads** → the official Threads composer opens with your caption
pre-filled (Meta web intent — on phones it opens the **Threads app**). Attach the
product photo manually (use **🖼️ Save Photo** to grab it first), then hit post.
Nothing is ever auto-submitted.

## 🤖 AI setup (optional)

1. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Settings → paste the key → *List models* → pick a Gemini model → Save
3. Studio → switch to **🤖 AI** mode

The key stays on your device. Template mode keeps working without it.

## 🗺️ Roadmap

- [x] Phase 1 — PWA core (this app)
- [x] Phase 2 — Cloud sync via private GitHub repo (desktop extension "Push to Phone")
- [x] Phase 3 — Android APK (Capacitor) with on-phone Shopee Affiliate scraper → [v1.0.0-android](https://github.com/muhaafidz/shopithread-mobile/releases/tag/v1.0.0-android)
- [ ] Phase 4 — Threads API multi-account auto-posting (server-side tokens)

Full cross-session plan, decisions log, and implementation checklists: **[PLAN.md](PLAN.md)**

## 🔗 Related

- Original project: [sodikinnaa/shopithread](https://github.com/sodikinnaa/shopithread)
- This fork (desktop extension, MY-localized): [muhaafidz/shopithread](https://github.com/muhaafidz/shopithread)

## 📄 License

MIT — see [LICENSE](LICENSE).
