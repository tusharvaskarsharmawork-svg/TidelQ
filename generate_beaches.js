const beaches = [
  ["querim", "Querim Beach", 15.7335, 73.6888], ["arambol", "Arambol Beach", 15.6847, 73.7029], ["mandrem", "Mandrem Beach", 15.6560, 73.7144], ["ashwem", "Ashwem Beach", 15.6322, 73.7196],
  ["morjim", "Morjim Beach", 15.6171, 73.7332], ["vagator", "Vagator Beach", 15.5994, 73.7447], ["ozran", "Ozran Beach", 15.5936, 73.7386], ["anjuna", "Anjuna Beach", 15.5738, 73.7403],
  ["baga", "Baga Beach", 15.5562, 73.7525], ["calangute", "Calangute Beach", 15.5440, 73.7553], ["candolim", "Candolim Beach", 15.5187, 73.7634], ["sinquerim", "Sinquerim Beach", 15.4988, 73.7674],
  ["miramar", "Miramar Beach", 15.4800, 73.8080], ["caranzalem", "Caranzalem Beach", 15.4638, 73.8052], ["dona-paula", "Dona Paula", 15.4526, 73.8043], ["bambolim", "Bambolim Beach", 15.4518, 73.8504],
  ["siridao", "Siridao Beach", 15.4211, 73.8647], ["bogmalo", "Bogmalo Beach", 15.3697, 73.8340], ["velsao", "Velsao Beach", 15.3475, 73.8508], ["cansaulim", "Cansaulim Beach", 15.3340, 73.8682],
  ["arossim", "Arossim Beach", 15.3262, 73.8824], ["utorda", "Utorda Beach", 15.3129, 73.8966], ["majorda", "Majorda Beach", 15.3015, 73.9064], ["betalbatim", "Betalbatim Beach", 15.2858, 73.9144],
  ["colva", "Colva Beach", 15.2766, 73.9168], ["sernabatim", "Sernabatim Beach", 15.2635, 73.9213], ["benaulim", "Benaulim Beach", 15.2519, 73.9272], ["varca", "Varca Beach", 15.2227, 73.9317],
  ["cavelossim", "Cavelossim Beach", 15.1711, 73.9400], ["mobor", "Mobor Beach", 15.1517, 73.9482], ["betul", "Betul Beach", 15.1432, 73.9634], ["canaguinim", "Canaguinim Beach", 15.1213, 73.9850],
  ["cabo-de-rama", "Cabo de Rama", 15.0886, 73.9195], ["agonda", "Agonda Beach", 15.0416, 73.9880], ["butterfly", "Butterfly Beach", 15.0216, 73.9928], ["palolem", "Palolem Beach", 15.0095, 74.0232],
  ["patnem", "Patnem Beach", 15.0019, 74.0322], ["rajbagh", "Rajbagh Beach", 14.9922, 74.0411], ["talpona", "Talpona Beach", 14.9780, 74.0475], ["galgibaga", "Galgibaga Beach", 14.9602, 74.0519],
  ["polem", "Polem Beach", 14.9122, 74.0620]
];

const arr = beaches.map(b => `  {
    id: '${b[0]}',
    name: '${b[1]}',
    latitude: ${b[2]},
    longitude: ${b[3]},
    current_score: Math.floor(Math.random() * (95 - 50 + 1) + 50),
    ai_attribution: 'Baseline environmental conditions standard. Periodic minor turbidity expected.',
    last_updated: new Date().toISOString(),
  }`).join(",\n");

console.log("const BEACHES_MOCK = [\n" + arr + "\n];");
