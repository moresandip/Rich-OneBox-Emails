module.exports = {
  apps: [{
    name: 'rich-onebox-emails',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Monitoring
    watch: false,
    max_memory_restart: '1G',
    
    // Advanced features
    min_uptime: '10s',
    max_restarts: 10,
    
    // Environment specific settings
    node_args: '--max-old-space-size=1024',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_interval: 30000
  }]
};

