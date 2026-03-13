const sessionConfig = {
    checkExpirationInterval: 1000 * 60 * 60 * 6, // 6 hours in milliseconds
    connectionLimit: 5,
    createDatabaseTable: true,
    expiration: 1000 * 60 * 60 * 24, // 1 day in milliseconds

    host: 'localhost',
    port: 3306,
    user: 'user',
    password: 'password',
    database: 'db',

    secret: 'SuperS3cretKeyF0rS3ssions!',
    useMySQL: true, // set to false to use in-memory session store (not recommended for production)

    resave: false,
    saveUninitialized: true
};

export default sessionConfig;