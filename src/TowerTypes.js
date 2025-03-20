/**
 * Tower types with progressive stats
 * Each tower has progressively higher stats but also costs more
 * Using custom SVG icons to better represent each tower type
 */
export const TOWER_TYPES = [
  {
    id: 1,
    name: "Basic Tower",
    cost: 20,
    damage: 20,
    range: 4,
    fireRate: 1,
    color: 0x0088ff,
    description: "A basic tower with balanced stats.",
    icon: "🔫", // Simple gun
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.8"/><rect x="45" y="20" width="10" height="60" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 2,
    name: "Double Tower",
    cost: 40,
    damage: 30,
    range: 4.5,
    fireRate: 1.2,
    color: 0x22aaff,
    description: "Upgraded tower with better damage and range.",
    icon: "🔫🔫", // Double gun
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="35" y="20" width="10" height="60" fill="white" opacity="0.9"/><rect x="55" y="20" width="10" height="60" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 3,
    name: "Triple Tower",
    cost: 70,
    damage: 40,
    range: 5,
    fireRate: 1.4,
    color: 0x44ccff,
    description: "Triple the power of a basic tower.",
    icon: "🔫🔫🔫", // Triple gun
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="30" y="20" width="10" height="60" fill="white" opacity="0.9"/><rect x="45" y="20" width="10" height="60" fill="white" opacity="0.9"/><rect x="60" y="20" width="10" height="60" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 4,
    name: "Lightning Tower",
    cost: 100,
    damage: 55,
    range: 5.5,
    fireRate: 1.6,
    color: 0xffff00, // Yellow for lightning
    description: "Fires electrical bolts with chain damage.",
    icon: "⚡",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.7"/><path d="M40,20 L60,20 L50,40 L70,40 L30,80 L40,50 L20,50 Z" fill="white"/></svg>`
  },
  {
    id: 5,
    name: "Cannon Tower",
    cost: 150,
    damage: 75,
    range: 6,
    fireRate: 1.8,
    color: 0xff5500, // Orange for explosion
    description: "Heavy damage with splash effect.",
    icon: "💥",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="25" fill="white" opacity="0.3"/><circle cx="50" cy="50" r="15" fill="white" opacity="0.5"/><circle cx="50" cy="50" r="5" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 6,
    name: "Plasma Tower",
    cost: 200,
    damage: 90,
    range: 6.5,
    fireRate: 2.0,
    color: 0x9900ff, // Purple for plasma
    description: "Fires plasma bolts that pierce through enemies.",
    icon: "🌀",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.5"/><path d="M50,10 A40,40 0 0 1 90,50 A40,40 0 0 1 50,90 A40,40 0 0 1 10,50 A40,40 0 0 1 50,10 Z" fill="none" stroke="white" stroke-width="6" stroke-dasharray="30 10"/></svg>`
  },
  {
    id: 7,
    name: "Laser Tower",
    cost: 250,
    damage: 110,
    range: 7,
    fireRate: 2.2,
    color: 0xff0000, // Red for laser
    description: "Continuous laser beam damages enemies over time.",
    icon: "🔴",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><line x1="10" y1="50" x2="90" y2="50" stroke="white" stroke-width="5"/><line x1="50" y1="10" x2="50" y2="90" stroke="white" stroke-width="5"/><circle cx="50" cy="50" r="15" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 8,
    name: "Photon Tower",
    cost: 300,
    damage: 130,
    range: 7.5,
    fireRate: 2.4,
    color: 0x00ffff, // Cyan for photon
    description: "Shoots powerful photon beams in all directions.",
    icon: "✨",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.9"/><path d="M50,10 L55,40 L90,50 L55,60 L50,90 L45,60 L10,50 L45,40 Z" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 9,
    name: "Nova Tower",
    cost: 400,
    damage: 150,
    range: 8,
    fireRate: 2.6,
    color: 0xffaa00, // Orange-gold for nova
    description: "Releases nova energy bursts with wide area effect.",
    icon: "🌟",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,15 L54,40 L75,25 L60,45 L85,50 L60,55 L75,75 L54,60 L50,85 L46,60 L25,75 L40,55 L15,50 L40,45 L25,25 L46,40 Z" fill="white"/></svg>`
  },
  {
    id: 10,
    name: "Quantum Tower",
    cost: 500,
    damage: 180,
    range: 8.5,
    fireRate: 2.8,
    color: 0x0000ff, // Deep blue for quantum
    description: "Harnesses quantum energy for unpredictable attacks.",
    icon: "⚛️",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.9"/><ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="white" stroke-width="3" transform="rotate(0 50 50)"/><ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="white" stroke-width="3" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="white" stroke-width="3" transform="rotate(120 50 50)"/></svg>`
  },
  {
    id: 11,
    name: "Vortex Tower",
    cost: 650,
    damage: 220,
    range: 9,
    fireRate: 3.0,
    color: 0x00aa99, // Teal for vortex
    description: "Creates a vortex that slows and damages enemies.",
    icon: "🌪️",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.5"/><path d="M50,10 C70,20 80,30 90,50 C80,70 70,80 50,90 C30,80 20,70 10,50 C20,30 30,20 50,10 Z" fill="none" stroke="white" stroke-width="4" opacity="0.9"/><path d="M50,20 C65,30 70,35 80,50 C70,65 65,70 50,80 C35,70 30,65 20,50 C30,35 35,30 50,20 Z" fill="none" stroke="white" stroke-width="3" opacity="0.8"/><path d="M50,30 C60,35 65,40 70,50 C65,60 60,65 50,70 C40,65 35,60 30,50 C35,40 40,35 50,30 Z" fill="none" stroke="white" stroke-width="2" opacity="0.6"/></svg>`
  },
  {
    id: 12,
    name: "Supernova Tower",
    cost: 800,
    damage: 300,
    range: 10,
    fireRate: 3.5,
    color: 0xff00ff, // Magenta for supernova
    description: "The ultimate tower with devastating power. Obliterates everything.",
    icon: "💥",
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,10 L55,20 L65,15 L60,25 L70,30 L60,35 L65,45 L55,40 L50,50 L45,40 L35,45 L40,35 L30,30 L40,25 L35,15 L45,20 Z" fill="white"/><path d="M50,50 L55,60 L65,55 L60,65 L70,70 L60,75 L65,85 L55,80 L50,90 L45,80 L35,85 L40,75 L30,70 L40,65 L35,55 L45,60 Z" fill="white"/></svg>`
  }
]; 