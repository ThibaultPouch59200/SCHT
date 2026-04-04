import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOCATIONS = [
  // ── HURSTON ────────────────────────────────────────────────────────────
  { system: 'Stanton', planet: 'Hurston',   name: 'Lorville' },
  { system: 'Stanton', planet: 'Hurston',   name: 'Everus Harbor' },
  { system: 'Stanton', planet: 'Hurston',   name: 'HUR-L2 Faithful Dream' },
  { system: 'Stanton', planet: 'Hurston',   name: 'HUR-L3 Thundering Express' },
  { system: 'Stanton', planet: 'Hurston',   name: 'HUR-L4 Classical Drive' },
  { system: 'Stanton', planet: 'Hurston',   name: 'HUR-L5 Wicked Flint' },
  // Hurston moons
  { system: 'Stanton', planet: 'Arial',     name: 'Arial' },
  { system: 'Stanton', planet: 'Aberdeen',  name: 'Aberdeen' },
  { system: 'Stanton', planet: 'Magda',     name: 'Magda' },
  { system: 'Stanton', planet: 'Ita',       name: 'Ita' },

  // ── CRUSADER ───────────────────────────────────────────────────────────
  { system: 'Stanton', planet: 'Crusader',  name: 'Orison' },
  { system: 'Stanton', planet: 'Crusader',  name: 'Port Olisar' },
  { system: 'Stanton', planet: 'Crusader',  name: 'CRU-L1 Ambitious Dream' },
  { system: 'Stanton', planet: 'Crusader',  name: 'CRU-L4 Shallow Fields' },
  { system: 'Stanton', planet: 'Crusader',  name: 'CRU-L5 Beautiful Glen' },
  // Crusader moons
  { system: 'Stanton', planet: 'Yela',      name: 'GrimHex' },
  { system: 'Stanton', planet: 'Yela',      name: 'Yela' },
  { system: 'Stanton', planet: 'Cellin',    name: 'Cellin' },
  { system: 'Stanton', planet: 'Daymar',    name: 'Daymar' },

  // ── ARCCORP ────────────────────────────────────────────────────────────
  { system: 'Stanton', planet: 'ArcCorp',   name: 'Area18' },
  { system: 'Stanton', planet: 'ArcCorp',   name: 'Baijini Point' },
  { system: 'Stanton', planet: 'ArcCorp',   name: 'ARC-L2 Lively Pathway' },
  { system: 'Stanton', planet: 'ArcCorp',   name: 'ARC-L4 Starlight Service' },
  { system: 'Stanton', planet: 'ArcCorp',   name: 'ARC-L5 Yellow Core' },
  // ArcCorp moons
  { system: 'Stanton', planet: 'Lyria',     name: 'Lyria' },
  { system: 'Stanton', planet: 'Wala',      name: 'Wala' },

  // ── MICROTECH ──────────────────────────────────────────────────────────
  { system: 'Stanton', planet: 'MicroTech', name: 'New Babbage' },
  { system: 'Stanton', planet: 'MicroTech', name: 'Port Tressler' },
  { system: 'Stanton', planet: 'MicroTech', name: 'MIC-L2 Long Forest' },
  { system: 'Stanton', planet: 'MicroTech', name: 'MIC-L3 Endless Odyssey' },
  { system: 'Stanton', planet: 'MicroTech', name: 'MIC-L4 Shallow Frontier' },
  { system: 'Stanton', planet: 'MicroTech', name: 'MIC-L5 Modern Icebox' },
  // MicroTech moons
  { system: 'Stanton', planet: 'Calliope',  name: 'Calliope' },
  { system: 'Stanton', planet: 'Clio',      name: 'Clio' },
  { system: 'Stanton', planet: 'Euterpe',   name: 'Euterpe' },

  // ── PYRO ───────────────────────────────────────────────────────────────
  { system: 'Pyro',    planet: 'Pyro I',    name: 'Pyro I' },
  { system: 'Pyro',    planet: 'Monox',     name: 'Monox' },
  { system: 'Pyro',    planet: 'Ignis',     name: 'Ignis' },
  { system: 'Pyro',    planet: 'Pyro IV',   name: 'Pyro IV' },
  { system: 'Pyro',    planet: 'Terminus',  name: 'Terminus' },
  { system: 'Pyro',    planet: 'Fuego',     name: 'Checkmate' },
  { system: 'Pyro',    planet: 'Vành Đai',  name: 'Ruin Station' },
];

const RESOURCES = [
  // Agricultural & Consumer
  'Agricultural Supplies',
  'Processed Food',
  'Distilled Spirits',
  'Medical Supplies',
  'Medical Equipment',
  'Stims',
  'Waste',

  // Refined Metals
  'Aluminum',
  'Copper',
  'Steel',
  'Titanium',
  'Tungsten',
  'Iron',
  'Iridium',
  'Platinum',
  'Palladium',

  // Raw Minerals (surface & mined)
  'Quartz',
  'Corundum',
  'Beryl',
  'Taranite',
  'Laranite',
  'Borase',
  'Hadanite',
  'Gold',
  'Diamond',
  'Hephaestanite',
  'Stileron',
  'Janalite',
  'Dolivine',
  'Rucubane',
  'Ophirite',
  'Aphorite',
  'Riccite',
  'Actalyn',
  'Carentine',
  'Bexalite',
  'Icronite',

  // Gases
  'Hydrogen',
  'Chlorine',
  'Fluorine',
  'Nitrogen',
  'Oxygen',
  'Diluthermex',
  'Iodine',

  // Industrial
  'Scrap',
  'Neon',
  "E'tam",
  'Maze',
  'WiDoW',
  'Slam',
  'Altruciatoxin',
  'C-788 Combine Rounds',
];

async function main() {
  console.log('Seeding database...');

  // Upsert locations
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { name_system: { name: loc.name, system: loc.system } },
      update: { planet: loc.planet },
      create: loc,
    });
  }
  console.log(`✓ ${LOCATIONS.length} locations seeded`);

  // Upsert resources
  for (const name of RESOURCES) {
    await prisma.resource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${RESOURCES.length} resources seeded`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
