import { GridManager } from './GridManager.js';
import { EnemyManager } from './EnemyManager.js';
import { TowerManager } from './TowerManager.js';
import { GameManager } from './GameManager.js';
import { getTowerTypes } from './TowerTypes.js';

// Global variables to track game instances
let gridManager, enemyManager, towerManager, gameManager, scene;

// Game settings
const GRID_SIZE = 15; // Grid is 15x15
const CELL_SIZE = 2; // Each cell is 2x2 units
const FIRST_WAVE_DELAY = 15000; // 15 seconds before first wave
const NEXT_WAVE_DELAY = 10000; // 10 seconds between waves
const MAX_WAVES = 30; // Maximum number of waves

// Track selected faction
let selectedFaction = null;
let waveTimer = null;
let isFirstWave = true; // Track if it's the first wave
let currentWave = 0; // Track current wave number

// Initialize the faction selection screen
function initFactionSelection() {
  const factionCards = document.querySelectorAll('.faction-card');
  const startGameBtn = document.getElementById('start-game-btn');
  
  factionCards.forEach(card => {
    card.addEventListener('click', () => {
      selectedFaction = card.dataset.faction;
      
      // Add selected class to the card
      factionCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      // Enable the start game button
      startGameBtn.classList.add('active');
    });
  });
  
  // Add event listener to the start game button
  startGameBtn.addEventListener('click', () => {
    if (!selectedFaction) return; // Don't proceed if no faction is selected
    
    // Add animation for transition
    document.getElementById('faction-selection').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('faction-selection').style.display = 'none';
      document.getElementById('game-container').style.display = 'block';
      
      // Fade in game container
      setTimeout(() => {
        document.getElementById('game-container').style.opacity = '1';
      }, 50);
      
      // Initialize the game after faction selection
      initGame(selectedFaction);
    }, 1000);
  });
}

// Initialize the main game
function initGame(faction) {
  console.log(`Starting game with faction: ${faction}`);
  
  // Reset game state variables
  isFirstWave = true;
  currentWave = 0;
  if (waveTimer) {
    clearInterval(waveTimer);
    waveTimer = null;
  }
  
  // Get faction-specific tower types
  const towerTypes = getTowerTypes(faction);
  
  // Initialize Three.js
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background
  
  // Create a static camera with field of view calculated to show the entire board
  const calculateOptimalCamera = () => {
    // Calculate the size of the board
    const boardSize = GRID_SIZE * CELL_SIZE;
    
    // Calculate required camera height based on vertical space
    const aspect = window.innerWidth / window.innerHeight;
    const vFov = 45; // degrees
    const vFovRad = vFov * (Math.PI / 180);
    
    // Distance needed to fit the board in view
    const distanceToFitVertical = (boardSize / 2) / Math.tan(vFovRad / 2);
    
    // Add some padding
    return distanceToFitVertical * 1.2;
  };
  
  // Create camera - positioned directly above the board
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const cameraHeight = calculateOptimalCamera();
  camera.position.set(0, cameraHeight, 0);
  camera.lookAt(0, 0, 0);
  camera.rotation.z = 0; // Keep the camera oriented with "up" as "up"
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.getElementById('game-container').appendChild(renderer.domElement);
  
  // Add light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 20, 0);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Apply faction-specific styling and effects
  applyFactionTheme(faction, scene);
  
  // Initialize grid manager
  gridManager = new GridManager(scene, GRID_SIZE, CELL_SIZE);
  
  // Create enemy manager
  enemyManager = new EnemyManager(scene, gridManager);
  
  // Create tower manager
  towerManager = new TowerManager(scene, gridManager, towerTypes);
  
  // Create game manager and pass other managers
  gameManager = new GameManager(gridManager, enemyManager, towerManager);
  
  // Initialize path visualization
  const initialPath = gridManager.getPath();
  if (initialPath) {
    towerManager.updatePathVisualization(initialPath);
  }
  
  // Setup tower selection panel with faction-specific towers
  setupTowerSelectionPanel(towerManager, faction);
  
  // Raycaster for mouse interaction
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Recalculate camera position on resize
    const newCameraHeight = calculateOptimalCamera();
    camera.position.y = newCameraHeight;
    camera.updateProjectionMatrix();
  });
  
  // Handle mouse clicks for building towers
  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gridManager.getCellObjects());
    
    if (intersects.length > 0) {
      const cell = intersects[0].object.userData.cell;
      gameManager.handleCellClick(cell);
    }
  });
  
  // Handle mouse movement for cell highlighting
  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gridManager.getCellObjects());
    
    if (intersects.length > 0) {
      const cell = intersects[0].object.userData.cell;
      gridManager.highlightCell(cell);
    } else {
      // Reset highlighted cell when not hovering over a cell
      gridManager.resetHighlightedCell();
    }
  });
  
  // Add event listeners for UI buttons
  document.getElementById('toggle-range').addEventListener('click', () => {
    const rangeButton = document.getElementById('toggle-range');
    const isShowing = rangeButton.classList.contains('btn-active');
    
    // Toggle range indicators
    if (isShowing) {
      rangeButton.classList.remove('btn-active');
      rangeButton.textContent = 'Show Range';
      towerManager.toggleRangeIndicators(false);
    } else {
      rangeButton.classList.add('btn-active');
      rangeButton.textContent = 'Hide Range';
      towerManager.toggleRangeIndicators(true);
    }
  });
  
  document.getElementById('toggle-path').addEventListener('click', () => {
    const pathButton = document.getElementById('toggle-path');
    const isShowing = pathButton.classList.contains('btn-active');
    
    // Toggle path visualization
    if (isShowing) {
      pathButton.classList.remove('btn-active');
      pathButton.textContent = 'Show Path';
      towerManager.pathVisualization.visible = false;
    } else {
      pathButton.classList.add('btn-active');
      pathButton.textContent = 'Hide Path';
      towerManager.pathVisualization.visible = true;
      
      // Update path visualization in case it changed
      const currentPath = gridManager.getPath();
      if (currentPath) {
        towerManager.updatePathVisualization(currentPath);
      }
    }
  });
  
  // Hide the start wave button as we're using notification area instead
  const startWaveBtn = document.getElementById('start-wave');
  if (startWaveBtn) {
    startWaveBtn.style.display = 'none';
  }
  
  // Setup automatic wave spawning for the first wave
  setupAutoWaveSpawning(gameManager);
  
  // Setup wave completion handler for subsequent waves
  setupWaveCompletionHandler(gameManager);
  
  // Make waveTimer accessible to GameManager
  window.waveTimer = waveTimer;
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update game state if not paused
    gameManager.update();
    
    renderer.render(scene, camera);
  }
  
  animate();
}

// Setup automatic wave spawning
function setupAutoWaveSpawning(gameManager) {
  const notificationArea = document.getElementById('notification-area');
  
  // For first wave, use the initial delay
  if (isFirstWave) {
    let countdown = Math.floor(FIRST_WAVE_DELAY / 1000);
    
    // Update the notification area to show countdown
    const updateCountdown = () => {
      notificationArea.textContent = `First wave starting in: ${countdown}s`;
    };
    
    // Call immediately to set initial text
    updateCountdown();
    
    // Start the countdown
    const countdownInterval = setInterval(() => {
      countdown--;
      updateCountdown();
      
      if (countdown <= 0) {
        clearInterval(countdownInterval); // Clear this interval
        
        // Start first wave
        currentWave = 1;
        notificationArea.textContent = `Wave ${currentWave}/${MAX_WAVES} incoming!`;
        gameManager.startWave(currentWave, MAX_WAVES);
        
        // No longer first wave
        isFirstWave = false;
      }
    }, 1000);
    
    // Store the timer reference so it can be cleared if needed
    waveTimer = countdownInterval;
    window.waveTimer = waveTimer;
  }
}

// Setup wave completion handler
function setupWaveCompletionHandler(gameManager) {
  // Create a handler function and store it globally so it can be removed later
  window.onWaveCompletedHandler = (event) => {
    console.log('Wave completed event received');
    if (currentWave >= MAX_WAVES) {
      // Final wave completed
      const notificationArea = document.getElementById('notification-area');
      notificationArea.textContent = "Final wave completed! You win!";
      return;
    }
    
    // Set a timer for the next wave
    startNextWaveCountdown(gameManager, NEXT_WAVE_DELAY);
  };

  // Listen for wave completion event
  document.addEventListener('waveCompleted', window.onWaveCompletedHandler);
}

// Function to start countdown for next wave
function startNextWaveCountdown(gameManager, delay) {
  const notificationArea = document.getElementById('notification-area');
  let countdown = Math.floor(delay / 1000);
  
  // Update the notification to show the countdown
  const updateCountdown = () => {
    notificationArea.textContent = `Wave ${currentWave+1}/${MAX_WAVES} - Next wave in: ${countdown}s`;
  };
  
  // Call immediately to set initial text
  updateCountdown();
  
  // Start the countdown
  const countdownInterval = setInterval(() => {
    countdown--;
    updateCountdown();
    
    if (countdown <= 0) {
      clearInterval(countdownInterval); // Clear this interval
      
      // Start the next wave
      currentWave++;
      notificationArea.textContent = `Wave ${currentWave}/${MAX_WAVES} incoming!`;
      gameManager.startWave(currentWave, MAX_WAVES);
    }
  }, 1000);
  
  // Store the timer reference
  waveTimer = countdownInterval;
  window.waveTimer = waveTimer;
}

// Apply faction-specific theme to the game
function applyFactionTheme(faction, scene) {
  // Customize scene based on faction
  switch(faction) {
    case 'tech':
      scene.background = new THREE.Color(0x001a33); // Dark blue tech background
      document.body.style.setProperty('--faction-color', '#00c6ff');
      if (document.getElementById('tower-stats')) {
        document.getElementById('tower-stats').style.borderColor = '#00c6ff';
      }
      if (document.getElementById('tower-name')) {
        document.getElementById('tower-name').style.color = '#00c6ff';
      }
      break;
      
    case 'energy':
      scene.background = new THREE.Color(0x1a0d00); // Dark orange energy background
      document.body.style.setProperty('--faction-color', '#f5d020');
      if (document.getElementById('tower-stats')) {
        document.getElementById('tower-stats').style.borderColor = '#f5d020';
      }
      if (document.getElementById('tower-name')) {
        document.getElementById('tower-name').style.color = '#f5d020';
      }
      break;
      
    case 'elemental':
      scene.background = new THREE.Color(0x071a00); // Dark green nature background
      document.body.style.setProperty('--faction-color', '#a8e063');
      if (document.getElementById('tower-stats')) {
        document.getElementById('tower-stats').style.borderColor = '#a8e063';
      }
      if (document.getElementById('tower-name')) {
        document.getElementById('tower-name').style.color = '#a8e063';
      }
      break;
  }
}

// Setup tower selection panel
function setupTowerSelectionPanel(towerManager, faction) {
  const panel = document.getElementById('tower-selection-panel');
  const statsPanel = document.getElementById('tower-stats');
  
  // Clear any existing content
  panel.innerHTML = '';
  
  // Get faction-specific tower types
  const towerTypes = towerManager.towerTypes;
  
  // Add each tower option
  towerTypes.forEach(tower => {
    const towerOption = document.createElement('div');
    towerOption.classList.add('tower-option');
    towerOption.dataset.towerId = tower.id;
    
    // Set background color to match tower color
    towerOption.style.backgroundColor = `#${new THREE.Color(tower.color).getHexString()}`;
    
    // Add tower icon wrapper
    const towerIconWrapper = document.createElement('div');
    towerIconWrapper.classList.add('tower-icon-wrapper');
    
    // Use SVG if available, otherwise use emoji icon
    if (tower.svgIcon) {
      // Clean the SVG data and insert it
      const svgData = tower.svgIcon.replace(/currentColor/g, 'white');
      towerIconWrapper.innerHTML = svgData;
    } else {
      // Fallback to emoji
      const towerIcon = document.createElement('div');
      towerIcon.textContent = tower.icon;
      towerIcon.style.fontSize = '24px';
      towerIconWrapper.appendChild(towerIcon);
    }
    
    towerOption.appendChild(towerIconWrapper);
    
    // Add cost display
    const costDisplay = document.createElement('div');
    costDisplay.classList.add('tower-cost');
    costDisplay.textContent = `$${tower.cost}`;
    towerOption.appendChild(costDisplay);
    
    // Set the first tower as selected by default
    if (tower.id === 1) {
      towerOption.classList.add('selected');
    }
    
    // Add click event to select tower
    towerOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.tower-option').forEach(opt => 
        opt.classList.remove('selected'));
      
      // Add selected class to this option
      towerOption.classList.add('selected');
      
      // Set the selected tower type in the tower manager
      towerManager.setSelectedTowerType(tower.id);
      
      // Update stats display
      updateTowerStats(tower, faction);
    });
    
    // Add hover event to display stats
    towerOption.addEventListener('mouseenter', () => {
      updateTowerStats(tower, faction);
      statsPanel.style.display = 'block';
    });
    
    // Add to panel
    panel.appendChild(towerOption);
  });
  
  // Update stats for the default selected tower
  const defaultTower = towerTypes.find(t => t.id === 1);
  if (defaultTower) {
    updateTowerStats(defaultTower, faction);
  }
  
  // Show stats panel on hover over any tower option
  panel.addEventListener('mouseenter', () => {
    statsPanel.style.display = 'block';
  });
  
  // Hide stats panel when mouse leaves the panel area
  panel.addEventListener('mouseleave', () => {
    statsPanel.style.display = 'none';
  });
}

// Update tower stats display
function updateTowerStats(tower, faction) {
  const statsPanel = document.getElementById('tower-stats');
  if (!statsPanel) return;
  
  // Get faction color for styling
  let factionColor;
  switch(faction) {
    case 'tech': factionColor = '#00c6ff'; break;
    case 'energy': factionColor = '#f5d020'; break;
    case 'elemental': factionColor = '#a8e063'; break;
    default: factionColor = '#00c6ff';
  }
  
  // Update content
  statsPanel.innerHTML = `
    <h3 id="tower-name" style="color:${factionColor}">${tower.name}</h3>
    <div class="stat-row">
      <span class="stat-label">Cost:</span>
      <span class="stat-value" style="color:gold">$${tower.cost}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Damage:</span>
      <span class="stat-value damage-value">${tower.damage}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Range:</span>
      <span class="stat-value range-value">${tower.range}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Fire Rate:</span>
      <span class="stat-value speed-value">${tower.fireRate}/s</span>
    </div>
    <div id="tower-description">${tower.description}</div>
  `;
  
  // Set the border color to match faction
  statsPanel.style.borderColor = factionColor;
}

// Reset all game elements when returning to faction selection
window.resetGame = function() {
  console.log("Resetting game state completely");

  // Clear the scene
  if (scene) {
    // Remove all objects from the scene
    while(scene.children.length > 0) {
      const object = scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      scene.remove(object);
    }
  }
  
  // Reset game state
  if (window.waveTimer) {
    clearInterval(window.waveTimer);
    window.waveTimer = null;
  }
  
  // Reset all managers
  if (enemyManager) {
    // Stop any ongoing wave
    enemyManager.waveInProgress = false;
    if (enemyManager.spawnInterval) {
      clearInterval(enemyManager.spawnInterval);
      enemyManager.spawnInterval = null;
    }
  
    // Clear enemies array
    enemyManager.enemies = [];
  }
  
  if (gameManager) {
    // Remove event listeners that were bound in the GameManager constructor
    document.removeEventListener('enemyReachedEnd', gameManager.onEnemyReachedEndBound);
    document.removeEventListener('enemyKilled', gameManager.onEnemyKilledBound);
    document.removeEventListener('waveCompleted', gameManager.onWaveCompletedBound);
    document.removeEventListener('pathChanged', gameManager.onPathChangedBound);
    
    // Also remove our global wave completed handler if it exists
    if (window.onWaveCompletedHandler) {
      document.removeEventListener('waveCompleted', window.onWaveCompletedHandler);
      window.onWaveCompletedHandler = null;
    }
    
    gameManager.gameIsOver = false;
  }
  
  // Reset game variables
  isFirstWave = true;
  currentWave = 0;
  selectedFaction = null;
  
  // Properly reset the faction selection screen layout
  const factionSelection = document.getElementById('faction-selection');
  if (factionSelection) {
    // Reset position and style properties
    factionSelection.style.position = 'fixed';
    factionSelection.style.top = '0';
    factionSelection.style.left = '0';
    factionSelection.style.width = '100%';
    factionSelection.style.height = '100%';
    factionSelection.style.display = 'flex';
    factionSelection.style.flexDirection = 'column';
    factionSelection.style.justifyContent = 'center';
    factionSelection.style.alignItems = 'center';
  }
  
  // Reset game instructions
  const gameInstructions = document.querySelector('.game-instructions');
  if (gameInstructions) {
    gameInstructions.style.textAlign = 'center';
    gameInstructions.style.maxWidth = '800px';
    gameInstructions.style.marginBottom = '1.5rem';
    gameInstructions.style.width = 'auto'; // Reset any explicit width
    gameInstructions.style.left = 'auto'; // Reset any left positioning
  }
  
  // Reset start game button
  const startGameBtn = document.getElementById('start-game-btn');
  if (startGameBtn) {
    startGameBtn.style.marginTop = '2rem';
    startGameBtn.style.position = 'relative';
    startGameBtn.style.left = 'auto';
    startGameBtn.style.width = 'auto';
    startGameBtn.classList.remove('active');
  }
  
  // Reset faction selection UI state
  const factionCards = document.querySelectorAll('.faction-card');
  factionCards.forEach(card => {
    card.classList.remove('selected');
  });
  
  // Clear any notifications
  const notificationArea = document.getElementById('notification-area');
  if (notificationArea) {
    notificationArea.textContent = '';
  }
  
  // Reset towers panel
  const towersPanel = document.getElementById('tower-selection');
  if (towersPanel) {
    towersPanel.innerHTML = '';
  }
  
  // Reset HUD values
  document.getElementById('money').textContent = '100';
  document.getElementById('lives').textContent = '10';
  document.getElementById('wave').textContent = '1';
  
  // Remove any game over screen that might still be around
  const gameOverScreen = document.getElementById('game-over-screen');
  if (gameOverScreen && gameOverScreen.parentNode) {
    gameOverScreen.parentNode.removeChild(gameOverScreen);
  }
  
  // Clear any THREE.js renderer from the container
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    // Remove any WebGL canvas that might be in the container
    const canvas = gameContainer.querySelector('canvas');
    if (canvas) {
      gameContainer.removeChild(canvas);
    }
  }
  
  // Null out global references to encourage garbage collection
  gridManager = null;
  enemyManager = null;
  towerManager = null;
  gameManager = null;
  scene = null;
  
  console.log("Game reset complete");
};

// Start the game with faction selection
document.addEventListener('DOMContentLoaded', initFactionSelection); 