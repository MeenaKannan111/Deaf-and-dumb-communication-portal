const host = window.location.hostname;
const API_URL = window.API_URL || "http://localhost:5000/api";

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "index.html";
  });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("username", data.username);
      window.location.href = "chat.html";
    } else {
      alert(data.message);
    }
  });

  // Toggle password visibility
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("loginPassword");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      console.log("Eye icon clicked");
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "👁️" : "🙈";
      console.log("Password type changed to:", type);
    });
  }
}

// Chat
if (window.location.pathname.includes("chat.html")) {
  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");
  if (!token) window.location.href = "index.html";

  // Display current user in header
  const currentUserSpan = document.getElementById("currentUser");
  if (currentUserSpan) currentUserSpan.textContent = username;

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  // Connect Socket.IO
  const socket = io(window.SOCKET_URL || "http://localhost:5000");
  socket.emit("userOnline", username);

  const selectedUserDisplay = document.getElementById("selectedUserDisplay");
  const usersList = document.getElementById("usersList");
  const chatForm = document.getElementById("chatForm");
  const chatBox = document.getElementById("chatBox");
  const chatMessage = document.getElementById("chatMessage");
  const startSpeechBtn = document.getElementById("startSpeechBtn");
  const stopSpeechBtn = document.getElementById("stopSpeechBtn");
  const ttsBtn = document.getElementById("ttsBtn");
  const aslBtn = document.getElementById("aslBtn");

  let selectedUser = null;
  let recognition = null;
  let readMessages = new Set(); // Track read messages for TTS
  let messageCounter = 0; // Sequence counter for messages
  let lastSentSeq = -1; // Sequence of last sent message for ASL filtering
  let textMode = true; // true for text mode, false for ASL mode

  // Load users in sidebar
  fetch(`${API_URL}/chat/users`)
    .then(res => res.json())
    .then(users => {
      users.forEach(u => {
        if (u.username !== username) {
          const li = document.createElement("li");
          li.textContent = u.username;
          li.addEventListener("click", () => selectUser(u.username));
          usersList.appendChild(li);
        }
      });
    });

  // Select user for conversation
  function selectUser(user) {
    selectedUser = user;
    selectedUserDisplay.textContent = `Chatting with ${user}`;
    chatForm.style.display = 'block';
    chatBox.style.display = 'block';
    readMessages.clear(); // Clear read messages when switching conversations
    messageCounter = 0; // Reset message counter
    lastSentSeq = -1; // Reset last sent sequence
    loadMessages();
  }

  // Load messages for selected conversation
  function loadMessages() {
    if (!selectedUser) return;
    fetch(`${API_URL}/chat/messages?sender=${username}&receiver=${selectedUser}`)
      .then(res => res.json())
      .then(msgs => {
        chatBox.innerHTML = "";
        msgs.forEach(msg => addMessage(msg, true)); // true = from history, mark as read
      });
  }

  // Send message
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = chatMessage.value.trim();
    if (!msg || !selectedUser) return;
    lastSentSeq = messageCounter; // Update last sent sequence
    socket.emit("sendMessage", { sender: username, receiver: selectedUser, message: msg });
    chatMessage.value = "";
  });

  // Receive real-time
  socket.on("receiveMessage", (data) => {
    if ((data.sender === username && data.receiver === selectedUser) ||
        (data.sender === selectedUser && data.receiver === username)) {
      addMessage(data, false); // false = new message, not from history
    }
  });

  // Render message
  function addMessage(msg, fromHistory = false) {
    const div = document.createElement("div");
    div.className = msg.sender === username ? "sent" : "received";

    let ticks = "";
    if (msg.sender === username) {
      if (msg.status === "sent") ticks = "✔️";
      if (msg.status === "delivered") ticks = "✔️✔️";
      if (msg.status === "seen") ticks = "✔️✔️";
    }

    const time = new Date(msg.created_at).toLocaleTimeString();

    let messageContent;
    if (textMode) {
      messageContent = msg.message;
    } else {
      // ASL mode: display images for each letter, try .jpg first then .jfif
      messageContent = '';
      msg.message.toUpperCase().split('').forEach(char => {
        if (char >= 'A' && char <= 'Z') {
          messageContent += `<img src="asl_images/${char}.jpg" alt="${char}" style="width: 30px; height: 30px; margin: 1px; vertical-align: middle;" onerror="this.src='asl_images/${char}.jfif'">`;
        }
      });
    }

    div.innerHTML = `${messageContent} <span>${ticks}</span><br><small>${time}</small>`;
    div.dataset.msgId = msg.id; // Store message ID for TTS tracking
    div.dataset.seq = messageCounter++; // Assign sequence number
    div.dataset.message = msg.message; // Store clean message text

    // Add speaker icon for received messages
    if (msg.sender !== username) {
      const speakerIcon = document.createElement("span");
      speakerIcon.innerHTML = "🔊";
      speakerIcon.style.cursor = "pointer";
      speakerIcon.style.marginLeft = "5px";
      speakerIcon.title = "Read message aloud";
      speakerIcon.addEventListener("click", () => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(msg.message);
          window.speechSynthesis.speak(utterance);
        } else {
          alert("Text-to-speech not supported in this browser.");
        }
      });
      div.appendChild(speakerIcon);
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    // If from history, mark as read immediately
    if (fromHistory && msg.sender !== username) {
      readMessages.add(msg.id);
    }

    // For received messages, auto-play TTS if new
    if (msg.sender !== username) {
      if (!fromHistory && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(msg.message);
        window.speechSynthesis.speak(utterance);
        readMessages.add(msg.id);
      }
    }
  }

  // Speech-to-Text
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatMessage.value += transcript;
    };

    recognition.onend = () => {
      stopSpeechBtn.disabled = true;
      startSpeechBtn.disabled = false;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      stopSpeechBtn.disabled = true;
      startSpeechBtn.disabled = false;
    };

    startSpeechBtn.addEventListener("click", () => {
      try {
        recognition.start();
        startSpeechBtn.disabled = true;
        stopSpeechBtn.disabled = false;
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        startSpeechBtn.disabled = false;
        stopSpeechBtn.disabled = true;
      }
    });

    stopSpeechBtn.addEventListener("click", () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      stopSpeechBtn.disabled = true;
      startSpeechBtn.disabled = false;
    });
  } else {
    startSpeechBtn.disabled = true;
    stopSpeechBtn.disabled = true;
    alert("Speech recognition not supported in this browser.");
  }

  // Text-to-Speech
  if (ttsBtn) {
    ttsBtn.addEventListener("click", () => {
      const messages = chatBox.querySelectorAll('.received');
      if (messages.length === 0) return;
      if ('speechSynthesis' in window) {
        // Filter messages to only those not read yet
        const unreadMessages = Array.from(messages).filter(msgDiv => {
          const msgId = msgDiv.dataset.msgId;
          return msgId && !readMessages.has(msgId);
        });
        if (unreadMessages.length === 0) return;

        // Function to speak messages sequentially
        function speakMessages(index) {
          if (index >= unreadMessages.length) return;
          const msgDiv = unreadMessages[index];
          const msgId = msgDiv.dataset.msgId;
          const text = msgDiv.textContent;
          readMessages.add(msgId);
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => {
            speakMessages(index + 1);
          };
          window.speechSynthesis.speak(utterance);
        }

        speakMessages(0);
      } else {
        alert("Text-to-speech not supported in this browser.");
      }
    });
  }

  // ASL Button
  if (aslBtn) {
    aslBtn.addEventListener("click", () => {
      textMode = !textMode; // Toggle mode
      // Reload all messages to re-render in new mode
      loadMessages();
    });
  }

  // Mark as seen
  chatBox.addEventListener("click", () => {
    // Mark all unseen messages as seen
    const messages = chatBox.querySelectorAll('.received');
    messages.forEach((msgDiv, index) => {
      // Assume message id is available, for now skip
    });
  });
}

// Users Page
if (window.location.pathname.includes("users.html")) {
  fetch(`${API_URL}/chat/users`)
    .then(res => res.json())
    .then(users => {
      const list = document.getElementById("usersList");
      if (users.length === 0) {
        list.innerHTML = "<li>No users found</li>";
      } else {
        users.forEach(u => {
          const li = document.createElement("li");
          li.textContent = u.username;
          list.appendChild(li);
        });
      }
    })
    .catch(err => console.error("Error loading users:", err));
}
