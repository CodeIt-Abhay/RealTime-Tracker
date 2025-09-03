const socket = io();
const markers = {};
let map;

// Ask for username
const username = prompt("Enter your name:") || "Anonymous";

// Share location
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude, username });
    },
    (error) => console.error("Error obtaining location", error),
    { enableHighAccuracy: true }
  );
}

// Initialize map
document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([20.5937, 78.9629], 5); // India as default center

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
});

// Receive location updates
socket.on("receive-location", ({ id, latitude, longitude, username, color }) => {
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background:${color};
                      width:20px;height:20px;
                      border-radius:50%;
                      border:2px solid white;"></div>`
    });

    markers[id] = L.marker([latitude, longitude], { icon }).addTo(map);
    markers[id].bindPopup(`<b>${username}</b>`).openPopup();
  }
});

// Remove disconnected user markers
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

// Chat functionality
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", () => {
  const msg = messageInput.value;
  if (msg.trim()) {
    socket.emit("chat-message", { username, message: msg });
    messageInput.value = "";
  }
});

socket.on("chat-message", ({ username, message }) => {
  const msgEl = document.createElement("div");
  msgEl.innerHTML = `<b>${username}:</b> ${message}`;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
