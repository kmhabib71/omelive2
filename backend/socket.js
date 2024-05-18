const socketIO = require("socket.io");
const backendUrl = "http://localhost:3000";
const initializeSocket = async (server) => {
  const io = socketIO(server, {
    cors: {
      origin: backendUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  var userConnection = [];

  io.on("connection", (socket) => {
    console.log("New Connection socketID: ", socket.id);
    // socket.on("sendMessage", (message) => {
    // console.log("Message is: ", message);
    // io.to(message.receiver).emit("message", message);
    // io.to(message.sender).emit("message", message);
    socket.emit("mySocketId", socket.id);
    socket.on("userconnect", (data) => {
      console.log("Logged in username", data.displayName);
      userConnection.push({
        connectionId: socket.id,
        user_id: data.displayName,
        engaged: false,
      });
      userConnection.map(function (user) {
        const use = { "userid: ": user.user_id, Engaged: user.engaged };
        console.log(use);
      });
      // io.of("/admin").emit("newUserConnected", {
      //   userId: socket.id,
      // });
      io.of("/admin").emit("userinfo", userConnection);
      var userCount = userConnection.length;
      console.log("UserCount", userCount);
      // userConnection.map(function (user) {
      //   console.log("Username is: ", user.user_id);
      //   console.log("Engaged is: ", user.engaged);
      // });
    });
    // socket.to(socket.id).emit("socketid", socket.id);
    socket.on("findUnengagedUser", (data) => {
      console.log("findUnengagedUser: ", data);
      if (data && data.username !== " ") {
        const unengagedUser = userConnection.find(
          (user) => !user.engaged && user.connectionId !== socket.id
        );
        if (unengagedUser) {
          console.log(
            "all users: ",
            userConnection.map(function (user) {
              return { "userid: ": user.user_id, Engaged: user.engaged };
            })
          );
          const senderUser = userConnection.find(
            (user) => user.connectionId === socket.id
          );

          if (senderUser) {
            senderUser.engaged = true;
            senderUser.engagedWith = unengagedUser.connectionId; // Store engaged pair information
            unengagedUser.engaged = true;
            unengagedUser.engagedWith = senderUser.connectionId; // Store engaged pair information

            io.to(senderUser.connectionId).emit(
              "startChat",
              unengagedUser.connectionId
            );
            io.to(unengagedUser.connectionId).emit(
              "startChatForReceiver",
              socket.id
            );
            console.log(
              "after engaged: ",
              userConnection.map(function (user) {
                return { "userid: ": user.user_id, Engaged: user.engaged };
              })
            );
          } else {
            console.error("Sender user not found, socket ID:", socket.id);
            socket.emit("error", { message: "Sender user not found." });
          }
        } else {
          console.log("No unengaged users available at the moment.");
          socket.emit("noUnengagedUsers", {
            message: "Please wait for someone to connect...",
          });
        }
      }
    });

    socket.on("findNextUnengagedUser", (data) => {
      console.log("findNextUnengagedUser data: ", data);
      const availableUsers = userConnection.filter(
        (user) =>
          !user.engaged &&
          user.connectionId !== socket.id &&
          user.connectionId !== data.remoteUser
      );
      availableUsers.map(function (user) {
        console.log({
          "availableUsers: ": user.user_id,
          Engaged: user.engaged,
        });
      });
      if (availableUsers.length > 0) {
        const randomUserIndex = Math.floor(
          Math.random() * availableUsers.length
        );
        const randomUser = availableUsers[randomUserIndex];
        const currentUserIndex = userConnection.findIndex(
          (user) => user.connectionId === socket.id
        );

        userConnection[randomUserIndex].engaged = true;
        userConnection[randomUserIndex].engagedWith = socket.id; // Store engaged pair information
        userConnection[currentUserIndex].engaged = true;
        userConnection[currentUserIndex].engagedWith = randomUser.connectionId; // Store engaged pair information

        io.to(socket.id).emit("startChat", randomUser.connectionId);
        io.to(randomUser.connectionId).emit("startChatForReceiver", socket.id);
      } else {
        socket.emit("noAvailableUsers");
      }
    });

    socket.on("offerSentToRemote", (data) => {
      console.log("offerSentToRemote");
      var offerReceiver = userConnection.find(
        (o) => o.user_id === data.remoteUser
      );
      if (offerReceiver) {
        // console.log("OfferReceiver user is: ", offerReceiver.connectionId);
        socket.to(offerReceiver.connectionId).emit("ReceiveOffer", data);
      }
    });
    socket.on("answerSentToUser1", (data) => {
      console.log("answerSentToUser1");
      var answerReceiver = userConnection.find(
        (o) => o.user_id === data.receiver
      );
      if (answerReceiver) {
        // console.log("answerReceiver user is: ", answerReceiver.connectionId);
        socket.to(answerReceiver.connectionId).emit("ReceiveAnswer", data);
      }
    });
    socket.on("candidateSentToUser", (data) => {
      console.log("candidateSentToUser");
      var candidateReceiver = userConnection.find(
        (o) => o.user_id === data.remoteUser
      );
      userConnection.map(function (user) {
        const use = { "userid: ": user.user_id, Engaged: user.engaged };
        // console.log(use);
      });
      if (candidateReceiver) {
        // console.log(
        //   "candidateReceiver user is: ",
        //   candidateReceiver.connectionId
        // );
        socket
          .to(candidateReceiver.connectionId)
          .emit("candidateReceiver", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
      const userIndex = userConnection.findIndex(
        (user) => user.connectionId === socket.id
      );

      if (userIndex !== -1) {
        const disconnectedUser = userConnection[userIndex];
        const engagedUserConnectionId = disconnectedUser.engagedWith;

        userConnection[userIndex].engaged = false;
        delete userConnection[userIndex].engagedWith;

        if (engagedUserConnectionId) {
          // Find the engaged user who was connected to the disconnected user
          const engagedUser = userConnection.find(
            (user) => user.connectionId === engagedUserConnectionId
          );

          if (engagedUser) {
            // Set the engaged status of the remote user to false
            engagedUser.engaged = false;
            delete engagedUser.engagedWith;

            // Notify the engaged user that the remote user has disconnected
            io.to(engagedUser.connectionId).emit("closedRemoteUser", {
              message: "Remote user has disconnected.",
              remoteUser: socket.id,
            });
          }
        }

        // Remove the disconnected user from the userConnection array
        userConnection = userConnection.filter(
          (p) => p.connectionId !== socket.id
        );

        console.log(
          "Rest users username are: ",
          userConnection.map(function (user) {
            return { "userid: ": user.user_id, Engaged: user.engaged };
          })
        );
      }
    });

    socket.on("remoteUserClosed", (data, callback) => {
      // Find the remote user who closed the connection
      var closedUser = userConnection.find(
        (user) => user.user_id === data.remoteUser
      );
      // Find the current user who clicked the "next" button
      var currentUser = userConnection.find(
        (user) => user.connectionId === socket.id
      );

      // If the closed user is found, set their engaged status to false
      if (closedUser) {
        closedUser.engaged = false;
        console.log("closed user data: ", data);
        socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
      }

      // Also set the engaged status of the current user to false
      if (currentUser) {
        currentUser.engaged = false;
      }
      console.log("All users from remoteUserClosed: ", userConnection);
      // Perform any additional server-side cleanup here

      // Once done, call the acknowledgment callback
      callback();
    });
    socket.on("remoteUseStopChat", (data) => {
      // Find the remote user who closed the connection
      var closedUser = userConnection.find(
        (user) => user.user_id === data.remoteUser
      );
      // Find the current user who clicked the "next" button
      var currentUser = userConnection.find(
        (user) => user.connectionId === socket.id
      );

      // If the closed user is found, set their engaged status to false
      if (closedUser) {
        closedUser.engaged = false;
        console.log("closed user data: ", data);
        // socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
      }

      // Also set the engaged status of the current user to false
      if (currentUser) {
        currentUser.engaged = false;
      }
      socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
      console.log("All users from remoteUserClosed: ", userConnection);
      // Perform any additional server-side cleanup here

      // Once done, call the acknowledgment callback
    });

    // socket.on("remoteUserClosed", (data) => {
    //   var closedUser = userConnection.find(
    //     (o) => o.user_id === data.remoteUser
    //   );
    //   if (closedUser) {
    //     console.log("closedUser user is: ", closedUser.connectionId);
    //     closedUser.engaged = false;
    //     console.log("closed user data: ", data);
    //     socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
    //   }
    // });
    // });
  });
  return io;
};

module.exports = initializeSocket;
