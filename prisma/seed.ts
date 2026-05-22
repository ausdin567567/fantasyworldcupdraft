import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

// ─── National Teams ───────────────────────────────────────────────────────────

const nationalTeams = [
  // Group A
  { code: "USA", name: "United States", group: "A" },
  { code: "MEX", name: "Mexico", group: "A" },
  { code: "CAN", name: "Canada", group: "A" },
  { code: "PAN", name: "Panama", group: "A" },
  // Group B
  { code: "ARG", name: "Argentina", group: "B" },
  { code: "CHI", name: "Chile", group: "B" },
  { code: "PER", name: "Peru", group: "B" },
  { code: "BOL", name: "Bolivia", group: "B" },
  // Group C
  { code: "BRA", name: "Brazil", group: "C" },
  { code: "URU", name: "Uruguay", group: "C" },
  { code: "ECU", name: "Ecuador", group: "C" },
  { code: "VEN", name: "Venezuela", group: "C" },
  // Group D
  { code: "COL", name: "Colombia", group: "D" },
  { code: "PAR", name: "Paraguay", group: "D" },
  { code: "CRI", name: "Costa Rica", group: "D" },
  { code: "HON", name: "Honduras", group: "D" },
  // Group E
  { code: "ENG", name: "England", group: "E" },
  { code: "FRA", name: "France", group: "E" },
  { code: "SUI", name: "Switzerland", group: "E" },
  { code: "SRB", name: "Serbia", group: "E" },
  // Group F
  { code: "ESP", name: "Spain", group: "F" },
  { code: "POR", name: "Portugal", group: "F" },
  { code: "CRO", name: "Croatia", group: "F" },
  { code: "MAR", name: "Morocco", group: "F" },
  // Group G
  { code: "GER", name: "Germany", group: "G" },
  { code: "NED", name: "Netherlands", group: "G" },
  { code: "DEN", name: "Denmark", group: "G" },
  { code: "SCO", name: "Scotland", group: "G" },
  // Group H
  { code: "BEL", name: "Belgium", group: "H" },
  { code: "AUT", name: "Austria", group: "H" },
  { code: "TUR", name: "Turkey", group: "H" },
  { code: "UKR", name: "Ukraine", group: "H" },
  // Group I
  { code: "ITA", name: "Italy", group: "I" },
  { code: "GRE", name: "Greece", group: "I" },
  { code: "SLO", name: "Slovenia", group: "I" },
  { code: "ALB", name: "Albania", group: "I" },
  // Group J
  { code: "JAP", name: "Japan", group: "J" },
  { code: "KOR", name: "South Korea", group: "J" },
  { code: "AUS", name: "Australia", group: "J" },
  { code: "IRN", name: "Iran", group: "J" },
  // Group K
  { code: "SEN", name: "Senegal", group: "K" },
  { code: "NGA", name: "Nigeria", group: "K" },
  { code: "CIV", name: "Ivory Coast", group: "K" },
  { code: "EGY", name: "Egypt", group: "K" },
  // Group L
  { code: "SAU", name: "Saudi Arabia", group: "L" },
  { code: "QAT", name: "Qatar", group: "L" },
  { code: "IRQ", name: "Iraq", group: "L" },
  { code: "NZL", name: "New Zealand", group: "L" },
];

// ─── Players (known squads / star players as of May 2026) ─────────────────────

type PlayerSeed = {
  name: string;
  countryCode: string;
  position: Position;
  clubTeam: string;
};

const players: PlayerSeed[] = [
  // ── Argentina ──
  { name: "Emiliano Martínez", countryCode: "ARG", position: "GK", clubTeam: "Aston Villa" },
  { name: "Franco Armani", countryCode: "ARG", position: "GK", clubTeam: "River Plate" },
  { name: "Nahuel Molina", countryCode: "ARG", position: "DEF", clubTeam: "Atlético Madrid" },
  { name: "Cristian Romero", countryCode: "ARG", position: "DEF", clubTeam: "Tottenham" },
  { name: "Lisandro Martínez", countryCode: "ARG", position: "DEF", clubTeam: "Man United" },
  { name: "Nicolás Tagliafico", countryCode: "ARG", position: "DEF", clubTeam: "Lyon" },
  { name: "Germán Pezzella", countryCode: "ARG", position: "DEF", clubTeam: "Real Betis" },
  { name: "Rodrigo De Paul", countryCode: "ARG", position: "MID", clubTeam: "Atlético Madrid" },
  { name: "Leandro Paredes", countryCode: "ARG", position: "MID", clubTeam: "Roma" },
  { name: "Alexis Mac Allister", countryCode: "ARG", position: "MID", clubTeam: "Liverpool" },
  { name: "Enzo Fernández", countryCode: "ARG", position: "MID", clubTeam: "Chelsea" },
  { name: "Giovani Lo Celso", countryCode: "ARG", position: "MID", clubTeam: "Villarreal" },
  { name: "Lionel Messi", countryCode: "ARG", position: "FWD", clubTeam: "Inter Miami" },
  { name: "Lautaro Martínez", countryCode: "ARG", position: "FWD", clubTeam: "Inter Milan" },
  { name: "Julián Álvarez", countryCode: "ARG", position: "FWD", clubTeam: "Atlético Madrid" },
  { name: "Ángel Di María", countryCode: "ARG", position: "FWD", clubTeam: "Benfica" },
  { name: "Paulo Dybala", countryCode: "ARG", position: "FWD", clubTeam: "Roma" },

  // ── Brazil ──
  { name: "Alisson Becker", countryCode: "BRA", position: "GK", clubTeam: "Liverpool" },
  { name: "Ederson", countryCode: "BRA", position: "GK", clubTeam: "Man City" },
  { name: "Danilo", countryCode: "BRA", position: "DEF", clubTeam: "Juventus" },
  { name: "Marquinhos", countryCode: "BRA", position: "DEF", clubTeam: "PSG" },
  { name: "Bremer", countryCode: "BRA", position: "DEF", clubTeam: "Juventus" },
  { name: "Guilherme Arana", countryCode: "BRA", position: "DEF", clubTeam: "Atlético Mineiro" },
  { name: "Casemiro", countryCode: "BRA", position: "MID", clubTeam: "Man United" },
  { name: "Bruno Guimarães", countryCode: "BRA", position: "MID", clubTeam: "Newcastle" },
  { name: "Lucas Paquetá", countryCode: "BRA", position: "MID", clubTeam: "West Ham" },
  { name: "Vinicius Jr", countryCode: "BRA", position: "FWD", clubTeam: "Real Madrid" },
  { name: "Rodrygo", countryCode: "BRA", position: "FWD", clubTeam: "Real Madrid" },
  { name: "Raphinha", countryCode: "BRA", position: "FWD", clubTeam: "Barcelona" },
  { name: "Endrick", countryCode: "BRA", position: "FWD", clubTeam: "Real Madrid" },
  { name: "Gabriel Martinelli", countryCode: "BRA", position: "FWD", clubTeam: "Arsenal" },
  { name: "Gabriel Jesus", countryCode: "BRA", position: "FWD", clubTeam: "Arsenal" },

  // ── England ──
  { name: "Jordan Pickford", countryCode: "ENG", position: "GK", clubTeam: "Everton" },
  { name: "Aaron Ramsdale", countryCode: "ENG", position: "GK", clubTeam: "Southampton" },
  { name: "Trent Alexander-Arnold", countryCode: "ENG", position: "DEF", clubTeam: "Real Madrid" },
  { name: "Kyle Walker", countryCode: "ENG", position: "DEF", clubTeam: "Man City" },
  { name: "John Stones", countryCode: "ENG", position: "DEF", clubTeam: "Man City" },
  { name: "Harry Maguire", countryCode: "ENG", position: "DEF", clubTeam: "Man United" },
  { name: "Luke Shaw", countryCode: "ENG", position: "DEF", clubTeam: "Man United" },
  { name: "Declan Rice", countryCode: "ENG", position: "MID", clubTeam: "Arsenal" },
  { name: "Jude Bellingham", countryCode: "ENG", position: "MID", clubTeam: "Real Madrid" },
  { name: "Conor Gallagher", countryCode: "ENG", position: "MID", clubTeam: "Atlético Madrid" },
  { name: "Phil Foden", countryCode: "ENG", position: "MID", clubTeam: "Man City" },
  { name: "Harry Kane", countryCode: "ENG", position: "FWD", clubTeam: "Bayern Munich" },
  { name: "Bukayo Saka", countryCode: "ENG", position: "FWD", clubTeam: "Arsenal" },
  { name: "Marcus Rashford", countryCode: "ENG", position: "FWD", clubTeam: "Man United" },
  { name: "Ollie Watkins", countryCode: "ENG", position: "FWD", clubTeam: "Aston Villa" },

  // ── France ──
  { name: "Mike Maignan", countryCode: "FRA", position: "GK", clubTeam: "AC Milan" },
  { name: "Alphonse Areola", countryCode: "FRA", position: "GK", clubTeam: "West Ham" },
  { name: "Jules Koundé", countryCode: "FRA", position: "DEF", clubTeam: "Barcelona" },
  { name: "William Saliba", countryCode: "FRA", position: "DEF", clubTeam: "Arsenal" },
  { name: "Dayot Upamecano", countryCode: "FRA", position: "DEF", clubTeam: "Bayern Munich" },
  { name: "Theo Hernández", countryCode: "FRA", position: "DEF", clubTeam: "AC Milan" },
  { name: "N'Golo Kanté", countryCode: "FRA", position: "MID", clubTeam: "Al-Ittihad" },
  { name: "Aurélien Tchouaméni", countryCode: "FRA", position: "MID", clubTeam: "Real Madrid" },
  { name: "Antoine Griezmann", countryCode: "FRA", position: "MID", clubTeam: "Atlético Madrid" },
  { name: "Eduardo Camavinga", countryCode: "FRA", position: "MID", clubTeam: "Real Madrid" },
  { name: "Kylian Mbappé", countryCode: "FRA", position: "FWD", clubTeam: "Real Madrid" },
  { name: "Ousmane Dembélé", countryCode: "FRA", position: "FWD", clubTeam: "PSG" },
  { name: "Marcus Thuram", countryCode: "FRA", position: "FWD", clubTeam: "Inter Milan" },
  { name: "Randal Kolo Muani", countryCode: "FRA", position: "FWD", clubTeam: "Juventus" },

  // ── Spain ──
  { name: "Unai Simón", countryCode: "ESP", position: "GK", clubTeam: "Athletic Bilbao" },
  { name: "David Raya", countryCode: "ESP", position: "GK", clubTeam: "Arsenal" },
  { name: "Dani Carvajal", countryCode: "ESP", position: "DEF", clubTeam: "Real Madrid" },
  { name: "Alejandro Grimaldo", countryCode: "ESP", position: "DEF", clubTeam: "Bayer Leverkusen" },
  { name: "Aymeric Laporte", countryCode: "ESP", position: "DEF", clubTeam: "Al-Nassr" },
  { name: "Robin Le Normand", countryCode: "ESP", position: "DEF", clubTeam: "Real Sociedad" },
  { name: "Rodri", countryCode: "ESP", position: "MID", clubTeam: "Man City" },
  { name: "Pedri", countryCode: "ESP", position: "MID", clubTeam: "Barcelona" },
  { name: "Gavi", countryCode: "ESP", position: "MID", clubTeam: "Barcelona" },
  { name: "Fabián Ruiz", countryCode: "ESP", position: "MID", clubTeam: "PSG" },
  { name: "Dani Olmo", countryCode: "ESP", position: "MID", clubTeam: "Barcelona" },
  { name: "Álvaro Morata", countryCode: "ESP", position: "FWD", clubTeam: "AC Milan" },
  { name: "Nico Williams", countryCode: "ESP", position: "FWD", clubTeam: "Athletic Bilbao" },
  { name: "Lamine Yamal", countryCode: "ESP", position: "FWD", clubTeam: "Barcelona" },
  { name: "Mikel Oyarzabal", countryCode: "ESP", position: "FWD", clubTeam: "Real Sociedad" },

  // ── Germany ──
  { name: "Manuel Neuer", countryCode: "GER", position: "GK", clubTeam: "Bayern Munich" },
  { name: "Marc-André ter Stegen", countryCode: "GER", position: "GK", clubTeam: "Barcelona" },
  { name: "Joshua Kimmich", countryCode: "GER", position: "DEF", clubTeam: "Bayern Munich" },
  { name: "Antonio Rüdiger", countryCode: "GER", position: "DEF", clubTeam: "Real Madrid" },
  { name: "Jonathan Tah", countryCode: "GER", position: "DEF", clubTeam: "Bayer Leverkusen" },
  { name: "David Raum", countryCode: "GER", position: "DEF", clubTeam: "RB Leipzig" },
  { name: "Toni Kroos", countryCode: "GER", position: "MID", clubTeam: "Real Madrid" },
  { name: "Florian Wirtz", countryCode: "GER", position: "MID", clubTeam: "Bayer Leverkusen" },
  { name: "Jamal Musiala", countryCode: "GER", position: "MID", clubTeam: "Bayern Munich" },
  { name: "Robert Andrich", countryCode: "GER", position: "MID", clubTeam: "Bayer Leverkusen" },
  { name: "Kai Havertz", countryCode: "GER", position: "FWD", clubTeam: "Arsenal" },
  { name: "Leroy Sané", countryCode: "GER", position: "FWD", clubTeam: "Bayern Munich" },
  { name: "Niclas Füllkrug", countryCode: "GER", position: "FWD", clubTeam: "West Ham" },
  { name: "Thomas Müller", countryCode: "GER", position: "FWD", clubTeam: "Bayern Munich" },

  // ── Portugal ──
  { name: "Diogo Costa", countryCode: "POR", position: "GK", clubTeam: "Porto" },
  { name: "Rui Patrício", countryCode: "POR", position: "GK", clubTeam: "Roma" },
  { name: "João Cancelo", countryCode: "POR", position: "DEF", clubTeam: "Barcelona" },
  { name: "Rúben Dias", countryCode: "POR", position: "DEF", clubTeam: "Man City" },
  { name: "Pepe", countryCode: "POR", position: "DEF", clubTeam: "Porto" },
  { name: "Nuno Mendes", countryCode: "POR", position: "DEF", clubTeam: "PSG" },
  { name: "Bernardo Silva", countryCode: "POR", position: "MID", clubTeam: "Man City" },
  { name: "Bruno Fernandes", countryCode: "POR", position: "MID", clubTeam: "Man United" },
  { name: "Vitinha", countryCode: "POR", position: "MID", clubTeam: "PSG" },
  { name: "João Palhinha", countryCode: "POR", position: "MID", clubTeam: "Bayern Munich" },
  { name: "Cristiano Ronaldo", countryCode: "POR", position: "FWD", clubTeam: "Al-Nassr" },
  { name: "Rafael Leão", countryCode: "POR", position: "FWD", clubTeam: "AC Milan" },
  { name: "João Félix", countryCode: "POR", position: "FWD", clubTeam: "Chelsea" },
  { name: "Gonçalo Ramos", countryCode: "POR", position: "FWD", clubTeam: "PSG" },

  // ── Netherlands ──
  { name: "Bart Verbruggen", countryCode: "NED", position: "GK", clubTeam: "Brighton" },
  { name: "Mark Flekken", countryCode: "NED", position: "GK", clubTeam: "Brentford" },
  { name: "Denzel Dumfries", countryCode: "NED", position: "DEF", clubTeam: "Inter Milan" },
  { name: "Stefan de Vrij", countryCode: "NED", position: "DEF", clubTeam: "Inter Milan" },
  { name: "Virgil van Dijk", countryCode: "NED", position: "DEF", clubTeam: "Liverpool" },
  { name: "Nathan Aké", countryCode: "NED", position: "DEF", clubTeam: "Man City" },
  { name: "Tijjani Reijnders", countryCode: "NED", position: "MID", clubTeam: "AC Milan" },
  { name: "Ryan Gravenberch", countryCode: "NED", position: "MID", clubTeam: "Liverpool" },
  { name: "Teun Koopmeiners", countryCode: "NED", position: "MID", clubTeam: "Juventus" },
  { name: "Xavi Simons", countryCode: "NED", position: "MID", clubTeam: "RB Leipzig" },
  { name: "Memphis Depay", countryCode: "NED", position: "FWD", clubTeam: "Corinthians" },
  { name: "Cody Gakpo", countryCode: "NED", position: "FWD", clubTeam: "Liverpool" },
  { name: "Donyell Malen", countryCode: "NED", position: "FWD", clubTeam: "Aston Villa" },

  // ── Belgium ──
  { name: "Thibaut Courtois", countryCode: "BEL", position: "GK", clubTeam: "Real Madrid" },
  { name: "Thomas Kaminski", countryCode: "BEL", position: "GK", clubTeam: "Luton Town" },
  { name: "Alexander Teklitsch", countryCode: "BEL", position: "DEF", clubTeam: "Gent" },
  { name: "Jan Vertonghen", countryCode: "BEL", position: "DEF", clubTeam: "RSC Anderlecht" },
  { name: "Wout Faes", countryCode: "BEL", position: "DEF", clubTeam: "Leicester City" },
  { name: "Axel Witsel", countryCode: "BEL", position: "MID", clubTeam: "Atlético Madrid" },
  { name: "Youri Tielemans", countryCode: "BEL", position: "MID", clubTeam: "Aston Villa" },
  { name: "Kevin De Bruyne", countryCode: "BEL", position: "MID", clubTeam: "Man City" },
  { name: "Amadou Onana", countryCode: "BEL", position: "MID", clubTeam: "Aston Villa" },
  { name: "Romelu Lukaku", countryCode: "BEL", position: "FWD", clubTeam: "Napoli" },
  { name: "Lois Openda", countryCode: "BEL", position: "FWD", clubTeam: "RB Leipzig" },
  { name: "Leandro Trossard", countryCode: "BEL", position: "FWD", clubTeam: "Arsenal" },
  { name: "Dodi Lukébakio", countryCode: "BEL", position: "FWD", clubTeam: "Sevilla" },

  // ── Uruguay ──
  { name: "Sergio Rochet", countryCode: "URU", position: "GK", clubTeam: "Nacional" },
  { name: "José María Giménez", countryCode: "URU", position: "DEF", clubTeam: "Atlético Madrid" },
  { name: "Ronald Araújo", countryCode: "URU", position: "DEF", clubTeam: "Barcelona" },
  { name: "Mathías Olivera", countryCode: "URU", position: "DEF", clubTeam: "Napoli" },
  { name: "Federico Valverde", countryCode: "URU", position: "MID", clubTeam: "Real Madrid" },
  { name: "Rodrigo Bentancur", countryCode: "URU", position: "MID", clubTeam: "Tottenham" },
  { name: "Manuel Ugarte", countryCode: "URU", position: "MID", clubTeam: "Man United" },
  { name: "Darwin Núñez", countryCode: "URU", position: "FWD", clubTeam: "Liverpool" },
  { name: "Facundo Torres", countryCode: "URU", position: "FWD", clubTeam: "Orlando City" },
  { name: "Luis Suárez", countryCode: "URU", position: "FWD", clubTeam: "Inter Miami" },

  // ── Colombia ──
  { name: "Camilo Vargas", countryCode: "COL", position: "GK", clubTeam: "Atlas" },
  { name: "Dávinson Sánchez", countryCode: "COL", position: "DEF", clubTeam: "Galatasaray" },
  { name: "Yerry Mina", countryCode: "COL", position: "DEF", clubTeam: "Fiorentina" },
  { name: "Johan Mojica", countryCode: "COL", position: "DEF", clubTeam: "Girona" },
  { name: "Wilmar Barrios", countryCode: "COL", position: "MID", clubTeam: "Zenit" },
  { name: "Mateus Uribe", countryCode: "COL", position: "MID", clubTeam: "Porto" },
  { name: "James Rodríguez", countryCode: "COL", position: "MID", clubTeam: "Rayo Vallecano" },
  { name: "Luis Díaz", countryCode: "COL", position: "FWD", clubTeam: "Liverpool" },
  { name: "Rafael Santos Borré", countryCode: "COL", position: "FWD", clubTeam: "Eintracht Frankfurt" },
  { name: "Jhon Durán", countryCode: "COL", position: "FWD", clubTeam: "Aston Villa" },

  // ── Morocco ──
  { name: "Yassine Bounou", countryCode: "MAR", position: "GK", clubTeam: "Al-Hilal" },
  { name: "Achraf Hakimi", countryCode: "MAR", position: "DEF", clubTeam: "PSG" },
  { name: "Nayef Aguerd", countryCode: "MAR", position: "DEF", clubTeam: "West Ham" },
  { name: "Romain Saïss", countryCode: "MAR", position: "DEF", clubTeam: "Besiktas" },
  { name: "Noussair Mazraoui", countryCode: "MAR", position: "DEF", clubTeam: "Man United" },
  { name: "Azzedine Ounahi", countryCode: "MAR", position: "MID", clubTeam: "Marseille" },
  { name: "Sofyan Amrabat", countryCode: "MAR", position: "MID", clubTeam: "Man United" },
  { name: "Selim Amallah", countryCode: "MAR", position: "MID", clubTeam: "Standard Liège" },
  { name: "Hakim Ziyech", countryCode: "MAR", position: "FWD", clubTeam: "Galatasaray" },
  { name: "Youssef En-Nesyri", countryCode: "MAR", position: "FWD", clubTeam: "Fenerbahçe" },
  { name: "Sofiane Boufal", countryCode: "MAR", position: "FWD", clubTeam: "Angers" },

  // ── Japan ──
  { name: "Shuichi Gonda", countryCode: "JAP", position: "GK", clubTeam: "Shimizu S-Pulse" },
  { name: "Hiroki Sakai", countryCode: "JAP", position: "DEF", clubTeam: "Urawa Red Diamonds" },
  { name: "Maya Yoshida", countryCode: "JAP", position: "DEF", clubTeam: "Vissel Kobe" },
  { name: "Ko Itakura", countryCode: "JAP", position: "DEF", clubTeam: "Borussia M'gladbach" },
  { name: "Yuto Nagatomo", countryCode: "JAP", position: "DEF", clubTeam: "FC Tokyo" },
  { name: "Wataru Endo", countryCode: "JAP", position: "MID", clubTeam: "Liverpool" },
  { name: "Hidemasa Morita", countryCode: "JAP", position: "MID", clubTeam: "Sporting CP" },
  { name: "Junya Ito", countryCode: "JAP", position: "MID", clubTeam: "Reims" },
  { name: "Takumi Minamino", countryCode: "JAP", position: "FWD", clubTeam: "Monaco" },
  { name: "Daichi Kamada", countryCode: "JAP", position: "FWD", clubTeam: "Crystal Palace" },
  { name: "Ritsu Doan", countryCode: "JAP", position: "FWD", clubTeam: "Freiburg" },
  { name: "Kaoru Mitoma", countryCode: "JAP", position: "FWD", clubTeam: "Brighton" },

  // ── Senegal ──
  { name: "Édouard Mendy", countryCode: "SEN", position: "GK", clubTeam: "Al-Ahli" },
  { name: "Kalidou Koulibaly", countryCode: "SEN", position: "DEF", clubTeam: "Al-Hilal" },
  { name: "Abdou Diallo", countryCode: "SEN", position: "DEF", clubTeam: "RB Leipzig" },
  { name: "Ismail Jakobs", countryCode: "SEN", position: "DEF", clubTeam: "Monaco" },
  { name: "Idrissa Gueye", countryCode: "SEN", position: "MID", clubTeam: "Everton" },
  { name: "Cheikhou Kouyaté", countryCode: "SEN", position: "MID", clubTeam: "Nottm Forest" },
  { name: "Sadio Mané", countryCode: "SEN", position: "FWD", clubTeam: "Al-Nassr" },
  { name: "Ismaila Sarr", countryCode: "SEN", position: "FWD", clubTeam: "Crystal Palace" },
  { name: "Boulaye Dia", countryCode: "SEN", position: "FWD", clubTeam: "Lazio" },
  { name: "Nicolas Jackson", countryCode: "SEN", position: "FWD", clubTeam: "Chelsea" },

  // ── USA ──
  { name: "Matt Turner", countryCode: "USA", position: "GK", clubTeam: "Crystal Palace" },
  { name: "Ethan Horvath", countryCode: "USA", position: "GK", clubTeam: "Luton Town" },
  { name: "Sergino Dest", countryCode: "USA", position: "DEF", clubTeam: "PSV" },
  { name: "Miles Robinson", countryCode: "USA", position: "DEF", clubTeam: "Atlanta United" },
  { name: "Chris Richards", countryCode: "USA", position: "DEF", clubTeam: "Crystal Palace" },
  { name: "Antonee Robinson", countryCode: "USA", position: "DEF", clubTeam: "Fulham" },
  { name: "Tyler Adams", countryCode: "USA", position: "MID", clubTeam: "Bournemouth" },
  { name: "Yunus Musah", countryCode: "USA", position: "MID", clubTeam: "AC Milan" },
  { name: "Weston McKennie", countryCode: "USA", position: "MID", clubTeam: "Juventus" },
  { name: "Christian Pulisic", countryCode: "USA", position: "FWD", clubTeam: "AC Milan" },
  { name: "Gio Reyna", countryCode: "USA", position: "FWD", clubTeam: "Nottm Forest" },
  { name: "Ricardo Pepi", countryCode: "USA", position: "FWD", clubTeam: "PSV" },
  { name: "Folarin Balogun", countryCode: "USA", position: "FWD", clubTeam: "Monaco" },

  // ── Mexico ──
  { name: "Guillermo Ochoa", countryCode: "MEX", position: "GK", clubTeam: "Salernitana" },
  { name: "Luis Malagón", countryCode: "MEX", position: "GK", clubTeam: "Club América" },
  { name: "Jorge Sánchez", countryCode: "MEX", position: "DEF", clubTeam: "Ajax" },
  { name: "César Montes", countryCode: "MEX", position: "DEF", clubTeam: "Monterrey" },
  { name: "Johan Vásquez", countryCode: "MEX", position: "DEF", clubTeam: "Genoa" },
  { name: "Gerardo Arteaga", countryCode: "MEX", position: "DEF", clubTeam: "Genk" },
  { name: "Edson Álvarez", countryCode: "MEX", position: "MID", clubTeam: "West Ham" },
  { name: "Héctor Herrera", countryCode: "MEX", position: "MID", clubTeam: "Houston Dynamo" },
  { name: "Hirving Lozano", countryCode: "MEX", position: "FWD", clubTeam: "PSV" },
  { name: "Henry Martín", countryCode: "MEX", position: "FWD", clubTeam: "Club América" },
  { name: "Santiago Giménez", countryCode: "MEX", position: "FWD", clubTeam: "Feyenoord" },
  { name: "Alexis Vega", countryCode: "MEX", position: "FWD", clubTeam: "Toluca" },

  // ── Croatia ──
  { name: "Dominik Livaković", countryCode: "CRO", position: "GK", clubTeam: "Fenerbahçe" },
  { name: "Josip Šutalo", countryCode: "CRO", position: "DEF", clubTeam: "Ajax" },
  { name: "Joško Gvardiol", countryCode: "CRO", position: "DEF", clubTeam: "Man City" },
  { name: "Dejan Lovren", countryCode: "CRO", position: "DEF", clubTeam: "Zenit" },
  { name: "Borna Sosa", countryCode: "CRO", position: "DEF", clubTeam: "Ajax" },
  { name: "Luka Modrić", countryCode: "CRO", position: "MID", clubTeam: "Real Madrid" },
  { name: "Marcelo Brozović", countryCode: "CRO", position: "MID", clubTeam: "Al-Nassr" },
  { name: "Mateo Kovačić", countryCode: "CRO", position: "MID", clubTeam: "Man City" },
  { name: "Ivan Perišić", countryCode: "CRO", position: "FWD", clubTeam: "Hajduk Split" },
  { name: "Andrej Kramarić", countryCode: "CRO", position: "FWD", clubTeam: "Hoffenheim" },
  { name: "Bruno Petković", countryCode: "CRO", position: "FWD", clubTeam: "Dinamo Zagreb" },

  // ── South Korea ──
  { name: "Kim Seung-gyu", countryCode: "KOR", position: "GK", clubTeam: "Vissel Kobe" },
  { name: "Kim Min-jae", countryCode: "KOR", position: "DEF", clubTeam: "Bayern Munich" },
  { name: "Kim Young-gwon", countryCode: "KOR", position: "DEF", clubTeam: "Ulsan Hyundai" },
  { name: "Lee Kang-in", countryCode: "KOR", position: "MID", clubTeam: "PSG" },
  { name: "Hwang Hee-chan", countryCode: "KOR", position: "FWD", clubTeam: "Wolves" },
  { name: "Son Heung-min", countryCode: "KOR", position: "FWD", clubTeam: "Tottenham" },
  { name: "Cho Gue-sung", countryCode: "KOR", position: "FWD", clubTeam: "Freiburg" },
];

// ─── Gameweeks ─────────────────────────────────────────────────────────────────

const gameweeks = [
  {
    round: "GROUP_MD1" as const,
    name: "Group Stage – Matchday 1",
    startDate: new Date("2026-06-11T00:00:00Z"),
    endDate: new Date("2026-06-17T23:59:00Z"),
    deadline: new Date("2026-06-11T13:30:00Z"),
    waiverDeadline: new Date("2026-06-10T13:30:00Z"),
  },
  {
    round: "GROUP_MD2" as const,
    name: "Group Stage – Matchday 2",
    startDate: new Date("2026-06-18T00:00:00Z"),
    endDate: new Date("2026-06-23T23:59:00Z"),
    deadline: new Date("2026-06-18T13:30:00Z"),
    waiverDeadline: new Date("2026-06-17T13:30:00Z"),
  },
  {
    round: "GROUP_MD3" as const,
    name: "Group Stage – Matchday 3",
    startDate: new Date("2026-06-24T00:00:00Z"),
    endDate: new Date("2026-06-27T23:59:00Z"),
    deadline: new Date("2026-06-24T13:30:00Z"),
    waiverDeadline: new Date("2026-06-23T13:30:00Z"),
  },
  {
    round: "ROUND_OF_32" as const,
    name: "Round of 32",
    startDate: new Date("2026-06-28T00:00:00Z"),
    endDate: new Date("2026-07-03T23:59:00Z"),
    deadline: new Date("2026-06-28T13:30:00Z"),
    waiverDeadline: new Date("2026-06-27T13:30:00Z"),
  },
  {
    round: "ROUND_OF_16" as const,
    name: "Round of 16",
    startDate: new Date("2026-07-04T00:00:00Z"),
    endDate: new Date("2026-07-07T23:59:00Z"),
    deadline: new Date("2026-07-04T13:30:00Z"),
    waiverDeadline: new Date("2026-07-03T13:30:00Z"),
  },
  {
    round: "QUARTERFINAL" as const,
    name: "Quarter-Finals",
    startDate: new Date("2026-07-09T00:00:00Z"),
    endDate: new Date("2026-07-11T23:59:00Z"),
    deadline: new Date("2026-07-09T13:30:00Z"),
    waiverDeadline: new Date("2026-07-08T13:30:00Z"),
  },
  {
    round: "SEMIFINAL" as const,
    name: "Semi-Finals",
    startDate: new Date("2026-07-14T00:00:00Z"),
    endDate: new Date("2026-07-15T23:59:00Z"),
    deadline: new Date("2026-07-14T13:30:00Z"),
    waiverDeadline: new Date("2026-07-13T13:30:00Z"),
  },
  {
    round: "THIRD_PLACE_FINAL" as const,
    name: "3rd Place & Final",
    startDate: new Date("2026-07-18T00:00:00Z"),
    endDate: new Date("2026-07-19T23:59:00Z"),
    deadline: new Date("2026-07-18T13:30:00Z"),
    waiverDeadline: new Date("2026-07-17T13:30:00Z"),
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding national teams...");
  await prisma.nationalTeam.createMany({ data: nationalTeams, skipDuplicates: true });

  console.log("Seeding gameweeks...");
  for (const gw of gameweeks) {
    await prisma.gameweek.upsert({
      where: { round: gw.round },
      update: gw,
      create: gw,
    });
  }

  console.log(`Seeding ${players.length} players...`);
  for (const player of players) {
    await prisma.player.upsert({
      where: {
        // Use name + countryCode as a practical unique key during seeding
        apiFootballId: undefined,
        id: "",
      },
      update: {},
      create: player,
    });
  }

  // Simpler bulk insert approach — idempotent via skipDuplicates isn't easily possible
  // without a unique constraint on (name, countryCode), so we clear and re-seed players.
  await prisma.player.deleteMany({});
  await prisma.player.createMany({ data: players });

  console.log("Done! Seeded:");
  console.log(`  ${nationalTeams.length} national teams`);
  console.log(`  ${gameweeks.length} gameweeks`);
  console.log(`  ${players.length} players`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
