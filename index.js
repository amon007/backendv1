const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;
const cors = require('cors');
const PORT = process.env.PORT || 5000
const fileUpload = require('express-fileupload')
const path = require('path'); 

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');


const app = express()
// app.use(
//     cors(
//     //   {
//     //   origin: '*', 
//     //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     //   credentials: true,
//     //   optionSuccessStatus:200,
//     // }
//     )
//   );
// function cors(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
//        next();
//  }

 app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  // allow preflight
  if (req.method === 'OPTIONS') {
      res.send(200);
  } else {
      next();
  }
});

app.use(express.json())
app.use(fileUpload({}))
app.use(express.static('static'))
app.use('/auth', authRoutes)
app.use('/post', postRoutes)
app.get('*', (req,res)=>{
  const filePath = __dirname + '/home/index.html';
  console.log(filePath)
  res.sendFile(filePath)
})
const start = async () => {
    try{
        await mongoose.connect(MONGODB_URI)
        app.listen(PORT, ()=> console.log(`server started on port ${PORT}`))
    } catch (error){
        console.log(error);
    }
}

start()

//49C3pwdKTq3qeUGH