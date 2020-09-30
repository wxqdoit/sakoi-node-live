const fs = require("fs");
const shelljs = require("shelljs");
const request = require('request');
const chokidar = require('chokidar');
const util = require("../util/util");
const progress = require('request-progress');

module.exports = class FileUp {
    constructor(watchPath, headers, threadNum ) {
        this.threadNum = threadNum || 5;
        this.headers = headers || {
            userId: '1',
            appflag: 'broker.app.webcam-monitor',
            callbackUrl: 'http://192.168.1.32:8002/v1/callback/upload?x-cameraId=1'
        };
        this.watchPath = watchPath;
        this.upUrl = "http://10.160.0.5:8520/uploadfile";
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
        console.log('upfile start >>>>>>>' + new Date().getTime(), upFile.path);
        request.post({
            url: this.upUrl,
            formData: formData,
            headers: this.headers,
        }, (error, response, body) => {
            delete this.reqQueue[upFile.fid];
            if (error) {
                console.log("request error >>>>>>>");
            }
            if (body) {
                let bodyObj = JSON.parse(body);
                if (bodyObj.code === 200) {
                    console.log('upfile success >>>>>>>' + new Date().getTime(), upFile.path);
                } else {
                    console.log('upfile error >>>>>>>' + new Date().getTime(), "code " + bodyObj.code, upFile.path);
                }
            }
            shelljs.rm("-rf", upFile.path);
            console.log('delete file >>>>>>>', upFile.path);
        })
    }
};