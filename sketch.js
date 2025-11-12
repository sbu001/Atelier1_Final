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
let dulciaAnimation;

let idleAnimationVisible;
let walkAnimationVisible;
let dulciaAnimationVisible;

// Movement settings - Autonomous wandering
const BASE_WALK_SPEED = 2.5;
let currentSpeed = BASE_WALK_SPEED;
let targetX = 0;
let targetY = 0;

// Maximum vertical movement allowed when shaking (pixels)
const MAX_VERTICAL_MOVE = 30;

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
  idleAnimation = loadImage('grinder.png');
  
  // Load walk animation (13 frames)
  walkAnimation = loadImage('grinder.png');

  dulciaAnimation = loadImage("dulcia.png");
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
  enableGyroTap('Tap to start');
  
  // Turn off physics gravity
  world.gravity.y = 0;
  
  // Create character sprite at center
  character = new Sprite(width / 2, height / 2);
  character.scale = 0.3;
  character.physics = 'kinematic';
  character.collider = 'none';
  
  // Add named animations
  character.addAni('idle', idleAnimation);
  character.addAni('walk', walkAnimation);
  character.changeAni('walk');  // Start walking
  // initialize visibility flags (true = draw the corresponding image/animation)
  idleAnimationVisible = false;
  walkAnimationVisible = true;
  dulciaAnimationVisible = false;
  
  // Set initial random target position for wandering
  // Do not pick an initial wander target - movement is triggered by shaking
  targetX = character.x;
  targetY = character.y;
}

// ==============================================
// DRAW - Main game loop
// ==============================================
function draw() {
  background(162, 210, 255);  // Light blue sky background
  // Ensure sprite visibility matches the visible flags so it completely disappears
  if (typeof character !== 'undefined' && character != null) {
    if (walkAnimationVisible === true || idleAnimationVisible === true) {
      character.visible = true;
    } else {
      character.visible = false;
    }
  }

  if (idleAnimationVisible === true) {
    image(idleAnimation);
  }
  if (walkAnimationVisible === true) {
    image(walkAnimation);
  }
  if (dulciaAnimationVisible === true) {
    image(dulciaAnimation, width/2-50, height/2-100, 100, 250);
  }
  // Check if sensors are enabled
  sensorsActive = window.sensorsEnabled || false;
  
  // Update systems
  updateShakeIntensity();
  updateStressParameter();
  updateStressJitter();
  updateMovementSpeed();
  
  moveCharacterToTarget();
  drawStressBar();
	if(stress>= 99){
		for (let i = 0; i < 10; i++) {
			fill(random(127, 176), random(85, 137), random(57, 104));
			ellipse(random(width), random(height), random(5, 30), random(5, 30));
		}	
  }
  if(stress>= 99){
    dulciaAnimationVisible = true;
    walkAnimationVisible = false;
    idleAnimationVisible = false;
  }
}
function deviceShaken() {
  if (window.sensorsEnabled) {
    shakeIntensity += 0.1;
    shakeIntensity = constrain(shakeIntensity, 0, 10);
    stress += STRESS_SHAKE_INCREASE;
    stress = constrain(stress, 0, 100);
    // Trigger movement: pick a new X target relative to current position
    if (typeof character !== 'undefined' && character != null) {
      // Move horizontally between -200 and +200 pixels from current X (clamped to screen margins)
      let moveDistance = random(-200, 200);
      targetX = constrain(character.x + moveDistance, 80, width - 80);
      // Allow a small vertical shift on shake, limited by MAX_VERTICAL_MOVE
      let vMove = random(-MAX_VERTICAL_MOVE, MAX_VERTICAL_MOVE);
      targetY = constrain(character.y + vMove, 80, height - 100);
    }
}
}

// PARAMETER UPDATE: Shake Intensity
function updateShakeIntensity() {
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
  stress = constrain(stress, 0, 200);
  
  // Update smooth display value
  displayStress = lerp(displayStress, stress, STRESS_VISUAL_INERTIA);
}
function updateWandering() {
  wanderTimer++;  
  if (wanderTimer >= WANDER_INTERVAL) {
    chooseNewWanderTarget();
    wanderTimer = 0;
  }
}

function chooseNewWanderTarget() {
  // THIS FUNCTION IS NOT USED ANYMORE (movement is shake-triggered only)
  // Kept for reference but targetX/Y should only change on shake
  // If you want to re-enable wandering, modify deviceShaken() instead

  targetX = random(80, width - 80); 
    if (typeof character !== 'undefined' && character != null) {
      targetY = character.y;  // Keep Y at current position (was forcing 500-700)
    }
  
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
    jitterAmount = map(stress, STRESS_PANIC_THRESHOLD, 200, 3, 8);
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
  // Calculate horizontal and vertical distance to target
  let dx = Math.abs(character.x - targetX);
  let dy = Math.abs(character.y - targetY);

  // Move while either axis is sufficiently far from the target.
  // We use slightly smaller threshold for vertical since vertical moves are small.
  const THRESHOLD_X = 10;
  const THRESHOLD_Y = 6;

  if (dx > THRESHOLD_X || dy > THRESHOLD_Y) {
    // Move toward (targetX, targetY). This allows small vertical shifts on shake.
    character.moveTo(targetX, targetY, currentSpeed);

    // Apply stress jitter: full on X, reduced on Y to avoid large vertical motion
    if (jitterX !== 0) {
      character.x += jitterX;
    }
    if (jitterY !== 0) {
      character.y += jitterY * 0.35; // scale down vertical jitter
    }
    
    // Always use walk animation when moving
    if (character.ani.name !== 'walk') {
      character.changeAni('walk');
    }
  } else {
    // Reached target - stop moving and wait for next shake
    targetX = character.x; // keep target locked to current position
    targetY = character.y;
    // switch to idle animation when not moving
    if (character.ani.name !== 'idle') {
      character.changeAni('idle');
    }
  }
}


function mousePressed() {
  return false;  // Prevent default
}

function touchStarted() {
  return false;  // Prevent default
}


// ==============================================
// VISUAL FEEDBACK: Stress Bar
// ==============================================
function drawStressBar() {
  // Background bar
  push();
  noStroke();
  fill(50, 50, 60);
  rect(20, 20, width - 40, 30, 5);
  
  // Stress level bar
  let barWidth = map(displayStress, 0, 100, 0, width - 40);
  let r = map(displayStress, 0, 100, 100, 255);
  let g = map(displayStress, 0, 100, 255, 50);
  fill(r, g, 100);
  rect(20, 20, barWidth, 30, 5);
  
  // Text label
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(`GRINDING: ${floor(stress)}`, width / 2, 35);
  pop();
}
