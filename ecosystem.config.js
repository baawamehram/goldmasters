module.exports = {
  apps: [
    {
      name: 'goldmasters-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
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
