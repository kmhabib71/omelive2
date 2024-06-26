import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
// import socket from "../../socket";
import io from "socket.io-client";
import { AuthContext } from "../Auth/AuthProvider";
import axios from "axios";
import { toast } from "react-toastify";
import countries from "../../Data/countries.json";
function Home() {
  const { isLoggedIn, authUser } = useContext(AuthContext);
  const userid = authUser._id;
  console.log("authuser: ", authUser.email);

  // .........For Socket.io............
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  // const [peerConnection, setPeerConnection] = useState(null);
  const peerConnection = useRef(null);
  const [sendChannel, setSendChannel] = useState(null);
  const [receiveChannel, setReceiveChannel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [remoteUser, setRemoteUser] = useState("");
  const [nextChatEnabled, setNextChatEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const msgInputRef = useRef(null);
  const socket = useRef(null);
  const messageEndRef = useRef(null);
  const [waitingMessage, setWaitingMessage] = useState("");
  const [iceCandidatesBuffer, setIceCandidatesBuffer] = useState([]);
  const [initiateOffer, setInitiateOffer] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false); // New state
  const [isReadyToFindUser, setIsReadyToFindUser] = useState(false);
  const addBufferedIceCandidates = () => {
    iceCandidatesBuffer.forEach((candidate) => {
      peerConnection.addIceCandidate(candidate).catch(console.error);
    });
    setIceCandidatesBuffer([]);
  };
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);
  useEffect(() => {
    if (remoteStream) {
      const remoteVideo = document.getElementById("user-2");
      console.log("document.getelementbyID");
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (initiateOffer && remoteUser) {
      const createOffer = async () => {
        if (!localStream) {
          console.error("Local stream is not initialized.");
          return;
        }

        const peerConnection = await createPeerConnection();

        if (!peerConnection) {
          console.error("Peer connection is not initialized.");
          return;
        }

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Offer created: ", offer);

        socket.current.emit("offerSentToRemote", {
          username: username,
          remoteUser: remoteUser,
          offer: peerConnection.localDescription,
        });
      };

      createOffer();
    }
  }, [initiateOffer, remoteUser]);

  useEffect(() => {
    if (localStream && isSocketConnected && username !== "") {
      setIsReadyToFindUser(true);
    }
  }, [localStream, isSocketConnected, username]);

  useEffect(() => {
    if (isReadyToFindUser) {
      socket.current.emit("findUnengagedUser", {
        username: username,
      });
    } else {
      console.log("username is: ", username);
    }
  }, [isReadyToFindUser]);

  useEffect(() => {
    const initMediaDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initMediaDevices();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      const currentPeerConnection = peerConnection.current;
      if (currentPeerConnection) {
        currentPeerConnection.close();
      }
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []); // Empty dependency array to ensure it runs only once

  const startChatHandler = useCallback(
    async (otherUserId) => {
      console.log("remoteuser id from startChatHandle: ", otherUserId);
      setRemoteUser(otherUserId); // Correctly update the state
      setInitiateOffer(true);
      if (!localStream) {
        console.error("Local stream is not initialized.");
        return;
      }
      // await createOffer(otherUserId);
    },
    [localStream]
  );

  const startChatHandlerForReceiver = useCallback(
    async (otherUserId) => {
      console.log(
        "remoteuser for user2 from startChatHandlerForReceiver: ",
        otherUserId
      );
      setRemoteUser(otherUserId); // Correctly update the state
      if (!localStream) {
        console.error("Local stream is not initialized.");
        return;
      }
      // await createOffer(otherUserId);
    },
    [localStream]
  );

  useEffect(() => {
    if (localStream && !isSocketConnected) {
      const connectBackendSocket = () => {
        socket.current = io.connect("http://localhost:5000");

        socket.current.on("connect_error", (error) => {
          console.error("Connection Error:", error);
        });

        socket.current.on("connect", () => {
          console.log("The Socket is connected");
        });

        socket.current.on("mySocketId", (socketId) => {
          if (socket.current.connected) {
            setUsername(socketId);
            socket.current.emit("userconnect", {
              displayName: socketId,
            });
          }
          console.log("My Socket ID:", socketId);
        });

        socket.current.on("noUnengagedUsers", (data) => {
          setWaitingMessage(data.message);
        });

        socket.current.on("startChat", startChatHandler);
        socket.current.on("startChatForReceiver", startChatHandlerForReceiver);
        socket.current.on("noAvailableUsers", () => {
          console.log("No available users at the moment.");
          setWaitingMessage("No available users at the moment. Please wait...");
        });
        setIsSocketConnected(true); // Mark socket as connected
      };

      connectBackendSocket();
    }
  }, [
    localStream,
    isSocketConnected,
    startChatHandler,
    startChatHandlerForReceiver,
  ]);
  // // Function to handle incoming chat messages

  // // Function to handle state changes of the receive channel
  // const onReceiveChannelStateChange = (event) => {
  //   console.log("Receive channel state is: " + event.target.readyState);
  // };

  // // Function to handle state changes of the send channel
  // const onSendChannelStateChange = (event) => {
  //   console.log("Send channel state is: " + event.target.readyState);
  // };

  // Function to fetch the next user
  const fetchNextUser = (remoteUser) => {
    // console.log("fetchNextUser: ", {
    //   username: username,
    //   remoteUser: remoteUser,
    // });
    // socket.current.emit("findNextUnengagedUserr", {
    //   username: username,
    //   remoteUser: remoteUser,
    // });
  };
  const createPeerConnection = async () => {
    if (!localStream) {
      console.error("Local stream is not initialized.");
      return;
    }

    const servers = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };

    const newPeerConnection = new RTCPeerConnection(servers);
    peerConnection.current = newPeerConnection; // Update the ref instead of state

    localStream.getTracks().forEach((track) => {
      newPeerConnection.addTrack(track, localStream);
    });

    let remoteStreamTemp = new MediaStream(); // Temporary variable to hold the remote stream

    newPeerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamTemp = stream; // Store the stream temporarily
      console.log("Received remote stream:", remoteStreamTemp);
    };

    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        if (remoteUser) {
          socket.current.emit("candidateSentToUser", {
            username: username,
            remoteUser: remoteUser,
            iceCandidateData: event.candidate,
          });
        } else {
          console.error("remoteUser is not set when sending ICE candidate");
        }
      }
    };

    newPeerConnection.oniceconnectionstatechange = () => {
      if (
        peerConnection.current.iceConnectionState === "connected" ||
        peerConnection.current.iceConnectionState === "completed"
      ) {
        console.log(
          "ICE connection state:",
          peerConnection.current.iceConnectionState
        );
        if (
          remoteStreamTemp &&
          peerConnection.current.getReceivers().length > 0
        ) {
          setRemoteStream(remoteStreamTemp); // Set the remote stream only after successful ICE connection
          setWaitingMessage("");
          const remoteVideo = document.getElementById("user-2");
          console.log("document.getelementbyID");
          if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
          }
          console.log(
            "Remote video stream set after successful negotiation:",
            remoteStreamTemp
          );
        }
      }
    };
    const newSendChannel =
      newPeerConnection.createDataChannel("sendDataChannel");
    setSendChannel(newSendChannel);

    newSendChannel.onopen = () => {
      console.log("Send data channel is now open and ready to use");
    };
    newSendChannel.onstatechange = onSendChannelStateChange;

    newPeerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      setReceiveChannel(receiveChannel);
      receiveChannel.onmessage = onReceiveChannelMessageCallback;
      receiveChannel.onstatechange = onReceiveChannelStateChange;
    };
    return newPeerConnection;
  };

  // sendData function
  const sendData = (message) => {
    if (sendChannel && sendChannel.readyState === "open") {
      sendChannel.send(message);
      setChatMessages([
        ...chatMessages,
        { sender: "You", message, sent: true },
      ]);
      setInputValue("");
    } else {
      console.error("Send channel is not open");
    }
  };

  // // receiveChannelCallback function
  // const receiveChannelCallback = (event) => {
  //   console.log("Receive Channel Callback");
  //   const channel = event.channel;
  //   setReceiveChannel(channel);

  //   channel.onmessage = onReceiveChannelMessageCallback;
  //   channel.onopen = () => onReceiveChannelStateChange(channel);
  //   channel.onclose = () => onReceiveChannelStateChange(channel);
  // };
  // Function to handle incoming chat messages

  // Function to handle state changes of the receive channel
  const onReceiveChannelStateChange = (event) => {
    console.log("Receive channel state is: " + event.target.readyState);
  };

  // Function to handle state changes of the send channel
  const onSendChannelStateChange = (event) => {
    console.log("Send channel state is: " + event.target.readyState);
  };
  const onReceiveChannelMessageCallback = (event) => {
    console.log("Received Message");
    // Update the chat messages state with the new message
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { sender: "Stranger", message: event.data },
    ]);
  };
  const createAnswer = async (data) => {
    await createPeerConnection(); // This will set peerConnection.current

    if (!peerConnection.current) {
      console.error("Peer connection is not initialized.");
      return;
    }

    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      addBufferedIceCandidates();

      socket.current.emit("answerSentToUser1", {
        answer: answer,
        sender: data.remoteUser,
        receiver: data.username,
      });
      console.log("Answer created and sent to user1:", answer);

      // Update the UI state to reflect that the next chat can be started
      setNextChatEnabled(true);
    } catch (error) {
      console.error("Failed to create answer:", error);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("ReceiveOffer", (data) => {
        console.log("Offer Received: ", data);
        createAnswer(data);
      });

      // Clean up the event listener when the component unmounts
      return () => {
        socket.current.off("ReceiveOffer");
      };
    }
  }, [localStream]);
  const onReceiveAnswer = (data) => {
    console.log("answer Received");
    // Assuming addAnswer is a function that handles the received answer
    addAnswer(data);
  };
  const onCandidateReceiver = async (data) => {
    console.log("from onCandidateReceiver");
    try {
      if (
        peerConnection.current &&
        peerConnection.current.signalingState !== "closed"
      ) {
        await peerConnection.current.addIceCandidate(data.iceCandidateData);
        console.log("ICE candidate added successfully");
      } else {
        console.error("Cannot add ICE candidate, signalingState is closed");
      }
    } catch (error) {
      console.error("Failed to add ICE candidate:", error);
    }
  };
  useEffect(() => {
    const onClosedRemoteUser = (data) => {
      console.log("closedUser is: ", data);

      // Stop all tracks on the remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }

      // Close the peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null; // Reset the ref
      }

      // Clear the chat area and stop the remote video stream
      setChatMessages([]); // Assuming you have a state to manage chat messages
      setRemoteStream(new MediaStream()); // Reset the remote stream

      // Log the closure of the remote user and fetch the next user
      console.log("Closed Remote user");
      // fetchNextUser(data.remoteUser); // Assuming fetchNextUser is defined to handle this
      socket.current.emit("findUnengagedUser", {
        username: username,
      });

      // Reset remoteUser state
      setRemoteUser("");
    };

    // Set up the socket event listeners
    if (socket.current) {
      socket.current.on("ReceiveAnswer", onReceiveAnswer);

      socket.current.on("closedRemoteUser", onClosedRemoteUser);
      socket.current.on("candidateReceiver", onCandidateReceiver);
    }
    // Clean up the event listeners when the component unmounts
    return () => {
      if (socket.current) {
        socket.current.off("ReceiveAnswer", onReceiveAnswer);

        socket.current.off("closedRemoteUser", onClosedRemoteUser);
        socket.current.off("candidateReceiver", onCandidateReceiver);
      }
    };
  }, [
    remoteStream,
    peerConnection,
    setChatMessages,
    setRemoteStream,
    fetchNextUser,
    remoteUser,
  ]);
  // // useEffect(() => {
  // //   console.log("remoteuserrrrrrrrrr: ", remoteUser);
  // // }, [remoteUser]);
  const addAnswer = async (data) => {
    if (!peerConnection.current) {
      console.error("Peer connection is not initialized.");
      return;
    }

    const signalingState = peerConnection.current.signalingState;
    console.log(`Current signaling state: ${signalingState}`);

    if (
      signalingState !== "have-local-offer" &&
      signalingState !== "have-remote-offer"
    ) {
      console.error(
        `Cannot set remote description in state: ${signalingState}`
      );
      return;
    }

    try {
      console.log("addAnswer: ", data);
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
      console.log("Remote description set successfully.");
      addBufferedIceCandidates();
      // Update the UI state to reflect that the next chat can be started
      setNextChatEnabled(true); // Assuming you have a state to control this
    } catch (error) {
      console.error("Failed to set remote description: ", error);
    }
  };

  const closeConnection = async () => {
    try {
      // Stop all tracks on the remote stream if it exists
      remoteStream?.getTracks().forEach((track) => track.stop());
      // Reset the remote stream
      setRemoteStream(new MediaStream());

      // Close the peer connection if it exists
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null; // Reset the ref
      }

      // Emit the 'remoteUserClosed' event using the socket instance
      if (socket.current) {
        console.log("Close Emit first");
        socket.current.emit("remoteUserClosed", {
          username: username,
          remoteUser: remoteUser,
        });
      }

      setRemoteUser("");
    } catch (error) {
      console.error("Error in closeConnection:", error);
    }
  };

  const handleNextChatClick = () => {
    if (nextChatEnabled) {
      console.log("From Next Chat button");
      closeConnection();
    } else {
      // If nextChatEnabled is false, you can either do nothing or handle the "Start" case
      console.log("Start Chat button clicked, but not ready for next chat.");
    }
  };

  // const onReceiveChannelMessageCallback = (event) => {
  //   console.log("Received Message");
  //   // Update the chat messages state with the new message
  //   setChatMessages((prevMessages) => [
  //     ...prevMessages,
  //     { sender: "Stranger", message: event.data },
  //   ]);
  // };
  const stopTransmission = () => {
    socket.current.emit("remoteUseStopChat", {
      username: username,
      remoteUser: remoteUser,
    });
    setChatMessages([]);
    // Stop all tracks on the remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    // Close the peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    // Clear the chat area and stop the remote video stream
    setChatMessages([]); // Assuming you have a state to manage chat messages
    setRemoteStream(new MediaStream()); // Reset the remote stream

    // Log the closure of the remote user and fetch the next user
    console.log("Closed Remote user");
  };
  // .........For Socket.io............

  const [modalOpen, settModalOpen] = useState(false);
  const closeModal = () => {
    settModalOpen(false);
    setGenderOpen(false);
    setLanguageOpen(false);
  };
  const openModal = () => {
    settModalOpen(true);
  };

  // const languageFromDB = authUser.userLanguage
  //   ? authUser.userLanguage
  //   : "English";
  // const genderFromDB = authUser.userGender ? authUser.userGender : "Male";
  // console.log("language: ", languageFromDB);
  const [genderOpen, setGenderOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [gender, setGender] = useState("Male");
  const [language, setLanguage] = useState("English");
  const [countryOpen, setCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  useEffect(() => {
    if (authUser.userLanguage) {
      setLanguage(authUser.userLanguage);
    }
  }, [authUser.userLanguage]); // Dependency array
  useEffect(() => {
    if (authUser.userGender) {
      setGender(authUser.userGender);
    }
  }, [authUser.userGender]); // Dependency array
  useEffect(() => {
    if (authUser.userCountry) {
      setSelectedCountry(authUser.userCountry);
    }
  }, [authUser.userCountry]); // Dependency array

  const genderSelect = (gender) => {
    setGender(gender);
    setGenderOpen(false);
    axios
      .put(`http://localhost:5000/api/gender/${userid}`, {
        userGender: gender,
      })
      .then((response) => {
        toast.success("Gender Change Successfully");
      })
      .catch((error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
      });
  };
  const languages = [
    // "Bahasa Melayu",
    // "Bosanski",
    // "Català",
    // "Čeština",
    // "Dansk",
    // "Deutsch",
    // "Eesti",
    "English",
    // "Español",
    // "Français",
    // "Hrvatski",
    // "Indonesia",
    // "Italiano",
    // "Latviešu",
    // "Lietuvių",
    // "Magyar",
    // "Malti",
    // "Nederlands",
    // "Norsk",
    // "Polski",
    // "Português",
    // "Română",
    // "Shqip",
    // "Slovenščina",
    // "Slovenský",
    // "Srpski",
    // "Suomi",
    // "Svenska",
    // "Tagalog",
    // "Tiếng Việt",
    "Türkçe",
    // "Ελληνικά",
    // "Български",
    // "Македонски",
    // "Русский",
    // "Українська",
    // "עברית",
    // "العربية",
    // "انگریزی",
    // "فارسی",
    // "हिन्दी",
    // "ไทย",
    // "한국어",
    // "中文",
    // "日本語",
    // "繁體中文",
  ];

  const languageSelect = (language) => {
    setLanguage(language);
    setLanguageOpen(false);
    axios
      .put(`http://localhost:5000/api/language/${userid}`, {
        userLanguage: language,
      })
      .then((response) => {
        toast.success("Language Change Successfully");
      })
      .catch((error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
      });
  };
  // const [countryName, setCountryName] = useState("");
  // const [countryCode, setCountryCode] = useState("");

  // useEffect(() => {
  //   fetch("https://ipapi.co/json/", { mode: "no-cors" })
  //     .then((res) => res.json())
  //     .then((response) => {
  //       console.log("country name: ", response.country_name);
  //       setCountryName(response.country_name);
  //       setCountryCode(response.country_code);
  //     })
  //     .catch((error) => {
  //       console.log("Request failed:", error);
  //     });
  // }, []);

  const handleFullScreenPage = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        /* Firefox */
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        /* Chrome, Safari & Opera */
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        /* IE/Edge */
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        /* Chrome, Safari & Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE/Edge */
        document.msExitFullscreen();
      }
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      // Call your sendData function here
      sendData(inputValue);
    }
  };

  const countrySelect = (country) => {
    setSelectedCountry(country);
    setCountryOpen(false);

    axios
      .put(`http://localhost:5000/api/country/${userid}`, {
        userCountry: country,
      })
      .then((response) => {
        toast.success("Countries Change Successfully");
      })
      .catch((error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
      });
  };

  return (
    <div>
      <div className="h-screen bg-[#e2e2e2] w-full ">
        <div className="upper-part md:flex w-full  md:h-[75vh] h-[50vh] ">
          <div className="left-video md:w-1/2 relative w-full h-full">
            <video
              // ref={remoteVideoRef}
              ref={remoteVideoRef}
              className="video-player bg-gray-600 w-full h-full "
              id="user-2"
              autoPlay="autoplay"
              playsinnline="playsinnline"></video>
            {waitingMessage && (
              <div className="waiting-message absolute md:top-[50%] md:left-[28%] left-[20%] text-white">
                {waitingMessage}
              </div>
            )}
            <div className="buttons flex justify-between bg-[#e2e2e2] z-40 absolute md:relative bottom-0 w-full">
              <div
                onClick={handleNextChatClick}
                className="start bg-[#68bf9d]  flex items-center justify-center w-1/4 md:h-[9.5rem] rounded ml-2 mt-2 mb-2 text-white text-xl cursor-pointer">
                {nextChatEnabled
                  ? language === "Türkçe"
                    ? "Sonraki"
                    : "Next"
                  : language === "Türkçe"
                  ? "Başlangıç"
                  : "Start"}
              </div>
              <div
                className="start bg-[#f1b29f] flex items-center justify-center w-1/4 md:h-[9.5rem] rounded ml-2 mt-2 mb-2 text-white text-xl cursor-pointer"
                onClick={() => stopTransmission()}>
                {language === "Türkçe" ? "Durmak" : "Stop"}
              </div>
              <div
                onClick={() => {
                  openModal();
                  setCountryOpen(true);
                }}
                className="start bg-white  w-1/4 md:h-[9.5rem] rounded ml-2 mt-2 mb-2 text-xl text-gray-700 shadow-md flex items-center justify-center ">
                <div className="md:block hidden">
                  {language === "Türkçe" ? "Ülke" : "Country"}{" "}
                </div>
                <div className="flex items-center justify-center md:mt-2 text-base md:ml-2">
                  <br />
                  {selectedCountry !== "" ? (
                    <span className="font-bold md:mb-1">{selectedCountry}</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      className="h-6 ml-2 text-center text-gray-700">
                      <path d="M57.7 193l9.4 16.4c8.3 14.5 21.9 25.2 38 29.8L163 255.7c17.2 4.9 29 20.6 29 38.5v39.9c0 11 6.2 21 16 25.9s16 14.9 16 25.9v39c0 15.6 14.9 26.9 29.9 22.6c16.1-4.6 28.6-17.5 32.7-33.8l2.8-11.2c4.2-16.9 15.2-31.4 30.3-40l8.1-4.6c15-8.5 24.2-24.5 24.2-41.7v-8.3c0-12.7-5.1-24.9-14.1-33.9l-3.9-3.9c-9-9-21.2-14.1-33.9-14.1H257c-11.1 0-22.1-2.9-31.8-8.4l-34.5-19.7c-4.3-2.5-7.6-6.5-9.2-11.2c-3.2-9.6 1.1-20 10.2-24.5l5.9-3c6.6-3.3 14.3-3.9 21.3-1.5l23.2 7.7c8.2 2.7 17.2-.4 21.9-7.5c4.7-7 4.2-16.3-1.2-22.8l-13.6-16.3c-10-12-9.9-29.5 .3-41.3l15.7-18.3c8.8-10.3 10.2-25 3.5-36.7l-2.4-4.2c-3.5-.2-6.9-.3-10.4-.3C163.1 48 84.4 108.9 57.7 193zM464 256c0-36.8-9.6-71.4-26.4-101.5L412 164.8c-15.7 6.3-23.8 23.8-18.5 39.8l16.9 50.7c3.5 10.4 12 18.3 22.6 20.9l29.1 7.3c1.2-9 1.8-18.2 1.8-27.5zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" />
                    </svg>
                  )}
                </div>
              </div>
              <div
                onClick={() => {
                  openModal();
                  setGenderOpen(true);
                }}
                className="start bg-white flex items-center justify-center w-1/4 md:h-[9.5rem] rounded m-2  text-xl shadow-md text-gray-700 cursor-pointer ">
                <div className="md:block hidden">
                  {language === "Türkçe" ? "ben" : "I'm"} {gender}
                </div>
                <div>
                  {gender === "male" ? (
                    <img
                      src="/svg/male.svg"
                      alt="Your SVG"
                      className="h-7 ml-3 mt-1"
                    />
                  ) : gender === "female" ? (
                    <img
                      src="/svg/female.svg"
                      alt="Your SVG"
                      className="h-7 ml-3 mt-1"
                    />
                  ) : (
                    <img
                      src="/svg/couple.svg"
                      alt="Your SVG"
                      className="h-7 ml-3 mt-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="left-video md:w-1/2 w-full">
            <div
              className=" h-full relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}>
              <video
                ref={localVideoRef}
                className="video-player bg-black w-full h-full "
                id="user-1"
                autoPlay="autoplay"
                playsinnline="playsinnline"></video>
              <div
                className={`absolute text-white top-[35%] left-[40%] transition-opacity duration-300 ease-in-out ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}>
                <div
                  className="py-4 px-7 bg-gray-300 text-xl text-black rounded-md text-center mb-3 cursor-pointer"
                  onClick={handleFullScreenPage}>
                  {language === "Türkçe" ? "Tam ekran" : "FullScreen"}
                </div>
                <div
                  className="py-4 px-7 bg-gray-300 text-xl text-black rounded-md text-center cursor-pointer"
                  onClick={() => openModal()}>
                  {language === "Türkçe" ? "Ayarlar" : "Settings"}
                </div>
              </div>
            </div>
            <div className=" relative flex md:h-[9.5rem] justify-between bg-[#e2e2e2] ">
              <div className="relative chat h-[9.8rem] bg-white w-full rounded-b-lg ">
                <div className="chatbox  w-full pl-2 pt-1 h-[9.8rem] overflow-y-scroll md:pb-10">
                  <div>
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="py-1">
                        <b>
                          {msg.sent
                            ? language === "Türkçe"
                              ? "Sen"
                              : "You"
                            : language === "Türkçe"
                            ? "Yabancı"
                            : "Stranger"}
                          :
                        </b>{" "}
                        {msg.message}
                      </div>
                    ))}
                    <div ref={messageEndRef}></div>
                  </div>
                </div>
                <div className="text-input absolute bottom-0 w-full mb-4 md:mb-0">
                  <input
                    type="text"
                    name="textinput"
                    id="textinput"
                    value={inputValue}
                    className=" absolute bottom-0 w-full border-t focus:outline-none p-2"
                    placeholder={
                      language === "Türkçe"
                        ? "Mesajınızı buraya yazın ve enter tuşuna basın"
                        : "Type your message here and press enter"
                    }
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 top-[-60%] z-50 overflow-auto ${
          modalOpen ? "flex" : "hidden"
        } `}>
        <div
          className="fixed inset-0 bg-gray-900 opacity-80"
          onClick={closeModal}></div>{" "}
        {/* Background Overlay */}
        <div
          className="relative p-4 bg-white w-full max-w-md m-auto flex-col flex rounded-lg z-10" // Modal Body
          onClick={(e) => e.stopPropagation()} // Prevents click inside the modal from closing it
        >
          <div className="relative">
            <div
              className="absolute right-0 top-0 cursor-pointer"
              onClick={closeModal}>
              X
            </div>
            <div>
              <div className="gender flex justify-center items-center">
                <div className=" py-2 text-xl border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md  relative ">
                  <div className=" w-full flex flex-col justify-start items-center">
                    <div
                      onClick={() => {
                        setGenderOpen(!genderOpen);
                        setLanguageOpen(false);
                        setCountryOpen(false);
                      }}
                      className="flex items-center bg-gray-300 py-1 rounded-md px-16 cursor-pointer hover:bg-[#68bf9d] p-2 ">
                      <div className="text-xl">
                        {language === "Türkçe" ? "ben" : "I am"}:{" "}
                      </div>
                      {gender === "male" ? (
                        <img
                          src="/svg/male.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      ) : gender === "female" ? (
                        <img
                          src="/svg/female.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      ) : (
                        <img
                          src="/svg/couple.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      )}
                    </div>
                    <div
                      className={`${
                        genderOpen ? "opacity-100" : "opacity-0 hidden"
                      } transition-opacity duration-300 ease-in-out border border-gray-400 rounded-md m-1 p-2 drop-shadow-sm shadow-md absolute top-12 bg-white z-40`}>
                      <div
                        onClick={() => genderSelect("male")}
                        className="flex items-center  py-1 rounded-md px-12 cursor-pointer hover:bg-[#68bf9d] ">
                        <div className="text-xl">
                          {language === "Türkçe" ? "Erkek" : "Male"}{" "}
                        </div>
                        <img
                          src="/svg/male.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      </div>
                      <div
                        onClick={() => genderSelect("female")}
                        className="flex items-center  py-1 rounded-md px-12 cursor-pointer hover:bg-[#68bf9d]">
                        <div className="text-xl">
                          {language === "Türkçe" ? "Dişi" : "Female"}{" "}
                        </div>
                        <img
                          src="/svg/female.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      </div>
                      <div
                        onClick={() => genderSelect("couple")}
                        className="flex items-center  py-1 rounded-md px-12 cursor-pointer hover:bg-[#68bf9d] ">
                        <div className="text-xl">
                          {language === "Türkçe" ? "çift" : "Couple"}{" "}
                        </div>
                        <img
                          src="/svg/couple.svg"
                          alt="Your SVG"
                          className="h-7 ml-3 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="gender flex justify-center items-center">
                <div className=" py-2 text-xl border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md   ">
                  <div className=" w-full flex flex-col justify-start items-center relative">
                    <div
                      onClick={() => {
                        setLanguageOpen(!languageOpen);
                        setGenderOpen(false);
                        setCountryOpen(false);
                      }}
                      className="flex items-center bg-gray-300 py-1 rounded-md px-16 cursor-pointer hover:bg-[#68bf9d] p-2 ">
                      <div className="text-xl">
                        {language === "Türkçe" ? "Dil" : "Language"}: {language}
                      </div>
                    </div>
                    <div
                      className={`${
                        languageOpen ? "opacity-100" : "opacity-0 hidden"
                      } transition-opacity duration-300 ease-in-out border border-gray-400 rounded-md m-1 p-2 drop-shadow-sm shadow-md  absolute top-8 bg-gray-50 w-[100%] z-30`}>
                      <div className="grid grid-cols-2 gap-1  w-full ">
                        {languages.map((language, index) => (
                          <div
                            key={index}
                            onClick={() => languageSelect(language)}
                            className=" hover:bg-[#68bf9d] cursor-pointer text-center p-2 rounded-md">
                            {language}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="py-2 text-xl border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md mt-2">
                      <div className="w-full flex flex-col justify-start items-center relative">
                        <div
                          onClick={() => {
                            setCountryOpen(!countryOpen);
                            setGenderOpen(false);
                            setLanguageOpen(false);
                          }}
                          className="flex items-center bg-gray-300 py-1 rounded-md px-16 cursor-pointer hover:bg-[#68bf9d] p-2">
                          <div className="text-xl ">
                            Country: {selectedCountry}
                          </div>
                        </div>
                        <div
                          className={`${
                            countryOpen ? "opacity-100" : "opacity-0 hidden"
                          } transition-opacity duration-300 ease-in-out border border-gray-400 rounded-md m-1 p-2 drop-shadow-sm shadow-md absolute top-8 bg-gray-50 w-full z-30`}>
                          <div className="grid grid-cols-2 gap-1 w-full">
                            {countries.map((country, index) => (
                              <div
                                key={index}
                                onClick={() => countrySelect(country)}
                                className="hover:bg-[#68bf9d] cursor-pointer text-center p-2 rounded-md">
                                {country}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/logout"
                      className="py-2 text-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-400 rounded-md m-1 p-2 drop-shadow-sm shadow-md   bg-white z-10 mt-4 text-[#be5055] hover:bg-[#be5055] hover:text-white font-bold">
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
