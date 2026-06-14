const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Utility to retry Prisma operations on P1001 (Connection error)
 * @param {Function} operation - The prisma operation to execute
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 */
const withRetry = async (operation, retries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // P1001 is Prisma's "Can't reach database server" error
      if (error.code === 'P1001' || error.message?.includes('P1001')) {
        console.warn(`[DB] Connection failed (P1001). Retrying ${i + 1}/${retries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

// Export prisma as default to avoid breaking imports
module.exports = prisma;
// Also export withRetry
module.exports.withRetry = withRetry;
