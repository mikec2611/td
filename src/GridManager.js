import { PathFinder } from './PathFinder.js';

export class GridManager {
  constructor(scene, gridSize, cellSize) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.grid = [];
    this.cellObjects = [];
    this.pathFinder = new PathFinder(this);
    
    // Define start and end points
    this.startCell = { x: 0, y: 0 }; // Top left
    this.endCell = { x: gridSize - 1, y: gridSize - 1 }; // Bottom right
    
    // Track currently highlighted cell
    this.highlightedCell = null;
    this.originalCellColor = null;
    this.originalCellOpacity = null;
    
    this.initGrid();
    this.createGridVisualization();
    this.createBoardBorder();
  }
  
  initGrid() {
    // Initialize the grid with empty cells
    for (let y = 0; y < this.gridSize; y++) {
      const row = [];
      for (let x = 0; x < this.gridSize; x++) {
        row.push({
          x: x,
          y: y,
          occupied: false,
          type: 'empty',
          object: null
        });
      }
      this.grid.push(row);
    }
    
    // Mark start and end cells
    this.grid[this.startCell.y][this.startCell.x].type = 'start';
    this.grid[this.endCell.y][this.endCell.x].type = 'end';
  }
  
  createBoardBorder() {
    // Add a frame around the board
    const frameSize = this.gridSize * this.cellSize + 1;
    const frameThickness = 0.5;
    const frameHeight = 0.5;
    
    // Create border geometry
    const createBorderPiece = (width, depth, x, z) => {
      const geometry = new THREE.BoxGeometry(width, frameHeight, depth);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x444444,
        emissive: 0x222222
      });
      const border = new THREE.Mesh(geometry, material);
      border.position.set(x, 0, z);
      this.scene.add(border);
    };
    
    // Top border
    createBorderPiece(
      frameSize + 2 * frameThickness, 
      frameThickness, 
      0, 
      -frameSize/2 - frameThickness/2
    );
    
    // Bottom border
    createBorderPiece(
      frameSize + 2 * frameThickness, 
      frameThickness, 
      0, 
      frameSize/2 + frameThickness/2
    );
    
    // Left border
    createBorderPiece(
      frameThickness, 
      frameSize, 
      -frameSize/2 - frameThickness/2, 
      0
    );
    
    // Right border
    createBorderPiece(
      frameThickness, 
      frameSize, 
      frameSize/2 + frameThickness/2, 
      0
    );
  }
  
  createGridVisualization() {
    // Base grid
    const gridGeometry = new THREE.PlaneGeometry(
      this.gridSize * this.cellSize,
      this.gridSize * this.cellSize
    );
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    });
    const gridPlane = new THREE.Mesh(gridGeometry, gridMaterial);
    gridPlane.rotation.x = -Math.PI / 2;
    gridPlane.position.y = -0.05;
    gridPlane.receiveShadow = true;
    this.scene.add(gridPlane);
    
    // Create path from start to end
    this.highlightInitialPath();
    
    // Create cell visualization
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = this.grid[y][x];
        
        // Create cell mesh - make the cells smaller and without borders
        const cellGeometry = new THREE.BoxGeometry(this.cellSize * 0.95, 0.1, this.cellSize * 0.95);
        let cellMaterial;
        
        if (cell.type === 'start') {
          cellMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff00,
            emissive: 0x004400
          }); // Green for start
        } else if (cell.type === 'end') {
          cellMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            emissive: 0x440000
          }); // Red for end
        } else {
          // Make regular cells completely transparent, we'll just use the base grid
          cellMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x777777,
            transparent: true,
            opacity: 0.0 // Completely transparent regular cells
          });
        }
        
        const cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);
        
        // Position the cell
        const posX = (x - this.gridSize / 2 + 0.5) * this.cellSize;
        const posZ = (y - this.gridSize / 2 + 0.5) * this.cellSize;
        cellMesh.position.set(posX, 0, posZ);
        
        // Store reference to the cell
        cellMesh.userData.cell = cell;
        cell.object = cellMesh;
        
        this.scene.add(cellMesh);
        this.cellObjects.push(cellMesh);
      }
    }
    
    // Add start and end point indicators
    this.addStartEndIndicators();
  }
  
  highlightInitialPath() {
    const path = this.pathFinder.findPath();
    if (!path) return;
    
    // Create a subtle path indicator
    for (let i = 1; i < path.length - 1; i++) {
      const cell = path[i];
      const position = this.getWorldPosition(cell);
      
      // Create a subtle marker
      const markerGeometry = new THREE.PlaneGeometry(this.cellSize * 0.3, this.cellSize * 0.3);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.copy(position);
      marker.position.y = 0.01; // Just above the grid
      this.scene.add(marker);
    }
  }
  
  addStartEndIndicators() {
    // The start and end cells will be identified by their colors only,
    // without additional visual indicators or text
  }
  
  getCellAt(x, y) {
    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      return this.grid[y][x];
    }
    return null;
  }
  
  getCellObjects() {
    return this.cellObjects;
  }
  
  isCellValid(x, y) {
    // Check if cell coordinates are valid
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
      return false;
    }
    
    const cell = this.grid[y][x];
    
    // Cannot build on start or end cells
    if (cell.type === 'start' || cell.type === 'end') {
      return false;
    }
    
    // Cannot build on occupied cells
    if (cell.occupied) {
      return false;
    }
    
    // Check if placing a tower here would block the path
    cell.occupied = true; // Temporarily mark as occupied
    const pathExists = this.pathFinder.findPath();
    cell.occupied = false; // Reset
    
    return pathExists;
  }
  
  placeStructure(x, y, type) {
    if (!this.isCellValid(x, y)) {
      return false;
    }
    
    const cell = this.grid[y][x];
    cell.occupied = true;
    cell.type = type;
    
    // Update cell appearance
    const cellMesh = cell.object;
    cellMesh.material.color.set(0x0077cc); // Darker blue for tower base
    cellMesh.material.opacity = 0.5; // Semi-transparent so the tower is visible on top
    
    // Calculate new path and notify the game that the path has changed
    const newPath = this.pathFinder.findPath();
    document.dispatchEvent(new CustomEvent('pathChanged', { 
      detail: { newPath } 
    }));
    
    return true;
  }
  
  getWorldPosition(cell) {
    const posX = (cell.x - this.gridSize / 2 + 0.5) * this.cellSize;
    const posZ = (cell.y - this.gridSize / 2 + 0.5) * this.cellSize;
    return new THREE.Vector3(posX, 0, posZ);
  }
  
  getPath() {
    return this.pathFinder.findPath();
  }
  
  highlightCell(cell) {
    // Skip if cell is already highlighted or is start/end
    if (this.highlightedCell === cell || cell.type === 'start' || cell.type === 'end') {
      return;
    }
    
    // Reset previous highlighted cell if any
    this.resetHighlightedCell();
    
    // Store current cell as highlighted
    this.highlightedCell = cell;
    
    // Save original appearance
    if (cell.object && cell.object.material) {
      this.originalCellColor = cell.object.material.color.clone();
      this.originalCellOpacity = cell.object.material.opacity;
      
      // Change appearance
      if (cell.occupied) {
        // For towers, just make them brighter
        cell.object.material.emissive = new THREE.Color(0x222288);
      } else {
        // For empty cells, make them glow yellow and visible
        cell.object.material.color.set(0xffff88);
        cell.object.material.opacity = 0.7; // Make visible when highlighted
        
        // Raise the cell slightly for a 3D effect
        cell.object.position.y += 0.05;
      }
    }
  }
  
  resetHighlightedCell() {
    if (this.highlightedCell && this.highlightedCell.object) {
      const material = this.highlightedCell.object.material;
      
      // Reset color and opacity
      if (material && this.originalCellColor) {
        material.color.copy(this.originalCellColor);
        material.opacity = this.originalCellOpacity;
        material.emissive = new THREE.Color(0x000000);
      }
      
      // Reset position
      if (this.highlightedCell.type !== 'start' && 
          this.highlightedCell.type !== 'end' && 
          !this.highlightedCell.occupied) {
        this.highlightedCell.object.position.y = 0;
      }
    }
    
    this.highlightedCell = null;
    this.originalCellColor = null;
    this.originalCellOpacity = null;
  }
} 