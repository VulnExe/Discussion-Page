const express = require('express')
const mongoose = require('mongoose');
require('dotenv').config()
const ejs = require('ejs')
const bodyParser = require("body-parser")
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

var app = express()

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(session({
    secret:"our secret key",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect("mongodb+srv://jerry:jerry@cluster0.ym2ea.mongodb.net/myfirst",(err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("connected to DB");
    }
});
// mongoose.connect("mongodb://localhost:27017/DBdiss")
const createPageSchema = new mongoose.Schema({
    userId:String,
    topic:String,
    discussion:String,
    reply:String
})

const userSchema=new mongoose.Schema({
    username:String,
    password:String
})

userSchema.plugin(passportLocalMongoose)

const Create = mongoose.model("Create",createPageSchema)
const User = mongoose.model("User", userSchema)
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const replySchema = new mongoose.Schema({
    id:String,
    author:String,
    reply:String
})

const Reply = mongoose.model("Reply", replySchema)


//Routers GET
app.get("/",(req,res)=>{
    Create.find({},(err,val)=>{
        const values = val
        res.render("home",{list:val})
    })
    
});
app.get("/register",(req,res)=>{
    res.render("register")
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/userpage/:id", (req,res)=>{
    User.findById(req.params.id, (err,user)=>{
        if(err){
            console.log(err);
        }else{ 
            if(req.isAuthenticated){
                res.render('userpage',{user})
            }else{
                res.redirect("/login")
            } 
        }
    })
               
});


app.get("/post/:id",(req,res)=>{
    User.findById(req.params.id,(err,user)=>{
        if(err){
            console.log(err);
        }else{
            if(req.isAuthenticated){
                res.render('post',{user})
            }else{
                res.redirect("/login")
            }
        }
    })
      

})
app.get("/viewpost",(req,res)=>{
    res.render('viewpost')

})
app.get("/thisdiscussion/:id",(req,res)=>{
    Create.findOne({_id:req.params.id},(err,user)=>{
        console.log(user);
        Reply.find({id:req.params.id},(err,replies)=>{

            console.log(replies);
            res.render('viewpost',{user:user, replies:replies})
        })
    })
    
})

//Register

app.post("/register",(req,res)=>{
    
    User.register({username:req.body.username},req.body.password,(err,user)=>{
            if(err){
                console.log(err);
                res.redirect('/register')
            }else{
                passport.authenticate("local")(req,res, function(){ 
                    console.log(user._id)
                res.redirect(`/userpage/${user._id}`)
                })
                
            }
        }
        )
});

//Login

app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password: req.body.password
    })      
    req.login(user,(err)=>{
        if(err){
            console.log(err);
            res.redirect("/login")
        }else{
            passport.authenticate("local")(req,res,()=>{
                const name=req.body.username
                User.findOne({username:name},(err,val)=>{
                    if(!err){
                        console.log(val);
                        res.redirect(`/userpage/${val._id}`)
                    }   
                })   
            })
            
        }
    })
  
});

//post

app.post("/post/:id",(req,res)=>{
    if(req.isAuthenticated()){
        var userId = req.params.id
        var topi = req.body.topic
        var diss = req.body.description
        console.log(userId);
        const create = new Create({
            userId:userId,
            topic:topi,
            discussion:diss
        })
        create.save((err,val)=>{
            if(err){
                console.log(err);
            }else{
                console.log("success added");
                res.redirect('/')
            }
        })

    }else{
        res.redirect("/login")
    }  
})
//post

app.post("/thisdiscussion/:id", (req,res)=>{
    
    if(req.isAuthenticated()){
        Create.findById(req.params.id,(err,user)=>{
              if(err){
                  console.log(err);
              }else{
                  console.log(user.userId);
                  User.findById(user.userId, (err,user)=>{
                      console.log(user.username);
    
                      const reply = new Reply({
                          id:req.params.id,
                          author:user.username,
                          reply:req.body.reply
                      })
                      reply.save((err,result)=>{
                          if(err){
                              console.log(err);
                          }else{
                              console.log(result);
                              
                                res.redirect(`/thisdiscussion/${req.params.id}`)
                              
                            //   res.redirect(`/thisdiscussion/${req.params.id}`,)
                          }
                      })
                  })
              }
     })
 }else{
     res.redirect("/login")
   } 
})


let port = process.env.PORT;
if(port ==null || port == ""){
    port = 3000;
}
app.listen(port,()=>{
    console.log("server started");
})
