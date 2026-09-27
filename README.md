# Gather Mobile

Expo React Native client for Gather Events. The web client and mobile app use the same versioned REST API and Supabase Auth project; this repository contains no database credentials or service role keys.

## Stack

- Expo Router and React Native, with Expo SDK 57 / React Native 0.86
- TanStack Query for remote server state; screen inputs and filters stay local
- Supabase magic-link auth, persisted in SecureStore
- FlashList for virtualized event lists
- A small C++ TurboModule for local event text ranking. The JS fallback keeps Expo Go and web usable; the native implementation is available in a development build.

The native search module is deliberately narrow: it ranks already-loaded event text locally. It does not replace server-side filtering or move UI work into C++.

## Run locally

1. Install Node 22.13+ and npm.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and public anon key. API URL defaults to the deployed Gather service.
3. Run `npm install` and `npm run start`.

Expo Go can run the JS fallback, but cannot load the custom C++ module. To use native search, create a development build with `npx expo prebuild` followed by `npx expo run:android` or `npx expo run:ios`, or use `npx eas-cli build --profile development`. iOS builds require macOS; Android local builds require Android Studio/JDK. The generated `ios/` and `android/` directories are intentionally ignored and recreated by prebuild.

## Auth setup

Supabase Auth must allow the `gather://auth/callback` redirect URL. Keep the web app URL and other client redirects in the existing allowlist. The Supabase Site URL remains the deployed web URL. Magic-link sign-in uses PKCE and exchanges the callback code on device.

## API

The checked-in `api-contract/openapi.json` is copied from the web/API repository's versioned OpenAPI contract. Set `EXPO_PUBLIC_API_URL` to the API base ending in `/api/v1` when using another environment. Public event browsing works signed out. Create/edit and RSVP requests attach the current Supabase bearer token; authorization and ownership rules remain enforced by the API.

## Project structure

- `src/app`: Expo Router screens
- `src/shared/api`: typed API client and DTOs
- `src/shared/auth`: Supabase setup and session provider
- `specs` and `native/event-search`: TurboModule specification and C++ implementation
- `plugins/with-event-search.js`: config plugin for generated iOS and Android projects

## Useful commands

- `npm run start` — Expo dev client server
- `npm run start:go` — run in Expo Go with the JavaScript search fallback
- `npm run web` — browser preview (native module falls back to JS)
- `npm run lint` — Expo lint
- `npx tsc --noEmit` — TypeScript check
- `npx expo prebuild --clean` — regenerate native projects from app config and plugin
