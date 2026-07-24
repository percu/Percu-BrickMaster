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

<img width="1031" height="984" alt="image" src="https://github.com/user-attachments/assets/ed0f778d-bbaa-480a-ba9f-54e510d3a501" />

## Owned Set Parts

<img width="1025" height="978" alt="image" src="https://github.com/user-attachments/assets/0f0c407d-fc9c-41f7-825a-3c198415aefe" />

## Item Part from an Owned Set

<img width="918" height="522" alt="image" src="https://github.com/user-attachments/assets/8fa76e75-8f28-460c-8527-e84f1d5b50ae" />

## Inventory Screen

<img width="1150" height="807" alt="image" src="https://github.com/user-attachments/assets/c9e8e3d6-3ba1-4e6c-be15-4f5e92340781" />

## Item Part from Inventory

<img width="759" height="795" alt="image" src="https://github.com/user-attachments/assets/0c66ba27-6129-42e1-a150-ada7b8558a69" />


