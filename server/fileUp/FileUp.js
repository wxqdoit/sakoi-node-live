const fs = require("fs");
const shelljs = require("shelljs");
const request = require('request');
const chokidar = require('chokidar');
const util = require("../util/util");
const progress = require('request-progress');

module.exports = class FileUp {
    constructor(watchPath, headers, threadNum) {
        this.threadNum = threadNum || 5;
        this.headers = headers || {
            userId: 10000009,
            callbackUrl: ' http://47.96.116.7:8001/v1/callback/upload?x-uid=10000009&x-terminaltype=0&x-parentId=5090'
            // appflag: 'broker.app.webcam-monitor',
            // userId: '1',
            // callbackUrl: 'http://192.168.1.32:8002/v1/callback/upload?x-cameraId=1'
        };
        this.watchPath = watchPath;
        this.upUrl = "http://101.206.156.202:8520/uploadfile";
        this.reqQueue = {};
        this.fileList = [];
        this.watchFile()
    }

    watchFile() {
        let watcher = chokidar.watch(this.watchPath, {ignored: /[\/\\]\./, persistent: true});
        watcher.on('add', (path) => {
            let filePathId = util.hash(path);
            console.log('File', path, 'has been added', filePathId);
            let file = {fid: filePathId, path: path};
            let filter = this.fileList.filter((value, index, arr) => {
                return value.fid === filePathId
            });
            if (filter.length === 0) {
                this.fileList.push(file)
            }
            if (Object.values(this.reqQueue).length < this.threadNum && this.fileList.length > 1) {
                let upFile = this.fileList.shift();
                this.reqQueue[upFile.fid] = upFile.fid;
                this.postData(upFile)
            }
        })
    }

    postData(upFile) {
        let formData = {
            field: 'file',
            file: fs.createReadStream(upFile.path),
        };
        upFile.stime = new Date().getTime();
        console.log('upfile start >>>>>>>' + upFile.stime, upFile.path);
        request.post({
            url: this.upUrl,
            formData: formData,
            headers: this.headers,
        }, (error, response, body) => {
            delete this.reqQueue[upFile.fid];
            if (error) {
                console.log("request error >>>>>>>",error);
            }
            if (body) {
                let bodyObj = JSON.parse(body);
                let etime = new Date().getTime();
                if (bodyObj.code === 200) {
                    console.log('upfile success >>>>>>> 耗时约：' + ((etime-upFile.stime)/1000/60).toFixed(2)+"分钟", upFile.path);
                    shelljs.rm("-rf", upFile.path);
                } else {
                    console.log('upfile error >>>>>>>' + etime, "code " + bodyObj.code, upFile.path);
                }
            }

            console.log('delete file >>>>>>>', upFile.path);
        })
    }
};