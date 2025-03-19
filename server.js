const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport');
const initializePassport = require('./models/passportconfig');
const session = require("express-session");
const app = express()
const port = 5000
const users = require('./models/users');
const cors = require('cors');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const db = require('../backend/db');
const products = require('./models/product');
const cart = require('./models/cart');
const orders = require('./models/orders');
const stripe = require('./models/stripe');



console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

// CORS options
const corsOptions = {
  origin: "http://localhost:3000", // Allow only your frontend origin
  credentials: true, // Allow credentials (cookies, headers, etc.)
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      maxAge: 24 * 60 * 60 * 1000, // Set the session cookie expiration (e.g., 1 day)
    },
  })
  );

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);


// Login endpoint
app.post("/login", passport.authenticate("local"), async(req, res) => {
  const { username} = req.body;
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  
  const user = result.rows[0];
  res.status(200).json({
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      password: user.password,
    },
  });
  
    

  });

// Logout endpoint
app.post("/logout", (req, res) => {
    req.logout(() => {
      res.status(200).send("Logged out");
      
    });
  });



app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
 })



app.post('/register', users.createUser)

// Protected route (requires login)
app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must log in first!" });
  }

  // Respond with user-specific data
  res.status(200).json({ message: `Welcome ${req.user.username}`, user: req.user });
});

app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({ isAuthenticated: true, user: req.user });
  } else {
    return res.status(401).json({ isAuthenticated: false });
  }
});

// GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",

    }, 
    async (accessToken, refreshToken, profile, done) => {
      try {
      console.log("Google Profile:", profile); // Debugging log
      const query = `
        INSERT INTO users (id, username)
        VALUES ($1, $2)
        ON CONFLICT (username) DO UPDATE
        SET username = EXCLUDED.username
        RETURNING *;
      `;
      const values = [profile.id, profile.emails[0].value];
      const { rows } = await db.query(query, values);
      const user = rows[0] || profile; // Use the inserted user or the existing user
      console.log("User from DB or Profile:", user); // Log the user data
      done(null, user);
    } catch (err) {
      console.error("Error during Google OAuth:", err);
      done(err, null);
        
    }}
  ));

//Routes
app.get('/auth/google',
   passport.authenticate('google', {scope: ['profile', 'email']}));


app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/loginPage',
  }),
  (req, res) => {
    // Successful authentication
    console.log("Google callback route hit!"); 
    console.log("Authenticated User:", req.user); // Log the user information
    res.redirect("http://localhost:3000/dashboard");
    
  }
);

app.get('/api/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user);
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' https://js.stripe.com https://m.stripe.network https://q.stripe.com;");
  next();
});

//USERS
app.get('/users', users.getUsers);
app.get('/users/:id', users.getUserById);
//PRODUCTS

app.get('/products', products.getProducts);
app.get('/products/:id', products.getProductsById);
app.get('/productImage', products.getImage);
app.put('/updateStockQuantity/:id', products.updateStockQuantity);

//CART

app.get('/carts', cart.getCart);
app.get('/cart/:id', cart.getCartByid);
app.post('/addToCart', cart.addToCart);
app.put('/updateCart/:id', cart.updateCart);
app.delete('/deleteCart/:id', cart.deleteCart);
app.delete('/deleteUserCart', cart.deleteUserCart);
app.get('/cartProductInfo', cart.getCartProductInfo);

//ORDER
app.post('/addOrder', orders.addToOrders);
app.post('/addOrderItems', orders.addOrderItemsToDb);
app.get('/orderId', orders.getOrderId);

//STRIPE

app.post('/create-checkout-session', stripe.stripe_checkout);
app.post('/payment-success', stripe.paymentSuccess);




app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})