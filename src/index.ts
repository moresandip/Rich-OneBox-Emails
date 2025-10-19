import App from './app';
import { config } from './config';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

async function main() {
  try {
    const app = new App();
    await app.start();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main();
