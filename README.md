# Percu BrickMaster

**Percu BrickMaster is a personal LEGO collection, inventory, and wishlist manager powered by the Rebrickable API.**

<img width="1983" height="793" alt="image" src="https://github.com/user-attachments/assets/f0411892-7691-41a8-9bec-566bd67109c6" />

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

# Screenshots

## Main Screen

<img width="1023" height="976" alt="image" src="https://github.com/user-attachments/assets/aa7e1561-b323-4fd7-9b16-d07a0ba51063" />

## Owned Set Parts

<img width="917" height="1151" alt="image" src="https://github.com/user-attachments/assets/44105640-e343-48d5-b210-7e4ca1b034ab" />

## Item Part from an Owned Set

<img width="921" height="874" alt="image" src="https://github.com/user-attachments/assets/dcd69463-b35a-40d3-9933-730e16bdc2f4" />

## Inventory Screen

<img width="1150" height="807" alt="image" src="https://github.com/user-attachments/assets/c9e8e3d6-3ba1-4e6c-be15-4f5e92340781" />

## Item Part from Inventory

<img width="1176" height="902" alt="image" src="https://github.com/user-attachments/assets/b58e5622-21e1-418b-b8d3-479f38e56ecd" />
