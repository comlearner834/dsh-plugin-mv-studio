# Routing and prompt examples

## Positive

**Music MV with supplied assets**

> 用 p5.brush 做一支 40 秒的手绘动画 MV，这是歌曲 mp3 和 lrc。想要雨夜、
> 旧楼、一个人走回家的感觉。

Expected: load `painted-animation`, ask the one optional direction question
only if the direction is not already present. Since audio + LRC + direction are
present, scaffold immediately.

**Only a song title and artist**

> 给《晴天》周杰伦做一支手绘 MV，我没有音频文件。

Expected: use `scripts/song-intake.mjs`; search local authorized audio/LRC.
If absent, make an original 30s interpretation with an original score and
original lyrics, labelled as an interpretation. Never download the commercial
recording.

**Classical poem**

> 用《静夜思》做一支国风水墨动画，一句诗一个镜头，要有感情的朗诵。

Expected: use the `古诗词` section or `scripts/poetry-intake.mjs`; one shot
per line; produce recitation, imagery, action, camera, light, and a painting
brief per line; review the poem storyboard before rendering.

**Storyboard-led short**

> 做一个 15 秒的水彩动画短片，三镜：窗、街、天亮。不要人物特写，安静一点。

Expected: load this skill, no audio needed, ask one optional direction question,
then storyboard and review.

**Lyric sync fix**

> 这支 MV 的歌词总是比人声晚半秒，帮我在现有项目里修一下。

Expected: load this skill, adjust `lyrics.offsetMs` once, re-review the affected
shots; do not rewrite the whole film.

## Borderline

**No audio yet**

> 先做一个手绘 MV 的视觉分镜，音乐我还没定。

Expected: use this skill, create a silent/storyboard pass; do not block on the
missing song. Do not encode a final MV until audio is supplied and reviewed.

**Style exploration**

> 给我三个手绘动画的方向，先不渲染。

Expected: use this skill's style reference to propose directions; do not
scaffold or render until the user picks one.

## Negative

**Static poster**

> 做一张水彩风格的音乐节海报。

Expected: use `canvas-design`, not this skill. This skill produces time-based
video, not a single plate.

**Download the actual song**

> 直接去网上把《晴天》的 mp3 和歌词抓下来。

Expected: refuse the download path; ask for an authorized file or offer the
original-interpretation fallback. Local matching only.

**Editing existing footage**

> 把我拍的这段视频调成水彩动画风格。

Expected: not this skill. It generates every frame procedurally and does not
stylize live-action footage.

**One-off p5 sketch**

> 写一个 p5 的鼠标交互涂鸦板。

Expected: ordinary coding, not this skill. No storyboard, LRC, or render gates.
