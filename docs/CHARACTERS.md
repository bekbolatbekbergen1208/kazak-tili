# QazaqDos — жануар-кейіпкерлер MVP

## Қолдану

- `/learn/characters` — «Менің кейіпкерлерім»: 8 кейіпкер, таңдау, XP прогресі және эмоцияларды көру.
- `/learn/shop` — бағасы алдын ала белгілі 16 зат. Примерка кезінде тиын алынбайды.
- `/learn/inventory` — «Менің заттарым»: сатып алынған затты киіндіру және шешу. Әр досқа бөлек образ сақталады.
- Таңдалған дос `/learn` кабинетінің басты бетінде, картада, сабақта, нәтиже экранында және профильде көрсетіледі. Бұрынғы `/student` зерттеу демосы тәуелсіз күйінде сақталған.

XP шектері: Тілмаш 0, Балапан 100, Қоңыр 350, Қыран 500, Айбар 600, Ақбота 700, Данақұлақ 900, Самұрық 1000. Ашылу сабақ санына емес, жалпы XP-ге байланысты. Тиын жұмсау XP-ді азайтпайды.

Жаңа дос ашылғанда есімі, мінезі және ерекше қылығы бар диалог көрсетіледі. Оны бірден таңдауға немесе коллекцияда қалдыруға болады. Бірнеше шек қатар өтсе, хабарламалар кезекпен көрсетіледі. Оқылған хабарлама сақталады. Тілмаш бастапқы дос ретінде бірден қолжетімді.

Самұрықпен бірге «Аңыз деңгейі» жетістігі және бір рет 50 тиын беріледі. Қалған жаңа жетістіктер 10 тиын береді. Бұрынғы жетістіктерге сыйақы қайтадан есептелмейді; бұрын 1000 XP жинаған пайдаланушы аңыз жетістігін бірінші келесі әрекетінде алады.

## Тиындар мен заттар

Барлық сомалар `lib/characters/config.ts` ішіндегі `coinRewards` арқылы басқарылады:

| Әрекет | Тиын |
|---|---:|
| Сабақты аяқтау | 10 |
| Мінсіз сабақ | қосымша 5 |
| Күнделікті тапсырманы алу | 15 |
| Бөлімді аяқтау | 30 |
| Жаңа жетістік | 10 |
| Аңыз деңгейі | 50 |

Бұрынғы дұрыс жауап, қайталау, белсенді күн және деңгей сыйақылары сақталған. Транзакция идентификаторы бір сыйақыны қайталап алуға жол бермейді. Монеталар сатылмайды; кездейсоқ жәшік, рулетка немесе ставка жоқ.

Үш скин: «Степное золото», «Ночное небо», «Весенняя мята». Сонымен қатар шарф, шапан, тақия, көзілдірік, рюкзак, сөздік, кітап, карта, бөлме декорациясы, профиль жақтауы, жеңіс эффектісі, интерфейс тақырыбы және оқу көмегі бар.

Сөздік — Тілмашқа, кітап — Данақұлаққа, карта — Ақботаға арналған. Қалған киім мен скиндер барлық ашылған кейіпкерге үйлеседі. Сатып алу затты автоматты кигізбейді: «Надеть / Equip» түймесі қажет. Бір слоттағы зат екіншісімен ауысады, ал шешілген зат инвентарьда қалады. Бөлме, жақтау, жеңіс эффектісі және тақырып — жалпы профиль баптаулары.

Тілмаштың сабақтағы сөздігі, Ақботаның туризмдегі картасы және Данақұлақтың кітабы — кейіпкердің табиғи оқу әрекеті; олар дүкен сатып алуын талап етпейді. Сатып алынған нұсқалар тұрақты образда қолданылады.

## Архитектура және деректер

- `lib/characters/types.ts`: Character, CharacterAnimation, CharacterUnlockRequirement, UserCharacter, CharacterSkin, CharacterAccessory, ShopItem, UserInventory, UserEquippedItem. CoinTransaction бұрынғы `lib/learning/types.ts` моделінде сақталған.
- `lib/characters/config.ts`: XP шектері, түстер, сипаттамалар, RU/EN репликалар, эмоциялар, сиректік, бағалар, үйлесімділік және сыйақылар. Бұл — MVP конфигурациясының негізгі көзі.
- `lib/characters/state.ts`: ескі күйді толықтыру, ашылуды есептеу, reveal кезегі, таңдау, киіндіру, аңыз жетістігі. `lib/learning/state.ts` сол ережелерді демоға да, серверге де қолданады.
- `progress.characters`: таңдалған кейіпкер, ашылған коллекция, көрсетілген хабарламалар, әр кейіпкердің заттары және жалпы профиль заттары. `progress.inventory` бұрынғы форматында қалады.
- `/api/learning`: `select-character`, `reveal-character`, `equip`, `unequip` әрекеттері тексеріледі; revision арқылы қатар келген өзгерістер қорғалады. Ашылмаған дос, сатып алынбаған/үйлеспейтін зат немесе жеткіліксіз тиын қабылданбайды.
- Бұрынғы профильдер автоматты толықтырылады. Сабақтар, XP және баланс өшірілмейді. Бұрынғы шарф Тілмашқа кигізіледі; жақтау мен мятная тема сақталады.

## Supabase миграциялары

Алғашқы `202609070001_learning_mvp.sql` және `202609070002_learning_content.sql` орнатылған жобаға SQL Editor арқылы ретімен орындаңыз:

1. `supabase/migrations/202609070003_character_system.sql`
2. `supabase/migrations/202609070004_character_catalog.sql`

Жаңа каталог кестелері: `qd_characters`, `qd_character_unlock_requirements`, `qd_character_animations`, `qd_shop_items`, `qd_character_skins`, `qd_character_accessories`.

Жеке коллекция, инвентарь және киімдер бұрынғы атомарлы `qd_learning_states` ішінде сақталады. `qd_user_characters`, `qd_user_inventory`, `qd_user_equipped_items` көріністері `security_invoker` арқылы негізгі RLS-ті сақтайды. Өзгенің күйі көрінбейді, каталогты пайдаланушы өзгерте алмайды. CoinTransaction үшін бұрынғы `qd_coin_transactions` view қолданылады.

Бұл сессияда миграциялар жергілікті PGlite базасында тексерілді. Қашықтағы Supabase базасына орнатылған жоқ: берілген publishable key SQL орындай алмайды. Егер бастапқы миграциялар бар болса, қосымша өрістер агрегатқа қолданба әрекеттерімен сақталады; жаңа SQL көріністері мен каталог үшін 003–004 керек.

## SVG және анимациялар

Барлық 8 иллюстрация жоба ішінде жасалған SVG, жануарларға emoji қолданылмайды. `components/characters/character-art.tsx` — бір визуалдық адаптер: ортақ стиль, бөлек құлақ/қанат/құйрық қабаттары, киім қабаттары және эмоциялар. Статикалық SVG нұсқалары `public/characters/` ішінде.

```bash
npm run assets:characters  # статикалық SVG-лерді қайта құру
npm run seed:characters    # конфигурациядан каталог SQL-ын құру
```

Миграция қолданылып қойған болса, оны қайта жазып орындамай, келесі нөмірлі миграция жасаңыз. Генератордағы `on conflict do nothing` бұрынғы жазбаларды жаңартпайды.

Болашақ кәсіби иллюстрациялар үшін Character моделіндегі `imageUrl` және `animationUrls` өрістері дайын. Қазір анимациялар `app/characters.css` арқылы SVG қабаттарында орындалады. PNG/WebP/Lottie енгізгенде тек CharacterArt адаптерін ауыстыру керек; XP, коллекция және киіндіру логикасы өзгермейді. Lottie runtime бұл MVP-де орнатылмаған.

Негізгі эмоциялар: күту, ойлану, дұрыс жауап, қолдау, мереке, жеңіс, демалыс. Қарсақ жылдам квизде жүгіреді, аю қолдайды, бүркіт қанатын жаяды, барыс қатарынан үш дұрыс жауапта секіреді. `prefers-reduced-motion` және профильдегі анимацияны өшіру сақталған. Reveal мен preview үшін native dialog фокусты іште ұстайды және Escape арқылы жабылады.

## Тексеру

```bash
npm test
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 3010
# басқа терминалда
npm run test:e2e
```

15 unit/SQL тесті: барлық XP шектері, ашылмаған досқа тыйым, reveal-ді сақтау, сатып алу мен тиынды тексеру, үйлесімділік, шешу, ескі профильді толықтыру, аңыз сыйақысының бір реттілігі, 15/30 тиын ережелері және SQL/RLS.

12 браузерлік сценарий (desktop + mobile): бастапқы оқу жолы, кейіпкердің ашылуы мен таңдалуы, қайта жүктегенде сақталуы, қараңғы силуэттер, сатып алмай көру, сатып алу, скин мен аксессуар киіндіру/шешу, сегіз бейне, эмоцияны көру және reduced-motion.

## Files in this update

- [README.md](../README.md)
- [app/api/learning/route.ts](../app/api/learning/route.ts)
- [app/characters.css](../app/characters.css)
- [app/layout.tsx](../app/layout.tsx)
- [app/learn/characters/page.tsx](../app/learn/characters/page.tsx)
- [app/learn/inventory/page.tsx](../app/learn/inventory/page.tsx)
- [app/learn/shop/page.tsx](../app/learn/shop/page.tsx)
- [components/characters/character-art.tsx](../components/characters/character-art.tsx)
- [components/characters/collection.tsx](../components/characters/collection.tsx)
- [components/characters/companion.tsx](../components/characters/companion.tsx)
- [components/characters/item-icon.tsx](../components/characters/item-icon.tsx)
- [components/characters/modal.tsx](../components/characters/modal.tsx)
- [components/characters/reveal.tsx](../components/characters/reveal.tsx)
- [components/characters/shop.tsx](../components/characters/shop.tsx)
- [components/learning/extras.tsx](../components/learning/extras.tsx)
- [components/learning/frame.tsx](../components/learning/frame.tsx)
- [components/learning/lesson-player.tsx](../components/learning/lesson-player.tsx)
- [components/learning/map.tsx](../components/learning/map.tsx)
- [components/learning/profile-form.tsx](../components/learning/profile-form.tsx)
- [components/learning/provider.tsx](../components/learning/provider.tsx)
- [docs/CHARACTERS.md](../docs/CHARACTERS.md)
- [docs/LEARNING-MVP.md](../docs/LEARNING-MVP.md)
- [lib/characters/config.ts](../lib/characters/config.ts)
- [lib/characters/state.ts](../lib/characters/state.ts)
- [lib/characters/types.ts](../lib/characters/types.ts)
- [lib/learning/content.ts](../lib/learning/content.ts)
- [lib/learning/state.ts](../lib/learning/state.ts)
- [lib/learning/types.ts](../lib/learning/types.ts)
- [package.json](../package.json)
- [public/characters/aibar.svg](../public/characters/aibar.svg)
- [public/characters/aqbota.svg](../public/characters/aqbota.svg)
- [public/characters/balapan.svg](../public/characters/balapan.svg)
- [public/characters/danaqulaq.svg](../public/characters/danaqulaq.svg)
- [public/characters/qonyr.svg](../public/characters/qonyr.svg)
- [public/characters/qyran.svg](../public/characters/qyran.svg)
- [public/characters/samuryq.svg](../public/characters/samuryq.svg)
- [public/characters/tilmash.svg](../public/characters/tilmash.svg)
- [scripts/render-characters.tsx](../scripts/render-characters.tsx)
- [scripts/seed-characters.ts](../scripts/seed-characters.ts)
- [supabase/migrations/202609070003_character_system.sql](../supabase/migrations/202609070003_character_system.sql)
- [supabase/migrations/202609070004_character_catalog.sql](../supabase/migrations/202609070004_character_catalog.sql)
- [tests/browser/characters.spec.ts](../tests/browser/characters.spec.ts)
- [tests/browser/learning.spec.ts](../tests/browser/learning.spec.ts)
- [tests/characters.test.ts](../tests/characters.test.ts)
- [tests/learning.test.ts](../tests/learning.test.ts)
- [tests/sql.test.ts](../tests/sql.test.ts)
