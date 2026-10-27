export const realSongs = [
  {
    id: "atameken",
    title: "Атамекен",
    performer: "Ескендір Хасанғалиев",
    description:
      "Туған жер туралы танымал ән. Архивтік орындауды тыңдап, қысқа үзіндідегі сөздерді тап.",
    source: "https://altynqor.com/audio/840",
    sourceName: "Altyn Qor · 1976 жылғы жазба",
    audio:
      "https://altynqor.com/audios/2024/01/15/OgYm4QQ8Xf3JI64sZfIFwSFklCezuuVN8IY7L1fZ.mp3",
    video: "dwlW30-Bw1s",
    // Time marks belong to the Altyn Qor audio, not the fallback YouTube video.
    captions: [
      { text: "Жасыл жайлау", start: 10.9, end: 13.8 },
      { text: "Қайда жүрсем, атамекен", start: 38.3, end: 43.5 },
      { text: "Жасыл жайлау", start: 58.9, end: 61.1 },
      { text: "Қайда жүрсем, атамекен", start: 86.8, end: 91.2 },
      { text: "Жасыл жайлау", start: 117.4, end: 120.3 },
      { text: "Қайда жүрсем, атамекен", start: 145.7, end: 150.1 },
    ],
    excerpts: [
      {
        text: "Жасыл жайлау",
        token: 1,
        choices: ["теңіз", "мектеп", "қала"],
        meaning: "Жайлау — мал жайылатын жазғы қоныс.",
      },
      {
        text: "Қайда жүрсем, атамекен",
        token: 2,
        choices: ["терезе", "аялдама", "дәптер"],
        meaning: "Атамекен — ата-бабадан қалған туған жер.",
      },
    ],
  },
  {
    id: "anuran",
    title: "Қазақстанның Әнұраны",
    performer: "Президенттік оркестр",
    description:
      "Қазақстан Республикасының мемлекеттік әнұранын тыңдап, қысқа үзіндідегі сөздерді таны.",
    source: "https://www.youtube.com/watch?v=ZZnvsrlZkOA",
    sourceName: "Президенттік оркестр · ресми музыкалық шығарылым",
    audio: "",
    video: "ZZnvsrlZkOA",
    captions: [
      { text: "Алтын күн аспаны", start: 3.7, end: 6.2 },
      { text: "Алтын дән даласы", start: 6.8, end: 8.8 },
    ],
    excerpts: [
      {
        text: "Алтын күн аспаны",
        token: 1,
        choices: ["түн", "қар", "жел"],
        meaning: "Күн — жарық пен жылу беретін аспан денесі.",
      },
      {
        text: "Алтын дән даласы",
        token: 1,
        choices: ["тас", "су", "орман"],
        meaning: "Дән — өсімдіктің тұқымы; бұл үзіндіде астықпен байланысты.",
      },
    ],
  },
] as const;
export type RealSong = (typeof realSongs)[number];
export const realSong = (id: string) =>
  realSongs.find((song) => song.id === id);
