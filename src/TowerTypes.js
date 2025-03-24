/**
 * Tower types with faction-specific variants
 * Each faction has its own unique tower designs with different stats and visuals
 */

// Base tower stats that will be modified by faction
const BASE_TOWERS = [
  {
    tier: 1,
    baseCost: 20,
    baseDamage: 20,
    baseRange: 4,
    baseFireRate: 1
  },
  {
    tier: 2,
    baseCost: 40,
    baseDamage: 30,
    baseRange: 4.5,
    baseFireRate: 1.2
  },
  {
    tier: 3,
    baseCost: 70,
    baseDamage: 40,
    baseRange: 5,
    baseFireRate: 1.4
  },
  {
    tier: 4,
    baseCost: 100,
    baseDamage: 55,
    baseRange: 5.5,
    baseFireRate: 1.6
  },
  {
    tier: 5,
    baseCost: 150,
    baseDamage: 75,
    baseRange: 6,
    baseFireRate: 1.8
  },
  {
    tier: 6,
    baseCost: 200,
    baseDamage: 90,
    baseRange: 6.5,
    baseFireRate: 2.0
  },
  {
    tier: 7,
    baseCost: 250,
    baseDamage: 110,
    baseRange: 7,
    baseFireRate: 2.2
  },
  {
    tier: 8,
    baseCost: 300,
    baseDamage: 130,
    baseRange: 7.5,
    baseFireRate: 2.4
  },
  {
    tier: 9,
    baseCost: 400,
    baseDamage: 150,
    baseRange: 8,
    baseFireRate: 2.6
  },
  {
    tier: 10,
    baseCost: 500,
    baseDamage: 180,
    baseRange: 8.5,
    baseFireRate: 2.8
  },
  {
    tier: 11,
    baseCost: 650,
    baseDamage: 220,
    baseRange: 9,
    baseFireRate: 3.0
  },
  {
    tier: 12,
    baseCost: 800,
    baseDamage: 300,
    baseRange: 10,
    baseFireRate: 3.5
  }
];

// Tech Dominion Towers - Focus on precision and range
const TECH_TOWERS = [
  {
    id: 1,
    name: "Sentinel Turret",
    color: 0x00a2ff,
    description: "Basic automated defense turret with efficient targeting systems.",
    icon: "🔫",
    faction: "tech",
    statModifiers: { damage: 1.0, range: 1.2, fireRate: 1.0, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="45" y="20" width="10" height="60" fill="white"/></svg>`
  },
  {
    id: 2,
    name: "Dual Cannon",
    color: 0x0088cc,
    description: "Twin-barrel precision cannon with enhanced targeting range.",
    icon: "🔫🔫",
    faction: "tech",
    statModifiers: { damage: 1.0, range: 1.3, fireRate: 1.1, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="35" y="20" width="10" height="60" fill="white"/><rect x="55" y="20" width="10" height="60" fill="white"/></svg>`
  },
  {
    id: 3,
    name: "Targeting Array",
    color: 0x00b7ff,
    description: "Multi-barrel system with enhanced target acquisition.",
    icon: "🎯",
    faction: "tech",
    statModifiers: { damage: 1.0, range: 1.4, fireRate: 1.1, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.7"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="3"/><circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="2"/><circle cx="50" cy="50" r="10" fill="none" stroke="white" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="white"/></svg>`
  },
  {
    id: 4,
    name: "Railgun Accelerator",
    color: 0x4dc3ff,
    description: "Electromagnetic accelerator with high armor penetration.",
    icon: "⚡",
    faction: "tech",
    statModifiers: { damage: 1.2, range: 1.5, fireRate: 0.8, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="30" y="48" width="40" height="4" fill="white"/><polygon points="70,40 85,50 70,60" fill="white"/></svg>`
  },
  {
    id: 5,
    name: "Pulse Cannon",
    color: 0x0077aa,
    description: "Fires concentrated energy pulses with tactical precision.",
    icon: "💠",
    faction: "tech",
    statModifiers: { damage: 1.2, range: 1.4, fireRate: 1.0, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="6"/><circle cx="50" cy="50" r="5" fill="white"/></svg>`
  },
  {
    id: 6,
    name: "Tactical Matrix",
    color: 0x00c6ff,
    description: "Advanced grid-based targeting system with exceptional accuracy.",
    icon: "📡",
    faction: "tech",
    statModifiers: { damage: 1.1, range: 1.6, fireRate: 1.0, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><line x1="20" y1="20" x2="80" y2="80" stroke="white" stroke-width="3"/><line x1="20" y1="80" x2="80" y2="20" stroke="white" stroke-width="3"/><line x1="20" y1="50" x2="80" y2="50" stroke="white" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="80" stroke="white" stroke-width="3"/></svg>`
  },
  {
    id: 7,
    name: "Precision Laser",
    color: 0x00a0e0,
    description: "High-energy laser with pinpoint accuracy and sustained firing.",
    icon: "🔆",
    faction: "tech",
    statModifiers: { damage: 1.1, range: 1.7, fireRate: 1.2, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><line x1="10" y1="50" x2="90" y2="50" stroke="white" stroke-width="4"/><line x1="50" y1="10" x2="50" y2="90" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="15" fill="white" opacity="0.6"/></svg>`
  },
  {
    id: 8,
    name: "Quantum Scanner",
    color: 0x80dfff,
    description: "Advanced quantum technology that predicts enemy movements.",
    icon: "🔬",
    faction: "tech",
    statModifiers: { damage: 1.1, range: 1.8, fireRate: 1.2, cost: 1.15 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><ellipse cx="50" cy="50" rx="25" ry="10" stroke="white" stroke-width="3" fill="none" transform="rotate(0 50 50)"/><ellipse cx="50" cy="50" rx="25" ry="10" stroke="white" stroke-width="3" fill="none" transform="rotate(45 50 50)"/><ellipse cx="50" cy="50" rx="25" ry="10" stroke="white" stroke-width="3" fill="none" transform="rotate(90 50 50)"/><ellipse cx="50" cy="50" rx="25" ry="10" stroke="white" stroke-width="3" fill="none" transform="rotate(135 50 50)"/></svg>`
  },
  {
    id: 9,
    name: "Orbital Strike",
    color: 0x33bbff,
    description: "Satellite-guided weapons system with extensive coverage.",
    icon: "🛰️",
    faction: "tech",
    statModifiers: { damage: 1.2, range: 2.0, fireRate: 1.0, cost: 1.2 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,15 L60,40 L85,50 L60,60 L50,85 L40,60 L15,50 L40,40 Z" fill="white" opacity="0.9"/></svg>`
  },
  {
    id: 10,
    name: "Tactical Supercomputer",
    color: 0x00d8ff,
    description: "AI-powered defense system with unmatched battlefield analysis.",
    icon: "🖥️",
    faction: "tech",
    statModifiers: { damage: 1.3, range: 1.9, fireRate: 1.3, cost: 1.25 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><rect x="25" y="35" width="50" height="30" fill="white" opacity="0.8"/><line x1="25" y1="45" x2="75" y2="45" stroke="currentColor" stroke-width="2"/><rect x="40" y="65" width="20" height="5" fill="white"/></svg>`
  },
  {
    id: 11,
    name: "Antimatter Cannon",
    color: 0x00e5ff,
    description: "Harnesses antimatter reactions for devastating precision strikes.",
    icon: "⚛️",
    faction: "tech",
    statModifiers: { damage: 1.5, range: 1.8, fireRate: 1.1, cost: 1.3 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="15" fill="white"/><circle cx="50" cy="20" r="5" fill="white"/><circle cx="80" cy="65" r="5" fill="white"/><circle cx="20" cy="65" r="5" fill="white"/><line x1="50" y1="20" x2="50" y2="65" stroke="white" stroke-width="2"/><line x1="20" y1="65" x2="80" y2="65" stroke="white" stroke-width="2"/><line x1="50" y1="20" x2="20" y2="65" stroke="white" stroke-width="2"/><line x1="50" y1="20" x2="80" y2="65" stroke="white" stroke-width="2"/></svg>`
  },
  {
    id: 12,
    name: "Singularity Array",
    color: 0x00ffff,
    description: "Ultimate tech weaponry using controlled micro black holes.",
    icon: "🌌",
    faction: "tech",
    statModifiers: { damage: 1.4, range: 2.0, fireRate: 1.5, cost: 1.4 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="15" fill="black"/><circle cx="50" cy="50" r="25" fill="none" stroke="white" stroke-width="3" stroke-dasharray="5 3"/><circle cx="50" cy="50" r="5" fill="white" opacity="0.8"/></svg>`
  }
];

// Energy Nexus Towers - Focus on damage and fire rate
const ENERGY_TOWERS = [
  {
    id: 1,
    name: "Energy Emitter",
    color: 0xf5d020,
    description: "Basic energy bolt emitter with reliable output.",
    icon: "⚡",
    faction: "energy",
    statModifiers: { damage: 1.1, range: 1.0, fireRate: 1.1, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M40,20 L60,20 L55,40 L70,40 L40,80 L45,50 L30,50 Z" fill="white"/></svg>`
  },
  {
    id: 2,
    name: "Spark Generator",
    color: 0xf7b733,
    description: "Dual energy emitter with increased voltage output.",
    icon: "⚡⚡",
    faction: "energy",
    statModifiers: { damage: 1.2, range: 1.0, fireRate: 1.2, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M30,20 L45,20 L40,40 L55,40 L25,80 L30,50 L15,50 Z" fill="white"/><path d="M55,20 L70,20 L65,40 L80,40 L50,80 L55,50 L40,50 Z" fill="white"/></svg>`
  },
  {
    id: 3,
    name: "Arc Conduit",
    color: 0xfca311,
    description: "Triple arc energy system that chains between targets.",
    icon: "🔌",
    faction: "energy",
    statModifiers: { damage: 1.3, range: 1.0, fireRate: 1.3, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M20,35 C30,45 40,35 50,45 C60,55 70,45 80,55" stroke="white" stroke-width="5" fill="none"/><circle cx="20" cy="35" r="5" fill="white"/><circle cx="80" cy="55" r="5" fill="white"/></svg>`
  },
  {
    id: 4,
    name: "Lightning Rod",
    color: 0xffce42,
    description: "Channels atmospheric electricity for powerful discharges.",
    icon: "⚡",
    faction: "energy",
    statModifiers: { damage: 1.5, range: 1.0, fireRate: 1.2, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.7"/><line x1="50" y1="15" x2="50" y2="85" stroke="white" stroke-width="6"/><path d="M35,25 L65,25 L40,50 L60,50 L30,75 L40,55 L25,55 Z" fill="white"/></svg>`
  },
  {
    id: 5,
    name: "Plasma Sphere",
    color: 0xff9500,
    description: "Generates superheated plasma that burns through enemies.",
    icon: "🔥",
    faction: "energy",
    statModifiers: { damage: 1.6, range: 0.9, fireRate: 1.2, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="20" fill="white" opacity="0.6"/><circle cx="45" cy="45" r="5" fill="white"/></svg>`
  },
  {
    id: 6,
    name: "Fusion Reactor",
    color: 0xff6d00,
    description: "Harnesses nuclear fusion for devastating energy bursts.",
    icon: "☢️",
    faction: "energy",
    statModifiers: { damage: 1.7, range: 0.9, fireRate: 1.3, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="15" fill="white" opacity="0.8"/><path d="M50,15 A35,35 0 0 1 85,50 A35,35 0 0 1 50,85 A35,35 0 0 1 15,50 A35,35 0 0 1 50,15" fill="none" stroke="white" stroke-width="5" stroke-dasharray="20 10"/></svg>`
  },
  {
    id: 7,
    name: "Ionic Disruptor",
    color: 0xff3d00,
    description: "Fires streams of charged particles that destabilize targets.",
    icon: "🌩️",
    faction: "energy",
    statModifiers: { damage: 1.5, range: 1.0, fireRate: 1.6, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M30,30 L70,30 M25,40 L75,40 M20,50 L80,50 M25,60 L75,60 M30,70 L70,70" stroke="white" stroke-width="4"/></svg>`
  },
  {
    id: 8,
    name: "Solar Amplifier",
    color: 0xff9900,
    description: "Concentrates solar energy into powerful thermal beams.",
    icon: "☀️",
    faction: "energy",
    statModifiers: { damage: 1.8, range: 1.0, fireRate: 1.4, cost: 1.15 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="currentColor"/><path d="M50,10 L50,25 M50,75 L50,90 M10,50 L25,50 M75,50 L90,50 M22,22 L32,32 M68,32 L78,22 M22,78 L32,68 M68,68 L78,78" stroke="currentColor" stroke-width="5"/></svg>`
  },
  {
    id: 9,
    name: "Thunderstorm Generator",
    color: 0xffa200,
    description: "Creates localized storm cells with multiple lightning strikes.",
    icon: "🌪️",
    faction: "energy",
    statModifiers: { damage: 1.7, range: 1.1, fireRate: 1.7, cost: 1.2 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.7"/><path d="M30,30 L40,50 L30,50 L45,75 M55,75 L70,50 L60,50 L70,30 M40,65 L60,65" stroke="white" stroke-width="4" fill="none"/></svg>`
  },
  {
    id: 10,
    name: "Hadron Collider",
    color: 0xffcc00,
    description: "Particle accelerator that creates destructive energy waves.",
    icon: "🔄",
    faction: "energy",
    statModifiers: { damage: 2.0, range: 1.0, fireRate: 1.6, cost: 1.25 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="25" fill="none" stroke="white" stroke-width="5"/><circle cx="35" cy="50" r="5" fill="white"/><circle cx="65" cy="50" r="5" fill="white"/><path d="M30,50 A20,20 0 0 1 70,50" stroke="white" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 11,
    name: "Plasma Vortex",
    color: 0xf5a700,
    description: "Creates a swirling energy vortex that pulls and damages enemies.",
    icon: "🌀",
    faction: "energy",
    statModifiers: { damage: 1.9, range: 1.1, fireRate: 1.9, cost: 1.3 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,20 C65,25 75,35 80,50 C75,65 65,75 50,80 C35,75 25,65 20,50 C25,35 35,25 50,20 Z" fill="none" stroke="white" stroke-width="4"/><path d="M50,30 C60,35 65,40 70,50 C65,60 60,65 50,70 C40,65 35,60 30,50 C35,40 40,35 50,30 Z" fill="none" stroke="white" stroke-width="3"/></svg>`
  },
  {
    id: 12,
    name: "Supernova Core",
    color: 0xffb700,
    description: "Unleashes the power of exploding stars in concentrated bursts.",
    icon: "💥",
    faction: "energy",
    statModifiers: { damage: 2.5, range: 1.0, fireRate: 1.8, cost: 1.4 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="20" fill="white" opacity="0.7"/><path d="M50,15 L55,35 M65,20 L60,37 M80,30 L65,42 M85,50 L67,50 M80,70 L65,58 M65,80 L60,63 M50,85 L45,65 M35,80 L40,63 M20,70 L35,58 M15,50 L33,50 M20,30 L35,42 M35,20 L40,37" stroke="white" stroke-width="3"/></svg>`
  }
];

// Elemental Order Towers - Focus on area effects and utility
const ELEMENTAL_TOWERS = [
  {
    id: 1,
    name: "Nature Sprout",
    color: 0x7fbb00,
    description: "Basic elemental tower that channels natural energy.",
    icon: "🌱",
    faction: "elemental",
    statModifiers: { damage: 0.9, range: 1.1, fireRate: 1.0, cost: 0.9 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,20 C60,30 60,40 50,45 C40,40 40,30 50,20 Z" fill="white"/><rect x="47" y="45" width="6" height="30" fill="white"/><path d="M40,75 C40,85 60,85 60,75" fill="none" stroke="white" stroke-width="3"/></svg>`
  },
  {
    id: 2,
    name: "Thorn Bush",
    color: 0x8bc34a,
    description: "Sprouting thorns that damage enemies passing nearby.",
    icon: "🌵",
    faction: "elemental",
    statModifiers: { damage: 0.9, range: 1.2, fireRate: 1.1, cost: 0.9 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M30,40 L70,40 L70,60 L30,60 Z" fill="white" opacity="0.3"/><path d="M35,40 L35,60 M45,40 L45,60 M55,40 L55,60 M65,40 L65,60" stroke="white" stroke-width="3"/><path d="M35,35 L35,40 M45,35 L45,40 M55,35 L55,40 M65,35 L65,40 M35,60 L35,65 M45,60 L45,65 M55,60 L55,65 M65,60 L65,65" stroke="white" stroke-width="5"/></svg>`
  },
  {
    id: 3,
    name: "Wind Gust",
    color: 0x9ccc65,
    description: "Generates powerful air currents that slow enemies.",
    icon: "🌬️",
    faction: "elemental",
    statModifiers: { damage: 0.8, range: 1.4, fireRate: 1.2, cost: 0.9 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M20,40 C30,35 40,45 50,40 C60,35 70,45 80,40" stroke="white" stroke-width="3" fill="none"/><path d="M20,50 C30,45 40,55 50,50 C60,45 70,55 80,50" stroke="white" stroke-width="3" fill="none"/><path d="M20,60 C30,55 40,65 50,60 C60,55 70,65 80,60" stroke="white" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 4,
    name: "Stone Spire",
    color: 0x8d6e63,
    description: "Earth element tower that creates damaging stone spikes.",
    icon: "🪨",
    faction: "elemental",
    statModifiers: { damage: 1.3, range: 1.0, fireRate: 0.9, cost: 0.9 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><polygon points="40,70 50,30 60,70" fill="white"/><polygon points="30,65 50,25 45,65" fill="white" opacity="0.6"/><polygon points="55,65 70,65 60,30" fill="white" opacity="0.5"/></svg>`
  },
  {
    id: 5,
    name: "Ice Shard",
    color: 0x29b6f6,
    description: "Fires freezing projectiles that slow enemy movement.",
    icon: "❄️",
    faction: "elemental",
    statModifiers: { damage: 1.0, range: 1.2, fireRate: 1.1, cost: 0.95 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M50,20 L50,80 M30,35 L70,65 M30,65 L70,35" stroke="white" stroke-width="3"/><circle cx="50" cy="50" r="10" fill="white" opacity="0.7"/></svg>`
  },
  {
    id: 6,
    name: "Poison Cloud",
    color: 0x8bc34a,
    description: "Emits toxic vapors that damage enemies over time.",
    icon: "☁️",
    faction: "elemental",
    statModifiers: { damage: 1.0, range: 1.3, fireRate: 1.2, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.7"/><circle cx="40" cy="40" r="15" fill="white" opacity="0.6"/><circle cx="60" cy="40" r="12" fill="white" opacity="0.6"/><circle cx="50" cy="50" r="14" fill="white" opacity="0.6"/><circle cx="35" cy="55" r="10" fill="white" opacity="0.6"/><circle cx="65" cy="55" r="11" fill="white" opacity="0.6"/></svg>`
  },
  {
    id: 7,
    name: "Wildfire",
    color: 0xff6d00,
    description: "Spreads flames that burn enemies for additional damage.",
    icon: "🔥",
    faction: "elemental",
    statModifiers: { damage: 1.2, range: 1.1, fireRate: 1.3, cost: 1.0 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M30,70 C30,50 40,60 40,45 C50,60 60,35 60,55 C70,40 70,70 50,70 Z" fill="white"/><path d="M40,70 C40,55 45,60 45,50 C50,60 55,45 55,60 C60,50 60,70 50,70 Z" fill="currentColor" opacity="0.9"/></svg>`
  },
  {
    id: 8,
    name: "Earthquake",
    color: 0x795548,
    description: "Creates ground tremors that damage and stun enemies.",
    icon: "🌋",
    faction: "elemental",
    statModifiers: { damage: 1.4, range: 1.0, fireRate: 1.0, cost: 1.05 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M20,55 L30,45 L40,60 L50,40 L60,60 L70,45 L80,55" stroke="white" stroke-width="4" fill="none"/><path d="M25,65 L35,55 L45,70 L55,50 L65,70 L75,55" stroke="white" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 9,
    name: "Tornado Vortex",
    color: 0x7cb342,
    description: "Summons miniature tornadoes that throw enemies off course.",
    icon: "🌪️",
    faction: "elemental",
    statModifiers: { damage: 1.1, range: 1.5, fireRate: 1.3, cost: 1.1 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M40,80 C30,65 35,50 45,40 C40,55 45,65 50,70 C55,55 60,45 55,35 C65,45 70,60 60,75 Z" fill="white"/></svg>`
  },
  {
    id: 10,
    name: "Tsunami Wave",
    color: 0x03a9f4,
    description: "Creates powerful waves that push enemies back.",
    icon: "🌊",
    faction: "elemental",
    statModifiers: { damage: 1.2, range: 1.4, fireRate: 1.2, cost: 1.15 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><path d="M20,60 C30,40 40,60 50,40 C60,60 70,40 80,60" fill="none" stroke="white" stroke-width="4"/><path d="M20,70 C30,50 40,70 50,50 C60,70 70,50 80,70" fill="none" stroke="white" stroke-width="4"/></svg>`
  },
  {
    id: 11,
    name: "Crystal Formation",
    color: 0xad1457,
    description: "Grows powerful crystals that amplify elemental damage.",
    icon: "💎",
    faction: "elemental",
    statModifiers: { damage: 1.5, range: 1.2, fireRate: 1.1, cost: 1.2 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.7"/><polygon points="50,20 65,40 60,65 40,65 35,40" fill="white" opacity="0.8"/><polygon points="50,30 40,40 50,60 60,40" fill="currentColor" opacity="0.9"/></svg>`
  },
  {
    id: 12,
    name: "Gaia's Wrath",
    color: 0x558b2f,
    description: "Ultimate nature power that combines all elements.",
    icon: "🌍",
    faction: "elemental",
    statModifiers: { damage: 1.8, range: 1.5, fireRate: 1.3, cost: 1.3 },
    svgIcon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.8"/><circle cx="50" cy="50" r="20" fill="white" opacity="0.6"/><path d="M20,40 C25,20 75,20 80,40 C100,45 100,75 80,80 C75,100 25,100 20,80 C0,75 0,45 20,40 Z" fill="none" stroke="white" stroke-width="3"/></svg>`
  }
];

// Function to generate final tower types with calculated stats based on faction
function generateTowerTypes(faction) {
  let baseTowers = BASE_TOWERS;
  let factionTowers;
  
  // Select the appropriate faction towers
  switch(faction) {
    case 'tech':
      factionTowers = TECH_TOWERS;
      break;
    case 'energy':
      factionTowers = ENERGY_TOWERS;
      break;
    case 'elemental':
      factionTowers = ELEMENTAL_TOWERS;
      break;
    default:
      // If no faction is specified, default to tech
      factionTowers = TECH_TOWERS;
  }
  
  // Generate final tower types with calculated stats
  return factionTowers.map((factionTower, index) => {
    const baseTower = baseTowers[index];
    
    return {
      id: factionTower.id,
      name: factionTower.name,
      cost: Math.round(baseTower.baseCost * factionTower.statModifiers.cost),
      damage: Math.round(baseTower.baseDamage * factionTower.statModifiers.damage),
      range: +(baseTower.baseRange * factionTower.statModifiers.range).toFixed(1),
      fireRate: +(baseTower.baseFireRate * factionTower.statModifiers.fireRate).toFixed(1),
      color: factionTower.color,
      description: factionTower.description,
      icon: factionTower.icon,
      svgIcon: factionTower.svgIcon,
      faction: factionTower.faction
    };
  });
}

// Default export provides tower types for the selected faction
export function getTowerTypes(faction = 'tech') {
  return generateTowerTypes(faction);
}

// Also export the constant with all tower types
export const TOWER_TYPES = generateTowerTypes('tech'); 