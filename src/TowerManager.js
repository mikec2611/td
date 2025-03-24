import { TOWER_TYPES } from './TowerTypes.js';

export class TowerManager {
  constructor(scene, gridManager, towerTypes) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.towers = [];
    
    // Store tower types
    this.towerTypes = towerTypes || [];
    
    // Select the first tower type by default
    this.selectedTowerType = this.towerTypes[0];
    
    // Create a group for path visualization
    this.pathVisualization = new THREE.Group();
    this.pathVisualization.visible = false;
    scene.add(this.pathVisualization);
    
    // Listen for path changes
    document.addEventListener('pathChanged', this.onPathChanged.bind(this));
    
    // Prerender tower icons if they have SVG paths
    this.prerenderedIcons = {};
    this.prerenderTowerIcons();
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
    
    // Determine tower color
    const towerColor = new THREE.Color(towerType.color);
    
    // Build different tower visuals based on faction
    const faction = towerType.faction || 'tech';
    
    // Base height for different tower sizes
    const baseHeight = 0.2;
    const middleHeight = 0.3;
    const topHeight = 0.2;
    
    // Create tower base (common across all factions but with different colors)
    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, baseHeight, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: towerColor,
      metalness: 0.3,
      roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = baseHeight/2;
    towerGroup.add(base);
    
    // Create tower middle section
    const middleGeometry = new THREE.CylinderGeometry(0.3, 0.4, middleHeight, 8);
    const middleMaterial = new THREE.MeshStandardMaterial({
      color: towerColor,
      metalness: 0.5,
      roughness: 0.5,
      emissive: towerColor,
      emissiveIntensity: 0.2
    });
    const middle = new THREE.Mesh(middleGeometry, middleMaterial);
    middle.position.y = baseHeight + middleHeight/2;
    towerGroup.add(middle);
    
    // Create tower top
    const topGeometry = new THREE.CylinderGeometry(0.2, 0.3, topHeight, 8);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: towerColor,
      metalness: 0.7,
      roughness: 0.3,
      emissive: towerColor,
      emissiveIntensity: 0.4
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = baseHeight + middleHeight + topHeight/2;
    towerGroup.add(top);
    
    // Create turret mount
    const mountGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
    const mountMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    const mount = new THREE.Mesh(mountGeometry, mountMaterial);
    mount.position.y = baseHeight + middleHeight + topHeight + 0.05;
    towerGroup.add(mount);
    
    // Create turret based on faction
    let turret;
    const turretY = baseHeight + middleHeight + topHeight + 0.1;
    
    // Setup different turrets based on faction
    if (faction === 'tech') {
      // Tech faction - precise mechanical design
      const turretGroup = new THREE.Group();
      
      // Create base turret part
      const turretBaseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
      const turretBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.1
      });
      const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
      turretGroup.add(turretBase);
      
      // Create barrel(s) based on tower type
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: towerColor,
        metalness: 0.8,
        roughness: 0.2
      });
      
      if (towerType.id <= 3) {
        // Basic towers have 1-3 barrels
        for (let i = 0; i < towerType.id; i++) {
          const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.4, 8);
          const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
          barrel.rotation.x = Math.PI / 2; // Rotate to horizontal
          
          // Position based on number of barrels
          if (towerType.id === 1) {
            barrel.position.z = 0.2;
          } else if (towerType.id === 2) {
            barrel.position.set((i === 0 ? -0.1 : 0.1), 0, 0.2);
          } else {
            barrel.position.set((i - 1) * 0.1, 0, 0.2);
          }
          
          turretGroup.add(barrel);
        }
      } else if (towerType.id <= 6) {
        // Mid-tier towers have more complex designs
        if (towerType.id === 4) {
          // Railgun - long single barrel
          const barrelGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.6, 8);
          const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
          barrel.rotation.x = Math.PI / 2;
          barrel.position.z = 0.3;
          turretGroup.add(barrel);
          
          // Add power coils
          const coilGeometry = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
          const coilMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            emissive: towerColor,
            emissiveIntensity: 0.5
          });
          
          for (let i = 0; i < 2; i++) {
            const coil = new THREE.Mesh(coilGeometry, coilMaterial);
            coil.rotation.x = Math.PI / 2;
            coil.position.z = 0.15 + i * 0.15;
            turretGroup.add(coil);
          }
        } else if (towerType.id === 5) {
          // Pulse cannon - large dome
          const domeGeometry = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
          const dome = new THREE.Mesh(domeGeometry, barrelMaterial);
          dome.rotation.x = -Math.PI / 2;
          turretGroup.add(dome);
          
          // Add emitter in center
          const emitterGeometry = new THREE.SphereGeometry(0.08);
          const emitterMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: towerColor,
            emissiveIntensity: 0.8
          });
          const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
          emitter.position.y = 0.05;
          turretGroup.add(emitter);
        } else {
          // Tactical matrix - grid structure
          const gridSize = 0.3;
          const gridMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            metalness: 0.7,
            emissive: towerColor,
            emissiveIntensity: 0.3
          });
          
          // Horizontal bars
          for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(
              new THREE.BoxGeometry(gridSize, 0.02, 0.02),
              gridMaterial
            );
            bar.position.y = -0.05 + i * 0.05;
            turretGroup.add(bar);
          }
          
          // Vertical bars
          for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(
              new THREE.BoxGeometry(0.02, 0.02, gridSize),
              gridMaterial
            );
            bar.position.y = -0.05 + i * 0.05;
            turretGroup.add(bar);
          }
        }
      } else {
        // Higher tier towers have advanced tech
        if (towerType.id <= 9) {
          // Advanced sensor/emitter based on technology level
          const dishGeometry = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
          const dish = new THREE.Mesh(dishGeometry, barrelMaterial);
          dish.rotation.x = Math.PI / 4;
          turretGroup.add(dish);
          
          // Add emitter arrays
          const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 8);
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: towerColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          });
          
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.15;
          turretGroup.add(ring);
        } else {
          // Ultimate tech towers
          // Create a complex structure with moving/rotating parts
          const coreGeometry = new THREE.SphereGeometry(0.12);
          const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: towerColor,
            emissiveIntensity: 0.9
          });
          const core = new THREE.Mesh(coreGeometry, coreMaterial);
          turretGroup.add(core);
          
          // Orbiting rings
          const ringMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
          });
          
          for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.RingGeometry(0.15, 0.18, 32);
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Different rotation for each ring
            if (i === 0) {
              ring.rotation.x = Math.PI / 2;
            } else if (i === 1) {
              ring.rotation.x = Math.PI / 4;
              ring.rotation.y = Math.PI / 4;
            } else {
              ring.rotation.x = Math.PI / 3;
              ring.rotation.z = Math.PI / 3;
            }
            
            turretGroup.add(ring);
          }
        }
      }
      
      turret = turretGroup;
    } else if (faction === 'energy') {
      // Energy faction - glowing, energy-based designs
      const turretGroup = new THREE.Group();
      
      // Base emitter part
      const baseEmitterGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 16);
      const baseEmitterMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.2
      });
      const baseEmitter = new THREE.Mesh(baseEmitterGeometry, baseEmitterMaterial);
      turretGroup.add(baseEmitter);
      
      // Create energy effect based on tower type
      const energyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: towerColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      
      if (towerType.id <= 3) {
        // Basic energy emitters - orbs or arcs
        const sphereGeometry = new THREE.SphereGeometry(0.1 * towerType.id / 2);
        const energySphere = new THREE.Mesh(sphereGeometry, energyMaterial);
        energySphere.position.y = 0.1;
        turretGroup.add(energySphere);
        
        // Add energy beams for higher tiers
        if (towerType.id >= 2) {
          for (let i = 0; i < towerType.id; i++) {
            const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
            const beam = new THREE.Mesh(beamGeometry, energyMaterial);
            
            // Position in different directions
            const angle = (i / towerType.id) * Math.PI * 2;
            beam.position.set(
              Math.cos(angle) * 0.15,
              0.15,
              Math.sin(angle) * 0.15
            );
            
            // Rotate to point outward
            beam.rotation.z = Math.PI / 2;
            beam.rotation.y = -angle;
            
            turretGroup.add(beam);
          }
        }
      } else if (towerType.id <= 6) {
        // Mid-tier energy towers - contained plasma, fusion effects
        const coreGeometry = new THREE.SphereGeometry(0.15);
        const core = new THREE.Mesh(coreGeometry, energyMaterial);
        core.position.y = 0.15;
        turretGroup.add(core);
        
        // Add containment rings or emitters
        const ringGeometry = new THREE.TorusGeometry(0.2, 0.02, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: towerColor,
          emissive: towerColor,
          emissiveIntensity: 0.4
        });
        
        // Create rings at different angles
        for (let i = 0; i < 2; i++) {
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          
          if (i === 0) {
            ring.rotation.x = Math.PI / 2;
          } else {
            ring.rotation.z = Math.PI / 2;
          }
          
          ring.position.y = 0.15;
          turretGroup.add(ring);
        }
      } else {
        // High-tier energy towers - complex energy fields
        // Create a pulsing core
        const coreGeometry = new THREE.SphereGeometry(0.2);
        const coreMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: towerColor,
          emissiveIntensity: 1.0,
          transparent: true,
          opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.15;
        turretGroup.add(core);
        
        // Add energy rays emanating outward
        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          const rayGeometry = new THREE.CylinderGeometry(0.01, 0.03, 0.3, 4);
          const ray = new THREE.Mesh(rayGeometry, energyMaterial);
          
          ray.position.set(
            Math.cos(angle) * 0.15,
            0.15,
            Math.sin(angle) * 0.15
          );
          
          ray.rotation.z = Math.PI / 2;
          ray.rotation.y = -angle;
          
          turretGroup.add(ray);
        }
      }
      
      turret = turretGroup;
    } else if (faction === 'elemental') {
      // Elemental faction - natural, organic designs
      const turretGroup = new THREE.Group();
      
      // Earthy base
      const baseGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4037, // Brown
        roughness: 0.9
      });
      const elementalBase = new THREE.Mesh(baseGeometry, baseMaterial);
      turretGroup.add(elementalBase);
      
      // Create elemental effect based on tower type
      if (towerType.id <= 3) {
        // Nature-themed low tier
        if (towerType.id === 1) {
          // Small plant sprout
          const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.2, 8);
          const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x558b2f, // Green
            roughness: 0.7
          });
          const stem = new THREE.Mesh(stemGeometry, stemMaterial);
          stem.position.y = 0.1;
          turretGroup.add(stem);
          
          // Flower top
          const flowerGeometry = new THREE.SphereGeometry(0.1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
          const flowerMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            roughness: 0.6
          });
          const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
          flower.rotation.x = Math.PI; // Turn upside down
          flower.position.y = 0.2;
          turretGroup.add(flower);
        } else if (towerType.id === 2) {
          // Thorny plant
          const thornMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            roughness: 0.7
          });
          
          // Add several thorns
          for (let i = 0; i < 5; i++) {
            const thornGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
            const thorn = new THREE.Mesh(thornGeometry, thornMaterial);
            
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.1;
            
            thorn.position.set(
              Math.cos(angle) * radius,
              0.07,
              Math.sin(angle) * radius
            );
            
            // Angle outward
            const lookAt = new THREE.Vector3(
              Math.cos(angle) * 2,
              0.5,
              Math.sin(angle) * 2
            );
            thorn.lookAt(lookAt);
            
            turretGroup.add(thorn);
          }
        } else {
          // Wind current effect
          const windMaterial = new THREE.MeshBasicMaterial({
            color: towerColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
          });
          
          // Create swirling planes
          for (let i = 0; i < 3; i++) {
            const windGeometry = new THREE.PlaneGeometry(0.3, 0.1);
            const wind = new THREE.Mesh(windGeometry, windMaterial);
            
            // Position at different heights with wave effect
            wind.position.y = 0.1 + i * 0.05;
            wind.rotation.x = Math.PI / 2;
            wind.rotation.z = (i / 3) * Math.PI;
            
            turretGroup.add(wind);
          }
        }
      } else if (towerType.id <= 6) {
        // Mid-tier elemental - stone/water/ice
        if (towerType.id === 4) {
          // Stone spire
          const spireGeometry = new THREE.ConeGeometry(0.15, 0.3, 5);
          const spireMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575, // Gray
            roughness: 0.9
          });
          const spire = new THREE.Mesh(spireGeometry, spireMaterial);
          spire.position.y = 0.15;
          turretGroup.add(spire);
          
          // Add crystals
          const crystalMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            emissive: towerColor,
            emissiveIntensity: 0.3,
            roughness: 0.2
          });
          
          for (let i = 0; i < 3; i++) {
            const crystalGeometry = new THREE.ConeGeometry(0.03, 0.1, 4);
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            crystal.position.set(
              Math.cos(angle) * 0.07,
              0.2,
              Math.sin(angle) * 0.07
            );
            
            crystal.rotation.x = Math.PI / 4;
            crystal.rotation.z = angle;
            
            turretGroup.add(crystal);
          }
        } else if (towerType.id === 5) {
          // Ice formation
          const iceMaterial = new THREE.MeshStandardMaterial({
            color: towerColor,
            metalness: 0.9,
            roughness: 0.2,
            transparent: true,
            opacity: 0.7
          });
          
          // Create ice crystals
          for (let i = 0; i < 6; i++) {
            const iceGeometry = new THREE.ConeGeometry(0.04, 0.2, 4);
            const ice = new THREE.Mesh(iceGeometry, iceMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            const radius = 0.1;
            
            ice.position.set(
              Math.cos(angle) * radius,
              0.1,
              Math.sin(angle) * radius
            );
            
            // Angle slightly outward
            ice.rotation.x = Math.PI / 6;
            ice.rotation.z = angle;
            
            turretGroup.add(ice);
          }
        } else {
          // Poison cloud
          const cloudMaterial = new THREE.MeshBasicMaterial({
            color: towerColor,
            transparent: true,
            opacity: 0.4
          });
          
          // Create overlapping spheres for cloud effect
          for (let i = 0; i < 5; i++) {
            const cloudGeometry = new THREE.SphereGeometry(0.1);
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.08;
            
            cloud.position.set(
              Math.cos(angle) * radius,
              0.15,
              Math.sin(angle) * radius
            );
            
            turretGroup.add(cloud);
          }
          
          // Center cloud
          const centerGeometry = new THREE.SphereGeometry(0.12);
          const center = new THREE.Mesh(centerGeometry, cloudMaterial);
          center.position.y = 0.15;
          turretGroup.add(center);
        }
      } else {
        // High-tier elemental - combined forces
        // Create a swirling elemental core
        const coreGeometry = new THREE.SphereGeometry(0.15);
        const coreMaterial = new THREE.MeshStandardMaterial({
          color: towerColor,
          emissive: towerColor,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.15;
        turretGroup.add(core);
        
        // Add elemental emanations
        const elementCount = 4;
        for (let i = 0; i < elementCount; i++) {
          const angle = (i / elementCount) * Math.PI * 2;
          const leafGeometry = new THREE.PlaneGeometry(0.15, 0.2);
          const leafMaterial = new THREE.MeshBasicMaterial({
            color: towerColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          });
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          
          leaf.position.set(
            Math.cos(angle) * 0.15,
            0.15,
            Math.sin(angle) * 0.15
          );
          
          leaf.lookAt(new THREE.Vector3(
            Math.cos(angle) * 2,
            0.15,
            Math.sin(angle) * 2
          ));
          
          turretGroup.add(leaf);
        }
      }
      
      turret = turretGroup;
    } else {
      // Default fallback turret
      turret = this.createDefaultTurret(towerColor);
    }
    
    // Position turret on top of mount
    turret.position.y = turretY;
    towerGroup.add(turret);
    
    // Create floating icon above tower
    const iconPlane = this.createIconPlane(towerType.icon, towerType.color);
    iconPlane.position.y = baseHeight + middleHeight + topHeight + 0.8;
    towerGroup.add(iconPlane);
    
    // Add level indicator text
    const canvasTexture = this.createTextTexture(towerType.id.toString(), towerColor);
    const levelIndicator = new THREE.Sprite(new THREE.SpriteMaterial({ 
      map: canvasTexture,
      transparent: true
    }));
    levelIndicator.scale.set(0.5, 0.5, 0.5);
    levelIndicator.position.set(0, baseHeight / 2, 0);
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
      turret: turret, // Use the turret for aiming
      rangeIndicator: rangeIndicator,
      x: x,
      y: y,
      range: towerType.range,
      damage: towerType.damage,
      fireRate: towerType.fireRate,
      lastFired: 0,
      target: null,
      type: towerType.id,
      faction: towerType.faction
    };
    
    this.towers.push(tower);
    
    return tower;
  }
  
  // Create a simple label with text
  createTextTexture(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);
    
    // Draw circle background
    ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  // Create default turret (fallback)
  createDefaultTurret(color) {
    const group = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3
    });
    const barrel = new THREE.Mesh(geometry, material);
    barrel.position.z = 0.1;
    group.add(barrel);
    
    return group;
  }
  
  // Prerender all tower icons for better performance
  prerenderTowerIcons() {
    // Skip if no tower types are defined
    if (!this.towerTypes || this.towerTypes.length === 0) {
      console.warn('No tower types available for prerendering icons');
      return;
    }
    
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
  
  // Create icon plane that always faces the camera
  createIconPlane(iconText, color) {
    // Create a sprite with a custom texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Clear with transparent background
    ctx.clearRect(0, 0, 64, 64);
    
    // Draw a circular background with tower color
    ctx.fillStyle = `#${new THREE.Color(color).getHexString()}`;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the icon text
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconText, 32, 28);
    
    // Create texture and sprite material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.6, 0.6, 0.6);
    
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