# Buds2 Companion — Teknik Araştırma Notları

## Uygulanabilir İlk Sürüm Sınırı

Android 12 ve üzerindeki cihazlarda eşlenmiş Bluetooth cihazlarıyla iletişim kurmak için `BLUETOOTH_CONNECT`, cihaz taraması içinse `BLUETOOTH_SCAN` izni hem bildirimde hem çalışma zamanında gerekir. Bu izinler kullanıcıya Android'in **Yakındaki cihazlar** izni olarak sunulur. Fiziksel konum çıkarımı yapılmayan bir tarama akışında `neverForLocation` bayrağı kullanılabilir.[1]

Galaxy Buds ürün ailesinin gelişmiş kontrolleri standart A2DP ses profilinden ayrı olarak RFCOMM üzerinde ikili, üreticiye özgü bir seri iletişim akışı kullanır. Bu nedenle açık Android Bluetooth API'leriyle Buds2'nin ANC, ekolayzır ya da dokunmatik hareketlerini desteklemek garanti edilemez; söz konusu davranışlar Buds2 için ayrıca doğrulanmış bir protokol uygulanmasını gerektirir.[2]

| Alan | İlk sürümdeki yaklaşım | Güvenilirlik |
|---|---|---|
| Bluetooth açık/kapalı | Yerel Android modülü ile sistem adaptör durumunu okuma | Yüksek |
| Eşlenmiş cihazlar | `BLUETOOTH_CONNECT` izni sonrası sistemin eşlenmiş cihaz listesini okuma | Yüksek |
| Bağlı ses cihazları | A2DP/HEADSET profillerinden bağlı cihaz durumunu sorgulama | Orta; üretici ve Android sürümüne bağlı |
| Pil yüzdesi | Android tarafından iletilen tekil pil seviyesi varsa gösterme, aksi hâlde `Bilinmiyor` | Orta; her cihaz ayrı kulaklık/kutu bilgisi sağlamaz |
| ANC, EQ, dokunmatik ayar | Kullanıcı tercihini yerel olarak saklama; Buds2'ye komut göndermeme | Yüksek; işlev sınırı net |
| Gelişmiş Buds2 komutları | İlk sürüm kapsamı dışında; ayrı protokol/uyumluluk çalışması gerekir | Düşük; üreticiye özgü |

Expo'nun Modules API'si Android tarafında Kotlin ile yerel işlev tanımlamayı ve JavaScript'e tür güvenli bir köprü açmayı destekler. Bu nedenle bağlı cihaz bilgisi ve Android izin akışı için uygulamaya ait, küçük bir `Buds2Bridge` yerel modülü oluşturulacaktır. Yerel modül içeren özellikler standart Expo Go istemcisinde bulunmadığından test için özel geliştirme derlemesi ya da yayın derlemesi gerekecektir.[3]

Android'in `BluetoothA2dp` profili, bağlı ses cihazlarının listesini ve belirli bir cihazın profil bağlantı durumunu vermektedir. Bu çağrılar Android 12 ve sonrasında `BLUETOOTH_CONNECT` izni gerektirir. Uygulama, Buds2 benzeri adı taşıyan eşlenmiş cihazları tanımlamak ve A2DP/HFP profil bağlantılarını göstermek için bu genel API kapsamını kullanacaktır; uygulama içinden bağlantı kurmaya zorlamayacak, kullanıcıyı güvenli biçimde sistem Bluetooth ayarına yönlendirecektir.[4]

## Geliştirme Kararı

İlk uygulama, kaynak kodu GPLv3 lisanslı üçüncü taraf Galaxy Buds istemcilerinden kod veya protokol paketi almayacaktır. Bunun yerine Android'in genel Bluetooth API'lerine dayalı kendi Kotlin köprüsünü kullanacak, gelişmiş Buds2 komutlarını yalnızca üretici protokolü ayrı olarak doğrulanırsa sonraki sürümde ele alacaktır. Böylece uygulama kullanıcıya yanlış biçimde tam Buds2 kontrolü sunduğunu iddia etmez.

## Gelişmiş Denetim Değerlendirmesi

Açık kaynak referansları, ANC, ortam sesi, ekolayzır, dokunmatik kilidi ve cihaz bulma gibi gelişmiş işlevlerin Galaxy Buds tarafından A2DP üzerinden değil, **RFCOMM seri soketi** üzerinden taşınan ikili komutlarla uygulandığını belirtmektedir.[5] BudsLink bu işlevleri Buds2 için destek listesinde gösterse de Buds2 satırlarını test edilmemiş olarak işaretlemektedir.[6] Bu nedenle mevcut uygulama ileri kontrol düğmelerini çalışıyor gibi göstermeyecek; önce eşlenmiş/bağlı cihaz listesi ile kullanıcı tarafından başlatılan güvenli tarama akışını etkinleştirecektir.

> Bir Galaxy Buds RFCOMM soketine aynı anda yalnızca bir uygulama erişebilir. Bu nedenle test sırasında Galaxy Wearable ve diğer Buds izleme uygulamalarının kapatılması gerekir.[6]

## Buds2 RFCOMM Deneysel Uygulama Kararı

GalaxyBudsClient'in Buds2 model tanımı, yeni SPP hizmeti ve ANC/ekolayzır özelliği için model desteği bildirmektedir.[7] Aynı projenin halka açık protokol notları, mesaj çerçevesinin başlangıç baytı, küçük uçlu boyut alanı, mesaj kimliği, yük, CRC-16/CCITT ve bitiş baytından oluştuğunu; ANC ve ekolayzırın ayrı mesaj kimlikleriyle iletildiğini açıklar.[8] Bu bilgiler, uygulamanın doğrudan bu GPL lisanslı projeden kod kopyalamadan, kendi bağımsız Kotlin RFCOMM taşıyıcısını hazırlamasına temel oluşturur.

Android tarafındaki bağlantı iş parçacığı ana arayüz iş parçacığından ayrı çalışacak; bağlantıdan önce cihaz taramasını iptal edecek, kısa okuma zaman aşımı kullanacak, yalnızca kullanıcı açıkça bir mod veya ön ayar seçtiğinde komut gönderecek ve her işlemden sonra soketi kapatacaktır. Android'in resmi bağlantı rehberi, `BluetoothSocket.connect()` çağrısının engelleyici olduğunu, bağlantı öncesi taramanın iptal edilmesi gerektiğini ve soketin iş bitince kapatılmasını önerir.[9]

Bu sürümde uygulama yalnızca **Buds2 adıyla eşleşen, eşlenmiş ve A2DP/HFP profili bağlı görünen** bir cihaz için RFCOMM denemesi yapacaktır. Bir komut sadece geçerli bir onay cevabı alınırsa arayüzde uygulanmış olarak gösterilecek; bağlantı, kimlik, çerçeve veya komut doğrulaması başarısızsa kullanıcıya açık hata bilgisi verilecek ve yerel tercih durumu donanım durumuymuş gibi gösterilmeyecektir.

## Deneysel Komut Sözleşmesi

Deneysel uygulama Buds2'nin yeni SPP hizmeti için model tanımında belirtilen UUID'yi kullanır; yalnızca eşlenmiş ve adı Buds2 ile uyuşan cihaza bağlanır.[10] Gönderim tarafında ANC için kapalı, ANC ve ortam sesi olmak üzere üç mod; ekolayzır için Normal, Bas, Yumuşak ve Dinamik ön ayarları desteklenir. Her iki işlemde de RFCOMM bağlantısı tek komut denemesi için açılır, keşif kapatılır ve işlem sonunda soket kapatılır.[9]

Komut cevabı kısa sürede doğrulanırsa ekran `onaylandı` sonucunu gösterir. Cevap alınamazsa komutun iletildiği ancak Buds2 tarafından doğrulanamadığı belirtilir; bu durumda kullanıcıdan kulaklığın duyulabilir/algılanabilir davranışını kontrol etmesi istenir. Bu sözleşme, doğrulanmamış bir donanım değişikliğini kesin başarı olarak göstermekten kaçınır.

## Kaynaklar

[1] [Android Developers — Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)

[2] [GalaxyBudsClient — How it works](https://github.com/timschneeb/GalaxyBudsClient#how-it-works)

[3] [Expo — Tutorial: Create a native module](https://docs.expo.dev/modules/native-module-tutorial/)

[4] [Android Developers — BluetoothA2dp](https://developer.android.com/reference/android/bluetooth/BluetoothA2dp)

[5] [GalaxyBudsClient — How it works](https://github.com/timschneeb/GalaxyBudsClient#how-it-works)

[6] [BudsLink — Samsung Galaxy Buds compatibility](https://maniacx.github.io/BudsLink/galaxy)

[7] [GalaxyBudsClient — Buds2 device specification](https://github.com/timschneeb/GalaxyBudsClient/blob/master/GalaxyBudsClient/Model/Specifications/Buds2DeviceSpec.cs)

[8] [GalaxyBudsClient — Galaxy Buds RFCOMM protocol notes](https://github.com/timschneeb/GalaxyBudsClient/blob/master/GalaxyBudsRFCommProtocol.md)

[9] [Android Developers — Connect Bluetooth devices](https://developer.android.com/develop/connectivity/bluetooth/connect-bluetooth-devices)

[10] [GalaxyBudsClient — Buds2 service UUID definition](https://github.com/timschneeb/GalaxyBudsClient/blob/master/GalaxyBudsClient/Model/Constants.cs)
