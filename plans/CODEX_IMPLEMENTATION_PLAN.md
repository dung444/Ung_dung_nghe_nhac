# 📋 CODEX IMPLEMENTATION PLAN: FIX BUGS & FINALIZE WAIFU PLAYER

> **Tài liệu đặc tả kỹ thuật & Hướng dẫn thực thi chi tiết dành cho Codex**  
> **Dự án**: Waifu Player (Expo SDK 54 + React Native + Node.js + Express + Prisma + MySQL Monorepo)  
> **Mục tiêu**: Xử lý triệt để 8 lỗi kỹ thuật & tồn đọng trải nghiệm (Lỗi 500 Upload/Publish, lệch ID ca sĩ, logic Thả tim, Đăng xuất trên Web, mất Avatar khi F5, MiniPlayer đè chữ, luồng Nạp xu & Dữ liệu kho nhạc).

---

## 🏛️ LAYER 0: NGUYÊN TẮC THỰC THI (CODING CONSTRAINTS)
- Giữ nguyên cấu trúc Monorepo hiện tại (`apps/api`, `apps/mobile`, `packages/*`).
- Không thêm thư viện lạ ngoài stack công nghệ đã quy định.
- Giữ vững Type Safety: Không ép kiểu `any` bừa bãi, cập nhật types nếu cần.
- Kiểm thử sau khi code: Chạy `npm --prefix apps/api run test` và `npm --prefix apps/mobile run test` (typecheck) để đảm bảo không gãy chức năng cũ.

---

## 📌 TASK 1: Sửa Lỗi 500 Khi Tải Ảnh (Upload Cover / Avatar)
- **Vị trí file**: `apps/api/src/middleware/upload.middleware.ts`
- **Nguyên nhân gốc rễ (RCA)**: Multer cấu hình lưu ảnh vào `apps/api/uploads/covers`. Tuy nhiên, thư mục `covers` chưa từng được tạo tự động trên ổ cứng. Khi người dùng tải ảnh từ máy, Node.js văng lỗi `ENOENT: no such file or directory` dẫn đến phản hồi 500.
- **Các bước sửa đổi**:
  1. Thêm hàm đảm bảo thư mục tồn tại:
     ```typescript
     import fs from "fs";
     import path from "path";

     const ensureDirExists = (dirPath: string) => {
       if (!fs.existsSync(dirPath)) {
         fs.mkdirSync(dirPath, { recursive: true });
       }
     };

     // Tự động kiểm tra và tạo ngay khi nạp module
     ensureDirExists(path.join(process.cwd(), env.UPLOAD_DIR, "audio"));
     ensureDirExists(path.join(process.cwd(), env.UPLOAD_DIR, "covers"));
     ```
  2. Bổ sung `ensureDirExists` bên trong callback `destination` của cả `audioStorage` và `coverStorage`:
     ```typescript
     destination: (_req, _file, cb) => {
       const dest = path.join(process.cwd(), env.UPLOAD_DIR, "covers");
       ensureDirExists(dest);
       cb(null, dest);
     }
     ```

---

## 📌 TASK 2: Sửa Lỗi 500 Khi Xuất Bản Bài Hát Tại Phòng Sáng Tạo (Creator Studio)
- **Vị trí files**:
  - `apps/mobile/src/app/creator/index.tsx`
  - `apps/api/src/domains/creator/creator.service.ts`
- **Nguyên nhân gốc rễ (RCA)**:
  - Trong `creator/index.tsx`: State `selectedGenreId` khởi tạo giá trị `"g1"` (ID giả).
  - Khi submit lên API `POST /api/v1/creator/songs`, `creator.service.ts` thực hiện `genres: { create: [{ genreId: "g1" }] }`. Bảng `SongGenre` trong MySQL có ràng buộc khóa ngoại tới `Genre.id`. Do `"g1"` không tồn tại trong database, MySQL ném lỗi vi phạm khóa ngoại (`Foreign Key Constraint Failure`) $\rightarrow$ Sập 500.
- **Các bước sửa đổi**:
  1. **Trong `apps/mobile/src/app/creator/index.tsx`**:
     - Lấy danh sách thể loại từ database (hoặc qua `GET /api/v1/songs` hay danh mục genres) khi component mount.
     - Lưu danh sách thể loại vào state `genresList` và đặt `selectedGenreId` là ID thực tế đầu tiên (UUID). Nếu chưa chọn thể loại hợp lệ, gửi mảng rỗng `genreIds: []` thay vì `"g1"`.
  2. **Trong `apps/api/src/domains/creator/creator.service.ts`**:
     - Trong hàm `createCreatorSong`: Trước khi tạo liên kết `SongGenre`, lọc và chỉ giữ lại những `genreId` thực sự tồn tại trong database:
     ```typescript
     let validGenreIds: string[] = [];
     if (Array.isArray(data.genreIds) && data.genreIds.length > 0) {
       const existingGenres = await prisma.genre.findMany({
         where: { id: { in: data.genreIds } },
         select: { id: true },
       });
       validGenreIds = existingGenres.map((g) => g.id);
     }
     ```
     - Sau đó tạo liên kết bằng `validGenreIds`:
     ```typescript
     genres: {
       create: validGenreIds.map((genreId) => ({ genreId })),
     }
     ```

---

## 📌 TASK 3: Sửa Lỗi Ca Sĩ Nổi Bật Trang Chủ 0 Bài Hát (Đồng Bộ ID Thật)
- **Vị trí file**: `apps/mobile/src/app/(tabs)/index.tsx`
- **Nguyên nhân gốc rễ (RCA)**:
  - Trang chủ hardcode mảng `FEATURED_ARTISTS` với các ID giả lập (`"art1"`, `"art2"`). Khi người dùng bấm vào Hatsune Miku, app điều hướng đến `/artist/art1`. Server không tìm thấy ID này nên trả về 0 bài hát.
  - Trong khi đó, màn hình Khám phá (`search.tsx`) lấy đúng UUID từ database (`30481829-...`) nên có đủ bài hát.
- **Các bước sửa đổi**:
  1. Thay thế mảng tĩnh `FEATURED_ARTISTS` bằng state động `featuredArtists` lấy từ API `GET /api/v1/artists`:
     ```typescript
     const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);

     useEffect(() => {
       api.get("/api/v1/artists")
         .then((res) => {
           if (res.data?.success && Array.isArray(res.data.data)) {
             setFeaturedArtists(res.data.data);
           }
         })
         .catch(() => {});
     }, []);
     ```
  2. Khi người dùng bấm vào nghệ sĩ, điều hướng chính xác theo UUID thực tế:
     ```typescript
     router.push(`/artist/${artist.id}`);
     ```

---

## 📌 TASK 4: Sửa Logic Thả Tim / Huỷ Yêu Thích & Thông Báo Toast
- **Vị trí file**: `apps/mobile/src/app/song/[id].tsx`
- **Nguyên nhân gốc rễ (RCA)**:
  - Khi kiểm tra bài hát đã thích: `res.data.data.some(item => item.songId === currentSong.id)`. Tuy nhiên, API `GET /api/v1/users/me/liked` trả về danh sách bài hát trực tiếp (`item.id`). Vì thiếu kiểm tra `item.id`, `isSongLiked` luôn bị tính là `false`.
  - Trong hàm `handleToggleLike`: Thông báo Toast được hiển thị dựa trên biến dự đoán `newLiked` của frontend thay vì giá trị thực tế `res.data.data.liked` từ Server.
- **Các bước sửa đổi**:
  1. Sửa đoạn khởi tạo trạng thái yêu thích:
     ```typescript
     const isSongLiked = res.data.data.some(
       (item: any) => item.id === currentSong.id || item.songId === currentSong.id || item.song?.id === currentSong.id
     );
     setIsLiked(isSongLiked);
     ```
  2. Sửa hàm `handleToggleLike` căn cứ vào phản hồi thực tế từ server:
     ```typescript
     const res = await api.post(`/api/v1/songs/${currentSong.id}/like`);
     if (res.data?.success && typeof res.data?.data?.liked === "boolean") {
       const serverLiked = res.data.data.liked;
       setIsLiked(serverLiked);
       setCurrentSong({ ...currentSong, isLiked: serverLiked });

       const { useToastStore } = require("../../store/toastStore");
       if (serverLiked) {
         useToastStore.getState().showSuccess("Yêu thích 💖", `Đã thêm "${currentSong.title}" vào danh sách yêu thích.`);
       } else {
         useToastStore.getState().showInfo("Đã hủy thích 💔", `Đã gỡ "${currentSong.title}" khỏi danh sách yêu thích.`);
       }
     }
     ```

---

## 📌 TASK 5: Sửa Lỗi Đăng Xuất Trên Web & Lưu Avatar Vĩnh Viễn
- **Vị trí files**:
  - `apps/mobile/src/app/(tabs)/profile.tsx`
  - `apps/mobile/src/store/authStore.ts`
- **Nguyên nhân gốc rễ (RCA)**:
  - Trên Web, hàm `window.confirm` thường bị các trình duyệt hiện đại chặn hoặc bỏ qua, khiến code không bao giờ chạy đến lệnh `logout()`.
  - Khi tải ảnh lên, avatar chưa được đồng bộ vào `useAuthStore` (do API upload bị lỗi 500 ở Task 1), nên khi F5 lại trang thì mất ảnh.
- **Các bước sửa đổi**:
  1. **Đăng xuất bằng React Native Modal**:
     - Thêm state `showLogoutConfirmModal` trong `profile.tsx`.
     - Thay vì gọi `window.confirm`, khi bấm nút Đăng xuất sẽ set `setShowLogoutConfirmModal(true)`.
     - Tạo Modal giao diện đẹp với 2 nút: "Hủy" và "Xác nhận đăng xuất". Khi bấm xác nhận:
     ```typescript
     const confirmLogout = () => {
       setShowLogoutConfirmModal(false);
       logout();
       try {
         const { useToastStore } = require("../../store/toastStore");
         useToastStore.getState().showInfo("Đã đăng xuất 👋", "Hẹn gặp lại bạn!");
       } catch {}
       router.replace("/(auth)/login" as any);
     };
     ```
  2. **Lưu Avatar vĩnh viễn**:
     - Khi API `POST /api/v1/users/me/avatar` trả về thành công:
     ```typescript
     const rawUrl = res.data.data.avatarUrl;
     const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE_URL}${rawUrl}`;
     setUser({ ...user, avatarUrl: fullUrl });
     ```
     - Nhờ `persist` trong `useAuthStore`, ảnh sẽ được lưu vào storage và giữ nguyên khi refresh trang.

---

## 📌 TASK 6: Khắc Phục Lỗi Mini-Player Đè Chữ & Che Khuất Nút
- **Vị trí files**:
  - `apps/mobile/src/features/player/components/MiniPlayer.tsx`
  - `apps/mobile/src/app/(tabs)/index.tsx`
  - `apps/mobile/src/app/(tabs)/profile.tsx`
  - `apps/mobile/src/app/(tabs)/library.tsx`
- **Nguyên nhân gốc rễ (RCA)**:
  - Màu nền `container` của Mini Player là màu bán trong suốt `rgba(26, 26, 46, 0.95)`, khi cuộn chữ bên dưới lên sẽ bị lộ bóng chữ đè vào nhau.
  - Các `ScrollView` thiếu khoảng đệm dưới đáy (`paddingBottom`), khiến Mini Player nổi lên che mất nút Đăng xuất và các phần tử cuối trang.
- **Các bước sửa đổi**:
  1. Trong `MiniPlayer.tsx`: Đổi màu nền thành màu đục nguyên khối:
     ```typescript
     container: {
       backgroundColor: "#121224", // Màu đục 100%, không bị xuyên thấu
       borderRadius: 14,
       borderWidth: 1,
       borderColor: "rgba(233, 30, 99, 0.4)",
       // ...
     }
     ```
  2. Trong các file tabs (`index.tsx`, `profile.tsx`, `library.tsx`): Thêm `contentContainerStyle` cho `ScrollView`:
     ```typescript
     <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
     ```

---

## 📌 TASK 7: Tối Ưu Nạp Xu & Tặng Quà (Shortcut Nạp Xu)
- **Vị trí files**:
  - `apps/mobile/src/features/gifts/GiftModal.tsx`
  - `apps/mobile/src/features/payments/PaymentCheckoutModal.tsx`
- **Các bước sửa đổi**:
  1. Trong `GiftModal.tsx`: Khi số dư xu của người dùng không đủ để tặng quà:
     - Hiển thị thêm nút bấm nổi bật **"Nạp xu ngay ⚡"**.
     - Khi bấm nút này: Tự động đóng `GiftModal` và kích hoạt mở `PaymentCheckoutModal` để người dùng nạp tiền tức thì.
  2. Bổ sung kiểm tra đăng nhập: Nếu `!isAuthenticated`, hiển thị cảnh báo yêu cầu đăng nhập kèm nút điều hướng đến `/(auth)/login`.

---

## 📌 TASK 8: Nạp Bổ Sung Dữ Liệu Thực Tế Cho 20 Ca Sĩ (Seed Data)
- **Vị trí thư mục**: `apps/api/prisma/`
- **Các bước thực hiện**:
  1. Chạy nạp dữ liệu nhạc từ các file có sẵn:
     ```powershell
     npm --prefix apps/api run prisma:seed
     npx tsx apps/api/prisma/seed_viet_songs.ts
     npx tsx apps/api/prisma/seed_50_more_vocal_songs.ts
     ```
  2. Đảm bảo toàn bộ 20 nghệ sĩ (Aimer, Ado, YOASOBI, SawanoHiroyuki...) đều có ít nhất 2 - 5 bài hát thực tế phát được.

---

## 🧪 QUY TRÌNH KIỂM CHỨNG & NGHIỆM THU (VERIFICATION)

Sau khi hoàn thành tất cả các Task trên, Codex cần chạy các lệnh kiểm tra sau:

1. **Chạy Typecheck toàn bộ dự án**:
   ```powershell
   npm --prefix apps/mobile run test
   npm --prefix apps/api run build
   ```
   *Yêu cầu: 0 lỗi TypeScript.*

2. **Chạy Test Suite Backend**:
   ```powershell
   npm --prefix apps/api run test
   ```
   *Yêu cầu: Vượt qua 100% (95/95 tests).*

3. **Kiểm thử giao diện thực tế**:
   - Tải ảnh đại diện mới từ máy $\rightarrow$ Refresh F5 $\rightarrow$ Avatar vẫn giữ nguyên.
   - Bấm nút "Đăng xuất" $\rightarrow$ Modal xác nhận hiện lên $\rightarrow$ Bấm xác nhận $\rightarrow$ Đăng xuất thành công về màn hình Login.
   - Vào Phòng Sáng Tạo (`/creator`) $\rightarrow$ Điền thông tin bài hát $\rightarrow$ Bấm xuất bản $\rightarrow$ Thành công không lỗi 500.
   - Bấm vào Hatsune Miku ở Trang chủ $\rightarrow$ Hiển thị đầy đủ danh sách bài hát.
   - Thử thả tim bài hát $\rightarrow$ Toast hiện "Yêu thích 💖"; bấm lần nữa $\rightarrow$ Toast hiện "Đã hủy thích 💔".
