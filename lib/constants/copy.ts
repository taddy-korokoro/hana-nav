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
  // 静的ページ（/terms, /privacy）のヘッダー・メタ情報
  // 本文は各 page.tsx に静的 JSX で記述する（仕様メモ: docs/20_static-pages.md）。
  // -----------------------------------------------------------------------------------
  staticPages: {
    lastUpdatedLabel: '最終更新日',
    historyHeading: '改定履歴',
    terms: {
      metaTitle: '利用規約',
      metaDescription:
        'hana nav の利用規約。サービス内容・禁止事項・AI 機能の取り扱い・現地マナー・免責事項を定めています。',
      eyebrow: 'Terms of Service',
      title: '利用規約',
      description:
        '本規約は、hana nav（以下「本サービス」といいます）の利用条件を定めるものです。本サービスのご利用前にお読みください。',
      lastUpdated: '2026-05-21',
    },
    privacy: {
      metaTitle: 'プライバシーポリシー',
      metaDescription:
        'hana nav が取得する情報、利用目的、第三者提供、Cookie の利用、退会・データ削除請求の窓口を記載しています。',
      eyebrow: 'Privacy Policy',
      title: 'プライバシーポリシー',
      description:
        '本ポリシーは、hana nav（以下「本サービス」といいます）における利用者の個人情報の取り扱いを定めるものです。',
      lastUpdated: '2026-05-21',
    },
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
    inSeasonLabel: '今が見頃',
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
      showMore: 'もっと見る',
      showLess: '閉じる',
      yourReviewBadge: 'あなたのレビュー',
      editAction: 'レビューを編集',
      loginPromptTitle: 'ログインしてレビューする',
      loginPromptDescription:
        '訪れたスポットの感想を ★1〜5 と 200 文字以内で投稿できます。ログインまたは新規登録してください。',
      loginCta: 'ログインする',
      form: {
        formTitlePost: 'レビューを書く',
        formTitleEdit: 'レビューを編集',
        ratingLabel: '評価',
        ratingHint: '★を選択してください（必須）',
        ratingStarAria: (value: number) => `${value} つ星に設定`,
        commentLabel: 'コメント',
        commentPlaceholder: '訪れた感想を 200 文字以内で（任意）',
        commentCounter: (length: number, max: number) => `${length} / ${max}`,
        visitedAtLabel: '訪問日',
        visitedAtHint: '任意。空欄でも投稿できます。',
        submitPost: '投稿する',
        submitEdit: '更新する',
        submitting: '送信中…',
        cancel: 'キャンセル',
        deleteAction: '削除する',
        deleteConfirm: 'このレビューを削除してよろしいですか？',
        deleting: '削除中…',
      },
      toast: {
        posted: 'レビューを投稿しました',
        updated: 'レビューを更新しました',
        deleted: 'レビューを削除しました',
        postFailed: 'レビューの投稿に失敗しました',
        updateFailed: 'レビューの更新に失敗しました',
        deleteFailed: 'レビューの削除に失敗しました',
      },
      errors: {
        invalid_rating: '評価を 1〜5 で選択してください。',
        invalid_comment: 'コメントは 200 文字以内で入力してください。',
        invalid_visited_at: '訪問日は YYYY-MM-DD 形式で入力してください。',
        invalid_spot_id: 'スポット情報が不正です。',
        ng_word: '不適切な表現が含まれています。文章を見直してください。',
        unauthorized: 'ログインが必要です。',
        upsert_failed: 'レビューの保存に失敗しました。時間を置いて再度お試しください。',
        update_failed: 'レビューの更新に失敗しました。時間を置いて再度お試しください。',
        delete_failed: 'レビューの削除に失敗しました。時間を置いて再度お試しください。',
        invalid_json: '入力内容を読み取れませんでした。',
        invalid_id: 'レビュー ID が不正です。',
        generic: 'エラーが発生しました。時間を置いて再度お試しください。',
      } as Record<string, string>,
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
    inSeasonLabel: '今が見頃',
    sections: {
      aboutTitle: '花の特徴',
      seasonTitle: '見頃カレンダー',
      seasonEyebrow: 'Season',
      attributesTitle: '栽培情報',
      attributesEyebrow: 'Attributes',
      aliasesTitle: '別名・品種',
      aliasesEyebrow: 'Aliases',
      spotsTitle: 'この花が見られるスポット',
      spotsEyebrow: 'Spots',
    },
    // DB の英語識別子 → 表示用日本語ラベル。
    // 識別子の集合は flowers テーブルの CHECK 制約と一致させる
    // （migration 20260516000001_flowers_attributes.sql 参照）。
    attributes: {
      empty: '栽培情報は登録されていません。',
      unregistered: '未登録',
      labels: {
        cultivationDifficulty: '栽培難易度',
        coldTolerance: '耐寒性',
        heatTolerance: '耐暑性',
        shadeTolerance: '耐陰性',
      },
      difficulty: {
        EASY: '易しい',
        SLIGHTLY_EASY: 'やや易しい',
        NORMAL: '普通',
        SLIGHTLY_HARD: 'やや難しい',
        HARD: '難しい',
      },
      tolerance: {
        STRONG: '強い',
        SLIGHTLY_STRONG: 'やや強い',
        NORMAL: '普通',
        SLIGHTLY_WEAK: 'やや弱い',
        WEAK: '弱い',
      },
      shade: {
        AVAILABLE: 'あり',
        UNAVAILABLE: 'なし',
      },
      // 4 段階の視覚記号（◎ / ○ / △ / ×）。
      // 5 段階の値を 4 シンボルに圧縮するため、NORMAL と SLIGHTLY_HARD（または SLIGHTLY_WEAK）
      // が同じ △ になる。記号だけでは区別できないので、UI 側で必ず日本語ラベルを併記する。
      difficultySymbol: {
        EASY: '◎',
        SLIGHTLY_EASY: '○',
        NORMAL: '△',
        SLIGHTLY_HARD: '△',
        HARD: '×',
      },
      toleranceSymbol: {
        STRONG: '◎',
        SLIGHTLY_STRONG: '○',
        NORMAL: '△',
        SLIGHTLY_WEAK: '△',
        WEAK: '×',
      },
      shadeSymbol: {
        AVAILABLE: '○',
        UNAVAILABLE: '×',
      },
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
    generic: {
      title: 'ページを表示できませんでした',
      description: '一時的な問題が発生しました。少し時間を置いてから再度お試しください。',
    },
    bookmarkList: {
      title: 'ブックマーク一覧を読み込めませんでした',
      description: '一時的な問題かもしれません。少し時間を置いてから再度お試しください。',
    },
    reviewList: {
      title: 'レビュー一覧を読み込めませんでした',
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
  // マイページ（/mypage, /mypage/profile）
  // -----------------------------------------------------------------------------------
  mypage: {
    top: {
      metaTitle: 'マイページ',
      eyebrow: 'My page',
      title: 'マイページ',
      description: 'ブックマーク・レビュー・プロフィールをここから管理できます。',
      roleLabels: {
        admin: '管理者',
        user: '一般ユーザー',
      } as Record<string, string>,
      anonymousName: '名前未設定',
      summary: {
        bookmarks: 'ブックマーク',
        reviews: 'レビュー',
        countSuffix: '件',
      },
      menu: {
        bookmarksTitle: 'ブックマーク',
        bookmarksDescription: '保存したスポットの一覧。見頃の時期を逃さずチェック。',
        reviewsTitle: '自分のレビュー',
        reviewsDescription: '訪れたスポットの感想を見直したり、追記できます。',
        profileTitle: 'プロフィール編集',
        profileDescription: 'ユーザー名・アバター画像を変更できます。',
        adminTitle: '管理画面',
        adminDescription: 'スポット・花マスター・ユーザーを管理する管理者専用画面。',
      },
      withdraw: {
        title: '退会する',
        description:
          '退会するとブックマークが見られなくなります。投稿したレビューは「退会済ユーザー」として残ります。',
        confirmCheck: '上記に同意して退会します',
        confirmType: (phrase: string) => `下記の確認テキストに「${phrase}」と入力してください`,
        phrase: 'taikai',
        submit: '退会する',
        cancel: 'キャンセル',
        errors: {
          invalid_input: '確認テキストが一致しません。',
          withdraw_failed: '退会処理に失敗しました。時間を置いて再度お試しください。',
        } as Record<string, string>,
      },
    },
    reviews: {
      metaTitle: '自分のレビュー',
      eyebrow: 'My reviews',
      title: '自分のレビュー',
      description: '投稿したレビューを見直したり、編集・削除ができます。',
      countSuffix: '件',
      visitSpot: 'スポットを開く',
      visitSpotAria: (name: string) => `${name}のスポット詳細を開く`,
      edit: '編集する',
      editAria: (name: string) => `${name}のレビューを編集`,
      delete: '削除する',
      deleteAria: (name: string) => `${name}のレビューを削除`,
      empty: {
        title: 'まだレビューがありません',
        description: 'スポットを訪れた感想を投稿すると、ここから見直せます。',
        cta: 'スポットを探す',
      },
    },
    profile: {
      metaTitle: 'プロフィール編集',
      eyebrow: 'Profile',
      title: 'プロフィール編集',
      description: 'ユーザー名とアバター画像を編集できます。',
      backToMypage: 'マイページへ戻る',
      usernameLabel: 'ユーザー名',
      usernameHint: '3〜30 文字。半角英数・日本語・ハイフン・アンダースコアが使えます。',
      avatarLabel: 'アバター画像',
      avatarHint: '5MB 以下の JPEG / PNG / WebP。アップロードと同時に保存されます。',
      avatarChange: '画像を選ぶ',
      avatarClear: 'アバターを削除',
      avatarUploading: 'アップロード中…',
      avatarRemoving: '削除中…',
      submit: '保存する',
      submitting: '保存中…',
      success: 'プロフィールを更新しました',
      errors: {
        invalid_username: 'ユーザー名は 3〜30 文字で入力してください。',
        username_taken: 'そのユーザー名は既に使われています。',
        invalid_input: '入力内容に誤りがあります。',
        update_failed: 'プロフィールの更新に失敗しました。',
        avatar_invalid_type: 'アップロードできる画像は JPEG / PNG / WebP のみです。',
        avatar_too_large: '画像サイズが大きすぎます（5MB 以下にしてください）。',
        avatar_upload_failed: '画像のアップロードに失敗しました。',
        avatar_remove_failed: 'アバター画像の削除に失敗しました。',
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

  // -----------------------------------------------------------------------------------
  // 管理画面（/admin/*）
  // -----------------------------------------------------------------------------------
  admin: {
    nav: {
      home: 'ホーム',
      spots: 'スポット',
      spotsPending: '公開待ち',
      flowers: '花マスター',
      images: '画像管理',
      users: 'ユーザー',
      reviews: 'レビュー',
      aiUsage: 'AI 利用ログ',
      backToSite: 'サイトに戻る',
      openMenu: 'メニューを開く',
      eyebrow: 'Admin',
    },
    dashboard: {
      metaTitle: '管理画面',
      eyebrow: 'Admin',
      title: '管理ダッシュボード',
      description: '出典確認待ちのスポット・AI 利用状況・レビュー削除をひと目で把握できます。',
      cards: {
        pendingSpots: '公開待ちスポット',
        aiUsageThisMonth: '今月の AI 利用',
        recentDeletedReviews: '直近 7 日の論理削除レビュー',
      },
      countSuffix: '件',
      shortcutsTitle: '管理メニュー',
      shortcuts: {
        spotsTitle: 'スポット一覧',
        spotsDescription: '全スポット（未公開・論理削除含む）の検索・編集・公開切替。',
        spotsPendingTitle: '公開待ちスポット',
        spotsPendingDescription: '出典・公式 URL を確認して公開フラグを立てる。',
        spotsNewTitle: 'スポット新規作成',
        spotsNewDescription: '手動でスポットを追加し、画像と関連花を紐付ける。',
      },
    },
    spots: {
      list: {
        metaTitle: 'スポット管理',
        eyebrow: 'Spots',
        title: 'スポット管理',
        description: '未公開を含む全スポットを管理します。',
        newCta: '新規作成',
        filters: {
          status: '公開状態',
          statusAll: 'すべて',
          statusPublished: '公開中',
          statusUnpublished: '未公開',
          prefecture: '都道府県',
          prefectureAll: 'すべて',
          q: 'キーワード',
          qPlaceholder: '名称・住所で検索',
          apply: '適用',
          reset: 'リセット',
        },
        table: {
          name: '名称',
          prefecture: '都道府県',
          season: '見頃',
          status: '公開',
          updatedAt: '更新',
          actions: '操作',
        },
        statusBadge: {
          published: '公開中',
          unpublished: '未公開',
        },
        actions: {
          edit: '編集',
          publish: '公開する',
          unpublish: '非公開に戻す',
          delete: '削除',
          deleteDialogTitle: 'スポットを削除しますか？',
          deleteDialogDescription:
            '削除すると公開ページから非表示になります。紐づく画像もカスケードで削除されます。',
          deleteDialogConfirm: '削除する',
          deleteDialogCancel: 'キャンセル',
        },
        empty: '該当するスポットがありません。',
      },
      pending: {
        metaTitle: '公開待ちスポット',
        eyebrow: 'Pending',
        title: '公開待ちスポット',
        description: '出典・公式 URL を確認してから公開してください。',
        empty: '公開待ちのスポットはありません。',
        officialUrlLabel: '公式 URL',
        sourceLabel: '出典 (source)',
        previewOfficial: '公式 URL を確認',
        previewSource: '出典を確認',
        publish: '公開する',
        publishConfirm: 'このスポットを公開します。よろしいですか？',
        editLink: '詳細を編集',
        noOfficialUrl: '公式 URL 未登録（source 必須）',
        noSource: '出典未登録',
      },
      new: {
        metaTitle: 'スポット新規作成',
        eyebrow: 'Create',
        title: 'スポットを新規作成',
        description: '基本情報・画像・関連花を入力して保存します。',
        cancel: 'キャンセル',
        submit: '保存して公開待ちにする',
        submitting: '保存中…',
        success: 'スポットを作成しました',
      },
      edit: {
        metaTitle: 'スポット詳細・編集',
        eyebrow: 'Edit',
        backToList: '一覧に戻る',
        publishToggleOn: '公開中',
        publishToggleOff: '未公開',
        publishLabel: '公開フラグ',
        save: '保存する',
        saving: '保存中…',
        savedAt: (iso: string) => `最終更新: ${iso}`,
        success: '保存しました',
      },
      editor: {
        sectionBasics: '基本情報',
        sectionLocation: '所在地・地図',
        sectionSeason: '見頃',
        sectionMeta: '公式 URL / 出典',
        sectionImages: '画像',
        sectionFlowers: '関連花',
        nameLabel: '名称',
        nameKanaLabel: 'よみ',
        descriptionLabel: '説明',
        prefectureLabel: '都道府県',
        locationLabel: '住所',
        latitudeLabel: '緯度',
        longitudeLabel: '経度',
        coordinateHelp: '地図をクリックして緯度経度を設定できます',
        bestSeasonStartLabel: '見頃開始月',
        bestSeasonEndLabel: '見頃終了月',
        accessLabel: 'アクセス',
        parkingLabel: '駐車場',
        feeLabel: '入場料',
        officialUrlLabel: '公式 URL',
        sourceLabel: '出典（official_url が無い場合は必須）',
        imageUrlLabel: '画像 URL',
        imageCaptionLabel: 'キャプション',
        addImage: '画像を追加',
        removeImage: '削除',
        moveUp: '上へ',
        moveDown: '下へ',
        flowerSelectLabel: '花を選択',
        flowerBloomStartLabel: '開花開始月',
        flowerBloomEndLabel: '開花終了月',
        addFlower: '関連花を追加',
        removeFlower: '削除',
        uploadButton: 'アップロード',
        uploading: 'アップロード中…',
        previewAlt: (i: number) => `画像 ${i + 1} のプレビュー`,
        urlOrUploadHint: 'PC から画像をアップロード、または既存の URL を貼り付けてください。',
        errors: {
          name_required: '名称は必須です。',
          prefecture_required: '都道府県を選択してください。',
          location_required: '住所は必須です。',
          coordinates_required: '緯度・経度を指定してください。',
          best_season_invalid: '見頃の月は 1〜12 の範囲で指定してください。',
          source_required: '公式 URL が未登録のスポットには出典（source）を必ず登録してください。',
          image_url_invalid: '画像 URL を正しく入力してください。',
          flower_required: '花を選択してください。',
          bloom_month_invalid: '開花月は 1〜12 の範囲で指定してください。',
          save_failed: '保存に失敗しました。時間を置いて再度お試しください。',
          delete_failed: '削除に失敗しました。',
          publish_failed: '公開状態の更新に失敗しました。',
          upload_invalid_type: 'アップロードできる画像は JPEG / PNG / WebP のみです。',
          upload_too_large: '画像サイズが大きすぎます（5MB 以下にしてください）。',
          upload_failed: '画像のアップロードに失敗しました。',
          no_file: 'ファイルが選択されていません。',
        } as Record<string, string>,
      },
    },
    flowers: {
      list: {
        metaTitle: '花マスター管理',
        eyebrow: 'Flowers',
        title: '花マスター管理',
        description:
          '花の総称・別名・画像を管理します。AI 判定はここに登録された花にマッチします。',
        newCta: '新規作成',
        filters: {
          q: 'キーワード',
          qPlaceholder: '名前・よみ・別名で検索',
          apply: '適用',
          reset: 'リセット',
        },
        table: {
          name: '名前',
          nameKana: 'よみ',
          aliases: '別名',
          season: 'デフォルト見頃',
          spotCount: '関連スポット',
          updatedAt: '更新',
          actions: '操作',
        },
        seasonUnset: '未設定',
        aliasMore: (n: number) => `+${n}`,
        spotCountSuffix: '件',
        empty: '該当する花がありません。',
        actions: {
          edit: '編集',
          delete: '削除',
          deleteDialogTitle: '花を削除しますか？',
          deleteDialogDescription:
            '削除すると公開ページから非表示になります。紐づく画像もカスケードで削除されます。関連スポットの紐付けは残るため、別途編集してください。',
          deleteDialogConfirm: '削除する',
          deleteDialogCancel: 'キャンセル',
        },
      },
      new: {
        metaTitle: '花を新規追加',
        eyebrow: 'Create',
        title: '花を新規追加',
        description: '花の総称・別名・画像を登録します。',
        cancel: 'キャンセル',
        submit: '保存する',
        submitting: '保存中…',
      },
      edit: {
        metaTitle: '花マスター詳細・編集',
        eyebrow: 'Edit',
        backToList: '一覧に戻る',
        save: '保存する',
        saving: '保存中…',
        savedAt: (iso: string) => `最終更新: ${iso}`,
        relatedSpotsTitle: '関連スポット',
        relatedSpotsEyebrow: 'Related',
        relatedSpotsEmpty: 'まだこの花を登録しているスポットはありません。',
        relatedSpotsCount: (n: number) => `${n} 件のスポットで登録されています`,
      },
      editor: {
        sectionBasics: '基本情報',
        sectionSeason: 'デフォルト見頃',
        sectionAliases: '別名・品種',
        sectionImages: '画像',
        nameLabel: '名前',
        nameKanaLabel: 'よみ',
        descriptionLabel: '説明',
        defaultSeasonStartLabel: '見頃開始月',
        defaultSeasonEndLabel: '見頃終了月',
        seasonNoneOption: '未設定',
        aliasLabel: '別名',
        aliasPlaceholder: '例：ソメイヨシノ',
        addAlias: '別名を追加',
        removeAlias: '削除',
        aliasEmpty: 'まだ別名は登録されていません。',
        imageUrlLabel: '画像 URL',
        imageCaptionLabel: 'キャプション',
        addImage: '画像を追加',
        removeImage: '削除',
        moveUp: '上へ',
        moveDown: '下へ',
        uploadButton: 'アップロード',
        uploading: 'アップロード中…',
        previewAlt: (i: number) => `画像 ${i + 1} のプレビュー`,
        urlOrUploadHint: 'PC から画像をアップロード、または既存の URL を貼り付けてください。',
        errors: {
          name_required: '名前は必須です。',
          name_duplicate: '同じ名前の花がすでに登録されています。',
          alias_required: '別名は空白では登録できません。',
          alias_duplicate_in_form: '同じ別名がフォーム内で重複しています。',
          alias_duplicate: '入力された別名はすでに別の花に登録されています。',
          season_pair_required: '見頃の開始月と終了月は両方指定するか両方未設定にしてください。',
          season_invalid: '見頃の月は 1〜12 の範囲で指定してください。',
          image_url_invalid: '画像 URL を正しく入力してください。',
          save_failed: '保存に失敗しました。時間を置いて再度お試しください。',
          delete_failed: '削除に失敗しました。',
          upload_invalid_type: 'アップロードできる画像は JPEG / PNG / WebP のみです。',
          upload_too_large: '画像サイズが大きすぎます（2MB 以下にしてください）。',
          upload_failed: '画像のアップロードに失敗しました。',
          no_file: 'ファイルが選択されていません。',
        } as Record<string, string>,
      },
    },
    images: {
      list: {
        metaTitle: '画像管理',
        eyebrow: 'Images',
        title: '画像管理',
        description:
          '全画像を横断で確認し、不要な画像を論理削除します。並び順は親（スポット／花）の編集画面から変更してください。',
        filters: {
          ownerType: '種別',
          ownerTypeAll: 'すべて',
          ownerTypeSpot: 'スポット',
          ownerTypeFlower: '花',
          apply: '適用',
          reset: 'リセット',
        },
        ownerLabel: {
          spot: 'スポット',
          flower: '花',
        },
        orphanLabel: '親が削除済み',
        orderLabel: (n: number) => `順序 ${n}`,
        delete: '削除',
        deleteConfirm: 'この画像を削除しますか？',
        empty: '画像がありません。',
        pagination: {
          previous: '前へ',
          next: '次へ',
          summary: (start: number, end: number, total: number) => `${start} – ${end} / ${total}`,
        },
        errors: {
          delete_failed: '画像の論理削除に失敗しました。',
        },
      },
    },
    users: {
      list: {
        metaTitle: 'ユーザー管理',
        eyebrow: 'Users',
        title: 'ユーザー管理',
        description:
          'ユーザーのロール変更や BAN（論理削除）を行います。退会済ユーザーもフィルタで表示できます。',
        filters: {
          status: '状態',
          statusAll: 'すべて',
          statusActive: '有効',
          statusWithdrawn: '退会済',
          role: 'ロール',
          roleAll: 'すべて',
          roleUser: '一般',
          roleAdmin: '管理者',
          q: 'キーワード',
          qPlaceholder: 'ユーザー名・メールで検索',
          apply: '適用',
          reset: 'リセット',
        },
        table: {
          username: 'ユーザー名',
          email: 'メール',
          role: 'ロール',
          status: '状態',
          createdAt: '登録',
          actions: '操作',
        },
        roleLabels: {
          user: '一般',
          admin: '管理者',
        } as Record<string, string>,
        statusBadge: {
          active: '有効',
          withdrawn: '退会済',
        },
        anonymousName: '名前未設定',
        empty: '該当するユーザーがありません。',
        actions: {
          view: '詳細',
        },
      },
      detail: {
        metaTitle: 'ユーザー詳細',
        eyebrow: 'User',
        backToList: '一覧に戻る',
        notFound: 'ユーザーが見つかりませんでした。',
        sections: {
          profile: 'プロフィール',
          reviews: 'レビュー履歴',
          bookmarks: 'ブックマーク履歴',
          aiUsage: 'AI 利用履歴',
          dangerZone: '管理アクション',
        },
        profileLabels: {
          id: 'ユーザー ID',
          username: 'ユーザー名',
          email: 'メール',
          role: 'ロール',
          status: '状態',
          createdAt: '登録日時',
          updatedAt: '最終更新',
          deletedAt: '退会日時',
        },
        anonymousName: '名前未設定',
        statusBadge: {
          active: '有効',
          withdrawn: '退会済',
        },
        roleLabels: {
          user: '一般',
          admin: '管理者',
        } as Record<string, string>,
        roleAction: {
          promoteToAdmin: '管理者に昇格',
          demoteToUser: '一般ユーザーに降格',
          confirmPromote: 'このユーザーを管理者に昇格します。よろしいですか？',
          confirmDemote: 'このユーザーを一般ユーザーに降格します。よろしいですか？',
        },
        banAction: {
          ban: 'BAN（論理削除）',
          unban: 'BAN を解除',
          confirmBan:
            'BAN するとログインしてもサイトを利用できなくなります。レビューは「退会済ユーザー」として残ります。よろしいですか？',
          confirmUnban: 'このユーザーの BAN を解除します。よろしいですか？',
        },
        reviewsEmpty: 'レビュー履歴はありません。',
        bookmarksEmpty: 'ブックマーク履歴はありません。',
        aiUsageEmpty: 'AI 利用履歴はありません。',
        aiUsageTotal: (count: number) => `通算 ${count} 件`,
        reviewSoftDeletedBadge: '論理削除',
        bookmarkSoftDeletedBadge: '解除済み',
        viewSpot: 'スポットを開く',
        viewFlower: '花を開く',
        ratingSuffix: (rating: number) => `★ ${rating}`,
        cannotDemoteSelf: '自分自身のロールは変更できません。',
        cannotBanSelf: '自分自身を BAN することはできません。',
      },
      errors: {
        cannot_self_modify: '自分自身のロール変更・BAN はできません。',
        update_failed: '更新に失敗しました。時間を置いて再度お試しください。',
        not_found: 'ユーザーが見つかりません。',
        invalid_input: '入力が不正です。',
      } as Record<string, string>,
    },
    reviews: {
      list: {
        metaTitle: 'レビュー管理',
        eyebrow: 'Reviews',
        title: 'レビュー管理',
        description:
          '全レビュー（論理削除含む）の監視と強制削除を行います。NG ワードを含むレビューは赤いラベルで表示されます。',
        filters: {
          status: '状態',
          statusAll: 'すべて',
          statusActive: '公開中',
          statusDeleted: '論理削除',
          ngOnly: 'NG ワードのみ',
          q: 'キーワード',
          qPlaceholder: 'スポット名・ユーザー名・本文で検索',
          apply: '適用',
          reset: 'リセット',
        },
        table: {
          spot: 'スポット',
          user: 'ユーザー',
          rating: '評価',
          comment: '本文',
          createdAt: '投稿日',
          status: '状態',
          actions: '操作',
        },
        statusBadge: {
          active: '公開中',
          deleted: '論理削除',
        },
        ngBadge: 'NG ワード',
        anonymousName: '退会済ユーザー',
        ratingSuffix: (rating: number) => `★ ${rating}`,
        empty: '該当するレビューがありません。',
        viewSpot: 'スポットを開く',
        delete: '論理削除',
        restore: '復元',
        confirmDelete: 'このレビューを強制的に論理削除します。よろしいですか？',
        confirmRestore: 'このレビューの論理削除を解除します。よろしいですか？',
        errors: {
          delete_failed: 'レビューの削除に失敗しました。',
          not_found: 'レビューが見つかりません。',
          invalid_input: '入力が不正です。',
        } as Record<string, string>,
      },
    },
    aiUsage: {
      metaTitle: 'AI 利用ログ',
      eyebrow: 'AI usage',
      title: 'AI 利用ログ',
      description:
        'Gemini API の呼び出し状況を日別・月別で確認できます。匿名利用と認証済み利用を合算して集計します。',
      summary: {
        last7Days: '直近 7 日',
        last30Days: '直近 30 日',
        thisMonth: '今月',
        totalCost: '推計コスト（今月）',
        anonymous: '匿名',
        authenticated: '認証済み',
        countSuffix: '件',
      },
      costNote: (yenPerCall: number) =>
        `Gemini API は 1 リクエストあたり約 ${yenPerCall.toFixed(2)} 円（為替・モデル差で変動）で算出しています。`,
      daily: {
        heading: '日別利用件数（直近 30 日）',
        date: '日付',
        anonymous: '匿名',
        authenticated: '認証済み',
        total: '合計',
        empty: '直近 30 日に AI 利用はありません。',
      },
      monthly: {
        heading: '月別利用件数（直近 6 か月）',
        month: '月',
        anonymous: '匿名',
        authenticated: '認証済み',
        total: '合計',
      },
      ranking: {
        heading: 'ユーザー別ランキング（直近 30 日）',
        rank: '#',
        user: 'ユーザー',
        count: '利用回数',
        rewardUnlocked: 'しおり生成',
        empty: '直近 30 日に認証済みユーザーの利用はありません。',
        view: '詳細',
        anonymousName: '名前未設定',
      },
      empty: 'AI 利用ログがまだ記録されていません。',
    },
  },
} as const;
