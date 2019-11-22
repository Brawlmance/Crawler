module.exports = {
  apps: [
    {
      name: 'Crawler',
      script: './src/index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
    },
  ],
}
