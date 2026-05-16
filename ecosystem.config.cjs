module.exports = {
  apps: [
    {
      name: "trusonxchanger-api",
      script: "server/index.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

