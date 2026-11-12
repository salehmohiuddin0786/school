module.exports = {
  apps: [
    {
      name: 'school-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false, // Do NOT watch files in production - saves CPU
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 6000,
      },
    },
    {
      name: 'school-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4200',
      instances: 1,
      exec_mode: 'fork',
      watch: false, // Do NOT watch files in production - saves CPU
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4200,
      },
    },
  ],
};
