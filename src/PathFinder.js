export class PathFinder {
  constructor(gridManager) {
    this.gridManager = gridManager;
    this.allowDiagonal = true; // Allow diagonal movement
  }
  
  findPath() {
    const { startCell, endCell, gridSize } = this.gridManager;
    
    // Implementation of A* pathfinding algorithm
    const openSet = [this.gridManager.grid[startCell.y][startCell.x]];
    const closedSet = [];
    const cameFrom = {};
    
    const gScore = {}; // Cost from start to current
    const fScore = {}; // Estimated cost from start to end via current
    
    // Initialize scores
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const id = `${x},${y}`;
        gScore[id] = Infinity;
        fScore[id] = Infinity;
      }
    }
    
    const startId = `${startCell.x},${startCell.y}`;
    gScore[startId] = 0;
    fScore[startId] = this.heuristic(startCell, endCell);
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let lowestFScore = fScore[`${current.x},${current.y}`];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        const nodeId = `${openSet[i].x},${openSet[i].y}`;
        if (fScore[nodeId] < lowestFScore) {
          current = openSet[i];
          lowestFScore = fScore[nodeId];
          currentIndex = i;
        }
      }
      
      // If we reached the end
      if (current.x === endCell.x && current.y === endCell.y) {
        // Reconstruct path
        const path = [];
        let temp = current;
        
        while (`${temp.x},${temp.y}` in cameFrom) {
          path.unshift(temp);
          temp = cameFrom[`${temp.x},${temp.y}`];
        }
        
        path.unshift(this.gridManager.grid[startCell.y][startCell.x]);
        return path;
      }
      
      // Remove current from openSet and add to closedSet
      openSet.splice(currentIndex, 1);
      closedSet.push(current);
      
      // Check neighbors
      const neighbors = this.getNeighbors(current);
      
      for (const neighbor of neighbors) {
        // Skip if already evaluated or occupied
        if (closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y) || neighbor.occupied) {
          continue;
        }
        
        const neighborId = `${neighbor.x},${neighbor.y}`;
        
        // Calculate movement cost - diagonal moves cost more (approx. 1.414) than cardinal moves (1)
        const isDiagonal = 
          Math.abs(current.x - neighbor.x) === 1 && 
          Math.abs(current.y - neighbor.y) === 1;
        
        const moveCost = isDiagonal ? 1.414 : 1; // sqrt(2) for diagonal moves
        const tentativeGScore = gScore[`${current.x},${current.y}`] + moveCost;
        
        // If neighbor not in openSet, add it
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= gScore[neighborId]) {
          // Not a better path
          continue;
        }
        
        // This path is the best so far
        cameFrom[neighborId] = current;
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = gScore[neighborId] + this.heuristic(neighbor, endCell);
      }
    }
    
    // No path found
    return null;
  }
  
  getNeighbors(cell) {
    const neighbors = [];
    
    // Cardinal directions (up, right, down, left)
    const cardinalDirections = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];
    
    // Diagonal directions
    const diagonalDirections = [
      { x: 1, y: -1 },  // Up-Right
      { x: 1, y: 1 },   // Down-Right
      { x: -1, y: 1 },  // Down-Left
      { x: -1, y: -1 }  // Up-Left
    ];
    
    // Add cardinal neighbors
    for (const dir of cardinalDirections) {
      const x = cell.x + dir.x;
      const y = cell.y + dir.y;
      const neighbor = this.gridManager.getCellAt(x, y);
      
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    
    // Add diagonal neighbors if allowed
    if (this.allowDiagonal) {
      for (const dir of diagonalDirections) {
        const x = cell.x + dir.x;
        const y = cell.y + dir.y;
        const neighbor = this.gridManager.getCellAt(x, y);
        
        if (neighbor) {
          // Check if diagonal movement is blocked by obstacles in adjacent cells
          // This prevents "cutting corners" through diagonal gaps
          const adjacentX = this.gridManager.getCellAt(cell.x + dir.x, cell.y);
          const adjacentY = this.gridManager.getCellAt(cell.x, cell.y + dir.y);
          
          if ((adjacentX && !adjacentX.occupied) || (adjacentY && !adjacentY.occupied)) {
            neighbors.push(neighbor);
          }
        }
      }
    }
    
    return neighbors;
  }
  
  heuristic(a, b) {
    if (this.allowDiagonal) {
      // Euclidean distance (better for diagonal movement)
      return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    } else {
      // Manhattan distance (better for cardinal movement)
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
  }
} 