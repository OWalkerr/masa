# Kart üretici, bölüm B: confess, chaos, homeland, spicy, clean
LIE = ["1. söz", "2. söz", "3. söz"]

confess = [
  ("confession", 2, "all", "Herkes anonim yazsın: Hayatındaki en büyük 'keşke'.", 2, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: Kimsenin bilmediği gizli yeteneğin ya da zaafın.", 1, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: Hâlâ utandığın bir an. Tek cümle, kaçamak yok.", 2, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: Ailene asla anlatamayacağın bir gece.", 2, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: En son kime ve neden yalan söyledin?", 2, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: Bu masada birine borçlu olduğun özür (isim vermeden).", 2, {}),
  ("confession", 3, "all", "Herkes anonim yazsın: Eski bir sevgiliye hâlâ söylemek istediğin tek cümle.", 3, {}),
  ("confession", 3, "all", "Herkes anonim yazsın: Kimseye itiraf etmediğin bir kıskançlık.", 3, {}),
  ("confession", 3, "all", "Herkes anonim yazsın: Şu an bu masada aklından geçen ama söylemediğin şey.", 3, {"quip": "Ben aklımdan geçeni hep söylerim. Kimse dinlemez."}),
  ("question", 1, "picked", "{secilen}, hayatında 'iyi ki yapmışım' dediğin en çılgın karar neydi?", 1, {}),
  ("question", 1, "picked", "{secilen}, gelecekteki kendine bir uyarı bırak: 'Sakın ...'", 1, {}),
  ("question", 1, "picked", "{secilen}, ilk aşkın kimdi ve şimdi nerede olduğunu biliyor musun?", 1, {}),
  ("question", 2, "picked", "{secilen}, son bir yılda seni en çok değiştiren an neydi?", 2, {}),
  ("question", 2, "picked", "{secilen}, bu masadaki birinden öğrendiğin ve ona hiç söylemediğin bir şey var mı?", 2, {}),
  ("question", 2, "picked", "{secilen}, en son ne zaman ağladın? Sebebi saçma olabilir, daha iyi.", 2, {"quip": "Gözyaşı da bir içecektir, teknik olarak."}),
  ("question", 3, "picked", "{secilen}, bir ilişkide yaptığın ve hâlâ kendini affedemediğin şey ne?", 3, {}),
  ("question", 3, "picked", "{secilen}, bu masada fikrini en çok önemsediğin kişi kim? Ona bunu hiç söyledin mi?", 2, {}),
  ("mirror", 2, "picked", "{secilen} gizlice seçsin: Bir sırrını önce kime anlatır?", 2, {"choices": "$players"}),
  ("mirror", 2, "picked", "{secilen} gizlice seçsin: Onu en çok ne korkutur?", 2, {"choices": ["Yalnız kalmak", "Başarısızlık", "Ailesine benzemek", "Sıradanlık", "Terk edilmek", "Ölüm"]}),
  ("mirror", 1, "picked", "Yalan Makinesi: {secilen}, ilk aşkınla ilgili 2 doğru 1 yalan söyle.", 1, {"choices": LIE, "tags": ["yalan"]}),
  ("mirror", 2, "picked", "Yalan Makinesi: {secilen}, ailenle ilgili 2 doğru 1 yalan söyle.", 2, {"choices": LIE, "tags": ["yalan"]}),
  ("mirror", 3, "picked", "Yalan Makinesi: {secilen}, en büyük korkularınla ilgili 2 doğru 1 yalan söyle.", 2, {"choices": LIE, "tags": ["yalan"]}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden şu an hayatından ne kadar memnunsun?", 2, {"choices": "$scale", "tags": ["olcek"]}),
  ("mirror", 3, "picked", "Ölçek: {secilen}, 10 üzerinden eski sevgilini ne kadar özlüyorsun?", 2, {"choices": "$scale", "tags": ["olcek"]}),
  ("neverHave", 1, "all", "Hiç bir arkadaşıma kırgınlığımı söylemeyip içimde büyütmedim.", 1, {}),
  ("neverHave", 2, "all", "Hiç sırf terk edilmemek için önce ben terk etmedim.", 2, {}),
  ("neverHave", 2, "all", "Hiç gece yarısı kendi kendime ağlayıp sabah hiçbir şey olmamış gibi davranmadım.", 2, {}),
  ("neverHave", 3, "all", "Hiç bu masadaki birini kıskanmadım.", 2, {}),
]

chaos = [
  ("rule", 2, "all", "Kural: Herkes her cümlesini 'efendim' diye bitirir, efendim.", 1, {"duration": 6}),
  ("rule", 2, "all", "Kural: Kimse 'evet' ya da 'hayır' diyemez. Kafa sallamak serbest.", 1, {"duration": 6}),
  ("rule", 3, "all", "Kural: İçmeden önce ayağa kalkıp masaya reverans yapmak zorunlu.", 1, {"duration": 6}),
  ("rule", 3, "all", "Kural: Okuyucu kartı okurken herkes gözlerini kapatır. Açanı yakala!", 1, {"duration": 5}),
  ("rule", 2, "all", "Kural: Kimse işaret parmağıyla bir şey gösteremez. Parmak sallayanı yakala!", 1, {"duration": 6}),
  ("rule", 2, "all", "Kural: Konuşmadan önce el kaldırıp söz istemek zorunlu. Lafa dalanı yakala!", 1, {"duration": 5}),
  ("rule", 3, "all", "Kural: Biri 'TIK' derse herkes masaya vurur. En son vuranı yakala!", 1, {"duration": 6, "quip": "Adımı anan kadehini kaldırsın."}),
  ("rule", 3, "all", "Kural: Küfür eden cümlesini 'pardon anneciğim' diye bitirir. Unutanı yakala!", 1, {"duration": 5}),
  ("curse", 3, "picked", "Lanet: {secilen} 3 tur boyunca korsan gibi konuşur. Yarrr.", 1, {"duration": 3}),
  ("curse", 2, "random", "Lanet: {rastgele} 3 tur boyunca herkese 'Hocam' diye hitap eder.", 1, {"duration": 3}),
  ("curse", 3, "picked", "Lanet: {secilen} 3 tur boyunca her cümleye 'Aslında' diye başlar.", 1, {"duration": 3}),
  ("curse", 3, "picked", "Lanet: {secilen} 3 tur boyunca her içişinde 'Bu son' der. Unutanı yakala!", 1, {"duration": 3, "quip": "Herkes böyle der. Sonra bana gelirler."}),
  ("curse", 2, "random", "Lanet: {rastgele} 3 tur boyunca bir spor spikeri gibi konuşur.", 1, {"duration": 3}),
  ("curse", 3, "picked", "Lanet: {secilen} 3 tur boyunca kimsenin sorusuna doğrudan cevap veremez.", 1, {"duration": 3}),
  ("minigame", 2, "all", "Bomba! Bu sefer fitil kısa. Elinde patlayan iç.", 2, {"minigame": "bomb"}),
  ("minigame", 3, "all", "Çifte Bomba! İki bomba aynı anda dolaşıyor. Elinde patlayan iç.", 3, {"minigame": "bomb", "tags": ["cift"], "rarity": "rare"}),
  ("minigame", 2, "all", "Refleks, kaos usulü: Bardak dolunca dokun. En geç kalan da erken atlayan da iç.", 1, {"minigame": "reflex"}),
  ("minigame", 3, "all", "Refleks, ağır ceza: Bardak dolunca dokun. En geç kalan iki kat içer.", 2, {"minigame": "reflex"}),
  ("minigame", 3, "all", "İçinden 10 say. Ama bu sefer masa seni konuşarak şaşırtabilir. 10'a en uzak kalan iç.", 2, {"minigame": "countdown"}),
  ("dare", 1, "picked", "{secilen}, 20 saniyede bir sandalyenin aşk hikâyesini Türk dizisi gibi anlat.", 1, {"timer": 20}),
  ("dare", 2, "picked", "{secilen} ve {sag}, 15 saniye boyunca dokunmadan kavga eden iki sokak kedisi olun.", 2, {"timer": 15}),
  ("dare", 2, "picked", "{secilen}, odadaki bir eşyayla 20 saniyelik dramatik bir veda sahnesi oyna.", 2, {"timer": 20}),
  ("dare", 3, "picked", "{secilen}, 30 saniye boyunca bu masanın kurucu lideriymiş gibi bir miting konuşması yap.", 2, {"timer": 30}),
  ("dare", 3, "picked", "{secilen}, ekrandaki gizli hareketi 30 saniye boyunca sürdür. Masa ne olduğunu bulamazsa iç.", 2, {"timer": 30, "tags": ["anlat"], "secret": "Görünmez bir köpeği gezdirmek|Ağır bir buzdolabı taşımak|Rüzgârda şemsiye tutmak|Çok sıcak bir çorba içmek|Asansörde sıkışmak|Uyuyan bebeği uyandırmadan kapı açmak"}),
  ("duel", 2, "twoPicked", "Düello: {secilen} ve {ikinci} kelime kelime ortak hikâye anlatsın. İlk takılan kaybeder.", 2, {}),
  ("duel", 3, "twoPicked", "Düello: {secilen} ve {ikinci} 10 saniyede masaya en çok iltifat yağdırsın.", 2, {"timer": 10}),
  ("duel", 2, "twoPicked", "Düello: {secilen} ve {ikinci} aynı anda kendi ölümlerini dramatik şekilde oynasın.", 2, {"quip": "Profesyonel olarak söylüyorum: ikisi de amatör."}),
  ("duel", 3, "twoPicked", "Düello: {secilen} ve {ikinci} karşılıklı 'Ben senden daha…' diye övünsün. İlk susan kaybeder.", 2, {}),
  ("mission", 2, "random", "Sabotajcı: Biri 3 tur içinde masayı sabote edecek. Sezersen Yakala!", 2, {"duration": 3, "secret": "Okuyucu kart okurken bir kez araya girip konuyu değiştir.|Birinin kadehini ya da bardağını fark ettirmeden yerinden oynat.|Bir kuralı bilerek boz ama kimse yakalamasın.|Birine 'senin sıran' de, sıra onda değilken."}),
  ("mission", 3, "random", "Kukla Ustası: Biri 3 tur içinde birilerine bir şey yaptıracak. Ajanı yakala!", 2, {"duration": 3, "secret": "Birini ayağa kaldır, 'kalk' demeden.|İki kişiye aynı anda kadeh tokuşturt.|Birine bir şarkı mırıldandır.|Birini kendi yerine bir şey getirmeye ikna et."}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden şu an ne kadar kaos istiyorsun?", 1, {"choices": "$scale", "tags": ["olcek"]}),
  ("mirror", 3, "picked", "Yalan Makinesi: {secilen}, en tuhaf gecenle ilgili 2 doğru 1 yalan anlat.", 2, {"choices": LIE, "tags": ["yalan"]}),
  ("tableEvent", 2, "all", "Kral Çıplak: Bir sonraki kart bitene kadar herkes okuyucuya 'Majesteleri' der.", 1, {"input": "catch", "duration": 1}),
  ("tableEvent", 3, "all", "Sessiz Film: Bir sonraki kart bitene kadar kimse konuşamaz. Ses çıkaranı yakala!", 1, {"input": "catch", "duration": 1}),
  ("golden", 3, "reader", "Mezardan Dönüş: Bu gece içtiğin son 3 cezayı seçtiğin birine devret. O içsin.", 0, {"rarity": "legendary", "input": "votePlayer", "tags": ["devir"], "id": "gold-04"}),
  ("question", 2, "all", "Herkes sırayla: Bu masada kimle bir banka soyardın, kimi asla götürmezdin?", 2, {}),
  ("mostLikely", 2, "all", "Kim bu oyunun kurallarını en çok çiğneyip yakalanmamıştır?", 2, {}),
  ("mostLikely", 3, "all", "Kim kaos çıkınca ortadan kaybolup sonra 'ben yoktum' der?", 2, {}),
  ("neverHave", 2, "all", "Hiç bir partide sırf kaos olsun diye bir yalan uydurmadım.", 2, {}),
  ("neverHave", 3, "all", "Hiç bir grubun içinde iki tarafa ayrı ayrı haklısın demedim.", 2, {}),
]

homeland = [
  ("question", 1, "picked", "{secilen}, bir düğünde yaptığın en utanç verici şey neydi?", 1, {}),
  ("question", 1, "picked", "{secilen}, hayatın Yeşilçam filmi olsa adı ne olurdu, kötü adamı kim olurdu?", 1, {}),
  ("question", 1, "picked", "{secilen}, aile WhatsApp grubunda en son kim, ne yüzünden kavga etti?", 1, {"quip": "Ölülerin de grubu var. Kimse günaydın atmıyor, huzur."}),
  ("question", 2, "picked", "{secilen}, bayramda en çok kaçtığın akraba kim ve neden?", 2, {}),
  ("question", 2, "picked", "{secilen}, annenin seninle ilgili hâlâ bilmediği en büyük şey ne?", 2, {}),
  ("question", 2, "all", "Herkes sırayla: 'Ne zaman evleniyorsun?' sorusuna verdiğin en iyi cevap.", 1, {}),
  ("dare", 1, "picked", "{secilen}, halay başı gibi peçete sallayarak masaya 15 saniyelik bir anons yap.", 1, {"timer": 15}),
  ("dare", 1, "picked", "{secilen}, minibüs şoförü gibi masadakileri tek tek, durağında indir.", 1, {}),
  ("dare", 2, "picked", "{secilen}, teyze moduna gir ve {rastgele} kişisine 20 saniye 'Ne zaman evleniyorsun?' sohbeti aç.", 2, {"timer": 20}),
  ("dare", 2, "picked", "{secilen}, düğün DJ'i gibi bu masayı coştur. 20 saniye, 'Ellerinizi görelim!' zorunlu.", 2, {"timer": 20}),
  ("dare", 2, "picked", "{secilen}, kayınvalide gibi {sag} kişisinin bu akşamki her şeyini kibarca eleştir.", 2, {"quip": "Kibarca eleştiri, Anadolu'nun en eski sanatıdır."}),
  ("dare", 1, "picked", "{secilen}, pazarcı gibi {rastgele} kişisini tezgâha çıkar: 'Gel abla gel, bu fiyata yok!'", 1, {}),
  ("dare", 2, "picked", "{secilen}, ekrandaki Türk aile anını sadece hareketle anlat. 60 sn. Bilinmezse iç.", 2, {"timer": 60, "tags": ["anlat"], "secret": "Bayram el öpme sırası|Misafir gelince sehpayı kurmak|Kolonya tutmak|Düğünde para takmak|Hesabı kapma kavgası|Dolmuşta para uzatmak|Annenin 'Bir dakika' demesi|Kızı isteme töreni"}),
  ("mostLikely", 1, "all", "Kim bayram ziyaretinde kolonyayı herkesin üstüne döker?", 1, {}),
  ("mostLikely", 1, "all", "Kim nikâhta ayakkabı pazarlığını en sıkı yapar?", 1, {}),
  ("mostLikely", 1, "all", "Kim bir hafta içinde mahallenin çay ocağının müdavimi olur?", 1, {}),
  ("mostLikely", 1, "all", "Kim hesap kavgasında 'Ayıp ediyorsun' deyip kartı ilk uzatan olur?", 1, {}),
  ("mostLikely", 2, "all", "Kim annesinin 'Sen bilirsin' cümlesindeki tehdidi en geç anlar?", 1, {}),
  ("mostLikely", 2, "all", "Kim düğünde masadaki tüm lokumları çantasına doldurur?", 1, {}),
  ("mostLikely", 2, "all", "Kim kız isteme töreninde kahveye tuz konduğunu fark etmeden içer?", 1, {}),
  ("mostLikely", 3, "all", "Kim kayınvalidesiyle aynı evde yaşamaya en kısa dayanır?", 2, {}),
  ("neverHave", 1, "all", "Hiç takı töreninden kaçmak için tuvalete saklanmadım.", 1, {}),
  ("neverHave", 1, "all", "Hiç 'Ben tokum' deyip sonra masada en çok yiyen olmadım.", 1, {}),
  ("neverHave", 1, "all", "Hiç bayram harçlığımı ailemden saklamadım.", 1, {}),
  ("neverHave", 2, "all", "Hiç aileme bir sevgiliyi 'arkadaşım' diye tanıtmadım.", 2, {}),
  ("neverHave", 2, "all", "Hiç babamın arabasını izinsiz alıp bir şey olmamış gibi geri koymadım.", 2, {}),
  ("rule", 1, "all", "Kural: Herkes konuşmaya 'Valla' diye başlar. Unutanı yakala!", 1, {"duration": 5}),
  ("rule", 2, "all", "Kural: İçmeden önce 'Afiyet olsun' denir, karşıdakinin 'Sağ ol' demesi şart.", 1, {"duration": 5}),
  ("mirror", 1, "picked", "{secilen} gizlice seçsin: Kahvaltıda olmazsa olmazı ne?", 1, {"choices": ["Sucuklu yumurta", "Simit", "Menemen", "Bal kaymak", "Sadece çay", "Kahvaltı etmez"]}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden ailen senin sevgilini ne kadar sorguluyor?", 2, {"choices": "$scale", "tags": ["olcek"]}),
  ("mirror", 2, "picked", "Yalan Makinesi: {secilen}, bayram anılarınla ilgili 2 doğru 1 yalan anlat.", 1, {"choices": LIE, "tags": ["yalan"]}),
  ("golden", 2, "reader", "Ağa Kartı: Perde sonuna kadar herkes sana 'Ağam' diye seslenir. Unutanı yakala!", 1, {"rarity": "legendary", "input": "catch", "duration": "act", "id": "homeland-g-01"}),
  ("mission", 2, "random", "Dedikodu Teyzesi: Biri 3 tur içinde bir dedikodu yayacak. Ajanı yakala!", 2, {"duration": 3, "secret": "Birine 'Duydun mu, ...' diye uydurma bir haber ver.|Birinin ne zaman evleneceğini 2 kez sor.|Birine 'Kilo mu verdin?' yerine 'Yorgun görünüyorsun' de.|Birine 'Senin annen ne iş yapıyordu?' diye sor."}),
]

spicy = [
  ("question", 1, "picked", "{secilen}, başına gelen en kötü ilk buluşmayı anlat. İsim vermek serbest.", 1, {"tags": ["flort"]}),
  ("question", 1, "picked", "{secilen}, bir tanışma uygulamasında yazdığın en utanç verici açılış mesajı neydi?", 1, {"tags": ["flort"]}),
  ("question", 2, "picked", "{secilen}, bu masada ilk görüşte kimi çekici bulmuştun?", 2, {"tags": ["flort"]}),
  ("question", 2, "picked", "{secilen}, 'asla yapmam' deyip sonra yaptığın en cesur romantik şey ne?", 2, {"tags": ["flort"]}),
  ("question", 2, "picked", "{secilen}, en tuhaf yerde öpüştüğün yer neresiydi?", 2, {"tags": ["flort"], "quip": "Benimki mezarlık. Romantikti."}),
  ("question", 2, "picked", "{secilen}, partnerinde asla vazgeçemeyeceğin tek şey ne? Tek kelime.", 1, {"tags": ["flort"]}),
  ("question", 3, "picked", "{secilen}, telefonundaki en son flörtöz mesajı yüksek sesle oku ya da iç.", 3, {"tags": ["flort", "telefon"]}),
  ("question", 3, "picked", "{secilen}, hayatındaki en kısa ama en etkileyici ilişki hangisiydi?", 2, {"tags": ["flort"]}),
  ("question", 3, "all", "Herkes sırayla: Seni anında soğutan tek bir hareket. Söylemeyen iç.", 2, {"tags": ["flort"]}),
  ("dare", 1, "picked", "{secilen}, {rastgele} kişisine bildiğin en kötü tavlama replikleriyle 15 saniye kur yap.", 1, {"tags": ["flort"], "timer": 15}),
  ("dare", 2, "picked", "{secilen}, {rastgele} kişisini bir romantik komedinin finalindeki gibi 'durdur, gitme!' diye ikna et.", 2, {"tags": ["flort"]}),
  ("dare", 2, "picked", "{secilen}, sesini en çekici haline getir ve masaya hava durumunu sun.", 1, {"tags": ["flort"], "quip": "Gece yarısı, nem yüzde yüz, kalpler kırık."}),
  ("dare", 3, "picked", "{secilen}, gizli kelimeyi sadece bakışlarınla ve tek bir kelimeyle anlat. Bilinmezse iç.", 2, {"tags": ["flort", "anlat"], "secret": "İlk öpücük|Ertesi sabah|Eski sevgili|Kıskançlık krizi|Gece yarısı mesajı|Balayı"}),
  ("dare", 3, "picked", "{secilen}, {rastgele} ile 10 saniye çok yakın göz teması kur. İlk kaçıran iç.", 2, {"tags": ["flort", "temas"], "timer": 10}),
  ("mostLikely", 1, "all", "Kim bir ilk buluşmada hesabı ödemekten kaçmak için tuvalete gider?", 1, {"tags": ["flort"]}),
  ("mostLikely", 2, "all", "Kim bu masada en çok kalp kırmıştır?", 2, {"tags": ["flort"]}),
  ("mostLikely", 2, "all", "Kim aynı anda üç kişiyle yazışıp hiçbirini karıştırmaz?", 2, {"tags": ["flort"]}),
  ("mostLikely", 2, "all", "Kim eski sevgilisiyle bir gece için 'son kez' buluşur, üç kez?", 2, {"tags": ["flort"]}),
  ("mostLikely", 3, "all", "Kim bu masadaki birine en çok mesaj atmak isteyip atamıyor?", 3, {"tags": ["flort"]}),
  ("mostLikely", 3, "all", "Kim yatak odasında en çok sürpriz yapar?", 3, {"tags": ["flort"]}),
  ("neverHave", 1, "all", "Hiç bir randevudan kaçmak için sahte acil durum uydurmadım.", 1, {"tags": ["flort"]}),
  ("neverHave", 2, "all", "Hiç biriyle ilk buluşmada öpüşmedim.", 2, {"tags": ["flort"]}),
  ("neverHave", 2, "all", "Hiç bir eski sevgiliyle ayrıldıktan sonra tekrar bir gece geçirmedim.", 2, {"tags": ["flort"]}),
  ("neverHave", 2, "all", "Hiç bir mesajı sevgilim görmesin diye silmedim.", 2, {"tags": ["flort"]}),
  ("neverHave", 3, "all", "Hiç bu masadaki biri hakkında romantik bir rüya görmedim.", 3, {"tags": ["flort"]}),
  ("neverHave", 3, "all", "Hiç bir arkadaşımın eski sevgilisiyle flört etmedim.", 3, {"tags": ["flort"]}),
  ("mirror", 2, "picked", "{secilen} gizlice seçsin: Bu masadan kiminle bir romantik komedide başrol oynar?", 2, {"tags": ["flort"], "choices": "$players"}),
  ("mirror", 2, "picked", "{secilen} gizlice seçsin: Onu en çok hangisi etkiler?", 1, {"tags": ["flort"], "choices": ["Mizah", "Zekâ", "Ses", "Gözler", "Özgüven", "Yemek yapmak"]}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden ne kadar romantiksin? Masa tahmin etsin.", 2, {"tags": ["flort", "olcek"], "choices": "$scale"}),
  ("mirror", 3, "picked", "Ölçek: {secilen}, 10 üzerinden şu an ne kadar bekârsın? (1: evli, 10: Tinder'da)", 2, {"tags": ["flort", "olcek"], "choices": "$scale"}),
  ("mirror", 3, "picked", "Yalan Makinesi: {secilen}, öpüşme anılarınla ilgili 2 doğru 1 yalan söyle.", 2, {"tags": ["flort", "yalan"], "choices": LIE}),
  ("confession", 3, "all", "Herkes anonim yazsın: Bu masadaki birine dair en cesur düşüncen (isim yok).", 3, {"tags": ["flort"]}),
  ("confession", 2, "all", "Herkes anonim yazsın: En kötü yatak odası anın, tek cümlede.", 2, {"tags": ["flort"]}),
  ("duel", 2, "twoPicked", "Düello: {secilen} ve {ikinci} masaya en etkileyici tavlama sözünü söylesin. Masa seçer.", 2, {"tags": ["flort"]}),
  ("mission", 3, "random", "Kalp Hırsızı: Biri 3 tur içinde birini tavlamaya çalışacak. Ajanı yakala!", 2, {"tags": ["flort"], "duration": 3, "secret": "Birine 3 farklı iltifat et, fark ettirme.|Birine göz kırp ve o seni fark etsin.|Birinin bir sözüne kahkahayla gül, 3 kez.|Birine 'Bu akşam çok güzel/yakışıklı olmuşsun' de."}),
]

clean = [
  ("question", 1, "picked", "{secilen}, ilk kazandığın parayla ne almıştın ve hâlâ duruyor mu?", 1, {}),
  ("question", 1, "picked", "{secilen}, çocukken en çok neyden korkardın? Hâlâ korkuyor musun?", 1, {}),
  ("question", 1, "picked", "{secilen}, iş yerinde ya da okulda başına gelen en komik yanlış anlaşılma neydi?", 1, {}),
  ("question", 1, "picked", "{secilen}, hayatında söylediğin en saçma bahane neydi ve işe yaradı mı?", 1, {}),
  ("question", 1, "picked", "{secilen}, bir günlüğüne bu masadan birinin yerine geçsen kimin, ne yapardın?", 1, {}),
  ("question", 1, "all", "Herkes sırayla: En sevdiğin bayram anısı. Kısa olsun, harçlık dahil.", 1, {}),
  ("question", 1, "all", "Herkes sırayla: Bir süper gücün olsa hangisi ve onu en saçma ne için kullanırdın?", 1, {}),
  ("question", 2, "picked", "{secilen}, hayatının en garip tesadüfü neydi?", 1, {}),
  ("question", 2, "picked", "{secilen}, bu masadan birine teşekkür etmediğin bir şey var mı? Şimdi et.", 1, {}),
  ("dare", 1, "picked", "{secilen}, 20 saniyede bir kaşığı alkış alacak şekilde tanıt.", 1, {"timer": 20}),
  ("dare", 1, "picked", "{secilen}, {sag} kişisinin en sevdiği yemeği tahmin et. Bilemezsen ceza.", 1, {}),
  ("dare", 1, "picked", "{secilen}, haber spikeri gibi bu masanın bugünkü en önemli haberini sun.", 1, {}),
  ("dare", 1, "picked", "{secilen}, 15 saniye boyunca bir müze rehberi gibi bu odayı gezdir.", 1, {"timer": 15}),
  ("dare", 2, "picked", "{secilen}, ekrandaki şeyi konuşmadan, sadece hareketle anlat. 60 sn. Bilinmezse ceza.", 1, {"timer": 60, "tags": ["anlat"], "secret": "Çamaşır asmak|Otobüse yetişmek|Kek kabarmayınca|Fotoğrafta göz kapanması|Toplantıda donan internet|Kedinin vazoyu düşürmesi|Bavula her şeyi sığdırmak|Kaybolan uzaktan kumanda"}),
  ("dare", 2, "picked", "{secilen}, {rastgele} ile bir çizgi film kavgası canlandırın. 15 saniye, sesli efekt şart.", 1, {"timer": 15}),
  ("dare", 2, "picked", "{secilen}, masadan birini 30 saniyede bir belgeselin konusu gibi anlat.", 1, {"timer": 30}),
  ("mostLikely", 1, "all", "Kim bir toplantıda en çok 'Sesim geliyor mu?' der?", 1, {}),
  ("mostLikely", 1, "all", "Kim bayramda en çok harçlık toplardı?", 1, {}),
  ("mostLikely", 1, "all", "Kim bir tarifi tamamen değiştirip sonra tarifi suçlar?", 1, {}),
  ("mostLikely", 1, "all", "Kim bir oyunda kaybedince 'Ben zaten ciddi oynamıyordum' der?", 1, {}),
  ("mostLikely", 1, "all", "Kim telefonunda 40 sekme açık tutar ve hepsine 'lazım' der?", 1, {}),
  ("mostLikely", 1, "all", "Kim kaybolunca 'Kestirmeden gidiyoruz' diye ısrar eder?", 1, {}),
  ("mostLikely", 2, "all", "Kim bir bitkiye isim koyar ve onunla konuşur?", 1, {}),
  ("mostLikely", 2, "all", "Kim bir filmin sonunu herkesten önce tahmin edip söyleyerek filmi mahveder?", 1, {}),
  ("neverHave", 1, "all", "Hiç bir toplantıda kameramı kapatıp uyuklamadım.", 1, {}),
  ("neverHave", 1, "all", "Hiç markette yanlış kişinin arabasını ittirmedim.", 1, {}),
  ("neverHave", 1, "all", "Hiç bir kitabı okumadan okumuş gibi yorum yapmadım.", 1, {}),
  ("neverHave", 1, "all", "Hiç asansörde aynaya bakıp kendime poz vermedim.", 1, {}),
  ("neverHave", 2, "all", "Hiç arkamdakine el sallayan birine ben el sallamadım.", 1, {}),
  ("mirror", 1, "picked", "{secilen} gizlice seçsin: Hangi devirde yaşamak isterdi?", 1, {"choices": ["Osmanlı sarayı", "Yeşilçam", "Taş devri", "Gelecek", "80'ler", "Vahşi Batı"]}),
  ("mirror", 1, "picked", "Yalan Makinesi: {secilen}, kendinle ilgili 2 doğru 1 yalan söyle. Masa yalanı bulsun.", 1, {"choices": LIE, "tags": ["yalan"]}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden ne kadar iyi yemek yaparsın? Masa tahmin etsin.", 1, {"choices": "$scale", "tags": ["olcek"]}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden ne kadar dağınıksın?", 1, {"choices": "$scale", "tags": ["olcek"]}),
  ("rule", 1, "all", "Kural: Kimse 'aynen' diyemez. Ağzından kaçanı yakala!", 1, {"duration": 5}),
  ("rule", 2, "all", "Kural: Herkes cümlesine bir hayvan adı sıkıştırmak zorunda. Unutanı yakala!", 1, {"duration": 5}),
  ("curse", 2, "picked", "Lanet: {secilen} 3 tur boyunca her cümlesini kafiyeli bitirmeye çalışır.", 1, {"duration": 3}),
  ("duel", 1, "twoPicked", "Düello: {secilen} ve {ikinci} 10 saniyede en çok meyve sayan olsun. Masa sayar.", 1, {"timer": 10}),
  ("duel", 2, "twoPicked", "Düello: {secilen} ve {ikinci} aynı eşyayı sırayla övsün. İlk takılan kaybeder.", 1, {}),
  ("confession", 2, "all", "Herkes anonim yazsın: Kimsenin bilmediği tuhaf bir alışkanlığın.", 1, {}),
  ("minigame", 2, "all", "Refleks: Çay bardağı dolunca dokun. En geç kalan da erken atlayan da ceza alır.", 1, {"minigame": "reflex"}),
  ("minigame", 2, "all", "İçinden 10 saniye say ve dokun. 10'a en uzak kalan ceza alır.", 1, {"minigame": "countdown"}),
  ("mission", 2, "random", "Gizli Görev: Biri 3 tur içinde bir şey çevirecek. Fark eden Yakala!", 1, {"duration": 3, "secret": "Birine 'haklısın' dedirt.|Herkese bir kez gülümse, biri 'ne oldu?' desin.|Birine en sevdiği filmi sordur.|Sohbeti hava durumuna getir."}),
  ("tableEvent", 1, "all", "Yer Değiştirme: Herkes bir sandalye sağa kayar. Telefonlar sahibinde kalır.", 0, {}),
]

# --- Karakalem (çizim) ---
W_MEYHANE = "Rakı/Rakı şişesi|Meze|Kadeh|Garson|Hesap|Akşamdan kalma|Buz kovası|Kavun|Beyaz peynir|Fasıl|Sarhoş|Midye dolma|Kokoreç"
W_EV = "Kombi|Çamaşır makinesi|Elektrik faturası|Ev sahibi|Komşu|Kapıcı|Terlik|Uzaktan kumanda|Kanepe|Bulaşık|Örümcek ağı|Priz"
W_MEMLEKET = "Dolmuş|Kolonya|Kız isteme|Düğün salonu|Halay|Simit|Çay bardağı|Nazar boncuğu|Lokum|Takı töreni|Bayram harçlığı|Seccade/Kilim|Teyze"
W_GOTIK = "Vampir|Mezar taşı|Hortlak|Cadı süpürgesi|Yarasa|Tabut|Kurt adam|Kuzgun|Örümcek|Balkabağı|Kafatası|Perili ev|Mum|Zombi"
W_ASK = "İlk buluşma|Ayrılık|Kıskançlık|Nişan yüzüğü|Eski sevgili|Görüldü|Kalp kırıklığı|Sevgililer günü|Gül|Mektup|Düğün pastası|Kayınvalide/Kaynana"
W_IS = "Zam|Toplantı|Patron|Mesai|İstifa|Maaş günü|Kahve makinesi|Yılbaşı ikramiyesi|Excel|Stajyer|Pazartesi|Tatil"
W_TEKNO = "Şarj aleti|Wi-Fi|Selfie|Sesli mesaj|Emoji|Kulaklık|Bildirim|Şifre|Ekran görüntüsü|Telefon/Cep telefonu|Robot süpürge|Drone"
W_HAYVAN = "Sokak kedisi|Martı|Kaplumbağa|Zürafa|Penguen|Ahtapot|Köpek balığı|Tavus kuşu|Salyangoz|Deve|Flamingo|Kirpi"
W_DEYIM = "Dut yemiş bülbül|Pireyi deve yapmak|Ağzı kulaklarında|Etekleri zil çalmak|Ayvayı yemek|Tabanları yağlamak|Kulağına küpe olmak|Saman altından su yürütmek|Dereyi görmeden paçaları sıvamak|Gözden düşmek|İki ayağını bir pabuca sokmak|Burnundan kıl aldırmamak"
W_ATASOZU = "Damlaya damlaya göl olur|Sakla samanı gelir zamanı|Ağaç yaşken eğilir|Üzüm üzüme baka baka kararır|Ayağını yorganına göre uzat|Balık baştan kokar|Dost kara günde belli olur|Her yiğidin bir yoğurt yiyişi vardır"
W_FLORT = "Öpücük|Tinder|Balayı|Ertesi sabah|Mum ışığında akşam yemeği|Aşk mektubu|Göz kırpmak|Dans|Şampanya|Gece yarısı mesajı"

sketch = [
  ("sketch", 1, "picked", "Karakalem: {secilen}, meyhaneden bir şey çiz. Harf yazmak yasak, ok çizmek serbest.", 1, {"timer": 75, "secret": W_MEYHANE, "quip": "Ben rakıyım. Beni çizen hep iki kere çizer."}),
  ("sketch", 1, "picked", "Karakalem: {secilen}, evden bir dert çiz. Bilemeyen içer, kimse bilemezse sen.", 1, {"timer": 75, "secret": W_EV}),
  ("sketch", 1, "picked", "Karakalem: {secilen}, memleketten bir şey çiz. Teyzeler izliyor.", 1, {"timer": 75, "secret": W_MEMLEKET}),
  ("sketch", 1, "picked", "Karakalem: {secilen}, mezarlıktan bir misafir çiz.", 1, {"timer": 75, "secret": W_GOTIK, "quip": "Bunlar benim akrabalar. Güzel çiz."}),
  ("sketch", 1, "picked", "Karakalem: {secilen}, bir hayvan çiz. Kedi değilse bile kedi gibi olacak, biliyoruz.", 1, {"timer": 75, "secret": W_HAYVAN}),
  ("sketch", 2, "picked", "Karakalem: {secilen}, aşk hayatından bir sahne çiz. Kimse sormayacak, söz.", 1, {"timer": 75, "secret": W_ASK}),
  ("sketch", 2, "picked", "Karakalem: {secilen}, iş hayatından bir kâbus çiz.", 1, {"timer": 75, "secret": W_IS}),
  ("sketch", 2, "picked", "Karakalem: {secilen}, telefonundan çıkmayan bir şeyi çiz.", 1, {"timer": 75, "secret": W_TEKNO}),
  ("sketch", 2, "random", "Karakalem: Sıra {rastgele}'de. Memleketten bir sahne, 60 saniye.", 1, {"timer": 60, "secret": W_MEMLEKET}),
  ("sketch", 3, "picked", "Deyim Çiz: {secilen}, ekrandaki deyimi çiz. Masa bilemezse sen içersin.", 2, {"timer": 90, "secret": W_DEYIM, "quip": "Dut yemiş bülbülü çizen herkes önce dut çizer. Hata."}),
  ("sketch", 3, "picked", "Atasözü Çiz: {secilen}, bir atasözünü çiz. Dedeler gurur duysun.", 2, {"timer": 90, "secret": W_ATASOZU}),
  ("sketch", 3, "random", "Deyim Çiz: {rastgele}, sana bir deyim düştü. 90 saniye. Kolay gelsin.", 2, {"timer": 90, "secret": W_DEYIM}),
  # Tek Çizgi: kalem kalkarsa biter
  ("sketch", 1, "picked", "Tek Çizgi: {secilen}, kalemi hiç kaldırmadan çiz. Kalktığı an çizim biter.", 1, {"timer": 45, "tags": ["tekcizgi"], "secret": W_HAYVAN}),
  ("sketch", 2, "picked", "Tek Çizgi: {secilen}, mezarlıktan biri. Tek çizgi, tek şans.", 1, {"timer": 45, "tags": ["tekcizgi"], "secret": W_GOTIK}),
  ("sketch", 2, "picked", "Tek Çizgi: {secilen}, meyhaneden bir şey. Kalem kalkarsa kadeh kalkar.", 1, {"timer": 45, "tags": ["tekcizgi"], "secret": W_MEYHANE}),
  ("sketch", 3, "picked", "Tek Çizgi: {secilen}, bir deyimi tek çizgiyle çiz. Evet, ciddiyiz.", 2, {"timer": 60, "tags": ["tekcizgi"], "secret": W_DEYIM}),
  # Kör Ressam: çizen kendi çizgisini görmez
  ("sketch", 1, "picked", "Kör Ressam: {secilen}, çizdiğini göremeyeceksin. Ekran karanlık, el titrek.", 1, {"timer": 60, "tags": ["kor"], "secret": W_EV}),
  ("sketch", 2, "picked", "Kör Ressam: {secilen}, aşk hayatından bir şey, gözü kapalı gibi.", 1, {"timer": 60, "tags": ["kor"], "secret": W_ASK}),
  ("sketch", 2, "picked", "Kör Ressam: {secilen}, bir hayvanı görmeden çiz. Picasso da böyle başladı.", 1, {"timer": 60, "tags": ["kor"], "secret": W_HAYVAN, "quip": "Ben de görmeden çizerim. Gözüm yok çünkü."}),
  ("sketch", 3, "picked", "Kör Ressam: {secilen}, bir deyim, görmeden. Masa dua etsin.", 2, {"timer": 75, "tags": ["kor"], "secret": W_DEYIM}),
  # Ters El
  ("sketch", 1, "picked", "Ters El: {secilen}, öbür elinle çiz. Masa kontrol ediyor, hile yok.", 1, {"timer": 75, "tags": ["tersel"], "secret": W_MEMLEKET}),
  ("sketch", 2, "picked", "Ters El: {secilen}, iş hayatından bir şeyi ters elle çiz.", 1, {"timer": 75, "tags": ["tersel"], "secret": W_IS}),
  ("sketch", 2, "picked", "Ters El: {secilen}, teknolojiden bir şey, ters elle. Telefonu tutan el yasak.", 1, {"timer": 75, "tags": ["tersel"], "secret": W_TEKNO}),
  # Hızlı
  ("sketch", 1, "picked", "Yıldırım: {secilen}, 30 saniyen var. Ne çizersen o.", 1, {"timer": 30, "tags": ["hizli"], "secret": W_GOTIK}),
  ("sketch", 2, "picked", "Yıldırım: {secilen}, 30 saniyede meyhane. Rakı soğumadan.", 1, {"timer": 30, "tags": ["hizli"], "secret": W_MEYHANE}),
  ("sketch", 2, "random", "Yıldırım: {rastgele}, 30 saniye, bir hayvan. Hadi!", 1, {"timer": 30, "tags": ["hizli"], "secret": W_HAYVAN}),
  # Flört (yalnızca 18+ ve katılımı açık olanlar)
  ("sketch", 2, "picked", "Karakalem 18+: {secilen}, romantik bir şey çiz. Çok romantik olmasın, masa var.", 1, {"timer": 75, "tags": ["flort"], "secret": W_FLORT}),
  ("sketch", 3, "picked", "Kör Ressam 18+: {secilen}, romantik bir sahneyi görmeden çiz.", 2, {"timer": 60, "tags": ["flort", "kor"], "secret": W_FLORT}),
  # Diğer türlerle karışık (çizim modu sadece çizimden ibaret olmasın)
  ("mostLikely", 1, "all", "Kim bu masada en kötü çizer ama en çok iddia eder?", 1, {}),
  ("mostLikely", 2, "all", "Kim bir resim sergisinde 'Bunu ben de yaparım' der?", 1, {}),
  ("neverHave", 1, "all", "Hiç bir toplantıda deftere saçma şeyler karalamadım.", 1, {}),
  ("question", 1, "picked", "{secilen}, çocukken duvara çizdiğin en büyük eser neydi ve bedelini kim ödedi?", 1, {}),
  ("duel", 2, "twoPicked", "Düello: {secilen} ve {ikinci} aynı anda parmağıyla havaya bir vampir çizsin. Masa daha iyisini seçer.", 1, {}),
]

confess += [
  ("confession", 2, "all", "Herkes anonim yazsın: Bu yıl kendine verdiğin ama tutmadığın bir söz.", 1, {}),
  ("confession", 3, "all", "Herkes anonim yazsın: Hiç kimseye anlatmadığın küçük bir zaferin.", 1, {}),
  ("question", 2, "picked", "{secilen}, 10 yıl önceki kendine şu an bir mesaj atabilsen ne yazardın?", 1, {}),
  ("question", 3, "picked", "{secilen}, hayatında özür dilemen gereken ama dilemediğin biri var mı? Ne olurdu?", 2, {}),
  ("mirror", 2, "picked", "Ölçek: {secilen}, 10 üzerinden ne kadar affedicisin? Masa tahmin etsin.", 1, {"choices": "$scale", "tags": ["olcek"]}),
  ("neverHave", 2, "all", "Hiç bir arkadaşımın başarısını içten içe kıskanıp yüzüne tebrik etmedim.", 2, {}),
]

chaos += [
  ("rule", 3, "all", "Kural: Herkes konuşurken bir elini başının üstünde tutar. İndireni yakala!", 1, {"duration": 4}),
  ("curse", 3, "picked", "Lanet: {secilen} 3 tur boyunca her cümlesine kendi adını ekler. Örnek: 'Ben Ayşe, susuyorum.'", 1, {"duration": 3}),
  ("dare", 3, "picked", "{secilen}, bu masayı bir kötü adam gibi tehdit et. 20 saniye, gülersen iç.", 2, {"timer": 20}),
  ("minigame", 3, "all", "Bomba, son perde: Fitil kısa, ceza ağır. Elinde patlayan iç.", 3, {"minigame": "bomb"}),
  ("mostLikely", 2, "all", "Kim bu oyunu kazanmak için hile yapar ve yakalanınca 'şakaydı' der?", 1, {}),
  ("duel", 3, "twoPicked", "Düello: {secilen} ve {ikinci} 15 saniye birbirine bakarak ciddi kalsın. Gülen kaybeder.", 2, {"timer": 15}),
]

# --- Sergi (herkes aynı konuyu çizer, isimsiz galeri, en kötü eser içer) ---
G_AILE = "Kayınvalide pazar sabahı|Teyze düğünde dans ederken|Ev sahibi kira artırırken|Patron zam istediğinde|Bayramda el öpme kuyruğu|Aile WhatsApp grubunun bir günü"
G_GOTIK = "Vampir diş hekiminde|Hayaletin ilk randevusu|Zombi spor salonunda|Cadının süpürgesi bozulunca|Kurt adam berberde|Mezarlıkta doğum günü partisi"
G_HAYAT = "Pazartesi sabahı|Akşamdan kalma bir pazar|İnternetin kesildiği an|Kombinin bozulduğu kış gecesi|Son otobüsü kaçırmak|Maaşın yattığı gün"
G_MASA = "TIK'in düğün fotoğrafı|Bu gecenin özeti|Masanın 20 yıl sonraki buluşması|Rakı şişesinin hayat hikâyesi|Meyhanede kapanış saati|Garsonun en kötü gecesi"
G_DEYIM = "Ağzı kulaklarında|Burnundan kıl aldırmamak|Pireyi deve yapmak|Etekleri zil çalmak|Ayvayı yemek|Dut yemiş bülbül"
G_FLORT = "Felaket bir ilk buluşma|Tinder eşleşmesi|Ertesi sabah|Kıskançlık krizi|Eski sevgiliyle karşılaşmak"

sketch += [
  ("gallery", 1, "all", "Sergi: Herkes 45 saniyede ekrandaki konuyu çizsin. Galeride en kötü eserin sanatçısı içer.", 1, {"timer": 45, "secret": G_AILE, "quip": "Sanat acı çekmektir. Bu gece sizinki."}),
  ("gallery", 1, "all", "Gotik Sergi: Herkes aynı korku sahnesini çizsin. En kötü eser sahibine içirir.", 1, {"timer": 45, "secret": G_GOTIK}),
  ("gallery", 1, "all", "Sergi: Hayatın küçük felaketleri. Herkes çizer, galeri isimsiz açılır, en kötüsü içer.", 1, {"timer": 45, "secret": G_HAYAT}),
  ("gallery", 2, "all", "Meyhane Sergisi: Bu masanın sanat tarihi. 45 saniye, isimsiz galeri, en kötüsü içer.", 1, {"timer": 45, "secret": G_MASA}),
  ("gallery", 2, "all", "Hızlı Sergi: 25 saniye! Herkes aynı konuyu çizer. En kötü eser içer.", 1, {"timer": 25, "secret": G_HAYAT}),
  ("gallery", 3, "all", "Deyim Sergisi: Herkes aynı deyimi çizsin. Galeride en kötüsü iki kat içer.", 2, {"timer": 60, "secret": G_DEYIM}),
  ("gallery", 3, "all", "Gotik Sergi, son perde: 40 saniye, en kötü eser iki kat içer.", 2, {"timer": 40, "secret": G_GOTIK}),
  ("gallery", 2, "all", "Sergi 18+: Romantik felaketleri çizin. En kötü eser içer.", 1, {"timer": 45, "tags": ["flort"], "secret": G_FLORT}),
]

chaos += [
  ("gallery", 2, "all", "Kaos Sergisi: 30 saniye, herkes aynı konuyu çizer. En kötü eser iki kat içer.", 2, {"timer": 30, "secret": "Pazartesi sabahı|Bu gecenin özeti|Garsonun en kötü gecesi|Zombi spor salonunda"}),
]
clean += [
  ("gallery", 1, "all", "Sergi: Herkes 45 saniyede aynı konuyu çizsin. Galeride en kötü eserin sanatçısı ceza alır.", 1, {"timer": 45, "secret": "Pazartesi sabahı|İnternetin kesildiği an|Kombinin bozulduğu kış gecesi|Kedinin vazoyu düşürdüğü an|Bayramda el öpme kuyruğu"}),
]
