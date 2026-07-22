# Percu BrickMaster

Percu BrickMaster is a personal LEGO collection, inventory, and wishlist manager powered by the Rebrickable API.

## Requirements

- Node.js 20 or newer
- A Rebrickable API key

## Configure

Copy the example environment file and add your API key:

```powershell
Copy-Item .env.example .env
```

Set `REBRICKABLE_API_KEY` in `.env`.

## Run locally

Install the dependencies in this project and start the API and React development server:

```powershell
npm install --cache .npm-test-cache
npm run dev
```

Open http://localhost:5173.

To run the production build locally:

```powershell
npm run build
npm start
```

Open http://localhost:3001.

## Temporary build check

This command installs dependencies only for the build check, then removes `node_modules`, `dist`, and the local npm cache:

```powershell
npm run test:temporary
```

When you are finished with a normal local run, you can remove the temporary dependencies with:

```powershell
Remove-Item node_modules, .npm-test-cache, dist -Recurse -Force
```

## Data and cache

SQLite data is stored under `data/`. Part images and thumbnails are cached locally under `local_storage/`.
