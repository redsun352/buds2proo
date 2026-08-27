# Buds2 Companion — Mobil Arayüz Tasarım Planı

## Ürün Amacı

**Buds2 Companion**, Android telefonlarda Galaxy Buds2'nin Bluetooth bağlantı durumunu görünür kılan, cihazla ilgili erişilebilen bilgileri tek ekranda toplayan ve kullanıcıya kendi dinleme tercihlerini yönetebileceği sade bir kontrol alanı sağlayan yerel bir yardımcı uygulamadır. Uygulama, Samsung'un resmi giyilebilir uygulamasının yerine geçtiği iddiasında değildir. Galaxy Buds2'nin gelişmiş ve üreticiye özgü komutları herkese açık bir Android arayüzü ile sunulmadığından, bu ilk sürüm yalnızca Android'in sağladığı bilgiler ve kullanıcının uygulama içi tercihleri konusunda kesin davranacaktır.

## Tasarım İlkeleri

Arayüz **9:16 dikey telefon ekranı**, tek elle kullanım ve Android kullanıcılarının alışık olduğu Material yaklaşımı için hazırlanacaktır. Ana eylemler başparmak erişiminde, alt bölümde veya ekrandaki büyük cihaz kartının hemen altında bulunur. Görsel dil, Buds2'nin kompakt yuvarlak formundan esinlenen geniş köşeli kartlar, düşük kontrastlı katmanlar ve net durum renkleri kullanır. Koyu tema varsayılan olacak; sistem tercihiyle açık temaya geçebilecektir.

| Tasarım unsuru | Seçim | Gerekçe |
|---|---|---|
| Ana zemin | `#10131A` koyu lacivert | Uzun süreli kullanımda düşük parlaklık, kulaklık ürün diliyle uyum |
| Yüzeyler | `#1C2230` | Durum kartlarını zeminden seçirir |
| Vurgu | `#80D4FF` buz mavisi | Bağlantı ve aktif durumları açık biçimde vurgular |
| Başarı | `#4ED7A0` yeşil | Bağlı / hazır bilgi hiyerarşisi |
| Uyarı | `#FFC971` kehribar | Düşük pil ve kullanıcı dikkatini gerektiren durumlar |
| Kritik | `#FF8E93` mercan | İzin ya da bağlantı hataları |
| Birincil yazı | `#F2F5FA` | Koyu zeminde erişilebilir kontrast |
| İkincil yazı | `#AAB5C8` | Açıklama ve meta veri hiyerarşisi |

## Ekran Listesi

| Ekran | Birincil içerik | İşlev |
|---|---|---|
| **Ana Sayfa** | Bağlantı rozeti, Buds2 cihaz kartı, erişilebilir pil bilgisi, hızlı tercihler | Bağlantıyı yeniler, Bluetooth izin akışını başlatır, tercihleri açar |
| **Cihazlar** | Eşlenmiş / bağlı Bluetooth ses cihazları listesi, tarama/yenileme durumu | Kullanıcının Buds2'yi sistemden bağlamasına yönlendirir; uygulama içinde uygun cihazı tanımlar |
| **Dinleme Tercihleri** | Ortam profili, ekolayzır ön ayarı, dokunma davranışı notu | Kullanıcı tercihini yerel olarak kaydeder; üretici komutu olmadığını açıkça belirtir |
| **Yardım ve Uyumluluk** | Android izinleri, destek kapsamı, bağlantı sorun giderme adımları | Doğru beklentiyi oluşturur ve sistem Bluetooth ayarına yönlendirir |

## Temel Veri Modeli

Uygulama bağlantı verisini **uydurulmuş pil yüzdeleri olmadan** durum odaklı gösterir. Bir pil kaynağı Android tarafından verilmiyorsa, ilgili alan `Bilinmiyor` olarak kalır ve kullanıcıya sebebi açıklanır. Tercihler yalnızca cihazda saklanır.

| Varlık | Temel alanlar | Kaynak |
|---|---|---|
| `BluetoothDeviceState` | ad, adres, bağlılık, ses profili, bulunma zamanı | Android Bluetooth / uygulama durum katmanı |
| `BatteryState` | sol, sağ, kutu, genel durum, zaman damgası | Android'in erişebildiği pil verisi; aksi hâlde bilinmiyor |
| `ListeningPreferences` | ortam modu, ekolayzır, dokunma notu, son güncelleme | Yerel kalıcı depolama |
| `PermissionState` | yakındaki cihaz izni, Bluetooth durumu, açıklama | Android izin akışı |

## Ana Kullanıcı Akışları

**İlk açılış ve izin:** Kullanıcı Ana Sayfa'yı açar, açıklamalı “Bluetooth'u etkinleştir” kartını görür, izin düğmesine basar ve Android'in Yakındaki cihazlar iznini verir. Uygulama ardından bağlı ses cihazlarını yeniler ve Buds2 algılanırsa bağlantı kartını günceller.

**Bağlantı kontrolü:** Kullanıcı Ana Sayfa'daki cihaz kartına dokunur, Cihazlar ekranında cihazın bağlı/eşlenmiş durumunu görür. Buds2 bağlı değilse sistem Bluetooth ayarını açma seçeneğiyle, bağlanma işleminin Android ayarlarından tamamlanması gerektiği açıklanır.

**Dinleme tercihi kaydı:** Kullanıcı Ana Sayfa'daki “Tercihler” eylemine dokunur, ortam profili veya ekolayzır tercihlerini seçer ve değişiklik cihazda saklanır. Uygulama, bu seçimlerin Buds2'ye doğrudan aktarılabilmesi için Samsung'un resmi protokol veya uygulama erişiminin gerektiğini görünür biçimde belirtir.

**Sorun giderme:** Kullanıcı Yardım sekmesini açar, aktif izin ve Bluetooth koşullarını denetler. Uygulama eksik koşulları birincil eylem içeren kartlarda gösterir; kullanıcı böylece izin isteğine veya sistem Bluetooth ayarına gider.

## Etkileşim ve Erişilebilirlik

Tüm dokunulabilir hedefler en az 44 dp yüksekliğinde tasarlanacak, metin hiyerarşisi en fazla üç seviyede tutulacak ve bağlantı/pil durumları yalnızca renkle aktarılmayacaktır. Birincil eylemlerde kısa basma geri bildirimi kullanılacak, kritik aksiyonlardan sonra anlaşılır metinle sonuç bildirilecektir. Ağ veya bulut hesabı gerekmeyecek, kullanıcı tercihleri yalnızca cihazda kalacaktır.
