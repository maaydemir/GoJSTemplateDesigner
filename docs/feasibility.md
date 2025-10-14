# GoJS Node Template Tasarım Aracı – Fizibilite ve Tasarım Planı

## Özet
GoJS için sürükle-bırak tabanlı bir node template tasarım aracı geliştirmek teknik olarak mümkün ve uygulanabilir görünüyor. Uygulama, tamamen tarayıcı üzerinde çalışacak ve React + TypeScript kombinasyonu ile modüler, genişletilebilir bir mimari sunacak. Aşağıdaki plan, belirtilen gereksinimleri karşılayacak temel bileşenleri, veri modellerini ve teknolojik tercihleri detaylandırır.

## Temel Hedefler
1. **Toolbox / Palette**: GoJS'in GraphObject hiyerarşisindeki tüm nesneleri (Node, Panel, Shape, TextBlock, Picture vb.) kategorize ederek sürüklenebilir öğeler halinde sunmak.
2. **Tasarım Tuvali**: Tek kök node barındıran, hiyerarşik olarak iç içe GraphObject'lerin düzenlenebildiği, sürükle-bırak destekli bir çalışma alanı.
3. **Özellik Paneli**: Seçili GraphObject'e ait standart ve gelişmiş özellikleri düzenleyebilen, ayrıca özel anahtar-değer çiftleri eklemeye olanak tanıyan arayüz.
4. **Binding Yönetimi**: Her GraphObject özelliği için veri modeliyle bağ (binding) tanımlayabilen, twoWay bayrağı ve converter fonksiyonları içeren editör.
5. **Silme ve Yeniden Konumlandırma**: GraphObject'lerin hiyerarşi içinde silinebilmesi, başka nesnelerin içine taşınabilmesi.
6. **Görsel İçerik Desteği**: Picture nesneleri için PNG, WEBP ve SVG kaynaklarını destekleyen seçim/önizleme mekanizması.
7. **Kod Üretimi**: Tasarlanan şablonu GoJS `go.GraphObject.make` sözdizimiyle TypeScript çıktısına dönüştürerek Monaco editörü benzeri bir pencerede gösterme.

## Teknoloji ve Araçlar
- **React + TypeScript**: Bileşen tabanlı UI, güçlü tip güvenliği.
- **Zustand veya Redux Toolkit**: Undo/redo yetenekli durum yönetimi ve zaman yolculuğu.
- **React DnD** veya **Dnd Kit**: Sürükle-bırak işlemleri için.
- **Monaco Editor**: Kod çıktısını zengin editör içinde göstermek.
- **Tailwind CSS**: Hızlı prototipleme ve tutarlı stil.
- **GoJS**: Canlı önizleme ve palette kullanılacak GraphObject tipleri.

## Mimari Tasarım
### 1. Veri Modeli
- `GraphObjectNode`: Her nesnenin tipini (`type`), benzersiz kimliğini, çocuklarını, özellik sözlüğünü ve binding listesini içerecek.
- `PropertyMap`: Standart özellikler (ör. `fill`, `stroke`, `text`) ile kullanıcı tanımlı anahtar-değer çiftlerini birlikte saklayacak.
- `Binding`: `prop`, `path`, `twoWay`, `converter` alanlarından oluşacak.

Bu yapı JSON olarak saklanacak ve hem GoJS önizlemesi hem de kod üretimi bu modelden beslenecek.

### 2. Bileşenler
- **PalettePanel**: Kategorilere göre gruplanmış GraphObject tiplerini listeler.
- **DesignerCanvas**: GoJS diyagramı ile senkronize çalışan, sürükle-bırak sonrası modeli güncelleyen alan.
- **HierarchyTree**: İsteğe bağlı; seçimi kolaylaştırmak için GraphObject ağacını gösterir.
- **PropertyInspector**: Seçili nesnenin özelliklerini düzenler, özel özellik tablosu ve renk seçiciler içerir.
- **BindingEditor**: Binding ekleme/silme formu; converter adı girildiğinde kod üreticisine stub fonksiyon eklemesini söyler.
- **CodePreviewModal**: Monaco editörü içinde üretilen TypeScript fonksiyonunu gösterir.
- **UndoRedoControls**: Zaman yolculuğu için butonlar ve kısayollar.

### 3. Durum Yönetimi ve Undo/Redo
- Her değişiklik immutably yapılır ve geçmiş yığınına kaydedilir.
- `present`, `past`, `future` yığınları ile klasik undo/redo mimarisi uygulanır.
- GoJS diyagramına yapılan işlemler de modele yansıtıldığından, modeller arası uyum korunur.

### 4. Kod Üretimi
- JSON modelini dolaşarak `go.GraphObject.make` çağrıları oluşturan fonksiyon.
- Binding listesi için `new go.Binding(prop, path, converter?)` yapısı üretilir.
- Kullanılan converter adları toplanıp şablon fonksiyon içinde stub olarak eklenir.
- Çıktı, kullanıcıların `diagram.nodeTemplate = buildMyTemplate()` şeklinde kullanabileceği şekilde paketlenir.

### 5. Görsel İçerik
- Dosya yüklemesi yerine URL veya base64 veri kabul edilir; offline kullanım için `FileReader` ile data URL üretilebilir.
- PNG, WEBP, SVG validasyonunu MIME tipinden veya uzantıdan yapıp GoJS Picture nesnesine aktarır.

### 6. Genişletilebilirlik
- GraphObject türlerini ve desteklenen özelliklerini tanımlayan metadata JSON/YAML dosyası.
- Yeni GoJS nesneleri eklemek, sadece bu metadata listesine yeni girdiler ekleyerek mümkün olur.

## Yol Haritası
1. Proje iskeletinin oluşturulması (React + TS, Tailwind, Zustand, GoJS entegrasyonu).
2. GraphObject metadata yapısının tanımı.
3. Durum yönetimi ve model şeması.
4. Palette ve canvas arasında temel sürükle-bırak.
5. Property ve binding editörlerinin geliştirilmesi.
6. Undo/redo ve silme işlevleri.
7. Kod üreticisi ve Monaco entegrasyonu.
8. Dosya türü desteği ve görsel iyileştirmeler.
9. Testler, hata ayıklama ve dokümantasyon.

## Sonuç
Belirtilen gereksinimler mevcut web teknolojileriyle karşılanabilir. Bu plan doğrultusunda ilerlenirse, GoJS node template tasarım aracı fonksiyonel, genişletilebilir ve doğrudan projelerde kullanılabilir bir araç olarak geliştirilebilir.
