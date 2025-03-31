import * as THREE from 'three';
import { io } from 'socket.io-client';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const boxSize = 1;
const boxGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(box);

// Create a second box
const secondBoxSize = 1;
const secondBoxGeometry = new THREE.PlaneGeometry(secondBoxSize, secondBoxSize);
const secondBoxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const secondBox = new THREE.Mesh(secondBoxGeometry, secondBoxMaterial);
scene.add(secondBox);

// Position the second box
secondBox.position.set(2, 0, 0);

// Track pressed keys
const keysPressed = {};

window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
  keysPressed[event.key] = false;
});

const socket = io();

// Emit move event when box position changes
function updateBoxPosition() {
  const step = 0.05; // Adjusted for smoother movement
  let moved = false;
  if (keysPressed['ArrowUp']) { box.position.y += step; moved = true; }
  if (keysPressed['ArrowDown']) { box.position.y -= step; moved = true; }
  if (keysPressed['ArrowLeft']) { box.position.x -= step; moved = true; }
  if (keysPressed['ArrowRight']) { box.position.x += step; moved = true; }
  if (moved) {
    socket.emit('move', { x: box.position.x, y: box.position.y });
  }
}

// Listen for move events from other players
socket.on('move', (data) => {
  // Update the position of the second box based on data from other players
  secondBox.position.set(data.x, data.y);
});

// Adjust camera for 2D view
camera.position.z = 5;
// Ensure the box is centered
box.position.set(0, 0, 0);

function checkCollision() {
  const distance = box.position.distanceTo(secondBox.position);
  const collisionDistance = (boxSize + secondBoxSize) / 2;
  if (distance < collisionDistance) {
    console.log('Collision detected!');
    // Calculate overlap
    const overlap = collisionDistance - distance;
    // Adjust position to prevent overlap
    const direction = box.position.clone().sub(secondBox.position).normalize();
    box.position.add(direction.multiplyScalar(overlap));
    // Change color to indicate collision
    box.material.color.set(0x0000ff);
  } else {
    // Reset color if not colliding
    box.material.color.set(0x00ff00);
  }
}

function animate() {
  updateBoxPosition();
  checkCollision();
  renderer.render(scene, camera);
}