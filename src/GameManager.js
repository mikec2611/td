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
    this.moneyDisplay = document.getElementById('money');
    this.livesDisplay = document.getElementById('lives');
    this.waveDisplay = document.getElementById('wave');
    
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
      this.enemyManager.enemySpeed = this.originalEnemySpeed * 10; // 10x faster enemies (was 5x)
      
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
  }
  
  handleCellClick(cell) {
    if (!this.buildMode) return;
    
    if (this.buildMode === 'tower') {
      // In dev mode, ignore money requirements
      if (this.devMode || this.money >= this.towerManager.getTowerCost()) {
        // Try to build tower
        const tower = this.towerManager.buildTower(cell.x, cell.y);
        
        if (tower) {
          // Deduct money (if not in dev mode)
          if (!this.devMode) {
            this.money -= this.towerManager.getTowerCost();
          }
          this.updateUI();
        }
      } else {
        console.log('Not enough money to build tower!');
      }
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
    
    console.log(`Wave ${event.detail.waveNumber} completed! Wave ${this.waveNumber} ready.`);
  }
  
  onPathChanged(event) {
    // Display a message about the path change
    const pathChangeMessage = document.createElement('div');
    pathChangeMessage.textContent = "Enemies rerouting!";
    pathChangeMessage.style.position = 'absolute';
    pathChangeMessage.style.top = '40%';
    pathChangeMessage.style.left = '50%';
    pathChangeMessage.style.transform = 'translate(-50%, -50%)';
    pathChangeMessage.style.color = '#00ffff';
    pathChangeMessage.style.fontSize = '24px';
    pathChangeMessage.style.fontWeight = 'bold';
    pathChangeMessage.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.7)';
    pathChangeMessage.style.zIndex = '100';
    document.body.appendChild(pathChangeMessage);
    
    // Remove the message after a short delay
    setTimeout(() => {
      document.body.removeChild(pathChangeMessage);
    }, 1500);
  }
  
  updateUI() {
    // Update UI displays
    if (this.devMode) {
      this.moneyDisplay.textContent = "∞"; // Infinity symbol for unlimited money
      this.moneyDisplay.style.color = "#ff9900"; // Gold color to indicate dev mode
    } else {
      this.moneyDisplay.textContent = this.money;
      this.moneyDisplay.style.color = ""; // Reset to default
    }
    
    this.livesDisplay.textContent = this.lives;
    this.waveDisplay.textContent = this.waveNumber;
  }
  
  gameOver() {
    alert(`Game Over! Your score: ${this.score}`);
    // Could implement restart functionality here
  }
} 