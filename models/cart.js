
const pool = require('../db');


const getCart = (req, res) => {
    pool.query('SELECT * FROM cart ORDER BY id ASC', (error, results) => {
        if(error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Internal Server Error'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)

    })

};

const getCartByid = (req,res) => {
    const id = parseInt(req.params.id);
    pool.query('SELECT * FROM cart where id = $1', [id], (error, results) => {
        if(error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Internal Server Error'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)
    });


};

const getCartProductInfo = (req,res) => {
    pool.query('SELECT cart.id, cart.user_id, products.id AS product_id, name, brand, price, product_images.image_url, products.stock_quantity FROM cart JOIN products ON cart.product_id = products.id JOIN product_images ON products.id = product_images.product_id', (error, results) => {
        if(error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Internal Server Error'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)
    })

}


const addToCart = (req, res) => {
    const {user_id, product_id} = req.body;
       

        if (!user_id) {
            return res.status(400).send('User ID is required');
        }
        if (!product_id) {
            return res.status(400).send('Product ID is required');
        }
        
        pool.query('INSERT INTO cart (user_id, product_id) VALUES ($1, $2)',
            [user_id, product_id], (error, results) => {
                
                if(error){
                    if (error.code === '23503') {
                        // Foreign key violation
                        return res.status(400).send('Invalid user_id or product_id');
                    }
                    console.error(error); // Log the error for debugging
                    res.status(500).send('Internal Server Error'); // Inform the client
                    return;
                };
                res.status(200).send(`Cart added`);

            }
        )


};

const updateCart = (req, res) => {
    const id = parseInt(req.params.id);
    const {user_id, product_id} = req.body;

    if (!id) {
        return res.status(400).send('ID does not exist');
    }

    pool.query('UPDATE  cart SET user_id = $1, product_id = $2 WHERE id = $3',
        [user_id, product_id, id], (error, results) => {
            if(error){
                console.error(error); // Log the error for debugging
                res.status(500).send('Internal Server Error'); // Inform the client
                return;
            }
            res.status(200).send(`Cart modified with ID: ${id}`)

        }
    )
};


const deleteCart = (req, res) => {
    const id = parseInt(req.params.id);

    pool.query('DELETE FROM cart WHERE id = $1',
        [id], (error, results) => {
            if(error){
                console.error(error); // Log the error for debugging
                res.status(500).send('Internal Server Error'); // Inform the client
                return;
            }
            res.status(200).send(`Cart Deleted`)
            

        }
    )

}

const deleteUserCart = (req, res) => {
    const{user_id} = req.body;

    pool.query('DELETE FROM cart WHERE user_id = $1',
        [user_id], (error, results) => {
            if(error){
                console.error(error); // Log the error for debugging
                res.status(500).send('Error deleting user cart'); // Inform the client
                return;
            }
            res.status(200).send(`Cart Deleted`)
            

        }
    )

} 
module.exports = {
    getCart,
    getCartByid, 
    addToCart,
    updateCart,
    deleteCart,
    getCartProductInfo,
    deleteUserCart
};

