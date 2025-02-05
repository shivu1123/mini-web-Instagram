const express = require('express');
const app = express();
const path = require('path');
const usermodel = require("./models/user");
const postmodel = require("./models/post");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
const crypto = require("crypto");
const mongoose = require('mongoose');
const upload = require("./config/multer");
const { log } = require('console');
const utils = require("./utils/utils");


app.use(express.json())
app.use(express.urlencoded({extended:true}))
 app.use(express.static(path.join(__dirname,'public')))
app.set('view engine','ejs')
app.use(cookieParser());

app.get("/", (req,res)=>{
    res.render("singup")
})
        
app.post("/create",(req,res)=>{
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt, async function(err, hash) {
            let usercreate = await usermodel.create({
                username: req.body.username,
                email: req.body.email,
                password: hash

            })
            let {email, password}= req.body;
            let token = jwt.sign({email},"dsd");
            res.cookie("token",token);
            res.render("login",{usercreate});
        });
    });
})

app.get("/login", (req,res)=>{
    res.render("login")
})

app.post("/log",async (req,res)=>{
    let {email , password}=req.body;
    let user = await usermodel.findOne({email});
    if(!user) return res.status(500).send("USER not Found")
    
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token = jwt.sign({email:email,userid:user._id},"dsd");
            res.cookie("token",token);
            res.redirect("/profile")
        }else{
            res.status(500).send("Password is not correct")
        }
    })
})


app.get("/profile", isLoggedin,async (req,res)=>{
    // console.log(req.user)
    let user = await usermodel.findOne({email:req.user.email}).populate("posts")
    res.render("profile",{user})
    // res.render("profile")
})
app.get("/profile/upload", isLoggedin, async(req, res) => {
    let user = await usermodel.findOne({email:req.user.email})

    res.render("edit",{user});
  });

app.post('/uploadd',isLoggedin, upload.single("image"), async (req,res)=>{
    let user = await usermodel.findOne({email:req.user.email})
    user.profilepic = req.file.filename;
    await user.save();
    // console.log(user.profilepic);
    res.redirect("/profile")
})

app.post("/update",isLoggedin,async (req,res)=>{
    let user = await usermodel.findOneAndUpdate({email:req.user.email},{username:req.body.username,bio:req.body.bio},{new:true})
    res.redirect("/profile")
})
app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
  });

app.get("/post",(req,res)=>{
    res.render("create")
})
app.post("/post",isLoggedin,upload.single("image"),async (req,res)=>{
    let user = await usermodel.findOne({email:req.user.email})
    let post = await postmodel.create({
        user: user._id,
        picture: req.file.filename,
        caption: req.body.caption,
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect("/home")
    // console.log(user.posts.picture);
})

app.get("/profile/imgid",isLoggedin,async (req,res)=>{
    let user= await usermodel.findOne({email:req.user.email}).populate("posts")
    let posts = await postmodel.find().populate("user");



    res.render("imgid",{user,posts,dater:utils.formatRelativeTime,})
})

app.get("/home",isLoggedin,async (req,res)=>{
    let user= await usermodel.findOne({email:req.user.email}).populate("posts")
    let posts = await postmodel.find().populate("user");



    res.render("home",{user,posts,dater:utils.formatRelativeTime,})
})

app.get("/search",isLoggedin,async (req,res)=>{
    let user = await usermodel.find({email:req.user.email})
    res.render("search",{user})
})
app.get("/search/:user",isLoggedin, async function (req, res) {
    const searchTerm = `^${req.params.user}`;
    const regex = new RegExp(searchTerm);
  
    let users = await usermodel.find({ username: { $regex: regex } });
  
    res.json(users);
  });
app.get("/profile/:user",isLoggedin,async (req,res)=>{
    let user= await usermodel.findOne({username:req.params.user});
    let userprofile= await usermodel.findOne({username:req.params.user}).populate("posts")
    // console.log(userprofile)
    res.render("userprofile",{userprofile,user})
})
function isLoggedin(req, res, next) {
    // protected routes
    if (req.cookies.token === "") {
      // res.send(`<script>alert("Pelse login first");</script>`)
      res.redirect("/login");
    } else {
      let data = jwt.verify(req.cookies.token, "dsd"); // it verify the user
      req.user = data; // it;s useful for geeting data when user logged in
      next();
    }
  }

app.listen(3000)