const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Role"
    }
})

userSchema.methods.generateAuthToken = function (user) {
    const token = jwt.sign({ _id: this._id, role: user.role }, process.env.JWTPRIVATEKEY, { expiresIn: '7d' });
    return token;
};

const User = mongoose.model("User",userSchema);

const validate=(data)=>{
    const schema=joi.object({
        name:joi.string().required().label("Name"),
        email:joi.string().required().label("Email"),
        username:joi.string().required().label("Username"),
        password:passwordComplexity().required().label("Password"),   
        role: joi.string().required().label("Role"),
    })

    return schema.validate(data)
}

module.exports = {User,validate};