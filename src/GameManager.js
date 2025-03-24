export class GameManager {
  constructor(gridManager, enemyManager, towerManager) {
    this.gridManager = gridManager;
    this.enemyManager = enemyManager;
    this.towerManager = towerManager;
    
    // Set reference to this GameManager in the EnemyManager
    if (this.enemyManager) {
      this.enemyManager.gameManager = this;
    }
    
    this.money = 100;
    this.lives = 10;
    this.waveNumber = 1;
    this.gameIsOver = false;
    
    // Enemy wave configuration
    this.enemySpawnCount = 10; // Base number of enemies per wave
    this.enemyTypes = ['normal']; // Available enemy types
    
    this.buildMode = null;
    this.lastUpdateTime = performance.now() / 1000;
    
    // Developer mode
    this.devMode = false;
    this.infiniteGold = false;
    this.infiniteLives = false;
    this.gamePaused = false;
    this.gameSpeed = 1.0; // Store current game speed
    this.originalEnemySpeed = this.enemyManager.enemySpeed;
    
    // UI elements
    this.goldDisplay = document.getElementById('money');
    this.healthDisplay = document.getElementById('lives');
    this.waveDisplay = document.getElementById('wave');
    this.difficultyDisplay = document.getElementById('difficulty');
    this.enemiesDisplay = document.getElementById('enemies-remaining') || document.createElement('span');
    this.gameInfoDisplay = document.getElementById('game-info') || document.createElement('div');
    this.notificationArea = document.getElementById('notification-area');
    
    // Store bound methods for event listeners to enable proper cleanup
    this.onEnemyReachedEndBound = this.onEnemyReachedEnd.bind(this);
    this.onEnemyKilledBound = this.onEnemyKilled.bind(this);
    this.onWaveCompletedBound = this.onWaveCompleted.bind(this);
    this.onPathChangedBound = this.onPathChanged.bind(this);
    
    // Event listeners
    document.addEventListener('enemyReachedEnd', this.onEnemyReachedEndBound);
    document.addEventListener('enemyKilled', this.onEnemyKilledBound);
    document.addEventListener('waveCompleted', this.onWaveCompletedBound);
    document.addEventListener('pathChanged', this.onPathChangedBound);
    
    // Developer mode toggle
    const devModeButton = document.getElementById('toggle-dev-mode');
    if (devModeButton) {
      devModeButton.addEventListener('click', () => this.toggleDevMode());
    }
    
    // Setup developer panel controls
    this.setupDevPanelControls();
    
    // Initial UI update
    this.updateUI();
  }
  
  setupDevPanelControls() {
    // Get dev panel elements
    const infiniteGoldToggle = document.getElementById('infinite-gold');
    const infiniteLivesToggle = document.getElementById('infinite-lives');
    const pauseGameBtn = document.getElementById('pause-game-btn');
    const gameSpeedSlider = document.getElementById('game-speed');
    const gameSpeedValue = gameSpeedSlider ? gameSpeedSlider.nextElementSibling : null;
    
    // Add event listeners
    if (infiniteGoldToggle) {
      infiniteGoldToggle.addEventListener('change', () => {
        this.infiniteGold = infiniteGoldToggle.checked;
        this.updateUI();
        this.showNotification(`Infinite Gold ${this.infiniteGold ? 'ENABLED' : 'DISABLED'}`, '#ffcc00');
      });
    }
    
    if (infiniteLivesToggle) {
      infiniteLivesToggle.addEventListener('change', () => {
        this.infiniteLives = infiniteLivesToggle.checked;
        this.updateUI();
        this.showNotification(`Infinite Lives ${this.infiniteLives ? 'ENABLED' : 'DISABLED'}`, '#00ccff');
      });
    }
    
    if (gameSpeedSlider && gameSpeedValue) {
      // Set initial text value
      gameSpeedValue.textContent = `${gameSpeedSlider.value}x`;
      
      // Add input event (while dragging)
      gameSpeedSlider.addEventListener('input', () => {
        const newSpeed = parseFloat(gameSpeedSlider.value);
        gameSpeedValue.textContent = `${newSpeed.toFixed(1)}x`;
      });
      
      // Add change event (after release)
      gameSpeedSlider.addEventListener('change', () => {
        const newSpeed = parseFloat(gameSpeedSlider.value);
        this.setGameSpeed(newSpeed);
        this.showNotification(`Game Speed: ${newSpeed.toFixed(1)}x`, '#ff00ff');
      });
    }
    
    if (pauseGameBtn) {
      pauseGameBtn.addEventListener('click', () => {
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
          pauseGameBtn.textContent = 'Resume Game';
          pauseGameBtn.classList.add('active');
          this.showNotification('Game PAUSED', '#ffffff');
        } else {
          pauseGameBtn.textContent = 'Pause Game';
          pauseGameBtn.classList.remove('active');
          this.showNotification('Game RESUMED', '#ffffff');
        }
      });
    }
  }
  
  setGameSpeed(speed) {
    if (!this.enemyManager) return;
    
    // Store the current game speed
    const previousSpeed = this.gameSpeed;
    this.gameSpeed = speed;
    
    // Adjust enemy speed based on the slider value
    this.enemyManager.enemySpeed = this.originalEnemySpeed * speed;
    
    // Update existing enemies' speed - use a direct ratio of the new speed to previous speed
    for (const enemy of this.enemyManager.enemies) {
      // Apply the speed change as a ratio to the current enemy's speed
      enemy.speed = enemy.speed * (speed / previousSpeed);
    }
    
    // If we have an active wave timer, clear and restart it with the new speed
    if (window.waveTimer) {
      // Store current timer information before clearing
      const oldTimerType = window.waveTimerType || 'unknown';
      const remainingTime = window.waveCountdown || 0;
      
      // Clear existing timer
      clearInterval(window.waveTimer);
      
      // If we have enough information to restart the timer
      if (oldTimerType === 'firstWave' && remainingTime > 0) {
        // Restart first wave timer
        this.restartFirstWaveTimer(remainingTime);
      } else if (oldTimerType === 'nextWave' && remainingTime > 0) {
        // Restart next wave timer
        this.restartNextWaveTimer(remainingTime);
      }
    }
    
    // Adjust enemy spawn interval if a wave is in progress
    if (this.enemyManager.spawnInterval) {
      const currentWave = this.waveNumber;
      const enemiesRemaining = this.enemyManager.enemyCount - this.enemyManager.enemiesSpawned;
      
      // Clear the current spawn interval
      clearInterval(this.enemyManager.spawnInterval);
      
      // Get the path
      const path = this.gridManager.getPath();
      if (path) {
        // Calculate the new spawn interval based on the current wave
        const baseSpawnInterval = 1000; // 1 second base
        const spawnIntervalReduction = Math.min(0.7, (currentWave - 1) * 0.02);
        const adjustedInterval = (baseSpawnInterval * (1 - spawnIntervalReduction)) / speed;
        
        // Setup new spawn interval with adjusted timing
        this.enemyManager.spawnInterval = setInterval(() => {
          this.enemyManager.spawnEnemy(path);
          this.enemyManager.enemiesSpawned++;
          
          if (this.enemyManager.enemiesSpawned >= this.enemyManager.enemyCount) {
            clearInterval(this.enemyManager.spawnInterval);
            this.enemyManager.spawnInterval = null;
            
            // Check if wave is already complete
            this.enemyManager.checkWaveCompletion();
          }
        }, adjustedInterval);
      }
    }
  }
  
  // Helper to restart first wave timer with remaining time
  restartFirstWaveTimer(remainingSeconds) {
    const notificationArea = document.getElementById('notification-area');
    let countdown = remainingSeconds;
    
    // Update countdown text
    const updateCountdown = () => {
      notificationArea.textContent = `First wave starting in: ${countdown}s`;
    };
    
    // Set initial text
    updateCountdown();
    
    // Start new countdown with speed-adjusted interval
    const countdownInterval = setInterval(() => {
      countdown--;
      updateCountdown();
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        
        // Start first wave
        window.currentWave = 1;
        notificationArea.textContent = `Wave ${window.currentWave}/${window.MAX_WAVES} incoming!`;
        this.startWave(window.currentWave, window.MAX_WAVES);
        
        // No longer first wave
        window.isFirstWave = false;
        window.waveTimer = null;
        window.waveTimerType = null;
      }
    }, 1000 / this.gameSpeed); // Adjust interval by game speed
    
    // Store the timer reference
    window.waveTimer = countdownInterval;
    window.waveTimerType = 'firstWave';
    window.waveCountdown = remainingSeconds;
  }
  
  // Helper to restart next wave timer with remaining time
  restartNextWaveTimer(remainingSeconds) {
    const notificationArea = document.getElementById('notification-area');
    let countdown = remainingSeconds;
    
    // Update the notification to show the countdown
    const updateCountdown = () => {
      notificationArea.textContent = `Wave ${window.currentWave+1}/${window.MAX_WAVES} - Next wave in: ${countdown}s`;
    };
    
    // Call immediately to set initial text
    updateCountdown();
    
    // Start the countdown with adjusted interval
    const countdownInterval = setInterval(() => {
      countdown--;
      updateCountdown();
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        
        // Start the next wave
        window.currentWave++;
        notificationArea.textContent = `Wave ${window.currentWave}/${window.MAX_WAVES} incoming!`;
        this.startWave(window.currentWave, window.MAX_WAVES);
        
        window.waveTimer = null;
        window.waveTimerType = null;
      }
    }, 1000 / this.gameSpeed); // Adjust interval by game speed
    
    // Store the timer reference
    window.waveTimer = countdownInterval;
    window.waveTimerType = 'nextWave';
    window.waveCountdown = remainingSeconds;
  }
  
  toggleDevMode() {
    this.devMode = !this.devMode;
    
    const devModeButton = document.getElementById('toggle-dev-mode');
    const devPanel = document.getElementById('dev-panel');
    
    if (this.devMode) {
      // Enable dev mode
      devModeButton.classList.add('active');
      if (devPanel) devPanel.style.display = 'block';
      
      // Display dev mode notification
      this.showNotification('DEVELOPER MODE ENABLED', '#ff0000');
    } else {
      // Disable dev mode
      devModeButton.classList.remove('active');
      if (devPanel) devPanel.style.display = 'none';
      
      // Reset other dev settings when disabling dev mode
      this.infiniteGold = false;
      this.infiniteLives = false;
      if (this.gamePaused) {
        this.gamePaused = false;
        const pauseGameBtn = document.getElementById('pause-game-btn');
        if (pauseGameBtn) {
          pauseGameBtn.textContent = 'Pause Game';
          pauseGameBtn.classList.remove('active');
        }
      }
      
      // Reset game speed to normal
      const gameSpeedSlider = document.getElementById('game-speed');
      if (gameSpeedSlider) {
        gameSpeedSlider.value = 1;
        const speedValueDisplay = gameSpeedSlider.nextElementSibling;
        if (speedValueDisplay) {
          speedValueDisplay.textContent = '1.0x';
        }
      }
      this.setGameSpeed(1.0);
      
      // Reset toggle switches
      const infiniteGoldToggle = document.getElementById('infinite-gold');
      const infiniteLivesToggle = document.getElementById('infinite-lives');
      if (infiniteGoldToggle) infiniteGoldToggle.checked = false;
      if (infiniteLivesToggle) infiniteLivesToggle.checked = false;
      
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
      
      // Set a timeout to clear the notification, adjusted by game speed
      this.notificationTimeout = setTimeout(() => {
        this.notificationArea.textContent = '';
        this.notificationArea.style.backgroundColor = this.originalNotificationBg;
      }, 3000 / this.gameSpeed);
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
      
      // Remove notification after delay, adjusted by game speed
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000 / this.gameSpeed);
    }
  }
  
  update(deltaTime) {
    // If game is paused, don't update
    if (this.gamePaused) return;
    
    // Store the current time
    const currentTime = performance.now() / 1000;
    
    // Calculate real delta time
    const realDeltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Update the enemy manager
    this.enemyManager.update(realDeltaTime);
    
    // Update the tower manager
    this.towerManager.update(realDeltaTime, this.enemyManager);
    
    // Update enemies display
    if (this.enemiesDisplay) {
      this.enemiesDisplay.textContent = this.enemyManager.getActiveEnemyCount();
    }
  }
  
  handleCellClick(cell) {
    // Just call our buildTower method
    this.buildTower(cell.x, cell.y);
  }
  
  setBuildMode(mode) {
    this.buildMode = mode;
  }
  
  startWave(waveNumber = 1, maxWaves = 30) {
    this.waveNumber = waveNumber;
    
    // Fixed number of enemies per wave - first wave has more enemies now for more challenge
    const FIXED_ENEMY_COUNT = waveNumber === 1 ? 12 : 15;
    
    // Calculate difficulty scaling factors based on wave number
    // These values determine how quickly the game gets harder
    // Use non-linear scaling to make early waves easier but late waves much harder
    
    // Easing function to create non-linear difficulty scaling
    // Early waves scale slowly, later waves scale faster
    const easeInQuadratic = (x) => x * x;
    const normalizedWave = (waveNumber - 1) / (maxWaves - 1); // 0 to 1
    const scalingFactor = easeInQuadratic(normalizedWave);
    
    // Set up base difficulty parameters
    const INITIAL_HEALTH = 100;  // Base health for wave 1
    const FINAL_HEALTH = 800;    // Target health for final wave
    const INITIAL_SPEED = 1.0;   // Base speed for wave 1
    const FINAL_SPEED = 2.5;     // Target speed for final wave
    const INITIAL_ARMOR = 0.0;   // Base armor for wave 1
    const FINAL_ARMOR = 0.6;     // Target armor for final wave

    // Calculate actual scaling values with a minimum baseline
    // First wave is always at base level (1.0)
    let healthScaling, speedScaling, armorScaling;
    
    if (waveNumber === 1) {
      // First wave has baseline difficulty, no need for extra starting money
      healthScaling = 1.0;
      speedScaling = 1.0;
      armorScaling = 1.0;
    } else {
      // Apply non-linear scaling for waves 2+
      // This starts slow and accelerates for later waves
      const progressionCurve = easeInQuadratic((waveNumber - 1) / (maxWaves - 1));
      
      healthScaling = 1.0 + progressionCurve * ((FINAL_HEALTH / INITIAL_HEALTH) - 1.0);
      speedScaling = 1.0 + progressionCurve * ((FINAL_SPEED / INITIAL_SPEED) - 1.0);
      armorScaling = 1.0 + progressionCurve * ((FINAL_ARMOR / INITIAL_ARMOR + 0.1) - 1.0);
    }
    
    console.log(`Wave ${waveNumber} scaling - Health: ${healthScaling.toFixed(2)}x, Speed: ${speedScaling.toFixed(2)}x, Armor: ${armorScaling.toFixed(2)}x`);
    
    // Determine enemy types based on wave number
    let availableEnemyTypes = ['normal'];
    
    // Introduce new enemy types as waves progress
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
    
    // Start the wave with calculated parameters
    this.enemyManager.startWave(
      this.waveNumber,
      FIXED_ENEMY_COUNT,
      availableEnemyTypes,
      healthScaling,
      speedScaling,
      armorScaling // Pass armor scaling as an additional parameter
    );
    
    this.updateUI();
    
    // Show wave difficulty info
    this.showWaveDifficultyInfo(waveNumber, healthScaling, speedScaling, armorScaling);
  }
  
  // Display wave difficulty information to the player
  showWaveDifficultyInfo(waveNumber, healthScaling, speedScaling, armorScaling) {
    let waveMessage = '';
    let color = '#ffffff';
    
    // Determine wave message and color based on wave number
    if (waveNumber >= 20) {
      waveMessage = `Wave ${waveNumber}: DANGER! Boss enemies incoming!`;
      color = '#ff5500';
    } else if (waveNumber >= 15) {
      waveMessage = `Wave ${waveNumber}: Armored enemies approaching!`;
      color = '#ff9900';
    } else if (waveNumber >= 10) {
      waveMessage = `Wave ${waveNumber}: Tough enemies approaching!`;
      color = '#ffcc00';
    } else if (waveNumber >= 5) {
      waveMessage = `Wave ${waveNumber}: Fast enemies incoming!`;
      color = '#aaff00';
    } else {
      waveMessage = `Wave ${waveNumber} incoming!`;
      color = '#ffffff';
    }
    
    // Show main wave notification
    this.showNotification(waveMessage, color);
    
    // Show difficulty information
    setTimeout(() => {
      // Display difficulty stats after a short delay so it doesn't overlap with the main notification
      const difficultyInfo = `Enemy Stats: Health ${Math.round(healthScaling * 100)}%, Speed ${Math.round(speedScaling * 100)}%`;
      this.displayGameInfo(difficultyInfo);
    }, 1500 / this.gameSpeed); // Adjust timeout by game speed
  }
  
  onEnemyReachedEnd(event) {
    if (this.infiniteLives) {
      // If infinite lives is enabled, don't reduce lives
      this.showNotification('Enemy reached the end! (No life lost in dev mode)', '#00ccff');
      return;
    }
    
    // If game is already over, don't process
    if (this.gameIsOver) return;
    
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
    
    switch(enemyType) {
      case 'fast':
        baseReward = 15;
        break;
        
      case 'tough':
        baseReward = 20;
        break;
        
      case 'armored':
        baseReward = 25;
        break;
        
      case 'boss':
        baseReward = 50;
        break;
        
      case 'elite':
        baseReward = 40;
        break;
    }
    
    // Apply controlled wave scaling to rewards
    // Instead of linearly increasing rewards, use a curve that gives
    // diminishing returns at higher waves to prevent snowballing
    
    let rewardMultiplier;
    if (this.waveNumber <= 5) {
      // Early waves: normal scaling to help player build up
      rewardMultiplier = 1 + ((this.waveNumber - 1) * 0.1); // 10% increase per wave
    } else if (this.waveNumber <= 15) {
      // Mid waves: slowing reward growth
      rewardMultiplier = 1.5 + ((this.waveNumber - 5) * 0.05); // 5% increase per wave
    } else {
      // Late waves: very slow reward growth
      rewardMultiplier = 2.0 + ((this.waveNumber - 15) * 0.02); // 2% increase per wave
    }
    
    const rewardAmount = Math.floor(baseReward * rewardMultiplier);
    
    // Award money
    this.money += rewardAmount;
    
    // Show quick notification for special enemy types
    if (enemyType !== 'normal') {
      this.displayGameInfo(`${enemyType.toUpperCase()} enemy killed! +$${rewardAmount}`);
    }
    
    this.updateUI();
  }
  
  onWaveCompleted(event) {
    // Award completion bonus - scale rewards to make early waves give decent rewards 
    // but prevent excessive snowballing in later waves
    
    // Base wave completion bonus that scales in a controlled manner
    // Early waves give moderate rewards, later waves give less relative to difficulty
    const waveNumber = event.detail.waveNumber;
    
    // Calculate wave bonus with diminishing returns
    // Early waves give moderate bonuses to prevent early game too-easy accumulation
    // Later waves provide less bonus per difficulty level to prevent snowballing
    let waveCompletionBonus;
    
    if (waveNumber <= 5) {
      // Early waves: moderate rewards to prevent early game advantage
      waveCompletionBonus = 40 + (waveNumber * 10);
    } else if (waveNumber <= 15) {
      // Mid waves: moderate rewards that grow slower
      waveCompletionBonus = 90 + ((waveNumber - 5) * 10);
    } else {
      // Late waves: minimal additional rewards to prevent excessive resources
      waveCompletionBonus = 190 + ((waveNumber - 15) * 5);
    }
    
    this.money += waveCompletionBonus;
    this.waveNumber = event.detail.nextWaveNumber;
    this.updateUI();
    
    // Show appropriate completion message with the reward
    this.showNotification(`Wave ${event.detail.waveNumber} completed! +$${waveCompletionBonus}`, '#55ff55');
  }
  
  onPathChanged(event) {
    // Path changed silently (removed notification)
  }
  
  displayGameInfo(message) {
    if (this.gameInfoDisplay) {
      this.gameInfoDisplay.textContent = message;
      
      // Clear the message after a delay adjusted by game speed
      setTimeout(() => {
        if (this.gameInfoDisplay) {
          this.gameInfoDisplay.textContent = '';
        }
      }, 3000 / this.gameSpeed);
    } else {
      console.log(message); // Fallback to console if element doesn't exist
    }
  }
  
  updateUI() {
    if (this.goldDisplay) {
      // Show special value for infinite gold
      if (this.devMode || this.infiniteGold) {
        this.goldDisplay.textContent = '∞'; // Infinity symbol
        this.goldDisplay.style.color = "#ffcc00"; // Gold color to indicate dev mode
      } else {
        this.goldDisplay.textContent = this.money;
        this.goldDisplay.style.color = ""; // Reset to default color
      }
    }
    
    if (this.healthDisplay) {
      // Show special value for infinite lives
      if (this.infiniteLives) {
        this.healthDisplay.textContent = '∞'; // Infinity symbol
        this.healthDisplay.style.color = "#00ccff"; // Blue color to indicate infinite lives
      } else {
        this.healthDisplay.textContent = this.lives;
        this.healthDisplay.style.color = ""; // Reset to default color
      }
    }
    
    if (this.waveDisplay) {
      this.waveDisplay.textContent = this.waveNumber;
    }
    
    if (this.difficultyDisplay) {
      // Display difficulty based on wave number
      if (this.waveNumber <= 10) {
        this.difficultyDisplay.textContent = "Normal";
      } else if (this.waveNumber <= 20) {
        this.difficultyDisplay.textContent = "Hard";
      } else {
        this.difficultyDisplay.textContent = "Insane";
      }
    }
  }
  
  gameOver() {
    // Prevent multiple calls to gameOver
    if (this.gameIsOver) return;
    this.gameIsOver = true;

    console.log("Game over triggered - stopping all game activities");
    
    // Stop all enemy and wave activity
    if (this.enemyManager) {
      this.enemyManager.waveInProgress = false;
      
      // Clear any spawn intervals
      if (this.enemyManager.spawnInterval) {
        clearInterval(this.enemyManager.spawnInterval);
        this.enemyManager.spawnInterval = null;
      }
      
      // Clear all active enemies
      while (this.enemyManager.enemies.length > 0) {
        const enemy = this.enemyManager.enemies[0];
        this.enemyManager.scene.remove(enemy.mesh);
        this.enemyManager.enemies.shift();
      }
    }
    
    // Clear any wave timers in main.js
    if (window.waveTimer) {
      clearInterval(window.waveTimer);
      window.waveTimer = null;
    }
    
    // Stop event listeners - remove our bound event listeners
    document.removeEventListener('enemyReachedEnd', this.onEnemyReachedEndBound);
    document.removeEventListener('enemyKilled', this.onEnemyKilledBound);
    document.removeEventListener('waveCompleted', this.onWaveCompletedBound);
    document.removeEventListener('pathChanged', this.onPathChangedBound);
    
    // Remove global wave handler if it exists
    if (window.onWaveCompletedHandler) {
      document.removeEventListener('waveCompleted', window.onWaveCompletedHandler);
    }
    
    this.showNotification(`Game Over! You reached wave: ${this.waveNumber}`, '#ff0000');
    
    // Check if a game over screen already exists and remove it
    const existingGameOverScreen = document.getElementById('game-over-screen');
    if (existingGameOverScreen) {
      existingGameOverScreen.remove();
    }
    
    // Create game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    
    // Game over title
    const gameOverTitle = document.createElement('h1');
    gameOverTitle.textContent = 'GAME OVER';
    
    // Wave reached message
    const waveMessage = document.createElement('p');
    waveMessage.textContent = `You reached wave: ${this.waveNumber}`;
    
    // Play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.className = 'play-again-btn';
    
    // Add event listener to the play again button
    playAgainButton.addEventListener('click', () => {
      // Hide game over screen
      gameOverScreen.style.opacity = '0';
      setTimeout(() => {
        // Remove game over screen safely
        if (gameOverScreen.parentNode) {
          gameOverScreen.parentNode.removeChild(gameOverScreen);
        } else {
          // If element is already detached, just make sure it's not visible
          gameOverScreen.style.display = 'none';
        }
        
        // Reset game container
        document.getElementById('game-container').style.opacity = '0';
        setTimeout(() => {
          document.getElementById('game-container').style.display = 'none';
          
          // Get faction selection element
          const factionSelection = document.getElementById('faction-selection');
          
          // Reset faction selection screen styles before showing it
          if (factionSelection) {
            // First set display to block but opacity to 0 for proper transition
            factionSelection.style.display = 'flex';
            factionSelection.style.opacity = '0';
            factionSelection.style.position = 'fixed';
            factionSelection.style.top = '0';
            factionSelection.style.left = '0';
            factionSelection.style.width = '100%';
            factionSelection.style.height = '100%';
            factionSelection.style.flexDirection = 'column';
            factionSelection.style.justifyContent = 'center';
            factionSelection.style.alignItems = 'center';
          }
          
          // Reset game instructions
          const gameInstructions = document.querySelector('.game-instructions');
          if (gameInstructions) {
            gameInstructions.style.textAlign = 'center';
            gameInstructions.style.maxWidth = '800px';
            gameInstructions.style.marginBottom = '1.5rem';
            gameInstructions.style.width = 'auto';
            gameInstructions.style.left = 'auto';
          }
          
          // Reset start game button
          const startGameBtn = document.getElementById('start-game-btn');
          if (startGameBtn) {
            startGameBtn.style.marginTop = '2rem';
            startGameBtn.style.position = 'relative';
            startGameBtn.style.left = 'auto';
            startGameBtn.style.width = 'auto';
          }
          
          // Reset game state (cleans up event listeners, etc.)
          window.resetGame();
            
          // Fade in the faction selection screen
          setTimeout(() => {
            if (factionSelection) {
              factionSelection.style.opacity = '1';
            }
          }, 50);
        }, 1000);
      }, 1000);
    });
    
    // Add elements to the game over screen
    gameOverScreen.appendChild(gameOverTitle);
    gameOverScreen.appendChild(waveMessage);
    gameOverScreen.appendChild(playAgainButton);
    
    // Add game over screen to the body
    document.body.appendChild(gameOverScreen);
    
    // Fade in the game over screen
    setTimeout(() => {
      gameOverScreen.style.opacity = '1';
    }, 100);
  }
  
  buildTower(x, y) {
    const towerCost = this.towerManager.getTowerCost();
    
    // In dev mode, infinite gold, or if you have enough money
    if (this.devMode || this.infiniteGold || this.money >= towerCost) {
      const tower = this.towerManager.buildTower(x, y);
      
      if (tower) {
        // Deduct money (if not in dev mode or infinite gold)
        if (!this.devMode && !this.infiniteGold) {
          this.money -= towerCost;
        }
        
        // Update the UI
        this.updateUI();
        
        return tower;
      }
    } else {
      // Not enough money
      this.showNotification('Not enough money to build tower!', '#ff0000');
    }
    
    return null;
  }
} 