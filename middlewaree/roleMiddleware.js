const jwt = require('jsonwebtoken')
const config = require("../config")
const secret = config.secret
module.exports = function (roles) {
    return function (req,res,next){
        if(req.method == "OPTIONS") {
            next()
        }
    
        try {
            const token = req.headers.authorization.split(' ')[1]
            if(!token){
                return res.status(403).json({message:"User dont login "+error})
            }
            const {roles: userRoles} = jwt.verify(token,secret)
            let hasRole = false
            userRoles.forEach(role=>{
                if(roles.includes(role)){
                    hasRole = true
                }
            })
            if(!hasRole){
                return res.status(403).json({message: "PRIVATE"})
            }
            next()
        } catch (error) {
            console.log(error)
            return res.status(403).json({message:"User dont login " +error})
        }
    }
}