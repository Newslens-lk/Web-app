import type { Locale } from "./config";

/**
 * Interface copy for both languages.
 *
 * Only chrome lives here — headlines, summaries and article bodies come from
 * the pipeline in whatever language the outlet published, and are never
 * rewritten by the language switch.
 *
 * `si` is typed as `typeof en`, so TypeScript fails the build if a key is added
 * to one language and forgotten in the other.
 */
export const en = {
  meta: {
    description:
      "Compare how different Sri Lankan outlets report the same story — bias-aware Sinhala news aggregation.",
  },

  language: {
    // Each language is named in its own language, so a reader who cannot read
    // the current interface can still find their own.
    en: "English",
    si: "සිංහල",
    switcher: "Language",
  },

  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },

  nav: {
    label: "Primary",
    home: "Home",
    sources: "Sources",
    analytics: "Analytics",
    admin: "Admin",
    account: "Account",
    logIn: "Log in",
    logOut: "Log out",
  },

  bias: {
    far_left: "Far Left",
    left: "Left",
    center: "Center",
    right: "Right",
    far_right: "Far Right",
  },

  common: {
    articles: "articles",
    events: "events",
    sources: "sources",
    previous: "Previous",
    next: "Next",
    details: "Details",
    readOriginal: "Read original",
    dateUnknown: "date unknown",
    biasDistribution: "Bias distribution",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  },

  time: {
    recently: "recently",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },

  landing: {
    kicker: "Bias-aware Sinhala news",
    // Two lines: the second is the turn. Kept short because it is set large.
    headlineTop: "One story.",
    headlineBottom: "Five positions.",
    standfirst:
      "Sri Lanka's outlets rarely report the same event the same way. NewsLens puts their coverage side by side and labels where each one leans.",
    // The two buttons reuse nav.home and nav.logIn rather than having their
    // own copy, so the landing never drifts out of step with the masthead.
    liveCounts: (articles: number, events: number, sources: number) =>
      `${articles} articles · ${events} events · ${sources} sources`,
    spectrum: "Far left to far right",
  },

  home: {
    latestEvents: "Latest events",
    totalAndPage: (total: number, page: number) => `${total} total · page ${page}`,
    noEvents: "No events found.",
    noEventsSearch: "No events match your search.",
    eventPages: "Event pages",
    atAGlance: "At a glance",
    searchPlaceholder: "Search events…",
    eventMeta: (articles: number, sources: number, when: string) =>
      `${articles} article${articles !== 1 ? "s" : ""} · ${sources} source${sources !== 1 ? "s" : ""} · ${when}`,
  },

  filters: {
    source: "Source",
    minimumSources: "Minimum sources",
    allSources: "All sources",
    anyCoverage: "Any coverage",
    twoPlusSources: "2+ sources",
    threePlusSources: "3+ sources",
    searchNews: "Search news",
    searchPlaceholder: "Search headlines or article text",
    bias: "Bias",
    allBiasLabels: "All bias labels",
    from: "From",
    to: "To",
    apply: "Apply filters",
    clear: "Clear",
  },

  event: {
    backToEvents: "Back to Events",
    untitled: "Untitled event",
    heading: "Bias Distribution",
    articles: "Articles",
    meta: (articles: number, sources: number, date: string) =>
      `${articles} article${articles !== 1 ? "s" : ""} from ${sources} source${sources !== 1 ? "s" : ""}${date ? ` · ${date}` : ""}`,
    summarize: "Summarize",
    summarizing: "Generating summary…",
    summaryTitle: "AI Summary",
    summaryError: "Failed to generate summary. Please try again.",
  },

  article: {
    backToEvent: "Back to Event",
    published: "Published",
    scraped: "Scraped",
    scoreBreakdown: "Bias Score Breakdown",
    similar: "Similar Articles",
  },

  articles: {
    backToSources: "Back to Sources",
    kicker: "Raw scraped news",
    allArticles: "All articles",
    filtered: (what: string) => `${what} articles`,
    intro: "These are individual articles collected before event clustering.",
    empty: "No raw articles found.",
    pages: "Article pages",
  },

  sources: {
    title: "Sources",
    scraped: "articles scraped",
    latest: "Latest:",
    noneYet: "none yet",
    empty: "No sources found.",
  },

  analytics: {
    title: "Analytics",
    subtitle: "How publishers cover the news",
    description: "Compare predicted bias across publishers. These are model-generated estimates, not authoritative ratings.",
    totalArticles: "Total Articles",
    totalEvents: "Total Events",
    totalSources: "Publishers",
    articlesToday: "Articles Today",
    eventsToday: "Events Today",
    biasDistribution: "Bias Distribution",
    articlesPerSource: "Articles per Source",
    lastRun: "Last pipeline run:",
    periodToday: "Today",
    periodWeek: "This Week",
    periodMonth: "This Month",
    periodAll: "All Time",
    reportingVolume: "Reporting Volume",
    reportingVolumeDesc: "Total articles published by each outlet in this period.",
    biasByPublisher: "Bias by Publisher",
    biasByPublisherDesc: "Predicted bias distribution for each outlet. Percentages are of that outlet's articles.",
    noData: "No articles match this period. Try a wider time range.",
    smallSample: "Small sample",
    articles: "articles",
    dominantBias: "Most common:",
    coverageTimeline: "Coverage Timeline",
    coverageTimelineDesc: "Daily article volume over the selected period.",
    biasTrend: "Bias Trend",
    biasTrendDesc: "How the bias distribution shifts day by day.",
    mostCovered: "Most Covered Stories",
    mostCoveredDesc: "Events with the highest article count in this period.",
    sourcesLabel: "sources",
  },

  auth: {
    adminKicker: "NewsLens administration",
    accountKicker: "NewsLens account",
    adminTitle: "Admin login",
    registerTitle: "Create your account",
    loginTitle: "Welcome back",
    adminIntro: "Sign in with the administrator credentials configured for NewsLens.",
    registerIntro: "Create a regular user account to personalize your NewsLens experience.",
    loginIntro: "Sign in to continue to NewsLens.",
    tabLogin: "Log in",
    tabRegister: "Create account",
    displayName: "Display name",
    email: "Email",
    password: "Password",
    submitting: "Please wait…",
    genericError: "Something went wrong",
    toUserLogin: "Regular user login",
    keepBrowsing: "Continue browsing without an account",
  },

  account: {
    loading: "Loading account…",
    title: "Account",
    loginPrompt: "Please log in to view your account.",
    kicker: "Your account",
    email: "Email:",
    type: "Account type:",
    regularUser: "Regular user",
  },

  admin: {
    checking: "Checking admin access…",
    title: "Admin Panel",
    loginButton: "Admin login",
    loadFailed: "Failed to load pipeline data.",
    triggerFailed: "Failed to trigger pipeline.",
    currentState: "Current Pipeline State",
    noRuns: "No pipeline runs found.",
    tasksComplete: (done: number, total: number) => `${done}/${total} tasks complete`,
    updatedAt: (time: string) => `Updated ${time}`,
    triggering: "Triggering…",
    inProgress: "Pipeline in progress…",
    trigger: "Trigger Pipeline Run",
    recentRuns: "Recent Runs",
    run: "Run",
    state: "State",
    started: "Started",
    ended: "Ended",
    openAirflow: "Open Airflow UI",
    openMinio: "Open MinIO Console",
  },

  widgets: {
    clock: "Digital Clock",
    clockSubtitle: "Updates every second · local time",
    timeFormat: "Time format",
    hour12: "12 hr",
    hour24: "24 hr",
    am: "AM",
    pm: "PM",
    weather: "Weather",
  },

  footer: {
    credit: "NewsLens.lk — a research prototype by Group 17, University of Moratuwa",
    caveat: "Not an authoritative rating of any news organisation.",
  },

  disclaimer: {
    lead: "Bias labels are model predictions,",
    rest: "not verified facts. They are generated automatically and should not be treated as authoritative assessments of any news organisation.",
  },
};

export type Dictionary = typeof en;

export const si: Dictionary = {
  meta: {
    description:
      "එකම පුවත ශ්‍රී ලංකාවේ විවිධ මාධ්‍ය ආයතන වාර්තා කරන ආකාරය සසඳා බලන්න — නැඹුරුව හඳුනාගන්නා සිංහල ප්‍රවෘත්ති එකතුව.",
  },

  language: {
    en: "English",
    si: "සිංහල",
    switcher: "භාෂාව",
  },

  theme: {
    toLight: "ආලෝකමත් තේමාවට මාරු වන්න",
    toDark: "අඳුරු තේමාවට මාරු වන්න",
  },

  nav: {
    label: "ප්‍රධාන",
    home: "මුල් පිටුව",
    sources: "මාධ්‍ය ආයතන",
    analytics: "විශ්ලේෂණ",
    admin: "පරිපාලක",
    account: "ගිණුම",
    logIn: "පිවිසෙන්න",
    logOut: "ඉවත් වන්න",
  },

  bias: {
    far_left: "අන්ත වාමාංශික",
    left: "වාමාංශික",
    center: "මධ්‍යස්ථ",
    right: "දක්ෂිණාංශික",
    far_right: "අන්ත දක්ෂිණාංශික",
  },

  common: {
    articles: "ලිපි",
    events: "සිදුවීම්",
    sources: "මාධ්‍ය ආයතන",
    previous: "පෙර",
    next: "ඊළඟ",
    details: "විස්තර",
    readOriginal: "මුල් ලිපිය කියවන්න",
    dateUnknown: "දිනය නොදනී",
    biasDistribution: "නැඹුරුව බෙදී ඇති ආකාරය",
    pageOf: (page: number, total: number) => `පිටුව ${page} / ${total}`,
  },

  time: {
    recently: "මෑතකදී",
    // Sinhala counts as "මිනිත්තු 5කට පෙර" — the numeral precedes the suffix,
    // so these are not a simple prefix swap of the English strings.
    minutesAgo: (n: number) => `මිනිත්තු ${n}කට පෙර`,
    hoursAgo: (n: number) => `පැය ${n}කට පෙර`,
    daysAgo: (n: number) => `දින ${n}කට පෙර`,
  },

  landing: {
    kicker: "නැඹුරුව හඳුනාගන්නා සිංහල ප්‍රවෘත්ති",
    headlineTop: "එක් පුවතක්.",
    headlineBottom: "දෘෂ්ටිකෝණ පහක්.",
    standfirst:
      "ශ්‍රී ලංකාවේ මාධ්‍ය ආයතන එකම සිදුවීම එකම ආකාරයෙන් වාර්තා කරන්නේ කලාතුරකිනි. NewsLens ඒවායේ වාර්තා එකට තබා, එක් එක් ආයතනය නැඹුරු වන දිශාව පෙන්වයි.",
    liveCounts: (articles: number, events: number, sources: number) =>
      `ලිපි ${articles} · සිදුවීම් ${events} · ආයතන ${sources}`,
    spectrum: "අන්ත වාමාංශිකයේ සිට අන්ත දක්ෂිණාංශික දක්වා",
  },

  home: {
    latestEvents: "නවතම සිදුවීම්",
    totalAndPage: (total: number, page: number) => `මුළු ${total} · පිටුව ${page}`,
    noEvents: "සිදුවීම් හමු නොවීය.",
    noEventsSearch: "ඔබේ සෙවීමට ගැළපෙන සිදුවීම් නැත.",
    eventPages: "සිදුවීම් පිටු",
    atAGlance: "කෙටි විස්තර",
    searchPlaceholder: "සිදුවීම් සොයන්න…",
    eventMeta: (articles: number, sources: number, when: string) =>
      `ලිපි ${articles} · ආයතන ${sources} · ${when}`,
  },

  filters: {
    source: "මාධ්‍ය ආයතනය",
    minimumSources: "අවම ආයතන ගණන",
    allSources: "සියලු ආයතන",
    anyCoverage: "ඕනෑම ආවරණයක්",
    twoPlusSources: "ආයතන 2ක් හෝ වැඩි",
    threePlusSources: "ආයතන 3ක් හෝ වැඩි",
    searchNews: "ප්‍රවෘත්ති සොයන්න",
    searchPlaceholder: "සිරස්තල හෝ ලිපියේ අන්තර්ගතය සොයන්න",
    bias: "නැඹුරුව",
    allBiasLabels: "සියලු නැඹුරු ලේබල",
    from: "සිට",
    to: "දක්වා",
    apply: "පෙරහන් යොදන්න",
    clear: "ඉවත් කරන්න",
  },

  event: {
    backToEvents: "සිදුවීම් වෙත ආපසු",
    untitled: "නමක් නැති සිදුවීම",
    heading: "නැඹුරුව බෙදී ඇති ආකාරය",
    articles: "ලිපි",
    meta: (articles: number, sources: number, date: string) =>
      `ආයතන ${sources}ක් වෙතින් ලිපි ${articles}ක්${date ? ` · ${date}` : ""}`,
    summarize: "සාරාංශ කරන්න",
    summarizing: "සාරාංශය ජනනය වෙමින්…",
    summaryTitle: "AI සාරාංශය",
    summaryError: "සාරාංශය ජනනය කිරීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
  },

  article: {
    backToEvent: "සිදුවීම වෙත ආපසු",
    published: "පළ කළේ",
    scraped: "ලබාගත්තේ",
    scoreBreakdown: "නැඹුරු ලකුණු විස්තරය",
    similar: "සමාන ලිපි",
  },

  articles: {
    backToSources: "මාධ්‍ය ආයතන වෙත ආපසු",
    kicker: "රැස් කළ අමු ප්‍රවෘත්ති",
    allArticles: "සියලු ලිපි",
    filtered: (what: string) => `${what} ලිපි`,
    intro: "මේවා සිදුවීම් වශයෙන් කාණ්ඩගත කිරීමට පෙර රැස් කරන ලද තනි ලිපි වේ.",
    empty: "අමු ලිපි හමු නොවීය.",
    pages: "ලිපි පිටු",
  },

  sources: {
    title: "මාධ්‍ය ආයතන",
    scraped: "ලිපි රැස් කර ඇත",
    latest: "අවසන් වරට:",
    noneYet: "තවම නැත",
    empty: "මාධ්‍ය ආයතන හමු නොවීය.",
  },

  analytics: {
    title: "විශ්ලේෂණ",
    subtitle: "ප්‍රකාශකයින් ප්‍රවෘත්ති ආවරණය කරන ආකාරය",
    description: "ප්‍රකාශකයින් හරහා පුරෝකථනය කළ නැඹුරුව සසඳන්න. මේවා ආකෘතියක් මඟින් ජනනය කළ ඇස්තමේන්තු මිස බලයලත් ඇගයීම් නොවේ.",
    totalArticles: "මුළු ලිපි",
    totalEvents: "මුළු සිදුවීම්",
    totalSources: "ප්‍රකාශකයින්",
    articlesToday: "අද ලිපි",
    eventsToday: "අද සිදුවීම්",
    biasDistribution: "නැඹුරුව බෙදී ඇති ආකාරය",
    articlesPerSource: "ආයතනය අනුව ලිපි",
    lastRun: "අවසන් පයිප්ලයින් ධාවනය:",
    periodToday: "අද",
    periodWeek: "මෙම සතිය",
    periodMonth: "මෙම මාසය",
    periodAll: "සියල්ල",
    reportingVolume: "වාර්තාකරණ පරිමාව",
    reportingVolumeDesc: "මෙම කාලපරිච්ඡේදයේ එක් එක් ආයතනය ප්‍රකාශ කළ මුළු ලිපි ගණන.",
    biasByPublisher: "ප්‍රකාශකයා අනුව නැඹුරුව",
    biasByPublisherDesc: "එක් එක් ආයතනයේ පුරෝකථනය කළ නැඹුරු බෙදීම. ප්‍රතිශතය එම ආයතනයේ ලිපි වලිනි.",
    noData: "මෙම කාලපරිච්ඡේදයට ගැළපෙන ලිපි නැත. පුළුල් කාල පරාසයක් උත්සාහ කරන්න.",
    smallSample: "කුඩා සාම්පලය",
    articles: "ලිපි",
    dominantBias: "වඩාත් පොදු:",
    coverageTimeline: "ආවරණ කාලරේඛාව",
    coverageTimelineDesc: "තෝරාගත් කාලපරිච්ඡේදය තුළ දෛනික ලිපි පරිමාව.",
    biasTrend: "නැඹුරු ප්‍රවණතාව",
    biasTrendDesc: "නැඹුරු බෙදීම දිනෙන් දින වෙනස් වන ආකාරය.",
    mostCovered: "වැඩිපුරම ආවරණය වූ පුවත්",
    mostCoveredDesc: "මෙම කාලපරිච්ඡේදයේ වැඩිම ලිපි සංඛ්‍යාව සහිත සිදුවීම්.",
    sourcesLabel: "ආයතන",
  },

  auth: {
    adminKicker: "NewsLens පරිපාලනය",
    accountKicker: "NewsLens ගිණුම",
    adminTitle: "පරිපාලක පිවිසුම",
    registerTitle: "ඔබේ ගිණුම සාදන්න",
    loginTitle: "නැවත සාදරයෙන් පිළිගනිමු",
    adminIntro: "NewsLens සඳහා සකසා ඇති පරිපාලක තොරතුරු යොදා පිවිසෙන්න.",
    registerIntro: "ඔබේ NewsLens අත්දැකීම පෞද්ගලීකරණය කර ගැනීමට සාමාන්‍ය ගිණුමක් සාදන්න.",
    loginIntro: "NewsLens වෙත යාමට පිවිසෙන්න.",
    tabLogin: "පිවිසෙන්න",
    tabRegister: "ගිණුමක් සාදන්න",
    displayName: "ප්‍රදර්ශන නාමය",
    email: "විද්‍යුත් තැපෑල",
    password: "මුරපදය",
    submitting: "රැඳී සිටින්න…",
    genericError: "යමක් වැරදී ඇත",
    toUserLogin: "සාමාන්‍ය පරිශීලක පිවිසුම",
    keepBrowsing: "ගිණුමකින් තොරව පිරික්සීම කරගෙන යන්න",
  },

  account: {
    loading: "ගිණුම පූරණය වෙමින්…",
    title: "ගිණුම",
    loginPrompt: "ඔබේ ගිණුම බැලීමට පිවිසෙන්න.",
    kicker: "ඔබේ ගිණුම",
    email: "විද්‍යුත් තැපෑල:",
    type: "ගිණුම් වර්ගය:",
    regularUser: "සාමාන්‍ය පරිශීලක",
  },

  admin: {
    checking: "පරිපාලක ප්‍රවේශය පරීක්ෂා කරමින්…",
    title: "පරිපාලක පුවරුව",
    loginButton: "පරිපාලක පිවිසුම",
    loadFailed: "පයිප්ලයින් දත්ත ලබා ගැනීමට නොහැකි විය.",
    triggerFailed: "පයිප්ලයින් ආරම්භ කිරීමට නොහැකි විය.",
    currentState: "වත්මන් පයිප්ලයින් තත්ත්වය",
    noRuns: "පයිප්ලයින් ධාවන හමු නොවීය.",
    tasksComplete: (done: number, total: number) => `කාර්ය ${done}/${total}ක් අවසන්`,
    updatedAt: (time: string) => `යාවත්කාලීන කළේ ${time}`,
    triggering: "ආරම්භ කරමින්…",
    inProgress: "පයිප්ලයින් ක්‍රියාත්මක වෙමින්…",
    trigger: "පයිප්ලයින් ධාවනයක් අරඹන්න",
    recentRuns: "මෑත ධාවන",
    run: "ධාවනය",
    state: "තත්ත්වය",
    started: "ආරම්භය",
    ended: "අවසානය",
    openAirflow: "Airflow UI විවෘත කරන්න",
    openMinio: "MinIO Console විවෘත කරන්න",
  },

  widgets: {
    clock: "ඩිජිටල් ඔරලෝසුව",
    clockSubtitle: "තත්පරයකට වරක් යාවත්කාලීන වේ · ප්‍රාදේශීය වේලාව",
    timeFormat: "වේලා ආකෘතිය",
    hour12: "පැය 12",
    hour24: "පැය 24",
    am: "පෙ.ව.",
    pm: "ප.ව.",
    weather: "කාලගුණය",
  },

  footer: {
    credit: "NewsLens.lk — මොරටුව විශ්ව විද්‍යාලයේ 17 වන කණ්ඩායමේ පර්යේෂණ මූලාකෘතියකි",
    caveat: "කිසිදු ප්‍රවෘත්ති ආයතනයක් පිළිබඳ බලයලත් ඇගයීමක් නොවේ.",
  },

  disclaimer: {
    lead: "නැඹුරු ලේබල යනු ආකෘතියක පුරෝකථන මිස,",
    rest: "තහවුරු කළ කරුණු නොවේ. ඒවා ස්වයංක්‍රීයව ජනනය වන අතර, කිසිදු ප්‍රවෘත්ති ආයතනයක් පිළිබඳ බලයලත් ඇගයීමක් ලෙස නොසැලකිය යුතුය.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, si };
