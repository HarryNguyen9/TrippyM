// ===== FIREBASE CONFIG =====
// Lưu ý: đây không phải "secret key" thực sự - Firebase apiKey được thiết kế
// để lộ ra client. Bảo mật thực sự nằm ở Firebase Security Rules (Realtime DB Rules).
export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  dbUrl: string;
}

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBtAFE7vfxgFsphnPZGodXV7-UfSVb7YQc",
  projectId: "trip-app-8e382",
  dbUrl: "https://trip-app-8e382-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// CẤU HÌNH CLOUDINARY (THAY THÔNG TIN CỦA BẠN VÀO ĐÂY)
export const CLOUDINARY_NAME: string = "dzsqd833s";
export const CLOUDINARY_PRESET: string = "trippy_preset";
