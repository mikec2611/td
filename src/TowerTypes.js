/**
 * Tower types with progressive stats
 * Each tower has progressively higher stats but also costs more
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
    icon: "📡" // Using emojis for simple icons
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
    icon: "🔷"
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
    icon: "🔶"
  },
  {
    id: 4,
    name: "Quad Tower",
    cost: 100,
    damage: 55,
    range: 5.5,
    fireRate: 1.6,
    color: 0x0066cc,
    description: "Four times the stopping power.",
    icon: "⚡"
  },
  {
    id: 5,
    name: "Cannon Tower",
    cost: 150,
    damage: 75,
    range: 6,
    fireRate: 1.8,
    color: 0x004499,
    description: "Heavy damage with increased range.",
    icon: "💥"
  },
  {
    id: 6,
    name: "Plasma Tower",
    cost: 200,
    damage: 90,
    range: 6.5,
    fireRate: 2.0,
    color: 0x5500ff,
    description: "Fires plasma bolts at a rapid rate.",
    icon: "🌀"
  },
  {
    id: 7,
    name: "Laser Tower",
    cost: 250,
    damage: 110,
    range: 7,
    fireRate: 2.2,
    color: 0x7700ff,
    description: "Powerful laser with extended range.",
    icon: "🔆"
  },
  {
    id: 8,
    name: "Photon Tower",
    cost: 300,
    damage: 130,
    range: 7.5,
    fireRate: 2.4,
    color: 0x9900ff,
    description: "Emits photon beams for massive damage.",
    icon: "💫"
  },
  {
    id: 9,
    name: "Nova Tower",
    cost: 400,
    damage: 150,
    range: 8,
    fireRate: 2.6,
    color: 0xaa00dd,
    description: "Nova energy for extreme firepower.",
    icon: "🌟"
  },
  {
    id: 10,
    name: "Quantum Tower",
    cost: 500,
    damage: 180,
    range: 8.5,
    fireRate: 2.8,
    color: 0xcc00bb,
    description: "Harnesses quantum energy for deadly attacks.",
    icon: "🌌"
  },
  {
    id: 11,
    name: "Omega Tower",
    cost: 650,
    damage: 220,
    range: 9,
    fireRate: 3.0,
    color: 0xff0099,
    description: "The Omega tower obliterates enemies.",
    icon: "🌠"
  },
  {
    id: 12,
    name: "Supernova Tower",
    cost: 800,
    damage: 300,
    range: 10,
    fireRate: 3.5,
    color: 0xff0066,
    description: "The ultimate tower with devastating power.",
    icon: "💯"
  }
]; 