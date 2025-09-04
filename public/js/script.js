const socket = io();
const markers = {};
let bounds = L.latLngBounds([]);
let username = null;

// Colors
const colors = ["red", "blue", "green", "orange", "purple", "darkcyan"];
const userColors = {};
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Custom marker
function createUserIcon(color, username) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 0; 
          height: 0; 
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 20px solid ${color};
          transform: rotate(180deg);
        "></div>
        <div style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          margin-top: -10px;
          z-index: 10;
        "></div>
        <div style="
          font-size: 11px;
          font-weight: bold;
          color: black;
          margin-top: 2px;
          text-align: center;
        ">
          ${username}
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Map
  const map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Username popup
  const usernamePopup = document.getElementById("username-popup");
  const usernameForm = document.getElementById("username-form");
  const usernameInput = document.getElementById("username-input");

  usernameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim();
    if (username) {
      socket.emit("set-username", username);
      usernamePopup.style.display = "none";
    }
  });

  // Location
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (username) {
          socket.emit("send-location", { latitude, longitude });
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  }

  // Receive locations
  socket.on("receive-location", (data) => {
    const { id, username, latitude, longitude } = data;

    if (!userColors[id]) {
      userColors[id] = getRandomColor();
    }

    if (!markers[id]) {
      markers[id] = L.marker([latitude, longitude], {
        icon: createUserIcon(userColors[id], username)
      }).addTo(map);
    } else {
      markers[id].setLatLng([latitude, longitude]);
    }

    bounds.extend([latitude, longitude]);
    map.fitBounds(bounds, { padding: [50, 50] });
  });

  // Remove disconnected
  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });

  // Chat
  const chatForm = document.getElementById("chat-form");
  const chatMessages = document.getElementById("chat-messages");

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (msg && username) {
      socket.emit("chat-message", msg);
      input.value = "";
    }
  });

  socket.on("chat-message", (data) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
});
