# XenoValidator

A production-ready platform for transaction data validation and processing. Designed specifically to handle messy client data with intelligent validation, auto-correction, duplicate detection, and a comprehensive data quality score.

## Features
1. **Configurable Rules Engine**: Country-specific phone/date validation rules defined via UI, not hardcoded.
2. **Quality Score (0-100)**: Instantly grade datasets based on completeness, validity, uniqueness, and consistency.
3. **Auto-Correction**: Automatically strips spaces, formats dates, and fixes phone numbers with a transparent audit trail.
4. **Duplicate Detection**: Finds exact and fuzzy duplicates (e.g. typos in customer names or double transactions).
5. **Annotated Output**: Returns a clean CSV and an annotated Excel report with red highlights for errors.
6. **Async Pipeline & API**: Handles large files asynchronously with real-time SSE progress updates.

## Local Development

You need Node.js installed.

1. Install dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```

2. Start the development servers concurrently:
   ```bash
   npm run dev
   ```

The frontend will be available at \`http://localhost:5173\` and the API at \`http://localhost:3001\`.

## Easy Deployment (Railway / Render / Vercel)

This project is configured as a monolithic deployment for simplicity. The Node.js Express server automatically serves the React frontend when built.

### Deploying to Railway.app (Recommended)

1. Connect your GitHub repository to Railway.
2. Railway will automatically detect the `railway.json` file.
3. It will run `npm run install:all && npm run build`.
4. It will start the server using `npm start`.

### Manual Production Build
To test the production build locally:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```
   
The app (frontend + backend API) will be available at \`http://localhost:3001\`.
