# Project Rules & Guidelines: WAIFU PLAYER

> **Triết lý cốt lõi**: *"Strict where correctness matters, autonomous where the scope is clear."*  
> Nghiêm ngặt ở nơi quyết định tính đúng đắn — Tự chủ linh hoạt ở nơi phạm vi đã rõ ràng.

---

## 🏛️ LAYER 1: NGUYÊN TẮC BẤT BIẾN (ALWAYS APPLIED)

### 1.1. Điều tra trước khi hỏi (Investigate First)
AI tuyệt đối **KHÔNG** hỏi những câu hỏi mà câu trả lời đã có sẵn trong:
- Codebase monorepo: `apps/api`, `apps/mobile`, `packages/types`, `packages/validation`, `packages/utils`.
- Schema Prisma (`apps/api/prisma/schema.prisma`), migrations, seed scripts.
- Bộ cẩm nang đặc tả: [`README.md`](file:///c:/btl.ungdungnghenhac/README.md), [`STACK_CONG_NGHE.md`](file:///c:/btl.ungdungnghenhac/STACK_CONG_NGHE.md).
- Lịch sử Git hoặc các test cases hiện tại (`vitest`, `supertest`, `jest`).

### 1.2. Hàng rào phạm vi (Scope Guard & Enabling Changes)
- **Không mở rộng phạm vi (No Scope Creep)**: Không tự ý đổi kiến trúc Monorepo, không tự ý thay thế Audio Engine (`react-native-track-player`), State Management (`zustand`), ORM (`prisma`), hay thêm thư viện lạ ngoài [`STACK_CONG_NGHE.md`](file:///c:/btl.ungdungnghenhac/STACK_CONG_NGHE.md).
- **Ngoại lệ hợp lệ (Enabling Changes)**: Được phép thực hiện các sửa đổi phụ trợ tối thiểu (như export thêm Type trong `packages/types`, bổ sung schema validate trong `packages/validation`, helper trong `packages/utils`, chỉnh prop component dùng chung) nếu đó là điều kiện tiên quyết để task hiện tại hoạt động.
- **Phát hiện bug ngoài phạm vi**: Ghi chú lại và báo cáo sau task, không sửa chen ngang làm gãy luồng chính.

### 1.3. Bảo mật & An toàn dữ liệu
- Không bao giờ commit secrets (`.env*`, keys, JWT secrets), audio tracks dung lượng lớn, build outputs, cache.
- Tách biệt tuyệt đối giữa `waifu_player_dev` và `waifu_player_test`. Test suite không bao giờ được ghi đè hay xóa dữ liệu của môi trường phát triển.
- Xác thực phân quyền chặt chẽ theo Role (`USER`, `ARTIST`, `ADMIN`) trên các API endpoints nhạy cảm (upload bài hát, chỉnh sửa album, quản lý người dùng).

### 1.4. Quy chuẩn Git Commit
- Sử dụng **Conventional Commits tiếng Việt không dấu**: `feat(...)`, `fix(...)`, `test(...)`, `chore(...)`, `refactor(...)`, `style(...)`, `docs(...)`.
- Luôn chạy `git status` và `git add <tệp_cụ_thể>` trước khi commit.

### 1.5. Quy trình Hậu Sửa Lỗi & Đúc Rút Kinh Nghiệm (Post-Fix Retrospective & Prevention)
Sau mỗi lần xử lý bug, sự cố audio stream, lỗi schema hoặc lỗi kiểm thử (Post-Task Audit / Bug Fix), AI **BẮT BUỘC** tuân thủ quy trình 4 bước:
1. **Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)**: Xác định rõ tại sao lỗi xảy ra (do thiết kế schema, thiếu guard state trong Zustand store, lỗi socket sync drift, thiếu middleware auth hay vấn đề native audio runtime).
2. **Khóa Lỗi bằng Regression Test**: Viết bổ sung ít nhất 1 test case tái hiện lỗi và chứng minh lỗi đã được khắc phục hoàn toàn (ví dụ: test 401 unauth, 403 forbidden, test queue bounds out-of-range, test refresh token expiry).
3. **Quét Phòng ngừa Toàn diện (Horizontal Scan)**: Lập tức rà soát các module, endpoints, stores còn lại trong dự án xem có tồn tại mô hình lỗi tương tự hay không để xử lý đồng bộ.
4. **Ghi chép Bài học kinh nghiệm**: Ghi nhận chi tiết nguyên nhân, giải pháp và nguyên tắc phòng ngừa vào tài liệu tiến độ hoặc nhật ký commit để các task tiếp theo không tái phạm.

---

## ⚡ LAYER 2: QUY CHUẨN THỰC THI THEO RỦI RO (RISK-BASED WORKFLOW)

| Cấp độ Task | Phạm vi công việc | Quy trình Code (TDD) | Phương pháp Kiểm chứng (Verification) | Cập nhật Tiến độ |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Nhỏ / UI / Anime Theme / Docs** | Sửa giao diện Anime/Waifu UI, màu sắc, typography, icon, text nhãn, slider trực quan, layout tĩnh, cập nhật tài liệu. | **Không cần TDD**. Triển khai ngay và kiểm tra trực quan. | Chạy Typecheck (`pnpm --filter mobile tsc --noEmit` hoặc lint). | Cập nhật tài liệu / checklist tương ứng. |
| **Tier 2: Logic / API / Audio State / Realtime** | Viết endpoint REST API (`songs`, `playlists`, `rooms`, `artists`, `auth`), logic phát nhạc / queue / shuffle / repeat trong `playerStore`, Socket.io handlers (`/presence`, `/room`, `/playlist`), upload file Multer. | **Bắt buộc TDD**: Viết test đỏ $\rightarrow$ Code xanh $\rightarrow$ Tối ưu. | Chạy test suite liên quan (`pnpm test` / Vitest) + Typecheck pass 100%. | Đánh dấu hoàn thành test và log nhật ký. |
| **Tier 3: Schema / Contract / Native Audio Engine** | Thay đổi Prisma schema, Socket.io event payloads (`packages/types`), migrations, cấu hình background audio service (`react-native-track-player`). | **Spec-First**: Đối soát Frozen Contract $\rightarrow$ Viết Migration $\rightarrow$ Viết Test. | Chạy test contract + DB integration test + Full Typecheck monorepo. | Đánh dấu hoàn thành milestone và log chi tiết. |

### 2.1. Quy tắc làm rõ nghiệp vụ (Business Ambiguity)
* Khi phát hiện điểm mơ hồ về **luồng phát audio (playback state, queue logic, background audio service), cơ chế đồng bộ phòng nghe (Room Playback Sync / Server Time Drift), phân quyền (USER vs ARTIST vs ADMIN), hoặc giới hạn upload file âm thanh/ảnh bìa**: Bắt buộc dừng lại và hỏi người dùng trước khi code.

### 2.2. Kích hoạt Kỹ năng (Pragmatic Skills Usage)
* Chỉ invoke kỹ năng trong `.agents/skills/` khi: (1) Skill thực sự tồn tại, (2) Liên quan trực tiếp đến domain của task (UI/UX Anime Theme, TDD, Audio Debugging, Testing), và (3) Lợi ích đem lại lớn hơn chi phí overhead. Không gọi skill chỉ để đối phó hình thức.

---

## 🏁 LAYER 3: NGHIỆM THU MILESTONE & RELEASE GATES

Khi hoàn thành toàn bộ một **Module chức năng** hoặc một **Vertical Slice lớn**:

1. **Full Quality Check**:
   - Bắt buộc kiểm tra toàn diện chất lượng mã nguồn:
     * `pnpm test` (hoặc `turbo test`): Vượt qua 100% các unit test và integration test.
     * `pnpm build` (hoặc typecheck): Không có bất kỳ lỗi TypeScript nào ở cả `apps/api`, `apps/mobile` và `packages/*`.
     * `pnpm lint`: Sạch lỗi ESLint và React Hooks rules.
2. **Đồng bộ hóa Tài liệu Dự án**:
   - [`README.md`](file:///c:/btl.ungdungnghenhac/README.md): Đảm bảo các hướng dẫn cài đặt và chạy môi trường dev/test luôn cập nhật và chính xác.
   - [`STACK_CONG_NGHE.md`](file:///c:/btl.ungdungnghenhac/STACK_CONG_NGHE.md): Khớp 100% phiên bản dependencies và cấu trúc kiến trúc.
3. **Commit & Push**:
   - Thực hiện Git commit theo chuẩn Conventional Commits và đẩy mã nguồn lên kho lưu trữ.
