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
    
    // Prerender SVG icons for better performance
    this.prerenderedIcons = {};
    this.prerenderTowerIcons();
    
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
    
    // Create tower group
    const towerGroup = new THREE.Group();
    
    // Create icon as the main tower representation
    const iconSprite = this.createIconPlane(towerType.icon, towerType.color);
    iconSprite.scale.set(1.0, 1.0, 1.0); // Make icon larger
    iconSprite.position.set(0, 0.5, 0); // Position it just above the ground
    towerGroup.add(iconSprite);
    
    // Create a small platform for the icon
    const platformGeometry = new THREE.CircleGeometry(0.5, 16);
    const platformMaterial = new THREE.MeshBasicMaterial({ 
      color: towerType.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2; // Lay flat
    platform.position.y = 0.01; // Just above ground
    towerGroup.add(platform);
    
    // Add glow effect
    const glowGeometry = new THREE.CircleGeometry(0.7, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: towerType.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2; // Lay flat
    glow.position.y = 0.005; // Just above ground
    glow.userData.pulseTime = 0; // For animation
    towerGroup.add(glow);
    
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
    rangeIndicator.position.y = 0.02;
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
      turret: iconSprite, // Use the icon as the turret for aiming
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
  
  // Prerender all tower icons for better performance
  prerenderTowerIcons() {
    this.towerTypes.forEach(tower => {
      if (tower.svgIcon) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Fill with transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 128, 128);
        
        // Draw a colored circle as background
        ctx.fillStyle = `#${new THREE.Color(tower.color).getHexString()}`;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(64, 64, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw a simple shape based on tower type
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'white';
        
        // Draw different shapes based on tower type
        switch(tower.id) {
          case 1: // Basic Tower - single rectangle
            ctx.fillRect(56, 30, 16, 70);
            break;
          
          case 2: // Double Tower - two rectangles
            ctx.fillRect(46, 30, 12, 70);
            ctx.fillRect(70, 30, 12, 70);
            break;
          
          case 3: // Triple Tower - three rectangles
            ctx.fillRect(38, 30, 10, 70);
            ctx.fillRect(59, 30, 10, 70);
            ctx.fillRect(80, 30, 10, 70);
            break;
          
          case 4: // Lightning Tower
            ctx.beginPath();
            ctx.moveTo(50, 30);
            ctx.lineTo(70, 30);
            ctx.lineTo(60, 55);
            ctx.lineTo(80, 55);
            ctx.lineTo(40, 100);
            ctx.lineTo(50, 65);
            ctx.lineTo(30, 65);
            ctx.closePath();
            ctx.fill();
            break;
          
          case 5: // Cannon Tower - concentric circles
            ctx.beginPath();
            ctx.arc(64, 64, 35, 0, Math.PI * 2);
            ctx.globalAlpha = 0.3;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(64, 64, 25, 0, Math.PI * 2);
            ctx.globalAlpha = 0.5;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(64, 64, 15, 0, Math.PI * 2);
            ctx.globalAlpha = 1.0;
            ctx.fill();
            break;
          
          case 6: // Plasma Tower - swirl
            ctx.lineWidth = 6;
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.arc(64, 64, 35, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add a swirl effect
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(64, 64, 20, i * 2, i * 2 + Math.PI);
              ctx.stroke();
            }
            break;
          
          case 7: // Laser Tower - crosshair
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'white';
            
            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(20, 64);
            ctx.lineTo(108, 64);
            ctx.stroke();
            
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(64, 20);
            ctx.lineTo(64, 108);
            ctx.stroke();
            
            // Center circle
            ctx.beginPath();
            ctx.arc(64, 64, 15, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          case 8: // Photon Tower - star shape
            ctx.beginPath();
            // Draw 8-point star
            for (let i = 0; i < 8; i++) {
              const angle = i * Math.PI / 4;
              const x1 = 64 + Math.cos(angle) * 40;
              const y1 = 64 + Math.sin(angle) * 40;
              const x2 = 64 + Math.cos(angle + Math.PI/8) * 20;
              const y2 = 64 + Math.sin(angle + Math.PI/8) * 20;
              
              if (i === 0) {
                ctx.moveTo(x1, y1);
              } else {
                ctx.lineTo(x1, y1);
              }
              ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            break;
          
          case 9: // Nova Tower - burst star
            ctx.beginPath();
            // Draw 12-point star
            for (let i = 0; i < 12; i++) {
              const angle = i * Math.PI / 6;
              const radius = i % 2 === 0 ? 40 : 20;
              const x = 64 + Math.cos(angle) * radius;
              const y = 64 + Math.sin(angle) * radius;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.closePath();
            ctx.fill();
            break;
          
          case 10: // Quantum Tower - atom
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            
            // Central nucleus
            ctx.beginPath();
            ctx.arc(64, 64, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Electron orbits
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.ellipse(64, 64, 40, 20, i * Math.PI / 3, 0, Math.PI * 2);
              ctx.stroke();
            }
            break;
          
          case 11: // Vortex Tower - spiral
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            
            // Draw a spiral
            ctx.beginPath();
            for (let angle = 0; angle < 12 * Math.PI; angle += 0.1) {
              const radius = 5 + angle * 1.5;
              const x = 64 + Math.cos(angle) * radius;
              const y = 64 + Math.sin(angle) * radius;
              
              if (angle === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
            break;
          
          case 12: // Supernova Tower - explosive burst
            // Draw a complex starburst
            for (let i = 0; i < 16; i++) {
              const angle = i * Math.PI / 8;
              ctx.beginPath();
              ctx.moveTo(64, 64);
              ctx.lineTo(
                64 + Math.cos(angle) * 50,
                64 + Math.sin(angle) * 50
              );
              ctx.lineWidth = 3 + Math.random() * 3;
              ctx.stroke();
            }
            
            // Center circle
            ctx.beginPath();
            ctx.arc(64, 64, 15, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          default:
            // Fallback to text
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tower.id.toString(), 64, 64);
        }
        
        // Create a glowing halo effect
        ctx.globalAlpha = 0.5;
        ctx.globalCompositeOperation = 'destination-over';
        const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
        gradient.addColorStop(0, `rgba(${new THREE.Color(tower.color).r * 255}, ${new THREE.Color(tower.color).g * 255}, ${new THREE.Color(tower.color).b * 255}, 0.7)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        // Create and store the texture
        const texture = new THREE.CanvasTexture(canvas);
        this.prerenderedIcons[tower.id] = Promise.resolve(texture);
      }
    });
  }
  
  // Create a floating icon plane that always faces the camera
  createIconPlane(iconText, towerColor) {
    const towerType = this.towerTypes.find(t => t.icon === iconText);
    
    if (towerType && this.prerenderedIcons[towerType.id]) {
      // Use prerendered icon if available
      const material = new THREE.SpriteMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.0, 1.0, 1);
      
      // Set the texture when it's loaded
      this.prerenderedIcons[towerType.id].then(texture => {
        if (texture) {
          material.map = texture;
          material.needsUpdate = true;
        } else {
          // Fallback to basic icon if texture failed to load
          this.createBasicIconTexture(material, iconText, towerColor);
        }
      });
      
      return sprite;
    } else {
      // Fallback to basic icon approach
      return this.createBasicIconSprite(iconText, towerColor);
    }
  }
  
  // Create a basic icon texture for fallback
  createBasicIconTexture(material, iconText, towerColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw the icon text
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(iconText, 64, 64);
    
    // Create a glowing halo effect
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${new THREE.Color(towerColor).r * 255}, ${new THREE.Color(towerColor).g * 255}, ${new THREE.Color(towerColor).b * 255}, 0.7)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    // Update material with new texture
    material.map = new THREE.CanvasTexture(canvas);
    material.needsUpdate = true;
  }
  
  // Create a basic icon sprite for fallback
  createBasicIconSprite(iconText, towerColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 128, 128);
    
    // Draw the icon
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(iconText, 64, 64);
    
    // Create a glowing halo effect
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${new THREE.Color(towerColor).r * 255}, ${new THREE.Color(towerColor).g * 255}, ${new THREE.Color(towerColor).b * 255}, 0.7)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.0, 1.0, 1);
    
    return sprite;
  }
  
  update(deltaTime, enemyManager) {
    const currentTime = performance.now() / 1000;
    
    // Update path marker animations
    this.updatePathMarkers(deltaTime);
    
    // Update tower icon animations
    this.updateTowerAnimations(deltaTime);
    
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
    // No physical rotation needed for a 2D icon
    // The firing line will show the aim direction
  }
  
  fireTower(tower, target, enemyManager) {
    // Get icon position (center of the tower)
    const towerPosition = tower.mesh.position.clone();
    towerPosition.y += 0.5; // Adjust to match icon height
    
    // Create line from tower to target
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      towerPosition,
      target.mesh.position.clone()
    ]);
    
    let lineColor;
    
    // Different colors based on tower type
    switch(tower.type) {
      case 4: // Lightning
        lineColor = 0xffff00; // Yellow
        break;
      case 6: // Plasma
        lineColor = 0x9900ff; // Purple
        break;
      case 7: // Laser
        lineColor = 0xff0000; // Red
        break;
      case 12: // Supernova
        lineColor = 0xff00ff; // Magenta
        break;
      default:
        lineColor = 0x00ffff; // Cyan
    }
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: lineColor,
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
  
  // Add a new method to update tower animations
  updateTowerAnimations(deltaTime) {
    const currentTime = performance.now() / 1000;
    
    for (const tower of this.towers) {
      // Find the glow mesh in the tower
      const glowMesh = tower.mesh.children.find(child => 
        child.userData.pulseTime !== undefined);
      
      if (glowMesh) {
        // Update pulse time
        glowMesh.userData.pulseTime += deltaTime;
        
        // Calculate scale based on sine wave
        const pulseScale = 1 + 0.2 * Math.sin(glowMesh.userData.pulseTime * 2);
        
        // Apply scale to glow
        glowMesh.scale.set(pulseScale, pulseScale, 1);
        
        // Animate opacity
        if (glowMesh.material) {
          glowMesh.material.opacity = 0.1 + 0.2 * Math.abs(Math.sin(glowMesh.userData.pulseTime * 2));
        }
      }
      
      // Also pulse the icon sprite
      const iconSprite = tower.turret;
      if (iconSprite) {
        const pulseAmount = 0.05 * Math.sin(currentTime * 3);
        iconSprite.scale.set(1.0 + pulseAmount, 1.0 + pulseAmount, 1);
      }
    }
  }
} 