# Song intake: title + artist only

`scripts/song-intake.mjs` turns a song reference into project assets without
downloading anything. A title and artist are **local search keys only**: the
script never contacts a music service, streams, or downloads the commercial
recording. It is copied into every scaffolded project, so the command below
runs from the project root. It is for the case where the user says only:

> 做一支《晴天》周杰伦的 MV。

## Command

```powershell
node scripts/song-intake.mjs --project "D:/work/my-mv" `
  --title "晴天" --artist "周杰伦" --mode auto
```

Options:

| Option | Meaning |
|---|---|
| `--project` | Existing project root with `project.json` |
| `--title` | Song title, required |
| `--artist` | Artist / author |
| `--music-dir` | Extra local library; repeatable |
| `--audio` / `--lrc` | Explicit authorized files |
| `--mode auto` | Local match first, otherwise original score |
| `--mode local` | Local match only; exit 2 if absent |
| `--mode original` | Force an original instrumental |
| `--duration` | Original score length, default 30 seconds |
| `--force` | Replace an existing generated asset |

## Search order

1. `--music-dir` folders.
2. `DSH_MUSIC_DIR` / `MUSIC_DIR` paths (Windows path separator allowed).
3. `~/Music`.
4. The project's `audio/`.

It matches normalized filenames. A file named `周杰伦 - 晴天.mp3` matches
title `晴天`, artist `周杰伦`. FLAC files also expose their `TITLE` and
`ARTIST` Vorbis comments, so `01.flac` with proper tags can match even when
the filename does not. If a file still is not found, pass `--audio` to bypass
matching. Sidecar lyrics are picked up from:

```text
same-dir/晴天.lrc
same-dir/lyrics/晴天.lrc
parent/lyrics/晴天.lrc
```

If the audio filename matches but the LRC does not exist, the project is set
to instrumental (lyrics disabled).

## What it writes

Audio goes to `audio/song-<artist>-<title>.<ext>`; LRC goes to
`lyrics/song-<artist>-<title>.lrc`. `project.json` is updated:

```json
"audio": { "file": "audio/song-周杰伦-晴天.mp3", "startAt": 0, "gainDb": -1.5 },
"lyrics": { "file": "lyrics/song-周杰伦-晴天.lrc", "enabled": true },
"song": {
  "title": "晴天",
  "artist": "周杰伦",
  "mode": "local",
  "source": "library",
  "note": "Matched authorized local audio.",
  "duration": null
}
```

## Original fallback

If no local audio is found and `--mode auto` (or `original`) is used, the
helper generates a new instrumental score:

```text
audio/original-<artist>-<title>.wav
```

`project.song.mode` becomes `"original"`, `source` becomes `"generated"`, and
`lyrics.enabled` becomes `false`. This is **not** the commercial recording.
Write original lyrics and an LRC, then set the lyrics block yourself:

```powershell
# after writing lyrics/original.lrc
node -e "const fs=require('fs');const p='project.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.lyrics={...(j.lyrics||{}),file:'lyrics/original.lrc',enabled:true};fs.writeFileSync(p,JSON.stringify(j,null,2));"
```

Then cut the shots to the score's duration. A 30-second score needs shots that
sum to 30 seconds (at 24 fps: 720 frames).

## Copyright and naming

- Never download audio or lyrics from streaming sites or lyric sites in this
  pipeline.
- If the user wants the actual recording, ask for an authorized audio file and
  LRC, or point at a local library.
- For the original fallback, credit it as **an original interpretation after
  “<title>”**, not as the artist's recording. Do not imply endorsement.
- If only the song title is known and no artist, use an empty artist.

## After intake

```powershell
npm install
node render.mjs doctor
node render.mjs check
node render.mjs storyboard
```

`doctor` reads the audio duration. `song-intake` sets `song.duration` only for
generated scores; for local audio, use the duration printed by `doctor` and
make the shot total match it.
