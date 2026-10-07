import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const VIETNAMESE_GENRES = [
  { name: "Nhạc Lời Việt", slug: "nhac-loi-viet" },
  { name: "Anime Lời Việt", slug: "anime-loi-viet" },
  { name: "V-Pop Waifu", slug: "v-pop-waifu" },
  { name: "Acoustic Lời Việt", slug: "acoustic-loi-viet" },
];

const VIETNAMESE_ARTISTS = [
  {
    name: "Sơn Tùng M-TP",
    bio: "Nghệ sĩ V-Pop hàng đầu với phong cách âm nhạc hiện đại và các ca khúc tỉ view.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  },
  {
    name: "Waifu Anime Lời Việt Team",
    bio: "Nhóm cover và chuyển soạn các tuyệt phẩm Anime kinh điển sang lời Việt đậm chất thơ ca.",
    avatarUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
  },
  {
    name: "Hoàng Thùy Linh & Phương Mỹ Chi",
    bio: "Bộ đôi âm hưởng dân gian đương đại kết hợp giai điệu điện tử Anime.",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
  },
  {
    name: "Tăng Duy Tân",
    bio: "Phù thủy tạo hit TikTok và EDM Anime phong cách Á Đông huyền ảo.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80",
  },
  {
    name: "MONO & Wren Evans",
    bio: "Làn sóng GenZ phá cách với âm hưởng R&B và Synthwave thời thượng.",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
  },
  {
    name: "Hà Anh Tuấn & Orange",
    bio: "Những giọng ca truyền cảm với bản ballad da diết chạm sâu vào tâm hồn.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
  },
];

const VIET_SONGS_CATALOG = [
  {
    title: "Ánh Trăng Tình Yêu (Sailor Moon OST Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Tuyệt Phẩm Anime Lời Việt Tuổi Thơ",
    genreSlug: "anime-loi-viet",
    duration: 215,
    plays: 352000,
    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
    lyrics: `[00:00.00]♪ Ánh Trăng Tình Yêu (Sailor Moon Lời Việt) ♪
[00:06.00]Xin thứ tha cho em vì chẳng thể thật lòng
[00:13.50]Chỉ trong những giấc mơ em mới dám ngỏ lời cùng anh
[00:21.00]Từng dòng suy nghĩ quay cuồng làm tim em xao xuyến
[00:28.00]Giờ đây em ước gì được gặp anh ngay lúc này
[00:36.00]Dưới ánh trăng dịu êm huyền ảo lung linh
[00:43.00]Em chẳng thể cất bước vì nhung nhớ một người
[00:51.00]Trái tim em nhỏ bé chỉ dành trọn cho anh
[00:58.50]Ánh trăng nhiệm màu dẫn lối tình yêu đôi ta
[01:06.00]Dù ngàn trùng sóng gió em vẫn luôn vững tin
[01:13.50]Nguyện bên anh trọn đời dưới bầu trời đầy sao ✨`,
  },
  {
    title: "Doraemon - Giấc Mơ Thần Tiên (Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Tuyệt Phẩm Anime Lời Việt Tuổi Thơ",
    genreSlug: "anime-loi-viet",
    duration: 185,
    plays: 489000,
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    lyrics: `[00:00.00]♪ Doraemon No Uta (Bản Lời Việt Huyền Thoại) ♪
[00:05.00]Này bạn thân ơi ta cùng nhau bay tới chân trời
[00:11.00]Túi thần kỳ diệu mang đến biết bao điều ước mong
[00:18.00]Chong chóng tre vút bay qua từng tầng mây biếc
[00:24.50]Cánh cửa thần kỳ mở lối đến muôn ngàn niềm vui
[00:31.00]Ta cùng phiêu lưu khám phá những miền đất xa xôi
[00:37.50]Có chú mèo máy mập tròn đáng yêu luôn bên cạnh
[00:44.00]Doraemon ơi hãy cất tiếng cười thật tươi
[00:51.00]Tình bạn của chúng ta sẽ mãi không phai nhòa 🌸`,
  },
  {
    title: "Nơi Này Có Anh",
    artistName: "Sơn Tùng M-TP",
    albumTitle: "M-TP Tuyển Tập Siêu Phẩm",
    genreSlug: "v-pop-waifu",
    duration: 260,
    plays: 890000,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    lyrics: `[00:00.00]♪ Nơi Này Có Anh - Sơn Tùng M-TP ♪
[00:08.00]Em là ai từ đâu bước đến nơi đây dịu dàng chân phương
[00:15.50]Em là ai khiến cho lòng anh ngập tràn những vấn vương
[00:23.00]Gió mang hương ngát ngào mùa hoa ghé ngang qua đời
[00:30.00]Nụ cười em thắp sáng cả một góc trời bình yên
[00:38.00]Cầm tay anh nhé ta cùng đi qua bão giông cuộc đời
[00:45.50]Bao tháng ngày dài nơi này luôn có anh chờ em
[00:53.00]Dù mai này vật đổi sao dời tình anh vẫn vẹn nguyên
[01:01.00]Nguyện yêu em đến hơi thở cuối cùng trong tim 💖`,
  },
  {
    title: "Sparkle - Tia Sáng Giữa Ngàn Sao (Your Name Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Makoto Shinkai Tuyệt Tác Lời Việt",
    genreSlug: "anime-loi-viet",
    duration: 310,
    plays: 620000,
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80",
    lyrics: `[00:00.00]♪ Sparkle - Kimi no Na wa (Your Name Lời Việt) ♪
[00:12.00]Khi sao băng rơi xuống bầu trời đêm Tokyo lấp lánh
[00:22.00]Em gọi tên anh qua những giấc mơ chưa từng hẹn trước
[00:32.00]Ta tìm thấy nhau giữa dòng người đông đúc ngược xuôi
[00:43.00]Dẫu thời gian có trôi đi và ký ức có nhạt nhòa
[00:54.00]Lời hẹn ước năm nào khắc sâu vào tận tâm can
[01:05.00]Chỉ cần anh quay lại em vẫn đứng đợi nơi đây
[01:16.00]Từng tia sáng vụt qua như pháo hoa rực rỡ chân trời
[01:28.00]Kimi no namae wa... Tên của người là gì hỡi anh? ✨`,
  },
  {
    title: "Waiting For You",
    artistName: "MONO & Wren Evans",
    albumTitle: "22 The Album",
    genreSlug: "v-pop-waifu",
    duration: 215,
    plays: 740000,
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    lyrics: `[00:00.00]♪ Waiting For You - MONO ♪
[00:06.00]Dưới gốc cây ngày xưa ta ngồi chung góc quen
[00:12.50]Bao lời yêu em trao giờ này chỉ còn là kỷ niệm
[00:19.00]Biết bao đêm một mình anh lặng thầm nhớ em
[00:26.00]Liệu người có còn nhớ đến bóng hình anh nơi đây?
[00:33.00]Vì yêu em anh nguyện chờ đợi bao tháng năm
[00:40.00]Dẫu cho phong ba cách trở anh chẳng màng
[00:47.00]Cứ thế từng ngày trôi qua anh vẫn mãi ngóng trông
[00:54.00]Waiting for you babe... mãi chờ bóng hình em 🎶`,
  },
  {
    title: "See Tình (Anime Kawaii Remix)",
    artistName: "Hoàng Thùy Linh & Phương Mỹ Chi",
    albumTitle: "LINK - Âm Hưởng Á Đông",
    genreSlug: "v-pop-waifu",
    duration: 195,
    plays: 810000,
    coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
    lyrics: `[00:00.00]♪ See Tình - Hoàng Thùy Linh (Anime Beat) ♪
[00:04.00]U là trời anh gì ơi anh đánh rơi người yêu này!
[00:10.00]Nhìn anh cười một cái mà tim em rung rinh ngất ngây
[00:16.50]Giây phút ấy em biết mình đã trót si mê anh rồi
[00:23.00]Tình tang tính tình tính tang thấy chưa em đã yêu rồi
[00:30.00]Đưa tay đây em nắm ta cùng về một nhà
[00:36.50]Bao ngọt ngào đong đầy gửi trọn vào mắt anh
[00:43.00]Yêu là phải nói như đói là phải ăn
[00:49.00]Tình yêu nở hoa khắp nẻo đường đôi ta qua 🌸`,
  },
  {
    title: "Gurenge - Hoa Sen Đỏ (Demon Slayer Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Hơi Thở Của Lửa - Kimetsu No Yaiba Lời Việt",
    genreSlug: "anime-loi-viet",
    duration: 236,
    plays: 530000,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    lyrics: `[00:00.00]♪ Gurenge (Hoa Sen Đỏ - Demon Slayer Lời Việt) ♪
[00:06.00]Dẫu chông gai đầy rẫy con đường phía trước
[00:12.50]Lưỡi gươm sắc bén chém tan màn đêm đen tối
[00:19.00]Trái tim ta rực cháy khát vọng bảo vệ người thân
[00:26.00]Hoa sen đỏ nở rộ giữa phong ba bão táp
[00:33.00]Hơi thở bùng lên vượt qua ngàn giới hạn
[00:40.00]Nguyện chiến đấu đến giọt máu cuối cùng
[00:47.00]Ánh sáng công lý sẽ soi rọi khắp trần gian
[00:54.00]Vươn cao đôi cánh chạm tới đỉnh vinh quang 🔥`,
  },
  {
    title: "Cắt Đôi Nỗi Sầu",
    artistName: "Tăng Duy Tân",
    albumTitle: "Vũ Điệu Bóng Đêm",
    genreSlug: "v-pop-waifu",
    duration: 200,
    plays: 690000,
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
    lyrics: `[00:00.00]♪ Cắt Đôi Nỗi Sầu - Tăng Duy Tân ♪
[00:05.00]Cắt đôi nỗi sầu anh buông tay để em bước đi
[00:11.50]Không còn vương vấn những tháng ngày u tối bờ mi
[00:18.00]Đêm nay men say tràn ly anh quên hết sầu bi
[00:24.50]Gió lạnh lùng thổi qua mang theo bao lời hẹn ước
[00:31.50]Từ nay đường ai nấy bước không còn nợ nần chi nhau
[00:38.00]Trái tim này khép lại tìm về miền bình yên
[00:45.00]Ánh trăng tàn soi bóng kẻ si tình đứng trong mưa
[00:52.00]Quên đi một người từng là cả thế giới 🌙`,
  },
  {
    title: "Chúng Ta Của Hiện Tại",
    artistName: "Sơn Tùng M-TP",
    albumTitle: "M-TP Tuyển Tập Siêu Phẩm",
    genreSlug: "v-pop-waifu",
    duration: 290,
    plays: 870000,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    lyrics: `[00:00.00]♪ Chúng Ta Của Hiện Tại - Sơn Tùng M-TP ♪
[00:10.00]Mùa thu mang giấc mơ xưa quay về bên khung cửa sổ
[00:18.50]Ký ức ngọt ngào tựa như vừa mới hôm qua
[00:27.00]Dù mai đây đường đời có muôn vạn lối rẽ
[00:35.50]Anh vẫn trân trọng từng phút giây ta bên nhau
[00:44.00]Chúng ta của hiện tại đã từng yêu hết lòng
[00:52.50]Dù tương lai không thể cùng nhau đi đến cuối con đường
[01:01.00]Chúc em một đời bình an hạnh phúc viên mãn
[01:10.00]Cảm ơn em vì đã là thanh xuân tuyệt đẹp của anh 🌿`,
  },
  {
    title: "Suzume - Cánh Cửa Khóa Chặt (Suzume no Tojimari Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Makoto Shinkai Tuyệt Tác Lời Việt",
    genreSlug: "anime-loi-viet",
    duration: 245,
    plays: 570000,
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    lyrics: `[00:00.00]♪ Suzume (Khóa Chặt Cánh Cửa - Lời Việt) ♪
[00:07.00]Ru ru ru... Tiếng gió thì thầm gọi tên em từ miền hoang sơ
[00:16.00]Từng cánh cửa mở ra những miền ký ức xa xăm
[00:25.00]Em chạy qua từng con dốc vượt qua cơn bão lòng
[00:34.00]Để giữ chặt lấy bàn tay anh giữa chốn vô tận
[00:43.00]Dẫu ngày mai bầu trời sụp đổ ta vẫn không buông
[00:52.00]Ánh hoàng hôn rực rỡ soi sáng con đường trở về
[01:01.00]Em sẽ sống tiếp mạnh mẽ vì ngày mai tươi sáng
[01:10.00]Cánh cửa khép lại... Bình minh đón chào em 🚪✨`,
  },
  {
    title: "Vũ Trụ Có Anh",
    artistName: "Hoàng Thùy Linh & Phương Mỹ Chi",
    albumTitle: "Vũ Trụ Cò Bay",
    genreSlug: "v-pop-waifu",
    duration: 205,
    plays: 720000,
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    lyrics: `[00:00.00]♪ Vũ Trụ Có Anh - Phương Mỹ Chi & Pháo ♪
[00:05.00]Chuyện nàng Lọ Lem nay đã khác xưa nhiều rồi
[00:11.00]Không cần hoàng tử em vẫn tự bước đi kiêu hãnh
[00:17.50]Vũ trụ bao la rộng lớn triệu triệu vì sao
[00:24.00]Tìm đâu một người xứng đáng với trái tim em
[00:31.00]Đàn ca xao xuyến ngân vang khắp non sông gấm vóc
[00:37.50]Váy lụa thướt tha em nhảy múa dưới ánh trăng vàng
[00:44.00]Tự tin tỏa sáng làm chủ cuộc đời của chính mình
[00:51.00]Vũ trụ này rực rỡ khi có tình yêu chân thành 🌟`,
  },
  {
    title: "Tháng Tư Là Lời Nói Dối Của Em",
    artistName: "Hà Anh Tuấn & Orange",
    albumTitle: "Truyện Ngắn & Ballad Lời Việt",
    genreSlug: "acoustic-loi-viet",
    duration: 275,
    plays: 830000,
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80",
    lyrics: `[00:00.00]♪ Tháng Tư Là Lời Nói Dối Của Em - Hà Anh Tuấn ♪
[00:09.00]Mùa xuân hoa nở ngát hương thơm khắp hiên nhà
[00:18.00]Em đến bên anh tựa như một giấc chiêm bao dịu êm
[00:27.00]Tiếng đàn violin réo rắt khúc nhạc mùa xuân
[00:36.00]Tháng tư ghé qua mang theo những lời nói dối ngọt ngào
[00:45.00]Để giấu đi giọt nước mắt chia ly đầy xót xa
[00:54.00]Dẫu biết người ra đi chẳng thể quay trở lại
[01:03.00]Anh vẫn đứng nơi đây nhớ mãi nụ cười mùa hoa năm ấy 🌸🎻`,
  },
  {
    title: "Lạc Trôi (Cổ Phong Anime Lời Việt)",
    artistName: "Sơn Tùng M-TP",
    albumTitle: "M-TP Tuyển Tập Siêu Phẩm",
    genreSlug: "v-pop-waifu",
    duration: 232,
    plays: 910000,
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    lyrics: `[00:00.00]♪ Lạc Trôi - Sơn Tùng M-TP (Cổ Phong Beat) ♪
[00:07.00]Người theo hương hoa mây mù giăng lối
[00:13.50]Làn sương khói phôi phai đưa bước ai xa dần
[00:20.00]Đơn côi mình ta chén rượu nồng sầu vương
[00:27.00]Bao nhiêu ân tình nay hóa tàn tro bay
[00:34.00]Ta lạc trôi giữa chốn nhân gian muôn trùng sóng gió
[00:41.00]Hỏi trời cao sao nỡ gieo chi cảnh biệt ly
[00:48.00]Một đời kiêu hãnh nay chìm đắm trong men cay
[00:55.00]Dẫu có muôn trùng cách xa lòng ta vẫn hướng về người 🎴`,
  },
  {
    title: "Bên Trên Tầng Lầu",
    artistName: "Tăng Duy Tân",
    albumTitle: "Vũ Điệu Bóng Đêm",
    genreSlug: "v-pop-waifu",
    duration: 190,
    plays: 850000,
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    lyrics: `[00:00.00]♪ Bên Trên Tầng Lầu - Tăng Duy Tân ♪
[00:04.00]Em ơi đừng khóc bóng tối trước mắt sẽ bắt em đi
[00:10.00]Em ơi đừng lo ngày mai tia nắng ấm áp sẽ về
[00:16.00]Dù bao đau thương đè nặng lên bờ vai nhỏ
[00:22.50]Bên trên tầng lầu ánh đèn lung linh huyền ảo
[00:29.00]Ta cùng khiêu vũ quên hết mọi muộn phiền nhân gian
[00:35.50]Từng giọt sầu rơi ta hứng lấy đem thả vào hư vô
[00:42.00]Hãy để âm nhạc chữa lành vết thương lòng em 🌃✨`,
  },
  {
    title: "Idol - Nữ Thần Tỏa Sáng (Oshi no Ko Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Huyền Thoại Oshi no Ko Lời Việt",
    genreSlug: "anime-loi-viet",
    duration: 220,
    plays: 670000,
    coverUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    lyrics: `[00:00.00]♪ IDOL (Nữ Thần Hoàn Hảo - Oshi no Ko Lời Việt) ♪
[00:05.00]Nụ cười vô song làm say đắm cả triệu con tim
[00:11.00]Bí mật của em là điều không ai có thể chạm tới
[00:17.50]Mỗi bước nhảy trên sân khấu tựa như phép màu thần kỳ
[00:24.00]Ánh mắt lấp lánh như ngàn vì sao giữa trời đêm
[00:31.00]Em là thần tượng độc nhất vô nhị hoàn hảo tuyệt đối
[00:38.00]Dù đằng sau hào quang là những nỗi cô đơn khôn nguôi
[00:45.00]Lời nói dối ngọt ngào là tình yêu chân thành nhất
[00:52.00]Ai shiteru... Em yêu tất cả các bạn từ tận đáy lòng! ⭐🌟`,
  },
  {
    title: "Nandemonai ya - Chẳng Còn Chi Nữa (Your Name Lời Việt)",
    artistName: "Waifu Anime Lời Việt Team",
    albumTitle: "Makoto Shinkai Tuyệt Tác Lời Việt",
    genreSlug: "anime-loi-viet",
    duration: 285,
    plays: 590000,
    coverUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    lyrics: `[00:00.00]♪ Nandemonai ya (Your Name Lời Việt) ♪
[00:08.00]Hoàng hôn dần buông trên từng góc phố thân quen
[00:17.00]Ngọn gió khẽ lay làm vương hạt bụi vào mắt em
[00:26.00]Giờ đây chẳng còn gì làm em sợ hãi nữa rồi
[00:35.00]Bởi vì trong tim em đã khắc sâu hình bóng anh
[00:44.00]Dẫu có khóc vì niềm vui hay vì nỗi nhớ khôn nguôi
[00:53.00]Chỉ cần bên anh mọi giông bão đều hóa bình yên
[01:02.00]Cảm ơn anh vì đã bước đến bên đời em 💖🌸`,
  },
  {
    title: "Bật Tình Yêu Lên",
    artistName: "Tăng Duy Tân",
    albumTitle: "Vũ Điệu Bóng Đêm",
    genreSlug: "v-pop-waifu",
    duration: 180,
    plays: 760000,
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    lyrics: `[00:00.00]♪ Bật Tình Yêu Lên - Tăng Duy Tân & Hòa Minzy ♪
[00:04.00]Bật tình yêu lên cho màn đêm sáng bừng
[00:09.50]Rót mật vào tai những lời yêu đắm say
[00:15.00]Nụ cười của em làm tan chảy cả mùa đông
[00:21.00]Cùng anh khiêu vũ trên nền nhạc rộn rã
[00:27.00]Tình yêu chúng mình đẹp như trong truyện cổ tích
[00:33.00]Tay nắm chặt tay đi đến tận cùng chân trời 🎶✨`,
  },
  {
    title: "Mặt Trời Của Em",
    artistName: "Hà Anh Tuấn & Orange",
    albumTitle: "Truyện Ngắn & Ballad Lời Việt",
    genreSlug: "v-pop-waifu",
    duration: 225,
    plays: 680000,
    coverUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80",
    lyrics: `[00:00.00]♪ Mặt Trời Của Em - Phương Ly ft. JustaTee ♪
[00:06.00]Ngoài kia bao la thế giới nhưng trong em chỉ có anh
[00:13.00]Người mang cho em ánh nắng sưởi ấm những ngày mưa rơi
[00:20.00]Từng cử chỉ đáng yêu làm em nhớ mãi khôn nguôi
[00:27.00]Anh chính là mặt trời sưởi ấm cuộc đời em ☀️🌻`,
  },
  {
    title: "Từng Quen",
    artistName: "MONO & Wren Evans",
    albumTitle: "Loi Choi Gen Z",
    genreSlug: "v-pop-waifu",
    duration: 175,
    plays: 820000,
    coverUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    lyrics: `[00:00.00]♪ Từng Quen - Wren Evans ♪
[00:05.00]Ta từng quen từng nắm tay đi qua những con đường
[00:11.00]Từng trao nhau những ngọt ngào tưởng chừng chẳng phai
[00:17.00]Mà giờ đây lướt qua nhau như hai người xa lạ
[00:23.00]Giai điệu quen thuộc vang lên nhắc nhở một thời đã yêu 🎧`,
  },
  {
    title: "Ánh Nắng Của Anh",
    artistName: "Hà Anh Tuấn & Orange",
    albumTitle: "Truyện Ngắn & Ballad Lời Việt",
    genreSlug: "acoustic-loi-viet",
    duration: 250,
    plays: 710000,
    coverUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80",
    lyrics: `[00:00.00]♪ Ánh Nắng Của Anh - Đức Phúc ♪
[00:08.00]Từ bao lâu nay anh vẫn luôn âm thầm tìm kiếm
[00:16.00]Một người xua tan đi màn đêm lạnh giá trong tim
[00:24.00]Và rồi em đến như ánh nắng sớm mai dịu dàng
[00:32.00]Cảm ơn em đã là ánh nắng của đời anh 🌅💛`,
  },
];

const AUDIO_STREAMS = Array.from(
  { length: 16 },
  (_, i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`
);

async function main() {
  console.log("🇻🇳 [Waifu Player] Bắt đầu nạp danh mục Bài Hát Có Lời Việt & Synced Lyrics...");

  // 1. Tạo hoặc cập nhật Thể loại Tiếng Việt
  const genreMap = new Map<string, any>();
  for (const g of VIETNAMESE_GENRES) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: { id: crypto.randomUUID(), name: g.name, slug: g.slug },
    });
    genreMap.set(g.slug, genre);
  }
  console.log(`✅ Đã đồng bộ ${VIETNAMESE_GENRES.length} thể loại Tiếng Việt`);

  // 2. Tạo hoặc cập nhật Nghệ sĩ Tiếng Việt
  const artistMap = new Map<string, any>();
  for (const a of VIETNAMESE_ARTISTS) {
    let artist = await prisma.artist.findFirst({ where: { name: a.name } });
    if (!artist) {
      artist = await prisma.artist.create({
        data: {
          id: crypto.randomUUID(),
          name: a.name,
          bio: a.bio,
          avatarUrl: a.avatarUrl,
          coverUrl: a.coverUrl,
          verified: true,
        },
      });
    }
    artistMap.set(a.name, artist);
  }
  console.log(`✅ Đã đồng bộ ${VIETNAMESE_ARTISTS.length} nghệ sĩ Tiếng Việt`);

  // 3. Tạo Albums
  const albumMap = new Map<string, any>();
  for (const songDef of VIET_SONGS_CATALOG) {
    if (!albumMap.has(songDef.albumTitle)) {
      const artist = artistMap.get(songDef.artistName) || Array.from(artistMap.values())[0];
      let album = await prisma.album.findFirst({ where: { title: songDef.albumTitle } });
      if (!album) {
        album = await prisma.album.create({
          data: {
            id: crypto.randomUUID(),
            title: songDef.albumTitle,
            coverUrl: songDef.coverUrl,
            artistId: artist.id,
            releaseDate: new Date(),
          },
        });
      }
      albumMap.set(songDef.albumTitle, album);
    }
  }

  // 4. Tạo hoặc cập nhật Bài hát có Lời Việt
  let insertedCount = 0;
  for (let idx = 0; idx < VIET_SONGS_CATALOG.length; idx++) {
    const item = VIET_SONGS_CATALOG[idx];
    const artist = artistMap.get(item.artistName);
    const album = albumMap.get(item.albumTitle);
    const genre = genreMap.get(item.genreSlug);
    const audioUrl = AUDIO_STREAMS[idx % AUDIO_STREAMS.length];

    let song = await prisma.song.findFirst({ where: { title: item.title } });

    if (!song) {
      song = await prisma.song.create({
        data: {
          id: crypto.randomUUID(),
          title: item.title,
          duration: item.duration,
          fileUrl: audioUrl,
          coverUrl: item.coverUrl,
          lyrics: item.lyrics,
          plays: item.plays,
          isPublic: true,
          albumId: album ? album.id : undefined,
          releaseDate: new Date(),
          artists: artist ? { create: [{ artistId: artist.id }] } : undefined,
          genres: genre ? { create: [{ genreId: genre.id }] } : undefined,
        },
      });

      // Tạo chứng nhận bản quyền ISRC cho bài hát lời Việt
      const isrc = `VN-WFP-2026-VN${String(idx + 1).padStart(4, "0")}`;
      await prisma.songCopyright.create({
        data: {
          id: crypto.randomUUID(),
          songId: song.id,
          ownerName: item.artistName,
          licenseType: "ALL_RIGHTS_RESERVED",
          isrc,
          copyrightYear: 2026,
          distributionRights: "VIETNAM_AND_GLOBAL",
          status: "ACTIVE",
        },
      });
      insertedCount++;
    } else {
      // Cập nhật lyrics nếu bài hát đã tồn tại
      await prisma.song.update({
        where: { id: song.id },
        data: {
          lyrics: item.lyrics,
          plays: { increment: 5000 },
        },
      });
    }
  }

  // Cập nhật thêm lyrics Tiếng Việt cho các bài hát hiện có trong hệ thống nếu chưa có lyrics
  const allExistingSongs = await prisma.song.findMany({
    where: { lyrics: null },
    take: 80,
  });

  const sampleVietLyrics = [
    `[00:00.00]♪ Giai điệu Anime Lời Việt Waifu Player ♪\n[00:05.00]Từng nốt nhạc ngân vang sưởi ấm trái tim em\n[00:12.00]Cùng bước vào thế giới thần tiên rực rỡ sắc màu\n[00:20.00]Dẫu mai này bão giông ta vẫn luôn kề vai\n[00:28.00]Giai điệu này mãi khắc sâu trong tâm hồn đôi ta ✨`,
    `[00:00.00]♪ Khúc Ca Waifu Anime Lời Việt ♪\n[00:06.00]Gió cuốn trôi ngàn vì sao sáng trên bầu trời cao\n[00:14.00]Lời hẹn thề năm xưa xin gửi trọn vào khúc nhạc này\n[00:22.00]Hãy nhắm mắt lại và cảm nhận từng nhịp đập yêu thương 💖`,
  ];

  for (let i = 0; i < allExistingSongs.length; i++) {
    await prisma.song.update({
      where: { id: allExistingSongs[i].id },
      data: {
        lyrics: sampleVietLyrics[i % sampleVietLyrics.length],
      },
    });
  }

  console.log(`🎉 [Hoàn thành] Đã thêm ${insertedCount} bài hát lời Việt mới với lyrics đầy đủ!`);
  console.log(`🌸 Cập nhật lyrics cho ${allExistingSongs.length} bài hát khác trong kho nhạc.`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed bài hát lời Việt:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
