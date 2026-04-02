const mongoose = require('mongoose');

const URL = process.env.MONGODB_URL

module.exports = () =>{
    try{
        mongoose.connect(URL);
        console.log("Connected to databse successfully");

    }catch(error){
        console.log(error);
        console.log("Could not connect to database!");
    }
}