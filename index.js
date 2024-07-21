// importing required packages
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Server } from 'socket.io';

import { messageModel } from './messageSchema.js';
import { connectToDatabase } from './dbConfig.js';
import { userModel } from './userSchema.js';

dotenv.config();
// initializing express app
const app = express();
app.use(cors({
    origin: ["http://localhost:3000"]
}));
app.use(express.static(path.join(path.resolve(), 'public')));
// creating the server
const server = http.createServer(app);

// creating socket server
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"]
    }
});

// listening to events on socket
io.on('connection', (socket) => {
    // listening to user join event
    socket.on('user-joined', async (userData) => {
        // storing the user in db
        const userExists = await userModel.findOne({ userName: userData.userName });
        if (userExists) {
            // update the status if the user already exists
            userExists.status = 'online'
            await userExists.save();
        } else {
            // create new user
            const user = new userModel({ userName: userData.userName, status: 'online' });
            await user.save();
        }

        // load old messages for the user
        const previousMessages = await messageModel.find({}).sort({ createdAt: 1 }).limit(50);
        socket.emit("previousMessages", previousMessages);

        // retrieving all the online users
        const onlineUsers = await userModel.find({ status: 'online' });
        // Emit a welcome message to the user who joined
        socket.emit("alert", { text: `Welcome, ${userData.userName}!` }, onlineUsers);
        // Broadcast a alert to other users about - user joining
        socket.broadcast.emit("alert", {
            text: `${userData.userName} has joined the chat room.`
        }, onlineUsers);

        // listening to typing event from client
        socket.on('typing', (userName) => {
            socket.broadcast.emit('userTyping', { text: `${userName} typing...` });
        });

        // listening disconnect event
        // socket.on('disconnect', async () => {
        // });

        // listening to userLeft event from client
        socket.on('userLeft', async(userName)=>{
            // updating the user as offline
            const user = await userModel.findOne({ userName: userName });
            user.status = 'offline';
            await user.save();
            // retrieving all the online users
            const onlineUsers = await userModel.find({ status: 'online' });
            // Broadcast a alert to other users about - user leaving
            socket.broadcast.emit("userLeft", {
                text: `${userName} has left the chat room.`
            }, onlineUsers);
        });

        // listening to sendMessage event from client
        socket.on('sendMessage', async (messageData) => {
            // store the message in mongodb
            const newMessage = new messageModel({ userName: messageData.userName, message: messageData.message });
            await newMessage.save();
            // send the message to other users
            io.emit('receivedMessage', newMessage);
        })
    });
});

io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

// defining the routes
app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'html', 'home.html'));
});
app.get('/chat', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'html', 'chat.html'));
});

server.listen(process.env.PORT, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
    connectToDatabase();
});