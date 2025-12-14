interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  corsOrigin: string;
  logLevel: string;
}

const getConfig = (): Config => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
};

export const config = getConfig();
