import io from "socket.io-client";
const backendUrl = "http://localhost:5000";
const socket = io(backendUrl);

export default socket;
