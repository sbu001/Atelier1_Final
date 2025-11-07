let shakeIntensity = 0;  // Global variable: 0 (calm) to positive values (shaking)
                         // This can be positive or negative to affect stress differently

						 // PARAMETER: Stress Level
let stress = 0;  // Current stress level (0 = calm, 100 = maximum stress)

// Parameter configuration
const STRESS_SHAKE_INCREASE = 8;    // How much stress each shake adds (reduced from 25)
const STRESS_RECOVERY = 0.15;       // How fast stress decreases naturally
const STRESS_PANIC_THRESHOLD = 70;  // When character becomes very jittery
const STRESS_WARNING_THRESHOLD = 40; // When visual effects start

// Shake intensity decay
const SHAKE_DECAY = 0.92;  // How quickly shake intensity fades (0-1, lower = faster fade)

// Smoothing for visual changes
let displayStress = 0;  // Smoothed version for visual feedback
const STRESS_VISUAL_INERTIA = 0.12;  // How smoothly visuals change

// ==============================================
// CHARACTER SYSTEM
// ==============================================
let character;
let idleAnimation;
let walkAnimation;

// Movement settings - Autonomous wandering
const BASE_WALK_SPEED = 2.5;
let currentSpeed = BASE_WALK_SPEED;
let targetX = 0;
let targetY = 0;

// Wandering AI
let wanderTimer = 0;
const WANDER_INTERVAL = 120;  // Frames between choosing new destinations (2 seconds at 60fps)

// Jitter effect for high stress
let jitterX = 0;
let jitterY = 0;

// UI Display
let showUI = true;
let sensorsActive = false;

// ==============================================
// PRELOAD - Load animations before setup
// ==============================================
function preload() {
  // Load idle animation (9 frames)
  idleAnimation = loadImage('dulcia.png');
  
  // Load walk animation (13 frames)
  walkAnimation = loadImage('dulcia.png');
}

// ==============================================
// SETUP - Runs once when page loads
// ==============================================
function setup() {
  // Create portrait canvas (9:16 aspect ratio for mobile)
  createCanvas(windowWidth, windowHeight);
  
  // Lock mobile gestures (prevent zoom/refresh)
  lockGestures();
  
  // Enable device motion sensors with tap
  enableGyroTap('Tap to enable shake detection');
  
  // Turn off physics gravity
  world.gravity.y = 0;
  
  // Create character sprite at center
  character = new Sprite(width / 2, height / 2);
  character.scale = 0.2;
  character.physics = 'kinematic';
  character.collider = 'none';
  
  // Add named animations
  character.addAni('idle', idleAnimation);
  character.addAni('walk', walkAnimation);
  character.changeAni('walk');  // Start walking
  
  // Set initial random target position for wandering
  chooseNewWanderTarget();
}

// ==============================================
// DRAW - Main game loop
// ==============================================
function draw() {
  background(162, 210, 255);  // Light blue sky background
  
  // Check if sensors are enabled
  sensorsActive = window.sensorsEnabled || false;
  
  // Update systems
  updateShakeIntensity();
  updateStressParameter();
  updateWandering();  // Add autonomous wandering
  updateCharacterColor();
  updateStressJitter();
  updateMovementSpeed();
  
  // Move character
  moveCharacterToTarget();
  
  // Visual elements
  // drawShakeIndicator();
  
  // UI overlay
//   if (showUI) {
//     drawUI();
//   }
	if(stress> 50){
		for (let i = 0; i < 10; i++) {
			fill(random(127, 176), random(85, 137), random(57, 104));
			ellipse(random(width), random(height), random(5, 30), random(5, 30));
		}	
    }
}

// ==============================================
// INPUT DETECTION: Device Shake Event
// ==============================================
// deviceShaken() is a p5.js EVENT CALLBACK (like mousePressed)
// It's automatically called when the device is shaken
function deviceShaken() {
  // Only respond if sensors are enabled
  if (window.sensorsEnabled) {
    // Increase global shake intensity variable
    shakeIntensity += 1.0;
    
    // Cap shake intensity
    shakeIntensity = constrain(shakeIntensity, 0, 10);
    
    // Add stress based on shake
    stress += STRESS_SHAKE_INCREASE;
    stress = constrain(stress, 0, 100);
    
    console.log('🔔 SHAKE DETECTED! Intensity:', shakeIntensity.toFixed(2), 'Stress:', stress.toFixed(1));

	// if(stress> 2){
	// 	for (let i = 0; i < 50; i++) {
	// 		fill(random(127, 176), random(85, 137), random(57, 104));
	// 		ellipse(random(width), random(height), random(5, 30), random(5, 30));
	// 	}	
    // }
}
}

// ==============================================
// PARAMETER UPDATE: Shake Intensity
// ==============================================
function updateShakeIntensity() {
  // Shake intensity naturally decays over time
  shakeIntensity *= SHAKE_DECAY;
  
  // Clamp to zero if very small
  if (shakeIntensity < 0.01) {
    shakeIntensity = 0;
  }
}

// ==============================================
// PARAMETER UPDATE: Stress System
// ==============================================
function updateStressParameter() {
  // Natural stress recovery (always happening)
  stress -= STRESS_RECOVERY;
  stress = constrain(stress, 0, 100);
  
  // Update smooth display value
  displayStress = lerp(displayStress, stress, STRESS_VISUAL_INERTIA);
}

// ==============================================
// CHARACTER AI: Autonomous Wandering
// ==============================================
function updateWandering() {
  // Timer to choose new destinations
  wanderTimer++;
  
  if (wanderTimer >= WANDER_INTERVAL) {
    chooseNewWanderTarget();
    wanderTimer = 0;
  }
}

function chooseNewWanderTarget() {
  // Pick random point on screen (with margins)
  targetX = random(80, width - 80);
  targetY = random(100, height - 100);
}

// ==============================================
// OUTPUT FUNCTION: Character Color
// ==============================================
function updateCharacterColor() {
  // Map stress to color: Green (calm) → Yellow → Red (stressed)
  let r = map(displayStress, 0, 100, 100, 255);
  let g = map(displayStress, 0, 100, 255, 50);
  let b = 100;
  
  character.color = color(r, g, b);
}

// ==============================================
// OUTPUT FUNCTION: Stress Jitter
// ==============================================
function updateStressJitter() {
  // High stress causes position jitter
  // Combine stress and current shake intensity for maximum effect
  let jitterAmount = 0;
  
  if (stress >= STRESS_PANIC_THRESHOLD) {
    // Panic level - extreme jitter
    jitterAmount = map(stress, STRESS_PANIC_THRESHOLD, 100, 3, 8);
    // Add extra jitter based on current shake intensity
    jitterAmount += shakeIntensity * 0.5;
  } else if (stress >= STRESS_WARNING_THRESHOLD) {
    // Warning level - mild jitter
    jitterAmount = map(stress, STRESS_WARNING_THRESHOLD, STRESS_PANIC_THRESHOLD, 0, 3);
    jitterAmount += shakeIntensity * 0.3;
  }
  
  jitterX = random(-jitterAmount, jitterAmount);
  jitterY = random(-jitterAmount, jitterAmount);
}

// ==============================================
// OUTPUT FUNCTION: Movement Speed
// ==============================================
function updateMovementSpeed() {
  // Stress affects movement speed
  if (stress >= STRESS_PANIC_THRESHOLD) {
    // Panicked - erratic fast movement
    currentSpeed = BASE_WALK_SPEED * 1.8;
  } else if (stress >= STRESS_WARNING_THRESHOLD) {
    // Anxious - slightly faster
    currentSpeed = BASE_WALK_SPEED * 1.2;
  } else {
    // Calm - normal speed
    currentSpeed = BASE_WALK_SPEED;
  }
}

// ==============================================
// OUTPUT FUNCTION: Character Movement
// ==============================================
function moveCharacterToTarget() {
  // Calculate distance to target
  let distance = dist(character.x, character.y, targetX, targetY);
  
  // Always keep walking (autonomous wandering)
  if (distance > 10) {
    // Use p5play's moveTo method for smooth movement
    character.moveTo(targetX, targetY, currentSpeed);
    
    // Apply stress jitter by offsetting position slightly
    if (jitterX !== 0 || jitterY !== 0) {
      character.x += jitterX;
      character.y += jitterY;
    }
    
    // Always use walk animation when moving
    if (character.ani.name !== 'walk') {
      character.changeAni('walk');
    }
  } else {
    // Reached target - pick a new one immediately to keep moving
    chooseNewWanderTarget();
  }
}

// ==============================================
// INPUT HANDLING: Touch/Click
// ==============================================
// No mouse/touch input needed - character wanders autonomously
// Only shake detection affects the character

function mousePressed() {
  return false;  // Prevent default
}

function touchStarted() {
  return false;  // Prevent default
}

// Toggle UI with keyboard
function keyPressed() {
  if (key === ' ') {
    showUI = !showUI;
  }
}