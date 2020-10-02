const express = require("express");
const util= require("./util/util");
const port = process.env.PORT || 3000;
let app = express();
let FileUp = require("./fileUp/FileUp");


app.get("/test", (req, res) => {
    res.send({"hello": "test"})
});

// console.log(util.hash("123"),util.hash("123"),util.hash("1233"))

let f1 = new FileUp("F:\\bilibili-video\\21645969-探索鸭");

app.listen(port);
console.log(`server run at http://localhost:${port}`);
