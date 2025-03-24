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
  
  startWave(waveNumber = this.waveNumber, enemyCount = 10, enemyTypes = ['normal'], healthScaling = 1.0, speedScaling = 1.0, armorScaling = 1.0) {
    if (this.waveInProgress) return false;
    
    console.log(`Starting wave ${waveNumber} with ${enemyCount} enemies of types: ${enemyTypes.join(', ')}`);
    console.log(`Health scaling: ${healthScaling}x, Speed scaling: ${speedScaling}x, Armor scaling: ${armorScaling}x`);
    
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
    this.currentWaveArmorScaling = armorScaling;
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
    // If wave is not in progress, don't check
    if (!this.waveInProgress) {
      return;
    }
    
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
        
      default: // normal
        enemyColor = 0xff0000; // Red
        enemySize = 1.0;
        healthMultiplier = 1.0;
        speedMultiplier = 1.0;
        armor = 0;
        break;
    }
    
    // Apply wave scaling to enemy stats
    const baseHealth = 100;
    const baseSpeed = this.enemySpeed;
    
    // Calculate final values using both type multipliers and wave scaling
    const finalHealth = baseHealth * healthMultiplier * this.currentWaveHealthScaling;
    const finalSpeed = baseSpeed * speedMultiplier * this.currentWaveSpeedScaling;
    
    // Apply armor scaling only to enemies that have armor
    const finalArmor = (armor > 0) ? armor * this.currentWaveArmorScaling : armor;
    
    // Visual scaling to represent increasing difficulty
    // The higher the wave, the more intense the enemy looks
    const waveVisualIntensity = Math.min(1, (this.waveNumber - 1) * 0.04); // Caps at 100% extra intensity
    
    // Create enemy body with scaled size
    const geometry = new THREE.BoxGeometry(enemySize, enemySize, enemySize);
    
    // Apply visual enhancements based on wave difficulty
    let material;
    
    if (this.waveNumber > 15) {
      // Advanced enemies get emissive material to glow
      material = new THREE.MeshStandardMaterial({
        color: enemyColor,
        emissive: enemyColor,
        emissiveIntensity: 0.3 + waveVisualIntensity * 0.7, // More glow at higher waves
        metalness: finalArmor * 0.7, // Armored enemies look more metallic
        roughness: 0.3
      });
    } else {
      // Basic material for earlier waves
      material = new THREE.MeshStandardMaterial({
        color: enemyColor,
        metalness: finalArmor * 0.5,
        roughness: 0.5
      });
    }
    
    const enemyMesh = new THREE.Mesh(geometry, material);
    enemyMesh.castShadow = true;
    enemyMesh.receiveShadow = true;
    
    // Add visual indicators for powerful enemies
    if (this.currentWaveHealthScaling > 2.0 || enemyType === 'boss' || enemyType === 'elite') {
      // Add a pulsing glow effect or particle system
      const glowGeometry = new THREE.SphereGeometry(enemySize * 1.2, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: enemyColor,
        transparent: true,
        opacity: 0.3
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      enemyGroup.add(glowMesh);
    }
    
    enemyGroup.add(enemyMesh);
    
    // Position at the start of the path
    const startCell = path[0];
    const startPos = this.gridManager.getWorldPosition(startCell);
    enemyGroup.position.copy(startPos);
    
    // Add health bar
    const healthBarWidth = 0.8;
    const healthBarHeight = 0.15;
    const healthBarGroup = new THREE.Group();
    
    // Health bar background (black)
    const healthBarBgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
    healthBarGroup.add(healthBarBg);
    
    // Health bar foreground (green)
    const healthBarFgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
    const healthBarFgMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthBarFg = new THREE.Mesh(healthBarFgGeometry, healthBarFgMaterial);
    
    // Position the health bar slightly to the left (centered)
    healthBarFg.position.x = 0;
    
    healthBarGroup.add(healthBarFg);
    
    // Position health bar above enemy
    healthBarGroup.position.y = enemySize / 2 + 0.3;
    healthBarGroup.rotation.x = -Math.PI / 2; // Face camera (assuming top-down view)
    
    enemyGroup.add(healthBarGroup);
    
    // Add to scene
    this.scene.add(enemyGroup);
    
    // Create enemy object
    const enemy = {
      mesh: enemyGroup,
      healthBar: healthBarFg, // The green bar
      health: finalHealth,
      maxHealth: finalHealth,
      currentPathIndex: 0,
      path: path,
      speed: finalSpeed,
      reachedEnd: false,
      dead: false,
      pulseTime: 0, // For animation
      type: enemyType,
      armor: finalArmor
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