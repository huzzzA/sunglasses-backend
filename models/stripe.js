const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Allow frontend

const stripe_checkout = async(req, res) => {
    
    const{cart} = req.body;  
    
    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
    }

    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:3000/",
            line_items: cart.map((item) => {
                // ✅ Remove `\r\n` and ensure a valid URL
                let cleanImageUrl = item.image_url ? item.image_url.trim() : "";

                // ✅ Convert relative path to absolute URL
                if (cleanImageUrl.startsWith("/resources/")) {
                    cleanImageUrl = `http://localhost:5000${cleanImageUrl}`;
                }

                // ✅ Use a placeholder image if the URL is still invalid
                if (!cleanImageUrl.startsWith("http")) {
                    cleanImageUrl = "https://via.placeholder.com/150";
                }

                return {
                    price_data: {
                        currency: "gbp",
                        product_data: {
                            name: item.name || "Unnamed Product",
                            images: [cleanImageUrl], // ✅ Use cleaned URL
                        },
                        unit_amount: item.price ? Math.round(item.price * 100) : 1000,
                    },
                    quantity: item.quantity || 1,
                };
             }),



        })
        console.log("✅ Stripe Session Created:", session.id);
        res.json({ id: session.id });
    }catch (error){
        console.error("Stripe error:", error);
        res.status(500).json({ error: "Stripe payment failed", details: error.message });

    }

};

const paymentSuccess = async (req, res) => {
    console.log("🔥 Request received:", req.body); // ✅ Log request body
    const { sessionId } = req.body;
    if(sessionId){
        console.log('session id is valid');
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            console.log("✅ Payment successful! Processing order...");
            return res.status(200).json({ message: "Order completed successfully!" });
        } else {
            console.log("❌ Payment not completed.");
            return res.status(400).json({ error: "Payment not completed." });
        }
    } catch (error) {
        console.error("❌ Error verifying payment:", error);
        return res.status(500).json({ error: "Internal server error." });
    }

}

module.exports = {
    stripe_checkout,
    paymentSuccess
};
