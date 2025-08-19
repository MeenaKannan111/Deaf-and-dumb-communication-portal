const API_URL = "http://localhost:5000/api";
let socket;

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
}

// Chat
if (window.location.pathname.includes("chat.html")) {
  const token = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");
  if (!token) window.location.href = "index.html";

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  // Connect Socket.IO
  socket = io("http://localhost:5000");
  socket.emit("userOnline", username);

  // Load users
  const userSelect = document.getElementById("userSelect");
  fetch(`${API_URL}/chat/users`)
    .then(res => res.json())
    .then(users => {
      users.forEach(u => {
        if (u.username !== username) {
          const option = document.createElement("option");
          option.value = u.username;
          option.textContent = u.username;
          userSelect.appendChild(option);
        }
      });
    });

  const chatForm = document.getElementById("chatForm");
  const chatBox = document.getElementById("chatBox");

  // Load previous messages
  fetch(`${API_URL}/chat/messages/${username}`)
    .then(res => res.json())
    .then(msgs => msgs.forEach(addMessage));

  // Send message
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("chatMessage").value;
    const receiver = userSelect.value;
    socket.emit("sendMessage", { sender: username, receiver, message: msg });
    document.getElementById("chatMessage").value = "";
  });

  // Receive real-time
  socket.on("receiveMessage", (data) => {
    if (data.receiver === username || data.sender === username) {
      addMessage(data);
    }
  });

  // Render message
  function addMessage(msg) {
    const div = document.createElement("div");
    div.className = msg.sender === username ? "sent" : "received";

    let ticks = "";
    if (msg.sender === username) {
      if (msg.status === "sent") ticks = "✔️";
      if (msg.status === "delivered") ticks = "✔️✔️";
      if (msg.status === "seen") ticks = "✔️✔️ (blue)";
    }

    div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.message} <span>${ticks}</span>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Mark as seen when chatBox clicked
  chatBox.addEventListener("click", () => {
    // Example: mark message with id=1 as seen (improve later to loop all)
    socket.emit("markSeen", { messageId: 1, username });
  });

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
}
