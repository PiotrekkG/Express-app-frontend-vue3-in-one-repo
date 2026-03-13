const db_config = {
    host: 'localhost',
    port: 3306,
    user: 'user',
    password: 'password',
    database: 'db',
    waitForConnections: true,
    dateStrings: false,
    connectionLimit: 10,
    maxIdle: 5, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    //to delete
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 10000,
        idle: 10000
    }
};

export default db_config;