window.__ModuleLoader__.load({
  id: '@local/painted-animation-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'painted-animation-studio';

    const EN = {
      nav: 'MV Studio',
      eyebrow: 'PAINTED ANIMATION / MV STUDIO',
      title: 'Turn one line into a painted film.',
      lede: 'Make a hand-painted music video. Write one feeling, or just a song title and artist (local search only). You can start without audio.',
      mvTab: 'MV Studio',
      poetryTab: 'Classical poetry',
      poetryTitle: 'Turn a poem into a painted film.',
      poetryLede: 'One shot per line. Every line gets a recitation, mood, movement, camera, light, and a painting brief.',
      poetryNameLabel: 'Poem title',
      poetryNamePlaceholder: 'e.g. 静夜思',
      poetLabel: 'Poet',
      poetPlaceholder: 'e.g. 李白',
      poemLabel: 'Poem',
      poemPlaceholder: 'One line per row, for example:\n床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。',
      poemStyleLabel: 'Style',
      styleInk: 'Ink wash / negative space',
      styleBluegreen: 'Blue-green landscape',
      styleGongbi: 'Soft gongbi',
      styleMoon: 'Moonlit cool',
      styleAutumn: 'Autumn ochre',
      styleCustom: 'Custom style',
      stylePresetNote: 'Use the built-in preset for this style.',
      poemCustomLabel: 'Describe your style',
      poemCustomPlaceholder: 'e.g. Dunhuang mural: earth red, mineral blue, gold lines, weathered wall, candlelight.',
      poemCustomHint: 'Colour, material, line, light, mood. This applies to every line.',
      poemCustomEmpty: 'Describe your custom style first.',
      poemHint: 'Put each line on its own row: one line = one shot. Keep commas inside the line; do not split them into extra shots.',
      poemLineCount: '{n} lines / one line per shot',
      poemStart: 'Build the poem storyboard',
      poemNote: 'The storyboard comes first. Each shot gets a recited line, mood, movement, camera, light, and a painting brief. No full render starts without your choice.',
      poemEmpty: 'Write at least one line of the poem.',
      poemNoPoet: 'anonymous',
      poemPrompt: 'Use the painted-animation skill for a classical Chinese poem video.\nPoem: {poemTitle}\nPoet: {poet}\nStyle: {style}\nPoem text:\n{poem}\n\nRequirements:\n1. One shot per line, in order; keep commas inside a line. Do not merge lines.\n2. Each shot must output: the line, a recitation with emotion and pauses, imagery, action, camera movement, lighting, and a painting prompt.\n3. Before drawing, write a one-paragraph visual concept: the recurring image or motif, and how the first and last shot rhyme. Submit it with the storyboard.\n4. Use scripts/poetry-intake.mjs to create poetry-plan.json. Fill every blank field (imagery, action, camera, light) before submitting the storyboard.\n5. Generate the recitation with scripts/poetry-voice.mjs if local Windows speech is available; otherwise provide a performance script and ask for a recording.\n6. Style: {styleName}. {styleBrief}\n7. All visuals are procedural p5.brush; no image-generation model.\n\nCreate the project, fill the plan, and submit the storyboard first. Do not start a full render.',
      briefLabel: 'What should this MV feel like?',
      briefPlaceholder: 'A quiet walk home through rain, warm windows, a little tired.',
      briefHint: 'One sentence is enough. Can’t write? Leave it empty and I’ll choose a quiet hand-painted look.',
      titleLabel: 'Project name',
      titlePlaceholder: 'optional',
      songLabel: 'Song (optional)',
      localOnly: 'local only · no download',
      songTitleLabel: 'Song title',
      songTitlePlaceholder: 'e.g. 晴天',
      artistLabel: 'Artist',
      artistPlaceholder: 'e.g. 周杰伦',
      songHint: 'Title + artist only searches files already on this computer. It never fetches or downloads the original song. If nothing is found, I make an original 30-second short.',
      charactersTitle: 'Character models',
      charactersLede: 'Optional. Upload a face or a front/side/expression sheet; the images are saved to the workspace and used to keep the character on-model.',
      charactersAdd: 'Add character images',
      charactersHint: 'Image references only (not a 3D model file). PNG, JPEG, WebP or GIF; up to 4 images, 12MB each. A clean front view or model sheet works best.',
      charactersEmpty: 'No character images yet.',
      charactersName: 'Character name',
      charactersRole: 'Role / notes',
      charactersRemove: 'Remove character image',
      charactersLimit: 'Up to 4 character images.',
      charactersUploading: 'Saving character references...',
      charactersFailed: 'Could not save the character image. If you just updated the plugin, restart DSH and try again.',
      helpButton: 'How to use',
      helpTitle: 'How to use MV Studio',
      helpIntro: 'Two rooms: MV Studio and Classical poetry. Choose one, write the content, then say yes or no to the pictures.',
      helpExample: 'Not sure what to write? Try “a walk home in the rain”, or paste a poem with one line per row.',
      helpClose: 'Close help',
      help1Title: '1. Choose a room',
      help1Body: 'MV Studio for a song or a feeling. Classical poetry for a poem, one line per shot.',
      help2Title: '2. Fill in the content',
      help2Body: 'MV: one line, plus song title and artist if you have one. Poetry: poem title, poet, poem (one line per row), and a style — preset or your own. Both sections accept character images.',
      help3Title: '3. Click Start',
      help3Body: 'A new chat opens. Attach audio or lyric files there if you have them. A title/artist alone only searches this computer; it never downloads the original song.',
      help4Title: '4. Look at the storyboard',
      help4Body: 'I show keyframes first. For poetry, each shot also lists recitation, mood, action, camera, light, and a painting brief. Say “yes” or what to change.',
      help5Title: '5. Say yes to the full video',
      help5Body: 'After every shot is approved, I ask again. Say yes to render on this computer; no answer means no.',
      helpLocalNote: 'Title + artist only = local search. No online download of the full recording.',
      helpTip: 'No commands or settings to learn. Stuck? Read the five steps again.',
      helpGotIt: 'Got it',
      start: 'Start the MV',
      storyboard: 'Pictures first',
      starting: 'Opening the studio…',
      chipsLabel: 'A place to begin',
      chipRain: 'rainy walk home',
      chipDawn: 'first bus at dawn',
      chipSea: 'paper moon by the sea',
      chipCity: 'one lamp in the old town',
      processTitle: 'What happens next',
      step1: 'Say one thing',
      step1Body: 'One sentence is enough. Or just a song title and artist.',
      step2: 'See a few pictures',
      step2Body: 'I draw key moments first, before any full video.',
      step3: 'Say yes or no',
      step3Body: 'Point at what to change. Say “yes” when you like it.',
      step4: 'You say yes first',
      step4Body: 'I ask again before making the full video.',
      step5: 'Get the video',
      step5Body: 'Open or download it from the chat.',
      styleTitle: 'Paper + gouache',
      styleBody: 'Paper texture, hand-drawn edges, paint that bleeds, lyrics written into the picture.',
      paletteLabel: 'The palette',
      note: 'Starting the MV opens a new conversation. Send song and lyric files in the chat; this page does not upload files. Title + artist only = local search, no online download.',
      prompt: 'Use the painted-animation skill to make a hand-painted music video.\nProject: {title}\nDirection: {direction}\n{song}\n{mode}\nPlease create the project, write STORYBOARD.md (logline, one world, motif, cast, song grid, and a shot table with timed reads), and submit the storyboard for my approval first. If song audio and an LRC are not in this conversation yet, and the song reference is only a title/artist, use the local song-intake path first. Do not download copyrighted audio or lyrics.',
      songPrompt: 'Song reference: {song}. Use scripts/song-intake.mjs to search local authorized audio/LRC first; if none is found, make an original 30-second interpretation with an original score and original lyrics, clearly labelled as an original interpretation. Never download or imitate the commercial recording.',
      modeStoryboard: 'This pass is storyboard only. Do not start a full render.',
      defaultDirection: 'Quiet, hand-painted, a little room to breathe, like a page from a moving sketchbook.',
      untitled: 'Untitled MV',
      error: 'The studio could not open a conversation. Try again from the sidebar.',
      charCount: '{n} / 220',
      artCaption: 'paper / gouache / hand-painted',
      footer: 'Painted animation · local rendering only',
    };

    const ZH = {
      nav: 'MV 工坊',
      eyebrow: 'PAINTED ANIMATION / MV 工坊',
      title: '把一句话，画成一支会动的片子。',
      lede: '做一支会动的手绘 MV。写一句感觉，或者只给歌名和作者（只查本机，不抓原唱）。没有音频也能先做画面。',
      mvTab: 'MV 工坊',
      poetryTab: '古诗词',
      poetryTitle: '把一首诗，画成一支会动的片子。',
      poetryLede: '一句诗一个镜头。每一镜都写清楚：朗诵、意境、动作、运镜、光影、绘画提示词。',
      poetryNameLabel: '诗名',
      poetryNamePlaceholder: '如：静夜思',
      poetLabel: '作者',
      poetPlaceholder: '如：李白',
      poemLabel: '诗文',
      poemPlaceholder: '一行一句，例如：\n床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。',
      poemStyleLabel: '风格',
      styleInk: '国风水墨 / 留白',
      styleBluegreen: '青绿山水',
      styleGongbi: '淡彩工笔',
      styleMoon: '月下冷调',
      styleAutumn: '秋山暖赭',
      styleCustom: '自定义风格',
      stylePresetNote: '使用技能内置的该风格预设。',
      poemCustomLabel: '描述你想要的风格',
      poemCustomPlaceholder: '例如：敦煌壁画，土红、石青、金线，斑驳墙面，烛光；或：极简剪影，冷灰蓝，只有一轮月亮。',
      poemCustomHint: '写颜色、材质、线条、光线和情绪；每一句都会沿用。',
      poemCustomEmpty: '请先描述自定义风格。',
      poemHint: '一行一句，一句一个镜头；逗号留在句内，不要拆成两个镜头。',
      poemLineCount: '{n} 行 / 一行一镜',
      poemStart: '生成诗词分镜',
      poemNote: '先出分镜。每个镜头会写清朗诵、画面意境、动态动作、运镜、光影和绘画提示词。没有你的确认，不会开始完整渲染。',
      poemEmpty: '请先写至少一句诗。',
      poemNoPoet: '未署名',
      poemPrompt: '使用 painted-animation 技能制作古诗词视频。\n诗名：{poemTitle}\n作者：{poet}\n风格：{style}\n诗文：\n{poem}\n\n要求：\n1. 按诗句顺序，一句一个镜头；逗号留在句内，不要拆成额外镜头，不要合并诗句。\n2. 每个镜头必须输出：对应诗句、有感情的朗诵（含停顿/语气）、画面意境、动态动作、镜头运镜、光影氛围、绘画提示词。\n3. 画之前先写一段总视觉构思：反复出现的意象/母题，以及首镜和末镜如何呼应；和分镜一起提交。\n4. 先运行 scripts/poetry-intake.mjs 生成 poetry-plan.json；把 imagery/action/camera/light 等空字段补全后再提交分镜。\n5. 朗诵优先用本机 Windows TTS（scripts/poetry-voice.mjs）；环境不允许就先给朗诵表演稿，提醒我录音。\n6. 风格：{styleName}。{styleBrief}\n7. 所有画面用 p5.brush 程序化绘制，不使用图像生成模型。\n\n先创建项目、补全 plan、提交分镜给我确认；不要开始完整渲染。',
      briefLabel: '这支 MV 想让人感觉到什么？',
      briefPlaceholder: '雨里慢慢走回家，窗子很暖，有一点累。',
      briefHint: '一句话就够。不会写就留空，我会替你定一个安静的手绘风格。',
      titleLabel: '项目名',
      titlePlaceholder: '可留空',
      songLabel: '歌曲（可选）',
      localOnly: '只查本机 · 不抓原唱',
      songTitleLabel: '歌名',
      songTitlePlaceholder: '如：晴天',
      artistLabel: '作者',
      artistPlaceholder: '如：周杰伦',
      songHint: '只填歌名和作者时，只在你电脑里找歌，不会上网抓取或下载完整原唱。找不到就做一支原创的 30 秒同名短片。',
      charactersTitle: '人物模型',
      charactersLede: '可选。上传人物正脸、三视图或表情设定图；图片会保存到工作区，用来让人物在各镜头保持一致。',
      charactersAdd: '添加人物图片',
      charactersHint: '只支持图片参考，不是 3D 模型文件。PNG、JPEG、WebP、GIF；最多 4 张，每张 12MB 以内。正面清晰图或角色三视图效果最好。',
      charactersEmpty: '还没有人物图片。',
      charactersName: '角色名',
      charactersRole: '角色定位 / 备注',
      charactersRemove: '移除人物图片',
      charactersLimit: '最多 4 张人物图。',
      charactersUploading: '正在保存人物参考图...',
      charactersFailed: '人物图片保存失败。如果刚更新插件，请重启 DSH 后再试。',
      helpButton: '使用说明',
      helpTitle: 'MV 工坊怎么用',
      helpIntro: '两个分区：MV 工坊和古诗词。选一个、写内容、看图点头就行。',
      helpExample: '不知道写什么？可以写「雨夜走回家」，或者贴一首诗，一行一句。',
      helpClose: '关闭说明',
      help1Title: '1. 先选一个分区',
      help1Body: '做歌或做感觉，选「MV 工坊」；做古诗，选「古诗词」。',
      help2Title: '2. 填内容',
      help2Body: 'MV：写一句方向，有歌就填歌名/作者。古诗词：填诗名、作者、诗文（一行一句），再选风格；可以用预设，也可以自己描述。两个分区都可以加人物参考图。',
      help3Title: '3. 点开始',
      help3Body: '会新开一个对话。有音频或歌词，就在聊天框里发给我。只给歌名/作者时只查本机，不会下载原唱。',
      help4Title: '4. 看分镜',
      help4Body: '先给你看关键画面。古诗词每一镜还会列朗诵、意境、动作、运镜、光影和绘画提示。满意说「可以」，不满意直接说改哪里。',
      help5Title: '5. 最后才出完整视频',
      help5Body: '每个镜头都过了，我才会再问你要不要正式生成。你说「要」才开始；不说就不会做。',
      helpLocalNote: '只给歌名和作者 = 只在这台电脑里找歌。不会联网下载完整原唱。',
      helpTip: '命令、参数、软件设置都不用管。卡住了就再看一遍这五步。',
      helpGotIt: '明白了',
      start: '开始做 MV',
      storyboard: '先只看画面',
      starting: '正在打开工坊…',
      chipsLabel: '从一个画面开始',
      chipRain: '雨夜归途',
      chipDawn: '清晨第一班车',
      chipSea: '海边的纸月亮',
      chipCity: '旧城与一盏灯',
      processTitle: '接下来会发生什么',
      step1: '说一句想法',
      step1Body: '一句话就够。也可以只填歌名和作者。',
      step2: '先看几张画',
      step2Body: '我会先画几个关键画面给你看。',
      step3: '看图说行不行',
      step3Body: '不满意直接说哪里改，满意就回「可以」。',
      step4: '你点头才出片',
      step4Body: '正式生成前，我会再问你一次。',
      step5: '拿到视频',
      step5Body: '在聊天里打开或下载。',
      styleTitle: '纸本 + 水粉',
      styleBody: '纸的质感、手绘的边、颜色慢慢晕开，歌词像用笔写在画面上。',
      paletteLabel: '这一支的颜色',
      note: '点开始会新开一个对话。歌曲和歌词要在聊天窗口里发给我，这个页面不上传文件。只给歌名和作者时只查本机，不会联网抓原唱。',
      prompt: '使用 painted-animation 技能做一支手绘动画 MV。\n项目名：{title}\n创作方向：{direction}\n{song}\n{mode}\n请先创建项目，写 STORYBOARD.md（logline、一个世界、母题、角色表、歌曲网格、带 timed reads 的镜头表），再提交分镜给我确认。如果对话里还没有音频和 LRC、只给了歌名/作者，请先走 song-intake 本地查找路径；不要下载版权音频或歌词。',
      songPrompt: '歌曲：{song}。先用 scripts/song-intake.mjs 在本机寻找已授权的音频/LRC；找不到就做 30 秒原创同题演绎（原创配乐+原创歌词），明确标注为原创演绎，不下载、不冒充原曲录音。',
      modeStoryboard: '这一轮只做分镜，不进入完整渲染。',
      defaultDirection: '安静、手绘、留白，像一页会动的速写。',
      untitled: '未命名 MV',
      error: '没能打开创作对话，请从左侧边栏再试一次。',
      charCount: '{n} / 220',
      artCaption: '纸本 / 水粉 / 手绘动画',
      footer: '手绘动画 · 只做本地渲染',
    };

    const CSS = `
      .pa-root {
        box-sizing: border-box;
        min-height: 100%;
        height: 100%;
        overflow: auto;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        padding: clamp(22px, 4vw, 54px);
      }
      .pa-shell {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(290px, .85fr);
        gap: clamp(18px, 3vw, 34px);
        align-items: start;
      }
      .pa-card {
        background: var(--dsw-alias-bg-layer-1);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 20px;
        box-shadow: 0 18px 50px color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent);
      }
      .pa-main { padding: clamp(24px, 3.6vw, 46px); }
      .pa-topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .pa-eyebrow {
        margin: 0;
        color: var(--dsw-alias-label-secondary);
        font: 600 10px/1.4 ui-monospace, "Cascadia Mono", Consolas, monospace;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .pa-help {
        appearance: none;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 30px;
        padding: 0 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font: inherit;
        font-size: 11px;
        cursor: pointer;
      }
      .pa-help:hover {
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l2);
      }
      .pa-help-mark {
        display: inline-grid;
        place-items: center;
        width: 15px;
        height: 15px;
        border: 1px solid currentColor;
        border-radius: 50%;
        font: 600 9px/1 ui-monospace, "Cascadia Mono", Consolas, monospace;
      }
      .pa-help-overlay {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
        padding: 22px;
        background: color-mix(in srgb, var(--dsw-alias-label-primary) 36%, transparent);
        backdrop-filter: blur(2px);
      }
      .pa-help-dialog {
        width: min(640px, 100%);
        max-height: min(760px, 92vh);
        overflow: auto;
        box-sizing: border-box;
        padding: 26px;
        background: var(--dsw-alias-bg-layer-1);
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 18px;
        box-shadow: 0 24px 70px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
      }
      .pa-help-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }
      .pa-help-title {
        margin: 2px 0 0;
        font: 500 28px/1.15 Georgia, "Songti SC", "SimSun", serif;
        letter-spacing: -.02em;
      }
      .pa-help-close {
        appearance: none;
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 50%;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font: 400 20px/1 ui-monospace, "Cascadia Mono", Consolas, monospace;
        cursor: pointer;
      }
      .pa-help-close:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
      .pa-help-intro {
        margin: 12px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 13px;
        line-height: 1.65;
      }
      .pa-help-example {
        margin: 12px 0 0;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        line-height: 1.65;
      }
      .pa-help-local {
        margin: 12px 0 0;
        padding: 11px 13px;
        border: 1px solid var(--dsw-alias-state-warn-primary);
        border-radius: 9px;
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.65;
      }
      .pa-help-list {
        margin: 20px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 14px;
      }
      .pa-help-step {
        display: grid;
        grid-template-columns: 26px minmax(0, 1fr);
        gap: 10px;
      }
      .pa-help-num {
        color: var(--dsw-alias-label-secondary);
        font: 500 10px/1.8 ui-monospace, "Cascadia Mono", Consolas, monospace;
      }
      .pa-help-step-title { font-size: 13px; font-weight: 650; line-height: 1.5; }
      .pa-help-step-body {
        margin: 3px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 1.65;
      }
      .pa-help-tip {
        margin: 18px 0 0;
        padding: 12px 14px;
        border-left: 3px solid var(--dsw-alias-brand-primary);
        border-radius: 0 8px 8px 0;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 1.65;
      }
      .pa-help-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .pa-title {
        margin: 0;
        max-width: 14ch;
        font: 500 clamp(34px, 4.7vw, 58px)/1.02 Georgia, "Songti SC", "SimSun", serif;
        letter-spacing: -.025em;
      }
      .pa-lede {
        margin: 18px 0 0;
        max-width: 58ch;
        color: var(--dsw-alias-label-secondary);
        font-size: 14px;
        line-height: 1.7;
      }
      .pa-tabs {
        display: flex;
        gap: 4px;
        margin-top: 24px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
      }
      .pa-tab {
        appearance: none;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        padding: 9px 11px 10px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .pa-tab:hover { color: var(--dsw-alias-label-primary); }
      .pa-tab:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: -2px;
        border-radius: 6px 6px 0 0;
      }
      .pa-tab[aria-selected="true"] {
        color: var(--dsw-alias-label-primary);
        border-bottom-color: var(--dsw-alias-brand-primary);
      }
      .pa-section[hidden] { display: none; }
      .pa-poem-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 18px;
      }
      .pa-poem-grid .pa-label { margin-bottom: 7px; }
      .pa-poem-text { min-height: 230px; }
      .pa-custom-text { min-height: 92px; }
      .pa-characters {
        margin-top: 28px;
        padding-top: 22px;
        border-top: 1px solid var(--dsw-alias-border-l1);
      }
      .pa-character-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .pa-character-title {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Songti SC", serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary);
      }
      .pa-character-lede {
        max-width: 52ch;
        margin: 7px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 1.65;
      }
      .pa-character-add {
        flex: none;
        border: 1px dashed var(--dsw-alias-border-l2);
        border-radius: 6px;
        padding: 8px 10px;
        color: var(--dsw-alias-label-primary);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .pa-character-add:hover { border-color: var(--dsw-alias-brand-primary); }
      .pa-character-file { display: none; }
      .pa-character-list {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }
      .pa-character {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) 28px;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 7px;
        background: color-mix(in srgb, var(--dsw-alias-bg-base) 92%, transparent);
      }
      .pa-character-thumb {
        width: 58px;
        height: 58px;
        object-fit: cover;
        border-radius: 5px;
        background: var(--dsw-alias-bg-base);
      }
      .pa-character-fields {
        display: grid;
        gap: 6px;
      }
      .pa-character-input {
        height: 34px;
        padding: 0 9px;
        font-size: 12px;
      }
      .pa-character-remove {
        appearance: none;
        border: 0;
        background: transparent;
        color: var(--dsw-alias-label-tertiary);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
      }
      .pa-character-remove:hover { color: var(--dsw-alias-label-primary); }
      .pa-character-empty {
        margin: 12px 0 0;
        color: var(--dsw-alias-label-tertiary);
        font-size: 12px;
      }
      .pa-select { padding-right: 8px; }
      .pa-field { margin-top: 32px; }
      .pa-label {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
        font-size: 13px;
        font-weight: 600;
      }
      .pa-count {
        color: var(--dsw-alias-label-secondary);
        font: 400 10px/1 ui-monospace, "Cascadia Mono", Consolas, monospace;
      }
      .pa-textarea, .pa-input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 13px;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font: inherit;
        outline: none;
      }
      .pa-textarea {
        min-height: 118px;
        resize: vertical;
        padding: 14px 15px;
        font-size: 15px;
        line-height: 1.65;
      }
      .pa-input { height: 42px; padding: 0 13px; font-size: 13px; }
      .pa-textarea:focus, .pa-input:focus {
        border-color: var(--dsw-alias-brand-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
      }
      .pa-hint {
        margin: 9px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        line-height: 1.55;
      }
      .pa-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 16px;
      }
      .pa-chip {
        appearance: none;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        padding: 6px 11px;
        font: inherit;
        font-size: 11px;
        cursor: pointer;
      }
      .pa-chip:hover {
        color: var(--dsw-alias-label-primary);
        border-color: var(--dsw-alias-border-l2);
      }
      .pa-title-row { margin-top: 18px; }
      .pa-song-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 20px;
        font-size: 12px;
        font-weight: 650;
      }
      .pa-local-tag {
        flex: 0 0 auto;
        padding: 2px 7px;
        border: 1px solid var(--dsw-alias-state-warn-primary);
        border-radius: 999px;
        color: var(--dsw-alias-state-warn-primary);
        font: 500 9px/1.6 ui-monospace, "Cascadia Mono", Consolas, monospace;
        white-space: nowrap;
      }
      .pa-song-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 8px;
      }
      .pa-song-row .pa-label { margin-bottom: 7px; }
      .pa-error {
        margin: 14px 0 0;
        color: var(--dsw-alias-state-error-primary);
        font-size: 12px;
        line-height: 1.5;
      }
      .pa-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-top: 24px;
      }
      .pa-primary, .pa-secondary {
        appearance: none;
        border-radius: 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        min-height: 42px;
        padding: 0 18px;
      }
      .pa-primary {
        border: 1px solid var(--dsw-alias-brand-primary);
        background: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-bg-base);
      }
      .pa-primary:hover:not(:disabled) { filter: brightness(1.06); }
      .pa-secondary {
        border: 1px solid var(--dsw-alias-border-l1);
        background: transparent;
        color: var(--dsw-alias-label-primary);
      }
      .pa-secondary:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); }
      .pa-primary:disabled, .pa-secondary:disabled { opacity: .55; cursor: wait; }
      .pa-note {
        margin: 18px 0 0;
        padding-top: 15px;
        border-top: 1px solid var(--dsw-alias-border-l1);
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        line-height: 1.65;
      }
      .pa-aside { display: grid; gap: 16px; }
      .pa-art {
        position: relative;
        min-height: 260px;
        overflow: hidden;
        border-radius: 20px;
        background: #1d2c3a;
        border: 1px solid var(--dsw-alias-border-l1);
      }
      .pa-art svg { display: block; width: 100%; height: auto; }
      .pa-art-caption {
        position: absolute;
        left: 18px;
        right: 18px;
        bottom: 14px;
        color: #efe4ce;
        font: 500 10px/1.5 ui-monospace, "Cascadia Mono", Consolas, monospace;
        letter-spacing: .12em;
        text-transform: uppercase;
        opacity: .82;
      }
      .pa-panel { padding: 19px 20px; }
      .pa-panel-title {
        margin: 0 0 13px;
        font-size: 12px;
        font-weight: 650;
        letter-spacing: .01em;
      }
      .pa-steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
      .pa-step { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 9px; }
      .pa-step-num {
        color: var(--dsw-alias-label-secondary);
        font: 500 10px/1.6 ui-monospace, "Cascadia Mono", Consolas, monospace;
      }
      .pa-step-name { font-size: 12px; font-weight: 600; line-height: 1.5; }
      .pa-step-body {
        margin: 2px 0 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 11px;
        line-height: 1.55;
      }
      .pa-style-body {
        margin: 0;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 1.65;
      }
      .pa-palette { display: flex; gap: 7px; margin-top: 14px; }
      .pa-swatch {
        width: 22px; height: 22px; border-radius: 50%;
        border: 1px solid var(--dsw-alias-border-l1);
        box-shadow: inset 0 0 0 2px var(--dsw-alias-bg-layer-1);
      }
      .pa-footer {
        margin-top: 2px;
        color: var(--dsw-alias-label-secondary);
        font: 500 9px/1.4 ui-monospace, "Cascadia Mono", Consolas, monospace;
        letter-spacing: .1em;
        text-transform: uppercase;
        text-align: right;
      }
      @media (max-width: 840px) {
        .pa-shell { grid-template-columns: 1fr; }
        .pa-aside { grid-template-columns: 1fr 1fr; }
        .pa-art { min-height: 200px; }
      }
      @media (max-width: 560px) {
        .pa-root { padding: 14px; }
        .pa-main { padding: 22px; }
        .pa-aside { grid-template-columns: 1fr; }
        .pa-title { font-size: 34px; }
        .pa-song-row, .pa-poem-grid { grid-template-columns: 1fr; }
        .pa-character-head { flex-direction: column; }
        .pa-help-overlay { padding: 12px; }
        .pa-help-dialog { padding: 20px; max-height: 94vh; }
        .pa-help-title { font-size: 24px; }
      }
      @media (prefers-reduced-motion: no-preference) {
        .pa-orbit { animation: pa-orbit 9s ease-in-out infinite alternate; transform-origin: 236px 120px; }
        @keyframes pa-orbit {
          from { transform: translateY(-2px) rotate(-.5deg); }
          to { transform: translateY(3px) rotate(.5deg); }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .pa-orbit { animation: none; }
      }
    `;

    const PALETTE = ['#efe4ce', '#2a231d', '#b6543a', '#29465b', '#61705a'];
    function characterPromptBlock(refs) {
      if (!refs.length) return '';
      return `\nCharacter references (already saved on this machine; copy them into the project's assets/characters/, read them, and keep each character on-model; do not overwrite these files):\n${
        refs.map((ref, index) => `${index + 1}. ${ref.name}${ref.role ? ` — ${ref.role}` : ''}: ${ref.path}`).join('\n')
      }`;
    }

    const POEM_STYLES = [
      ['ink', 'styleInk'],
      ['bluegreen', 'styleBluegreen'],
      ['gongbi', 'styleGongbi'],
      ['moon', 'styleMoon'],
      ['autumn', 'styleAutumn'],
      ['custom', 'styleCustom'],
    ];

    function useTranslation(ctx) {
      const [, bump] = React.useReducer((n) => n + 1, 0);
      React.useEffect(() => ctx.locale.subscribe(bump), [ctx]);
      return ctx.locale.bind(NS);
    }

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 18;
      const active = !!(props && props.active);
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block', opacity: active ? 1 : 0.82 },
        },
        h('path', {
          d: 'M4.2 18.8c3.1-3.8 5.7-4.7 8.4-2.7 2.7 2 5.2 1.3 7.2-1.9',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
        }),
        h('circle', {
          cx: 16,
          cy: 8.2,
          r: 4.15,
          stroke: 'currentColor',
          strokeWidth: 1.7,
        }),
        h('path', {
          d: 'M4.5 20.2h15',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          opacity: 0.48,
        }),
      );
    }

    function MoonArt() {
      return h(
        'svg',
        { viewBox: '0 0 420 300', role: 'img', 'aria-label': 'Paper moon and brush stroke' },
        h(
          'defs',
          null,
          h(
            'filter',
            { id: 'pa-paper-grain', x: '-20%', y: '-20%', width: '140%', height: '140%' },
            h('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '2', seed: '7', result: 'noise' }),
            h('feColorMatrix', { in: 'noise', type: 'saturate', values: '0' }),
            h('feComponentTransfer', null, h('feFuncA', { type: 'linear', slope: '0.14' })),
            h('feBlend', { in: 'SourceGraphic', in2: 'noise', mode: 'multiply' }),
          ),
          h('linearGradient', { id: 'pa-sky', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', stopColor: '#1b2a38' }),
            h('stop', { offset: '1', stopColor: '#53605e' }),
          ),
          h('radialGradient', { id: 'pa-moon', cx: '.4', cy: '.36', r: '.7' },
            h('stop', { offset: '0', stopColor: '#fffaf0' }),
            h('stop', { offset: '.7', stopColor: '#e8d8b9' }),
            h('stop', { offset: '1', stopColor: '#c9b48c' }),
          ),
        ),
        h('rect', { width: 420, height: 300, fill: 'url(#pa-sky)', filter: 'url(#pa-paper-grain)' }),
        h('circle', { cx: 286, cy: 116, r: 76, fill: 'url(#pa-moon)', opacity: .96 }),
        h('circle', { cx: 286, cy: 116, r: 76, fill: 'none', stroke: '#f7efdf', strokeWidth: 1.2, opacity: .55 }),
        h('path', {
          d: 'M-20 198c78-40 121-24 166 17 48 44 102 43 171-3 44-29 86-33 123-13',
          fill: 'none', stroke: '#2a231d', strokeWidth: 3.4, strokeLinecap: 'round', opacity: .86,
        }),
        h('path', {
          d: 'M-10 218c90-13 138 9 194 33 52 22 119 19 246-17',
          fill: 'none', stroke: '#b6543a', strokeWidth: 2.2, strokeLinecap: 'round', opacity: .72,
        }),
        h('g', { className: 'pa-orbit' },
          h('path', { d: 'M250 67c27-12 54-6 70 16', fill: 'none', stroke: '#f7efdf', strokeWidth: 1, opacity: .38 }),
          h('circle', { cx: '325', cy: '58', r: '2.2', fill: '#f7efdf', opacity: .7 }),
          h('circle', { cx: '196', cy: '170', r: '1.4', fill: '#f7efdf', opacity: .5 }),
        ),
        h('g', { opacity: .52 },
          h('path', { d: 'M44 82c7-9 14-8 21 0' , fill: 'none', stroke: '#f7efdf', strokeWidth: 1.2, strokeLinecap: 'round' }),
          h('path', { d: 'M75 72c5-7 11-7 17 0' , fill: 'none', stroke: '#f7efdf', strokeWidth: 1.2, strokeLinecap: 'round' }),
        ),
      );
    }

    function PoetryForm({ t, busy, error, onStart, characters, setCharacters, uploadCharacters }) {
      const [poemTitle, setPoemTitle] = React.useState('');
      const [poet, setPoet] = React.useState('');
      const [poemText, setPoemText] = React.useState('');
      const [styleId, setStyleId] = React.useState('ink');
      const [customStyle, setCustomStyle] = React.useState('');
      const [localError, setLocalError] = React.useState('');
      const [working, setWorking] = React.useState(false);

      const start = async () => {
        if (busy || working) return;
        if (!poemText.trim()) {
          setLocalError(t('poemEmpty'));
          return;
        }
        if (styleId === 'custom' && !customStyle.trim()) {
          setLocalError(t('poemCustomEmpty'));
          return;
        }
        setLocalError('');
        setWorking(true);
        try {
          const refs = await uploadCharacters();
          const styleKey = POEM_STYLES.find(([id]) => id === styleId)?.[1] ?? 'styleInk';
          const styleName = styleId === 'custom' ? customStyle.trim() : t(styleKey);
          const styleBrief = styleId === 'custom' ? customStyle.trim() : t('stylePresetNote');
          const prompt = t('poemPrompt')
            .replace('{poemTitle}', poemTitle.trim() || t('poetryTab'))
            .replace('{poet}', poet.trim() || t('poemNoPoet'))
            .replace('{style}', styleName)
            .replace('{styleName}', styleName)
            .replace('{styleBrief}', styleBrief)
            .replace('{poem}', poemText.trim()) + characterPromptBlock(refs);
          const started = onStart(prompt);
          if (!started) setWorking(false);
        } catch (err) {
          setWorking(false);
          setLocalError(err && err.message ? err.message : t('charactersFailed'));
        }
      };

      const onKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          start();
        }
      };

      return h(
        'div',
        { className: 'pa-section', hidden: false },
        h(
          'div',
          { className: 'pa-field' },
          h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-poem-title' }, t('poetryNameLabel'))),
          h('input', {
            id: 'pa-poem-title',
            className: 'pa-input',
            value: poemTitle,
            maxLength: 80,
            placeholder: t('poetryNamePlaceholder'),
            onChange: (event) => setPoemTitle(event.target.value),
            onKeyDown,
          }),
        ),
        h(
          'div',
          { className: 'pa-poem-grid' },
          h('div', null,
            h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-poet' }, t('poetLabel'))),
            h('input', {
              id: 'pa-poet',
              className: 'pa-input',
              value: poet,
              maxLength: 80,
              placeholder: t('poetPlaceholder'),
              onChange: (event) => setPoet(event.target.value),
              onKeyDown,
            }),
          ),
          h('div', null,
            h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-poem-style' }, t('poemStyleLabel'))),
            h('select', {
              id: 'pa-poem-style',
              className: 'pa-input pa-select',
              value: styleId,
              onChange: (event) => {
                setStyleId(event.target.value);
                setLocalError('');
              },
            }, POEM_STYLES.map(([id, key]) => h('option', { key: id, value: id }, t(key)))),
          ),
        ),
        styleId === 'custom'
          ? h(
            'div',
            { className: 'pa-field pa-custom-style' },
            h('div', { className: 'pa-label' },
              h('label', { htmlFor: 'pa-poem-custom' }, t('poemCustomLabel')),
            ),
            h('textarea', {
              id: 'pa-poem-custom',
              className: 'pa-textarea pa-custom-text',
              value: customStyle,
              maxLength: 300,
              rows: 3,
              placeholder: t('poemCustomPlaceholder'),
              onChange: (event) => {
                setCustomStyle(event.target.value);
                setLocalError('');
              },
              onKeyDown,
            }),
            h('p', { className: 'pa-hint' }, t('poemCustomHint')),
          )
          : null,
        h(CharacterPicker, { t, items: characters, setItems: setCharacters, disabled: busy || working }),
        h(
          'div',
          { className: 'pa-field' },
          h('div', { className: 'pa-label' },
            h('label', { htmlFor: 'pa-poem-text' }, t('poemLabel')),
            h('span', { className: 'pa-count' }, t('poemLineCount').replace('{n}', String(poemText.split(/\n+/).filter((line) => line.trim()).length))),
          ),
          h('textarea', {
            id: 'pa-poem-text',
            className: 'pa-textarea pa-poem-text',
            value: poemText,
            placeholder: t('poemPlaceholder'),
            onChange: (event) => setPoemText(event.target.value),
            onKeyDown,
          }),
          h('p', { className: 'pa-hint' }, t('poemHint')),
        ),
        localError || error ? h('p', { className: 'pa-error', role: 'alert' }, localError || error) : null,
        h(
          'div',
          { className: 'pa-actions' },
          h('button', { type: 'button', className: 'pa-primary', disabled: busy || working, onClick: start }, busy || working ? t('starting') : t('poemStart')),
        ),
        h('p', { className: 'pa-note' }, t('poemNote')),
        h('p', { className: 'pa-footer' }, t('footer')),
      );
    }

    function CharacterPicker({ t, items, setItems, disabled }) {
      const addFiles = (fileList) => {
        const files = [...(fileList || [])].filter((file) => /^image\/(png|jpeg|webp|gif)$/i.test(file.type));
        const room = Math.max(0, 4 - items.length);
        const next = files.slice(0, room).map((file, index) => ({
          id: `${Date.now()}-${index}-${file.name}`,
          file,
          name: file.name.replace(/\.[^.]+$/, ''),
          role: '',
          preview: URL.createObjectURL(file),
        }));
        if (next.length) setItems((current) => [...current, ...next]);
      };

      const update = (id, patch) => {
        setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      };

      const remove = (id) => {
        setItems((current) => {
          const target = current.find((item) => item.id === id);
          if (target) URL.revokeObjectURL(target.preview);
          return current.filter((item) => item.id !== id);
        });
      };

      return h(
        'section',
        { className: 'pa-characters', 'aria-labelledby': 'pa-characters-title' },
        h(
          'div',
          { className: 'pa-character-head' },
          h('div', null,
            h('h2', { id: 'pa-characters-title', className: 'pa-character-title' }, t('charactersTitle')),
            h('p', { className: 'pa-character-lede' }, t('charactersLede')),
          ),
          h('label', { className: 'pa-character-add', htmlFor: 'pa-character-files' }, t('charactersAdd')),
        ),
        h('input', {
          id: 'pa-character-files',
          type: 'file',
          accept: 'image/png,image/jpeg,image/webp,image/gif',
          multiple: true,
          disabled,
          className: 'pa-character-file',
          onChange: (event) => {
            addFiles(event.target.files);
            event.target.value = '';
          },
        }),
        items.length
          ? h('div', { className: 'pa-character-list' }, items.map((item) => h(
            'div',
            { key: item.id, className: 'pa-character' },
            h('img', { className: 'pa-character-thumb', src: item.preview, alt: '' }),
            h('div', { className: 'pa-character-fields' },
              h('input', {
                className: 'pa-input pa-character-input',
                value: item.name,
                maxLength: 60,
                placeholder: t('charactersName'),
                disabled,
                onChange: (event) => update(item.id, { name: event.target.value }),
              }),
              h('input', {
                className: 'pa-input pa-character-input',
                value: item.role,
                maxLength: 120,
                placeholder: t('charactersRole'),
                disabled,
                onChange: (event) => update(item.id, { role: event.target.value }),
              }),
            ),
            h('button', {
              type: 'button',
              className: 'pa-character-remove',
              disabled,
              'aria-label': t('charactersRemove'),
              title: t('charactersRemove'),
              onClick: () => remove(item.id),
            }, '×'),
          )))
          : h('p', { className: 'pa-character-empty' }, t('charactersEmpty')),
        h('p', { className: 'pa-hint' }, t('charactersHint')),
      );
    }

    function Studio() {
      const ctx = Studio.ctx;
      const t = useTranslation(ctx);
      const [section, setSection] = React.useState('mv');
      const [brief, setBrief] = React.useState('');
      const [title, setTitle] = React.useState('');
      const [songTitle, setSongTitle] = React.useState('');
      const [songArtist, setSongArtist] = React.useState('');
      const [characters, setCharacters] = React.useState([]);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [helpOpen, setHelpOpen] = React.useState(false);
      const helpDialogRef = React.useRef(null);
      const helpCloseRef = React.useRef(null);

      React.useEffect(() => {
        if (!helpOpen) return undefined;
        const previous = document.activeElement;
        const timer = window.setTimeout(() => helpCloseRef.current?.focus(), 0);
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setHelpOpen(false);
            return;
          }
          if (event.key !== 'Tab') return;
          const dialog = helpDialogRef.current;
          if (!dialog) return;
          const focusables = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
            .filter((element) => !element.disabled && element.offsetParent !== null);
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
          window.clearTimeout(timer);
          document.removeEventListener('keydown', onKeyDown);
          if (previous && typeof previous.focus === 'function') previous.focus();
        };
      }, [helpOpen]);

      const readDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error(t('charactersFailed')));
        reader.readAsDataURL(file);
      });

      const uploadCharacters = async () => {
        const refs = [];
        for (const character of characters) {
          const data = await readDataUrl(character.file);
          const response = await fetch('/mv-studio/character-upload', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: character.name || character.file.name,
              role: character.role,
              data,
            }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || t('charactersFailed'));
          refs.push({
            name: payload.name || character.name || character.file.name,
            role: character.role,
            path: payload.absolute || payload.path,
          });
        }
        return refs;
      };

      const startPrompt = (prompt) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          ctx.uiWorkspace.startSession(undefined, {
            prompt,
            clearPreviousDraft: true,
            whenDraftExists: 'replace',
          });
          return true;
        } catch (err) {
          setBusy(false);
          setError(err && err.message ? err.message : t('error'));
          return false;
        }
      };

      const launch = async (mode) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          const refs = await uploadCharacters();
          const characterBlock = characterPromptBlock(refs);
          const direction = brief.trim() || t('defaultDirection');
          const projectTitle = title.trim() || t('untitled');
          const songRef = songTitle.trim()
            ? `${songTitle.trim()}${songArtist.trim() ? ` — ${songArtist.trim()}` : ''}`
            : '';
          const songLine = songRef ? t('songPrompt').replace('{song}', songRef) : '';
          const prompt = t('prompt')
            .replace('{title}', projectTitle)
            .replace('{direction}', direction)
            .replace('{song}', songLine)
            .replace('{mode}', mode === 'storyboard' ? t('modeStoryboard') : '') + characterBlock;
          startPrompt(prompt);
        } catch (err) {
          setBusy(false);
          setError(err && err.message ? err.message : t('charactersFailed'));
        }
      };

      const onKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          launch('full');
        }
      };

      const chips = [
        ['chipRain', 'rainy walk home'],
        ['chipDawn', 'first bus at dawn'],
        ['chipSea', 'paper moon by the sea'],
        ['chipCity', 'one lamp in the old town'],
      ];

      return h(
        'div',
        { className: 'pa-root' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'pa-shell' },
          h(
            'main',
            { className: 'pa-card pa-main' },
            h(
              'div',
              { className: 'pa-topline' },
              h('p', { className: 'pa-eyebrow' }, t('eyebrow')),
              h(
                'button',
                {
                  type: 'button',
                  className: 'pa-help',
                  'aria-haspopup': 'dialog',
                  'aria-expanded': helpOpen,
                  onClick: () => setHelpOpen(true),
                },
                h('span', { className: 'pa-help-mark', 'aria-hidden': true }, '?'),
                t('helpButton'),
              ),
            ),
            h('h1', { className: 'pa-title' }, t(section === 'poetry' ? 'poetryTitle' : 'title')),
            h('p', { className: 'pa-lede' }, t(section === 'poetry' ? 'poetryLede' : 'lede')),
            h(
              'div',
              { className: 'pa-tabs', role: 'tablist' },
              h('button', {
                type: 'button',
                role: 'tab',
                id: 'pa-tab-mv',
                'aria-selected': section === 'mv',
                'aria-controls': 'pa-panel-mv',
                className: 'pa-tab',
                onClick: () => setSection('mv'),
              }, t('mvTab')),
              h('button', {
                type: 'button',
                role: 'tab',
                id: 'pa-tab-poetry',
                'aria-selected': section === 'poetry',
                'aria-controls': 'pa-panel-poetry',
                className: 'pa-tab',
                onClick: () => setSection('poetry'),
              }, t('poetryTab')),
            ),
            h(
              'div',
              {
                id: 'pa-panel-mv',
                className: 'pa-section',
                role: 'tabpanel',
                'aria-labelledby': 'pa-tab-mv',
                hidden: section !== 'mv',
              },
              h(
                'div',
                { className: 'pa-field' },
                h(
                  'div',
                  { className: 'pa-label' },
                  h('label', { htmlFor: 'pa-brief' }, t('briefLabel')),
                h('span', { className: 'pa-count' }, t('charCount').replace('{n}', String(brief.length))),
              ),
              h('textarea', {
                id: 'pa-brief',
                className: 'pa-textarea',
                value: brief,
                maxLength: 220,
                placeholder: t('briefPlaceholder'),
                onChange: (event) => setBrief(event.target.value),
                onKeyDown,
                autoFocus: true,
              }),
              h('p', { className: 'pa-hint' }, t('briefHint')),
              h('div', { className: 'pa-chips', 'aria-label': t('chipsLabel') },
                chips.map(([key, fallback]) => h('button', {
                  key,
                  type: 'button',
                  className: 'pa-chip',
                  onClick: () => setBrief(t(key) || fallback),
                }, t(key) || fallback)),
              ),
            ),
            h(
              'div',
              { className: 'pa-title-row' },
              h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-title' }, t('titleLabel'))),
              h('input', {
                id: 'pa-title',
                className: 'pa-input',
                value: title,
                maxLength: 80,
                placeholder: t('titlePlaceholder'),
                onChange: (event) => setTitle(event.target.value),
                onKeyDown,
              }),
            ),
            h(
              'div',
              { className: 'pa-song-head' },
              h('span', null, t('songLabel')),
              h('span', { className: 'pa-local-tag' }, t('localOnly')),
            ),
            h(
              'div',
              { className: 'pa-song-row' },
              h('div', null,
                h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-song-title' }, t('songTitleLabel'))),
                h('input', {
                  id: 'pa-song-title',
                  className: 'pa-input',
                  value: songTitle,
                  maxLength: 100,
                  placeholder: t('songTitlePlaceholder'),
                  onChange: (event) => setSongTitle(event.target.value),
                  onKeyDown,
                }),
              ),
              h('div', null,
                h('div', { className: 'pa-label' }, h('label', { htmlFor: 'pa-song-artist' }, t('artistLabel'))),
                h('input', {
                  id: 'pa-song-artist',
                  className: 'pa-input',
                  value: songArtist,
                  maxLength: 80,
                  placeholder: t('artistPlaceholder'),
                  onChange: (event) => setSongArtist(event.target.value),
                  onKeyDown,
                }),
              ),
            ),
            h('p', { className: 'pa-hint' }, t('songHint')),
            h(CharacterPicker, { t, items: characters, setItems: setCharacters, disabled: busy }),
            error ? h('p', { className: 'pa-error', role: 'alert' }, error) : null,
            h(
              'div',
              { className: 'pa-actions' },
              h('button', { type: 'button', className: 'pa-primary', disabled: busy, onClick: () => launch('full') }, busy ? t('starting') : t('start')),
              h('button', { type: 'button', className: 'pa-secondary', disabled: busy, onClick: () => launch('storyboard') }, t('storyboard')),
            ),
            h('p', { className: 'pa-note' }, t('note')),
            h('p', { className: 'pa-footer' }, t('footer')),
          ),
          h(
            'div',
            {
              id: 'pa-panel-poetry',
              className: 'pa-section',
              role: 'tabpanel',
              'aria-labelledby': 'pa-tab-poetry',
              hidden: section !== 'poetry',
            },
            h(PoetryForm, {
              t,
              busy,
              error,
              onStart: startPrompt,
              characters,
              setCharacters,
              uploadCharacters,
            }),
          ),
          ),
          h(
            'aside',
            { className: 'pa-aside' },
            h('div', { className: 'pa-art' },
              h(MoonArt),
              h('div', { className: 'pa-art-caption' }, t('artCaption')),
            ),
            h(
              'section',
              { className: 'pa-card pa-panel' },
              h('h2', { className: 'pa-panel-title' }, t('processTitle')),
              h('ol', { className: 'pa-steps' },
                [1, 2, 3, 4, 5].map((n) => h('li', { key: n, className: 'pa-step' },
                  h('span', { className: 'pa-step-num' }, String(n).padStart(2, '0')),
                  h('div', null,
                    h('div', { className: 'pa-step-name' }, t(`step${n}`)),
                    h('p', { className: 'pa-step-body' }, t(`step${n}Body`)),
                  ),
                )),
              ),
            ),
            h(
              'section',
              { className: 'pa-card pa-panel' },
              h('h2', { className: 'pa-panel-title' }, t('styleTitle')),
              h('p', { className: 'pa-style-body' }, t('styleBody')),
              h('div', { className: 'pa-palette', 'aria-label': t('paletteLabel') },
                PALETTE.map((color) => h('span', { key: color, className: 'pa-swatch', style: { background: color } })),
              ),
            ),
          ),
        ),
        helpOpen
          ? h(
            'div',
            {
              className: 'pa-help-overlay',
              role: 'presentation',
              onMouseDown: (event) => {
                if (event.target === event.currentTarget) setHelpOpen(false);
              },
            },
            h(
              'div',
              {
                ref: helpDialogRef,
                className: 'pa-help-dialog',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': 'pa-help-title',
              },
              h(
                'div',
                { className: 'pa-help-head' },
                h('div', null,
                  h('h2', { id: 'pa-help-title', className: 'pa-help-title' }, t('helpTitle')),
                  h('p', { className: 'pa-help-intro' }, t('helpIntro')),
                ),
                h('button', {
                  ref: helpCloseRef,
                  type: 'button',
                  className: 'pa-help-close',
                  'aria-label': t('helpClose'),
                  onClick: () => setHelpOpen(false),
                }, '×'),
              ),
              h('p', { className: 'pa-help-example' }, t('helpExample')),
              h('p', { className: 'pa-help-local', role: 'note' }, t('helpLocalNote')),
              h('ol', { className: 'pa-help-list' },
                [1, 2, 3, 4, 5].map((n) => h('li', { key: n, className: 'pa-help-step' },
                  h('span', { className: 'pa-help-num' }, `0${n}`),
                  h('div', null,
                    h('div', { className: 'pa-help-step-title' }, t(`help${n}Title`)),
                    h('p', { className: 'pa-help-step-body' }, t(`help${n}Body`)),
                  ),
                )),
              ),
              h('p', { className: 'pa-help-tip' }, t('helpTip')),
              h('div', { className: 'pa-help-actions' },
                h('button', { type: 'button', className: 'pa-primary', onClick: () => setHelpOpen(false) }, t('helpGotIt')),
              ),
            ),
          )
          : null,
      );
    }

    return {
      inject: ['slots', 'uiWorkspace', 'locale'],
      apply(ctx) {
        Studio.ctx = ctx;
        ctx.effect(() => ctx.locale.register(NS, 'en', EN));
        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH));

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'mv-studio',
              order: 20,
              label: () => ctx.locale.bind(NS)('nav'),
            },
            PanelIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'mv-studio' },
            Studio,
          ),
        );
      },
    };
  },
});
