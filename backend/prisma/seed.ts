import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SHIPS = [
  // Petit cargo
  { name: 'MPUV Cargo',                  manufacturer: 'Argo',                  scu: 2,     category: 'Petit cargo' },
  { name: 'Cutter',                       manufacturer: 'Drake',                 scu: 4,     category: 'Petit cargo' },
  { name: 'Syulen',                       manufacturer: 'Gatac',                 scu: 6,     category: 'Petit cargo' },
  { name: 'Avenger Titan',               manufacturer: 'Aegis',                 scu: 8,     category: 'Petit cargo' },
  { name: 'Intrepid',                     manufacturer: 'Crusader',              scu: 8,     category: 'Petit cargo' },
  { name: 'Nomad',                        manufacturer: 'Consolidated Outland',  scu: 24,    category: 'Petit cargo' },
  { name: 'Reliant Kore',                manufacturer: 'MISC',                  scu: 32,    category: 'Petit cargo' },
  { name: 'Golem',                        manufacturer: 'Drake',                 scu: 32,    category: 'Petit cargo' },
  { name: 'Cutlass Black',               manufacturer: 'Drake',                 scu: 46,    category: 'Petit cargo' },
  { name: 'C1 Spirit',                   manufacturer: 'Crusader',              scu: 64,    category: 'Petit cargo' },
  { name: 'Hull A',                       manufacturer: 'MISC',                  scu: 64,    category: 'Petit cargo' },
  { name: 'Golem OX',                    manufacturer: 'Drake',                 scu: 64,    category: 'Petit cargo' },
  { name: 'Freelancer',                  manufacturer: 'MISC',                  scu: 66,    category: 'Petit cargo' },
  { name: 'Corsair',                      manufacturer: 'Drake',                 scu: 72,    category: 'Petit cargo' },
  { name: 'Retaliator (modules cargo)', manufacturer: 'Aegis',                 scu: 74,    category: 'Petit cargo' },
  { name: 'Valkyrie',                    manufacturer: 'Anvil',                 scu: 90,    category: 'Petit cargo' },
  // Cargo moyen
  { name: 'Mercury Star Runner',        manufacturer: 'Crusader',              scu: 114,   category: 'Cargo moyen' },
  { name: 'Freelancer MAX',             manufacturer: 'MISC',                  scu: 120,   category: 'Cargo moyen' },
  { name: 'Constellation Taurus',      manufacturer: 'RSI',                   scu: 174,   category: 'Cargo moyen' },
  { name: 'Asgard',                      manufacturer: 'Anvil',                 scu: 180,   category: 'Cargo moyen' },
  { name: 'RAFT',                        manufacturer: 'Argo',                  scu: 192,   category: 'Cargo moyen' },
  { name: 'Starlancer MAX',             manufacturer: 'MISC',                  scu: 224,   category: 'Cargo moyen' },
  { name: 'A2 Hercules Starlifter',    manufacturer: 'Crusader',              scu: 234,   category: 'Cargo moyen' },
  { name: 'Genesis Starliner',         manufacturer: 'Crusader',              scu: 300,   category: 'Cargo moyen' },
  { name: 'Railen',                      manufacturer: 'Gatac',                 scu: 320,   category: 'Cargo moyen' },
  { name: 'M2 Hercules Starlifter',    manufacturer: 'Crusader',              scu: 522,   category: 'Cargo moyen' },
  { name: 'Caterpillar',               manufacturer: 'Drake',                 scu: 576,   category: 'Cargo moyen' },
  { name: 'Hull B',                      manufacturer: 'MISC',                  scu: 600,   category: 'Cargo moyen' },
  { name: 'C2 Hercules Starlifter',    manufacturer: 'Crusader',              scu: 696,   category: 'Cargo moyen' },
  { name: 'Kraken Privateer',          manufacturer: 'Drake',                 scu: 768,   category: 'Cargo moyen' },
  // Gros cargo
  { name: 'Pioneer',                    manufacturer: 'Consolidated Outland',  scu: 1000,  category: 'Gros cargo' },
  { name: 'Ironclad Assault',          manufacturer: 'Drake',                 scu: 1440,  category: 'Gros cargo' },
  { name: 'Ironclad',                   manufacturer: 'Drake',                 scu: 2204,  category: 'Gros cargo' },
  { name: 'Banu Merchantman',          manufacturer: 'Banu',                  scu: 2880,  category: 'Gros cargo' },
  { name: 'Kraken',                     manufacturer: 'Drake',                 scu: 3792,  category: 'Gros cargo' },
  { name: 'Hull C',                      manufacturer: 'MISC',                  scu: 4600,  category: 'Gros cargo' },
  { name: 'Javelin',                    manufacturer: 'Aegis',                 scu: 5400,  category: 'Gros cargo' },
  { name: 'Hull D',                      manufacturer: 'MISC',                  scu: 9200,  category: 'Gros cargo' },
  { name: 'Hull E',                      manufacturer: 'MISC',                  scu: 49000, category: 'Gros cargo' },
];

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

  // Upsert ships
  for (const ship of SHIPS) {
    const existing = await prisma.ship.findFirst({ where: { name: ship.name } });
    if (existing) {
      await prisma.ship.update({
        where: { id: existing.id },
        data: { manufacturer: ship.manufacturer, scu: ship.scu, category: ship.category },
      });
    } else {
      await prisma.ship.create({ data: ship });
    }
  }
  console.log(`✓ ${SHIPS.length} ships seeded`);

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
