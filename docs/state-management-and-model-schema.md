# Durum Yönetimi ve Model Şeması

Bu doküman, GoJS Node Template Designer uygulamasında kullanılan istemci tarafı durum yönetimi ve görsel model şemasını açıklar. Amaç; yeni özellikler geliştirirken, Undo/Redo gibi yetenekleri eklerken veya dış entegrasyonlar planlarken mevcut yapı hakkında referans sağlamaktır.

## Genel Mimari

- **Durum deposu**: Uygulamanın global durumu `src/store/diagramStore.ts` dosyasında tanımlanan [Zustand](https://zustand-demo.pmnd.rs/) deposu aracılığıyla yönetilir.
- **Graf nesne modellemesi**: Diyagramda yer alan her GraphObject, türüne göre metadata tarafından yönlendirilen `GraphElement` kayıtları ile temsil edilir.
- **Komponent iletişimi**: `PalettePanel`, `DiagramCanvas` ve `InspectorPanel` bileşenleri doğrudan store hook'unu kullanarak duruma abone olur, böylece prop drilling ihtiyacı ortadan kalkar.

## Store Şeması

`DiagramState` arabirimi store içinde saklanan veri yapılarını ve mutasyon fonksiyonlarını tanımlar:

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `elements` | `GraphElement[]` | Diyagramı oluşturan tüm GraphObject düğümlerinin düz liste temsili. Kök düğümün `parentId` değeri `null`'dır. |
| `selectedId` | `string \| null` | Kullanıcı arayüzünde seçili olan öğenin kimliği. |
| `addElement` | Fonksiyon | Metadata varsayılanlarıyla yeni `GraphElement` oluşturur ve seçimi bu öğeye taşır. |
| `updateElement` | Fonksiyon | Verilen `id`'ye sahip öğeyi saf (immutably) şekilde günceller. |
| `selectElement` | Fonksiyon | Kullanıcının seçimini günceller; `null` değeri seçim temizliği anlamına gelir. |
| `removeElement` | Fonksiyon | Seçilen öğeyi ve tüm alt öğelerini siler, gerekirse yeni varsayılan kök oluşturur. |

### Kimlik ve Varsayılanlar

- Her öğenin kimliği `nanoid` paketi ile üretilir; böylece GoJS modeline aktarırken benzersiz `key` değerleri elde edilir.
- `createGraphElement` yardımcı fonksiyonu, metadata tanımlarındaki `defaultProperties` ve `defaultName` değerlerini otomatik olarak uygular.
- Kök node yoksa `createInitialNode` ile yeni bir otomatik node oluşturulur; bu, store'un başlangıç durumunda ve silme sonrası güvenlik ağında kullanılır.

### İmmutabilite ve Türemiş Veriler

- `updateElement` fonksiyonu, güncellenecek öğeyi `map` ile seçer ve geri kalan öğeleri aynen taşır; böylece React bileşenleri minimal yeniden render tetikler.
- `removeElement`, tek tek çocukları bulmak için `buildChildrenIndex` fonksiyonuyla parent-id indeks tablosu oluşturur ve silinecek kimlikleri derleyerek immutable bir filtre uygular.
- Metadata nesneleri derin kopyalanırken `cloneValue` yardımcı fonksiyonu kullanılır; bu fonksiyon nested array veya nesneleri rekürsif olarak kopyalar ve paylaşılan referansların istenmeyen yan etkilerini engeller.

## GraphElement Şeması

`GraphElement` kayıtları her GraphObject'in durumunu aşağıdaki alanlarla temsil eder:

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | `string` | Benzersiz kimlik; GoJS `nodeDataArray` içinde `key` olarak kullanılır. |
| `type` | `'node' \| 'panel' \| 'shape' \| 'text' \| 'picture'` | Metadata haritasında tanımlı GraphObject türü. |
| `name` | `string` | UI'da ve diyagram önizlemesinde görünen etiket. |
| `parentId` | `string \| null` | Hiyerarşik ebeveyn kimliği. `null` değeri tek bir kök öğeyi ifade eder. |
| `properties` | `Record<string, unknown>` | GoJS özellik değerleri. Metadata `properties` listesi inspector kontrollerinin nasıl oluşturulacağını belirler. |
| `bindings` | `BindingConfig[]` | Model ile GoJS özellikleri arasındaki veri bağlarını tanımlar. |

### BindingConfig Şeması

Binding tanımları `BindingConfig` arayüzü ile standartlaştırılır:

- `prop`: GoJS özelliği (ör. `text`, `fill`).
- `path`: Diyagram veri modelindeki alan (ör. `name`, `loc`).
- `twoWay`: `true` olduğunda GoJS binding iki yönlü olarak yapılandırılır.
- `converter`: Opsiyonel dönüştürücü fonksiyon adı. Kod üretimi sırasında aynı isimli stub fonksiyon eklenir.

## Store İş Akışları

### Yeni öğe ekleme

1. Palet üzerinden tür seçilir (`PalettePanel`).
2. Store `addElement` çağrısı yapar, metadata varsayılanlarını uygular ve öğeyi `elements` listesine ekler.
3. Seçili öğe otomatik olarak yeni kimlik olur, böylece inspector paneli anında bu öğenin özelliklerini gösterir.

### Seçim ve önizleme

- `DiagramCanvas`, store'dan `elements` verisini alarak GoJS `TreeModel` oluşturur. Seçim değişince store'un `selectedId` alanı güncellenir ve inspector arayüzü yeniden render olur.

### Silme senaryoları

- Silinecek öğe ile tüm alt dalları `collect` fonksiyonu ile toplanır.
- Eğer silme sonrası kök node kalmazsa, store otomatik olarak yeni bir kök oluşturur ve seçimi temizler. Böylece UI boş duruma düşmez ve paletten öğe eklemeye devam edilebilir.

## Genişletme Noktaları

- **Undo/Redo**: Mevcut store fonksiyonları saf mutasyonlar kullandığı için, `past/present/future` yığınları eklenerek zaman yolculuğu kolayca uygulanabilir.
- **Özellik düzenleyicileri**: Metadata `properties` listesine yeni descriptor eklemek inspector bileşeninin otomatik kontrol üretmesini sağlayacak.
- **Harici şemalar**: `properties` sözlüğü JSON olarak serileştirilebilir; bu sayede proje dışına veri aktarımı veya sürümleme (ör. Git) yapılabilir.

Bu mimari sayesinde hem görsel önizleme hem de kod üretimi aynı kaynak modelden beslenir; tutarlılık korunur ve özellik seti genişletilirken merkezi metadata tanımlarından yararlanılır.
