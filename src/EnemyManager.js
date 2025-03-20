import * as THREE from 'three';

export class EnemyManager {
  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.enemies = [];
    this.waveNumber = 1;
    this.waveInProgress = false;
    this.enemiesRemaining = 0;
    this.spawnInterval = null;
    this.enemySpeed = 5.0; // Default speed increased (was 1.0)
    
    // Listen for path changes when towers are built
    document.addEventListener('pathChanged', this.onPathChanged.bind(this));
  }
  
  onPathChanged(event) {
    const newPath = event.detail.newPath;
    
    // If no valid path exists, don't update enemies
    if (!newPath) return;
    
    // Update path for all active enemies
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.reachedEnd) continue;
      
      // Save current position in the world
      const currentPosition = enemy.mesh.position.clone();
      
      // Find the nearest point on the new path
      let closestPointIndex = this.findClosestPathPoint(currentPosition, newPath);
      
      // Update enemy's path and path index
      enemy.path = newPath;
      enemy.currentPathIndex = closestPointIndex;
    }
  }
  
  findClosestPathPoint(position, path) {
    let closestDistance = Infinity;
    let closestIndex = 0;
    
    // Check each point in the path
    for (let i = 0; i < path.length; i++) {
      const pathPoint = this.gridManager.getWorldPosition(path[i]);
      const distance = position.distanceTo(pathPoint);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    
    // Use the closest path point or the next one to ensure enemies move forward
    if (closestIndex < path.length - 1) {
      const currentPoint = this.gridManager.getWorldPosition(path[closestIndex]);
      const nextPoint = this.gridManager.getWorldPosition(path[closestIndex + 1]);
      
      // Get direction vector from current to next
      const pathDirection = new THREE.Vector3()
        .subVectors(nextPoint, currentPoint)
        .normalize();
      
      // Get vector from current point to enemy
      const toEnemyVector = new THREE.Vector3()
        .subVectors(position, currentPoint);
      
      // Project enemy position onto path direction
      const projection = toEnemyVector.dot(pathDirection);
      
      // If enemy is past halfway to the next point, use the next point
      if (projection > 0 && projection > currentPoint.distanceTo(nextPoint) * 0.5) {
        return closestIndex + 1;
      }
    }
    
    return closestIndex;
  }
  
  startWave(waveNumber = this.waveNumber) {
    if (this.waveInProgress) return;
    
    this.waveInProgress = true;
    this.waveNumber = waveNumber;
    
    // Calculate number of enemies based on wave number
    this.enemiesRemaining = 5 + Math.floor(waveNumber * 1.5);
    
    // Find path
    const path = this.gridManager.getPath();
    if (!path) {
      console.error('No path found for enemies!');
      this.waveInProgress = false;
      return;
    }
    
    // Start spawning enemies
    let enemiesSpawned = 0;
    this.spawnInterval = setInterval(() => {
      this.spawnEnemy(path);
      enemiesSpawned++;
      
      if (enemiesSpawned >= this.enemiesRemaining) {
        clearInterval(this.spawnInterval);
      }
    }, 1000); // Spawn an enemy every second
  }
  
  spawnEnemy(path) {
    // Create enemy group
    const enemyGroup = new THREE.Group();
    
    // Determine enemy color based on wave number (gets more intense with higher waves)
    const baseColor = 0xff0000; // Red base
    const waveIntensity = Math.min(1, this.waveNumber / 10); // Cap at wave 10
    const enemyColor = new THREE.Color(baseColor);
    enemyColor.offsetHSL(waveIntensity * 0.2, 0, 0); // Shift hue based on wave
    
    // Create enemy body (slightly taller for visibility from top-down)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: enemyColor,
      emissive: new THREE.Color(enemyColor).offsetHSL(0, 0, -0.5) // Darker version for glow
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.4;
    enemyGroup.add(bodyMesh);
    
    // Create enemy head - make it a distinctive shape instead of a sphere
    const headGeometry = new THREE.OctahedronGeometry(0.35, 0);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(enemyColor).offsetHSL(0, 0.2, 0.1),
      emissive: new THREE.Color(enemyColor).offsetHSL(0, 0, -0.3)
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = 0.9;
    enemyGroup.add(headMesh);
    
    // Add a pulsing effect to make enemies more visible
    const pulseLight = new THREE.PointLight(
      new THREE.Color(enemyColor).offsetHSL(0, 0.5, 0), 
      0.8, 
      2
    );
    pulseLight.position.y = 0.6;
    enemyGroup.add(pulseLight);
    
    // Store the pulse light reference for animation
    enemyGroup.userData.pulseLight = pulseLight;
    enemyGroup.userData.pulseTime = Math.random() * Math.PI * 2; // Random starting phase
    
    // Add direction indicator (small arrow on top)
    const arrowGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrowMesh.position.y = 1.3;
    arrowMesh.rotation.x = Math.PI;
    enemyGroup.add(arrowMesh);
    
    // Add health bar
    const healthBarGroup = this.createHealthBar();
    healthBarGroup.position.y = 1.6;
    enemyGroup.add(healthBarGroup);
    
    // Set initial position (start cell)
    const startPos = this.gridManager.getWorldPosition(this.gridManager.grid[this.gridManager.startCell.y][this.gridManager.startCell.x]);
    enemyGroup.position.copy(startPos);
    
    // Add to scene
    this.scene.add(enemyGroup);
    
    // Calculate health based on wave number
    const baseHealth = 100;
    const healthMultiplier = 1 + (this.waveNumber - 1) * 0.2; // 20% more health per wave
    const maxHealth = Math.floor(baseHealth * healthMultiplier);
    
    // Calculate current speed (takes into account the current enemySpeed which may be modified by dev mode)
    const speedVariation = 0.8 + Math.random() * 0.4; // Random variation between 0.8x and 1.2x
    const speed = this.enemySpeed * speedVariation;
    
    // Create enemy object
    const enemy = {
      mesh: enemyGroup,
      healthBar: healthBarGroup.children[0], // The green bar
      health: maxHealth,
      maxHealth: maxHealth,
      currentPathIndex: 0,
      path: path,
      speed: speed, // Apply the current speed setting
      reachedEnd: false,
      dead: false,
      pulseTime: 0 // For animation
    };
    
    // Apply visual indicator if the enemy is fast due to dev mode
    if (this.enemySpeed > 15) {
      // Add a speed indicator (trail effect) for fast enemies
      const speedTrail = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.3),
        new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        })
      );
      speedTrail.rotation.x = -Math.PI / 2;
      speedTrail.position.y = 0.05;
      speedTrail.position.z = 0.6;
      enemyGroup.add(speedTrail);
      
      // Store reference to the trail
      enemy.speedTrail = speedTrail;
    }
    
    this.enemies.push(enemy);
    
    return enemy;
  }
  
  createHealthBar() {
    const group = new THREE.Group();
    
    // Background bar (red)
    const bgGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.05);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(bgMesh);
    
    // Health bar (green)
    const barGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.06);
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const barMesh = new THREE.Mesh(barGeometry, barMaterial);
    barMesh.position.z = 0.01; // Slightly in front of background
    group.add(barMesh);
    
    // Make health bar face camera
    group.rotation.x = -Math.PI / 2; // Face upward for top-down view
    
    return group;
  }
  
  update(deltaTime) {
    const enemiesToRemove = [];
    
    // Update each enemy
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      
      if (enemy.dead || enemy.reachedEnd) {
        enemiesToRemove.push(i);
        continue;
      }
      
      // Update health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      enemy.healthBar.scale.x = healthPercent;
      enemy.healthBar.position.x = (healthPercent - 1) * 0.4; // Center the health bar
      
      // Update pulsing effect
      enemy.pulseTime += deltaTime * 3; // Speed of pulsing
      const pulseIntensity = (Math.sin(enemy.pulseTime) + 1) * 0.5; // 0 to 1
      
      // Get the pulse light
      const pulseLight = enemy.mesh.userData.pulseLight;
      if (pulseLight) {
        pulseLight.intensity = 0.3 + pulseIntensity * 0.7; // 0.3 to 1.0
        
        // Change color slightly based on health
        const hue = (1 - healthPercent) * 0.2; // 0 to 0.2 (red to slight orange)
        pulseLight.color.setHSL(hue, 1, 0.5);
      }
      
      // Animate speed trail if present (for dev mode fast enemies)
      if (enemy.speedTrail) {
        enemy.speedTrail.rotation.z += deltaTime * 10; // Rotate the trail
        enemy.speedTrail.scale.x = 0.8 + Math.sin(enemy.pulseTime * 2) * 0.2; // Pulsate the trail
        enemy.speedTrail.material.opacity = 0.3 + pulseIntensity * 0.4; // Fade in/out
      }
      
      // If enemy has reached its target, move to next path point
      if (enemy.currentPathIndex < enemy.path.length - 1) {
        const currentTarget = this.gridManager.getWorldPosition(enemy.path[enemy.currentPathIndex + 1]);
        
        // Calculate direction and distance to target
        const direction = new THREE.Vector3()
          .subVectors(currentTarget, enemy.mesh.position)
          .normalize();
        
        // Rotate enemy to face direction of movement
        if (direction.x !== 0 || direction.z !== 0) {
          const angle = Math.atan2(direction.x, direction.z);
          enemy.mesh.rotation.y = angle;
        }
        
        // Move enemy
        const moveDistance = enemy.speed * deltaTime;
        const distanceToTarget = enemy.mesh.position.distanceTo(currentTarget);
        
        if (distanceToTarget <= moveDistance) {
          // Enemy reached the current target
          enemy.mesh.position.copy(currentTarget);
          enemy.currentPathIndex++;
          
          // Check if enemy reached the end
          if (enemy.currentPathIndex === enemy.path.length - 1) {
            enemy.reachedEnd = true;
            this.enemyReachedEnd();
          }
        } else {
          // Move towards target
          enemy.mesh.position.add(direction.multiplyScalar(moveDistance));
        }
      }
    }
    
    // Remove dead or finished enemies (in reverse to avoid index issues)
    for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
      const index = enemiesToRemove[i];
      const enemy = this.enemies[index];
      
      // Remove from scene
      this.scene.remove(enemy.mesh);
      
      // Remove from array
      this.enemies.splice(index, 1);
    }
    
    // Check if wave is complete
    if (this.waveInProgress && this.enemies.length === 0 && this.enemiesRemaining === 0) {
      this.waveComplete();
    }
  }
  
  enemyReachedEnd() {
    // Emit event or callback to game manager
    document.dispatchEvent(new CustomEvent('enemyReachedEnd'));
    this.enemiesRemaining--;
  }
  
  damageEnemy(enemy, damage) {
    enemy.health -= damage;
    
    if (enemy.health <= 0) {
      enemy.dead = true;
      this.enemiesRemaining--;
      
      // Emit event or callback to game manager
      document.dispatchEvent(new CustomEvent('enemyKilled', { detail: { enemy } }));
    }
  }
  
  waveComplete() {
    this.waveInProgress = false;
    this.waveNumber++;
    
    // Emit event or callback to game manager
    document.dispatchEvent(new CustomEvent('waveCompleted', { 
      detail: { 
        waveNumber: this.waveNumber - 1,
        nextWaveNumber: this.waveNumber
      } 
    }));
  }
  
  getEnemiesInRange(position, range) {
    return this.enemies.filter(enemy => {
      if (enemy.dead || enemy.reachedEnd) return false;
      
      const distance = enemy.mesh.position.distanceTo(position);
      return distance <= range;
    });
  }
} 