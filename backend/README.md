# HonestInvoice Backend

TypeScript-based REST API backend for the HonestInvoice application.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment configuration:**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

3. **Build the project:**
   ```bash
   npm run build
   ```

## Development

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Production

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types without emitting

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── types/           # TypeScript type definitions
│   ├── routes/          # API routes (to be created)
│   ├── controllers/      # Route controllers (to be created)
│   ├── services/        # Business logic (to be created)
│   ├── middleware/      # Custom middleware (to be created)
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (local, not in git)
├── .env.example         # Example environment variables
├── .eslintrc.json       # ESLint configuration
├── .prettierrc.json     # Prettier configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### API Routes

- `GET /api/v1/` - API information

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `CORS_ORIGIN` - Allowed CORS origin

### Optional Variables

- Database configuration
- JWT configuration
- Email configuration

## Development Guidelines

1. **TypeScript Strict Mode**: All TypeScript files use strict mode
2. **Code Formatting**: Use Prettier for consistent formatting
3. **Linting**: Use ESLint to maintain code quality
4. **Type Safety**: Ensure proper type annotations

## Next Steps

1. Set up database connection (PostgreSQL/MongoDB recommended)
2. Create authentication/authorization middleware
3. Build API routes and controllers
4. Add validation middleware
5. Set up error handling strategies
6. Add unit and integration tests

## License

MIT
