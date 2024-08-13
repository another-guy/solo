export interface TeamsJson {
  normalizingReplacements: NormalizingReplacement[];
  teamMappings: TeamMappings;
  teamMemberNameExceptions: string[];
}

export interface NormalizingReplacement {
  find: string;
  replaceWith: string;
  log?: boolean;
};

export interface TeamMappings {
  [teamName: string]: string[];
}

export const teams: TeamsJson = {
  normalizingReplacements: [
    {
      find: "ą",
      replaceWith: "a"
    },
    {
      find: "ć",
      replaceWith: "c"
    },
    {
      find: "ę",
      replaceWith: "e"
    },
    {
      find: "ł",
      replaceWith: "l"
    },
    {
      find: "ń",
      replaceWith: "n"
    },
    {
      find: "ó",
      replaceWith: "o"
    },
    {
      find: "ś",
      replaceWith: "s"
    },
    {
      find: "ź",
      replaceWith: "z"
    },
    {
      find: "ż",
      replaceWith: "z"
    },
    {
      find: "michael jach",
      replaceWith: "michal jach"
    },
    {
      find: "pawel.kalinowski",
      replaceWith: "pawel kalinowski"
    },
    {
      find: "kpartyka",
      replaceWith: "karol partyka"
    },
    {
      find: "lgesla",
      replaceWith: "lukasz gesla"
    },
    {
      find: "lukasgor",
      replaceWith: "lukasz gorzelany"
    },
    {
      find: "pablo",
      replaceWith: "pawel kalinowski"
    },
    {
      find: "^cristian$",
      replaceWith: "cristian martinez"
    },
    {
      find: "cristian alexis caro martinez",
      replaceWith: "cristian martinez"
    },
    {
      find: "cnoblett_ah4r",
      replaceWith: "christopher noblett"
    },
    {
      find: "diego felipe hoyos moreno",
      replaceWith: "diego hoyos"
    },
    {
      find: "diego felipe hoyos alog",
      replaceWith: "diego hoyos"
    },
    {
      find: "diego felipe hoyos ah4r",
      replaceWith: "diego hoyos"
    },
    {
      find: "^diego felipe hoyos$",
      replaceWith: "diego hoyos"
    },
    {
      find: "^domas$",
      replaceWith: "patryk domasik"
    },
    {
      find: "desktop-8igmd1f\\\\patry",
      replaceWith: "patryk domasik"
    },
    {
      find: "dzaba",
      replaceWith: "tomasz zaba"
    },
    {
      find: "ekasmambetov.admin",
      replaceWith: "eldiar kasmambetov"
    },
    {
      find: "^elijah prince \\(admin\\)$",
      replaceWith: "elijah prince"
    },
    {
      find: "^elijah$",
      replaceWith: "elijah prince"
    },
    {
      find: "^gosia nowk$",
      replaceWith: "gosia nowak"
    },
    {
      find: "gosianowak",
      replaceWith: "gosia nowak"
    },
    {
      find: "groozin",
      replaceWith: "tomasz mikos"
    },
    {
      find: "jakub leśniak",
      replaceWith: "jakub lesniak"
    },
    {
      find: "jakublesniak",
      replaceWith: "jakub lesniak"
    },
    {
      find: "jkubisiowski",
      replaceWith: "jakub kubisiowski"
    },
    {
      find: "juan david castaneda",
      replaceWith: "juan castaneda"
    },
    {
      find: "lmohammadzadeh.admin",
      replaceWith: "loghman mohammadzadeh"
    },
    {
      find: "lmohammadzadeh@ah4r.com",
      replaceWith: "loghman mohammadzadeh"
    },
    {
      find: "mgrayson.admin",
      replaceWith: "margaret grayson"
    },
    {
      find: "michalskowronek",
      replaceWith: "michal skowronek"
    },
    {
      find: "nady",
      replaceWith: "noel ady"
    },
    {
      find: "^oleksii$",
      replaceWith: "oleksii prudnikov"
    },
    {
      find: "oleksii.prudnikov",
      replaceWith: "oleksii prudnikov"
    },
    {
      find: "pkalinowski",
      replaceWith: "pawel kalinowski"
    },
    {
      find: "sbelczyk",
      replaceWith: "sebastian belczyk"
    },
    {
      find: "^sebastian$",
      replaceWith: "sebastian belczyk"
    },
    {
      find: "tinguyen",
      replaceWith: "tien nguyen"
    },
    {
      find: "^tomasz zaba \\(admin\\)$",
      replaceWith: "tomasz zaba"
    },
    {
      find: "mateusz w�jcik",
      replaceWith: "mateusz wojcik"
    }
  ],
  teamMappings: {
    "4platform-core-services": [
      "Julio Castellanos",
      "Miroslaw Piatkowski",
      "Karol Partyka",
      "Mykola Reshetynskyi"
    ],
    "4platform-integ-system-design": [
      "Greg Matysiak",
      "Elijah Myers",
      "Michal Jach"
    ],
    "4rent": [
      "Jason Meyer",
      "Pawel Pindel",
      "Sebastian Brzeszcz",
      "Cristian Caro"
    ],
    "4services-4vendors": [
      "Evgenii Vilkov",
      "Igor Soloydenko",
      "Mateusz Lisowski",
      "Pawel Kalinowski",
      "Chad Vogel"
    ],
    "4services-4turn": [
      "Przemyslaw Turczynski",
      "Kelly Corrigan",
      "Andrzej Lenart",
      "Rafal Pawlik",
      "Zbigniew Winiarski"
    ],
    "4services-4maintenance-experience": [
      "Michal Rybka",
      "Maksym Bondarchuk",
      "Mateusz Boroch",
      "Pawel Mazurek"
    ],
    "4resident-management": [
      "Christopher Noblett",
      "Oleksii Prudnikov",
      "Mateusz Partyka",
      "Adrian Nakonieczny"
    ],
    "4apply": [
      "Brandon Knight",
      "Przemyslaw Serwicki",
      "Patryk Domasik"
    ],
    "4properties": [
      "Lukasz Drozd",
      "Luis Roca",
      "Michal Musiol"
    ],
    "devops-team": [
      "Brandon Higgins",
      "Eldiar Kasmambetov",
      "Robert Dolega"
    ],
    "fuzzy": [
      "Tomasz Zaba"
    ],
    "architects": [
      "Brett Knapik",
      "Tomasz Maruszak"
    ],
    "developer-left": [
      "christian niedermayer",
      "elijah prince",
    ]
  },
  teamMemberNameExceptions: [],
  // _backup: [
  //   {
  //     find: "cnoblett_ah4r <cnoblett@ah4r.com>",
  //     replaceWith: "Christopher Noblett"
  //   },
  //   {
  //     find: "Cristian <crmartinez@ah4r.com>",
  //     replaceWith: "Cristian Martinez"
  //   },
  //   {
  //     find: "DESKTOP-8IGMD1F\\patry <patryk.domasik@outlook.com>",
  //     replaceWith: "Patryk Domasik"
  //   },
  //   {
  //     find: "domas <patryk.domasik@outlook.com>",
  //     replaceWith: "Patryk Domasik"
  //   },
  //   {
  //     find: "dzaba <dzaba@users.noreply.github.com>",
  //     replaceWith: "Tomasz Zaba"
  //   },
  //   {
  //     find: "ekasmambetov.admin <ekasmambetov.admin@ah4r.com>",
  //     replaceWith: "Eldiar Kasmambetov"
  //   },
  //   {
  //     find: "Elijah <elijahprince73@gmail.com>",
  //     replaceWith: "Elijah Prince"
  //   },
  //   {
  //     find: "elijah <emyers@amh.com>",
  //     replaceWith: "Elijah Myers"
  //   },
  //   {
  //     find: "Elijah <eprince@ah4r.com>",
  //     replaceWith: "Elijah Prince"
  //   },
  //   {
  //     find: "GosiaNowak <GosiaNowak@gravity9solutions.com>",
  //     replaceWith: "Gosia Nowak"
  //   },
  //   {
  //     find: "groozin <tomasz.mikos@gmail.com>",
  //     replaceWith: "Tomasz Mikos"
  //   },
  //   {
  //     find: "JakubLesniak <JakubLesniak@Gravity9Solutions.com>",
  //     replaceWith: "Jakub Lesniak"
  //   },
  //   {
  //     find: "jkubisiowski <jkubisiowski@ah4r.com>",
  //     replaceWith: "Jakub Kubisiowski"
  //   },
  //   {
  //     find: "kpartyka <kpartyka@ah4r.com>",
  //     replaceWith: "Karol Partyka"
  //   },
  //   {
  //     find: "lgesla <100704271+lgesla@users.noreply.github.com>",
  //     replaceWith: "Lukasz Gesla"
  //   },
  //   {
  //     find: "lmohammadzadeh.admin <loghman@Loghmans-MacBook-Pro.local>",
  //     replaceWith: "Loghman Mohammadzadeh"
  //   },
  //   {
  //     find: "lmohammadzadeh@ah4r.com <loghman@Loghmans-MacBook-Pro.local>",
  //     replaceWith: "Loghman Mohammadzadeh"
  //   },
  //   {
  //     find: "lukasgor <lukasz@acast.com>",
  //     replaceWith: "Lukasz Gorzelany"
  //   },
  //   {
  //     find: "mgrayson.admin <mgrayson.admin@americanhomes4rent.onmicrosoft.com>",
  //     replaceWith: "Margaret Grayson"
  //   },
  //   {
  //     find: "MichalSkowronek <MichalSkowronek@gravity9solutions.com>",
  //     replaceWith: "Michał Skowronek"
  //   },
  //   {
  //     find: "nady <ji7nivddndcslifosms6ustlayuq6b4mzdz4buatsbyjdeht2rca>",
  //     replaceWith: "Noel Ady"
  //   },
  //   {
  //     find: "nady <NAdy@AH4R.com>",
  //     replaceWith: "Noel Ady"
  //   },
  //   {
  //     find: "nady <nuoja5mgcsk27jm44w5znzpoq4uarvynxkteztqr22r6jtug3qba>",
  //     replaceWith: "Noel Ady"
  //   },
  //   {
  //     find: "oleksii <oleksii.prudnikov@gravity9.com>",
  //     replaceWith: "Oleksii Prudnikov"
  //   },
  //   {
  //     find: "oleksii.prudnikov <oleksiiprudnikov@gravity9solutions.com>",
  //     replaceWith: "Oleksii Prudnikov"
  //   },
  //   {
  //     find: "pablo <pkalinowski83@gmail.com>",
  //     replaceWith: "Pawel Kalinowski"
  //   },
  //   {
  //     find: "pawel.kalinowski <pkalinowski@ah4r.com>",
  //     replaceWith: "Pawel Kalinowski"
  //   },
  //   {
  //     find: "pkalinowski <pkalinowski@amh.com>",
  //     replaceWith: "Pawel Kalinowski"
  //   },
  //   {
  //     find: "sbelczyk <sbelczyk@gmail.com>",
  //     replaceWith: "Sebastian Belczyk"
  //   },
  //   {
  //     find: "Sebastian <sbelczyk@gmail.com>",
  //     replaceWith: "Sebastian Belczyk"
  //   },
  //   {
  //     find: "tinguyen <tinguyen@amh.com>",
  //     replaceWith: "Tien Nguyen"
  //   },
  //   {
  //     find: "unknown <ramblekar@ah4r.com>",
  //     replaceWith: "Rohit Amblekar"
  //   }
  // ]
} as const;
