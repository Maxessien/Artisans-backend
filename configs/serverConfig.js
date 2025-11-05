import express from "express";
import { createServer } from 'http';
import { Server } from 'socket.io';


const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket)=>console.log("connected to socket", socket.handshake))

export {app, io, server}
