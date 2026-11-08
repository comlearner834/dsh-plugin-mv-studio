# Characters and sets from the lyrics

Do not design a new cast for every shot. Read the lyrics first, then lock a
small cast and a shared set.

## Read the lyrics for people and things

- **The singer**: who says "I"/"we"? Age, posture, one prop.
- **Who is addressed**: "you", a memory, a city, a job, a season.
- **Objects that act**: a train, a phone, a lamp, a letter, a door.
- **Recurring nouns/verbs**: the motif the video can carry.
- **What changes**: the cast's want and the final image.

A cast of 1–3 characters is usually enough. A crowd can be a texture, not a
set of distinct faces.

## Character sheet before shots

Draw one sheet with every character:

- front, side and one three-quarter view;
- three named expressions (calm, worried, glad, or the ones the song needs);
- full body at a fixed scale, with hands and shoes;
- one held prop and the grip point;
- the palette roles: body, hair, skin, cloth, accent, line.

Use the sheet to check every shot. If a face only works at one size, it is not
a character yet.

## Code shape

```text
src/characters.js   one drawing function per character; named poses
src/sets.js         shared rooms, streets, skies, props
src/ch/c01.js       one chapter; imports characters/sets, never forks them
```

A character function takes `(api, x, y, scale, t, mood)` and draws from the
same proportions. A set function takes a time and a light state. Chapter files
may add local props, but do not redraw the character or the room.

## Model-sheet review

Render the sheet as a still, not as a finished shot:

- all characters at the same scale;
- face and hand crops at 100%;
- the held prop touching the hand;
- the same character in two moods, still on-model.

If the sheet is weak, fix it before writing ten shots.

## Continuity

- Keep one screen direction and one light direction per set.
- Carry one prop or colour from the previous shot.
- A character's silhouette must survive the background.
- The final shot rhymes with the character sheet's opening pose.
