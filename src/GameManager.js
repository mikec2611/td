export class GameManager {
  constructor(gridManager, enemyManager, towerManager) {
    this.gridManager = gridManager;
    this.enemyManager = enemyManager;
    this.towerManager = towerManager;
    
    this.money = 100;
    this.lives = 10;
    this.score = 0;
    this.waveNumber = 1;
    
    // Enemy wave configuration
    this.enemySpawnCount = 10; // Base number of enemies per wave
    this.enemyTypes = ['normal']; // Available enemy types
    
    this.buildMode = null;
    this.lastUpdateTime = performance.now() / 1000;
    
    // Developer mode
    this.devMode = false;
    this.originalEnemySpeed = this.enemyManager.enemySpeed;
    
    // UI elements
    this.goldDisplay = document.getElementById('money');
    this.healthDisplay = document.getElementById('lives');
    this.waveDisplay = document.getElementById('wave');
    this.enemiesDisplay = document.getElementById('enemies-remaining') || document.createElement('span');
    this.gameInfoDisplay = document.getElementById('game-info') || document.createElement('div');
    this.notificationArea = document.getElementById('notification-area');
    
    // Event listeners
    document.addEventListener('enemyReachedEnd', this.onEnemyReachedEnd.bind(this));
    document.addEventListener('enemyKilled', this.onEnemyKilled.bind(this));
    document.addEventListener('waveCompleted', this.onWaveCompleted.bind(this));
    document.addEventListener('pathChanged', this.onPathChanged.bind(this));
    
    // Developer mode toggle
    const devModeButton = document.getElementById('toggle-dev-mode');
    if (devModeButton) {
      devModeButton.addEventListener('click', () => this.toggleDevMode());
    }
    
    // Initial UI update
    this.updateUI();
  }
  
  toggleDevMode() {
    this.devMode = !this.devMode;
    
    const devModeButton = document.getElementById('toggle-dev-mode');
    
    if (this.devMode) {
      // Enable dev mode
      devModeButton.classList.add('active');
      this.enemyManager.enemySpeed = this.originalEnemySpeed * 10; // 10x faster enemies
      
      // Display dev mode notification
      this.showNotification('DEVELOPER MODE ENABLED', '#ff0000');
    } else {
      // Disable dev mode
      devModeButton.classList.remove('active');
      this.enemyManager.enemySpeed = this.originalEnemySpeed; // Reset enemy speed
      
      // Display dev mode notification
      this.showNotification('DEVELOPER MODE DISABLED', '#ffffff');
    }
    
    // Update UI to show unlimited money if dev mode is on
    this.updateUI();
  }
  
  showNotification(message, color) {
    if (this.notificationArea) {
      // Clear any existing notifications
      clearTimeout(this.notificationTimeout);
      
      // Update the notification area
      this.notificationArea.textContent = message;
      this.notificationArea.style.color = color;
      
      // Store the original background color if not already stored
      if (!this.originalNotificationBg) {
        this.originalNotificationBg = window.getComputedStyle(this.notificationArea).backgroundColor;
      }
      
      // Add a slightly different background for emphasis
      this.notificationArea.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      
      // Set a timeout to clear the notification
      this.notificationTimeout = setTimeout(() => {
        this.notificationArea.textContent = '';
        this.notificationArea.style.backgroundColor = this.originalNotificationBg;
      }, 3000);
    } else {
      // Fallback to creating a temporary notification if notification area doesn't exist
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.position = 'absolute';
      notification.style.top = '10px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.color = color;
      notification.style.fontSize = '20px';
      notification.style.fontWeight = 'bold';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '100';
      document.body.appendChild(notification);
      
      // Remove notification after delay
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }
  
  update() {
    const currentTime = performance.now() / 1000;
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Update enemy manager
    this.enemyManager.update(deltaTime);
    
    // Update tower manager
    this.towerManager.update(deltaTime, this.enemyManager);
    
    // Update enemies display
    if (this.enemiesDisplay) {
      this.enemiesDisplay.textContent = this.enemyManager.getActiveEnemyCount();
    }
  }
  
  handleCellClick(cell) {
    // Check if we have enough money to build the selected tower
    const towerCost = this.towerManager.getTowerCost();
    
    // In dev mode, ignore money requirements
    if (this.devMode || this.money >= towerCost) {
      // Try to build tower
      const tower = this.towerManager.buildTower(cell.x, cell.y);
      
      if (tower) {
        // Deduct money (if not in dev mode)
        if (!this.devMode) {
          this.money -= towerCost;
        }
        this.updateUI();
      } else {
        this.showNotification('Cannot build there!', '#ff5555');
      }
    } else {
      this.showNotification('Not enough gold!', '#ff5555');
    }
  }
  
  setBuildMode(mode) {
    this.buildMode = mode;
  }
  
  startWave(waveNumber = 1, maxWaves = 30) {
    this.waveNumber = waveNumber;
    
    // Calculate difficulty based on wave number
    const difficultyFactor = waveNumber / maxWaves;
    
    // Scale enemy count: starts at 10, increases by 3-5 each wave, capped at 80
    const baseEnemyCount = this.enemySpawnCount;
    const enemyCountIncrease = Math.floor(3 + (waveNumber / 5));
    const maxEnemyCount = 80;
    const enemyCount = Math.min(baseEnemyCount + ((waveNumber - 1) * enemyCountIncrease), maxEnemyCount);
    
    // Determine enemy types based on wave number
    let availableEnemyTypes = ['normal'];
    
    if (waveNumber >= 5) {
      availableEnemyTypes.push('fast'); // Fast enemies starting at wave 5
    }
    
    if (waveNumber >= 10) {
      availableEnemyTypes.push('tough'); // Tough enemies starting at wave 10
    }
    
    if (waveNumber >= 15) {
      availableEnemyTypes.push('armored'); // Armored enemies starting at wave 15
    }
    
    if (waveNumber >= 20) {
      availableEnemyTypes.push('boss'); // Boss enemies starting at wave 20
    }
    
    if (waveNumber >= 25) {
      availableEnemyTypes.push('elite'); // Elite enemies starting at wave 25
    }
    
    // Calculate enemy health and speed scaling
    const healthScaling = 1 + (difficultyFactor * 4); // Health scales up to 5x
    const speedScaling = 1 + (difficultyFactor * 1.5); // Speed scales up to 2.5x
    
    // Start the wave with calculated parameters
    this.enemyManager.startWave(
      this.waveNumber, 
      enemyCount, 
      availableEnemyTypes, 
      healthScaling,
      speedScaling
    );
    
    this.updateUI();
    
    // Show a notification about the wave
    if (waveNumber >= 20) {
      this.showNotification(`Wave ${waveNumber}: DANGER! Boss enemies incoming!`, '#ff5500');
    } else if (waveNumber >= 15) {
      this.showNotification(`Wave ${waveNumber}: Armored enemies approaching!`, '#ff9900');
    } else if (waveNumber >= 10) {
      this.showNotification(`Wave ${waveNumber}: Tough enemies approaching!`, '#ffcc00');
    } else if (waveNumber >= 5) {
      this.showNotification(`Wave ${waveNumber}: Fast enemies incoming!`, '#aaff00');
    } else {
      this.showNotification(`Wave ${waveNumber} incoming!`, '#ffffff');
    }
  }
  
  onEnemyReachedEnd() {
    this.lives--;
    this.updateUI();
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  onEnemyKilled(event) {
    const enemyType = event.detail.enemyType || 'normal';
    
    // Award money based on enemy type
    let baseReward = 10;
    let scoreValue = 100;
    
    switch(enemyType) {
      case 'fast':
        baseReward = 15;
        scoreValue = 150;
        break;
        
      case 'tough':
        baseReward = 20;
        scoreValue = 200;
        break;
        
      case 'armored':
        baseReward = 25;
        scoreValue = 300;
        break;
        
      case 'boss':
        baseReward = 50;
        scoreValue = 500;
        break;
        
      case 'elite':
        baseReward = 40;
        scoreValue = 400;
        break;
    }
    
    // Apply wave scaling to rewards
    const waveScaling = 1 + Math.floor(this.waveNumber / 3) * 0.1; // 10% increase every 3 waves
    const rewardAmount = Math.floor(baseReward * waveScaling);
    
    // Award money
    this.money += rewardAmount;
    
    // Add score
    this.score += scoreValue + (this.waveNumber * 10);
    
    // Show quick notification for special enemy types
    if (enemyType !== 'normal') {
      this.displayGameInfo(`${enemyType.toUpperCase()} enemy killed! +$${rewardAmount}`);
    }
    
    this.updateUI();
  }
  
  onWaveCompleted(event) {
    // Award completion bonus
    const waveCompletionBonus = 50 + (event.detail.waveNumber * 20);
    this.money += waveCompletionBonus;
    this.score += waveCompletionBonus;
    
    this.waveNumber = event.detail.nextWaveNumber;
    this.updateUI();
    
    this.showNotification(`Wave ${event.detail.waveNumber} completed! Next wave ready.`, '#55ff55');
  }
  
  onPathChanged(event) {
    // Path changed silently (removed notification)
  }
  
  displayGameInfo(message) {
    if (this.gameInfoDisplay) {
      this.gameInfoDisplay.textContent = message;
      
      // Clear the message after a delay
      setTimeout(() => {
        if (this.gameInfoDisplay) {
          this.gameInfoDisplay.textContent = '';
        }
      }, 3000);
    } else {
      console.log(message); // Fallback to console if element doesn't exist
    }
  }
  
  updateUI() {
    // Update UI displays
    if (this.devMode) {
      this.goldDisplay.textContent = "∞"; // Infinity symbol for unlimited money
      this.goldDisplay.style.color = "#ff9900"; // Gold color to indicate dev mode
    } else {
      this.goldDisplay.textContent = this.money;
      this.goldDisplay.style.color = ""; // Reset to default
    }
    
    this.healthDisplay.textContent = this.lives;
    this.waveDisplay.textContent = this.waveNumber;
  }
  
  gameOver() {
    this.showNotification(`Game Over! Your score: ${this.score}`, '#ff0000');
    setTimeout(() => {
      alert(`Game Over! Your score: ${this.score}`);
      // Could implement restart functionality here
    }, 1000);
  }
} 