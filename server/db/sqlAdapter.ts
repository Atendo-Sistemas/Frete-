import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';
import { SqlDatabaseConfig } from '../../src/types';

export class SqlAdapter {
  private pool: Pool | null = null;
  private currentConfig: SqlDatabaseConfig = {
    enabled: !!process.env.DATABASE_URL || !!process.env.DB_HOST,
    dbType: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'elolog',
    username: process.env.DB_USER || 'elolog_user',
    password: process.env.DB_PASSWORD || 'elolog_secret_pass',
    ssl: process.env.DB_SSL === 'true',
    autoMigrate: true,
    connectionStatus: 'UNCONFIGURED'
  };

  constructor() {
    this.initializePool();
  }

  public getConfig(): SqlDatabaseConfig {
    return { ...this.currentConfig };
  }

  public updateConfig(newConfig: Partial<SqlDatabaseConfig>) {
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig
    };
    this.initializePool();
  }

  private initializePool() {
    if (!this.currentConfig.enabled) {
      if (this.pool) {
        this.pool.end().catch(() => {});
        this.pool = null;
      }
      this.currentConfig.connectionStatus = 'UNCONFIGURED';
      return;
    }

    try {
      const poolConfig: PoolConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: this.currentConfig.ssl ? { rejectUnauthorized: false } : false
          }
        : {
            host: this.currentConfig.host,
            port: this.currentConfig.port,
            database: this.currentConfig.database,
            user: this.currentConfig.username,
            password: this.currentConfig.password,
            ssl: this.currentConfig.ssl ? { rejectUnauthorized: false } : false,
            max: this.currentConfig.poolMax || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
          };

      if (this.pool) {
        this.pool.end().catch(() => {});
      }

      this.pool = new Pool(poolConfig);
      this.pool.on('error', (err) => {
        console.warn('PostgreSQL Pool background error:', err.message);
        this.currentConfig.connectionStatus = 'ERROR';
      });
    } catch (err: any) {
      console.warn('Failed to initialize PostgreSQL pool:', err.message);
      this.currentConfig.connectionStatus = 'ERROR';
    }
  }

  /**
   * Tests connection with current or custom database parameters
   */
  public async testConnection(customConfig?: Partial<SqlDatabaseConfig>): Promise<{
    success: boolean;
    message: string;
    version?: string;
    tablesCount?: number;
    latencyMs?: number;
  }> {
    const configToTest: SqlDatabaseConfig = {
      ...this.currentConfig,
      ...customConfig
    };

    const startTime = Date.now();
    let tempPool: Pool | null = null;

    try {
      const poolConfig: PoolConfig = {
        host: configToTest.host,
        port: configToTest.port,
        database: configToTest.database,
        user: configToTest.username,
        password: configToTest.password,
        ssl: configToTest.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 6000
      };

      tempPool = new Pool(poolConfig);
      const client = await tempPool.connect();

      try {
        const versionRes = await client.query('SELECT version();');
        const tablesRes = await client.query(`
          SELECT count(*)::int as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);

        const latencyMs = Date.now() - startTime;
        const version = versionRes.rows[0]?.version || 'PostgreSQL';
        const tablesCount = tablesRes.rows[0]?.count || 0;

        this.currentConfig.connectionStatus = 'CONNECTED';
        this.currentConfig.lastTestedAt = new Date().toISOString();

        return {
          success: true,
          message: `Conexão bem-sucedida com PostgreSQL! Latência: ${latencyMs}ms. Tabelas detectadas: ${tablesCount}.`,
          version,
          tablesCount,
          latencyMs
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.currentConfig.connectionStatus = 'ERROR';
      this.currentConfig.lastTestedAt = new Date().toISOString();
      return {
        success: false,
        message: `Falha na conexão SQL: ${err.message || 'Erro desconhecido'}`
      };
    } finally {
      if (tempPool) {
        tempPool.end().catch(() => {});
      }
    }
  }

  /**
   * Reads and executes the schema.sql migration on PostgreSQL
   */
  public async runMigration(): Promise<{
    success: boolean;
    message: string;
    executedStatements?: number;
  }> {
    if (!this.pool) {
      this.initializePool();
    }

    if (!this.pool) {
      return {
        success: false,
        message: 'Pool de banco de dados não está inicializado.'
      };
    }

    try {
      const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
      let sql = '';

      if (fs.existsSync(schemaPath)) {
        sql = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        return {
          success: false,
          message: `Arquivo de schema não encontrado em: ${schemaPath}`
        };
      }

      const client = await this.pool.connect();
      try {
        await client.query(sql);
        this.currentConfig.connectionStatus = 'CONNECTED';
        return {
          success: true,
          message: 'Migração executada com sucesso! Todas as tabelas, índices e sementes do Elo Log foram criadas ou atualizadas.'
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Erro ao executar migração SQL: ${err.message}`
      };
    }
  }

  /**
   * Returns schema.sql raw content
   */
  public getSchemaSql(): string {
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf-8');
    }
    return '-- Schema file not found';
  }

  /**
   * Returns complete database diagnostic status
   */
  public async getStatus(): Promise<{
    enabled: boolean;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
    host: string;
    port: number;
    database: string;
    username: string;
    ssl: boolean;
    lastTestedAt?: string;
    tables: string[];
    recordsCount: Record<string, number>;
  }> {
    const tables: string[] = [];
    const recordsCount: Record<string, number> = {};

    if (this.pool && this.currentConfig.enabled) {
      try {
        const client = await this.pool.connect();
        try {
          const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
          `);
          
          for (const row of res.rows) {
            const tableName = row.table_name;
            tables.push(tableName);
            try {
              const countRes = await client.query(`SELECT count(*)::int as c FROM "${tableName}";`);
              recordsCount[tableName] = countRes.rows[0]?.c || 0;
            } catch {
              recordsCount[tableName] = 0;
            }
          }
          this.currentConfig.connectionStatus = 'CONNECTED';
        } finally {
          client.release();
        }
      } catch (err) {
        this.currentConfig.connectionStatus = 'ERROR';
      }
    }

    return {
      enabled: this.currentConfig.enabled,
      status: this.currentConfig.connectionStatus || 'UNCONFIGURED',
      host: this.currentConfig.host,
      port: this.currentConfig.port,
      database: this.currentConfig.database,
      username: this.currentConfig.username,
      ssl: this.currentConfig.ssl,
      lastTestedAt: this.currentConfig.lastTestedAt,
      tables,
      recordsCount
    };
  }
}

export const sqlAdapter = new SqlAdapter();
