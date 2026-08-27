# Buds2 Companion — Android Kullanım Notları

## Amaç ve Kapsam

**Buds2 Companion**, Android telefonda eşlenmiş Galaxy Buds2 cihazını bulmaya, bağlantı durumunu A2DP/HFP ses profillerinden göstermeye ve dinleme ile ilgili kişisel notları yalnızca telefonda tutmaya odaklanır. Uygulama, Samsung tarafından geliştirilmiş veya onaylanmış değildir.

> Android 12 ve sonrası için eşlenmiş Bluetooth cihazlarıyla iletişim `BLUETOOTH_CONNECT` iznine bağlıdır. Uygulama bu izni kullanıcıdan **Yakındaki cihazlar** izni olarak ister.[1]

## Uygulamayı Kullanma

| Adım | Yapılacak işlem | Beklenen sonuç |
|---|---|---|
| 1 | Android Ayarları içinden Galaxy Buds2'yi eşleyin. | Cihaz, telefonun eşlenmiş Bluetooth listesinde görünür. |
| 2 | Buds2 Companion'ı açın ve **Bluetooth erişimine izin ver** eylemini seçin. | Uygulama eşlenmiş cihazları okuyabilir. |
| 3 | Kulaklığı telefonun Bluetooth ayarlarından bağlayın. | Ana ekranda `Bağlı` veya `Eşlenmiş` durumu görülür. |
| 4 | **Cihazlar** sekmesinden A2DP/HFP profil durumunu yenileyin. | Galaxy Buds2 adı ve erişilebilir ses profili bilgisi listelenir. |
| 5 | **Tercihler** sekmesinden ortam profili ve ekolayzır notunu seçin. | Seçim yalnızca bu telefonda saklanır. |

## Desteklenen İşlevler

| İşlev | Durum | Açıklama |
|---|---|---|
| Bluetooth açık/kapalı denetimi | Desteklenir | Yerel Android köprüsü sistem Bluetooth durumunu okur. |
| Eşlenmiş cihazların listelenmesi | Desteklenir | Yakındaki cihazlar izninden sonra cihaz adı ve türü okunur. |
| A2DP/HFP bağlantı durumu | Desteklenir | Android'in genel ses profili API'lerinden alınır.[2] |
| Galaxy Buds2 ad eşleşmesi | Desteklenir | `Galaxy Buds2`, `Buds2` veya `SM-R177` içeren cihaz adı vurgulanır. |
| Dinleme tercihlerini saklama | Desteklenir | Veriler yalnızca cihazdaki yerel depoda tutulur. |
| Ayrı sol/sağ/kutu pil yüzdesi | Koşullu | Android standart API'si bu bilgileri her cihazda paylaşmadığından doğrulanamıyorsa `Bilinmiyor` gösterilir. |
| ANC, ekolayzır, dokunmatik kontrol değiştirme | Bu sürümde yok | Galaxy Buds gelişmiş kontrol akışı üreticiye özgü RFCOMM ikili protokolü kullanır; doğrulanmış Buds2 protokolü olmadan bu işlevler uygulanmamıştır.[3] |

## Android Derlemesi

Uygulama, yerel Bluetooth işlevleri için uygulama içi Kotlin modülü içerir. Bu nedenle genel Expo Go istemcisi yerine **özel Android derlemesi** gerekir. Android projesi ön-derleme ile oluşturuldu; Bluetooth izin bildirimi ve yerel modülün otomatik bağlanması doğrulandı.

APK oluşturmak için proje yönetim alanındaki **Publish** düğmesini kullanın. Bu işlem Android paketini uygun derleme ortamında üretir. Bu çalışma ortamında yalnızca Kotlin modülünü Gradle ile derleme denemesi, Gradle sürecinin bellek kısıtı nedeniyle beklenmedik biçimde kapanması nedeniyle tamamlanamadı; bu sonuç, ön-derleme veya JavaScript testlerinin başarısız olduğu anlamına gelmez.

## Doğrulama Özeti

| Kontrol | Sonuç |
|---|---|
| TypeScript tür denetimi | Başarılı |
| Expo lint | Başarılı |
| Bağlantı durumu birim testleri | 3 test başarılı |
| Android ön-derleme | Başarılı |
| Android izin bildirimi | `BLUETOOTH` / `BLUETOOTH_ADMIN` (API 30 ve altı) ve `BLUETOOTH_CONNECT` (API 31+) doğrulandı |
| Yerel modül otomatik bağlama | Doğrulandı |
| Web dışa aktarma | Paketleme işlemi sandbox içinde tamamlanmadı; bu mobil uygulamanın Android işlevi için bloklayıcı değildir. |

## Kaynaklar

[1] [Android Developers — Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)

[2] [Android Developers — BluetoothA2dp](https://developer.android.com/reference/android/bluetooth/BluetoothA2dp)

[3] [GalaxyBudsClient — How it works](https://github.com/timschneeb/GalaxyBudsClient#how-it-works)
