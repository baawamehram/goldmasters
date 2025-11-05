module.exports = {
  apps: [
    {
      name: 'goldmasters-web',
      cwd: './apps/web/.next/standalone',
      script: 'apps/web/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: 'postgresql://neondb_owner:npg_MCVEblsQt5x3@ep-fancy-rice-a1koy6k4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-min-32-chars',
        NEXT_PUBLIC_API_URL: '/api/v1',
        NEXT_PUBLIC_DEFAULT_COMPETITION_ID: 'test-id',
        NEXT_PUBLIC_DEFAULT_COMPETITION_TITLE: 'Gold Coin',
        ADMIN_USERNAME: 'wish-admin',
        ADMIN_PASSWORD: 'yourStrongAdminPassword123'
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'goldmasters-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ],

  deploy: {
    production: {
      user: 'goldmasters',
      host: 'your_server_ip',
      ref: 'origin/main',
      repo: 'git@github.com:baawamehram/goldmasters.git',
      path: '/home/goldmasters/goldmasters',
      'post-deploy': 'pnpm install && pnpm db:generate && pnpm build && pm2 reload ecosystem.config.js --env production && pm2 save'
    }
  }
};
