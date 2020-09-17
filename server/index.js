const express = require("express");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const port = process.env.PORT || 3000;
let app = express();
app.use(bodyParser());
app.get("/test", (req, res) => {
    ffmpeg.pipe("rtmp://192.168.0.101/live-test/wxqdoit",{end:true})
    res.send({"hello": "test"})
});

//http://192.168.0.101/live?port=1935&app=live-test&stream=wxqdoit

app.listen(port);
console.log(`server run at http://localhost:${port}`);
