const express = require('express')
const bodyParser = require('body-parser');

const app = express()
const {Pool} = require('pg');
const port = 3000

app.use(bodyParser.json());


// Initialize a PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '',
    port: 5432, // PostgreSQL default port
});
app.pool = pool;

app.post('/login', async (req, res) => {

    const requestData = req.body;

    const pool = req.app.pool;

    try {

        const query = 'SELECT * FROM users where email = $1'
        const values = [requestData.email];

        const client = await pool.connect();
        const result = await client.query(query, values);

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})

app.get('/user', async (req, res) => {

    const pool = req.app.pool;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM users');
        client.release();
        res.json(result.rows);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})

app.get('/user-payment-history', async (req, res) => {

    const pool = req.app.pool;

    try {
        const query = `
            select reservation.id, ps.slot, u.email, reservation.status, reservation.reservation_date
            from reservation
                     join parking_spot ps on ps.id = reservation.parking_spot_id
                     join users u on u.id = reservation.users_id
            order by reservation_date;
        `

        const client = await pool.connect();
        const result = await client.query(query);

        client.release();
        res.json(result.rows);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})

app.put('/reservation', async (req, res) => {

    const requestData = req.body;

    const pool = req.app.pool;

    try {

        const query = `
            update reservation
            set status = $2
            where id = $1
        `
        const values = [requestData.id, requestData.status];

        const client = await pool.connect();
        const result = await client.query(query, values);

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})

app.get('/parking-slot', async (req, res) => {

    const pool = req.app.pool;

    try {
        const query = `
            with reservation_data as (select parking_spot_id,
                                             status,
                                             created_at,
                                             row_number() over (partition by parking_spot_id order by created_at desc ) as idx
                                      from reservation
                                      where status in ('BOOKED', 'RESERVED'))
            select ps.id,
                   ps.slot,
                   coalesce(r.status, 'AVAILABLE')
            from parking_spot ps
                     left join reservation_data r on ps.id = r.parking_spot_id and r.idx = 1;
        `

        const client = await pool.connect();
        const result = await client.query(query);

        client.release();
        res.json(result.rows);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})

app.post('/reservation', async (req, res) => {

    const requestData = req.body;

    const pool = req.app.pool;

    try {

        const query = `
            insert into reservation (parking_spot_id, users_id, status, reservation_date)
            values ($1, $2, 'RESERVED',  to_timestamp($3))
        `
        const values = [requestData.parking_spot_id, requestData.user_id, requestData.reservation_date];

        const client = await pool.connect();
        const result = await client.query(query, values);

        client.release();
        res.json(result.rows[0]);
    } catch (error) {
        throw new Error('Error getting all users: ' + error.message);
    }
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})