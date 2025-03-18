const LocalStategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db');

function initialize(passport){

    passport.use(
        new LocalStategy(async (username, password, done) => {
            try{
                const {rows} = await db.query('SELECT * FROM USERS WHERE username = $1', [username]);
                const user = rows[0];
    
                if (!user){
                    return done(null, false, { message: "No user with that username" });
                }
    
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid){
                    return done(null, false, { message: "Password is incorrect" });
                }
    
                return done(null, user);
    
            }catch (err){
                return (err)
    
            }
        }
    
        )
    
    )
    
     // Serialize user to save in session
     passport.serializeUser((user, done) => {
        console.log("Serializing user:", user.id); // Debugging log
        done(null, user.id); // Save the user's ID to the session
      });
    
     // Deserialize user to fetch from session
     passport.deserializeUser(async (id, done) => {
        console.log("Deserializing user with ID:", id); // Debugging log
        try {
          const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [id]);
          return done(null, rows[0]);
        } catch (err) {
          return done(err);
          
        }
      });
    
}

module.exports = initialize;
