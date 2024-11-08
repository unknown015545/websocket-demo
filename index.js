const express = require("express")
const app = express()
const http = require("node:http")
const socketio = require("socket.io")
const server = http.createServer(app)
const io = new socketio.Server(server)
const bodyParser = require("body-parser")
const fs = require("fs")
const crypto = require("crypto")

function readDB(file) {
    return JSON.parse(fs.readFileSync(file))
}
function appendEntry(file, entry) {
    var db = readDB(file)
    db.maxId = db.maxId + 1
    entry.id = db.maxId
    db.entries.push(entry)
    return fs.writeFileSync(file, JSON.stringify(db))
}

function deleteEntry(file, id) {
    var db = readDB(file)
    var newDB = db.entries.filter((entry) => {
        return !(entry.id == id)
    })
    db.entries = newDB
    var ids = []
    db.entries.map((id) => {
        ids.push(id.id)
    })

    let max = ids.reduce((accumulator, currentValue) => {
        return Math.max(accumulator, currentValue);
    }, ids[0]);
    db.maxId = max
    if(db.maxId == null) {
        db.maxId = 0
    }
    return fs.writeFileSync(file, JSON.stringify(db))
}
app.use(express.static("public"))
app.use(bodyParser.json())


io.on('connection', (socket) => {
    console.log("A connection...")
    var info = {
        loggedIn: false
    }
    socket.info = info
    socket.on('disconnect', () => {
        console.log("Left...")
    })
    socket.on("login", (msg) => {
    var db = readDB("./users.json")
   var entries = db.entries.find(entry => entry.username == msg.username && entry.password == crypto.createHash('sha256').update(msg.password).digest('hex'))
   if(!entries) {
    socket.emit("loginresponse", {
        ok: false
    })
   } else {
    socket.emit("loginresponse", {
        ok: true
    })
    info.loggedIn = true
    info.logInInfo = entries
    socket.info = info
   }
    })
    socket.on("message", (msg) => {
        if(info.loggedIn) {
            appendEntry("./messages.json", {
                username: info.logInInfo.username,
                message: msg.message
            })
            io.sockets.sockets.forEach((sockat) => {
                if(sockat.info.loggedIn) {
                    sockat.emit("message", {
                        username: info.logInInfo.username,
                        message: msg.message,
                        id: readDB("./messages.json").maxId
                    })
                }

            })
            

            
        }
    })

})
app.post("/api/signin", (req, res) => {
   var db = readDB("./users.json")
   var entries = db.entries.find(entry => entry.username == req.body.username && entry.password == crypto.createHash('sha256').update(req.body.password).digest('hex'))
   if(entries) {
    res.send({
        in: true
    })
   } else {
    res.send({
        in: false
    })
   }
   
})

app.post("/api/register", (req, res) => {
    var db = readDB("./users.json")
    if(!req.body) {
        res.send({
            ok: false
        })
    }
    else if(!req.body.username) {
        res.send({
            ok: false
        })
    } else if(!req.body.password) {
        res.send({
            ok: false
        })
     } else if(db.entries.find(entry => entry.username == req.body.username)) {
        res.send({
            ok: false
        })
     } else {
        appendEntry("./users.json", {
            username: req.body.username,
            password: crypto.createHash('sha256').update(req.body.password).digest('hex')
        })
        res.send({
            ok: true
        })
    }
})

app.post("/api/messages", (req, res) => {
    var db = readDB("./users.json")
    var entries = db.entries.find(entry => entry.username == req.body.username && entry.password == crypto.createHash('sha256').update(req.body.password).digest('hex'))
   if(entries) {
    res.send({
        in: true,
        messages: readDB("./messages.json").entries
    })
   } else {
    res.send({
        in: false
    })
   }
})
app.post("/api/deleteMessage", (req, res) => {
    var db = readDB("./users.json")
    var entries = db.entries.find(entry => entry.username == req.body.username && entry.password == crypto.createHash('sha256').update(req.body.password).digest('hex'))
    
   if(entries) {
    if(!req.body.id) {
        res.send({
            in: false
        })
    } else {
    res.send({
        in: true
    })
    deleteEntry("./messages.json", req.body.id)
    io.sockets.sockets.forEach((socket) => {
        if(socket.info.loggedIn) {
            socket.emit("deleteMessage", req.body.id)
        }
    })
}
   } else {
    res.send({
        in: false
    })
   }
})
server.listen(8080, () => {
    console.log("Listening...")
})