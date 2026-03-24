# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **vue-pure-admin-thin** (精简版), a lightweight Vue 3 admin template based on the full vue-pure-admin framework. It is a non-internationalized version focused on practical project development with a bundle size under 2.3MB (or ~350kb with brotli + CDN).

**Important**: This is the thin/simplified version. Issues and PRs should be directed to the full version repository at https://github.com/pure-admin/vue-pure-admin/issues/new/choose

## Essential Commands

### Development
```bash
pnpm dev          # Start dev server (port 8848 by default)
pnpm serve        # Alias for pnpm dev
```

### Build
```bash
pnpm build              # Production build (uses 8GB memory)
pnpm build:staging      # Staging environment build
pnpm preview            # Preview production build locally
pnpm preview:build      # Build then preview
```

### Code Quality
```bash
pnpm typecheck         # Run TypeScript type checking (tsc + vue-tsc)
pnpm lint              # Run all linters (eslint + prettier + stylelint)
pnpm lint:eslint       # ESLint only
pnpm lint:prettier     # Prettier only
pnpm lint:stylelint    # Stylelint only
```

### Analysis & Maintenance
```bash
pnpm report            # Generate bundle analysis report
pnpm clean:cache       # Clean all caches and reinstall dependencies
```

### Requirements
- **Node**: ^20.19.0 || >=22.13.0
- **Package Manager**: pnpm >=9 (enforced by preinstall hook)

## Architecture

### Tech Stack
- **Framework**: Vue 3.5+ with Composition API
- **Build Tool**: Vite 7+
- **Router**: Vue Router 4 (Hash mode by default)
- **State Management**: Pinia 3
- **UI Library**: Element Plus 2
- **Styling**: TailwindCSS 4 + SCSS
- **Type System**: TypeScript (with strict mode disabled)
- **Icons**: @iconify/vue + unplugin-icons

### Directory Structure
```
src/
├── api/              # API endpoints
├── assets/           # Static assets (images, fonts, icons)
├── components/       # Global reusable components (ReIcon, ReAuth, RePerms)
├── config/           # Platform configuration (loads from public/platform-config.json)
├── directives/       # Vue custom directives
├── layout/           # Layout components (main layout, sidebar, navbar, tags, etc.)
├── plugins/          # Plugin configurations (Element Plus, Echarts)
├── router/           # Routing configuration
│   ├── modules/      # Route modules (auto-imported via glob)
│   ├── index.ts      # Router instance and navigation guards
│   └── utils.ts      # Router utilities (permission filtering, flattening)
├── store/            # Pinia stores
│   └── modules/      # Store modules (user, permission, multiTags, settings, app, epTheme)
├── style/            # Global styles
├── utils/            # Utility functions (auth, tree, message, crypto, etc.)
├── views/            # Page components
├── App.vue           # Root component
└── main.ts           # Application entry point
```

### Routing System

**Key Concepts**:
1. **Static Routes**: Defined in `src/router/modules/*.ts`, auto-imported via Vite glob
2. **Dynamic Routes**: Fetched from backend API via `getAsyncRoutes()` in `src/api/routes.ts`
3. **Route Flattening**: All routes beyond 2 levels deep are automatically flattened to 2 levels via `formatTwoStageRoutes()`
4. **Hierarchy Tree**: Routes are organized hierarchically using `buildHierarchyTree()` for menu rendering
5. **Remaining Routes**: Special routes (login, error pages, etc.) in `modules/remaining.ts` that don't participate in menu

**Route Module Structure**:
```typescript
export default {
  path: "/example",
  component: Layout,  // Layout wrapper
  meta: {
    icon: "icon-name",
    title: "Menu Title",
    rank: 0,           // Sort order (lower = higher priority)
    roles: ["admin"],  // Page-level permissions
    keepAlive: true    // Cache this route component
  },
  children: [/* child routes */]
}
```

**Navigation Guards** (in `router/index.ts`):
- `beforeEach`: Handles auth checks, permission verification, dynamic route initialization, page title updates, NProgress, and keepAlive management
- `afterEach`: Marks pages as loaded, stops NProgress

### State Management

Pinia stores in `src/store/modules/`:
- **user**: User info, login/logout, token management
- **permission**: Dynamic routes, menu generation, permission filtering
- **multiTags**: Tab navigation state
- **settings**: Layout settings (sidebar, theme, etc.)
- **app**: Application-wide state (device type, sidebar status)
- **epTheme**: Element Plus theme customization

### Authentication Flow

1. **Token Storage**: Uses both `js-cookie` (for token) and `localStorage` (for user info)
2. **Multi-Tab Support**: `multiple-tabs` cookie key tracks if user is logged in across tabs
3. **Token Refresh**: Implements refresh token pattern with `accessToken` + `refreshToken`
4. **Auth Check**: In `router/index.ts` beforeEach guard
   - If no token → redirect to `/login`
   - If token exists but no routes loaded → call `initRouter()` to fetch dynamic routes
   - Verify role permissions against route meta.roles

**Key Files**:
- `src/utils/auth.ts`: Token management (getToken, setToken, removeToken)
- `src/store/modules/user.ts`: User state and login actions
- `src/store/modules/permission.ts`: Route permission handling

### API Layer

- Base axios instance likely configured in `src/api/`
- Proxy configuration in `vite.config.ts`: `/api` → `http://193.112.163.225:7704`
- Mock server enabled via `vite-plugin-fake-server` (reads from `mock/` directory)

### Build Configuration

**Environment Files**:
- `.env` - Base config
- `.env.development` - Dev config (port 8848, hash router)
- `.env.production` - Production config
- `.env.staging` - Staging config

**Vite Plugins** (in `build/plugins.ts`):
- TailwindCSS
- Vue + Vue JSX
- Code Inspector (Option+Shift/Alt+Shift to inspect elements)
- Mock Server (vite-plugin-fake-server)
- SVG Loader
- Icons auto-import (unplugin-icons)
- CDN import (optional)
- Compression (optional)
- Console removal (production only)
- Bundle analyzer (via `pnpm report`)

**Build Optimizations**:
- Pre-bundling includes/excludes in `build/optimize.ts`
- Code splitting by file type (js, css, assets)
- Chunk size limit: 4000kb

### Path Aliases

Configured in both `tsconfig.json` and `build/utils.ts`:
- `@/*` → `src/*`
- `@build/*` → `build/*`

### Custom Directives

Auto-imported from `src/directives/index.ts` and registered globally in `main.ts`.

### Global Components

Registered in `main.ts`:
- `IconifyIconOffline`, `IconifyIconOnline`, `FontIcon` - Icon components
- `Auth`, `Perms` - Button-level permission components
- `@pureadmin/table` - Enhanced table component
- `VueTippy` - Tooltip library

### Development Features

- **Code Inspector**: Press Option+Shift (Mac) or Alt+Shift (Windows) while hovering over elements to jump to source code
- **Hot Module Replacement**: Vite HMR with file warmup for views/components
- **Router Warnings**: Suppressed non-essential dynamic route warnings via `vite-plugin-router-warn`

### Important Notes

1. **Route Registration**: All route modules in `src/router/modules/` (except `remaining.ts`) are auto-imported. No manual registration needed.
2. **Component Lazy Loading**: Views use dynamic imports: `() => import("@/views/...")`
3. **IFrame Routes**: Use `@/layout/frame.vue` for embedding external pages
4. **Permission System**: Two levels - page-level (meta.roles) and button-level (meta.auths/permissions)
5. **Keep Alive**: Routes with `meta.keepAlive: true` are cached using Vue's KeepAlive
6. **Dynamic Routes**: On refresh, `initRouter()` fetches backend routes and merges with static routes
7. **Memory Configuration**: Build commands use `NODE_OPTIONS=--max-old-space-size` to allocate sufficient memory (4GB dev, 8GB prod)

## Documentation Links

- Full framework docs: https://pure-admin.cn/
- @pureadmin/utils docs: https://pure-admin-utils.netlify.app
- Live preview: https://pure-admin-thin.netlify.app/#/login
