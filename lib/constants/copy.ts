/**
 * 画面に表示する文言（ラベル / タイトル / エラー / プレースホルダー / aria-label 等）の集約。
 *
 * - 全ファイルから参照する Single Source of Truth。
 * - 動的文言はテンプレート関数として同居する（`(name) => '${name}の写真'` 形式）。
 * - スタイル・ロジックは含めない。純粋な文字列とテンプレ関数のみ。
 *
 * 増えてきて見通しが落ちたら画面別に分割する。判断基準は CLAUDE.md（プロジェクト規約）と相談。
 */

// =====================================================================================
// ナビゲーション項目（ヘッダー / モバイル / フッターの 3 箇所で共有）
// =====================================================================================
export const NAV_ITEMS = [
  { label: 'スポット検索', href: '/spots' },
  { label: '花の種類', href: '/flowers' },
  { label: 'AI花判定', href: '/identify' },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

const POLICY_LINKS = [
  { label: '利用規約', href: '/terms' },
  { label: 'プライバシーポリシー', href: '/privacy' },
  { label: '特定商取引法に基づく表記', href: '/legal' },
] as const;

const MONTHS_EN = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTHS_JA = [
  '',
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
] as const;

export const COPY = {
  // -----------------------------------------------------------------------------------
  // サイト共通（メタデータ / フッターのコピーライト等）
  // -----------------------------------------------------------------------------------
  site: {
    name: 'hana nav',
    titleSuffix: '花畑スポット検索',
    description:
      '全国の花畑スポットを、エリア・季節・花の種類から探せる検索サービス。AI花判定で目の前の花も識別できます。',
    descriptionShort: '全国の花畑スポットを、エリア・季節・花の種類から探せる検索サービス。',
    contactEmail: 'support@hana-nav.example',
    titleDefault: 'hana nav | 花畑スポット検索',
    copyright: (year: number) => `© ${year} hana nav`,
  },

  // -----------------------------------------------------------------------------------
  // 共通文言（複数画面で再利用するもの）
  // -----------------------------------------------------------------------------------
  common: {
    search: '検索',
    seeAll: 'すべて見る',
    showDetail: '詳細を見る',
    backToTop: 'トップに戻る',
    photoAlt: (name: string) => `${name}の写真`,
    seasonPrefix: '見頃',
    months: { en: MONTHS_EN, ja: MONTHS_JA },
  },

  // -----------------------------------------------------------------------------------
  // ヘッダー / モバイルナビ / ユーザーメニュー
  // -----------------------------------------------------------------------------------
  nav: {
    items: NAV_ITEMS,
    quickSearch: 'スポットを検索',
    headerSearchPlaceholder: 'キーワード検索',
    openMenu: 'メニューを開く',
    siteMenu: 'サイト全体のメニュー',
    userMenu: 'ユーザーメニュー',
    login: 'ログイン',
    signup: '会員登録',
    mypage: 'マイページ',
    bookmarks: 'ブックマーク',
    admin: '管理画面',
    logout: 'ログアウト',
  },

  // -----------------------------------------------------------------------------------
  // フッター
  // -----------------------------------------------------------------------------------
  footer: {
    explore: 'Explore',
    about: 'About',
    contact: 'お問い合わせ',
    policyLinks: POLICY_LINKS,
  },

  // -----------------------------------------------------------------------------------
  // トップページ
  // -----------------------------------------------------------------------------------
  home: {
    hero: {
      eyebrow: 'Find your bloom',
      title: '満開を、見逃さない。',
      description:
        '全国の花畑スポットを、エリア・季節・花の種類から探せます。今が見頃の場所も、来月の予習も。',
      monthLine: (monthEn: string, year: number) => `${monthEn} ${year} ・ Find your bloom`,
    },
    searchBar: {
      area: 'エリア',
      areaPlaceholder: 'どこで見たい？',
      season: '時期',
      flower: '花',
      flowerPlaceholder: '何を見たい？',
      identifyCta: '目の前の花を AI で判定する',
    },
    map: {
      eyebrow: 'Map view',
      title: '今月見頃のマップ',
    },
    featured: {
      eyebrow: 'In bloom now',
      title: '今月の見頃スポット',
      empty: {
        title: '今月見頃のスポットは準備中です',
        description: 'データを順次追加しています。先に花の種類から探してみてください。',
        cta: '花の一覧を見る',
        seeAll: '一覧から探す',
      },
    },
    flowerTypes: {
      eyebrow: 'By flower',
      title: '花から探す',
    },
  },

  // -----------------------------------------------------------------------------------
  // スポット検索ページ
  // -----------------------------------------------------------------------------------
  spotsList: {
    metaTitle: 'スポットを探す',
    metaDescription: '全国の花畑スポットをエリア・花の種類・見頃の時期で絞り込んで探せます。',
    eyebrow: 'Browse spots',
    title: 'スポットを探す',
    description:
      'エリア・時期・花の種類でフィルター。複数組み合わせ可能。URL を共有すると同じ結果が再現できます。',
    countSuffix: '件',
    pageProgress: (page: number, total: number) => ` / ${page} / ${total} ページ`,
    clearFilter: 'フィルターをクリア',
    empty: {
      title: '該当するスポットがありません',
      description:
        'フィルターを絞りすぎている可能性があります。条件を変えてもう一度お試しください。',
    },
    mapApiMissing:
      '地図 API キーが未設定のためマップを表示できません。リスト表示に切り替えてください。',
    mapPinNotice: 'ピンが立たないスポットは座標未登録です。リストには全件表示されます。',
    filter: {
      keywordPlaceholder: 'スポット名・キーワードで検索',
      area: 'エリア',
      region: '地方',
      season: '時期',
      flower: '花',
      sortHeading: '並び順',
      viewHeading: '表示',
      sort: {
        newest: '新着順',
        name: '名前順',
        prefecture: '都道府県順',
      },
      view: {
        list: 'リスト',
        map: 'マップ',
      },
    },
  },

  // -----------------------------------------------------------------------------------
  // ページネーション
  // -----------------------------------------------------------------------------------
  pagination: {
    aria: 'ページネーション',
    prev: '前へ',
    next: '次へ',
  },

  // -----------------------------------------------------------------------------------
  // スポット詳細の地図ピン（SpotMapPin）
  // -----------------------------------------------------------------------------------
  spotMap: {
    locationPending: '地図を準備中です',
    directions: '経路を調べる',
  },

  // -----------------------------------------------------------------------------------
  // スポット詳細ページ
  // -----------------------------------------------------------------------------------
  spotDetail: {
    metaNotFound: 'スポットが見つかりません',
    metaTitle: (name: string) => `${name}の見頃情報`,
    metaDescription: (params: {
      name: string;
      prefectureName: string;
      seasonText: string;
      description: string | null;
    }) =>
      `${params.prefectureName}の${params.name}は${params.seasonText}が見頃。` +
      `${params.description ? params.description + ' ' : ''}アクセス、見どころ情報を hana nav がお届けします。`,
    bestSeasonBadge: (range: string) => `見頃 ${range}`,
    inSeasonSuffix: '・今が見頃',
    info: {
      address: '住所',
      access: 'アクセス',
      parking: '駐車場',
      entranceFee: '入場料',
    },
    sections: {
      mapTitle: '地図',
      flowersTitle: '見られる花',
      flowersEyebrow: 'Flowers',
      reviewsTitle: 'レビュー',
      reviewsEyebrow: 'Reviews',
      relatedTitle: '関連スポット',
      relatedEyebrow: 'Nearby',
    },
    references: {
      officialSite: '公式サイト',
      sourceLabel: (source: string) => `出典: ${source}`,
    },
    manner: {
      title: '訪れる前に',
      items: [
        '・ ゴミは必ず持ち帰り、自然を大切に楽しみましょう。',
        '・ 花を摘んだり、私有地に立ち入ったりしないでください。',
        '・ 混雑する時期は平日の訪問もご検討ください。',
      ],
    },
    gallery: {
      preparing: '写真を準備中です',
      thumbnailAlt: (name: string, index: number) => `${name}のサムネイル ${index}`,
      showThumbnail: (index: number) => `${index}枚目を表示`,
    },
    flowers: {
      empty: 'この場所で見られる花はまだ登録されていません。',
    },
    reviews: {
      empty: 'まだレビューはありません',
      promptFirst: '訪れた感想をぜひ最初に投稿してみてください。',
      withdrawnUser: '退会済ユーザー',
      ratingDenominator: '／ 5.0',
      countSuffix: (count: number) => `${count}件のレビュー`,
      visitedAt: (date: string) => `${date} 訪問`,
      postedAt: (date: string) => `${date} 投稿`,
      ratingAria: (rating: number) => `評価 ${rating} / 5`,
    },
  },

  // -----------------------------------------------------------------------------------
  // スポット詳細 not-found
  // -----------------------------------------------------------------------------------
  spotDetailNotFound: {
    code: '404',
    title: 'スポットが見つかりませんでした',
    description:
      'リンクが古くなっているか、公開が停止された可能性があります。最新のスポット一覧から探してみてください。',
    backToList: 'スポット一覧へ',
  },

  // -----------------------------------------------------------------------------------
  // エリア別一覧（/areas/[prefecture_id]）
  // -----------------------------------------------------------------------------------
  area: {
    metaNotFound: 'エリアが見つかりません',
    metaTitle: (prefectureName: string) => `${prefectureName}の花畑スポット`,
    metaDescription: (params: { prefectureName: string; region: string; spotCount: number }) =>
      params.spotCount > 0
        ? `${params.region}・${params.prefectureName}の花畑スポット ${params.spotCount} 件。エリアごとの見頃カレンダーから今・これからの花を探せます。`
        : `${params.region}・${params.prefectureName}の花畑スポットを準備中です。近隣のエリアやキーワードからもお探しいただけます。`,
    eyebrow: 'By area',
    breadcrumb: {
      aria: 'パンくず',
      areas: 'エリア',
      home: 'トップ',
    },
    countSuffix: '件',
    spots: {
      heading: 'スポット',
      eyebrow: 'Spots',
      empty: {
        title: 'このエリアのスポットは準備中です',
        description: 'データを順次追加しています。スポット検索や近隣エリアからもお探しください。',
        cta: 'スポット検索へ',
      },
    },
    monthly: {
      heading: '月別の見頃カレンダー',
      eyebrow: 'Calendar',
      description: 'このエリアで月ごとに見られる花。タップすると花の詳細ページへ移動します。',
      empty: '見頃の登録はまだありません。',
      monthLabel: (month: string) => `${month}に見頃`,
      flowerCount: (count: number) => `${count} 種類`,
      spotCount: (count: number) => `${count} 件`,
    },
    related: {
      heading: '近隣エリア',
      eyebrow: 'Nearby areas',
      regionLabel: (region: string) => `${region}の他県`,
      empty: '近隣エリアの登録はまだありません。',
    },
  },

  // -----------------------------------------------------------------------------------
  // エリア別一覧 not-found
  // -----------------------------------------------------------------------------------
  areaNotFound: {
    code: '404',
    title: 'エリアが見つかりませんでした',
    description:
      'URL が誤っているか、対象の都道府県が存在しません。エリア一覧から選び直してください。',
    backToList: 'スポット一覧へ',
  },

  // -----------------------------------------------------------------------------------
  // 花の種類 一覧（/flowers）
  // -----------------------------------------------------------------------------------
  flowersList: {
    metaTitle: '花の種類一覧',
    metaDescription:
      '春夏秋冬の花を 50 音順で一覧。気になる花から見頃時期や、見られるスポットを探せます。',
    eyebrow: 'By flower',
    title: '花の種類から探す',
    description: '気になる花から、見頃の時期と見られるスポットを探せます。',
    countSuffix: '種類',
    indexAria: '50 音インデックス',
    sectionAria: (label: string) => `${label}行の花一覧`,
    empty: {
      title: '花のデータが見つかりません',
      description: 'マスター投入が完了していない可能性があります。',
    },
    aliasMiss: {
      // AI 判定や外部リンクから来たユーザーに、何が当たらなかったか・どうすれば良いかを伝える
      title: (alias: string) => `「${alias}」に一致する花は見つかりませんでした`,
      description:
        '別名や品種名はマスターに登録されているもののみ対応しています。一覧から探してみてください。',
    },
  },

  // -----------------------------------------------------------------------------------
  // 花の詳細（/flowers/[id]）
  // -----------------------------------------------------------------------------------
  flowerDetail: {
    metaNotFound: '花が見つかりません',
    metaTitle: (name: string) => `${name}の見頃時期と花畑スポット`,
    metaDescription: (params: {
      name: string;
      seasonText: string;
      spotCount: number;
      description: string | null;
    }) => {
      const seasonPart = params.seasonText ? `${params.seasonText}が見頃。` : '';
      const descPart = params.description ? `${params.description} ` : '';
      const spotPart =
        params.spotCount > 0
          ? `全国 ${params.spotCount} か所のスポットから探せます。`
          : '見頃時期や特徴を hana nav がまとめます。';
      return `${params.name}は${seasonPart}${descPart}${spotPart}`;
    },
    seasonBadge: (range: string) => `見頃 ${range}`,
    seasonUnknown: '見頃情報は準備中です',
    inSeasonSuffix: '・今が見頃',
    sections: {
      aboutTitle: '花の特徴',
      seasonTitle: '見頃カレンダー',
      seasonEyebrow: 'Season',
      aliasesTitle: '別名・品種',
      aliasesEyebrow: 'Aliases',
      spotsTitle: 'この花が見られるスポット',
      spotsEyebrow: 'Spots',
    },
    aliases: {
      empty: '別名・品種は登録されていません。',
      summary: (count: number) => `登録されている別名・品種 ${count} 件`,
    },
    spots: {
      empty: 'この花を登録しているスポットはまだありません。',
      countSummary: (count: number) => `${count} 件のスポットで見られます`,
    },
    seasonChart: {
      caption: '12 か月の中での見頃の月（濃い色 = 見頃ピーク）',
      monthAria: (month: string, peak: boolean) => (peak ? `${month}・見頃` : month),
    },
    description: {
      empty: '紹介文はまだ登録されていません。',
    },
    gallery: {
      preparing: '写真を準備中です',
    },
  },

  // -----------------------------------------------------------------------------------
  // 花詳細 not-found
  // -----------------------------------------------------------------------------------
  flowerDetailNotFound: {
    code: '404',
    title: '花のページが見つかりませんでした',
    description:
      'リンクが古くなっているか、削除された可能性があります。花の一覧から探し直してください。',
    backToList: '花の一覧へ',
  },

  // -----------------------------------------------------------------------------------
  // エラー境界 (各ルートの error.tsx)
  // -----------------------------------------------------------------------------------
  error: {
    retry: 'もう一度試す',
    bookmarkList: {
      title: 'ブックマーク一覧を読み込めませんでした',
      description: '一時的な問題かもしれません。少し時間を置いてから再度お試しください。',
    },
    spotDetail: {
      title: 'スポット情報を読み込めませんでした',
      description: '一時的な問題かもしれません。少し時間を置いてから再度お試しください。',
    },
  },

  // -----------------------------------------------------------------------------------
  // ブックマーク（スポット詳細ボタン / マイページ一覧）
  // -----------------------------------------------------------------------------------
  bookmark: {
    button: {
      add: '保存する',
      remove: '保存済み',
      adding: '追加中…',
      removing: '解除中…',
      loginPrompt: 'ログインして保存',
      ariaAdd: (name: string) => `${name}をブックマークに追加`,
      ariaRemove: (name: string) => `${name}をブックマークから外す`,
    },
    toast: {
      added: 'ブックマークに追加しました',
      removed: 'ブックマークから外しました',
      addFailed: 'ブックマークの追加に失敗しました',
      removeFailed: 'ブックマークの解除に失敗しました',
    },
    list: {
      metaTitle: 'ブックマーク',
      eyebrow: 'My bookmarks',
      title: '保存したスポット',
      description: '気になったスポットを後から見返せます。見頃の時期を逃さずチェック。',
      countSuffix: '件',
      remove: '保存を解除',
      removeAria: (name: string) => `${name}の保存を解除`,
      empty: {
        title: '気になるスポットを保存しよう',
        description: 'スポット詳細ページの「保存する」から、行きたい場所を集めておけます。',
        cta: 'スポットを探す',
      },
    },
  },

  // -----------------------------------------------------------------------------------
  // AI 花判定（/identify, /identify/result）
  // -----------------------------------------------------------------------------------
  identify: {
    metaTitle: 'AI 花判定',
    metaDescription:
      '目の前の花を撮影 / アップロードすると、AI が花の名前・見頃・特徴を判定します。',
    eyebrow: 'AI Identify',
    title: '目の前の花を AI で判定',
    description:
      '撮影した花の写真をアップロードすると、花の名前・特徴・関連する花畑スポットを AI がご案内します。',
    privacy:
      '画像はサーバーで AI 判定の処理にのみ利用し、保存しません。判定結果の精度は撮影条件により異なります。',
    upload: {
      camera: 'カメラで撮る',
      pickFile: 'ファイルから選ぶ',
      dropHere: 'ここにドラッグ &amp; ドロップでも OK',
      preview: 'プレビュー',
      retake: '撮り直す',
      submit: '判定する',
      submitting: '判定中…（最大 30 秒）',
      tips: 'コツ：花のアップを 1 種類だけフレームに収めると精度が上がります。',
    },
    rateLimit: {
      anonHeading: '今日の利用状況（匿名）',
      authHeading: '今日の利用状況',
      remaining: (remaining: number, limit: number) => `残り ${remaining} / ${limit} 回`,
      reachedTitle: '本日の上限に達しました',
      reachedDescriptionAnon:
        'ログインすると 1 日 3 回まで利用できます。明日 0 時にリセットされます。',
      reachedDescriptionAuth: '明日 0 時にリセットされます。',
      loginCta: 'ログインして回数を増やす',
      anonHint: 'ログインすると 1 日 3 回まで判定できます。',
    },
    error: {
      genericTitle: '判定に失敗しました',
      generic: 'しばらく時間を置いてから再度お試しください。',
      parse: 'AI の応答を読み取れませんでした。別の画像でお試しください。',
      tooLarge: '画像サイズが大きすぎます。別の画像でお試しください。',
      missingKey: 'AI 判定の準備中です。しばらくお待ちください。',
      anonRequired: '識別子の取得に失敗しました。ブラウザのストレージを許可してください。',
      retry: 'もう一度試す',
    },
    result: {
      metaTitle: 'AI 花判定の結果',
      eyebrow: 'AI Result',
      title: '判定結果',
      noData: {
        title: '判定結果がありません',
        description: '判定ページに戻り、画像をアップロードしてください。',
        cta: '判定ページへ戻る',
      },
      confidence: {
        label: '信頼度',
        formatted: (confidence: number) => `${Math.round(confidence * 100)}%`,
        lowNotice: '信頼度が低い結果です。撮り直しや別アングルもお試しください。',
      },
      bloomStatus: '開花状況',
      sections: {
        description: '特徴',
        flowerLanguage: '花言葉',
        funFact: '豆知識',
        viewingMonths: '一般的な見頃',
        recommendedSpots: 'この花が見られるスポット',
      },
      notFlower: {
        title: '花として認識できませんでした',
        description: '別の角度や明るい場所で撮り直してみてください。',
      },
      unmatched: {
        title: 'マスターに未登録の花です',
        description: '特徴のみ表示しています。今後マスターに追加していきます。',
      },
      noSpots: '関連スポットの登録はまだありません。',
      flowerLink: '花の詳細を見る',
      storyCardCta: '旅のしおりを作る',
      backToIdentify: 'もう一度判定する',
    },
    storyCard: {
      metaTitle: '旅のしおりを作る',
      eyebrow: 'Story card',
      title: '旅のしおりを作る',
      description:
        'AI 判定の結果と写真をもとに、SNS にシェアしやすい縦長 1080×1920 の画像をブラウザ上で生成します。',
      noData: {
        title: 'しおりに使う写真が見つかりません',
        description: 'AI 花判定からアップロードした写真が必要です。判定からやり直してください。',
        cta: '判定ページへ戻る',
      },
      form: {
        flowerLabel: '花の名前',
        flowerPlaceholder: '例：ネモフィラ',
        spotLabel: 'スポット名（任意）',
        spotPlaceholder: '例：国営ひたち海浜公園',
        visitedLabel: '訪問日',
        commentLabel: 'ひとこと（任意）',
        commentPlaceholder: '見つけた瞬間の気持ちを 200 文字まで',
        commentCounter: (length: number, max: number) => `${length} / ${max}`,
        flowerLanguageLabel: '花言葉（任意）',
        flowerLanguagePlaceholder: '例：可憐',
      },
      generate: 'しおりを生成する',
      generating: '生成中…',
      regenerate: '作り直す',
      share: 'SNS にシェア',
      download: '画像をダウンロード',
      shareText: (flowerName: string) => `${flowerName}を見つけました🌸 #花ナビ`,
      shareTitle: '旅のしおり | hana nav',
      previewAlt: 'しおりプレビュー',
      previewPlaceholder: '生成するとここにプレビューが表示されます。',
      perfHint: '端末性能に応じて 720×1280 で生成する場合があります。',
      backToResult: '判定結果に戻る',
      errors: {
        imageLoad: '画像の読み込みに失敗しました。判定からやり直してください。',
        generic: 'しおりの生成に失敗しました。時間を置いて再度お試しください。',
      } as Record<string, string>,
    },
  },

  // -----------------------------------------------------------------------------------
  // 認証画面
  // -----------------------------------------------------------------------------------
  auth: {
    common: {
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      passwordWithHintLabel: 'パスワード（8 文字以上）',
      passwordConfirmLabel: 'パスワード（確認）',
      orDivider: 'または',
    },
    login: {
      metaTitle: 'ログイン',
      eyebrow: 'Login',
      title: 'ログイン',
      description: 'メールアドレスでログイン、または Google アカウントを利用してください。',
      footerLabel: 'アカウントをお持ちでない方は',
      footerCta: '新規登録',
      submit: 'ログイン',
      forgotPassword: 'パスワードを忘れた方',
      errors: {
        invalid_credentials: 'メールアドレスまたはパスワードが正しくありません。',
        invalid_input: '入力内容に誤りがあります。',
        auth_callback_failed: 'ログイン処理に失敗しました。もう一度お試しください。',
      } as Record<string, string>,
    },
    signup: {
      metaTitle: '新規登録',
      eyebrow: 'Sign Up',
      title: '新規登録',
      description: 'hana nav でブックマーク・レビュー・しおり生成をお楽しみください。',
      footerLabel: 'すでにアカウントをお持ちの方は',
      footerCta: 'ログイン',
      submit: '登録する',
      errors: {
        invalid_input: '入力内容に誤りがあります。',
        password_mismatch: 'パスワードが一致しません。',
        password_too_short: 'パスワードは 8 文字以上で入力してください。',
        signup_failed: '登録に失敗しました。メールアドレスを確認してください。',
      } as Record<string, string>,
      statuses: {
        email_sent:
          '入力されたメールアドレスに確認メールを送信しました。メール内のリンクからログインを完了してください。',
      } as Record<string, string>,
    },
    resetPassword: {
      metaTitle: 'パスワードリセット',
      eyebrow: 'Reset',
      title: 'パスワードリセット',
      description: '登録済みのメールアドレス宛にリセット用リンクを送ります。',
      footerLabel: 'ログイン画面に戻る場合は',
      footerCta: 'ログイン',
      submit: 'リセットメールを送る',
      errors: {
        invalid_input: 'メールアドレスを入力してください。',
      } as Record<string, string>,
      statuses: {
        email_sent:
          '入力されたメールアドレスにリセット用リンクを送信しました（登録済みの場合のみ）。',
      } as Record<string, string>,
    },
    updatePassword: {
      metaTitle: 'パスワード更新',
      eyebrow: 'Update',
      title: '新しいパスワードを設定',
      description: 'リセットメールから遷移したセッションで新しいパスワードを設定します。',
      submit: 'パスワードを更新する',
      newPasswordLabel: '新しいパスワード（8 文字以上）',
      newPasswordConfirmLabel: '新しいパスワード（確認）',
      errors: {
        invalid_input: '入力内容に誤りがあります。',
        password_mismatch: 'パスワードが一致しません。',
        password_too_short: 'パスワードは 8 文字以上で入力してください。',
        update_failed: 'パスワードの更新に失敗しました。もう一度お試しください。',
      } as Record<string, string>,
    },
    google: {
      signIn: 'Google でログイン',
      redirecting: 'リダイレクト中…',
    },
  },
} as const;
