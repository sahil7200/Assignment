# Morrow Market

An Expo React Native e-commerce application built for the React Native Developer technical assignment. The app supports Android and iOS, uses TypeScript, and keeps API, persistence, state, and screens in separate modules.

For an end-to-end explanation of routing, auth, state, API calls, persistence, and library choices, start with the [Developer Guide](docs/DEVELOPER_GUIDE.md).

## Requirements

- Node.js LTS and npm
- Expo Go for a quick device run, or Android Studio / Xcode for native builds
- Internet access for the DummyJSON catalog and authentication

No secrets or environment variables are required. The API base URL is `https://dummyjson.com` in `src/services/api.ts`.

## Run

```powershell
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android and `i` for the iOS simulator. Web preview is available with `npx expo start --web`.

Web SQLite support is configured in `metro.config.js`: Metro bundles the `.wasm` asset and serves the COOP/COEP headers required by SQLite workers. The Expo Router plugin carries the same headers for Expo Hosting; other web hosts must be configured to send them as well.

To check the TypeScript project:

```powershell
npm run typecheck
```

## Demo Flows

For login, use DummyJSON's demo account:

- Username: `emilys`
- Password: `emilyspass`

For signup, the app posts the entered profile to `POST /users/add`, then requires the test OTP `123456`. The code is valid for five minutes; Resend starts a new five-minute window. DummyJSON simulates user creation and does not issue signup tokens, so a verified signup becomes a local demo session stored securely on-device. Standard login uses the real DummyJSON access and refresh tokens.

## Project Structure

```text
app/
  (auth)/                 Login, signup, OTP routes
  (tabs)/                 Protected catalog, cart, favourites, settings tabs
  product/[id].tsx        Product detail and reviews
  _layout.tsx              Startup, theme, locale, and root navigation
src/
  components/              Shared controls and product presentation
  db/                      SQLite schema and repository operations
  i18n/                    English and Arabic resources
  services/                DummyJSON API and secure session storage
  store/                   Zustand application state and workflows
  theme/                   Light and dark design tokens
  types/                   Shared API and application types
screenshots/               Submission screenshot checklist
```

## API Mapping

All network calls are isolated in `src/services/api.ts`.

| Assignment behavior | DummyJSON request |
| --- | --- |
| Login | `POST /auth/login` |
| Current user | `GET /auth/me` with Bearer access token |
| Refresh | `POST /auth/refresh` |
| Signup | `POST /users/add` |
| Product pages | `GET /products?limit=&skip=` |
| Search | `GET /products/search?q=` |
| Categories | `GET /products/categories` |
| Category products | `GET /products/category/{slug}` |
| Sort | `GET /products?sortBy={field}&order={asc\|desc}` |
| Product detail and reviews | `GET /products/{id}` |
| Sample user cart | `GET /carts/user/{userId}` |
| Create cart | `POST /carts/add` |
| Update cart | `PUT /carts/{id}` |
| Delete cart | `DELETE /carts/{id}` |

The OTP is an explicit mock/test flow (code `123456`) because DummyJSON does not deliver SMS or email OTP. No remote `/2fa` request is needed for this mock flow. DummyJSON create/update/delete endpoints are simulated; the SQLite copy remains authoritative and is never discarded when a remote request fails.

## Local Data and Session

`src/db/database.ts` initializes `morrow-market.db`; SQL statements and serialization live in `src/db/repository.ts`, not in screens.

| Table | Stored values |
| --- | --- |
| `cart_items` | Product ID, full product JSON, positive quantity |
| `favorites` | Product ID and full product JSON |
| `cached_products` | Product ID, product JSON, cache timestamp |
| `preferences` | Theme and language key/value pairs |

Auth tokens and the current user are stored with Expo SecureStore. Startup loads local preferences/cart/favourites, validates API sessions through `/auth/me`, and attempts `/auth/refresh` before clearing an invalid remote session. Verified mock signup sessions are restored locally without pretending they have DummyJSON tokens.

Cart operations enforce `minimumOrderQuantity` (default 1) and stock limits. The cart and favourites remain usable offline. Product list/detail requests fall back to cached products; failed network calls do not overwrite local data.

## Theme, Language, and RTL

- Zustand owns current preferences; SQLite persists both across restarts.
- Shared color tokens in `src/theme/tokens.ts` cover light and dark surfaces, text, controls, status bar, and navigation.
- All UI copy is in `src/i18n/index.ts` and rendered through `react-i18next`.
- Arabic selection sets `I18nManager` RTL mode and reloads the app so native navigation and layout direction are recalculated. Screens also use the active language for live text alignment/direction.

## Assignment Coverage

- Auth: login, signup, OTP, session restore, refresh, protected tabs, logout
- Catalog: categories, search, price/rating sort, 10-product pages, loading/empty/error/retry states
- Details: image carousel, stock, minimum quantity, warranty, returns, shipping, API reviews
- Cart: quantity stepper, validation, remove, move to favourites, totals, local persistence, DummyJSON cart endpoint integration
- Favourites: local persistence, search, price sort, add to cart, removal
- Settings: user profile, persistent light/dark theme, persistent English/Arabic locale, logout
- Offline: cached catalog fallback and local cart/favourites remain available

## Screenshots

The required capture list is in [screenshots/README.md](screenshots/README.md). Capture the screens after launching the app with a demo login and a verified signup; no placeholder or fabricated screenshots are included.