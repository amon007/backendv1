const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { secret } = require('../config');

const generateAccessToken = (id, roles, username) => {
    const payload = {
        id,
        roles,
        username
    }
    return jwt.sign(payload, secret, {"expiresIn": "24h"});
}

class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({message: "Validation error", errors});
            }
            const {email, username, password} = req.body;
            //check usermame in db
            const candidate = await User.findOne({username});
            const candidateCheckEmail = await User.findOne({ email });
            if(candidateCheckEmail) {
                return res.status(409).json({message:"Email address already in use. Please use a different email."}); 
            }
            if(username === password) {
                return res.status(400).json({message: "Password cannot be the same as the username. Please choose a different password."});
            }

            if(candidate){
                return res.status(400).json({message:"Username already in use. Please choose a different username."});
            }
            //hashing password
            const hashPassword = bcrypt.hashSync(password,10);
            //create user role [admin/user]
            const userRole = await Role.findOne({value:"USER"});
            //create new user
            const user = new User({email, username, password:hashPassword,roles:[userRole.value]});
            user.save()
            return res.json({message:"Registration successful. Welcome!"});
        } catch (error) {
            console.log(error);
            res.status(400).json({message: "Registration error. Please check your input and try again."});
        }
    }

    async login(req, res) {
        try {
            const {username, password} = req.body;
            const user = await User.findOne({username});
            if(!user) {
                return res.status(404).json({message:`User not found. Please check your username. ${username}`});
            }

            const  validPassword = bcrypt.compareSync(password, user.password);
            if(!validPassword){
                return res.status(401).json({message:`Authentication failed. Incorrect password.`});
            }
            const token = generateAccessToken(user._id, user.roles, user.username);
            return res.status(200).json({message: "Authentication successful",token});
            
        } catch (error) {
            console.log(error)
            res.status(401).json({message: "Authentication failed. Please check your credentials and try again.", error});
        }
    }

    async getUsers(req, res) {
        try {
            //get page number from request
            const page = parseInt(req.query.page) || 1;
            //set a limit of elements //parseInt(req.query.limit) for user
            const limit = 2;
            //Calculate how many elements to skip
            const skip = (page - 1) * limit;

            //count users db document
            const totalCount = await User.countDocuments();

            //get users from db
            const users = await User.find().skip(skip).limit(limit)

            if(users.length < 1) {
                 return res.status(404).json({message: "Data not found on the page."});
            }

            //send response json 
            return res.json({
                users,
                currentPage: page,
                totalPage: Math.ceil(totalCount / limit),
            });
        } catch (error) {
            res.status(500).json({ message: "An error occurred while fetching user data. Please try again later. "+ error.message});
        }
    }

    async deleteUser(req, res) {
        //Get user id // methods req.body.userId or req.query.userId
        const userId = req.body.userId;
        try {
            //search for the user in the database and delete
            const user = await User.findByIdAndRemove({ _id: userId });
            //If the user is not found returns an error
            if(!user){
                return res.status(404).json({message: "User not found."})
            }
            //If deleted successfully 
            return res.status(200).json({message: "User deleted successfully."});
        } catch (error) {
            //any error during deletion
            return res.status(500).json({message: "An error occurred while deleting the user. Please try again later.", error});
        }
    }

}

module.exports = new authController();
