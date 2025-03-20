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
  
  startWave(waveNumber = this.waveNumber, enemyCount = 10, enemyTypes = ['normal'], healthScaling = 1.0, speedScaling = 1.0) {
    if (this.waveInProgress) return false;
    
    console.log(`Starting wave ${waveNumber} with ${enemyCount} enemies of types: ${enemyTypes.join(', ')}`);
    console.log(`Health scaling: ${healthScaling}x, Speed scaling: ${speedScaling}x`);
    
    // Clear any existing spawn interval
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    
    // Clean up any leftover enemies from previous waves
    if (this.enemies.length > 0) {
      console.warn(`Cleaning up ${this.enemies.length} leftover enemies before starting new wave`);
      for (const enemy of this.enemies) {
        this.scene.remove(enemy.mesh);
      }
      this.enemies = [];
    }
    
    this.waveInProgress = true;
    this.waveNumber = waveNumber;
    this.enemiesRemaining = enemyCount; // Total enemies to process in this wave
    this.enemiesSpawned = 0; // Track how many we've actually spawned
    this.enemiesKilled = 0; // Track how many were killed
    this.enemiesReachedEnd = 0; // Track how many reached the end
    
    // Store wave parameters for enemy spawning
    this.currentWaveHealthScaling = healthScaling;
    this.currentWaveSpeedScaling = speedScaling;
    this.currentWaveEnemyTypes = enemyTypes;
    
    // Find path
    const path = this.gridManager.getPath();
    if (!path) {
      console.error('No path found for enemies!');
      this.waveInProgress = false;
      return false;
    }
    
    // Calculate spawn interval based on enemy count
    // Faster spawning for higher waves, but not too fast
    const baseSpawnInterval = 1000; // 1 second
    const spawnIntervalReduction = Math.min(0.7, (waveNumber - 1) * 0.02); // Up to 70% reduction
    const spawnInterval = baseSpawnInterval * (1 - spawnIntervalReduction);
    
    console.log(`Spawning enemy every ${spawnInterval}ms`);
    
    // Start spawning enemies
    this.spawnInterval = setInterval(() => {
      this.spawnEnemy(path);
      this.enemiesSpawned++;
      
      console.log(`Spawned enemy ${this.enemiesSpawned}/${enemyCount}`);
      
      if (this.enemiesSpawned >= enemyCount) {
        console.log(`All ${enemyCount} enemies spawned for wave ${waveNumber}`);
        clearInterval(this.spawnInterval);
        this.spawnInterval = null;
        
        // Check if wave is already complete (all enemies processed)
        this.checkWaveCompletion();
      }
    }, spawnInterval);
    
    return true;
  }
  
  // Helper method to check if the wave is complete
  checkWaveCompletion() {
    // Wave is complete if all enemies have been spawned and all have been processed
    // (either killed or reached the end)
    const totalProcessed = this.enemiesKilled + this.enemiesReachedEnd;
    
    console.log(`Wave completion check: Spawned=${this.enemiesSpawned}, Killed=${this.enemiesKilled}, ReachedEnd=${this.enemiesReachedEnd}, Total=${totalProcessed}/${this.enemiesRemaining}`);
    
    if (this.waveInProgress && 
        this.spawnInterval === null && 
        this.enemiesSpawned === this.enemiesRemaining && 
        totalProcessed === this.enemiesRemaining) {
      console.log("All enemies processed - completing wave from checkWaveCompletion");
      this.waveComplete();
    }
  }
  
  spawnEnemy(path) {
    // Create enemy group
    const enemyGroup = new THREE.Group();
    
    // Select random enemy type from available types for this wave
    const enemyType = this.currentWaveEnemyTypes[
      Math.floor(Math.random() * this.currentWaveEnemyTypes.length)
    ];
    
    // Configure enemy stats based on type
    let enemyColor, enemySize, healthMultiplier, speedMultiplier, armor;
    
    switch(enemyType) {
      case 'fast':
        enemyColor = 0x00ffff; // Cyan
        enemySize = 0.9;
        healthMultiplier = 0.7;
        speedMultiplier = 1.5;
        armor = 0;
        break;
        
      case 'tough':
        enemyColor = 0xff9900; // Orange
        enemySize = 1.1;
        healthMultiplier = 1.5;
        speedMultiplier = 0.8;
        armor = 0.1; // 10% damage reduction
        break;
        
      case 'armored':
        enemyColor = 0xcccccc; // Silver
        enemySize = 1.0;
        healthMultiplier = 1.2;
        speedMultiplier = 0.9;
        armor = 0.3; // 30% damage reduction
        break;
        
      case 'boss':
        enemyColor = 0xff5500; // Red-orange
        enemySize = 1.5;
        healthMultiplier = 3.0;
        speedMultiplier = 0.6;
        armor = 0.4; // 40% damage reduction
        break;
        
      case 'elite':
        enemyColor = 0xff00ff; // Magenta
        enemySize = 1.2;
        healthMultiplier = 2.0;
        speedMultiplier = 1.2;
        armor = 0.2; // 20% damage reduction
        break;
        
      case 'normal':
      default:
        enemyColor = 0xff0000; // Red
        enemySize = 1.0;
        healthMultiplier = 1.0;
        speedMultiplier = 1.0;
        armor = 0;
        break;
    }
    
    // Apply wave scaling to the multipliers
    healthMultiplier *= this.currentWaveHealthScaling;
    speedMultiplier *= this.currentWaveSpeedScaling;
    
    // Create enemy body with scaled size
    const bodyGeometry = new THREE.CylinderGeometry(0.5 * enemySize, 0.5 * enemySize, 0.8 * enemySize, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: enemyColor,
      emissive: new THREE.Color(enemyColor).offsetHSL(0, 0, -0.5) // Darker version for glow
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.4 * enemySize;
    enemyGroup.add(bodyMesh);
    
    // Create enemy head - shape varies by enemy type
    let headGeometry;
    
    switch(enemyType) {
      case 'fast':
        headGeometry = new THREE.ConeGeometry(0.35 * enemySize, 0.7 * enemySize, 4);
        break;
        
      case 'tough':
        headGeometry = new THREE.BoxGeometry(0.7 * enemySize, 0.4 * enemySize, 0.7 * enemySize);
        break;
        
      case 'armored':
        headGeometry = new THREE.IcosahedronGeometry(0.35 * enemySize);
        break;
        
      case 'boss':
        headGeometry = new THREE.DodecahedronGeometry(0.35 * enemySize);
        break;
        
      case 'elite':
        headGeometry = new THREE.TorusGeometry(0.25 * enemySize, 0.1 * enemySize);
        break;
        
      case 'normal':
      default:
        headGeometry = new THREE.OctahedronGeometry(0.35 * enemySize, 0);
        break;
    }
    
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: new THREE.Color(enemyColor).offsetHSL(0, 0.2, 0.1),
      emissive: new THREE.Color(enemyColor).offsetHSL(0, 0, -0.3)
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = 0.9 * enemySize;
    enemyGroup.add(headMesh);
    
    // Add a pulsing effect to make enemies more visible
    const pulseLight = new THREE.PointLight(
      new THREE.Color(enemyColor).offsetHSL(0, 0.5, 0), 
      0.8, 
      2 * enemySize
    );
    pulseLight.position.y = 0.6 * enemySize;
    enemyGroup.add(pulseLight);
    
    // Store the pulse light reference for animation
    enemyGroup.userData.pulseLight = pulseLight;
    enemyGroup.userData.pulseTime = Math.random() * Math.PI * 2; // Random starting phase
    enemyGroup.userData.enemyType = enemyType; // Store enemy type for reference
    
    // Add type-specific visual indicators
    if (enemyType === 'armored' || enemyType === 'boss') {
      // Add armor plates
      const plateGeometry = new THREE.RingGeometry(
        0.6 * enemySize, 
        0.7 * enemySize, 
        6
      );
      const plateMaterial = new THREE.MeshLambertMaterial({
        color: 0xaaaaaa,
        side: THREE.DoubleSide
      });
      
      for (let i = 0; i < 3; i++) {
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.rotation.x = Math.PI / 2;
        plate.position.y = (0.3 + i * 0.3) * enemySize;
        enemyGroup.add(plate);
      }
    }
    
    if (enemyType === 'fast') {
      // Add speed trail
      const trailGeometry = new THREE.PlaneGeometry(0.8 * enemySize, 0.4 * enemySize);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: enemyColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.rotation.x = -Math.PI / 2;
      trail.position.y = 0.05;
      trail.position.z = -0.6 * enemySize;
      enemyGroup.add(trail);
    }
    
    if (enemyType === 'elite' || enemyType === 'boss') {
      // Add glowing aura
      const auraGeometry = new THREE.SphereGeometry(0.8 * enemySize, 8, 8);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: enemyColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const aura = new THREE.Mesh(auraGeometry, auraMaterial);
      aura.position.y = 0.6 * enemySize;
      enemyGroup.add(aura);
      
      // Store for animation
      enemyGroup.userData.aura = aura;
    }
    
    // Add health bar
    const healthBarGroup = this.createHealthBar(enemySize);
    healthBarGroup.position.y = 1.6 * enemySize;
    enemyGroup.add(healthBarGroup);
    
    // Set initial position (start cell)
    const startPos = this.gridManager.getWorldPosition(this.gridManager.grid[this.gridManager.startCell.y][this.gridManager.startCell.x]);
    enemyGroup.position.copy(startPos);
    
    // Add to scene
    this.scene.add(enemyGroup);
    
    // Calculate health based on wave number and type
    const baseHealth = 100;
    const waveMultiplier = 1 + (this.waveNumber - 1) * 0.2; // 20% more health per wave
    const maxHealth = Math.floor(baseHealth * waveMultiplier * healthMultiplier);
    
    // Calculate current speed
    const baseSpeed = this.enemySpeed;
    const speed = baseSpeed * speedMultiplier;
    
    // Create enemy object
    const enemy = {
      mesh: enemyGroup,
      healthBar: healthBarGroup.children[0], // The green bar
      health: maxHealth,
      maxHealth: maxHealth,
      currentPathIndex: 0,
      path: path,
      speed: speed,
      reachedEnd: false,
      dead: false,
      pulseTime: 0, // For animation
      type: enemyType,
      armor: armor
    };
    
    this.enemies.push(enemy);
    
    return enemy;
  }
  
  createHealthBar(enemySize = 1.0) {
    const group = new THREE.Group();
    
    // Background bar (red)
    const bgGeometry = new THREE.BoxGeometry(0.8 * enemySize, 0.1 * enemySize, 0.05);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(bgMesh);
    
    // Health bar (green)
    const barGeometry = new THREE.BoxGeometry(0.8 * enemySize, 0.1 * enemySize, 0.06);
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
    
    // Check if wave is complete after removing enemies
    this.checkWaveCompletion();
  }
  
  enemyReachedEnd() {
    // Emit event or callback to game manager
    document.dispatchEvent(new CustomEvent('enemyReachedEnd'));
    this.enemiesReachedEnd++;
    
    console.log(`Enemy reached end, ${this.enemiesReachedEnd} enemies reached end, ${this.enemiesKilled} killed, ${this.enemiesReachedEnd + this.enemiesKilled}/${this.enemiesRemaining} processed`);
    
    // Check if wave is complete
    this.checkWaveCompletion();
  }
  
  damageEnemy(enemy, damage) {
    // Apply armor damage reduction if enemy has armor
    if (enemy.armor) {
      const damageReduction = damage * enemy.armor;
      damage = Math.max(1, damage - damageReduction); // Ensure at least 1 damage is dealt
    }
    
    enemy.health -= damage;
    
    // Update health bar scale
    const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
    enemy.healthBar.scale.x = healthPercent;
    
    // Position the bar correctly (centered)
    enemy.healthBar.position.x = (0.5 - healthPercent / 2) * -0.8;
    
    // If enemy died
    if (enemy.health <= 0 && !enemy.dead) {
      enemy.dead = true;
      this.scene.remove(enemy.mesh);
      this.enemiesKilled++; // Count killed enemies
      
      console.log(`Enemy killed, ${this.enemiesKilled} enemies killed, ${this.enemiesReachedEnd} reached end, ${this.enemiesKilled + this.enemiesReachedEnd}/${this.enemiesRemaining} processed`);
      
      // Dispatch event
      document.dispatchEvent(new CustomEvent('enemyKilled', { 
        detail: { 
          enemy: enemy,
          enemyType: enemy.type
        } 
      }));
      
      // Check if wave is complete
      this.checkWaveCompletion();
    }
  }
  
  waveComplete() {
    console.log(`Wave ${this.waveNumber} completed!`);
    
    // Make sure we're not calling this multiple times
    if (!this.waveInProgress) return;
    
    this.waveInProgress = false;
    
    // Clear any remaining spawn interval
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    
    // Update wave number for next wave
    const completedWave = this.waveNumber;
    this.waveNumber++;
    
    // Emit event or callback to game manager
    document.dispatchEvent(new CustomEvent('waveCompleted', { 
      detail: { 
        waveNumber: completedWave,
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
  
  // Get the number of active enemies
  getActiveEnemyCount() {
    return this.enemies.length;
  }
} 