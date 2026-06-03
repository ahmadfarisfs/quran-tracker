// ════════════════════════════════════════════════════════════════
// QURAN DATA  [num, arabic, english, totalAyat, startPage]
// ════════════════════════════════════════════════════════════════
export const TOTAL_PAGES = 604;

export const SURAHS = [
  [1,"الفاتحة","Al-Fatihah",7,1],
  [2,"البقرة","Al-Baqarah",286,2],
  [3,"آل عمران","Ali 'Imran",200,50],
  [4,"النساء","An-Nisa'",176,77],
  [5,"المائدة","Al-Ma'idah",120,106],
  [6,"الأنعام","Al-An'am",165,128],
  [7,"الأعراف","Al-A'raf",206,151],
  [8,"الأنفال","Al-Anfal",75,177],
  [9,"التوبة","At-Tawbah",129,187],
  [10,"يونس","Yunus",109,208],
  [11,"هود","Hud",123,221],
  [12,"يوسف","Yusuf",111,235],
  [13,"الرعد","Ar-Ra'd",43,249],
  [14,"إبراهيم","Ibrahim",52,255],
  [15,"الحجر","Al-Hijr",99,262],
  [16,"النحل","An-Nahl",128,267],
  [17,"الإسراء","Al-Isra'",111,282],
  [18,"الكهف","Al-Kahf",110,293],
  [19,"مريم","Maryam",98,305],
  [20,"طه","Ta-Ha",135,312],
  [21,"الأنبياء","Al-Anbiya'",112,322],
  [22,"الحج","Al-Hajj",78,332],
  [23,"المؤمنون","Al-Mu'minun",118,342],
  [24,"النور","An-Nur",64,350],
  [25,"الفرقان","Al-Furqan",77,359],
  [26,"الشعراء","Ash-Shu'ara'",227,367],
  [27,"النمل","An-Naml",93,377],
  [28,"القصص","Al-Qasas",88,385],
  [29,"العنكبوت","Al-'Ankabut",69,396],
  [30,"الروم","Ar-Rum",60,404],
  [31,"لقمان","Luqman",34,411],
  [32,"السجدة","As-Sajdah",30,415],
  [33,"الأحزاب","Al-Ahzab",73,418],
  [34,"سبأ","Saba'",54,428],
  [35,"فاطر","Fatir",45,434],
  [36,"يس","Ya-Sin",83,440],
  [37,"الصافات","As-Saffat",182,446],
  [38,"ص","Sad",88,453],
  [39,"الزمر","Az-Zumar",75,458],
  [40,"غافر","Ghafir",85,467],
  [41,"فصلت","Fussilat",54,477],
  [42,"الشورى","Ash-Shura",53,483],
  [43,"الزخرف","Az-Zukhruf",89,489],
  [44,"الدخان","Ad-Dukhan",59,496],
  [45,"الجاثية","Al-Jathiyah",37,499],
  [46,"الأحقاف","Al-Ahqaf",35,502],
  [47,"محمد","Muhammad",38,507],
  [48,"الفتح","Al-Fath",29,511],
  [49,"الحجرات","Al-Hujurat",18,515],
  [50,"ق","Qaf",45,518],
  [51,"الذاريات","Adh-Dhariyat",60,520],
  [52,"الطور","At-Tur",49,523],
  [53,"النجم","An-Najm",62,526],
  [54,"القمر","Al-Qamar",55,528],
  [55,"الرحمن","Ar-Rahman",78,531],
  [56,"الواقعة","Al-Waqi'ah",96,534],
  [57,"الحديد","Al-Hadid",29,537],
  [58,"المجادلة","Al-Mujadilah",22,542],
  [59,"الحشر","Al-Hashr",24,545],
  [60,"الممتحنة","Al-Mumtahanah",13,549],
  [61,"الصف","As-Saf",14,551],
  [62,"الجمعة","Al-Jumu'ah",11,553],
  [63,"المنافقون","Al-Munafiqun",11,554],
  [64,"التغابن","At-Taghabun",18,556],
  [65,"الطلاق","At-Talaq",12,558],
  [66,"التحريم","At-Tahrim",12,560],
  [67,"الملك","Al-Mulk",30,562],
  [68,"القلم","Al-Qalam",52,564],
  [69,"الحاقة","Al-Haqqah",52,566],
  [70,"المعارج","Al-Ma'arij",44,568],
  [71,"نوح","Nuh",28,570],
  [72,"الجن","Al-Jinn",28,572],
  [73,"المزمل","Al-Muzzammil",20,574],
  [74,"المدثر","Al-Muddaththir",56,575],
  [75,"القيامة","Al-Qiyamah",40,577],
  [76,"الإنسان","Al-Insan",31,578],
  [77,"المرسلات","Al-Mursalat",50,580],
  [78,"النبأ","An-Naba'",40,582],
  [79,"النازعات","An-Nazi'at",46,583],
  [80,"عبس","'Abasa",42,585],
  [81,"التكوير","At-Takwir",29,586],
  [82,"الانفطار","Al-Infitar",19,587],
  [83,"المطففين","Al-Mutaffifin",36,587],
  [84,"الانشقاق","Al-Inshiqaq",25,589],
  [85,"البروج","Al-Buruj",22,590],
  [86,"الطارق","At-Tariq",17,591],
  [87,"الأعلى","Al-A'la",19,591],
  [88,"الغاشية","Al-Ghashiyah",26,592],
  [89,"الفجر","Al-Fajr",30,593],
  [90,"البلد","Al-Balad",20,594],
  [91,"الشمس","Ash-Shams",15,595],
  [92,"الليل","Al-Layl",21,595],
  [93,"الضحى","Ad-Duha",11,596],
  [94,"الشرح","Ash-Sharh",8,596],
  [95,"التين","At-Tin",8,597],
  [96,"العلق","Al-'Alaq",19,597],
  [97,"القدر","Al-Qadr",5,598],
  [98,"البينة","Al-Bayyinah",8,598],
  [99,"الزلزلة","Az-Zalzalah",8,599],
  [100,"العاديات","Al-'Adiyat",11,599],
  [101,"القارعة","Al-Qari'ah",11,600],
  [102,"التكاثر","At-Takathur",8,600],
  [103,"العصر","Al-'Asr",3,601],
  [104,"الهمزة","Al-Humazah",9,601],
  [105,"الفيل","Al-Fil",5,601],
  [106,"قريش","Quraysh",4,602],
  [107,"الماعون","Al-Ma'un",7,602],
  [108,"الكوثر","Al-Kawthar",3,602],
  [109,"الكافرون","Al-Kafirun",6,603],
  [110,"النصر","An-Nasr",3,603],
  [111,"المسد","Al-Masad",5,603],
  [112,"الإخلاص","Al-Ikhlas",4,604],
  [113,"الفلق","Al-Falaq",5,604],
  [114,"الناس","An-Nas",6,604]
];

// PAGE_MAP[i] = [surahNum, firstAyatOnPage] for page (i+1), 0-indexed.
// Each surah's ayat are distributed proportionally across its page range.
// When multiple surahs share a page, the earliest surah on that page wins.
export const PAGE_MAP = (() => {
  const map = new Array(TOTAL_PAGES);
  for (let si = 0; si < SURAHS.length; si++) {
    const s = SURAHS[si];
    const startPg = s[4];
    let nextPg = TOTAL_PAGES + 1;
    for (let j = si + 1; j < SURAHS.length; j++) {
      if (SURAHS[j][4] > startPg) { nextPg = SURAHS[j][4]; break; }
    }
    const numPgs = nextPg - startPg;
    for (let pg = startPg; pg < nextPg; pg++) {
      if (map[pg - 1]) continue; // first surah on a shared page wins
      const pgInSurah = pg - startPg;
      const ayat = Math.max(1, Math.min(s[3], Math.floor((pgInSurah / numPgs) * s[3]) + 1));
      map[pg - 1] = [s[0], ayat];
    }
  }
  return map;
})();

export const PRAYERS    = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
export const PRAYERS_AR = ['الفجر','الظهر','العصر','المغرب','العشاء'];
export const PRAYER_ICO = ['🌙','☀️','🌤️','🌅','⭐'];
