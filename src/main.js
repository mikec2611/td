import { GridManager } from './GridManager.js';
import { EnemyManager } from './EnemyManager.js';
import { TowerManager } from './TowerManager.js';
import { GameManager } from './GameManager.js';
import { TOWER_TYPES } from './TowerTypes.js';

// Game settings
const GRID_SIZE = 15; // Grid is 15x15
const CELL_SIZE = 2; // Each cell is 2x2 units

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
document.body.appendChild(renderer.domElement);

// Add light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 20, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

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
function setupTowerSelectionPanel() {
  const panel = document.getElementById('tower-selection-panel');
  const statsPanel = document.getElementById('tower-stats');
  
  // Clear any existing content
  panel.innerHTML = '';
  
  // Add each tower option
  TOWER_TYPES.forEach(tower => {
    const towerOption = document.createElement('div');
    towerOption.classList.add('tower-option');
    towerOption.dataset.towerId = tower.id;
    
    // Set background color to match tower color
    towerOption.style.backgroundColor = `#${new THREE.Color(tower.color).getHexString()}`;
    
    // Add tower icon
    const towerIcon = document.createElement('div');
    towerIcon.textContent = tower.icon;
    towerIcon.style.fontSize = '24px';
    towerOption.appendChild(towerIcon);
    
    // Add cost display
    const costDisplay = document.createElement('div');
    costDisplay.classList.add('tower-cost');
    costDisplay.textContent = `$${tower.cost}`;
    towerOption.appendChild(costDisplay);
    
    // Set the first tower as selected by default
    if (tower.id === 1) {
      towerOption.classList.add('selected');
    }
    
    // Add event listeners for interaction
    towerOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.tower-option').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      towerOption.classList.add('selected');
      
      // Update the selected tower in the tower manager
      towerManager.setSelectedTowerType(tower.id);
      
      // Hide stats panel when selecting
      statsPanel.style.display = 'none';
    });
    
    // Show tower stats on hover
    towerOption.addEventListener('mouseenter', () => {
      displayTowerStats(tower);
    });
    
    towerOption.addEventListener('mouseleave', () => {
      statsPanel.style.display = 'none';
    });
    
    panel.appendChild(towerOption);
  });
}

// Display tower stats in tooltip
function displayTowerStats(tower) {
  const statsPanel = document.getElementById('tower-stats');
  
  // Update stats content
  document.getElementById('tower-name').textContent = tower.name;
  document.getElementById('tower-cost-stat').textContent = `$${tower.cost}`;
  document.getElementById('tower-damage-stat').textContent = tower.damage;
  document.getElementById('tower-range-stat').textContent = tower.range;
  document.getElementById('tower-fire-rate-stat').textContent = tower.fireRate.toFixed(1);
  document.getElementById('tower-description').textContent = tower.description;
  
  // Show the stats panel
  statsPanel.style.display = 'block';
}

// Initialize tower selection panel
setupTowerSelectionPanel();

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