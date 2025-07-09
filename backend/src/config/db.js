// src/db.js
import pgPromise from 'pg-promise';
import 'dotenv-safe/config.js';    // automatically loads .env & .env.example
// console.log('Connecting to DB:', process.env.DATABASE_URL);

const pgp = pgPromise(
    // optional: you can enable query logging here
    // extend: obj => {
    //   obj.on('query', e => {
    //     console.log('QUERY:', e.query);
    //   });
    // }
);
const db = pgp(process.env.DATABASE_URL);

export default db;
