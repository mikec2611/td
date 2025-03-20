import { TOWER_TYPES } from './TowerTypes.js';

export class TowerManager {
  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.towers = [];
    this.towerTypes = TOWER_TYPES;
    this.selectedTowerType = this.towerTypes[0]; // Default to first tower
    
    // Create a path visualization group
    this.pathVisualization = new THREE.Group();
    this.pathVisualization.visible = false; // Hidden by default
    this.scene.add(this.pathVisualization);
    
    // Listen for path changes to update visualization
    document.addEventListener('pathChanged', this.onPathChanged.bind(this));
  }
  
  onPathChanged(event) {
    // Update the path visualization
    this.updatePathVisualization(event.detail.newPath);
  }
  
  updatePathVisualization(path) {
    // Clear existing visualization
    while(this.pathVisualization.children.length > 0) {
      this.pathVisualization.remove(this.pathVisualization.children[0]);
    }
    
    if (!path) return;
    
    // Create indicators for the new path
    for (let i = 0; i < path.length - 1; i++) {
      const startPos = this.gridManager.getWorldPosition(path[i]);
      const endPos = this.gridManager.getWorldPosition(path[i + 1]);
      
      // Create a line between path points
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.7,
        linewidth: 2
      });
      
      const points = [
        new THREE.Vector3(startPos.x, 0.15, startPos.z),
        new THREE.Vector3(endPos.x, 0.15, endPos.z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.pathVisualization.add(line);
      
      // Determine if this is a diagonal move
      const isDiagonal = 
        Math.abs(path[i].x - path[i+1].x) === 1 && 
        Math.abs(path[i].y - path[i+1].y) === 1;
      
      // Add vertex markers at each path point (except the last one which will be added in the next iteration)
      if (i === 0) {
        this.addPathMarker(startPos, 0x00ff00); // Start point in green
      }
      
      // Different marker for diagonal vs cardinal moves
      const markerColor = isDiagonal ? 0xff00ff : 0x00ffff; // Purple for diagonal, cyan for cardinal
      
      // Add a marker at the end point of this segment
      if (i === path.length - 2) {
        this.addPathMarker(endPos, 0xff0000); // End point in red
      } else {
        this.addPathMarker(endPos, markerColor);
      }
      
      // Add direction arrow to show path direction
      if (i % 2 === 0 || isDiagonal) { // Add arrows on all diagonal segments and every other cardinal segment
        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const midpoint = new THREE.Vector3().addVectors(
          startPos.clone().multiplyScalar(0.6),
          endPos.clone().multiplyScalar(0.4)
        );
        midpoint.y = 0.15;
        
        const arrowHelper = new THREE.ArrowHelper(
          direction, 
          midpoint, 
          0.6, 
          isDiagonal ? 0xff00ff : 0x00ffff, // Purple for diagonal, cyan for cardinal
          0.3, 
          0.2
        );
        this.pathVisualization.add(arrowHelper);
      }
    }
  }
  
  addPathMarker(position, color) {
    // Create a small sphere to mark path vertices
    const markerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    marker.position.y = 0.15; // Just above the ground
    this.pathVisualization.add(marker);
    
    // Create a pulsing ring effect
    const ringGeometry = new THREE.RingGeometry(0.2, 0.25, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Lay flat
    ring.position.copy(position);
    ring.position.y = 0.05;
    ring.userData.pulseTime = 0; // For animation
    ring.userData.baseSize = 0.2; // Original size to scale from
    this.pathVisualization.add(ring);
  }
  
  buildTower(x, y) {
    // Try to place a tower on the grid
    const result = this.gridManager.placeStructure(x, y, 'tower');
    
    if (!result) {
      return false;
    }
    
    // Get the selected tower type configuration
    const towerType = this.selectedTowerType;
    
    // Create tower base
    const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.4, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: towerType.color });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.2;
    
    // Create tower middle
    const middleGeometry = new THREE.CylinderGeometry(0.4, 0.6, 0.6, 8);
    const middleMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(towerType.color).offsetHSL(0, 0, -0.1) });
    const middleMesh = new THREE.Mesh(middleGeometry, middleMaterial);
    middleMesh.position.y = 0.7;
    
    // Create tower top
    const topGeometry = new THREE.CylinderGeometry(0.2, 0.4, 0.3, 8);
    const topMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(towerType.color).offsetHSL(0, 0, -0.2) });
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = 1.15;
    
    // Create tower turret (cannon)
    const turretGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.8);
    const turretMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
    turretMesh.position.y = 0.2;
    
    // Create turret mount
    const mountGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const mountMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const mountMesh = new THREE.Mesh(mountGeometry, mountMaterial);
    mountMesh.position.y = 1.35;
    
    // Add turret to mount
    turretMesh.position.z = 0.5; // Position turret forward
    mountMesh.add(turretMesh);
    
    // Create tower group
    const towerGroup = new THREE.Group();
    towerGroup.add(baseMesh);
    towerGroup.add(middleMesh);
    towerGroup.add(topMesh);
    towerGroup.add(mountMesh);
    
    // Add tower type indicator (e.g., level number)
    const levelGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const levelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const levelIndicator = new THREE.Mesh(levelGeometry, levelMaterial);
    levelIndicator.position.set(0, 1.6, 0);
    towerGroup.add(levelIndicator);
    
    // Add range indicator (invisible by default)
    const rangeGeometry = new THREE.RingGeometry(0, towerType.range, 32);
    const rangeMaterial = new THREE.MeshBasicMaterial({ 
      color: towerType.color, 
      transparent: true, 
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const rangeIndicator = new THREE.Mesh(rangeGeometry, rangeMaterial);
    rangeIndicator.rotation.x = -Math.PI / 2;
    rangeIndicator.position.y = 0.05;
    rangeIndicator.visible = false;
    towerGroup.add(rangeIndicator);
    
    // Calculate position
    const position = this.gridManager.getWorldPosition(this.gridManager.grid[y][x]);
    towerGroup.position.copy(position);
    
    // Add to scene
    this.scene.add(towerGroup);
    
    // Create tower object
    const tower = {
      mesh: towerGroup,
      turret: mountMesh,
      rangeIndicator: rangeIndicator,
      x: x,
      y: y,
      range: towerType.range,
      damage: towerType.damage,
      fireRate: towerType.fireRate,
      lastFired: 0,
      target: null,
      type: towerType.id
    };
    
    this.towers.push(tower);
    
    return tower;
  }
  
  update(deltaTime, enemyManager) {
    const currentTime = performance.now() / 1000;
    
    // Update path marker animations
    this.updatePathMarkers(deltaTime);
    
    for (const tower of this.towers) {
      // Find target if none exists or current target is dead/gone
      if (!tower.target || tower.target.dead || tower.target.reachedEnd) {
        tower.target = this.findTarget(tower, enemyManager);
      }
      
      // If we have a target, aim and fire
      if (tower.target) {
        // Aim turret at target
        this.aimTurret(tower, tower.target);
        
        // Check if we can fire
        if (currentTime - tower.lastFired >= 1 / tower.fireRate) {
          this.fireTower(tower, tower.target, enemyManager);
          tower.lastFired = currentTime;
        }
        
        // Check if target is still in range
        const towerPosition = new THREE.Vector3(
          tower.mesh.position.x,
          tower.target.mesh.position.y, // Use same y for distance calculation
          tower.mesh.position.z
        );
        
        const distanceToTarget = towerPosition.distanceTo(tower.target.mesh.position);
        if (distanceToTarget > tower.range) {
          tower.target = null;
        }
      }
    }
  }
  
  findTarget(tower, enemyManager) {
    // Get enemies in range
    const towerPosition = tower.mesh.position.clone();
    const enemiesInRange = enemyManager.getEnemiesInRange(towerPosition, tower.range);
    
    // No enemies in range
    if (enemiesInRange.length === 0) {
      return null;
    }
    
    // Find enemy that is furthest along the path
    return enemiesInRange.reduce((furthest, current) => {
      if (!furthest) return current;
      
      // If current enemy is further along the path, choose it
      return current.currentPathIndex > furthest.currentPathIndex ? current : furthest;
    }, null);
  }
  
  aimTurret(tower, target) {
    // Get direction to target
    const towerPosition = tower.mesh.position.clone();
    const targetPosition = target.mesh.position.clone();
    
    // Calculate angle to target (in XZ plane)
    const dx = targetPosition.x - towerPosition.x;
    const dz = targetPosition.z - towerPosition.z;
    const angle = Math.atan2(dx, dz);
    
    // Rotate turret
    tower.turret.rotation.y = angle;
  }
  
  fireTower(tower, target, enemyManager) {
    // Get turret position
    const turretPosition = tower.turret.localToWorld(new THREE.Vector3(0, 0, 0.5));
    
    // Create line from tower to target
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      turretPosition,
      target.mesh.position.clone()
    ]);
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);
    
    // Apply damage
    enemyManager.damageEnemy(target, tower.damage);
    
    // Remove line after a short time
    setTimeout(() => {
      this.scene.remove(line);
    }, 100);
  }
  
  getTowerCost() {
    return this.selectedTowerType.cost;
  }
  
  setSelectedTowerType(towerTypeId) {
    const towerType = this.towerTypes.find(t => t.id === towerTypeId);
    if (towerType) {
      this.selectedTowerType = towerType;
      return true;
    }
    return false;
  }
  
  // Toggle range indicators for all towers
  toggleRangeIndicators(show) {
    this.towers.forEach(tower => {
        if (tower.rangeIndicator) {
            tower.rangeIndicator.visible = show;
        }
    });
  }
  
  updatePathMarkers(deltaTime) {
    // Animate all path markers with pulsing effect
    this.pathVisualization.children.forEach(child => {
      if (child.userData.pulseTime !== undefined) {
        // Update pulse time
        child.userData.pulseTime += deltaTime * 2;
        
        // Calculate scale based on sine wave
        const pulseScale = 1 + 0.3 * Math.sin(child.userData.pulseTime);
        
        // Apply scale to ring
        child.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Also animate opacity
        if (child.material) {
          child.material.opacity = 0.2 + 0.3 * Math.abs(Math.sin(child.userData.pulseTime));
        }
      }
    });
  }
} 