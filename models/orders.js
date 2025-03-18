const pool = require('../db');

const addToOrders = (req, res) => {
    
    const {user_id, total_price} = req.body

    pool.query('INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3)',
        [user_id, total_price, 'Paid'], (error, results) => {
            if(error){
                if (error.code === '23503') {
                    // Foreign key violation
                    return res.status(400).send('Invalid user_id or total_price');
                }
                console.error('Datebase error:', error); // Log the error for debugging
                return res.status(500).send('Internal Server Error'); // Inform the client
                
            };
            res.status(200).send('Order added');

        }
    )

};

const addOrderItemsToDb = (req, res) => {
    const {order_id, product_id} = req.body
    pool.query('INSERT INTO order_items (order_id, product_id) VALUES ($1, $2)',
        [order_id, product_id], (error, results) => {
            if(error){
                if (error.code === '23503') {
                    // Foreign key violation
                    return res.status(400).send('Invalid order_id or product_id');
                }
                console.error('Datebase error:', error); // Log the error for debugging
                return res.status(500).send('Internal Server Error'); // Inform the client
                
            };
            res.status(200).send('Order items added');


        }
    )


};

const getOrderId = (req, res) => {
    const {user_id} = req.query

    pool.query('SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', 
        [user_id], (error, results) => {
            if (error){
                console.error(error); // Log the error for debugging
                res.status(500).send('Error fetching order by id'); // Inform the client
                return;
            }
            res.status(200).json(results.rows[0])
        }
    )

}

module.exports = {
    addToOrders,
    addOrderItemsToDb,
    getOrderId
};