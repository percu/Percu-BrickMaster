# Percu BrickMaster

Percu BrickMaster is a personal LEGO collection, inventory, and wishlist manager powered by the Rebrickable API.

## Requirements

- Node.js 20 or newer
- A Rebrickable API key

## Clone and configure

Clone the public repository and enter the project directory:

```bash
git clone https://github.com/percu/Percu-BrickMaster.git
cd Percu-BrickMaster
```

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Set `REBRICKABLE_API_KEY` in `.env`.

## Run locally

Install the dependencies in this project and start the API and React development server:

```bash
npm install --cache .npm-test-cache
npm run dev
```

Open http://localhost:5173.

To run the production build locally:

```bash
npm run build
npm start
```

Open http://localhost:3001.

## Temporary build check

This command installs dependencies only for the build check, then removes `node_modules`, `dist`, and the local npm cache:

```bash
npm ci --cache .npm-test-cache --no-audit --no-fund
npm run build
rm -rf node_modules dist .npm-test-cache
```

When you are finished with a normal local run, you can remove the temporary dependencies with:

```bash
rm -rf node_modules .npm-test-cache dist
```

## Data and cache

SQLite data is stored under `data/`. Part images and thumbnails are cached locally under `local_storage/`.
