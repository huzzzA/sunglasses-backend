const pool = require('../db');

const getProducts = (req, res) => {
    pool.query('SELECT * FROM products ORDER BY id ASC', (error, results) => {
        if (error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Error fetching products'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)
    })
};

const getProductsById = (req, res) => {
    const id  = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID. Must be a number." });
    }

    pool.query('SELECT * FROM products WHERE id = $1', [id], (error, results) => {
        if (error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Error fetching products By ID'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)
    })
};

const getImage = (req, res) => {

    pool.query(
        'SELECT product_images.product_id, product_images.image_url FROM products JOIN product_images ON products.id = product_images.product_id;', 
        (error, results) => {
        if (error){
            console.error(error); // Log the error for debugging
            res.status(500).send('Error fetching products'); // Inform the client
            return;
        }
        res.status(200).json(results.rows)
    
    }
);
};

const updateStockQuantity = (req,res) => {
    const id  = parseInt(req.params.id);

    pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = $1 AND stock_quantity > 0 RETURNING *;',
         [id], (error, results) => {
            if (error){
                console.error(error); // Log the error for debugging
                res.status(500).send('Error updating stock quantity'); // Inform the client
                console.log('error updating stock');
                return;
            }

            if (results.rowCount === 0) {
                return res.status(400).send('Stock unavailable or product does not exist');
            };

            res.status(200).json(results.rows[0])
            console.log('Stock updated successfully')
            
         }
    )

};





    









module.exports = {
    getProducts,
    getProductsById,
    getImage,
    updateStockQuantity

}