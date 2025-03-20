export class GameManager {
  constructor(gridManager, enemyManager, towerManager) {
    this.gridManager = gridManager;
    this.enemyManager = enemyManager;
    this.towerManager = towerManager;
    
    this.money = 100;
    this.lives = 10;
    this.score = 0;
    this.waveNumber = 1;
    
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
  
  startWave() {
    this.enemyManager.startWave(this.waveNumber);
    this.updateUI();
  }
  
  onEnemyReachedEnd() {
    this.lives--;
    this.updateUI();
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  onEnemyKilled(event) {
    // Award money
    const rewardAmount = 10 + Math.floor(this.waveNumber / 2);
    this.money += rewardAmount;
    
    // Add score
    this.score += 100 + (this.waveNumber * 10);
    
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