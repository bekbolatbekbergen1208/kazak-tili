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
      { text: "Жасыл жайлау, түкті кілем, көк кілем", start: 10.9, end: 17.7 },
      { text: "Көк кілемде көп аунаймын, көп күлем", start: 17.7, end: 24.6 },
      { text: "Маңдайымнан сипап өткен самалды", start: 25.1, end: 30.9 },
      { text: "Қазағымның алақаны-ау деп білем", start: 31.8, end: 38.3 },
      { text: "Қайда жүрсем Атамекен", start: 38.3, end: 43.5 },
      { text: "Көкейіңде жатады екен", start: 44.0, end: 47.4 },
      { text: "Күннің өзі ұясына", start: 48.6, end: 52.7 },
      { text: "Қимай оны-ай батады екен", start: 53.2, end: 56.4 },
      { text: "Жасыл жайлау, түкті кілем, көк кілем", start: 58.4, end: 65.4 },
      { text: "Көк кілемде көп аунаймын, көп күлем", start: 65.6, end: 72.3 },
      { text: "Күннің нұрын, айдың аппақ сәулесін", start: 72.3, end: 79.0 },
      { text: "Қазағымның махаббаты-ау деп білем", start: 79.0, end: 86.3 },
      { text: "Қайда жүрсем Атамекен", start: 86.3, end: 91.2 },
      { text: "Көкейіңде жатады екен", start: 91.6, end: 95.7 },
      { text: "Күннің өзі ұясына", start: 95.7, end: 100.5 },
      { text: "Қимай оны батады екен", start: 100.5, end: 104.8 },
      {
        text: "Жасыл жайлау, түкті кілем, көк кілем",
        start: 117.4,
        end: 124.1,
      },
      { text: "Көк кілемде көп аунаймын, көп күлем", start: 124.0, end: 130.8 },
      { text: "Асқар тауын аспаныммен таласқан", start: 130.8, end: 137.9 },
      { text: "Қазағымның мәртебесі-ау деп білем", start: 137.9, end: 144.9 },
      { text: "Қайда жүрсем Атамекен", start: 144.9, end: 150.0 },
      { text: "Көкейіңде жатады екен", start: 150.6, end: 154.7 },
      { text: "Күннің өзі ұясына", start: 155.2, end: 159.4 },
      { text: "Қимай оны-ай батады екен", start: 159.8, end: 167.1 },
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
