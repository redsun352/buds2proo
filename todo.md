# Project TODO

- [x] Android Bluetooth erişimi için kullanılabilir Expo / yerel modül yaklaşımını doğrula.
- [x] Galaxy Buds2'nin herkese açık Android API'leri ile erişilebilen bağlantı ve pil verisi kapsamını belgele.
- [x] Bluetooth cihazı, pil, izin ve dinleme tercihi için ortak TypeScript veri modellerini oluştur.
- [x] Yakındaki cihazlar izni ve Bluetooth kapalı durumları için uygulama içi akışı uygula.
- [x] Ana ekranda gerçek bağlantı durumu ve erişilebilen cihaz bilgilerini göster.
- [x] Cihazlar ekranında eşlenmiş/bağlı ses cihazlarını ve güvenli bağlantı yönlendirmesini sun.
- [x] Dinleme tercihleri ekranını yerel kalıcılıkla uygula ve üretici komutu sınırını açıkla.
- [x] Yardım ve uyumluluk ekranını izin/sorun giderme adımlarıyla ekle.
- [x] Tema, sekme simgeleri ve Android odaklı erişilebilirlik detaylarını düzenle.
- [x] Özel Buds2 Companion uygulama simgesini üret ve Android yapılandırmasına ekle.
- [ ] Birim testleri, TypeScript kontrolü ve Expo web derlemesiyle temel akışları doğrula.
- [x] Uygulama kullanım notlarını ve Galaxy Buds2 uyumluluk sınırlarını teslim et.
- [x] Android ön-derleme, izin bildirimi ve yerel modül otomatik bağlamasını doğrula.
- [x] TypeScript kontrolü, Expo lint ve bağlantı durumu birim testlerini çalıştır.
- [x] Android Kotlin modülünü bellek yeterli bir ortamda Gradle ile derle.
- [x] GitHub depo erişimini doğrula ve Android derlemesi için uygun hedef dalı belirle.
- [x] GitHub Actions üzerinde imzasız Android APK üretecek iş akışını ekle.
- [x] GitHub Actions üzerinde imzasız Android APK üretecek iş akışını ekle.
- [x] İş akışını, uygulama derleme gereksinimlerini ve artifact saklama süresini doğrula.
- [x] Proje değişikliklerini GitHub deposuna gönder ve Android derlemesini başlat.
- [x] GitHub Actions derleme sonucunu ve APK artifact bağlantısını doğrula.
- [ ] Kullanıcı onayıyla public redsun352/buds2-companion deposuna GitHub Actions iş akışını gönder ve Android derlemesini başlat.
- [x] Kullanıcının sağlayacağı yeni GitHub deposunda yazma erişimini doğrula, projeyi aktar ve Android derlemesini başlat.
- [x] redsun352/buds2proo deposunda yazma erişimini doğrula, Buds2 Companion'ı aktar ve Android APK derlemesini başlat.
- [x] Güncellenen GitHub erişimiyle redsun352/buds2proo deposuna kaynak gönderimini yeniden dene ve Android derlemesini başlat.
- [x] Son yetki güncellemesiyle redsun352/buds2proo deposuna yazma erişimini doğrula ve Android derlemesini başlat.
- [x] Yeniden bağlanan GitHub erişimiyle redsun352/buds2proo gönderimini doğrula ve Android APK derlemesini başlat.
- [x] Buds2 yerel modülünde eksik Android sürüm yapılandırmasını düzelterek GitHub Actions Gradle derlemesini onar.
- [x] Güvenli GitHub yazma anahtarıyla redsun352/buds2proo deposuna erişimi doğrula ve Android derlemesini başlat.
- [x] Uygulama simgelerini kaliteyi koruyarak küçült ve proje kaydını yeniden oluştur.
- [x] EAS Android ön-derleme hatasının kaynağını teşhis et, yapılandırmayı düzelt ve yayınlama öncesi doğrula.
- [x] Uygulamanın cihazda "Android derlemesi gerekli" başlangıç durumunda kalmasına yol açan Bluetooth köprü yükleme hatasını video üzerinden teşhis et ve düzelt.
- [x] Metro sunucusu gerektiren debug APK yerine JavaScript paketini içeren Android release APK üret.
- [x] Gerçek cihazda pasif kalan Buds2 Companion kontrollerinin nedenini teşhis et; izin, modül yükleme ve cihaz tarama akışını etkinleştir.
- [x] Android 12+ cihazlarda tarama ve bağlantı durumu için gerekli Bluetooth izinlerini birlikte iste; tarama sonucunu ekranda göster.
- [x] Üreticiye özgü denetimlerin ilk sürümde etkin olmayacağı uyarısını, kullanıcı isteği üzerine deneysel ANC/ekolayzır RFCOMM denetimleriyle güncelle; dokunmatik denetimleri kapsam dışında tut.
- [x] Galaxy Buds2 ANC ve ekolayzır komutları için RFCOMM/SPP protokol çerçevesini, model uyumluluğunu ve lisans koşullarını doğrula.
- [x] Tek uygulama soket erişimi, kullanıcı onayı ve güvenli bağlantı kesme kurallarıyla Buds2 RFCOMM köprüsünü tasarla.
- [ ] Buds2 bağlı ve başka bir Buds istemcisi kapalıyken ANC/ekolayzır sorgu ve komut akışını gerçek cihazda doğrula.
- [x] RFCOMM komut onayı okunana kadar soket çıkış akışını açık tutarak bağlantı yaşam döngüsünü düzelt.
- [x] RFCOMM yanıt bekleme döngüsünde iş parçacığı kesintisini güvenli biçimde ele al.
- [x] Yerel buds2-bridge Android modül kaynaklarını release deposuna eksiksiz aktar ve APK derlemesini doğrula.
- [ ] Başarılı RFCOMM Android release APK artifact'ını indirip gerçek cihaz test yönergeleriyle teslim et.

- [x] Kullanıcı geri bildirimi: pil durumu, ANC ve ekolayzır özellikleri release APK'sında görünür/çalışır değil; kaynak–APK eşleşmesini teşhis et.
- [x] Pil seviyelerini Android Bluetooth API'sinden güvenilir biçimde yenile ve eksik veri durumunu açıkça göster.
- [x] ANC ve ekolayzır kontrol ekranının native RFCOMM köprüsüne gerçekten bağlı olduğunu doğrula ve eksik akışı düzelt.
- [x] Düzeltilmiş Android release APK'sını üretip gerçek cihaz testine hazırla.

- [x] Kullanıcı geri bildirimi: ekolayzır ve pil durumu son APK'da da çalışmıyor; gerçek cihaz tanısını yeniden yap.
- [ ] Pil verisini proprietary Buds2 kanalından veya desteklenen Android bildirim yolundan doğrula; veri yoksa nedenini logla.
- [ ] Ekolayzır RFCOMM handshake, çerçeve, yanıt ve cihaz uyumluluğunu logcat ile doğrula; gerekirse protokolü düzelt.
- [x] Tanı sonrası yeni release APK'sını üret ve kullanıcı cihazında yeniden test ettir.

- [x] Tanı: release senkron komutu yerel `modules/buds2-bridge/android` dizinini dışladığı için native pil/status ve handshake düzeltmeleri APK'ya girmemiş; modül dizinini güvenli biçimde ayrıca aktar.

- [ ] DSP hedefi: ANC/EQ komutlarının telefonda değil Buds2 firmware/DSP katmanında işlendiğini doğrula.
- [ ] Buds2 DSP RFCOMM handshake ve komut yanıtlarını ayrıntılı tanı loglarıyla görünür yap.
- [ ] DSP komutlarının gerçek cihazda ANC ve EQ değişikliği oluşturduğunu doğrula; onaysız sonucu başarı gösterme.

- [ ] Uygulama içi DSP/RFCOMM tanı kayıtlarını kişisel veri toplamadan dosyaya yaz.
- [ ] Tanı dosyasını Yardım ekranından görüntüle, temizle ve Android paylaşım menüsüne gönder.
- [ ] Native köprü ve TypeScript log akışını test edip yeni release APK'sında doğrula.
