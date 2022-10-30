const express = require("express");
const cors = require("cors");
const app = express();
require("./db/config");
const User = require("./db/users");
const Product = require("./db/product");
const Jwt=require("jsonwebtoken")
const Jwtkey="full-stack"
app.use(express.json());
app.use(cors());
app.post("/register", async (req, rep) => {
  const user = new User(req.body);
  let res = await user.save();
  res = res.toObject();
  delete res.password;
  Jwt.sign({res},Jwtkey,{expiresIn:"2h"},(err,token)=>{
    if(err){
      rep.send({ result: "something is wrong,plase try leter" });
    }
    rep.send({res,auth:token});
  })
});
app.post("/login", async (req, rep) => {
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({user},Jwtkey,{expiresIn:"2h"},(err,token)=>{
        if(err){
          rep.send({ result: "something is wrong,plase try leter" });
        }
        rep.send({user,auth:token});
      })
     
    } else {
      rep.send({ result: "No user found" });
    }
  } else {
    rep.send({ result: "No user found" });
  }
});

app.post("/add-products",verifytoken,async (req, rep) => {
  let product = new Product(req.body);
  let res = await product.save();
  rep.send(res);
});
app.get("/products",verifytoken, async (req, rep) => {
  let products = await Product.find();
  if (products.length > 0) {
    rep.send(products);
  } else {
    rep.send({ result: "No user found" });
  }
});
app.delete("/products/:id",verifytoken ,async (req, rep) => {
  const res = await Product.deleteOne({ _id: req.params.id });
  rep.send(res);
});
app.get("/products/:id",verifytoken, async (req, rep) => {
  let res = await Product.findOne({ _id: req.params.id });
  if (res) {
    rep.send(res);
  } else {
    rep.send({ result: "No user found" });
  }
});
app.put("/products/:id",verifytoken,async (req, rep) => {
  let res = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  rep.send(res);
});
app.get("/search/:key",verifytoken,async (req, rep) => {
  let res = await Product.find({
   "$or" : [{ name: { $regex: req.params.key } },
    {company:{ $regex: req.params.key }},
    {category:{ $regex: req.params.key }},

  ],
  });
  rep.send(res)
});

function verifytoken(req,rep,next){
  let token=req.headers["authorization"]
 
  if(token){
    token=token.split(' ')[1];
   
    Jwt.verify(token,Jwtkey,(erro,vaild)=>{
       if(erro){
         rep.status(401).send({ result: "please provide vaild token with header" });
       }
       else{
         next();
       }
    })
    
  }
  else{
   rep.status(403).send({ result: "please add token with header" });
  }
}
app.listen(5000);
