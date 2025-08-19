// Import React hooks, map components, and the socket client library
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';

// Import necessary CSS and Leaflet's core library
import 'leaflet/dist/leaflet.css';
import './App.css'; 
import L from 'leaflet';

// Import marker icon images from the leaflet package
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// We create a custom icon object using the imported images
const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


function App() {
  // useMemo creates the socket connection once and prevents it from being recreated on every render
  const socket = useMemo(() => io("http://localhost:3000"), []);
  
  // useState hooks to manage the component's state
  const [position, setPosition] = useState([28.6139, 77.2090]); // User's own position
  const [locations, setLocations] = useState({});               // Locations of all connected users

  // useEffect handles side effects. This code runs only once when the component mounts.
  useEffect(() => {
    // A. Get the user's location from their browser
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]); // Update our own position in the state
          socket.emit("send-location", { latitude, longitude }); // Send our location to the server
        },
        (error) => { console.error("Geolocation error:", error); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    // B. Set up listeners for events coming from the server
    socket.on("connect", () => { console.log("✅ Connected to server with ID:", socket.id); });

    socket.on("receive-location", (data) => {
      // When a location is received, update the 'locations' state
      setLocations((prev) => ({ ...prev, [data.id]: [data.latitude, data.longitude] }));
    });

    socket.on("user-disconnected", (id) => {
      // When a user disconnects, remove their data from the 'locations' state
      setLocations((prev) => {
        const newLocations = { ...prev };
        delete newLocations[id];
        return newLocations;
      });
    });

    // C. Cleanup function: This runs when the component is unmounted to prevent memory leaks
    return () => { socket.disconnect(); };
  }, [socket]); // The dependency array ensures this effect runs only when the socket object changes (which it never does)

  return (
    <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="map-container">
      {/* The base map layer from OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Map over the 'locations' object to render a Marker for each user */}
      {Object.entries(locations).map(([id, coords]) => (
        <Marker key={id} position={coords} icon={customIcon}>
          <Popup>
            User: {id.substring(0, 6)}...
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default App;