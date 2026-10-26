export const realSongs = [
  {
    id: "atameken", title: "Атамекен", performer: "Ескендір Хасанғалиев",
    description: "Туған жер туралы танымал ән. Архивтік орындауды тыңдап, қысқа үзіндідегі сөздерді тап.",
    source: "https://altynqor.com/audio/840", sourceName: "Altyn Qor · 1976 жылғы жазба",
    audio: "https://altynqor.com/audios/2024/01/15/OgYm4QQ8Xf3JI64sZfIFwSFklCezuuVN8IY7L1fZ.mp3",
    video: "dwlW30-Bw1s",
    excerpts: [
      { text: "Жасыл жайлау", token: 1, choices: ["теңіз", "мектеп", "қала"], meaning: "Жайлау — мал жайылатын жазғы қоныс." },
      { text: "Қайда жүрсем, атамекен", token: 2, choices: ["терезе", "аялдама", "дәптер"], meaning: "Атамекен — ата-бабадан қалған туған жер." },
    ],
  },
  {
    id: "anuran", title: "Қазақстанның Әнұраны", performer: "Президенттік оркестр",
    description: "Қазақстан Республикасының мемлекеттік әнұранын тыңдап, қысқа үзіндідегі сөздерді таны.",
    source: "https://www.youtube.com/watch?v=ZZnvsrlZkOA", sourceName: "Президенттік оркестр · ресми музыкалық шығарылым",
    audio: "", video: "ZZnvsrlZkOA",
    excerpts: [
      { text: "Алтын күн аспаны", token: 1, choices: ["түн", "қар", "жел"], meaning: "Күн — жарық пен жылу беретін аспан денесі." },
      { text: "Алтын дән даласы", token: 1, choices: ["тас", "су", "орман"], meaning: "Дән — өсімдіктің тұқымы; бұл үзіндіде астықпен байланысты." },
    ],
  },
] as const;
export type RealSong = (typeof realSongs)[number];
export const realSong = (id: string) => realSongs.find((song) => song.id === id);
