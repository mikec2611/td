import { GridManager } from './GridManager.js';
import { EnemyManager } from './EnemyManager.js';
import { TowerManager } from './TowerManager.js';
import { GameManager } from './GameManager.js';
import { TOWER_TYPES } from './TowerTypes.js';

// Game settings
const GRID_SIZE = 15; // Grid is 15x15
const CELL_SIZE = 2; // Each cell is 2x2 units

// Track selected faction
let selectedFaction = null;

// Initialize the faction selection screen
function initFactionSelection() {
  const factionCards = document.querySelectorAll('.faction-card');
  
  factionCards.forEach(card => {
    card.addEventListener('click', () => {
      selectedFaction = card.dataset.faction;
      
      // Add selected class to the card
      factionCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
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
  });
}

// Initialize the main game
function initGame(faction) {
  console.log(`Starting game with faction: ${faction}`);
  
  // Initialize three.js
  const scene = new THREE.Scene();
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
  
  // Initialize game managers
  const gridManager = new GridManager(scene, GRID_SIZE, CELL_SIZE);
  const enemyManager = new EnemyManager(scene, gridManager);
  const towerManager = new TowerManager(scene, gridManager);
  const gameManager = new GameManager(gridManager, enemyManager, towerManager);
  
  // Initialize path visualization
  const initialPath = gridManager.getPath();
  if (initialPath) {
    towerManager.updatePathVisualization(initialPath);
  }
  
  // Setup tower selection panel
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
  
  document.getElementById('start-wave').addEventListener('click', () => {
    gameManager.startWave();
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    gameManager.update();
    
    renderer.render(scene, camera);
  }
  
  animate();
}

// Apply faction-specific theme to the game
function applyFactionTheme(faction, scene) {
  // Customize scene based on faction
  switch(faction) {
    case 'tech':
      scene.background = new THREE.Color(0x001a33); // Dark blue tech background
      document.body.style.setProperty('--faction-color', '#00c6ff');
      document.getElementById('tower-stats').style.borderColor = '#00c6ff';
      document.getElementById('tower-name').style.color = '#00c6ff';
      break;
      
    case 'energy':
      scene.background = new THREE.Color(0x1a0d00); // Dark orange energy background
      document.body.style.setProperty('--faction-color', '#f5d020');
      document.getElementById('tower-stats').style.borderColor = '#f5d020';
      document.getElementById('tower-name').style.color = '#f5d020';
      break;
      
    case 'elemental':
      scene.background = new THREE.Color(0x071a00); // Dark green nature background
      document.body.style.setProperty('--faction-color', '#a8e063');
      document.getElementById('tower-stats').style.borderColor = '#a8e063';
      document.getElementById('tower-name').style.color = '#a8e063';
      break;
  }
}

// Setup tower selection panel
function setupTowerSelectionPanel(towerManager, faction) {
  const panel = document.getElementById('tower-selection-panel');
  const statsPanel = document.getElementById('tower-stats');
  
  // Clear any existing content
  panel.innerHTML = '';
  
  // Filter towers based on faction or use all
  let filteredTowers = TOWER_TYPES;
  // In the future, we could filter towers by faction
  
  // Add each tower option
  filteredTowers.forEach(tower => {
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
    
    // Add event listener
    towerOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.tower-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      towerOption.classList.add('selected');
      
      // Set the selected tower type
      towerManager.setSelectedTowerType(tower.id);
    });
    
    // Hover event for stats
    towerOption.addEventListener('mouseenter', () => {
      // Update and show stats panel
      document.getElementById('tower-name').textContent = tower.name;
      document.getElementById('tower-cost-stat').textContent = `$${tower.cost}`;
      document.getElementById('tower-damage-stat').textContent = tower.damage;
      document.getElementById('tower-range-stat').textContent = tower.range;
      document.getElementById('tower-fire-rate-stat').textContent = tower.fireRate.toFixed(1);
      document.getElementById('tower-description').textContent = tower.description;
      
      statsPanel.style.display = 'block';
    });
    
    towerOption.addEventListener('mouseleave', () => {
      statsPanel.style.display = 'none';
    });
    
    panel.appendChild(towerOption);
  });
}

// Start the game with faction selection
document.addEventListener('DOMContentLoaded', initFactionSelection); 