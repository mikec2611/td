# Three.js Tower Defense Game

A basic tower defense game built with Three.js. Create mazes with strategically placed towers to prevent enemies from reaching the end point.

## Features

- Grid-based board with a single spawn point at the top and end point at the bottom
- Place towers to create mazes and lengthen the enemy path
- Pathfinding ensures enemies always find the shortest path to the end
- Wave-based enemy spawning system
- Tower targeting and shooting mechanics
- Resource management (money for building towers)
- Lives system (lose lives when enemies reach the endpoint)

## How to Play

1. Use the "Build Tower" button to select tower placement mode
2. Click on the grid to place towers (costs $20 each)
3. Click "Start Wave" to begin sending enemies
4. Enemies will follow the shortest path to the end
5. Towers will automatically target and shoot at enemies in range
6. Earn money by defeating enemies
7. Build more towers to create mazes and slow down enemy progression
8. Survive as many waves as possible!

## Setup and Run

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173/)

## Controls

- Left-click: Place towers (when in build mode)
- Mouse wheel: Zoom in/out
- Right-click + drag: Rotate camera
- Middle-click + drag: Pan camera

## Future Enhancements

- Different tower types with unique abilities
- Multiple enemy types with varying speeds and health
- Upgradeable towers
- More complex map layouts
- Power-ups and special abilities
- High score system 