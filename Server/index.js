const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const ws = require('ws');
const fs = require('fs');
const User = require('./models/User');
const Messages = require('./models/Messages');


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/files', express.static(__dirname+ '/files'));
const bSalt = bcrypt.genSaltSync(10);

dotenv.config();

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URL, (err) => {
    if (err) throw err;
});
const jwtSecret = process.env.JWT_SECRET;

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject)=>{
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, Userdata) => {
                if (err) throw err;
                resolve(Userdata);
            })
    } else {
        reject('no token');
    }
    })
}

app.get('/messages/:userId', async(req,res)=>{
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Messages.find({
        sender: {$in:[userId,ourUserId]},
        recipient:{$in:[userId,ourUserId]},  //two cases  => sender is me and recipient is others | sender is other and recipient is me
    }).sort({createdAt: 1})  ;                 //we want to show messages according to the date and time
    res.json(messages);                

})

app.get('/people', async(req,res)=>{
    const users= await User.find({}, {'_id':1,username:1});
    res.json(users);
})

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, Userdata) => {
            if (err) throw err;
            res.json(Userdata);
        })
    } else {
        res.status(401).json('no token');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const RegisterUser = await User.findOne({ username });
    if (RegisterUser) {
        const passOk = bcrypt.compareSync(password, RegisterUser.password);
        if (passOk) {
            jwt.sign({ userId: RegisterUser._id, username }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                    id: RegisterUser._id,
                });
            })
        }

    }});

app.post('/logout', (req,res)=>{
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
});


app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bSalt);
        const createdUser = await User.create({ 
             username: username,
             password: hashedPassword });
        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                id: createdUser._id
            });
        });
    } catch (err) {
        if (err) throw err;
        res.status(500).json('error');
    };
})

const server = app.listen(4040, ()=> console.log('server running'));

const wss = new ws.WebSocketServer({server});

//read username and id from the cookie for connection
wss.on('connection', (connection, req)=>{

    function notifyOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online:[...wss.clients].map(c => ({userId:c.userId, username:c.username }))
        }))
        });
    };

    connection.isAlive = true;

    connection.timer = setInterval(()=>{
        connection.ping();
        connection.deathTimer = setTimeout(()=>{
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyOnlinePeople();
        },1000);
    },5000);

    connection.on('pong', ()=>{
        clearTimeout(connection.deathTimer)
    });

    const cookies = req.headers.cookie;                            /*show active connectin */
    if (cookies) {
        const CookieToken = cookies.split(';').find(str => str.startsWith('token='));
        if (CookieToken) {
            const token = CookieToken.split('=')[1];
            if (token) {
                jwt.verify(token, jwtSecret, (err, userData)=>{
                    if (err) throw err;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }
    //message from other people to me
    connection.on('message', async (message)=>{
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        let filename = null;
        if (file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length-1];
            filename = Date.now() + '.' + ext;
            const pathname = __dirname+'/files/' +filename;       //file type => base 64
            const bufferData = new Buffer.from(file.data.split(',')[1],'base64');
            fs.writeFile(pathname, bufferData, ()=>{
                console.log('file save:'+pathname);
            });
    }
        if (recipient && (text || file )) { 
            const messageDoc = await  Messages.create({
            sender: connection.userId,
            recipient,
            file: file ? filename : null,
            text,
            
            });                     
            [...wss.clients]
            .filter(c=> c.userId === recipient)
            .forEach(c=>c.send(JSON.stringify({
                text,                                   
                sender:connection.userId,
                recipient,
                file: file ? filename: null,
                _id:messageDoc._id,
            })));
        }
    notifyOnlinePeople();

    });
    });

