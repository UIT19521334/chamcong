const { Pool } = require('pg');

// Create a connection pool and execute raw queries
class PostgresDB {
    /**
     * @param {Object} config - Postgres connection config
     * @param {string} config.user - Username
     * @param {string} config.host - Host address
     * @param {string} config.database - Database name
     * @param {string} config.password - Password
     * @param {number} config.port - Port
     */
    constructor(config) {
        // Default config for Docker Compose postgres service
        const defaultConfig = {
            user: 'postgres',
            host: 'localhost',
            database: 'chamcong',
            password: 'passw0rd',
            port: 54321,
        };
        this.pool = new Pool({ ...defaultConfig, ...config });
    }

    /**
     * Execute a raw query
     * @param {string} text - SQL statement
     * @param {Array} params - Query parameters (optional)
     * @returns {Promise<Object>} Query result
     */
    async query(text, params = []) {
        const client = await this.pool.connect();
        try {
            const res = await client.query(text, params);
            return res;
        } finally {
            client.release();
        }
    }

    // Close the pool when no longer needed
    async close() {
        await this.pool.end();
    }
}

module.exports = PostgresDB;
