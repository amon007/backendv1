const jwt = require('jsonwebtoken');
const config = require("../config");
const secret = config.secret;
module.exports = function (req,res,next) {
    if(req.method == "OPTIONS") {
        next();
    }

    try {
        //get jwtToken
        const token = req.headers.authorization.split(' ')[1];
        //if there is no token
        if(!token){
            return res.status(403).json({message:"User is not authorized. Please log in to access this resource. ", error});
        }

        try {
            //decoding jwtToken
            const decodedData = jwt.verify(token,secret);
            req.user = decodedData;
          } catch(err) {
            console.log(err);
            return res.status(403).json(err);
          }
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({message:"User is not authorized. Please log in to access this resource. ", error});
    }
};