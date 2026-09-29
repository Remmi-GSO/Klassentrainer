/**
 * Herkunftssensitives Phonetik- & Standard-Audio-Modul (100% Offline)
 * Erzeugt leicht lesbare deutsche Aussprachehilfen (Lautsprache mit Silbentrennung)
 * für die 1. Zeile der Eselsbrücke unter Berücksichtigung des Geburtsorts / Herkunftslands
 * und ordnet natürliche Neural-TTS-Audiodateien zu.
 */

export function cleanPhoneticKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\(inaktiv\)/gi, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[éèê]/g, 'e')
    .replace(/[óòô]/g, 'o')
    .replace(/[áàâă]/g, 'a')
    .replace(/[ńñ]/g, 'n')
    .replace(/ł/g, 'l')
    .replace(/ț/g, 't')
    .replace(/[șş]/g, 's')
    .replace(/[çćč]/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/[^a-z]/g, '');
}

/**
 * Kuratierte Lautschriften & Neural-Audio-Zuordnungen für alle Schüler (2024, 2025, 2026)
 * Format: [Nachname, Vorname, Lautschrift]
 */
const CURATED_ENTRIES = [
  // === Jahrgang 2025 (BFT51, BFT52, FOI51) ===
  ['Abubakir', 'Shko Hemn', '🗣️ [A-bu-Ba-kir, Schko Hemn]'],
  ['Ahrweiler', 'Niklas', '🗣️ [Ahr-wei-ler, Nik-las]'],
  ['Ak', 'Deniz', '🗣️ [Ak, De-nis]'],
  ['Aldelemie', 'Mustafa', '🗣️ [Al-De-le-mi, Mus-ta-fa]'],
  ['Aliiev', 'Tamerlan', '🗣️ [A-li-jew, Ta-mer-lan]'],
  ['Almuazen', 'Mohammed Sadek', '🗣️ [Al-Mu-a-sen, Mo-ham-med Sa-dek]'],
  ['Almuazen', 'Nour', '🗣️ [Al-Mu-a-sen, Nur]'],
  ['Altinay', 'Mustafa', '🗣️ [Al-ti-naj, Mus-ta-fa]'],
  ['Amirian', 'Armin', '🗣️ [A-mir-jan, Ar-min]'],
  ['Arnhold', 'Tim', '🗣️ [Arn-hold, Tim]'],
  ['Aydinalp', 'Eymen', '🗣️ [Aj-din-alp, Ej-men]'],
  ['Balkhi', 'Abdul Razeq', '🗣️ [Bal-chi, Ab-dul Ra-sek]'],
  ['Barkaoui', 'Abdeljalil', '🗣️ [Bar-ka-u-i, Ab-del-dscha-lil]'],
  ['Bouarif', 'Leon', '🗣️ [Bu-a-rif, Le-on]'],
  ['Bozkurt', 'Kerim', '🗣️ [Bos-kurt, Ke-rim]'],
  ['Custodis', 'Gianni', '🗣️ [Kus-to-dis, Dschan-ni]'],
  ['Cvetanoski', 'Nino', '🗣️ [Zwe-ta-nos-ki, Ni-no]'],
  ['Dizdar', 'Armin', '🗣️ [Dis-dar, Ar-min]'],
  ['Djurdjevic', 'Emil', '🗣️ [Dschur-dsche-witsch, E-mil]'],
  ['Eralp', 'Hamit', '🗣️ [Er-alp, Ha-mit]'],
  ['Esa', 'Dleer', '🗣️ [E-sa, Dler]'],
  ['Fares', 'Amin', '🗣️ [Fa-res, A-min]'],
  ['Firat', 'Muhammed Selim', '🗣️ [Fi-rat, Mu-ham-med Se-lim]'],
  ['Gbaguidi', 'Abdou Gafarou Adebahodoun', '🗣️ [Ba-gi-di, Ab-du Ga-fa-ru A-de-ba-ho-dun]'],
  ['Gerhards', 'James', '🗣️ [Ger-hards, Dscheims]'],
  ['Grabs', 'Aliou', '🗣️ [Grabs, A-li-u]'],
  ['Grosu', 'Danut', '🗣️ [Gro-su, Da-nutz]'],
  ['Guenda', 'Samuel', '🗣️ [Gu-en-da, Sa-mu-el]'],
  ['Günes', 'Musa', '🗣️ [Gü-nesch, Mu-sa]'],
  ['Hafdhalla', 'Rami Ben', '🗣️ [Haf-dal-la, Ra-mi Ben]'],
  ['Hamo', 'Ahmad', '🗣️ [Ha-mo, Ach-mad]'],
  ['Hamurcu', 'Rüzgar', '🗣️ [Ha-mur-dschu, Rüs-gar]'],
  ['Heller', 'Sophie', '🗣️ [Hel-ler, So-fie]'],
  ['Ibrahim', 'Ilona', '🗣️ [Ib-ra-him, I-lo-na]'],
  ['Iskandarov', 'Daniel', '🗣️ [Is-kan-da-row, Da-ni-el]'],
  ['Jäger', 'Louis', '🗣️ [Jä-ger, Lu-i]'],
  ['Karga', 'Musa', '🗣️ [Kar-ga, Mu-sa]'],
  ['Keles', 'Zahide Ela', '🗣️ [Ke-lesch, Sa-hi-de E-la]'],
  ['Kocyigit', 'Mert', '🗣️ [Kotsch-ji-it, Mert]'],
  ['Konkol', 'Christopher', '🗣️ [Kon-kol, Kris-tof-fer]'],
  ['Kostin', 'Maksym', '🗣️ [Kos-tin, Mak-sim]'],
  ['Köse', 'Ömer Kayra', '🗣️ [Kö-se, Ö-mer Kaj-ra]'],
  ['Lamsfuß', 'Jan', '🗣️ [Lams-fuß, Jan]'],
  ['Loza', 'Bohdan', '🗣️ [Lo-sa, Boch-dan]'],
  ['Maurer', 'Stefan', '🗣️ [Mau-rer, Schte-fan]'],
  ['Merk', 'Miko', '🗣️ [Merk, Mi-ko]'],
  ['Mirahki', 'Parniya', '🗣️ [Mi-rach-ki, Par-ni-ja]'],
  ['Mitlehner', 'Alex', '🗣️ [Mit-leh-ner, A-lex]'],
  ['Mohammadi', 'Zeinab', '🗣️ [Mo-ham-ma-di, Sei-nab]'],
  ['Muradyan', 'Ruben', '🗣️ [Mu-rad-jan, Ru-ben]'],
  ['Nazari', 'Omid', '🗣️ [Na-sa-ri, O-mid]'],
  ['Nguyen', 'Thong Kendy Ly', '🗣️ [Ngu-jen, Tong Ken-di Li]'],
  ['Novytskyi', 'Oleksandr', '🗣️ [No-witz-ki, O-lek-sandr]'],
  ['Olenberger', 'Leonard', '🗣️ [O-len-ber-ger, Le-o-nard]'],
  ['Oral', 'Bedirhan', '🗣️ [O-ral, Be-dir-han]'],
  ['Pawlowski', 'Gabriel', '🗣️ [Paw-wow-ski, Ga-bri-el]'],
  ['Pawlowski', 'David', '🗣️ [Paw-wow-ski, Da-wid]'],
  ['Pies', 'Johannes', '🗣️ [Pies (langes i), Jo-han-nes]'],
  ['Quartier', 'Jan', '🗣️ [Kwar-tier, Jan]'],
  ['Sabri', 'Amin', '🗣️ [Sab-ri, A-min]'],
  ['Sahin', 'Yalin', '🗣️ [Scha-hin, Ja-lin]'],
  ['Sahin', 'Koray', '🗣️ [Scha-hin, Ko-raj]'],
  ['Saretzki', 'Rayan', '🗣️ [Sa-retz-ki, Ra-jan]'],
  ['Sbii', 'Nizar', '🗣️ [Sbi-i, Ni-sar]'],
  ['Scarano', 'Leo', '🗣️ [Ska-ra-no, Le-o]'],
  ['Schellenberg', 'Wilhelm', '🗣️ [Schel-len-berg, Wil-helm]'],
  ['Sharma', 'Raghav', '🗣️ [Schar-ma, Ra-gaw]'],
  ['Solonskyi', 'Bohdan', '🗣️ [So-lon-ski, Boch-dan]'],
  ['Storm', 'Sascha', '🗣️ [Schtorm, Sa-scha]'],
  ['Strauch', 'Darius', '🗣️ [Schtrauch, Da-ri-us]'],
  ['Stuhr', 'Pelle', '🗣️ [Schtuhr, Pel-le]'],
  ['Suvalic', 'Edin', '🗣️ [Schu-wa-litsch, E-din]'],
  ['Szymanski', 'Kacper Mariusz', '🗣️ [Schi-man-ski, Katz-per Ma-ri-usch]'],
  ['Tekman', 'Eyüp', '🗣️ [Tek-man, E-jüp]'],
  ['Timmer', 'Ravi', '🗣️ [Tim-mer, Ra-wi]'],
  ['Toraman', 'Mert', '🗣️ [To-ra-man, Mert]'],
  ['Trude', 'Adrian', '🗣️ [Tru-de, A-dri-an]'],
  ['Türkdönmez', 'Yusuf', '🗣️ [Türk-dön-mes, Ju-suf]'],
  ['Uko', 'Onyeka Favour', '🗣️ [U-ko, On-je-ka Fej-wör]'],
  ['Uygur', 'Efe Can', '🗣️ [Uj-gur, E-fe Dschan]'],
  ['Üyümez', 'Arif Cetin', '🗣️ [Ü-jü-mes, A-rif Tsche-tin]'],
  ['Walter', 'Tamino', '🗣️ [Wal-ter, Ta-mi-no]'],
  ['Weber', 'León-Felipe', '🗣️ [We-ber, Le-on Fe-li-pe]'],
  ['Weidauer', 'Sebastian', '🗣️ [Wei-dau-er, Se-bas-ti-an]'],
  ['Wittkowski', 'Jonas', '🗣️ [Witt-kow-ski, Jo-nas]'],
  ['Yildirim', 'Talha Mahmut', '🗣️ [Jil-di-rim, Tal-ha Mach-mut]'],
  ['Öztürk', 'Ahmed Yahya', '🗣️ [Ös-türk, Ach-med Jah-ja]'],
  ['Özüyilmaz', 'Akif Zeki', '🗣️ [Ös-ü-jil-mas, A-kif Se-ki]'],

  // === Jahrgang 2026 (BFT61_MN, BFT62_HC, FOI61_WI) ===
  ['Abuelhassan', 'Loren', '🗣️ [A-bu-el-has-san, Lo-ren]'],
  ['Arami', 'Feres', '🗣️ [A-ra-mi, Fe-res]'],
  ['Barbarotto', 'Carmelo', '🗣️ [Bar-ba-rot-to, Kar-me-lo]'],
  ['Bardakci', 'Kerem', '🗣️ [Bar-dak-tschi, Ke-rem]'],
  ['Bazani Aljareghi', 'Kian', '🗣️ [Ba-sa-ni Al-dscha-re-gi, Ki-an]'],
  ['Cherevychnyi', 'Ivan', '🗣️ [Tsche-re-witsch-ni, I-wan]'],
  ['El Fekih', 'Anis', '🗣️ [El Fe-kich, A-nis]'],
  ['Hoveizeh Nezhad', 'Mohamad', '🗣️ [Ho-wei-se Ne-schad, Mo-ha-mad]'],
  ['Ismail', 'Mohamad', '🗣️ [Is-ma-il, Mo-ha-mad]'],
  ['Kaur', 'Kirandeep', '🗣️ [Ka-ur, Ki-ran-diep]'],
  ['Kourounis', 'Ioannis', '🗣️ [Ku-ru-nis, Jo-an-nis]'],
  ['Kus', 'Arda', '🗣️ [Kusch, Ar-da]'],
  ['Malkoc', 'Merve', '🗣️ [Mal-kotsch, Mer-we]'],
  ['Soliman', 'Ilias', '🗣️ [So-li-man, I-li-as]'],
  ['Szatmari', 'Mark', '🗣️ [Sat-ma-ri, Mark]'],
  ['Telci', 'Arda', '🗣️ [Tel-dschi, Ar-da]'],
  ['Yilmaz', 'Emir', '🗣️ [Jil-mas, E-mir]'],
  ['Yngulbiev', 'Muhammad', '🗣️ [In-gul-bi-jew, Mu-ham-mad]'],
  ['Özcandan', 'Aras', '🗣️ [Ös-dschan-dan, A-ras]'],
  ['Ülger', 'Muharrem', '🗣️ [Ül-ger, Mu-har-rem]'],
  ['Baker', 'Mustafa', '🗣️ [Ba-ker, Mus-ta-fa]'],
  ['Boukerroucha', 'Ali', '🗣️ [Bu-ke-ru-scha, A-li]'],
  ['Briki', 'Sami', '🗣️ [Bri-ki, Sa-mi]'],
  ['Cicek', 'Metehan', '🗣️ [Tschi-tschek, Me-te-han]'],
  ['Greven', 'Jan', '🗣️ [Gre-wen, Jan]'],
  ['Hryshyn', 'Denys', '🗣️ [Chri-schin, De-nis]'],
  ['Jasinskas', 'Marius', '🗣️ [Ja-sins-kas, Ma-ri-us]'],
  ['Karim', 'Anas', '🗣️ [Ka-rim, A-nas]'],
  ['Kryvokhyzha', 'Akym', '🗣️ [Kri-wo-chi-scha, A-kim]'],
  ['Ladyhina', 'Valeria', '🗣️ [La-di-hi-na, Wa-le-ri-ja]'],
  ['Lallaa', 'Jaydin', '🗣️ [Lal-la-a, Dschej-din]'],
  ['Matieg', 'Abdulmuhiamen', '🗣️ [Ma-ti-eg, Ab-dul-mu-hai-men]'],
  ['Michelsohn', 'Paul', '🗣️ [Mi-chel-sohn, Paul]'],
  ['Miroshnikov', 'Nikita', '🗣️ [Mi-rosch-ni-kow, Ni-ki-ta]'],
  ['Nafisipour', 'Ilia', '🗣️ [Na-fi-si-pur, I-li-a]'],
  ['Romano', 'Samuele', '🗣️ [Ro-ma-no, Sa-mu-e-le]'],
  ['Sadeghi', 'Matin', '🗣️ [Sa-de-gi, Ma-tin]'],
  ['Sazio', 'Luca', '🗣️ [Sat-zi-o, Lu-ka]'],
  ['Tesfaye', 'Eyuel', '🗣️ [Tes-fa-je, E-ju-el]'],
  ['Tosun', 'Nisa', '🗣️ [To-sun, Ni-sa]'],
  ['Vamanu', 'Elias', '🗣️ [Wa-ma-nu, E-li-as]'],
  ['Zouhair', 'Salaheddine', '🗣️ [Su-hair, Sa-lach-ed-din]'],
  ['Özdemir', 'Arda', '🗣️ [Ös-de-mir, Ar-da]'],
  ['Altunkaya', 'Bugrahan', '🗣️ [Al-tun-ka-ja, Bu-ra-han]'],
  ['Alvi', 'Umut', '🗣️ [Al-wi, U-mut]'],
  ['Büchner', 'Lukas Alfred', '🗣️ [Büch-ner, Lu-kas Al-fred]'],
  ['Dellis', 'Clemens', '🗣️ [Del-lis, Kle-mens]'],
  ['Dikbasan', 'Serdar Efe', '🗣️ [Dik-ba-san, Ser-dar E-fe]'],
  ['Grodotzki', 'Justin', '🗣️ [Gro-dotz-ki, Dschas-tin]'],
  ['Gülsen', 'Enes', '🗣️ [Gül-schen, E-nes]'],
  ['Janeczek', 'Jakub', '🗣️ [Ja-ne-tschek, Ja-kub]'],
  ['Kasaboglu', 'Joshua', '🗣️ [Ka-sa-bo-lu, Dschosch-u-a]'],
  ['Kebapcioglu', 'Akil Daniel', '🗣️ [Ke-bap-tschi-o-lu, A-kil Da-ni-el]'],
  ['Konoz', 'Oleksandr', '🗣️ [Ko-nos, O-lek-sandr]'],
  ['Land', '', '🗣️ [Land]'],
  ['Lassar', 'Mannmit', '🗣️ [Las-sar, Man-mit]'],
  ['Matheja', 'Finn Tomek', '🗣️ [Ma-te-ja, Finn To-mek]'],
  ['Mohammadi', 'Amir Hussein', '🗣️ [Mo-ham-ma-di, A-mir Hus-sein]'],
  ['Moll', 'Lio Alexander', '🗣️ [Moll, Li-o A-lex-an-der]'],
  ['Palabiyik', 'Arzu Aleyna', '🗣️ [Pa-la-bi-jik, Ar-su A-lej-na]'],
  ['Simon', 'Tijan', '🗣️ [Si-mon, Ti-jan]'],
  ['Vornart', 'Uljana', '🗣️ [Wor-nart, Ul-ja-na]'],
  ['Özdemir', 'Abdalkerim', '🗣️ [Ös-de-mir, Ab-dal-ke-rim]'],

  // === Jahrgang 2024 (BFT41-KA, BFT42-SA, FOI41-WI) ===
  ['Altun', 'Ali Numan', '🗣️ [Al-tun, A-li Nu-man]'],
  ['Busacker', 'Sebastian', '🗣️ [Bu-sak-ker, Se-bas-ti-an]'],
  ['Carbol', 'Dominic', '🗣️ [Kar-bol, Do-mi-nik]'],
  ['Cinar', 'Tuna', '🗣️ [Tschi-nar, Tu-na]'],
  ['Contreras e Ibanez', 'Can', '🗣️ [Kon-tre-ras e I-ban-jes, Dschan]'],
  ['Giesbrecht', 'Marc', '🗣️ [Gies-brecht, Mark]'],
  ['Hartl', 'Milan', '🗣️ [Har-tel, Mi-lan]'],
  ['Hasan', 'Roni', '🗣️ [Ha-san, Ro-ni]'],
  ['Hoxhaj', 'Musab', '🗣️ [Ho-dschaj, Mu-sab]'],
  ['Kimsesiz', 'Ihsan', '🗣️ [Kim-se-sis, Ich-san]'],
  ['Krope', 'Rene', '🗣️ [Kro-pe, Re-ne]'],
  ['Kösem', 'Bekir', '🗣️ [Kö-sem, Be-kir]'],
  ['Kürth', 'Tim', '🗣️ [Kürt, Tim]'],
  ['Mert', 'Ishak', '🗣️ [Mert, Is-hak]'],
  ['Mues Perez', 'Maya', '🗣️ [Mu-es Pe-res, Ma-ja]'],
  ['Naebi', 'Maysam', '🗣️ [Na-e-bi, Mei-sam]'],
  ['Reitenbach', 'Eugen', '🗣️ [Rei-ten-bach, Eu-gen]'],
  ['Skreb', 'Marco', '🗣️ [Schkreb, Mar-ko]'],
  ['Tokarczyk', 'Wiktor', '🗣️ [To-kar-tschik, Wik-tor]'],
  ['Tuncel', 'Dogukan', '🗣️ [Tun-dschel, Do-u-kan]'],
  ['Weigandt', 'Maxim', '🗣️ [Wei-gandt, Mak-sim]'],
  ['Weigt', 'Tim', '🗣️ [Weigt, Tim]'],
  ['Zuso', 'Alessandro', '🗣️ [Su-so, A-les-san-dro]'],
  ['Öner', 'Resul', '🗣️ [Ö-ner, Re-sul]'],
  ['Özisik', 'Serife', '🗣️ [Ös-i-schik, Sche-ri-fe]'],
  ['Arslan', 'Emirhan', '🗣️ [Ars-lan, E-mir-han]'],
  ['Barati', 'Melica', '🗣️ [Ba-ra-ti, Me-li-ka]'],
  ['Bednaruk', 'Filip', '🗣️ [Bed-na-ruk, Fi-lip]'],
  ['Blanco Haase', 'Joshua Maximo', '🗣️ [Blan-ko Haa-se, Dschosch-u-a Mak-si-mo]'],
  ['Deniz', 'Burak', '🗣️ [De-nis, Bu-rak]'],
  ['El Edrissi', 'Ilias', '🗣️ [El E-dris-si, I-li-as]'],
  ['Engelmann', 'Edis', '🗣️ [En-gel-mann, E-dis]'],
  ['Etzweiler', 'Gian-Luca', '🗣️ [Etz-wei-ler, Dschan-Lu-ka]'],
  ['Güclü', 'Berat', '🗣️ [Gütsch-lü, Be-rat]'],
  ['Krutzke', 'Ben-Luca', '🗣️ [Krutz-ke, Ben-Lu-ka]'],
  ['Lang', 'Julian', '🗣️ [Lang, Ju-li-an]'],
  ['Maaskersting', 'Laurin', '🗣️ [Maas-kers-ting, Lau-rin]'],
  ['Mahmood', 'Abdullah', '🗣️ [Mach-mud, Ab-dul-lah]'],
  ['Palagniuk', 'Oleksandr', '🗣️ [Pa-lach-njuk, O-lek-sandr]'],
  ['Sejdic', 'Emanuel Delija', '🗣️ [Sej-ditsch, E-ma-nu-el De-li-ja]'],
  ['Shinwari', 'Haris', '🗣️ [Schin-wa-ri, Ha-ris]'],
  ['Timori', 'Zahra', '🗣️ [Ti-mo-ri, Sah-ra]'],
  ['Zhalov', 'Alexander', '🗣️ [Scha-low, A-lex-an-der]'],
  ['Ach', 'Marcel', '🗣️ [Ach, Mar-zel]'],
  ['Binder', 'Neo', '🗣️ [Bin-der, Ne-o]'],
  ['Boll', 'Lukas', '🗣️ [Boll, Lu-kas]'],
  ['Caliskan', 'Bijan', '🗣️ [Tscha-lisch-kan, Bi-schan]'],
  ['Erfurth', 'Timo', '🗣️ [Er-furt, Ti-mo]'],
  ['Franz', 'Solana', '🗣️ [Franz, So-la-na]'],
  ['Hilger', 'Ron', '🗣️ [Hil-ger, Ron]'],
  ['Horstmann', 'Melina', '🗣️ [Horst-mann, Me-li-na]'],
  ['Kambeck', 'Giuliano Fabrizio', '🗣️ [Kam-bek, Dschu-li-a-no Fa-bri-tzi-o]'],
  ['Karaoglu', 'Namik', '🗣️ [Ka-ra-o-lu, Na-mik]'],
  ['Kikidis', 'Elias', '🗣️ [Ki-ki-dis, E-li-as]'],
  ['Kolsch', 'Leon Robin', '🗣️ [Kolsch, Le-on Ro-bin]'],
  ['Lauretano', 'Gioele', '🗣️ [Lau-re-ta-no, Dscho-e-le]'],
  ['Lo Curto', 'Leonardo', '🗣️ [Lo Kur-to, Le-o-nar-do]'],
  ['Naydenov', 'Boris', '🗣️ [Naj-de-now, Bo-ris]'],
  ['Nwaigwe', 'Michael', '🗣️ [Nwa-i-gwe, Mai-kel]'],
  ['Quadt', 'Normen', '🗣️ [Kwat, Nor-men]'],
  ['Ramdani', 'Yassin', '🗣️ [Ram-da-ni, Jas-sin]'],
  ['Sarac', 'Batuhan Ege', '🗣️ [Sa-ratsch, Ba-tu-han E-ge]'],
  ['Sawhney', 'Gurjas Singh', '🗣️ [Sah-ni, Gur-dschas Sing]'],
  ['Sipar', 'Izzican', '🗣️ [Si-par, Is-si-dschan]'],
  ['Syrovatskiy', 'Ilja', '🗣️ [Si-ro-watz-ki, Il-ja]'],
  ['Tuzzeo', 'Luca', '🗣️ [Tut-ze-o, Lu-ka]'],
  ['Wildmoser', 'Sarah', '🗣️ [Wild-mo-ser, Sa-ra]'],
  ['Yaran', 'Berat Batin', '🗣️ [Ja-ran, Be-rat Ba-tin]'],
  ['Zimmermann', 'Sean Luca', '🗣️ [Zim-mer-mann, Schon Lu-ka]'],

  // === Demo- & Test-Schüler ===
  ['Becker', 'Thomas Michael', '🗣️ [Bek-ker, To-mas Mi-cha-el]'],
  ['Müller', 'Jörg', '🗣️ [Mül-ler, Jörg]'],
  ['Müller Schmitz', 'Petra', '🗣️ [Mül-ler-Schmitz, Pe-tra]'],
  ['Müller', 'Petra Melanie', '🗣️ [Mül-ler, Pe-tra Me-la-nie]'],
  ['Schneider', 'Lukas', '🗣️ [Schnei-der, Lu-kas]']
];

const PHONETICS_BY_FULL = {};
const PHONETICS_BY_LAST = {};
const AUDIO_BY_FULL = {};
const AUDIO_BY_LAST = {};

for (const [last, first, phon] of CURATED_ENTRIES) {
  const fullK = cleanPhoneticKey(`${last}_${first}`);
  const revK = cleanPhoneticKey(`${first}_${last}`);
  const lastK = cleanPhoneticKey(last);
  const url = `./audio_defaults/${fullK}.mp3`;

  PHONETICS_BY_FULL[fullK] = phon;
  AUDIO_BY_FULL[fullK] = url;

  if (revK && !PHONETICS_BY_FULL[revK]) {
    PHONETICS_BY_FULL[revK] = phon;
    AUDIO_BY_FULL[revK] = url;
  }

  if (lastK && !PHONETICS_BY_LAST[lastK]) {
    PHONETICS_BY_LAST[lastK] = phon;
    AUDIO_BY_LAST[lastK] = url;
  }

  // Bei mehrteiligen Nachnamen (z. B. "Bazani Aljareghi" oder "El Fekih") auch das erste Wort registrieren
  const firstLastToken = cleanPhoneticKey((last || '').split(/[\s,-]+/)[0]);
  if (firstLastToken && firstLastToken.length >= 3 && !PHONETICS_BY_LAST[firstLastToken]) {
    PHONETICS_BY_LAST[firstLastToken] = phon;
    AUDIO_BY_LAST[firstLastToken] = url;
  }

  // Kurzformen des Vornamens (nur 1. Vorname) ebenfalls registrieren
  const firstToken = (first || '').split(/[\s,-]+/)[0];
  if (firstToken && firstToken !== first) {
    const shortK = cleanPhoneticKey(`${last}_${firstToken}`);
    if (!PHONETICS_BY_FULL[shortK]) {
      PHONETICS_BY_FULL[shortK] = phon;
      AUDIO_BY_FULL[shortK] = url;
    }
    if (firstLastToken) {
      const shortBothK = cleanPhoneticKey(`${firstLastToken}_${firstToken}`);
      if (!PHONETICS_BY_FULL[shortBothK]) {
        PHONETICS_BY_FULL[shortBothK] = phon;
        AUDIO_BY_FULL[shortBothK] = url;
      }
    }
  }
}

// Spezielle Alias-Zuordnungen (Tippfehler in Bilddateien / Kurzformen)
const SPECIAL_ALIASES = [
  ['Schellenberg', 'Wil', 'Schellenberg', 'Wilhelm'],
  ['Shko', 'Hemn Abubakir', 'Abubakir', 'Shko Hemn'],
  ['Sabri Sabr', 'Amin', 'Sabri', 'Amin'],
  ['Maurer', 'Sefan', 'Maurer', 'Stefan'],
  ['Bouarif', 'Leo', 'Bouarif', 'Leon']
];

for (const [aliasLast, aliasFirst, targetLast, targetFirst] of SPECIAL_ALIASES) {
  const aliasK = cleanPhoneticKey(`${aliasLast}_${aliasFirst}`);
  const targetK = cleanPhoneticKey(`${targetLast}_${targetFirst}`);
  if (PHONETICS_BY_FULL[targetK]) PHONETICS_BY_FULL[aliasK] = PHONETICS_BY_FULL[targetK];
  if (AUDIO_BY_FULL[targetK]) AUDIO_BY_FULL[aliasK] = AUDIO_BY_FULL[targetK];
}

/**
 * Erkennt den Sprachraum anhand von Herkunftsland/Geburtsort und typischen Namensmustern
 */
function detectLanguageOrigin(lastName, firstName, country) {
  const c = String(country || '').toLowerCase();
  const full = `${lastName} ${firstName}`.toLowerCase();

  if (/türkei|turkey|istanbul|ankara|izmir|bahcelievler|antalya|konya|gaziantep|kayseri/.test(c)) return 'tr';
  if (/polen|poland|slawno|warszawa|warschau|krakau|gdansk|poznan|wroclaw/.test(c)) return 'pl';
  if (/ukraine|dnipro|charkiw|kharkiv|kiew|kyiv|zastarna|odessa|lviv|russland|belarus|kasachstan/.test(c)) return 'ua';
  if (/mazedonien|skopje|serbien|belgrad|kroatien|zagreb|bosnien|sarajevo|montenegro|kosovo|slowenien|albanien|tirana|bulgarien|sofia/.test(c)) return 'balkan';
  if (/irak|iraq|sulaimaniyya|bagdad|erbil|syrien|damaskus|aleppo|homs|libanon|beirut|jordanien|ägypten|kairo|marokko|tunesien|algerien|arabien|iran|teheran|afghanistan|kabul/.test(c)) return 'ar';
  if (/vietnam|hanoi|saigon/.test(c)) return 'vi';
  if (/frankreich|france|paris|benin|godomey|senegal|dakar|kamerun|elfenbeinküste|mali|guinea|togo|kongo/.test(c)) return 'fr';
  if (/rumänien|romania|bukarest|cluj|timisoara|moldau/.test(c)) return 'ro';
  if (/nigeria|lagos|abuja|ghana|accra|kenia|südafrika|singapur|usa|england|uk|großbritannien|indien/.test(c)) return 'en';
  if (/italien|rom|mailand|neapel|sizilien/.test(c)) return 'it';
  if (/spanien|madrid|barcelona|mexiko|kolumbien|argentinien/.test(c)) return 'es';
  if (/griechenland|athen|thessaloniki/.test(c)) return 'gr';

  // Fallback über typische Namensmuster
  if (/[ğşı]|öz|yıl|yilmaz|oğlu|oglu|bozkurt|hamurcu|uygur|kocyigit|tekman|aydinalp|altinay|günes|gülsen|keles|eralp|sahin|cicek|cinar|bardakci|malkoc|telci|tosun|ülger|tuncel|caliskan|karaoglu|sipar|yaran|arslan|deniz|kösem/.test(full)) return 'tr';
  if (/sz|cz|rz|ł|ń|ski\b|cki\b|wicz\b|czyk\b/.test(full)) return 'pl';
  if (/iiev\b|yev\b|tskyi\b|skyi\b|chnyi\b|khyzha|hryshyn|ladyhina|ov\b|kostin|loza|konoz|palagniuk|syrovatskiy/.test(full)) return 'ua';
  if (/cvet|djurdj|ic\b|ić\b|hoxhaj/.test(full)) return 'balkan';
  if (/\b(abdul|ahmad|ahmed|mohammed|mohamad|muhammed|muhammad|almuazen|abubakir|aldelemie|hafdhalla|barkaoui|abuelhassan|boukerroucha|zouhair|soliman|ismail|karim|mahmood|ramdani)\b/.test(full)) return 'ar';
  if (/\b(nguyen|tran|pham|le|huynh|thong)\b/.test(full)) return 'vi';
  if (/\b(aliou|abdou|gbaguidi|bouarif|louis)\b/.test(full)) return 'fr';
  if (/\b(grosu|danut|vamanu)\b/.test(full)) return 'ro';
  if (/\b(barbarotto|romano|sazio|lauretano|tuzzeo|giuliano|fabrizio|curto|zuso)\b/.test(full)) return 'it';
  if (/\b(kourounis|ioannis|kikidis)\b/.test(full)) return 'gr';

  return 'de';
}

/**
 * Teilt ein einzelnes Wort in gut lesbare Sprechsilben mit Bindestrichen (z. B. "Ahrweiler" -> "Ahr-wei-ler")
 */
function syllabifyWord(word) {
  if (!word || word.length <= 4 || word.includes('-')) return word;
  // Einfache, robuste deutsche Sprechsilben-Trennung anhand von Vokal-Konsonant-Mustern
  const vowels = 'aäeéiíoöuüyAÄEÉIÍOÖUÜY';
  let result = '';
  let lastVowelIdx = -1;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const isV = vowels.includes(ch);
    if (isV) {
      // Prüfe ob Diphthong (ei, ai, au, eu, äu, ie, ou) mit vorherigem Vokal
      if (lastVowelIdx === i - 1) {
        const pair = word.slice(i - 1, i + 1).toLowerCase();
        if (!['ei', 'ai', 'au', 'eu', 'äu', 'ie', 'ou', 'aa', 'ee', 'oo'].includes(pair)) {
          result += '-';
        }
      } else if (lastVowelIdx !== -1 && i - lastVowelIdx > 1) {
        // Konsonantencluster zwischen lastVowelIdx und i
        const cons = word.slice(lastVowelIdx + 1, i);
        // Untrennbare Mehrgraphen (sch, tsch, dsch, ch, ck, ph, th, st, sp) zusammenhalten
        let splitPos = result.length;
        if (/^(sch|tsch|dsch|ch|ph|th)$/i.test(cons)) {
          splitPos = result.length - cons.length;
        } else if (cons.length >= 2) {
          if (/(sch|tsch|dsch|ch)$/i.test(cons)) {
            const m = cons.match(/(sch|tsch|dsch|ch)$/i)[0];
            splitPos = result.length - m.length;
          } else {
            splitPos = result.length - 1;
          }
        } else {
          splitPos = result.length - 1;
        }
        if (splitPos > 1 && result[splitPos - 1] !== '-') {
          result = result.slice(0, splitPos) + '-' + result.slice(splitPos);
        }
      }
      lastVowelIdx = i;
    }
    result += ch;
  }
  return result;
}

/**
 * Wandelt einen einzelnen Namenstoken anhand des erkannten Sprachraums in deutsche Lautschrift um
 */
function transcribeWord(word, lang) {
  if (!word) return '';
  let w = word.trim();

  if (lang === 'tr') {
    w = w
      .replace(/ğ/gi, '-')
      .replace(/ç/g, 'tsch').replace(/Ç/g, 'Tsch')
      .replace(/ş/g, 'sch').replace(/Ş/g, 'Sch')
      .replace(/c/g, 'dsch').replace(/C/g, 'Dsch')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/y([aäeioöuü])/gi, 'j$1')
      .replace(/([aäeioöuü])y/gi, '$1j')
      .replace(/z/g, 's').replace(/Z/g, 'S')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'pl') {
    w = w
      .replace(/sz/g, 'sch').replace(/Sz/g, 'Sch')
      .replace(/cz/g, 'tsch').replace(/Cz/g, 'Tsch')
      .replace(/rz/g, 'sch').replace(/Rz/g, 'Sch')
      .replace(/ł/g, 'w').replace(/Ł/g, 'W')
      .replace(/ń/g, 'n')
      .replace(/c([aäeioöuüpk])/gi, 'tz$1');
  } else if (lang === 'ua') {
    w = w
      .replace(/iiev\b/gi, 'ijew')
      .replace(/yev\b/gi, 'jew')
      .replace(/ov\b/gi, 'ow')
      .replace(/ev\b/gi, 'ew')
      .replace(/tskyi\b/gi, 'tzki')
      .replace(/skyi\b/gi, 'ski')
      .replace(/chnyi\b/gi, 'tschni')
      .replace(/ch/gi, 'tsch')
      .replace(/kh/gi, 'ch')
      .replace(/zh/gi, 'sch')
      .replace(/y/g, 'i').replace(/Y/g, 'I')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'balkan') {
    w = w
      .replace(/^Cv/g, 'Zw').replace(/^cv/g, 'zw')
      .replace(/dj/gi, 'dsch')
      .replace(/ic\b/gi, 'itsch')
      .replace(/ić\b/gi, 'itsch')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'ar') {
    w = w
      .replace(/sh/g, 'sch').replace(/Sh/g, 'Sch')
      .replace(/kh/g, 'ch').replace(/Kh/g, 'Ch')
      .replace(/gh/g, 'g').replace(/Gh/g, 'G')
      .replace(/ou/g, 'u').replace(/Ou/g, 'U')
      .replace(/y([aäeioöuü])/gi, 'j$1')
      .replace(/z/g, 's').replace(/Z/g, 'S')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'vi') {
    w = w
      .replace(/^Nguyen$/i, 'Ngu-jen')
      .replace(/^Th/g, 'T')
      .replace(/y/g, 'i');
  } else if (lang === 'fr') {
    w = w
      .replace(/^Gb/g, 'B')
      .replace(/ou/g, 'u').replace(/Ou/g, 'U')
      .replace(/eau/g, 'o')
      .replace(/^Louis$/i, 'Lu-i');
  } else if (lang === 'ro') {
    w = w
      .replace(/ț/g, 'tz')
      .replace(/ș/g, 'sch')
      .replace(/ă/g, 'a')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'it') {
    w = w
      .replace(/gi([aou])/gi, 'dsch$1')
      .replace(/ge/gi, 'dsche').replace(/gi/gi, 'dschi')
      .replace(/ci([aou])/gi, 'tsch$1')
      .replace(/ce/gi, 'tsche').replace(/ci/gi, 'tschi')
      .replace(/c([aou])/g, 'k$1').replace(/C([aou])/g, 'K$1');
  } else if (lang === 'gr') {
    w = w
      .replace(/ou/gi, 'u')
      .replace(/^Io/g, 'Jo');
  } else {
    // Deutsch / Allgemein: typische Aussprache-Verdeutlichungen
    w = w
      .replace(/ph/gi, 'f')
      .replace(/^St([aäeioöuü])/g, 'Scht$1')
      .replace(/^Sp([aäeioöuü])/g, 'Schp$1')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  }

  return syllabifyWord(w);
}

/**
 * Gibt die passende Lautschrift-Zeile ("🗣️ [Nachname, Vorname]") für einen Schüler zurück
 */
export function getPhoneticLine(lastName, firstName, country = '') {
  const cleanLast = String(lastName || '').replace(/\(inaktiv\)/gi, '').replace(/[0-9_]+$/g, '').trim();
  const cleanFirst = String(firstName || '').replace(/[0-9_]+$/g, '').trim();

  if (!cleanLast && !cleanFirst) return '';

  const fullK = cleanPhoneticKey(`${cleanLast}_${cleanFirst}`);
  const revK = cleanPhoneticKey(`${cleanFirst}_${cleanLast}`);
  const lastK = cleanPhoneticKey(cleanLast);
  const firstLastToken = cleanPhoneticKey(cleanLast.split(/[\s,-]+/)[0]);

  if (PHONETICS_BY_FULL[fullK]) return PHONETICS_BY_FULL[fullK];
  if (PHONETICS_BY_FULL[revK]) return PHONETICS_BY_FULL[revK];
  if (PHONETICS_BY_LAST[lastK]) return PHONETICS_BY_LAST[lastK];
  if (firstLastToken && PHONETICS_BY_LAST[firstLastToken]) return PHONETICS_BY_LAST[firstLastToken];

  // Teilstring-/Präfix-Suche über bekannte Vollnamen (z. B. bei Zweitnamen oder leicht gekürzten Dateinamen)
  if (fullK.length >= 5) {
    for (const [k, phon] of Object.entries(PHONETICS_BY_FULL)) {
      if (k.length >= 5 && (k.startsWith(fullK) || fullK.startsWith(k))) {
        return phon;
      }
    }
  }

  // Regelbasierter Fallback für neue/unbekannte Schüler unter Nutzung des Herkunftslands + Silbentrennung
  const lang = detectLanguageOrigin(cleanLast, cleanFirst, country);
  const phonLast = cleanLast.split(/\s+/).map(w => transcribeWord(w, lang)).join(' ');
  const phonFirst = cleanFirst.split(/\s+/).map(w => transcribeWord(w, lang)).join(' ');

  return phonFirst ? `🗣️ [${phonLast}, ${phonFirst}]` : `🗣️ [${phonLast}]`;
}

/**
 * Stellt sicher, dass in der 1. Zeile der Eselsbrücke immer die aktuelle Lautschrift steht,
 * ohne bestehende eigene Notizen in den Folgezeilen zu überschreiben.
 */
export function ensurePhoneticInMnemonic(currentMnemonic, lastName, firstName, country = '') {
  const phoneticLine = getPhoneticLine(lastName, firstName, country);
  if (!phoneticLine) return currentMnemonic || '';

  const raw = String(currentMnemonic || '').trim();
  if (!raw) {
    return phoneticLine;
  }

  const lines = raw.split(/\r?\n/);
  const firstLine = lines[0].trim();

  // Falls Zeile 1 bereits eine Lautschrift-Zeile ist ("🗣️ [...]" oder "[...]"),
  // immer auf die neueste kuratierte Lautschrift aktualisieren (Zeile 2+ bleibt unangetastet!)
  if (firstLine.startsWith('🗣️') || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
    lines[0] = phoneticLine;
    return lines.join('\n');
  }

  // Andernfalls Lautschrift in Zeile 1 setzen und bestehende Eselsbrücke darunter erhalten
  return `${phoneticLine}\n${raw}`;
}

/**
 * Liefert die URL zur vorab generierten Neural-TTS-Audiodatei (falls für diesen Namen vorhanden)
 */
export function getDefaultAudioUrl(lastName, firstName) {
  const cleanLast = String(lastName || '').replace(/\(inaktiv\)/gi, '').replace(/[0-9_]+$/g, '').trim();
  const cleanFirst = String(firstName || '').replace(/[0-9_]+$/g, '').trim();

  const fullK = cleanPhoneticKey(`${cleanLast}_${cleanFirst}`);
  const revK = cleanPhoneticKey(`${cleanFirst}_${cleanLast}`);
  const lastK = cleanPhoneticKey(cleanLast);
  const firstLastToken = cleanPhoneticKey(cleanLast.split(/[\s,-]+/)[0]);

  if (AUDIO_BY_FULL[fullK]) return AUDIO_BY_FULL[fullK];
  if (AUDIO_BY_FULL[revK]) return AUDIO_BY_FULL[revK];
  if (AUDIO_BY_LAST[lastK]) return AUDIO_BY_LAST[lastK];
  if (firstLastToken && AUDIO_BY_LAST[firstLastToken]) return AUDIO_BY_LAST[firstLastToken];

  if (fullK.length >= 5) {
    for (const [k, url] of Object.entries(AUDIO_BY_FULL)) {
      if (k.length >= 5 && (k.startsWith(fullK) || fullK.startsWith(k))) {
        return url;
      }
    }
  }

  return null;
}

export function getAllDefaultAudioUrls() {
  return Array.from(new Set(Object.values(AUDIO_BY_FULL)));
}
