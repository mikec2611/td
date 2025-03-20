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
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.color = color;
    notification.style.fontSize = '28px';
    notification.style.fontWeight = 'bold';
    notification.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.7)';
    notification.style.zIndex = '100';
    document.body.appendChild(notification);
    
    // Remove notification after delay
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
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
    this.enemiesDisplay.textContent = this.enemyManager.getActiveEnemyCount();
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
        this.displayGameInfo('Cannot build there!');
      }
    } else {
      this.displayGameInfo('Not enough gold!');
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
    
    this.displayGameInfo(`Wave ${event.detail.waveNumber} completed! Next wave ready.`);
  }
  
  onPathChanged(event) {
    // Display a message about the path change
    this.showNotification("Enemies rerouting!", '#00ffff');
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
    alert(`Game Over! Your score: ${this.score}`);
    // Could implement restart functionality here
  }
} 