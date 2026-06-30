/**
 * adController.js
 * Active Directory management controller — uztmk.local
 * Strategy: Try real LDAP → fallback to local SQLite DB
 */

const prisma = require('../services/db');
const ldap   = require('../services/ldapService');
const bcrypt = require('bcryptjs');

// ─── Seed Data ───────────────────────────────────────────────────────────────
// Real uztmk.local department structure with 10-20 employees each
const OU_SEED = [
  {
    name: 'Ecosystem', displayName: 'Ecosystem (IT)', icon: '🖥️',
    parent: 'Офис Управления', description: 'IT va Ecosystem bo\'limi', sortOrder: 1,
    users: [
      { fullName: 'Санжар Мирзаев',       adLogin: 'sanjar.mirzaev',       position: 'IT Administrator' },
      { fullName: 'Дилшод Юсупов',        adLogin: 'dilshod.yusupov',       position: 'System Engineer' },
      { fullName: 'Бехзод Рахматов',      adLogin: 'behzod.rahmatov',       position: 'Network Engineer' },
      { fullName: 'Умид Хасанов',         adLogin: 'umid.hasanov',          position: 'DevOps Engineer' },
      { fullName: 'Жасур Каримов',        adLogin: 'jasur.karimov',         position: 'Software Developer' },
      { fullName: 'Шахло Назарова',       adLogin: 'shahlo.nazarova',       position: 'UI/UX Designer' },
      { fullName: 'Нодир Турсунов',       adLogin: 'nodir.tursunov',        position: 'Database Admin' },
      { fullName: 'Феруза Алиева',        adLogin: 'feruza.alieva',         position: 'IT Support' },
      { fullName: 'Отабек Хусанов',       adLogin: 'otabek.husanov',        position: 'Cybersecurity Analyst' },
      { fullName: 'Зулфия Рашидова',      adLogin: 'zulfiya.rashidova',     position: 'Project Manager' },
      { fullName: 'Камол Сайидов',        adLogin: 'kamol.sayidov',         position: 'System Admin' },
      { fullName: 'Малика Тошматова',     adLogin: 'malika.toshmatova',     position: 'Data Analyst' },
    ],
    computers: ['ECO-PC-01','ECO-PC-02','ECO-PC-03','ECO-SRV-01','ECO-PC-04'],
  },
  {
    name: 'ESG', displayName: 'ESG', icon: '🌱',
    parent: 'Офис Управления', description: 'Ekologiya va barqarorlik', sortOrder: 2,
    users: [
      { fullName: 'Азиза Камалова',       adLogin: 'aziza.kamalova',        position: 'ESG Manager' },
      { fullName: 'Тимур Эргашев',        adLogin: 'timur.ergashev',        position: 'Environmental Analyst' },
      { fullName: 'Нилуфар Исмоилова',    adLogin: 'nilufar.ismoilova',     position: 'Sustainability Officer' },
      { fullName: 'Хуршид Норов',         adLogin: 'khurshid.norov',        position: 'ESG Specialist' },
      { fullName: 'Гулноза Абдуллаева',   adLogin: 'gulnoza.abdullaeva',    position: 'Report Analyst' },
      { fullName: 'Раббони Холматов',     adLogin: 'rabboni.holmatov',      position: 'ESG Coordinator' },
      { fullName: 'Севинч Мамаева',       adLogin: 'sevinch.mamaeva',       position: 'Data Officer' },
      { fullName: 'Бобур Давлатов',       adLogin: 'bobur.davlatov',        position: 'ESG Analyst' },
      { fullName: 'Фотима Холикова',      adLogin: 'fotima.holikova',       position: 'Documentation Specialist' },
      { fullName: 'Элмурод Насиров',      adLogin: 'elmurod.nasirov',       position: 'Field Inspector' },
    ],
    computers: ['ESG-PC-01','ESG-PC-02','ESG-PC-03','ESG-PC-04'],
  },
  {
    name: 'Geologiya', displayName: 'Geologiya', icon: '🏔️',
    parent: 'Офис Управления', description: 'Geologiya bo\'limi', sortOrder: 3,
    users: [
      { fullName: 'Собир Рахимов',        adLogin: 'sobir.rahimov',         position: 'Bosh Geolog' },
      { fullName: 'Алишер Мансуров',      adLogin: 'alisher.mansurov',      position: 'Geolog' },
      { fullName: 'Анвар Жиянов',         adLogin: 'anvar.zhiyanov',        position: 'Kichik Geolog' },
      { fullName: 'Анвар Сатторов',       adLogin: 'anvar.sattorov',        position: 'Geolog' },
      { fullName: 'Бобиржон Ашуров',      adLogin: 'bobirjon.ashurov',      position: 'Geolog-Tahlilchi' },
      { fullName: 'Дониёр Фозилов',       adLogin: 'doniyar.fazilov',       position: 'Laboratoriya Mudiri' },
      { fullName: 'Жахонгир Рахмонов',    adLogin: 'jahongir.rahmonov',     position: 'Geolog' },
      { fullName: 'Зокир Хайдаров',       adLogin: 'zokir.haydarov',        position: 'GIS Mutaxassisi' },
      { fullName: 'Мансуржон Норматов',   adLogin: 'mansurjon.normatov',    position: 'Geolog' },
      { fullName: 'Мирзоферуз Нигматов',  adLogin: 'mirzaferuz.nigmatov',   position: 'Tadqiqotchi' },
      { fullName: 'Музаффар Хакимов',     adLogin: 'muzaffar.hakimov',      position: 'Geolog' },
      { fullName: 'Нормухамедов Афзал',   adLogin: 'normuhamed.afzal',      position: 'Kichik Geolog' },
      { fullName: 'Рахматов Хает',        adLogin: 'rahmatov.hayet',        position: 'Geolog' },
      { fullName: 'Санжаржон Рашиджонов', adLogin: 'sanjarjon.rashidjonov', position: 'Geolog' },
      { fullName: 'Сардор Розукулов',     adLogin: 'sardor.rozukulov',      position: 'Geolog-Asistan' },
      { fullName: 'Сардор Рузукулов',     adLogin: 'sardor.ruzukulov',      position: 'Geolog' },
      { fullName: 'Собиржон Рахимов',     adLogin: 'sobirjon.rahimov',      position: 'Kichik Geolog' },
      { fullName: 'Суюн Худойбердиев',    adLogin: 'suyun.hudoyberdiev',    position: 'Geolog' },
      { fullName: 'Умида Алиева',         adLogin: 'umida.alieva',          position: 'Laborant' },
      { fullName: 'Хуснидди Мухиддинов',  adLogin: 'husnidin.muhiddinov',   position: 'Geolog' },
      { fullName: 'Шерзод Тореханом',     adLogin: 'sherzod.torehanov',     position: 'Geolog' },
      { fullName: 'Элшод Кутлиев',        adLogin: 'elshod.kutliev',        position: 'Kichik Geolog' },
      { fullName: 'Эркин Хаккулов',       adLogin: 'erkin.hakkulov',        position: 'Geolog' },
    ],
    computers: ['GEO-PC-01','GEO-PC-02','GEO-PC-03','GEO-PC-04','GEO-PC-05'],
  },
  {
    name: 'Gidro_Piro', displayName: 'Gidro Piro', icon: '💧',
    parent: 'Офис Управления', description: 'Gidropirotexnika bo\'limi', sortOrder: 4,
    users: [
      { fullName: 'Акбар Маматов',        adLogin: 'akbar.mamatov',         position: 'Bosh Muhandis' },
      { fullName: 'Зафар Юлдашев',        adLogin: 'zafar.yuldashev',       position: 'Gidrogeolog' },
      { fullName: 'Барно Садикова',       adLogin: 'barno.sadikova',        position: 'Muhandis' },
      { fullName: 'Ихтиёр Норматов',      adLogin: 'ihtiyar.normatov',      position: 'Texnik' },
      { fullName: 'Лола Хошимова',        adLogin: 'lola.hashimova',        position: 'Laborant' },
      { fullName: 'Мурод Бекмуродов',     adLogin: 'murod.bekmurodov',      position: 'Muhandis' },
      { fullName: 'Насиба Рустамова',     adLogin: 'nasiba.rustamova',      position: 'Muhandis-Texnolog' },
      { fullName: 'Отабек Хусанов',       adLogin: 'otabek.husanov2',       position: 'Pyrotexnik' },
      { fullName: 'Рустам Облоқулов',     adLogin: 'rustam.oblokulov',      position: 'Muhandis' },
      { fullName: 'Санжар Авлиёев',       adLogin: 'sanjar.avliyoev',       position: 'Bosh Texnik' },
      { fullName: 'Тошпо\'лат Сайфуллаев',adLogin: 'toshpolat.sayfullayev', position: 'Muhandis' },
      { fullName: 'Феруза Каримова',      adLogin: 'feruza.karimova2',      position: 'Tahlilchi' },
    ],
    computers: ['HYDRO-PC-01','HYDRO-PC-02','HYDRO-PC-03'],
  },
  {
    name: 'Gidrometallurg', displayName: 'Gidrometallurgiya', icon: '⚗️',
    parent: 'Офис Управления', description: 'Gidrometallurgiya bo\'limi', sortOrder: 5,
    users: [
      { fullName: 'Алексей Петров',       adLogin: 'aleksey.petrov',        position: 'Bosh Metallurg' },
      { fullName: 'Дилрабо Эрматова',     adLogin: 'dilrabo.ermatova',      position: 'Metallurg-Muhandis' },
      { fullName: 'Ёқубжон Ҳасанов',     adLogin: 'yoqubjon.hasanov',      position: 'Kimyogar' },
      { fullName: 'Зилола Хамроева',      adLogin: 'zilola.hamroeva',       position: 'Laborant' },
      { fullName: 'Иброхим Рустамов',     adLogin: 'ibrohim.rustamov',      position: 'Texnolog' },
      { fullName: 'Камила Мирсолиева',    adLogin: 'kamila.mirsoliyeva',    position: 'Metallurg' },
      { fullName: 'Лазиз Холматов',       adLogin: 'laziz.holmatov',        position: 'Muhandis' },
      { fullName: 'Муҳаммад Собиров',     adLogin: 'muhammad.sobirov',      position: 'Metallurg' },
      { fullName: 'Нодирбек Тошев',       adLogin: 'nodirbeк.toshev',       position: 'Kimyo Muhandisi' },
      { fullName: 'Озода Исмоилова',      adLogin: 'ozoda.ismoilova',       position: 'Laborant' },
      { fullName: 'Поло Рашидов',         adLogin: 'polo.rashidov',         position: 'Bosh Texnik' },
      { fullName: 'Рустам Тошматов',      adLogin: 'rustam.toshmatov',      position: 'Metallurg-Texnolog' },
      { fullName: 'Сарвар Ибрагимов',     adLogin: 'sarvar.ibragimov',      position: 'Muhandis-Tahlilchi' },
    ],
    computers: ['MET-PC-01','MET-PC-02','MET-PC-03','MET-PC-04'],
  },
  {
    name: 'HR', displayName: 'HR (Kadrlar)', icon: '👥',
    parent: 'Офис Управления', description: 'Kadrlar bo\'limi', sortOrder: 6,
    users: [
      { fullName: 'Дилноза Юсупова',      adLogin: 'dilnoza.yusupova',      position: 'HR Manager' },
      { fullName: 'Барчинмой Назарова',   adLogin: 'barchinmoy.nazarova',   position: 'HR Specialist' },
      { fullName: 'Гулноза Ҳакимова',    adLogin: 'gulnoza.hakimova',       position: 'Recruiter' },
      { fullName: 'Диёра Маматова',       adLogin: 'diyora.mamatova',       position: 'HR Officer' },
      { fullName: 'Зарина Сулаймонова',   adLogin: 'zarina.sulaymanova',    position: 'HR Specialist' },
      { fullName: 'Камола Расулова',      adLogin: 'kamola.rasulova',       position: 'Training Manager' },
      { fullName: 'Маноат Хошимова',     adLogin: 'manoat.hashimova',      position: 'HR Analyst' },
      { fullName: 'Нилуфар Тоштемирова', adLogin: 'nilufar.toshtemirov',   position: 'HR Coordinator' },
      { fullName: 'Озода Абдуллаева',    adLogin: 'ozoda.abdullayeva',     position: 'Payroll Specialist' },
      { fullName: 'Раъно Холматова',     adLogin: 'rano.holmatova',        position: 'HR Generalist' },
      { fullName: 'Санобар Каримова',    adLogin: 'sanobar.karimova',      position: 'Benefits Coordinator' },
    ],
    computers: ['HR-PC-01','HR-PC-02','HR-PC-03'],
  },
  {
    name: 'Kelajak_metallari', displayName: 'Kelajak Metallari', icon: '🔮',
    parent: 'Офис Управления', description: 'Kelajak metallari bo\'limi', sortOrder: 7,
    users: [
      { fullName: 'Акмал Назаров',        adLogin: 'akmal.nazarov',         position: 'Tadqiqotchi' },
      { fullName: 'Ботир Эшматов',        adLogin: 'botir.eshmatov',        position: 'Muhandis-Innovator' },
      { fullName: 'Вохид Мирзаев',        adLogin: 'vohid.mirzaev',         position: 'R&D Specialist' },
      { fullName: 'Гулноза Раҳимова',    adLogin: 'gulnoza.rahimova',      position: 'Laborant' },
      { fullName: 'Даврон Тоиров',        adLogin: 'davron.toirov',         position: 'Metallurg-Tadqiqotchi' },
      { fullName: 'Элмурод Санакулов',    adLogin: 'elmurod.sanakulov',     position: 'R&D Engineer' },
      { fullName: 'Жамшид Расулов',       adLogin: 'jamshid.rasulov',       position: 'Innovation Analyst' },
      { fullName: 'Зарина Мамаражабова',  adLogin: 'zarina.mamarazhab',     position: 'Tadqiqotchi' },
      { fullName: 'Икром Холиков',        adLogin: 'ikrom.holikov',         position: 'Metallurg' },
      { fullName: 'Камол Тошқентов',     adLogin: 'kamol.toshkentov',      position: 'Bosh Muhandis' },
    ],
    computers: ['KM-PC-01','KM-PC-02','KM-PC-03'],
  },
  {
    name: 'Transformatsiya', displayName: 'Transformatsiya', icon: '🔄',
    parent: 'Офис Управления', description: 'Transformatsiya bo\'limi', sortOrder: 8,
    users: [
      { fullName: 'Аброр Усмонов',        adLogin: 'abror.usmonov',         position: 'Transformation Lead' },
      { fullName: 'Бунёд Хасанов',        adLogin: 'bunyod.hasanov',        position: 'Change Manager' },
      { fullName: 'Виктория Ким',         adLogin: 'viktoriya.kim',         position: 'Business Analyst' },
      { fullName: 'Гавхар Исмоилова',     adLogin: 'gavhar.ismoilova',      position: 'Process Engineer' },
      { fullName: 'Дилшод Турсунов',      adLogin: 'dilshod.tursunov2',     position: 'Project Manager' },
      { fullName: 'Этибор Рустамова',     adLogin: 'etibar.rustamova',      position: 'Analyst' },
      { fullName: 'Жавлон Нурматов',      adLogin: 'javlon.nurmatov',       position: 'Process Specialist' },
      { fullName: 'Зафар Бекпўлатов',    adLogin: 'zafar.bekpulatov',      position: 'IT Transformation' },
      { fullName: 'Ирода Мамаджонова',    adLogin: 'iroda.mamadjonova',     position: 'Change Coordinator' },
      { fullName: 'Камол Ахмедов',        adLogin: 'kamol.akhmedov',        position: 'Transformation Specialist' },
      { fullName: 'Лола Сайфуллаева',     adLogin: 'lola.sayfullayeva',     position: 'Business Analyst' },
    ],
    computers: ['TRF-PC-01','TRF-PC-02','TRF-PC-03','TRF-PC-04'],
  },
  {
    name: 'TB', displayName: 'ТБ (Texnik Xavfsizlik)', icon: '⛑️',
    parent: 'Офис Управления', description: 'Texnik xavfsizlik bo\'limi', sortOrder: 9,
    users: [
      { fullName: 'Асрор Мирзаев',        adLogin: 'asror.mirzaev',         position: 'TB Boshlig\'i' },
      { fullName: 'Баходир Холматов',      adLogin: 'bahodir.holmatov',      position: 'TB Muhandisi' },
      { fullName: 'Вилоят Рахимова',       adLogin: 'viloat.rahimova',       position: 'TB Inspektori' },
      { fullName: 'Гайрат Тошев',         adLogin: 'gayrat.toshev',         position: 'Xavfsizlik Nazoratchisi' },
      { fullName: 'Дилфуза Хасанова',     adLogin: 'dilfuza.hasanova',      position: 'TB Koordinatori' },
      { fullName: 'Элчин Абдуллаев',      adLogin: 'elchin.abdullayev',     position: 'TB Specialist' },
      { fullName: 'Жаннат Турдиева',       adLogin: 'jannat.turdiyeva',      position: 'Muhit Muhofazasi' },
      { fullName: 'Зиёда Нишонова',       adLogin: 'ziyoda.nishonova',      position: 'TB Mudiri' },
      { fullName: 'Ибодулла Тошматов',    adLogin: 'ibodulla.toshmatov',    position: 'Xavfsizlik Muhandisi' },
      { fullName: 'Камол Рашидов',        adLogin: 'kamol.rashidov2',       position: 'TB Officer' },
    ],
    computers: ['TB-PC-01','TB-PC-02','TB-PC-03'],
  },
  {
    name: 'Invest', displayName: 'Инвест (Investitsiya)', icon: '📈',
    parent: 'Офис Управления', description: 'Investitsiya bo\'limi', sortOrder: 10,
    users: [
      { fullName: 'Алишер Умаров',        adLogin: 'alisher.umarov',        position: 'Investitsiya Direktori' },
      { fullName: 'Барно Каримова',       adLogin: 'barno.karimova',        position: 'Moliya Tahlilchisi' },
      { fullName: 'Вафо Тошев',           adLogin: 'vafo.toshev',           position: 'Portfolio Manager' },
      { fullName: 'Диловар Мусаев',       adLogin: 'dilovar.musaev',        position: 'Investitsiya Tahlilchisi' },
      { fullName: 'Эргаш Раҳимов',       adLogin: 'ergash.rahimov',        position: 'Risk Manager' },
      { fullName: 'Жасурбек Холиқов',    adLogin: 'jasurbek.holikov',      position: 'Investitsiya Specialist' },
      { fullName: 'Зульфия Хамроева',     adLogin: 'zulfiya.hamroeva',      position: 'Financial Analyst' },
      { fullName: 'Ибрагим Нурматов',    adLogin: 'ibragim.nurmatov',      position: 'Asset Manager' },
      { fullName: 'Камола Юсупова',      adLogin: 'kamola.yusupova',       position: 'Investment Officer' },
    ],
    computers: ['INV-PC-01','INV-PC-02','INV-PC-03'],
  },
  {
    name: 'Obshiy_otdel', displayName: 'Общий Отдел', icon: '🏢',
    parent: 'Офис Управления', description: 'Umumiy bo\'lim', sortOrder: 11,
    users: [
      { fullName: 'Адолат Маматова',      adLogin: 'adolat.mamatova',       position: 'Boshqaruv Kotibi' },
      { fullName: 'Бахром Эшматов',       adLogin: 'bahrom.eshmatov',       position: 'Xodimlar Boshqaruvi' },
      { fullName: 'Вазира Хошимова',      adLogin: 'vazira.hashimova',      position: 'Kotib' },
      { fullName: 'Гулсанам Рустамова',   adLogin: 'gulsanam.rustamova',    position: 'Archivist' },
      { fullName: 'Дилором Каримова',     adLogin: 'dilorom.karimova',      position: 'Ofis Menejeri' },
      { fullName: 'Элёр Насиров',         adLogin: 'elyor.nasirov',         position: 'Xodim' },
      { fullName: 'Жамила Тошматова',     adLogin: 'jamila.toshmatova',     position: 'Kotib' },
      { fullName: 'Зулфия Назарова',      adLogin: 'zulfiya.nazarova2',     position: 'Koordinator' },
      { fullName: 'Интизор Расулова',     adLogin: 'intizor.rasulova',      position: 'Ofis Assistent' },
      { fullName: 'Камол Бобоев',         adLogin: 'kamol.boboev',          position: 'Rahbariyat Kotibi' },
    ],
    computers: ['OO-PC-01','OO-PC-02','OO-PC-03'],
  },
  {
    name: 'SB', displayName: 'СБ (Xavfsizlik)', icon: '🛡️',
    parent: 'Офис Управления', description: 'Xavfsizlik bo\'limi', sortOrder: 12,
    users: [
      { fullName: 'Азамат Ёқубов',        adLogin: 'azamat.yoqubov',        position: 'Xavfsizlik Boshlig\'i' },
      { fullName: 'Бахтиёр Норов',        adLogin: 'bahtiyar.norov',        position: 'Xavfsizlik Xodimi' },
      { fullName: 'Вилоят Санакулов',     adLogin: 'viloat.sanakulov',      position: 'Qo\'riqchi' },
      { fullName: 'Голиб Рустамов',       adLogin: 'golib.rustamov',        position: 'Kiberxavfsizlik' },
      { fullName: 'Дони Ибрагимов',       adLogin: 'doni.ibragimov',        position: 'Xavfsizlik Muhandisi' },
      { fullName: 'Элёр Хасанов',         adLogin: 'elyor.hasanov',         position: 'Xavfsizlik Xodimi' },
      { fullName: 'Жасур Нурматов',       adLogin: 'jasur.nurmatov',        position: 'Koordinator' },
      { fullName: 'Зафар Мирзаев',        adLogin: 'zafar.mirzaev',         position: 'Xavfsizlik Tekshiruv' },
      { fullName: 'Ирода Холматова',      adLogin: 'iroda.holmatova',       position: 'Xavfsizlik Muhandisi' },
      { fullName: 'Камол Отажонов',       adLogin: 'kamol.otajonov',        position: 'Qo\'riqchi Boshlig\'i' },
    ],
    computers: ['SB-PC-01','SB-PC-02'],
  },
  {
    name: 'Snabjeniya', displayName: 'Снабжения (Ta\'minot)', icon: '📦',
    parent: 'Офис Управления', description: 'Ta\'minot bo\'limi', sortOrder: 13,
    users: [
      { fullName: 'Аброр Холиқов',        adLogin: 'abror.holikov',         position: 'Ta\'minot Boshlig\'i' },
      { fullName: 'Барчин Мирзаева',      adLogin: 'barchin.mirzaeva',      position: 'Logistika Mutaxassisi' },
      { fullName: 'Воҳид Ёқубов',        adLogin: 'vohid.yoqubov',         position: 'Ombor Mudiri' },
      { fullName: 'Гулбаҳор Рустамова',  adLogin: 'gulbahor.rustamova',    position: 'Xarid Mutaxassisi' },
      { fullName: 'Даврон Усманов',       adLogin: 'davron.usmanov',        position: 'Supply Chain Analyst' },
      { fullName: 'Элёр Тошматов',        adLogin: 'elyor.toshmatov',       position: 'Ta\'minot Muhandisi' },
      { fullName: 'Жасур Эргашев',        adLogin: 'jasur.ergashev2',       position: 'Logistika Koordinatori' },
      { fullName: 'Зулфия Норматова',     adLogin: 'zulfiya.normatova',     position: 'Xarid Koordinatori' },
      { fullName: 'Инобат Хасанова',      adLogin: 'inobat.hasanova',       position: 'Ombor Xodimi' },
      { fullName: 'Камола Эшматова',      adLogin: 'kamola.eshmatova',      position: 'Ta\'minot Xodimi' },
      { fullName: 'Лазиз Санакулов',      adLogin: 'laziz.sanakulov',       position: 'Logistika Mutaxassisi' },
    ],
    computers: ['SNB-PC-01','SNB-PC-02','SNB-PC-03'],
  },
  {
    name: 'Upravleniye_proektami', displayName: 'Управление Проектами', icon: '📊',
    parent: 'Офис Управления', description: 'Loyiha boshqaruvi bo\'limi', sortOrder: 14,
    users: [
      { fullName: 'Алибек Маматов',       adLogin: 'alibek.mamatov',        position: 'PMO Director' },
      { fullName: 'Бунёд Рахимов',        adLogin: 'bunyod.rahimov',        position: 'Project Manager' },
      { fullName: 'Воха Турсунов',        adLogin: 'voha.tursunov',         position: 'Project Coordinator' },
      { fullName: 'Гавхар Юсупова',       adLogin: 'gavhar.yusupova',       position: 'Business Analyst' },
      { fullName: 'Достон Холматов',      adLogin: 'doston.holmatov',       position: 'Scrum Master' },
      { fullName: 'Элвира Тошева',        adLogin: 'elvira.tosheva',        position: 'PMO Analyst' },
      { fullName: 'Жавохир Умаров',       adLogin: 'javokhir.umarov',       position: 'Project Manager' },
      { fullName: 'Зилола Расулова',      adLogin: 'zilola.rasulova',       position: 'Risk Coordinator' },
      { fullName: 'Иноят Мирзаев',        adLogin: 'inoyat.mirzaev',        position: 'Project Analyst' },
      { fullName: 'Камол Ёқубов',        adLogin: 'kamol.yoqubov',         position: 'Programme Manager' },
    ],
    computers: ['PM-PC-01','PM-PC-02','PM-PC-03'],
  },
  {
    name: 'UCT', displayName: 'УЦТ', icon: '🏭',
    parent: 'Офис Управления', description: 'Uchastka texnologik bo\'limi', sortOrder: 15,
    users: [
      { fullName: 'Акбарали Норов',       adLogin: 'akbarali.norov',        position: 'UCT Boshlig\'i' },
      { fullName: 'Бобур Тошматов',       adLogin: 'bobur.toshmatov',       position: 'Texnolog' },
      { fullName: 'Вохид Рашидов',        adLogin: 'vohid.rashidov',        position: 'Ishlab Chiqarish Muhandisi' },
      { fullName: 'Гулбаҳор Маматова',   adLogin: 'gulbahor.mamatova',     position: 'Texnolog' },
      { fullName: 'Дилром Ибрагимов',     adLogin: 'dilrom.ibragimov',      position: 'Texnik' },
      { fullName: 'Элмурод Исмоилов',     adLogin: 'elmurod.ismoilov',      position: 'Muhandis' },
      { fullName: 'Жаёнгир Санакулов',   adLogin: 'jayongir.sanakulov',    position: 'Texnolog-Muhandis' },
      { fullName: 'Зулфия Мусаева',       adLogin: 'zulfiya.musaeva',       position: 'Laborant' },
      { fullName: 'Ихтиёр Нурматов',     adLogin: 'ihtiyar.nurmatov2',     position: 'Texnolog' },
      { fullName: 'Камол Бекмуродов',    adLogin: 'kamol.bekmurodov',      position: 'Bosh Texnolog' },
      { fullName: 'Лола Ибрагимова',      adLogin: 'lola.ibragimova',       position: 'Laborant' },
      { fullName: 'Муҳаммад Тошев',      adLogin: 'muhammad.toshev',       position: 'Texnolog' },
    ],
    computers: ['UCT-PC-01','UCT-PC-02','UCT-PC-03','UCT-PC-04'],
  },
  {
    name: 'Finansisty', displayName: 'Финансисты', icon: '💰',
    parent: 'Офис Управления', description: 'Moliya bo\'limi', sortOrder: 16,
    users: [
      { fullName: 'Азиза Холматова',      adLogin: 'aziza.holmatova',       position: 'Bosh Buxgalter' },
      { fullName: 'Баходир Маматов',      adLogin: 'bahodir.mamatov',       position: 'Moliyachi' },
      { fullName: 'Вазира Исмоилова',     adLogin: 'vazira.ismoilova',      position: 'Buxgalter' },
      { fullName: 'Гулнора Хасанова',     adLogin: 'gulnora.hasanova',      position: 'Moliyaviy Tahlilchi' },
      { fullName: 'Диёра Рустамова',      adLogin: 'diyora.rustamova',      position: 'Buxgalter' },
      { fullName: 'Эльза Юсупова',        adLogin: 'elza.yusupova',         position: 'Moliyachi' },
      { fullName: 'Жамила Расулова',      adLogin: 'jamila.rasulova',       position: 'Soliq Mutaxassisi' },
      { fullName: 'Зарина Норматова',     adLogin: 'zarina.normatova',      position: 'Buxgalter' },
      { fullName: 'Инобат Мирзаева',      adLogin: 'inobat.mirzaeva',       position: 'Kichik Buxgalter' },
      { fullName: 'Камола Рашидова',      adLogin: 'kamola.rashidova',      position: 'Moliya Koordinatori' },
      { fullName: 'Лайло Мусаева',        adLogin: 'laylo.musaeva',         position: 'Treasury Analyst' },
      { fullName: 'Малика Алиева',        adLogin: 'malika.aliyeva',        position: 'Buxgalter' },
    ],
    computers: ['FIN-PC-01','FIN-PC-02','FIN-PC-03','FIN-PC-04'],
  },
  {
    name: 'Eksport', displayName: 'Экспорт', icon: '📤',
    parent: 'Офис Управления', description: 'Eksport bo\'limi', sortOrder: 17,
    users: [
      { fullName: 'Акрам Тошматов',       adLogin: 'akram.toshmatov',       position: 'Eksport Boshlig\'i' },
      { fullName: 'Бахор Рустамова',      adLogin: 'bahor.rustamova',       position: 'Eksport Mutaxassisi' },
      { fullName: 'Ваҳоб Ибрагимов',     adLogin: 'vahob.ibragimov',       position: 'Savdo Menejeri' },
      { fullName: 'Гулбаҳор Исмоилова', adLogin: 'gulbahor.ismoilova',   position: 'Eksport Koordinatori' },
      { fullName: 'Дилноза Мамаева',      adLogin: 'dilnoza.mamaeva',       position: 'Customs Specialist' },
      { fullName: 'Элсанам Холиков',      adLogin: 'elsanam.holikov',       position: 'Logistics Specialist' },
      { fullName: 'Жасур Мирзаев',        adLogin: 'jasur.mirzaev2',        position: 'Eksport Analyst' },
      { fullName: 'Зилола Отажонова',     adLogin: 'zilola.otajonova',      position: 'Trade Coordinator' },
      { fullName: 'Ирода Холиқова',      adLogin: 'iroda.holikova',        position: 'Documentation Specialist' },
      { fullName: 'Камол Ахмедов',       adLogin: 'kamol.akhmedov2',       position: 'Eksport Officer' },
      { fullName: 'Лола Мирзаева',        adLogin: 'lola.mirzaeva',         position: 'Customs Analyst' },
    ],
    computers: ['EXP-PC-01','EXP-PC-02','EXP-PC-03'],
  },
  {
    name: 'Yurotdel', displayName: 'Юротдел (Huquq)', icon: '⚖️',
    parent: 'Офис Управления', description: 'Huquq bo\'limi', sortOrder: 18,
    users: [
      { fullName: 'Азизбек Ёқубов',      adLogin: 'azizbeк.yoqubov',       position: 'Bosh Huquqshunos' },
      { fullName: 'Барно Норматова',      adLogin: 'barno.normatova',       position: 'Huquqshunos' },
      { fullName: 'Вафо Мусаев',          adLogin: 'vafo.musaev',           position: 'Yurist' },
      { fullName: 'Гулноза Холматова',    adLogin: 'gulnoza.holmatova',     position: 'Huquqiy Maslahatchi' },
      { fullName: 'Дилрабо Санакулова',   adLogin: 'dilrabo.sanakulova',    position: 'Huquqshunos' },
      { fullName: 'Элчин Рашидов',        adLogin: 'elchin.rashidov',       position: 'Shartnoma Mutaxassisi' },
      { fullName: 'Жасур Алиев',          adLogin: 'jasur.aliyev',          position: 'Yurist-Maslahatchi' },
      { fullName: 'Зарина Расулова',      adLogin: 'zarina.rasulova',       position: 'Huquqiy Tahlilchi' },
      { fullName: 'Ирода Абдуллаева',     adLogin: 'iroda.abdullayeva',     position: 'Compliance Officer' },
    ],
    computers: ['YUR-PC-01','YUR-PC-02'],
  },
];

// ════════════════════════════════════════════════════════
//   SEED — Populate all OUs with users and computers
// ════════════════════════════════════════════════════════
exports.seedOUs = async (req, res) => {
  try {
    let created = 0;
    let skipped = 0;

    for (const ouData of OU_SEED) {
      // Upsert OU
      const ou = await prisma.orgUnit.upsert({
        where: { name: ouData.name },
        create: {
          name:        ouData.name,
          displayName: ouData.displayName,
          icon:        ouData.icon,
          parent:      ouData.parent,
          description: ouData.description,
          sortOrder:   ouData.sortOrder,
        },
        update: {
          displayName: ouData.displayName,
          icon:        ouData.icon,
          description: ouData.description,
        },
      });

      // Seed users
      for (const u of ouData.users) {
        const exists = await prisma.oUUser.findUnique({ where: { adLogin: u.adLogin } });
        if (!exists) {
          await prisma.oUUser.create({
            data: {
              adLogin:   u.adLogin,
              fullName:  u.fullName,
              position:  u.position,
              email:     u.adLogin + '@uztmk.local',
              ouId:      ou.id,
              isLocked:  false,
              isEnabled: true,
            },
          });
          created++;
        } else {
          skipped++;
        }
      }

      // Seed computers
      for (let i = 0; i < ouData.computers.length; i++) {
        const pcName = ouData.computers[i];
        const exists = await prisma.oUComputer.findUnique({ where: { name: pcName } });
        if (!exists) {
          await prisma.oUComputer.create({
            data: {
              name:   pcName,
              os:     pcName.includes('SRV') ? 'Windows Server 2019' : 'Windows 10',
              ouId:   ou.id,
              status: i < 2 ? 'online' : (i < 3 ? 'online' : 'offline'),
            },
          });
        }
      }
    }

    res.json({ message: 'Seed muvaffaqiyatli yakunlandi', created, skipped });
  } catch (err) {
    console.error('[AD] seedOUs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   GET /api/ad/ous — List all OUs with counts
// ════════════════════════════════════════════════════════
exports.getOUs = async (req, res) => {
  try {
    const ous = await prisma.orgUnit.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { ouUsers: true, ouComputers: true } },
      },
    });

    const adAvailable = await ldap.isADAvailable();

    res.json({
      adStatus: adAvailable ? 'connected' : 'offline',
      domain: 'uztmk.local',
      dc: 'AD-TMK',
      ous: ous.map(ou => ({
        id:          ou.id,
        name:        ou.name,
        displayName: ou.displayName,
        icon:        ou.icon,
        parent:      ou.parent,
        description: ou.description,
        sortOrder:   ou.sortOrder,
        userCount:   ou._count.ouUsers,
        computerCount: ou._count.ouComputers,
      })),
    });
  } catch (err) {
    console.error('[AD] getOUs error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   GET /api/ad/ous/:name/users — Users in an OU
// ════════════════════════════════════════════════════════
exports.getOUUsers = async (req, res) => {
  try {
    const { name } = req.params;
    const ou = await prisma.orgUnit.findUnique({ where: { name } });
    if (!ou) return res.status(404).json({ error: 'OU topilmadi' });

    // Try real LDAP first
    const ouDN = `OU=Users,OU=${name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapUsers = await ldap.searchUsersInOU(ouDN);

    if (ldapUsers) {
      // Sync LDAP results to local DB (upsert)
      for (const u of ldapUsers) {
        if (u.adLogin) {
          await prisma.oUUser.upsert({
            where: { adLogin: u.adLogin },
            create: { adLogin: u.adLogin, fullName: u.fullName, email: u.email, position: u.position, phone: u.phone, isLocked: u.isLocked, isEnabled: u.isEnabled, lastLogin: u.lastLogin, ouId: ou.id },
            update: { fullName: u.fullName, email: u.email, position: u.position, isLocked: u.isLocked, isEnabled: u.isEnabled, lastLogin: u.lastLogin },
          });
        }
      }
      return res.json({ source: 'ldap', users: ldapUsers });
    }

    // Fallback: local DB
    const dbUsers = await prisma.oUUser.findMany({
      where: { ouId: ou.id },
      orderBy: { fullName: 'asc' },
    });
    res.json({ source: 'db', users: dbUsers });
  } catch (err) {
    console.error('[AD] getOUUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   GET /api/ad/ous/:name/computers
// ════════════════════════════════════════════════════════
exports.getOUComputers = async (req, res) => {
  try {
    const { name } = req.params;
    const ou = await prisma.orgUnit.findUnique({ where: { name } });
    if (!ou) return res.status(404).json({ error: 'OU topilmadi' });

    const computers = await prisma.oUComputer.findMany({
      where: { ouId: ou.id },
      orderBy: { name: 'asc' },
    });
    res.json(computers);
  } catch (err) {
    console.error('[AD] getOUComputers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   POST /api/ad/users — Create new user
// ════════════════════════════════════════════════════════
exports.createUser = async (req, res) => {
  try {
    const { adLogin, fullName, position, email, phone, ouName, password } = req.body;
    if (!adLogin || !fullName || !ouName) {
      return res.status(400).json({ error: 'adLogin, fullName va ouName majburiy' });
    }

    const ou = await prisma.orgUnit.findUnique({ where: { name: ouName } });
    if (!ou) return res.status(404).json({ error: 'OU topilmadi' });

    // Try real LDAP
    const ouDN = `OU=Users,OU=${ouName},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapResult = await ldap.createADUser(ouDN, { adLogin, fullName, password, position, email });

    // Save to local DB
    const user = await prisma.oUUser.create({
      data: {
        adLogin, fullName, position: position || '', email: email || adLogin + '@uztmk.local',
        phone: phone || '', ouId: ou.id, isLocked: false, isEnabled: true,
      },
    });

    res.status(201).json({
      ...user,
      ldap: ldapResult.success ? 'created_in_ad' : 'saved_locally_only',
      ldapError: ldapResult.error || null,
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Bu adLogin allaqachon mavjud' });
    console.error('[AD] createUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   PATCH /api/ad/users/:id — Update user (name, position, email, phone)
// ════════════════════════════════════════════════════════
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, position, email, phone } = req.body;

    const user = await prisma.oUUser.findUnique({
      where: { id: parseInt(id) },
      include: { ou: true },
    });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    // Try LDAP update
    if (user.adLogin) {
      const dn = `CN=${user.fullName},OU=Users,OU=${user.ou.name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
      await ldap.updateADUser(dn, { position, email, phone });
    }

    const updated = await prisma.oUUser.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName  && { fullName }),
        ...(position  && { position }),
        ...(email     && { email }),
        ...(phone !== undefined && { phone }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[AD] updateUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   PATCH /api/ad/users/:id/password — Reset password
// ════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const user = await prisma.oUUser.findUnique({
      where: { id: parseInt(id) },
      include: { ou: true },
    });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    // Try real LDAP password reset
    const dn = `CN=${user.fullName},OU=Users,OU=${user.ou.name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapResult = await ldap.resetPassword(dn, newPassword);

    // Also update local hash
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.oUUser.update({ where: { id: parseInt(id) }, data: { passwordHash: hash } });

    res.json({
      success: true,
      ldap: ldapResult.success ? 'password_reset_in_ad' : 'reset_locally_only',
      ldapError: ldapResult.error || null,
    });
  } catch (err) {
    console.error('[AD] resetPassword error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   PATCH /api/ad/users/:id/lock — Lock / Unlock
// ════════════════════════════════════════════════════════
exports.toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.oUUser.findUnique({
      where: { id: parseInt(id) },
      include: { ou: true },
    });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const newLock = !user.isLocked;
    const dn = `CN=${user.fullName},OU=Users,OU=${user.ou.name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapResult = await ldap.setAccountLock(dn, newLock);

    const updated = await prisma.oUUser.update({
      where: { id: parseInt(id) },
      data: { isLocked: newLock, isEnabled: !newLock },
    });

    res.json({
      ...updated,
      ldap: ldapResult.success ? (newLock ? 'locked_in_ad' : 'unlocked_in_ad') : 'updated_locally_only',
    });
  } catch (err) {
    console.error('[AD] toggleLock error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   PATCH /api/ad/users/:id/move — Move to another OU
// ════════════════════════════════════════════════════════
exports.moveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetOUName } = req.body;

    const [user, targetOU] = await Promise.all([
      prisma.oUUser.findUnique({ where: { id: parseInt(id) }, include: { ou: true } }),
      prisma.orgUnit.findUnique({ where: { name: targetOUName } }),
    ]);
    if (!user)     return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    if (!targetOU) return res.status(404).json({ error: 'Maqsad OU topilmadi' });

    const srcDN = `CN=${user.fullName},OU=Users,OU=${user.ou.name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const dstDN = `OU=Users,OU=${targetOUName},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapResult = await ldap.moveUser(srcDN, dstDN, user.fullName);

    const updated = await prisma.oUUser.update({
      where: { id: parseInt(id) },
      data: { ouId: targetOU.id },
      include: { ou: true },
    });

    res.json({ ...updated, ldap: ldapResult.success ? 'moved_in_ad' : 'moved_locally_only' });
  } catch (err) {
    console.error('[AD] moveUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   DELETE /api/ad/users/:id — Delete user
// ════════════════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.oUUser.findUnique({
      where: { id: parseInt(id) },
      include: { ou: true },
    });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const dn = `CN=${user.fullName},OU=Users,OU=${user.ou.name},OU=\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f,DC=uztmk,DC=local`;
    const ldapResult = await ldap.deleteADUser(dn);

    await prisma.oUUser.delete({ where: { id: parseInt(id) } });

    res.json({
      message: `${user.fullName} o'chirildi`,
      ldap: ldapResult.success ? 'deleted_from_ad' : 'deleted_locally_only',
    });
  } catch (err) {
    console.error('[AD] deleteUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   POST /api/ad/ous — Create new OU
// ════════════════════════════════════════════════════════
exports.createOU = async (req, res) => {
  try {
    const { name, displayName, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name majburiy' });

    const maxOrder = await prisma.orgUnit.findFirst({ orderBy: { sortOrder: 'desc' } });
    const ou = await prisma.orgUnit.create({
      data: {
        name, displayName: displayName || name,
        icon: icon || '📁',
        parent: '\u041e\u0444\u0438\u0441 \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f',
        description: description || '',
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });
    res.status(201).json(ou);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Bu nom bilan OU allaqachon mavjud' });
    console.error('[AD] createOU error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   DELETE /api/ad/ous/:name — Delete OU
// ════════════════════════════════════════════════════════
exports.deleteOU = async (req, res) => {
  try {
    const { name } = req.params;
    await prisma.orgUnit.delete({ where: { name } });
    res.json({ message: `OU "${name}" o'chirildi` });
  } catch (err) {
    console.error('[AD] deleteOU error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   POST /api/ad/computers — Add computer to OU
// ════════════════════════════════════════════════════════
exports.addComputer = async (req, res) => {
  try {
    const { name, os, ouName, ipAddress } = req.body;
    const ou = await prisma.orgUnit.findUnique({ where: { name: ouName } });
    if (!ou) return res.status(404).json({ error: 'OU topilmadi' });

    const pc = await prisma.oUComputer.create({
      data: { name, os: os || 'Windows 10', ouId: ou.id, ipAddress: ipAddress || null, status: 'online' },
    });
    res.status(201).json(pc);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Bu kompyuter nomi allaqachon mavjud' });
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════
//   DELETE /api/ad/computers/:id — Remove computer
// ════════════════════════════════════════════════════════
exports.deleteComputer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.oUComputer.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Kompyuter o\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
