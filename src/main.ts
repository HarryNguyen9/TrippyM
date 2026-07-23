// =====================================================================
// TRIPPY - Trip Management App
// File này được chuyển đổi tự động từ index.html (bản HTML/JS thuần)
// sang TypeScript. Toàn bộ logic bên dưới được giữ NGUYÊN VẸN,
// chỉ thêm phần import/khai báo type ở đầu file để chạy được qua Vite + TS.
// =====================================================================

import "./style.css";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  runTransaction,
} from "firebase/database";
import { FIREBASE_CONFIG, CLOUDINARY_NAME, CLOUDINARY_PRESET } from "./config";

// --- Khai báo các thư viện load qua CDN (xlsx, html2canvas, confetti) ---
// Các thư viện này vẫn được load bằng thẻ <script> thường trong index.html
// (giữ nguyên như bản cũ), nên chúng tồn tại dưới dạng biến global.
// Dòng dưới đây chỉ để TypeScript không báo lỗi "không tìm thấy biến".
declare const XLSX: any;
declare const html2canvas: any;
declare const confetti: any;

// --- Mở rộng type cho window vì code cũ gán rất nhiều thứ vào window ---
declare global {
  interface Window {
    _fbSDK: any;
    _firebaseApp: any;
    _firebaseDb: any;
    [key: string]: any;
  }
}

window._fbSDK = _fbSDK = { initializeApp, getApps, getApp, getDatabase, ref, set, get, onValue, off, runTransaction };
window._firebaseApp = _firebaseApp = null;
window._firebaseDb = _firebaseDb = null;

// --- Khai báo module-scope cho các biến/hàm vốn được gán qua window.X = ...
// (giữ hành vi giống hệt classic script cũ, nơi window === global scope) ---
var _advOverviewData, _advOverviewFilter, _fbSDK, _firebaseApp, _firebaseDb, _weatherCache;
var _weatherKey, _weatherLastFetch, _weatherLoc, addActivity, addDay, addEditPayerRow;
var addMember, addPayerRow, addSuggestedPackingItem, cancelAllSettings, cancelEditCode, cancelEditLoc;
var cancelEditName, changeTripCode, closeLightbox, connectFirebase, createNewTrip;
var currentPaymentFilter, currentRandomMode, deleteActivity, deleteDay, deleteGalleryItem, deleteHistoryCashIn;
var deleteMember, deletePackingItem, deletePayment, dialogScrollPos, disconnectFirebase, downloadMasterExcelTemplate;
var draftActivity, editFundLink, editHistoryCashIn, enableEditCode, enableEditLoc, enableEditMemName;
var enableEditName, exitRoom, exportItineraryToImage, exportMasterDataToExcel, exportMemberExpensesToExcel, exportPaymentToImage;
var exportPaymentsToExcel, finalActId, getLinkedPaymentIndices, handleQrUpload, importMasterDataFromExcel, initSwipeActions;
var isEditMultiPayerMode, isMultiPayerMode, isOpeningExpenseFlow, isSavingActivityFlow, isUploadingImage, joinTrip;
var loadWeatherForItinerary, logoutEditor, manualDayCollapseState, moveGalleryItem, niceConfirm, nicePrompt;
var askAiSuggestions, clearGeminiKey, saveGeminiKey;
var openActModal, openAddActivityChoose, openAddMemberModal, openAddModal, openAddPaymentModal, openAdvanceOverviewModal;
var openAvatarModal, openDayExpenseModal, openEditActivity, openEditDay, openEditMember, openEditPayment;
var openExpenseFlow, openFullScheduleFromToday, openFundLink, openHistoryModal, openLightbox, openLinkToActModal;
var openMapModal, openPackingModal, openRandomModal, openSettingsPage, openTotalExpenseModal, pendingReturnToAct;
var pendingReturnToHistoryIdx, playCinematicIntro, playTing, randomizeAvatarInModal, randomizeNewMemberAvatar, refreshCurrentTrip;
var removeEditPmReceipt, removeFundQr, removeTripCover, renderCollection, renderGallery;
var renderPackingList, renderPayments, renderTodayView, resetDayForm, resetEditDayForm, saveAvatar;
var saveEditActivity, saveEditDay, saveEditMember, saveEditPayment, saveFundLink, saveLinkToAct;
var savePackingItem, savePayment, saveTripInfo, saveTripLoc, selectAvatarSeed, selectCategory, selectCity;
var setAdvanceOverviewFilter, setInitialEditorCode, setPaymentFilter, showToast, spinRandomizer, suppressNextDayClick;
var switchDashboardTab, switchGalleryTab, switchItineraryTab, switchRandomMode, switchSubTab, switchWelcomeTab, syncToFirebase;
var toastTimer, toggleAllParticipants, toggleDayCollapse, toggleEditMultiPayerMode, toggleEstimateMode, toggleFab;
var toggleFinishTrip, toggleHistoryTab, toggleIsland, toggleMultiPayerMode, togglePackingItem, togglePaymentPaid;
var toggleShareTrip, triggerSwipeHint, unlinkPaymentFromAct, unlockEditor, updateEditMultiTotal, updateIsland;
var updateManagementUI, updateMultiTotal, updateNewMemberAvatarPreview, updateSmartIsland, uploadReceipt, uploadToCloudinary;
var uploadTripCover, viewPublicTrip;


// =====================================================================
// TỪ ĐÂY TRỞ XUỐNG: TOÀN BỘ LOGIC GỐC CỦA APP (không đổi 1 dòng nào)
// =====================================================================

// --- Khôi phục hành vi "classic script": tự động gắn các function
// declaration top-level vào window (giống hệt cách trình duyệt tự làm
// với <script> thường, nhưng ES module thì KHÔNG tự làm việc này).
// Bắt buộc phải có để các đoạn code sau này (vd: monkey-patch renderAll,
// closeModal...) đọc được window.tenHam gốc mà không bị undefined. ---
  window._doConnect = _doConnect; window.applyTripTheme = applyTripTheme; window.applyVNDFormat = applyVNDFormat; window.autoJoinTripFromUrl = autoJoinTripFromUrl; window.autoSync = autoSync; window.cleanupPendingActivityExpense = cleanupPendingActivityExpense;
  window.closeModal = closeModal; window.computeAdvanceOverviewData = computeAdvanceOverviewData; window.esc = esc; window.formatVND = formatVND; window.getActivityDateTime = getActivityDateTime; window.getDayCollapseKey = getDayCollapseKey;
  window.getDaySmartStatus = getDaySmartStatus; window.getEmojiForCode = getEmojiForCode; window.getFundRemaining = getFundRemaining; window.getOverviewCurrentDayLabel = getOverviewCurrentDayLabel; window.getOverviewNextActivity = getOverviewNextActivity; window.getPaymentActivityContext = getPaymentActivityContext;
  window.getPaymentFromFundText = getPaymentFromFundText; window.getPaymentPayerText = getPaymentPayerText; window.getSafeExcelName = getSafeExcelName; window.getTodayPayments = getTodayPayments; window.getTodayTripContext = getTodayTripContext; window.getTripDayEntries = getTripDayEntries;
  window.getTripTheme = getTripTheme; window.getUrlTripCode = getUrlTripCode; window.guidedEmptyState = guidedEmptyState; window.init = init; window.initDraggableModals = initDraggableModals; window.isModalContentScrolled = isModalContentScrolled;
  window.isSameCalendarDay = isSameCalendarDay; window.isTripEditable = isTripEditable; window.openModal = openModal; window.parseTripDateValue = parseTripDateValue; window.renderAdvanceOverview = renderAdvanceOverview; window.renderAll = renderAll;
  window.renderItinerary = renderItinerary; window.resetActivityExpenseFlowUI = resetActivityExpenseFlowUI; window.resetLightboxZoom = resetLightboxZoom; window.resetModalScroll = resetModalScroll; window.save = save; window.setupNav = setupNav;
  window.setupTimePicker = setupTimePicker; window.showApp = showApp; window.showWelcome = showWelcome; window.startRealtimeListener = startRealtimeListener; window.stopRealtimeListener = stopRealtimeListener; window.updateTripCountdown = updateTripCountdown;
  window.updateTripCoverPreview = updateTripCoverPreview; window.updateTripOverview = updateTripOverview; window.updateUrlTripCode = updateUrlTripCode; window.verifyRole = verifyRole;


async function loadPublicTrips() {
  if (!window._firebaseDb) return;
  const sdk = window._fbSDK;
  const listEl = document.getElementById('publicTripsList');
  
  // HIỆN SKELETON KHI ĐANG TẢI
      listEl.innerHTML = Array(3).fill(0).map(() => `
    <div class="public-card public-trip-card">
        <div class="skeleton" style="height:118px; width:100%; border-radius:0;"></div>
        <div class="public-trip-body">
            <div class="skeleton" style="height:20px; width:70%;"></div>
            <div class="skeleton" style="height:12px; width:90%;"></div>
            <div class="skeleton" style="height:38px; width:100%; border-radius:12px;"></div>
        </div>
    </div>
  `).join('');

  try {
    const snapshot = await sdk.get(sdk.ref(window._firebaseDb, 'public_trips'));
    
    if (snapshot.exists()) {
      const trips = snapshot.val();
      let html = '';
      
      // Đảo ngược để hiện chuyến mới nhất lên đầu
      Object.keys(trips).reverse().forEach(code => {
          const t = trips[code];
          
          const tripName = t.trip ? t.trip.name : 'Chuyến đi';
          const isFinished = t.trip ? t.trip.isFinished : false;
          const vibe = t.trip && t.trip.vibe ? t.trip.vibe : 'beach';
          const theme = TRIP_THEMES[vibe] || TRIP_THEMES.beach;
          const coverUrl = t.trip && t.trip.coverUrl ? String(t.trip.coverUrl) : "";
          const coverStyle = coverUrl ? `background-image: url('${esc(coverUrl).replace(/'/g, "\\'")}');` : `background: ${theme.cover};`;
          
          // 1. CHỈNH SỬA: Chỉ tính tổng những khoản đã thanh toán (isPaid)
          const total = t.payments ? t.payments.reduce((s, p) => s + (p.isPaid ? (p.amount || 0) : 0), 0) : 0;
          
          const memberCount = t.members ? t.members.length : 0;
          const currentYear = new Date().getFullYear();
          let rawStart = t.days && t.days[0] ? t.days[0].date : '??';
          let rawEnd = t.days && t.days.length > 1 ? t.days[t.days.length - 1].date : rawStart;
          
          const startDate = rawStart !== '??' && rawStart.split('/').length < 3 ? `${rawStart}/${currentYear}` : rawStart;
          const endDate = rawEnd !== '??' && rawEnd.split('/').length < 3 ? `${rawEnd}/${currentYear}` : rawEnd;

          // 2. KHAI BÁO BIẾN LỖI: Định nghĩa statusBadgeHtml dựa trên trạng thái chuyến đi
          const statusBadgeHtml = isFinished 
            ? `<div style="display: inline-flex; font-size: 0.55rem; background: var(--red-bg); color: var(--red); border: 1px solid rgba(248,113,113,0.2); padding: 3px 10px; border-radius: 10px; font-weight: 600; margin-bottom: 10px;">✓ Kết thúc</div>`
            : `<div style="display: inline-flex; font-size: 0.55rem; background: var(--green-bg); color: var(--green); border: 1px solid rgba(74,222,128,0.2); padding: 3px 10px; border-radius: 10px; font-weight: 600; margin-bottom: 10px;">● Đang diễn ra</div>`;
          
          html += `
            <div class="public-card public-trip-card" onclick="viewPublicTrip('${code}')">
              <div class="public-trip-cover" style="${coverStyle}">
                ${statusBadgeHtml}
              </div>
              <div class="public-trip-body">
                <div class="public-trip-title">${theme.icon} ${esc(tripName)}</div>
                <div class="public-trip-meta">
                  ${(t.days || []).length} ngày · ${memberCount} người · ${formatVND(total)}
                </div>
                <button class="btn btn-secondary public-trip-cta" type="button">Xem kinh nghiệm</button>
              </div>
            </div>`;
      });
      listEl.innerHTML = html;
    } else {
      listEl.innerHTML = '<div class="empty" style="grid-column: 1 / -1; text-align: center; width: 100%;">Chưa có chuyến đi nào</div>';
    }
  } catch (e) {
    console.error("Lỗi khi tải danh sách công khai:", e);
  }
}


// --- CITY SUGGESTION ---
let cityTimeout = null;

async function handleCityInput(val) {
    const input = document.getElementById('settingTripLoc');
    const suggBox = document.getElementById('customSuggestions');
    
    if (val.trim().length < 2) { 
        suggBox.style.display = 'none'; 
        document.body.classList.remove('searching-city');
        return; 
    }
    
    clearTimeout(cityTimeout);
    cityTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=100&language=en&format=json`);
            const data = await res.json();
            
            if (data.results) {
                suggBox.innerHTML = data.results.map(city => {
                    const fullName = `${city.name}${city.admin1 ? ', '+city.admin1 : ''}, ${city.country}`;
                    
                    // Xử lý an toàn: Chống lỗi nếu tên thành phố có dấu nháy đơn (VD: Côte d'Ivoire)
                    const safeFullName = fullName.replace(/'/g, "\\'");
                    
                    // TRUYỀN ĐÚNG safeFullName VÀO ĐÂY
                    return `<div class="suggestion-item" onclick="selectCity('${safeFullName}', ${city.latitude}, ${city.longitude})">${fullName}</div>`;
                }).join('');

                // HIỆN BẢNG TRƯỚC ĐỂ ĐO ĐƯỢC KÍCH THƯỚC
                suggBox.style.display = 'block';
                
                // --- LOGIC TÍNH TOÁN VỊ TRÍ ---
                const rect = input.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const boxHeight = suggBox.offsetHeight;

                if (spaceBelow < boxHeight + 50) { 
                    // Nếu bên dưới không đủ chỗ (cách mép dưới < 50px), hiện lên trên
                    suggBox.style.top = 'auto';
                    suggBox.style.bottom = 'calc(100% + 5px)';
                    suggBox.style.borderRadius = '8px 8px 0 0';
                } else {
                    // Đủ chỗ thì hiện bên dưới như cũ
                    suggBox.style.bottom = 'auto';
                    suggBox.style.top = 'calc(100% + 5px)';
                    suggBox.style.borderRadius = '0 0 8px 8px';
                }

                document.body.classList.add('searching-city');
            }
        } catch (e) { console.error(e); }
    }, 400);
}

// Hàm này chạy khi bạn bấm vào một dòng trong dropdown
window.selectCity = selectCity = (fullName, lat, lon) => {
    const input = document.getElementById('settingTripLoc');
    const addressDetail = document.getElementById('locationFullAddress');

    const parts = fullName.split(',');
    const shortName = parts[0].trim();
    
    // Ép lấy phần hậu tố, nếu không có thì để trống
    const suffix = parts.length > 1 ? parts.slice(1).join(',').trim() : "";

    input.value = shortName;
    if (addressDetail) addressDetail.textContent = suffix;

    document.getElementById('customSuggestions').style.display = 'none';
    document.body.classList.remove('searching-city');

    if(!DATA.trip) DATA.trip = {};
    DATA.trip.location = shortName;
    DATA.trip.fullAddress = fullName; // Lưu full chuẩn: "Da Lat, Lam Dong..."
    DATA.trip.lat = lat;
    DATA.trip.lon = lon;

    save(); autoSync(); renderAll();
};

// Đóng menu nếu người dùng bấm chuột ra ngoài vùng nhập liệu
document.addEventListener('click', (e) => {
    const suggBox = document.getElementById('customSuggestions');
    const input = document.getElementById('settingTripLoc');
    
    // Nếu bấm ra ngoài vùng nhập liệu và bảng gợi ý
    if (suggBox && !suggBox.contains(e.target) && e.target !== input) {
        suggBox.style.display = 'none';
        document.body.classList.remove('searching-city'); // Hiện lại các nút
    }
});

// --- XỬ LÝ NÚT SỬA TÊN CHUYẾN ĐI ---
window.enableEditName = enableEditName = () => {
    window.cancelAllSettings(); // Đóng các ô khác trước khi mở ô này
    document.getElementById('settingTripName').disabled = false;
    document.getElementById('settingTripName').focus();
    document.getElementById('btnEditName').style.display = 'none';
    document.getElementById('btnSaveName').style.display = 'block';
    document.getElementById('btnCancelName').style.display = 'block';
};
window.cancelEditName = cancelEditName = () => {
    const input = document.getElementById('settingTripName');
    if(input) {
        input.value = DATA.trip.name || "";
        input.disabled = true;
    }
    if(document.getElementById('btnEditName')) document.getElementById('btnEditName').style.display = 'block';
    if(document.getElementById('btnSaveName')) document.getElementById('btnSaveName').style.display = 'none';
    if(document.getElementById('btnCancelName')) document.getElementById('btnCancelName').style.display = 'none';
};

// --- XỬ LÝ NÚT SỬA TRIP ID ---
window.enableEditCode = enableEditCode = () => {
    window.cancelAllSettings(); // Đóng các ô khác trước khi mở ô này
    document.getElementById('settingTripCode').disabled = false;
    document.getElementById('settingTripCode').focus();
    document.getElementById('btnEditCode').style.display = 'none';
    document.getElementById('btnSaveCode').style.display = 'block';
    document.getElementById('btnCancelCode').style.display = 'block';
};
window.cancelEditCode = cancelEditCode = () => {
    const input = document.getElementById('settingTripCode');
    if(input) {
        input.value = DATA.trip.code || "";
        input.disabled = true;
    }
    if(document.getElementById('btnEditCode')) document.getElementById('btnEditCode').style.display = 'block';
    if(document.getElementById('btnSaveCode')) document.getElementById('btnSaveCode').style.display = 'none';
    if(document.getElementById('btnCancelCode')) document.getElementById('btnCancelCode').style.display = 'none';
};

// Hàm hỗ trợ để người dùng bấm vào là xem được ngay
window.viewPublicTrip = viewPublicTrip = (code) => {
  document.getElementById('joinTripCode').value = code;
  document.getElementById('joinTripPass').value = ""; 
  
  // Cuộn lên đầu trang để người dùng thấy app đang xử lý
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Gọi hàm joinTrip đã được nâng cấp ở trên
  window.joinTrip();
};

// ===== DATA STRUCTURE =====
const EMPTY_DATA = {
  trip: { code: "", name: "Chuyến đi mới", secretKey: "", vibe: "beach", coverUrl: "" },
  flights: [], 
  days: [], 
  payments: [], // PHẢI CÓ DÒNG NÀY
  members: [], 
  fund: { 
    collected: 0, 
    used: 0,
    link: "", // Thêm dòng này
    qrUrl: "" // Thêm dòng này
  }
};

const TRIP_THEMES = {
  beach: { icon: "🏖", accent: "#38bdf8", accent2: "#0ea5e9", glow: "rgba(56,189,248,.14)", cover: "linear-gradient(135deg, rgba(14,165,233,.26), rgba(45,212,191,.16))", emptyTitle: "Biển xanh đang chờ!", emptyText: "Thêm ngày đầu tiên để bắt đầu xếp lịch ăn chơi ven biển.", emptyArt: "🏖", checklist: ["Kem chống nắng", "Đồ bơi", "Kính râm", "Túi chống nước"] },
  mountain: { icon: "⛰", accent: "#84cc16", accent2: "#65a30d", glow: "rgba(132,204,22,.14)", cover: "linear-gradient(135deg, rgba(101,163,13,.24), rgba(148,163,184,.14))", emptyTitle: "Đường núi còn trống!", emptyText: "Thêm lịch trình để cả nhóm biết hôm nào leo, hôm nào nghỉ.", emptyArt: "⛰", checklist: ["Áo khoác nhẹ", "Giày trekking", "Bình nước", "Thuốc say xe"] },
  camping: { icon: "🏕", accent: "#f97316", accent2: "#ea580c", glow: "rgba(249,115,22,.14)", cover: "linear-gradient(135deg, rgba(249,115,22,.25), rgba(34,197,94,.13))", emptyTitle: "Bãi cắm còn im ắng!", emptyText: "Thêm ngày và hoạt động để không quên lửa trại, đồ ăn, lịch dựng lều.", emptyArt: "🏕", checklist: ["Lều", "Đèn pin", "Túi ngủ", "Xịt côn trùng"] },
  city: { icon: "🌆", accent: "#a78bfa", accent2: "#8b5cf6", glow: "rgba(167,139,250,.14)", cover: "linear-gradient(135deg, rgba(139,92,246,.25), rgba(236,72,153,.12))", emptyTitle: "City map còn mới tinh!", emptyText: "Thêm lịch trình để gom quán ngon, điểm check-in và giờ di chuyển.", emptyArt: "🌆", checklist: ["Sạc dự phòng", "Vé/booking", "Thẻ ngân hàng", "Giày dễ đi"] },
  international: { icon: "✈️", accent: "#60a5fa", accent2: "#2563eb", glow: "rgba(96,165,250,.14)", cover: "linear-gradient(135deg, rgba(37,99,235,.26), rgba(232,197,71,.12))", emptyTitle: "Passport mode đã bật!", emptyText: "Thêm lịch trình để kiểm soát chuyến bay, nhập cảnh và các mốc quan trọng.", emptyArt: "✈️", checklist: ["Hộ chiếu", "Visa/giấy tờ", "Adapter chuyển ổ", "Bảo hiểm du lịch"] }
};

function getTripTheme() {
  const key = DATA && DATA.trip && DATA.trip.vibe ? DATA.trip.vibe : "beach";
  return TRIP_THEMES[key] || TRIP_THEMES.beach;
}

const EXPENSE_CATEGORIES = {
  food: { icon: "🍔", label: "Ăn uống", color: "#f97316" },
  transport: { icon: "🚕", label: "Đi lại", color: "#38bdf8" },
  hotel: { icon: "🏨", label: "Khách sạn", color: "#a78bfa" },
  fun: { icon: "🎟️", label: "Vui chơi", color: "#4ade80" },
  other: { icon: "🧾", label: "Khác", color: "#94a3b8" }
};

window.selectCategory = selectCategory = (prefix, key) => {
    const grid = document.getElementById(`${prefix}CategoryGrid`);
    const input = document.getElementById(`${prefix}Category`);
    if (!grid || !input) return;
    grid.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.toggle('selected', chip.getAttribute('data-category') === key);
    });
    input.value = key;
};

// --- 🤖 TRỢ LÝ AI (GEMINI) — GỢI Ý MÓN NGON / ĐỊA ĐIỂM HOT ---
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_KEY_STORAGE = 'gemini_api_key';
// Key cấu hình sẵn qua Environment Variable trên Vercel (build-time, nhúng vào bundle JS công khai).
const GEMINI_ENV_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
let _aiSuggestCache = {};

function getManualGeminiKey() {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
}

// Ưu tiên key cá nhân người dùng tự dán (nếu có), rồi mới rơi về key server cấu hình sẵn.
function getGeminiApiKey() {
    return getManualGeminiKey() || GEMINI_ENV_KEY;
}

function refreshGeminiKeyUI() {
    const input = document.getElementById('settingGeminiKey');
    const status = document.getElementById('geminiKeyStatus');
    if (!input) return;
    const hasManual = !!getManualGeminiKey();
    input.value = '';
    input.placeholder = hasManual ? '••••••••• (Đã lưu — dán key mới để đổi)' : 'Dán API Key riêng (không bắt buộc)...';
    if (status) {
        if (hasManual) status.textContent = '🔑 Đang dùng key riêng bạn đã lưu trên máy này.';
        else if (GEMINI_ENV_KEY) status.textContent = '✅ Đã có key cấu hình sẵn trên server (Environment Variable) — không cần nhập gì thêm.';
        else status.textContent = '⚠️ Chưa có key nào. Dán key riêng ở trên, hoặc nhờ Admin cấu hình biến VITE_GEMINI_API_KEY trên Vercel.';
    }
}

window.saveGeminiKey = saveGeminiKey = () => {
    const input = document.getElementById('settingGeminiKey');
    const val = input ? input.value.trim() : '';
    if (!val) return showToast("Vui lòng nhập API Key trước khi lưu", "error");
    localStorage.setItem(GEMINI_KEY_STORAGE, val);
    showToast("Đã lưu Gemini API Key riêng trên máy này", "success");
    refreshGeminiKeyUI();
};

window.clearGeminiKey = clearGeminiKey = () => {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    showToast(GEMINI_ENV_KEY ? "Đã xóa key riêng — chuyển về dùng key server" : "Đã xóa API Key khỏi máy này", "info");
    refreshGeminiKeyUI();
};

function renderAiSuggestList(items) {
    const listEl = document.getElementById('aiSuggestList');
    if (!listEl) return;
    if (!Array.isArray(items) || !items.length) {
        listEl.innerHTML = `<div class="today-muted">AI chưa tìm ra gợi ý nào, thử lại xem!</div>`;
        return;
    }
    listEl.innerHTML = items.map(item => `
        <div class="ai-suggest-item">
            <div class="ai-suggest-icon">${esc(item.icon || (item.type === 'food' ? '🍜' : '📍'))}</div>
            <div class="ai-suggest-body">
                <div class="ai-suggest-name">${esc(item.name || '')}</div>
                <div class="ai-suggest-desc">${esc(item.desc || '')}</div>
            </div>
        </div>
    `).join('');
}

window.askAiSuggestions = askAiSuggestions = async (forceRefresh = false) => {
    const location = ((DATA && DATA.trip && DATA.trip.location) || '').trim();
    if (!location) {
        showToast("Chuyến đi chưa có địa điểm! Vào Cài đặt để nhập trước.", "info");
        return;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        showToast("Chưa có Gemini API Key! Vào Cài đặt để dán key riêng, hoặc nhờ Admin cấu hình trên Vercel.", "error");
        openSettingsPage();
        return;
    }

    openModal('aiSuggestModal');
    const locLabel = document.getElementById('aiSuggestLocation');
    if (locLabel) locLabel.textContent = location;

    const listEl = document.getElementById('aiSuggestList');
    const cacheKey = location.toLowerCase();

    if (!forceRefresh && _aiSuggestCache[cacheKey]) {
        renderAiSuggestList(_aiSuggestCache[cacheKey]);
        return;
    }

    if (listEl) listEl.innerHTML = `
        <div style="text-align:center; padding: 30px 10px; color: var(--text3);">
            <div style="font-size: 2rem; margin-bottom: 10px;">🤖</div>
            <div style="font-size: 0.8rem;">Đang hỏi AI về ${esc(location)}...</div>
        </div>`;

    const prompt = `Bạn là trợ lý du lịch. Gợi ý 6 mục HOT nhất khi đi du lịch tại "${location}" (Việt Nam), trộn giữa món ăn đặc sản ngon và địa điểm vui chơi/tham quan nổi tiếng.
Trả lời NGẮN GỌN bằng tiếng Việt. CHỈ trả về DUY NHẤT một JSON array (không markdown, không giải thích thêm), đúng cấu trúc:
[{"type":"food hoặc place","icon":"1 emoji phù hợp","name":"Tên món/địa điểm","desc":"Mô tả 1 câu ngắn dưới 20 từ"}]`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error((data && data.error && data.error.message) || `Lỗi HTTP ${res.status}`);

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const items = JSON.parse(rawText);
        if (!Array.isArray(items)) throw new Error("AI trả về sai định dạng");

        _aiSuggestCache[cacheKey] = items;
        renderAiSuggestList(items);

    } catch (e) {
        console.error(e);
        if (listEl) listEl.innerHTML = `
            <div style="text-align:center; padding: 30px 10px; color: var(--red);">
                <div style="font-size: 2rem; margin-bottom: 10px;">😵</div>
                <div style="font-size: 0.8rem; line-height:1.5;">Không hỏi được AI: ${esc(e.message || 'Lỗi không xác định')}</div>
                <div style="font-size: 0.65rem; color: var(--text3); margin-top: 6px;">Kiểm tra lại API Key trong Cài đặt hoặc thử lại sau.</div>
            </div>`;
    }
};

function applyTripTheme() {
  const theme = getTripTheme();
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent2', theme.accent2);
  root.style.setProperty('--accent-glow', theme.glow);
  root.style.setProperty('--trip-cover', theme.cover);
  const islandIcon = document.getElementById('island-icon');
  if (islandIcon && !islandIcon.dataset.weatherOverride) islandIcon.textContent = theme.icon;
}

let DATA = null;
let isEditor = false;
let firebaseConnected = false;
let currentPage = 'today';
function isTripEditable() {
  return !!(isEditor && DATA && DATA.trip && !DATA.trip.isFinished);
}
let _realtimeUnsubscribe = null; // Giữ reference để hủy listener khi cần
let _ignoreNextSnapshot = false; // Flag để tránh re-render ngay sau khi mình vừa push lên Firebase

// ===== URL <-> TRIP CODE (để share link trực tiếp vào chuyến đi) =====
function getUrlTripCode() {
  try {
    return new URLSearchParams(window.location.search).get('trip') || null;
  } catch (e) { return null; }
}

function updateUrlTripCode(code) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    if (code) {
      url.searchParams.set('trip', code);
    } else {
      url.searchParams.delete('trip');
    }
    const qs = url.searchParams.toString();
    history.replaceState(null, '', url.pathname + (qs ? '?' + qs : '') + url.hash);
  } catch (e) { /* im lặng bỏ qua nếu trình duyệt không hỗ trợ */ }
}

// Khi mở link có sẵn ?trip=MA_ROOM (do người khác share), tự động tải phòng đó
// từ Firebase mà không cần tự gõ tay mã Room / bấm nút "Vào phòng".
function autoJoinTripFromUrl(code, attemptsLeft = 25) {
  if (window._fbSDK && window._firebaseDb && firebaseConnected) {
    const sdk = window._fbSDK;
    sdk.get(sdk.ref(window._firebaseDb, `rooms/${code}`)).then(snapshot => {
      if (snapshot.exists()) {
        DATA = snapshot.val();
        save();
        showApp();
        startRealtimeListener();
        showToast("Đã mở chuyến đi từ link chia sẻ!", "success");
      } else {
        showToast("Link chia sẻ không hợp lệ hoặc chuyến đi không còn tồn tại", "error");
        updateUrlTripCode(null);
        showWelcome();
      }
    }).catch(e => {
      showToast("Lỗi tải chuyến đi: " + e.message, "error");
      updateUrlTripCode(null);
      showWelcome();
    });
  } else if (attemptsLeft > 0) {
    setTimeout(() => autoJoinTripFromUrl(code, attemptsLeft - 1), 200);
  } else {
    showToast("Không thể kết nối máy chủ để mở link chia sẻ, thử tải lại trang.", "error");
    updateUrlTripCode(null);
    showWelcome();
  }
}

// ===== INIT =====
function init() {
  const urlTripCode = getUrlTripCode();
  const hasResetParam = new URLSearchParams(window.location.search).has('reset');

  const localData = localStorage.getItem('tripData');
  if (localData) {
    try { DATA = JSON.parse(localData); } catch(e) { DATA = null; }
  }

  if (!hasResetParam && urlTripCode && (!DATA || !DATA.trip || DATA.trip.code !== urlTripCode)) {
    // Link chia sẻ trỏ tới 1 chuyến đi khác (hoặc máy này chưa có dữ liệu) -> tự động tải về
    showWelcome();
    autoJoinTripFromUrl(urlTripCode);
  } else if (DATA && DATA.trip && DATA.trip.code) {
    showApp();
  } else {
    showWelcome();
  }

  // Tự động kết nối Firebase với config đã hard-code
  setTimeout(() => _doConnect(FIREBASE_CONFIG.apiKey, FIREBASE_CONFIG.projectId, FIREBASE_CONFIG.dbUrl, true), 800);
  setInterval(updateTripCountdown, 1000); 
}

// ===== WELCOME =====
window.switchWelcomeTab = switchWelcomeTab = (tab) => {
  document.querySelectorAll('#welcome-screen .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#welcome-screen .sub-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`#welcome-screen .tab:nth-child(${tab==='create'?1:2})`).classList.add('active');
  document.getElementById('welcome-' + tab).classList.add('active');
};

window.createNewTrip = createNewTrip = async () => {
  const code = document.getElementById('newTripCode').value.trim();
  const pass = document.getElementById('newTripPass').value.trim();
  const name = document.getElementById('newTripName').value.trim() || "Chuyến đi mới";
  const vibeInput = document.querySelector('input[name="newTripVibe"]:checked');
  const vibe = vibeInput ? vibeInput.value : "beach";

  if (!code) return showToast("Phải nhập Mã Room ID", "error");

  // Ràng buộc 1: Bắt buộc phải có kết nối mạng để check trùng lặp
  if (!firebaseConnected || !window._firebaseDb) {
      return showToast("Đang kết nối máy chủ, vui lòng đợi vài giây rồi thử lại!", "info");
  }

  showToast("Đang kiểm tra Mã Room...", "info");
  const sdk = window._fbSDK;
  const roomRef = sdk.ref(window._firebaseDb, `rooms/${code}`);

  try {
      // Dùng Transaction để "xí chỗ" mã Room 1 cách atomic (an toàn tuyệt đối,
      // kể cả khi 2 người bấm tạo cùng 1 mã ở cùng 1 thời điểm).
      // Firebase sẽ tự đọc dữ liệu mới nhất trên server và chỉ ghi nếu ô đó
      // đang thực sự trống (currentData === null) -> không thể có 2 phòng trùng mã.
      const newRoomData = JSON.parse(JSON.stringify(EMPTY_DATA));
      newRoomData.trip.code = code;
      newRoomData.trip.name = name;
      newRoomData.trip.secretKey = pass;
      newRoomData.trip.vibe = vibe;

      const txResult = await sdk.runTransaction(roomRef, (currentData) => {
          if (currentData !== null) {
              return; // Mã đã có người dùng -> hủy transaction, không ghi đè
          }
          return newRoomData;
      });

      if (!txResult.committed) {
          return showToast("Mã Room ID này đã có người sử dụng. Vui lòng chọn mã khác!", "error");
      }

      DATA = txResult.snapshot.val() || newRoomData;
      localStorage.setItem('trip_secret_key', pass);
      save();

      showApp();
      showToast("Tạo phòng thành công!", "success");

  } catch (e) {
      showToast("Lỗi khi tạo phòng: " + e.message, "error");
  }
};

window.joinTrip = joinTrip = async () => {
  const code = document.getElementById('joinTripCode').value.trim();
  const pass = document.getElementById('joinTripPass').value.trim();
  if (!code) return showToast("Phải nhập Mã Room ID", "error");

  showToast("Đang kết nối tới phòng...", "info");

  if (firebaseConnected && window._firebaseDb) {
    const sdk = window._fbSDK;
    try {
      const snapshot = await sdk.get(sdk.ref(window._firebaseDb, `rooms/${code}`));
      
      if (snapshot.exists()) {
        DATA = snapshot.val(); 
        localStorage.setItem('trip_secret_key', pass);
        save();
        showApp(); 
        showToast("Đã tải dữ liệu thành công!", "success");
        startRealtimeListener(); 
      } else {
        showToast("Phòng không tồn tại trên hệ thống", "error");
        
        // BỔ SUNG: Tự động dọn dẹp "thẻ ma" ngoài trang chủ nếu có
        await sdk.set(sdk.ref(window._firebaseDb, `public_trips/${code}`), null);
        loadPublicTrips(); 
      }
    } catch (e) {
      showToast("Lỗi tải dữ liệu: " + e.message, "error");
    }
  } else {
    DATA = JSON.parse(JSON.stringify(EMPTY_DATA));
    DATA.trip.code = code;
    localStorage.setItem('trip_secret_key', pass);
    save();
    showApp();
  }
};

function showWelcome() {
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
}

function showApp() {
  document.getElementById('welcome-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  if (DATA && DATA.trip && DATA.trip.code) updateUrlTripCode(DATA.trip.code);
  applyTripTheme();
  verifyRole();
  setupNav();
  renderAll();
  const note = document.getElementById('viewerSyncNote');
  if (note) note.style.display = isEditor ? 'none' : 'inline';

  // --- 🎬 KÍCH HOẠT CINEMATIC INTRO ---
  playCinematicIntro();
}

window.playCinematicIntro = playCinematicIntro = () => {
    if (!DATA || !DATA.days || DATA.days.length === 0) return;
    
    // Tránh bị spam mỗi khi F5 liên tục (Lưu cache cho phiên hiện tại)
    if (sessionStorage.getItem('introPlayed')) return;
    sessionStorage.setItem('introPlayed', 'true');

    // Quét tìm xem hôm nay là ngày mấy của chuyến đi
    const now = new Date();
    const todayStr = now.getDate().toString().padStart(2, '0') + "/" + (now.getMonth() + 1).toString().padStart(2, '0');
    const dayIndex = DATA.days.findIndex(d => d.date.startsWith(todayStr));
    
    // Nếu hôm nay nằm trong Lịch trình
    if (dayIndex !== -1) {
        const dayNum = dayIndex + 1;
        const subtitle = DATA.days[dayIndex].title || "Sẵn sàng đốt tiền!";
        
        const intro = document.createElement('div');
        intro.id = 'cinematic-intro';
        intro.innerHTML = `
            <div class="cinematic-day">DAY ${dayNum}</div>
            <div class="cinematic-sub">${esc(subtitle)}</div>
        `;
        document.body.appendChild(intro);
        
        // Giữ màn hình đen 2.5s rồi tách dần ra (fade)
        setTimeout(() => {
            intro.style.opacity = '0';
            intro.style.transform = 'scale(1.2)'; // Zoom nhẹ lúc biến mất
            setTimeout(() => intro.remove(), 1000);
        }, 2500);
    }
};

window.exitRoom = exitRoom = async () => { // Thêm async
    const ok = await window.niceConfirm("Rời khỏi phòng?", "Bạn có chắc muốn rời phòng và xóa dữ liệu trên máy này?", "warning");
    if (!ok) return;

    // 1. NGẮT CẦU DAO: Dừng mọi tiến trình đồng bộ và nghe ngóng mạng
    try {
        if (typeof stopRealtimeListener === 'function') stopRealtimeListener();
        if (typeof _syncTimer !== 'undefined') clearTimeout(_syncTimer);
        // Ép Firebase ngắt kết nối cưỡng bức
        if (window._firebaseDb && window._fbSDK && window._fbSDK.goOffline) {
            window._fbSDK.goOffline(window._firebaseDb);
        }
    } catch(e) { console.log("Lỗi ngắt kết nối ngầm", e); }

    // 2. XÓA DỮ LIỆU CÁ NHÂN
    localStorage.removeItem('tripData');
    localStorage.removeItem('trip_secret_key');

    // 3. ĐÓNG BĂNG GIAO DIỆN: Hiện thông báo ngay lập tức để người dùng không cảm thấy bị "delay"
    document.body.innerHTML = '<div style="height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: bold; font-size: 1.2rem; background: var(--bg);">Đang đóng gói hành lý... 🎒</div>';

    // 4. ÉP TRÌNH DUYỆT TẢI LẠI (Thêm mã chống cache để Safari không bị đơ)
    setTimeout(() => {
        // Dùng replace thay vì reload để tránh lỗi lịch sử duyệt web của iOS PWA
        window.location.replace(window.location.pathname + '?reset=' + Date.now());
    }, 200);
};

// ===== ROLE (PHÂN QUYỀN) =====
function verifyRole() {
  if (!DATA || !DATA.trip) return;
  const storedPass = localStorage.getItem('trip_secret_key') || "";
  const actualPass = DATA.trip.secretKey || "";
  
  // Nếu chưa có pass, tạm thời cho mọi người quyền Editor để nhập liệu
  isEditor = (actualPass === "" || storedPass === actualPass);

  const setupKeyArea = document.getElementById('setupKeyArea');
  const unlockSection = document.getElementById('unlockSection');
  
  // 1. Dùng QuerySelector tìm ngay thẻ bọc của nút "Về Viewer"
  const logoutBtn = document.querySelector('button[onclick="logoutEditor()"]');
  const logoutSection = logoutBtn ? logoutBtn.parentElement : null;

  if (actualPass === "") {
    // Trường hợp 1: Phòng chưa có pass
    document.body.classList.add('is-editor');
    document.getElementById('roleStatus').textContent = "Chưa khóa (Cần bảo vệ)";
    document.getElementById('roleStatus').style.color = "var(--orange)";
    
    if (unlockSection) unlockSection.style.display = "none";
    if (setupKeyArea) setupKeyArea.style.display = "block"; // Hiện nút tạo mã
    
    // 🛑 CHỐT CHẶN: Ẩn nút "Về Viewer" vì không có pass thì ai cũng là Editor
    if (logoutSection) logoutSection.style.display = "none"; 
    
  } else {
    // Trường hợp 2: Đã có pass
    if (setupKeyArea) setupKeyArea.style.display = "none"; // Ẩn nút tạo mã
    
    if (isEditor) {
      document.body.classList.add('is-editor');
      document.getElementById('roleStatus').textContent = "Editor (Có quyền sửa)";
      document.getElementById('roleStatus').style.color = "var(--green)";
      if (unlockSection) unlockSection.style.display = "none";
      
      // ✅ Đã có Pass + Đang là Editor => Cho phép hiện nút "Về Viewer" để thoát
      if (logoutSection) logoutSection.style.display = "block";
      
    } else {
      document.body.classList.remove('is-editor');
      document.getElementById('roleStatus').textContent = "Viewer (Chỉ xem)";
      document.getElementById('roleStatus').style.color = "var(--text3)";
      if (unlockSection) unlockSection.style.display = "block"; // Hiện nút Nhập mã
      
      // Đang là Viewer rồi thì giấu nút "Về Viewer" đi
      if (logoutSection) logoutSection.style.display = "none";
    }
  }
}

window.unlockEditor = unlockEditor = async () => { // Thêm async
  const pass = await window.nicePrompt("Mở khóa Editor", "Nhập mật khẩu Editor của chuyến đi này:");
  if (pass !== null) {
    localStorage.setItem('trip_secret_key', pass);
    verifyRole();
    renderAll();
    if (isEditor) showToast("Đã mở quyền Editor!", "success");
    else showToast("Mật khẩu không chính xác", "error");
  }
};

// Hàm để thoát quyền Editor
window.logoutEditor = logoutEditor = async () => { // Thêm async
    const ok = await window.niceConfirm("Thoát Editor?", "Bạn muốn thoát quyền Editor và chuyển về chế độ Chỉ xem?", "warning");
    if (ok) {
        localStorage.removeItem('trip_secret_key');
        verifyRole(); renderAll();
        showToast("Đã chuyển về quyền Viewer", "info");
    }
};

window.setInitialEditorCode = setInitialEditorCode = async () => { // Thêm async
  const newPass = await window.nicePrompt("Bảo vệ chuyến đi", "Thiết lập mật khẩu bảo vệ để chia sẻ quyền Sửa/Xóa cho bạn bè:");
  
  // 1. Nếu người dùng bấm Hủy -> Trả về null -> Tắt êm ru không làm gì cả
  if (newPass === null) return; 

  // 2. Nếu bấm Xác nhận nhưng để trống ô nhập -> Hiện Toast cảnh báo
  if (newPass.trim() === "") {
      return showToast("Bạn cần nhập mã để bảo vệ dữ liệu!", "error");
  }

  // 3. Nếu nhập đàng hoàng -> Xử lý lưu
  const cleanPass = newPass.trim();
  if (!DATA.trip) DATA.trip = {};
  DATA.trip.secretKey = cleanPass;
  localStorage.setItem('trip_secret_key', cleanPass);
  save(); 
  if (typeof autoSync === "function") autoSync();
  verifyRole();
  showToast("Đã thiết lập mã bảo vệ thành công!", "success");
};

// ===== RENDER (KHÔNG DISRUPTIVE) =====
// Chỉ render đúng section đang xem, không làm mất focus/scroll
function updateTripCoverPreview() {
  const preview = document.getElementById('tripCoverPreview');
  if (!preview || !DATA || !DATA.trip) return;

  const coverUrl = DATA.trip.coverUrl || "";
  preview.style.backgroundImage = coverUrl ? `url("${coverUrl}")` : "";
  preview.style.backgroundSize = "cover";
  preview.style.backgroundPosition = "center";
}

function guidedEmptyState({ icon, title, text, actionText, action }) {
  return `
    <div class="guided-empty">
      <div class="guided-empty-icon">${icon}</div>
      <div class="guided-empty-title">${esc(title)}</div>
      <div class="guided-empty-text">${esc(text)}</div>
      <button class="btn btn-primary guided-empty-action editor-only" onclick="${action}">${esc(actionText)}</button>
    </div>
  `;
}

function renderAll(flashUpdate = false) {
  if (!DATA) return;
  applyTripTheme();
  updateTripCoverPreview();
  document.getElementById('displayTripName').textContent = DATA.trip.name;
  document.getElementById('displayTripCode').textContent = DATA.trip.code;

  // --- THAY THẾ ĐOẠN NÀY ---
  const fullAddrEl = document.getElementById('locationFullAddress');
  if (fullAddrEl) {
      if (DATA.trip.fullAddress) {
          const parts = DATA.trip.fullAddress.split(',');
          // Lấy phần sau dấu phẩy, nếu không có phẩy thì giữ nguyên
          fullAddrEl.textContent = parts.length > 1 ? parts.slice(1).join(',').trim() : DATA.trip.fullAddress;
      } else {
          fullAddrEl.textContent = ''; // Xóa trắng nếu không có dữ liệu
      }
  }

  const locInput = document.getElementById('settingTripLoc');
  if (locInput) {
      locInput.value = DATA.trip.location || '';
  }
  // -------------------------

  const aiLocLabel = document.getElementById('aiTripLocLabel');
  if (aiLocLabel) aiLocLabel.textContent = DATA.trip.location || 'chuyến đi này';

  if (window.cancelEditName) cancelEditName();
  if (window.cancelEditCode) cancelEditCode();
  if (window.cancelEditLoc) cancelEditLoc();

  renderItinerary(flashUpdate);
  if (typeof window.renderTodayView === 'function') window.renderTodayView();
  renderPayments(flashUpdate);
  renderCollection(flashUpdate);

  if (typeof window.renderPackingList === 'function') window.renderPackingList(flashUpdate); 
  if (typeof window.updateManagementUI === 'function') window.updateManagementUI();
  if (typeof window.renderGallery === 'function') window.renderGallery();
}

function parseTripDateValue(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('/')) return null;
  const parts = dateStr.split('/').map(Number);
  const dd = parts[0];
  const mm = parts[1];
  const yyyy = parts[2] || new Date().getFullYear();
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function getOverviewNextActivity(now = new Date()) {
  const items = [];
  (DATA.days || []).forEach((day, dayIndex) => {
    const date = parseTripDateValue(day.date);
    if (!date) return;
    (day.activities || []).forEach((act) => {
      if (!act || !act.name) return;
      const timeParts = (act.time || '23:59').split(':').map(Number);
      const dt = new Date(date);
      dt.setHours(timeParts[0] || 0, timeParts[1] || 0, 0, 0);
      items.push({ ...act, dateTime: dt, dayIndex, day });
    });
  });

  items.sort((a, b) => a.dateTime - b.dateTime);
  return items.find(item => item.dateTime >= now) || null;
}

function getDaySmartStatus(day, now = new Date()) {
  const date = parseTripDateValue(day && day.date);
  if (!date) return { key: "unknown", label: "Chưa rõ ngày", isToday: false };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dayDate.getTime() === today.getTime()) return { key: "today", label: "Hôm nay", isToday: true };
  if (dayDate < today) return { key: "past", label: "Đã qua", isToday: false };
  return { key: "future", label: "Sắp tới", isToday: false };
}

window.manualDayCollapseState = manualDayCollapseState = window.manualDayCollapseState || {};

function getDayCollapseKey(day, index) {
  return `${day?.date || "no-date"}::${day?.title || ""}::${index}`;
}

function getTripDayEntries() {
  return (DATA?.days || [])
    .map((day, index) => ({ day, index, date: parseTripDateValue(day?.date) }))
    .filter(item => item.date)
    .sort((a, b) => a.date - b.date);
}

function isSameCalendarDay(a, b) {
  return !!(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function getActivityDateTime(day, act) {
  const date = parseTripDateValue(day?.date);
  if (!date) return null;
  const timeParts = (act?.time || '23:59').split(':').map(Number);
  const dt = new Date(date);
  dt.setHours(timeParts[0] || 0, timeParts[1] || 0, 0, 0);
  return dt;
}

function getTodayTripContext(now = new Date()) {
  const entries = getTripDayEntries();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const current = entries.find(item => isSameCalendarDay(item.date, today)) || null;
  const first = entries[0] || null;
  const last = entries[entries.length - 1] || null;
  return { entries, today, current, first, last };
}

function getFundRemaining() {
  const payments = (DATA?.payments || []).filter(p => p && typeof p === 'object');
  const totalFund = DATA?.fund ? (DATA.fund.collected || 0) : 0;
  const fundUsed = payments.reduce((sum, p) => {
    if (!p.isPaid || p.isEstimate) return sum;
    if (p.multiPayers && Array.isArray(p.multiPayers)) {
      return sum + p.multiPayers.reduce((s, mp) => mp.fromFund ? s + (mp.amount || 0) : s, 0);
    }
    return p.fromFund ? sum + (p.amount || 0) : sum;
  }, 0);
  return totalFund - fundUsed;
}

function getTodayPayments(activityIds) {
  if (!activityIds || !activityIds.size) return [];
  return (DATA?.payments || [])
    .map((payment, index) => ({ payment, index }))
    .filter(item => item.payment && activityIds.has(item.payment.linkedActId));
}

window.openFullScheduleFromToday = openFullScheduleFromToday = () => {
  document.querySelectorAll('.swipe-content').forEach(el => {
    el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    el.style.transform = 'translateX(0)';
  });
  document.querySelectorAll('.nav-item, .page').forEach(el => el.classList.remove('active'));
  document.querySelector('.nav-item[data-page="itinerary"]')?.classList.add('active');
  document.getElementById('page-itinerary')?.classList.add('active');
  currentPage = 'itinerary';
  if (typeof switchItineraryTab === 'function') switchItineraryTab('timeline');
  setTimeout(window.initSwipeActions, 100);
};

window.renderTodayView = renderTodayView = () => {
  const container = document.getElementById('todayViewContainer');
  if (!container || !DATA) return;

  const now = new Date();
  const { entries, current, first, last } = getTodayTripContext(now);
  const tripName = DATA.trip?.name || 'Trippy';
  const memberCount = (DATA.members || []).length;
  const dayIndex = current ? current.index + 1 : null;
  const activities = current ? (current.day.activities || [])
    .filter(act => act && act.name)
    .map(act => ({ ...act, dateTime: getActivityDateTime(current.day, act) }))
    .sort((a, b) => (a.dateTime || 0) - (b.dateTime || 0)) : [];
  const nextToday = activities.find(act => act.dateTime && act.dateTime >= now) || null;
  const nextGlobal = getOverviewNextActivity(now);
  const nextActivity = nextToday || nextGlobal;
  const todayPaymentItems = getTodayPayments(new Set(activities.map(act => act.id).filter(Boolean)));
  const todaySpent = todayPaymentItems.reduce((sum, item) => sum + (!item.payment.isEstimate && item.payment.isPaid ? (item.payment.amount || 0) : 0), 0);
  const fundRemain = getFundRemaining();
  const allPayments = (DATA.payments || []).filter(p => p !== null && typeof p === 'object');
  const totalTripSpent = allPayments.reduce((sum, p) => sum + (p.isPaid && !p.isEstimate ? (p.amount || 0) : 0), 0);
  const tripState = DATA.trip?.isFinished ? 'Đã kết thúc' : (current ? `Day ${dayIndex}` : entries.length ? 'Ngoài lịch hôm nay' : 'Chưa có lịch');
  const rangeLabel = entries.length ? `${entries.length} ngày · ${memberCount} người` : `${memberCount} người`;
  const nextLocation = nextActivity?.location || DATA.trip?.location || '';
  const canAddBill = isTripEditable();
  const billName = nextActivity?.name || '';
  const billActId = nextActivity?.id || '';
  const jsAttr = value => JSON.stringify(value || '').replace(/'/g, '&#39;');

  const heroMeta = current
    ? `${rangeLabel} · ${current.day.date || ''}`
    : first && last
      ? `${rangeLabel} · ${first.day.date || ''} - ${last.day.date || ''}`
      : rangeLabel;

  const nextBlock = nextActivity ? `
    <div class="today-next-card">
      <div class="today-next-time">${esc(nextActivity.time || '--:--')}</div>
      <div style="min-width:0;">
        <div class="today-next-name">${esc(nextActivity.name)}${nextToday ? '<span class="today-chip">Tiếp theo</span>' : ''}</div>
        <div class="today-next-sub">${nextActivity.location ? `📍 ${esc(nextActivity.location)}` : 'Chưa có địa điểm'}${nextActivity.day && !nextToday ? ` · Day ${nextActivity.dayIndex + 1}` : ''}</div>
      </div>
    </div>
  ` : `<div class="today-muted">Chưa có hoạt động tiếp theo.</div>`;

  const timelineBlock = activities.length ? activities.map(act => `
    <div class="today-activity ${act === nextToday ? 'next' : ''}">
      <div class="today-activity-time">${esc(act.time || '--:--')}</div>
      <div class="today-activity-main">
        <div class="today-activity-name">${esc(act.name)}${act === nextToday ? '<span class="today-chip">Tiếp theo</span>' : ''}</div>
        <div class="today-activity-sub">${act.location ? `📍 ${esc(act.location)}` : 'Chưa có địa điểm'}${act.note ? ` · ${esc(act.note)}` : ''}</div>
      </div>
    </div>
  `).join('') : `<div class="today-muted">Hôm nay chưa có activity trong lịch.</div>`;

  const paymentBlock = todayPaymentItems.length ? todayPaymentItems.slice(0, 4).map(({ payment }) => `
    <div class="today-expense-row">
      <div style="min-width:0;">
        <div class="today-expense-name">${esc(payment.desc || 'Chi tiêu')}</div>
        <div class="today-expense-sub">${esc(payment.payer || 'Chưa rõ người trả')} · ${(payment.participants || []).length || memberCount || 0} người chia · ${payment.isPaid ? 'Đã trả' : 'Cần trả'}</div>
      </div>
      <div class="today-expense-amount">${formatVND(payment.amount || 0)}</div>
    </div>
  `).join('') : `<div class="today-muted">Chưa có khoản chi nào gắn với lịch hôm nay.</div>`;

  container.innerHTML = `
    <div class="today-stack">
      <div class="today-hero">
        <div class="today-kicker">Hôm nay</div>
        <div class="today-title-row">
          <div style="min-width:0;">
            <div class="today-title">${esc(tripName)}</div>
            <div class="today-meta">${esc(heroMeta)}</div>
          </div>
          <div class="today-day-badge"><div><span>Day</span><strong>${dayIndex || '-'}</strong></div></div>
        </div>
        <div class="today-metrics">
          <div class="today-metric">
            <div class="today-metric-label">Trạng thái</div>
            <div class="today-metric-value">${esc(tripState)}</div>
          </div>
          
          <div class="today-metric" onclick="openTotalExpenseModal()">
            <div class="today-metric-label">Đã chi</div>
            <div class="today-metric-value" style="color: var(--accent);">${formatVND(totalTripSpent)}</div>
          </div>
          
          <div class="today-metric">
            <div class="today-metric-label">Quỹ còn</div>
            <div class="today-metric-value" style="color:${fundRemain < 0 ? 'var(--red)' : 'var(--green)'}">${formatVND(Math.max(0, fundRemain))}</div>
          </div>
        </div>
      </div>

      <div class="today-grid">
        <div class="today-stack">
          <div class="today-card">
            <div class="today-section-title"><span>Hoạt động tiếp theo</span></div>
            ${nextBlock}
          </div>
          <div class="today-card">
            <div class="today-section-title"><span>Lịch trình hôm nay</span><span>${activities.length} mục</span></div>
            <div class="today-timeline">${timelineBlock}</div>
          </div>
        </div>

        <div class="today-stack">
          <div class="today-card">
            <div class="today-section-title"><span>Chi tiêu hôm nay</span><span>${formatVND(todaySpent)}</span></div>
            ${paymentBlock}
          </div>
          <div class="today-card">
            <div class="today-section-title"><span>Thao tác nhanh</span></div>
            <div class="today-actions">
              <button class="today-action-btn" ${nextLocation ? `onclick='openMapModal(${jsAttr(nextLocation)})'` : 'disabled'}>📍 Map</button>
              <button class="today-action-btn primary" ${canAddBill ? `onclick='openAddPaymentModal(${jsAttr(billName)}, ${jsAttr(billActId)})'` : 'disabled'}>💳 Thêm bill</button>
              <button class="today-action-btn" onclick="openModal('qrModal')">💸 QR quỹ</button>
              <button class="today-action-btn" onclick="openFullScheduleFromToday()">📅 Lịch đầy đủ</button>
              <button class="today-action-btn" ${DATA.trip?.location ? `onclick="askAiSuggestions()"` : 'disabled'}>🤖 Gợi ý AI</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

function getOverviewCurrentDayLabel(now = new Date()) {
  const days = (DATA.days || [])
    .map((day, index) => ({ day, index, date: parseTripDateValue(day.date) }))
    .filter(item => item.date)
    .sort((a, b) => a.date - b.date);

  if (!days.length) return 'Chưa có lịch';
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const first = new Date(days[0].date.getFullYear(), days[0].date.getMonth(), days[0].date.getDate());
  const last = new Date(days[days.length - 1].date.getFullYear(), days[days.length - 1].date.getMonth(), days[days.length - 1].date.getDate());

  if (DATA.trip && DATA.trip.isFinished) return 'Đã kết thúc';
  if (today < first) return 'Sắp đi';
  if (today > last) return 'Đã qua';

  const current = days.find(item => {
    const d = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
    return d.getTime() === today.getTime();
  });
  return current ? `Day ${current.index + 1}` : 'Đang đi';
}

function updateTripOverview() {
  if (!DATA) return;
  const theme = getTripTheme();
  const payments = (DATA.payments || []).filter(p => p && typeof p === 'object');
  const members = DATA.members || [];

  const actualSpent = payments.reduce((sum, p) => sum + (p.isPaid && !p.isEstimate ? (p.amount || 0) : 0), 0);
  const totalCollected = members.reduce((total, m) => {
    const mPaid = (m.payments || []).reduce((sum, v) => sum + v, 0) || m.paid || 0;
    return total + Math.max(0, mPaid);
  }, 0);
  const fundUsed = payments.reduce((sum, p) => {
    if (!p.isPaid || p.isEstimate) return sum;
    if (p.multiPayers) {
      return sum + p.multiPayers.reduce((s, mp) => mp.fromFund ? s + (mp.amount || 0) : s, 0);
    }
    return p.fromFund ? sum + (p.amount || 0) : sum;
  }, 0);
  const fundRemain = totalCollected - fundUsed;
  const nextAct = getOverviewNextActivity();

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('overviewTripName', DATA.trip?.name || 'Chuyến đi');
  setText('overviewDays', `${(DATA.days || []).length} ngày`);
  setText('overviewMembers', `${members.length} người`);
  setText('overviewCurrentDay', getOverviewCurrentDayLabel());
  setText('overviewFundRemain', formatVND(Math.max(0, fundRemain)));
  setText('overviewSpent', formatVND(actualSpent));
  setText('overviewVibeIcon', theme.icon);

  const fundEl = document.getElementById('overviewFundRemain');
  if (fundEl) {
    fundEl.classList.toggle('red', fundRemain < 0);
    fundEl.classList.toggle('green', fundRemain >= 0);
  }

  const nextText = nextAct
    ? `${nextAct.name} ${nextAct.time ? `· ${nextAct.time}` : ''}`
    : 'Chưa có hoạt động sắp tới';
  const nextEl = document.getElementById('overviewNextActivity');
  if (nextEl) nextEl.innerHTML = nextAct && nextAct.time
    ? `${esc(nextAct.name)} <span class="overview-next-time">${esc(nextAct.time)}</span>`
    : esc(nextText);
}

function renderItinerary(flash = false) {
  const list = document.getElementById('itineraryList');
  let days = DATA.days || [];
  updateTripOverview();
  const nextActivity = getOverviewNextActivity();
  const nextActivityKey = nextActivity
    ? (nextActivity.id || `${nextActivity.day?.date || ""}::${nextActivity.time || ""}::${nextActivity.name || ""}`)
    : "";
  
  document.getElementById('totalDays').textContent = days.length;
  const budget = DATA.payments ? DATA.payments.reduce((s,p) => s + (p.amount||0), 0) : 0;
  document.getElementById('totalBudget').textContent = formatVND(budget);

  if (!days.length) { 
    list.innerHTML = guidedEmptyState({
      icon: "🗺",
      title: "Chưa có lịch trình",
      text: "Bắt đầu bằng cách thêm ngày đầu tiên cho chuyến đi.",
      actionText: "+ Thêm ngày đầu tiên",
      action: "resetDayForm(); openModal('dayModal')"
    });
    return; 
  }

  // Sắp xếp mảng days theo trình tự thời gian
  days.sort((a, b) => {
    const [d1, m1] = a.date.split('/').map(Number);
    const [d2, m2] = b.date.split('/').map(Number);
    if (m1 !== m2) return m1 - m2;
    return d1 - d2;
  });

  let html = '';
  days.forEach((day, di) => {
    const acts = day.activities || [];
    acts.sort((a, b) => {
        const timeToMins = (t) => {
            if (!t) return 0;
            const p = t.split(':');
            // Quy đổi HH:MM ra tổng số phút để so sánh toán học
            return (parseInt(p[0]) || 0) * 60 + (parseInt(p[1]) || 0);
        };
        return timeToMins(a.time) - timeToMins(b.time);
    });
    const displayDate = day.date.includes('/') && day.date.split('/').length < 3 
                        ? `${day.date}/${new Date().getFullYear()}` 
                        : day.date;
    const dayStatus = getDaySmartStatus(day);
    const collapseKey = getDayCollapseKey(day, di);
    const manualState = window.manualDayCollapseState[collapseKey];
    const isCollapsed = typeof manualState === "boolean" ? manualState : !dayStatus.isToday;
    const dayClass = `day-section smart-${dayStatus.key}${isCollapsed ? " collapsed" : ""}`;

    // Bắt đầu thẻ day-section với ID để toggle
    html += `
    <div class="${dayClass}" id="day-section-${di}" data-collapse-key="${esc(collapseKey)}">
      
      <div class="swipe-container" style="background: var(--surface); border-radius: var(--radius); border: 1px solid rgba(232,197,71,.1); margin-bottom: 12px; overflow: hidden;">
        
        <div class="swipe-actions editor-only" style="padding-right: 10px; gap: 6px;">
            <button class="action-btn action-edit" style="width: 36px; height: 36px;" onclick="openEditDay(${di})">✎</button>
            <button class="action-btn" style="background:var(--accent-glow); color:var(--accent); width: 36px; height: 36px;" onclick="openActModal(${di})">📜</button>
            <button class="action-btn action-delete" style="width: 36px; height: 36px;" onclick="deleteDay(${di})">🗑️</button>
        </div>

        <div class="swipe-content day-header" onclick="toggleDayCollapse(${di})" style="margin-bottom: 0; border: none; background: var(--surface); border-radius: var(--radius);">
            
            <div class="day-number" style="position: relative; overflow: visible; flex-shrink: 0;">
              <div style="display: flex; flex-direction: column; line-height: 1; align-items: center; justify-content: center;">
                <span style="font-size: 0.5rem; text-transform: uppercase; opacity: 0.7;">Day</span>
                <span style="font-size: 1rem;">${di+1}</span>
              </div>
              <span id="weather-icon-${di}" style="display:none; position: absolute; bottom: -8px; right: -10px; font-size: 1.3rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); z-index: 10;"></span>
            </div>
            
            <div class="day-info" style="flex: 1; min-width: 0; padding-right: 5px;">
                <div style="font-size:.85rem; font-weight:600; line-height: 1.3; margin-bottom: 4px; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${esc(day.title||'Ngày '+(di+1))}
                </div>
                <div style="font-size:.7rem; color:var(--text3); display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px;">
                    <span style="justify-self:start;">${esc(displayDate)}</span>
                    <span class="day-status-chip ${dayStatus.key === 'today' ? 'today' : ''}" style="justify-self:center;">${esc(dayStatus.label)}</span>
                    <span class="chevron-icon" style="justify-self:end;">▼</span>
                </div>
            </div>
        </div>
      </div>
      
      <div class="day-content">
        ${acts.length ? `
          <div class="timeline">
            ${acts.map((a,ai)=>{
              const pIndices = window.getLinkedPaymentIndices ? window.getLinkedPaymentIndices(a.id) : [];
              const activityKey = a.id || `${day.date || ""}::${a.time || ""}::${a.name || ""}`;
              const isNextActivity = nextActivityKey && activityKey === nextActivityKey;
              let expenseBadge = '';
              if (pIndices.length > 0) {
                  const total = pIndices.reduce((sum, idx) => sum + (DATA.payments[idx].amount || 0), 0);
                  const label = pIndices.length > 1 ? `${pIndices.length} khoản: ` : '';
                  expenseBadge = `<span style="padding:2px 6px; background:var(--orange-bg); color:var(--orange); border-radius:4px; font-size:0.6rem; font-weight:700; white-space: nowrap;">💰 ${label}${formatVND(total)}</span>`;
              }

              return `
              <div class="timeline-activity-wrapper ${isNextActivity ? 'next-activity' : ''}" style="position: relative; margin-bottom: 8px;">
                <div class="swipe-container" style="background: var(--surface); margin-bottom: 0; overflow: hidden; border-radius: 14px;">
                  <div class="swipe-actions editor-only" style="padding: 0 4px;">
                      <button class="action-btn action-edit" onclick="var e = arguments[0] || window.event; e.stopPropagation(); openEditActivity(${di},${ai})">✎</button>
                      <button class="action-btn action-delete" onclick="var e = arguments[0] || window.event; e.stopPropagation(); deleteActivity(${di},${ai})">🗑️</button>
                  </div>
                  <div class="swipe-content timeline-item" style="background: var(--surface); border-radius: 14px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                            ${a.time ? `<div style="font-size:.65rem;color:var(--accent);">${esc(a.time.split(':').slice(0,2).join(':'))}</div>` : ''}
                            ${isNextActivity ? '<span class="next-activity-pill">Tiếp theo</span>' : ''}
                        </div>
                        <div style="font-size:.82rem;font-weight:600; word-break: break-word; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
                            ${esc(a.name||'')} ${expenseBadge}
                        </div>
                        ${a.location ? `
                          <div style="font-size:.72rem; color:var(--blue); margin-top:4px; display: flex; align-items: flex-start; gap: 4px; cursor: pointer;" 
                               onclick="openMapModal('${esc(a.location.replace(/'/g, "\\'"))}')">
                            <span style="flex-shrink:0">📍</span>
                            <span style="color:var(--blue); text-decoration:underline;">
                                ${a.location.startsWith('http') ? 'Mở link bản đồ ngoài' : 'Xem bản đồ: ' + esc(a.location)}
                            </span>
                          </div>
                        ` : ''}
                        ${a.note ? `<div style="font-size:.72rem;color:var(--text3);margin-top:2px;">${esc(a.note)}</div>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        ` : `<div style="padding:8px 0 15px 45px;font-size:.75rem;color:var(--text3)">Chưa có hoạt động</div>`}
      </div>
    </div>`;
  });

  list.innerHTML = html;
  if (flash) list.classList.add('update-flash'), setTimeout(()=>list.classList.remove('update-flash'),700);
  setTimeout(window.loadWeatherForItinerary, 50);
  setTimeout(window.initSwipeActions, 100);
}

// Khai báo biến lưu trạng thái bộ lọc (Mặc định là xem tất cả)
window.currentPaymentFilter = currentPaymentFilter = window.currentPaymentFilter || 'all';

window.setPaymentFilter = setPaymentFilter = (filter) => {
    window.currentPaymentFilter = currentPaymentFilter = filter;
    renderPayments(); // Gọi lại hàm render để cập nhật ngay lập tức
};

window.switchDashboardTab = switchDashboardTab = (tab) => {
    const overviewBtn = document.getElementById('dbTabBtn_overview');
    const categoryBtn = document.getElementById('dbTabBtn_category');
    const overviewContent = document.getElementById('dbTabContent_overview');
    const categoryContent = document.getElementById('dbTabContent_category');
    if (!overviewBtn || !categoryBtn || !overviewContent || !categoryContent) return;
    overviewBtn.classList.toggle('active', tab === 'overview');
    categoryBtn.classList.toggle('active', tab === 'category');
    overviewContent.style.display = tab === 'overview' ? 'block' : 'none';
    categoryContent.style.display = tab === 'category' ? 'block' : 'none';
};

window.renderPayments = renderPayments = (flash = false) => {
    const list = document.getElementById('paymentList');
    if (!list) return; // Bảo vệ: Nếu chưa có chỗ vẽ thì không chạy
    const canEditTrip = isTripEditable();

    // --- BƯỚC 0: CHỐT CHẶN AN TOÀN (Sửa lỗi đen màn hình) ---
    // Loại bỏ mọi phần tử null hoặc undefined trong mảng payments trước khi xử lý
    const payments = (DATA.payments || []).filter(p => p !== null && typeof p === 'object');
    
    // 1. Tính toán dữ liệu (ĐÃ VÁ LỖI TÍNH QUỸ)
    const actualTotal = payments.reduce((s, p) => s + (p.isPaid && !p.isEstimate ? (p.amount || 0) : 0), 0);
    const estimateTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalFund = DATA.fund ? (DATA.fund.collected || 0) : 0;
    
    // Tách riêng: Chỉ tính tổng những khoản có tick "Rút từ quỹ"
    // 🔧 VÁ LỖI: Bổ sung xử lý hóa đơn chia nhiều người trả (multiPayers) để khớp với công thức bên trang Quỹ
    const fundUsed = payments.reduce((sum, p) => {
        if (!p.isPaid || p.isEstimate) return sum;
        if (p.multiPayers) {
            return sum + p.multiPayers.reduce((s, mp) => mp.fromFund ? s + (mp.amount || 0) : s, 0);
        }
        return p.fromFund ? sum + (p.amount || 0) : sum;
    }, 0);

    // Tiền thành viên tự ứng ra trả hộ, KHÔNG rút từ quỹ chung (chỉ mang tính thông tin, không cộng dồn vào số liệu quỹ)
    const personalAdvance = Math.max(0, actualTotal - fundUsed);
    
    const budgetRemain = estimateTotal - actualTotal;
    const cashInHand = totalFund - fundUsed; // Sửa lại: Chỉ trừ đi tiền thực sự rút từ quỹ
    
    let percent = estimateTotal > 0 ? (actualTotal / estimateTotal) * 100 : 0;
    let displayPercent = Math.min(percent, 100); 

    // --- LOGIC TRẠNG THÁI BIẾT "ĐỌC TÂM LÝ" ---
    let barColor = 'var(--text3)';
    let funnyMsg = "Ví vẫn đóng băng!";
    let statusIcon = "🧊";
    let animationClass = "";

    if (actualTotal === 0) {
        // Trường hợp 1: Chuyến đi mới toanh, chưa rớt đồng nào
        barColor = 'var(--text3)'; 
        funnyMsg = "Ví vẫn đóng băng! 🧊"; 
        statusIcon = "🧘‍♂️";
    } else if (estimateTotal === 0 && actualTotal > 0) {
        // Trường hợp 2: Có tiêu tiền nhưng KHÔNG thèm lên dự trù
        barColor = 'var(--blue)';
        funnyMsg = "Tiêu không cần nhìn giá! 😎";
        statusIcon = "💸";
        displayPercent = 100; 
    } else {
        // Trường hợp 3: Tiêu tiền bài bản, có dự trù đàng hoàng
        if (actualTotal > estimateTotal) {
            barColor = 'var(--red)'; funnyMsg = "Thủng ví rồi! Lạm phát! 💀"; statusIcon = "🚨"; animationClass = "animate-vibrate";
        } else if (actualTotal === estimateTotal) {
            barColor = 'var(--green)'; funnyMsg = "Tính toán như thần! Vừa khít! 🎯"; statusIcon = "🏆"; 
        } else if (percent > 90) {
            barColor = 'var(--orange)'; funnyMsg = "Sắp cạn máu! 🆘"; statusIcon = "🆘"; animationClass = "animate-pulse-fast";
        } else if (percent > 70) {
            barColor = '#facc15'; funnyMsg = "Rén rồi nha... 🧐"; statusIcon = "⚠️";
        } else if (percent > 40) {
            barColor = 'var(--blue)'; funnyMsg = "Vẫn trong tầm kiểm soát! ✅"; statusIcon = "👌";
        } else {
            barColor = 'var(--green)'; funnyMsg = "Đại gia đây rồi! 🤑"; statusIcon = "🥳";
        }
    }

    // --- BIỂU ĐỒ TRÒN: CHI TIÊU THEO DANH MỤC ---
    const categoryTotals = {};
    payments.forEach(p => {
        if (p.isPaid && !p.isEstimate) {
            const key = p.category && EXPENSE_CATEGORIES[p.category] ? p.category : 'other';
            categoryTotals[key] = (categoryTotals[key] || 0) + (p.amount || 0);
        }
    });
    const catEntries = Object.entries(categoryTotals).filter(([, amt]) => amt > 0).sort((a, b) => b[1] - a[1]);
    const catTotal = catEntries.reduce((s, [, amt]) => s + amt, 0);
    let catCumulative = 0;
    const pieGradient = catEntries.map(([key, amt]) => {
        const pct = catTotal > 0 ? (amt / catTotal) * 100 : 0;
        const start = catCumulative;
        catCumulative += pct;
        return `${EXPENSE_CATEGORIES[key].color} ${start}% ${catCumulative}%`;
    }).join(', ');

    const styleTag = `
    <style>
        @keyframes vibrate { 0%{transform:translate(0)} 25%{transform:translate(-2px,2px)} 50%{transform:translate(2px,-2px)} 75%{transform:translate(-2px,-2px)} 100%{transform:translate(0)} }
        .animate-vibrate { animation: vibrate 0.2s linear infinite; }
        @keyframes pulse-fast { 0%{opacity:1} 50%{opacity:0.3} 100%{opacity:1} }
        .animate-pulse-fast { animation: pulse-fast 0.5s ease-in-out infinite; }
        
        .db-container { display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; }
        .db-chart { width: 85px; height: 85px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin: 0 auto; }
        .db-stats { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 8px; }
        .db-box { padding: 8px 12px; border-radius: 10px; border-left: 3px solid; background: rgba(255,255,255,0.02); }
        
        @media (max-width: 360px) {
            .db-container { flex-direction: column; text-align: center; }
            .db-stats { width: 100%; }
        }
    </style>`;

    // 2. GIAO DIỆN DASHBOARD ĐÃ GỘP DÒNG THEO Ý BÁC
    const statsUI = styleTag + `
        <div class="section-header section-title" style="margin-top: 10px; border: none;">Dashboard Đau Ví</div>

        <div class="metric-card stat-card wide highlight ${animationClass}" style="padding: 22px; border-color: ${barColor}40; transition: 0.3s; margin-bottom: 25px; border-radius: 20px;">

            <div style="text-align: center; margin-bottom: 15px; cursor: pointer;" onclick="openTotalExpenseModal()">
                <div style="font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Thực chi</div>
                <div class="stat-value gold" style="font-size: 2.3rem; text-shadow: 0 0 25px ${barColor}30;">${formatVND(actualTotal)}</div>
                <div style="font-size: 0.62rem; color: var(--text3); margin-top: 4px;">Tổng toàn bộ chi tiêu của cả chuyến đi</div>
            </div>

            <div class="tab-bar" style="margin-bottom: 15px;">
                <button class="tab active" id="dbTabBtn_overview" onclick="switchDashboardTab('overview')">💰 Tổng quan</button>
                <button class="tab" id="dbTabBtn_category" onclick="switchDashboardTab('category')">🍕 Danh mục</button>
            </div>

            <div id="dbTabContent_overview">
                <div class="db-container">
                    <div class="db-chart" style="background: conic-gradient(${barColor} ${displayPercent}%, var(--surface3) 0); box-shadow: 0 0 20px ${barColor}30;">
                        <div style="width: 70px; height: 70px; border-radius: 50%; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1;">
                            <span style="font-size: 1rem; font-weight: 900; color: ${barColor};">${Math.round(percent)}%</span>
                            <span style="font-size: 0.4rem; color: var(--text3); margin-top: 4px; text-transform: uppercase;">Máu</span>
                        </div>
                    </div>

                    <div class="db-stats">
                        <div style="font-size: 0.75rem; font-weight: 800; color: ${barColor}; margin-bottom: 2px; display: flex; align-items: center; gap: 5px;">
                            <span>${statusIcon}</span> ${funnyMsg}
                        </div>

                        <div class="db-box" style="border-color: var(--blue);">
                            <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: var(--text3); margin-bottom: 4px; opacity: 0.8;">
                                <span>Dự trù ban đầu:</span>
                                <span>${formatVND(estimateTotal)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 900; color: ${budgetRemain < 0 ? 'var(--red)' : 'var(--blue)'};">
                                <span style="font-size: 0.65rem; opacity: 0.9;">Ngân sách còn lại:</span>
                                <span>${formatVND(Math.abs(budgetRemain))}</span>
                            </div>
                        </div>

                        <div class="db-box" style="border-color: var(--green);">
                            <div style="display: flex; justify-content: space-between; font-size: 0.55rem; color: var(--text3); margin-bottom: 4px; opacity: 0.8;">
                                <span>🏦 Quỹ chung — Đã đóng:</span>
                                <span>${formatVND(totalFund)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 900; color: ${cashInHand < 0 ? 'var(--red)' : 'var(--accent)'};">
                                <span style="font-size: 0.65rem; opacity: 0.9;">Quỹ chung còn lại:</span>
                                <span>${formatVND(Math.max(0, cashInHand))}</span>
                            </div>
                        </div>

                        ${personalAdvance > 0 ? `
                        <div class="db-box" style="border-color: var(--blue);">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem;">
                                <span style="color: var(--text2);">💳 Ứng cá nhân (ngoài quỹ)</span>
                                <span style="font-weight: 900; color: var(--blue);">${formatVND(personalAdvance)}</span>
                            </div>
                            <div style="font-size: 0.55rem; color: var(--text3); margin-top: 4px; line-height: 1.4;">Khoản này KHÔNG thuộc quỹ chung — là tiền thành viên tự bỏ ra trả hộ nhóm, chưa được hoàn lại.</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${cashInHand < 0 ? `
                    <div style="margin-top: 15px; background: var(--red-bg); color: var(--red); font-size: 0.75rem; padding: 12px; border-radius: 12px; text-align: center; font-weight: 800; border: 1px dashed var(--red); animation: pulse-fast 1s infinite;">
                        🚨 QUỸ CHUNG ĐÃ CẠN! Cần góp thêm vào quỹ: ${formatVND(Math.abs(cashInHand))}!
                    </div>
                ` : ''}
            </div>

            <div id="dbTabContent_category" style="display: none;">
                ${catEntries.length ? `
                <div class="db-container">
                    <div class="db-chart" style="background: conic-gradient(${pieGradient}); box-shadow: 0 0 20px rgba(0,0,0,0.3);">
                        <div style="width: 70px; height: 70px; border-radius: 50%; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15; padding: 4px; box-sizing: border-box; overflow: hidden;">
                            <span style="font-size: 0.6rem; font-weight: 900; color: var(--text); text-align: center; word-break: break-word; max-width: 58px;">${formatVND(catTotal)}</span>
                        </div>
                    </div>
                    <div class="db-stats">
                        ${catEntries.map(([key, amt]) => {
                            const cat = EXPENSE_CATEGORIES[key];
                            const pct = catTotal > 0 ? Math.round((amt / catTotal) * 100) : 0;
                            return `<div style="display: flex; align-items: center; gap: 8px; font-size: 0.68rem;">
                                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${cat.color}; flex-shrink: 0;"></span>
                                <span style="flex: 1; color: var(--text2);">${cat.icon} ${cat.label}</span>
                                <span style="font-weight: 800; color: ${cat.color};">${pct}%</span>
                                <span style="color: var(--text3); min-width: 72px; text-align: right;">${formatVND(amt)}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                ` : `<div class="today-muted" style="text-align:center; padding: 20px 0;">Chưa có chi tiêu để phân loại.</div>`}
            </div>
        </div>
    `;

    if (!payments.length) { 
        list.innerHTML = statsUI + guidedEmptyState({
            icon: "💸",
            title: "Chưa có khoản chi",
            text: "Ghi bill đầu tiên để nhóm không mất dấu tiền.",
            actionText: "+ Thêm chi tiêu",
            action: "openAddPaymentModal()"
        });
        return;
        list.innerHTML = statsUI + `
            <div class="empty-state" style="padding: 60px 20px; text-align: center; background: var(--surface2); border-radius: 20px; border: 1px dashed var(--surface3); margin: 20px 0;">
                <div style="font-size: 4rem; margin-bottom: 15px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));">💸</div>
                <div style="color: var(--text); font-weight: 800; font-size: 1.2rem; margin-bottom: 8px;">Ví vẫn còn nguyên!</div>
                <div style="font-size: 0.75rem; color: var(--text3); line-height: 1.5; max-width: 250px; margin: 0 auto;">Ghi lại những khoản chi tiêu đầu tiên để không bị "mất tích" tiền trong chuyến đi này nhé.</div>
            </div>`; 
        return; 
    }

    // --- 3. THUẬT TOÁN QUẢ CẦU NĂNG LƯỢNG ---
    let bubblesData = [];
    bubblesData.push({ id: '✨ PS', title: 'Phát sinh', amt: 0, isManual: true });

    if (DATA.days) {
        DATA.days.filter(d => d !== null).forEach((day, idx) => {
            bubblesData.push({ id: `D${idx+1}`, title: day.date, amt: 0, isManual: false });
        });
    }

    payments.forEach(p => {
    // Chỉ tính "Thực chi" (Đã trả và Không phải dự trù) vào biểu đồ
    if (p.isPaid && !p.isEstimate) {
        let foundDay = false;

        // Nếu có liên kết hoạt động, đi tìm xem nó thuộc ngày nào
        if (p.linkedActId) {
            // Dùng (DATA.days || []) để chống crash nếu dữ liệu chưa khởi tạo
            (DATA.days || []).forEach((day, di) => {
                // Dùng ?. (Optional Chaining) để check an toàn thay vì day && day.activities
                if (day?.activities?.some(a => a?.id === p.linkedActId)) {
                    if (bubblesData[di + 1]) {
                        bubblesData[di + 1].amt += (p.amount || 0);
                        foundDay = true;
                    }
                }
            });
        }
            // Gom chung 2 trường hợp: 
            // 1. Không có linkedActId (Chi tiêu tự do ngoài lịch)
            // 2. Có linkedActId nhưng không tìm thấy ngày (Hoạt động đã bị xóa)
            if (!foundDay) {
                if (bubblesData[0]) {
                    bubblesData[0].amt += (p.amount || 0);
                }
            }
        }
    });

    const maxSpend = Math.max(...bubblesData.map(b => b.amt), 1);
    const heatmapHtml = bubblesData.map((b) => {
        const ratio = b.amt / maxSpend;
        const scale = 0.9 + (ratio * 0.15); // Scale nhẹ nhàng từ 0.9 đến 1.05 để không bị tràn viền
        
        let bgColor = 'var(--surface3)';
        if (b.amt > 0) {
            if (ratio < 0.4) bgColor = 'linear-gradient(135deg, #4ade80, #16a34a)';
            else if (ratio < 0.7) bgColor = 'linear-gradient(135deg, #facc15, #ca8a04)';
            else bgColor = 'linear-gradient(135deg, #f87171, #dc2626)';
        }

        // ĐÂY LÀ THUẬT TOÁN ĐỊNH DẠNG TIỀN "CỨU RỖI" UI
        let displayAmt = '0';
        if (b.amt > 0) {
            if (b.amt >= 1000000) {
                // Trở lên hàng Triệu -> Hiển thị "37.2Tr"
                displayAmt = (b.amt / 1000000).toFixed(1).replace('.0', '') + 'Tr';
            } else {
                // Hàng trăm ngàn -> Hiển thị "500k"
                displayAmt = (b.amt / 1000).toFixed(0) + 'k';
            }
        }

        return `
        <div class="heat-bubble ${ratio === 1 && b.amt > 0 ? 'hot' : ''}" style="background: ${bgColor}; transform: scale(${scale}); cursor: pointer;" title="Xem chi tiết: ${b.title}" onclick="openDayExpenseModal('${b.title}')">
            <div class="heat-bubble-day" style="${b.isManual ? 'color: var(--accent);' : ''}">${b.id}</div>
            <span class="heat-bubble-val">${displayAmt}</span>
        </div>`;
    }).join('');

    const heatmapUI = `
        <div class="heatmap-section" style="margin-bottom: 20px;">
            <div class="section-header section-title" style="margin-top:0">🔮 Cầu năng lượng chi tiêu</div>
            <div class="heatmap-container">${heatmapHtml}</div>
        </div>
    `;

    // --- 4. LỌC & SẮP XẾP DANH SÁCH CHI TIÊU ---
    let filteredPayments = payments.map((p, index) => {
        let timestamp = 0;
        if (p.linkedActId && DATA.days) {
            for (let day of DATA.days) {
                if (!day) continue;
                const act = (day.activities || []).find(a => a && a.id === p.linkedActId);
                if (act) {
                    const parts = (day.date || "").split('/');
                    const dd = parseInt(parts[0]) || 1;
                    const mm = parseInt(parts[1]) || 1;
                    let yyyy = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear();
                    if (yyyy < 100) yyyy += 2000;
                    const tParts = (act.time || "00:00").split(':');
                    timestamp = new Date(yyyy, mm - 1, dd, parseInt(tParts[0]||0), parseInt(tParts[1]||0)).getTime();
                    break;
                }
            }
        }
        return { ...p, originalIndex: index, timestamp };
    });

    if (window.currentPaymentFilter === 'paid') {
    filteredPayments = filteredPayments.filter(p => !p.isEstimate && p.isPaid);
    }
    else if (window.currentPaymentFilter === 'estimate') filteredPayments = filteredPayments.filter(p => p.isEstimate);

    filteredPayments.sort((a, b) => {
        const aIsManual = !a.linkedActId;
        const bIsManual = !b.linkedActId;
        if (aIsManual && !bIsManual) return -1;
        if (!aIsManual && bIsManual) return 1;
        if (aIsManual && bIsManual) return b.originalIndex - a.originalIndex;
        return a.timestamp - b.timestamp;
    });

    const listItemsHtml = filteredPayments.map((p) => {
        const i = p.originalIndex;
        let dateDisplay = "";
        if (p.linkedActId) {
            DATA.days.forEach(day => {
                if (day && day.activities && day.activities.some(a => a && a.id === p.linkedActId)) {
                    dateDisplay = `<span style="color:var(--text3); font-weight:normal; font-size:0.75rem"> (${day.date})</span>`;
                }
            });
        }

        // Đổi window.open thành window.openLightbox
        const billIcon = p.receiptUrl ? `<span style="cursor:pointer; margin-left:8px; font-size:1.1rem; vertical-align: middle;" onclick="event.stopPropagation(); window.openLightbox('${p.receiptUrl}')" title="Xem ảnh Bill">🧾</span>` : "";
        const manualBadge = !p.linkedActId ? `<span style="margin-left:6px; font-size:0.55rem; padding:1px 5px; border-radius:4px; background:var(--accent-glow); color:var(--accent); border:1px dashed var(--accent);">✨ PHÁT SINH</span>` : "";
        const linkBtnHtml = (!p.linkedActId && canEditTrip) ? `<button style="background:var(--blue-bg); color:var(--blue); border:1px solid rgba(96,165,250,0.2); padding:4px 8px; border-radius:6px; font-size:.65rem; margin-top: 5px; display: flex; align-items: center; gap: 4px;" onclick="openLinkToActModal(${i})">🔗 Gắn vào lịch trình</button>` : '';

        let participantsHtml = "";
        let statusToggleHtml = "";
        let payerHtml = "";
        let isFullyFromFund = false;

        if (p.isEstimate) {
            payerHtml = `<span style="padding:2px 6px; background:var(--surface2); color:var(--accent); border: 1px dashed var(--accent); border-radius:4px; font-size:0.55rem; font-weight:800;">📝 DỰ TRÙ</span>`;
        } else {
            isFullyFromFund = (p.multiPayers && p.multiPayers.length)
                ? p.multiPayers.every(mp => mp.fromFund)
                : !!p.fromFund;
            const payerLabel = (p.multiPayers && p.multiPayers.length) ? getPaymentPayerText(p) : p.payer;
            payerHtml = `<span style="color:var(--text3)">${esc(payerLabel)}</span>${isFullyFromFund ? '<span style="padding:2px 6px; background:var(--orange-bg); color:var(--orange); border-radius:4px; font-size:0.6rem; font-weight:800;">QUỸ</span>' : ''}`;
            statusToggleHtml = `<div ${canEditTrip ? `onclick="togglePaymentPaid(${i})"` : ""} style="cursor: ${canEditTrip ? 'pointer' : 'default'}; display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 4px; font-size: 0.58rem; font-weight: 600; border: 1px solid ${p.isPaid ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}; background: ${p.isPaid ? 'var(--green-bg)' : 'var(--red-bg)'}; color: ${p.isPaid ? 'var(--green)' : 'var(--red)'}; transform: none !important;"><span style="font-size: 0.5rem; margin-top: -1px;">${p.isPaid ? '●' : '○'}</span> ${p.isPaid ? 'Đã trả' : 'Cần trả'} </div>`;
            if (p.participants && p.participants.length > 0) {
                const splitAmount = Math.round((p.amount || 0) / p.participants.length);
                participantsHtml = `<div style="font-size:0.65rem; color:var(--text3); margin-top:6px;"><div>👥 Cùng chia: <span style="color:var(--text2)">${p.participants.map(n => esc(n)).join(', ')}</span></div><div style="color:var(--orange); font-weight:600; margin-top:3px; padding-left:18px;">↳ Mỗi người: ${formatVND(splitAmount)}</div></div>`;
            }
        }

        return `
        <div class="swipe-container" style="margin-bottom: 8px;">
            <div class="swipe-actions editor-only">
                <button class="action-btn action-edit" onclick="openEditPayment(${i})">✎</button>
                <button class="action-btn action-delete" onclick="deletePayment(${i})">🗑️</button>
            </div>
            <div class="swipe-content payment-item action-card" style="border-left: 4px solid ${isFullyFromFund && !p.isEstimate ? 'var(--orange)' : (p.isEstimate ? 'var(--accent)' : 'var(--surface3)')}; flex-direction: row; justify-content: space-between; align-items: stretch; padding: 12px 14px; margin-bottom: 0; width: 100%; box-sizing: border-box;">
              
              <div style="flex:1; min-width: 0; padding-right: 10px; opacity: ${p.isEstimate ? '0.75' : '1'};">
                <div style="font-size:.85rem; font-weight:600; word-break: break-word;">${esc(p.desc || 'Chi tiêu')} ${dateDisplay} ${manualBadge} ${billIcon}</div>
                <div style="font-size:.7rem; display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap: wrap;">${payerHtml}${statusToggleHtml}</div>
                ${participantsHtml}${linkBtnHtml}
              </div>
              
              <div style="display:flex; flex-direction:column; justify-content:space-between; align-items:flex-end; opacity: ${p.isEstimate ? '0.75' : '1'};">
                <div style="font-size:.95rem; font-weight:700; color:var(--accent)">${formatVND(p.amount)}</div>
              </div>
            </div>
        </div>`;
    }).join('');

    // --- 5. TẠO TIÊU ĐỀ CHÍNH SANG CHẢNH ---
    const mainTitleHtml = `
        <div style="margin: 25px 0 25px 0; text-align: center;">
            <h2 style="font-family: var(--display); font-size: 1.8rem; color: var(--accent); margin: 0; letter-spacing: 0.5px; text-shadow: 0 2px 15px rgba(232,197,71,0.2);">Danh Sách Chi Tiêu</h2>
            <div style="font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; margin-bottom: 15px;">Theo dõi dòng tiền của chuyến đi</div>
            <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
              <button id="btnCapturePayment" class="btn" style="width:auto; padding:6px 15px; font-size:.7rem; background:var(--surface2); color:var(--accent); border: 1px dashed var(--accent); border-radius: 20px;" onclick="exportPaymentToImage()">📸 Chụp Báo Cáo</button>
              <button class="btn" style="width:auto; padding:6px 15px; font-size:.7rem; background:var(--surface2); color:var(--green); border: 1px dashed var(--green); border-radius: 20px;" onclick="exportPaymentsToExcel()">📊 Export Excel</button>
            </div>
        </div>
    `;

    // --- 6. GIAO DIỆN BỘ LỌC MINI (NÂNG CẤP STICKY) ---
    const filterUI = `
        <div style="position: sticky; top: 55px; z-index: 90; display: flex; justify-content: space-between; align-items: center; margin: 0 -16px 12px -16px; padding: 12px 16px; background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;">
            <div class="section-header section-title" style="margin: 0; border: none;">Chi tiết chi tiêu</div>
            <div style="display: flex; gap: 6px; background: var(--surface2); padding: 4px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                <button style="padding: 4px 10px; font-size: 0.65rem; font-weight: 600; border-radius: 6px; border: none; background: ${window.currentPaymentFilter === 'all' ? 'var(--surface3)' : 'transparent'}; color: ${window.currentPaymentFilter === 'all' ? 'var(--text)' : 'var(--text3)'}; transition: 0.2s;" onclick="setPaymentFilter('all')">Tất cả</button>
                <button style="padding: 4px 10px; font-size: 0.65rem; font-weight: 600; border-radius: 6px; border: none; background: ${window.currentPaymentFilter === 'paid' ? 'var(--green-bg)' : 'transparent'}; color: ${window.currentPaymentFilter === 'paid' ? 'var(--green)' : 'var(--text3)'}; transition: 0.2s;" onclick="setPaymentFilter('paid')">Thực chi</button>
                <button style="padding: 4px 10px; font-size: 0.65rem; font-weight: 600; border-radius: 6px; border: none; background: ${window.currentPaymentFilter === 'estimate' ? 'var(--accent-glow)' : 'transparent'}; color: ${window.currentPaymentFilter === 'estimate' ? 'var(--accent)' : 'var(--text3)'}; transition: 0.2s;" onclick="setPaymentFilter('estimate')">Dự trù</button>
            </div>
        </div>
    `;

    list.innerHTML = mainTitleHtml + heatmapUI + statsUI + filterUI + (listItemsHtml || '<div class="empty" style="padding-top: 20px;">Không có khoản chi nào trong mục này</div>');
    if (flash) list.classList.add('update-flash'), setTimeout(()=>list.classList.remove('update-flash'),700);
    setTimeout(window.initSwipeActions, 100);
};

window.renderCollection = renderCollection = (flash = false) => {
  const grid = document.getElementById('memberGrid');
  const detailList = document.getElementById('memberDetailList');
  if (!grid || !detailList) return;
  updateTripOverview();

  const members = DATA.members || [];
  
  // 0. CHỐT CHẶN AN TOÀN: Lọc bỏ các khoản chi bị null/undefined để tránh crash app
  const payments = (DATA.payments || []).filter(p => p !== null && typeof p === 'object');

  // 1. TÍNH TỔNG TIÊU TỪ QUỸ (Hỗ trợ Multi-Payer)
  const totalUsed = payments.reduce((sum, p) => {
      if (!p.isPaid || p.isEstimate) return sum;
      
      // Nếu là hóa đơn có nhiều người trả
      if (p.multiPayers) {
          return sum + p.multiPayers.reduce((s, mp) => mp.fromFund ? s + mp.amount : s, 0);
      }
      
      // Nếu là 1 người trả
      return p.fromFund ? sum + (p.amount || 0) : sum;
  }, 0);

  // 2. TÍNH TỔNG ĐÓNG (Giữ nguyên cũ)
  const totalCollected = members.reduce((total, m) => {
    const mPaid = (m.payments || []).reduce((sum, v) => sum + v, 0) || m.paid || 0;
    return total + Math.max(0, mPaid);
  }, 0);

  // Cập nhật DATA.fund để đồng bộ hệ thống
  if (!DATA.fund) DATA.fund = { collected: 0, used: 0, link: "", qrUrl: "" };
  DATA.fund.collected = totalCollected;
  DATA.fund.used = totalUsed;
  const fund = DATA.fund;

  // 3. HIỂN THỊ BẢNG ĐIỆN TỬ (Giữ nguyên)
  const actualBalance = totalCollected - totalUsed;
  const displayBalance = Math.max(0, actualBalance); 

  document.getElementById('fundPaid').textContent = formatVND(totalCollected);
  document.getElementById('fundUsed').textContent = formatVND(totalUsed);
  
  const remainEl = document.getElementById('fundRemain');
  remainEl.textContent = formatVND(displayBalance);
  remainEl.style.color = actualBalance < 0 ? 'var(--red)' : 'var(--accent)';

  // Logic QR code & Link Quỹ (Giữ nguyên tính năng cũ của bác)
  const linkInput = document.getElementById('fundLinkInput');
  const actionBtn = document.getElementById('fundLinkActionBtn'); 
  const qrImg = document.getElementById('fundQrImg');
  if (linkInput && actionBtn) {
    linkInput.value = fund.link || "";
    if (!isEditor) { linkInput.disabled = true; } 
    else {
      if (fund.link) {
        linkInput.disabled = true;
        actionBtn.textContent = "Sửa";
        actionBtn.setAttribute('onclick', 'editFundLink()');
      } else {
        linkInput.disabled = false;
        actionBtn.textContent = "Lưu";
        actionBtn.setAttribute('onclick', 'saveFundLink()');
      }
    }
  }
  if (qrImg) qrImg.src = fund.qrUrl || "https://placehold.co/200x200?text=Chưa+có+mã+QR";

  if (!members.length) {
    grid.innerHTML = guidedEmptyState({
      icon: "👥",
      title: "Chưa có thành viên",
      text: "Thêm bạn bè để chia tiền và quản lý quỹ.",
      actionText: "+ Thêm thành viên",
      action: "openAddMemberModal()"
    });
    detailList.innerHTML = "";
    return;
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Chưa có thành viên</div>';
    detailList.innerHTML = '<div class="empty">Chưa có thành viên</div>';
    return;
  }

  // 4. TÍNH TOÁN CHI TIÊU RIÊNG TỪNG NGƯỜI (ĐÃ CHUẨN HÓA VỚI BẢNG SAO KÊ)
  let memberStats = {};
  members.forEach(m => memberStats[m.name] = { consumed: 0, advanced: 0 });

  payments.forEach(p => {
      if (!p.isPaid || p.isEstimate) return; 

      // A. Tính tiền bị chia (Thụ hưởng / Đã tiêu)
      const parts = p.participants || [];
      if (parts.length > 0) {
          const splitAmount = Math.round(p.amount / parts.length);
          parts.forEach(name => {
              if (memberStats[name] !== undefined) memberStats[name].consumed += splitAmount;
          });
      }

      // B. Tính tiền ứng ra trả hộ (Không móc từ quỹ)
      if (p.multiPayers) {
          p.multiPayers.forEach(mp => {
              if (!mp.fromFund && memberStats[mp.name] !== undefined) {
                  memberStats[mp.name].advanced += mp.amount;
              }
          });
      } else if (!p.fromFund && memberStats[p.payer] !== undefined) {
          memberStats[p.payer].advanced += p.amount;
      }
  });

  // 5. VẼ ĐẤU TRƯỜNG SINH TỒN (GRID)
  grid.innerHTML = members.map((m, i) => {
    const totalContributed = (m.payments || []).reduce((s, v) => s + v, 0) || m.paid || 0;
    const totalConsumed = memberStats[m.name].consumed;
    const totalAdvanced = memberStats[m.name].advanced;
    
    // CÔNG THỨC CHUẨN: Dư Nợ = Đóng Quỹ + Tiền Ứng Hộ - Tiền Bị Chia (Tiêu)
    const balance = totalContributed + totalAdvanced - totalConsumed;

    const balanceColor = balance > 0 ? 'var(--green)' : (balance < 0 ? 'var(--red)' : 'var(--text3)');
    const balanceLabel = balance >= 0 ? 'Còn lại' : 'Nợ nhóm';

    // Tính HP Bar (Máu) dựa trên Tổng tài sản thực có (Đóng quỹ + Ứng)
    const totalAssets = totalContributed + totalAdvanced;
    let hpPercent = totalAssets > 0 ? Math.max(0, Math.min(100, Math.round((balance / totalAssets) * 100))) : 0;
    let hpColor = "var(--green)", statusText = "❤️ KHỎE MẠNH", cardClass = "";

    if (balance < 0) {
        hpPercent = 0; hpColor = "var(--red)"; statusText = "💀 CON NỢ"; cardClass = "critical";
    } else if (balance === 0) {
        hpPercent = 0; hpColor = "var(--text3)"; statusText = "🪫 VÔ SẢN";
    } else if (hpPercent <= 30) {
        hpColor = "var(--orange)"; statusText = "⚠️ HẤP HỐI";
    } else if (hpPercent <= 60) {
        hpColor = "var(--accent)"; statusText = "🩹 THƯƠNG TÍCH";
    }

    const seed = m.avatarSeed || m.name;

    return `
      <div class="member-card trip-card ${cardClass}" onclick="openHistoryModal(${i})" style="padding: 14px 12px; position: relative;">
        <button class="editor-only" style="position:absolute; top:8px; left:8px; width: 26px; height: 26px; border-radius: 6px; background: var(--green-bg); color: var(--green); border: 1px solid rgba(74,222,128,0.2); z-index: 30; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size: 0.75rem;" 
                onclick="var e=arguments[0]||window.event; e.stopPropagation(); openEditMember(${i})" title="Nạp quỹ / Sửa thông tin">💰</button>
        
        <button class="editor-only" style="position:absolute; top:8px; right:8px; width: 26px; height: 26px; border-radius: 6px; background: var(--red-bg); color: var(--red); border: none; z-index: 30; display:flex; align-items:center; justify-content:center; cursor:pointer;" 
                onclick="var e=arguments[0]||window.event; e.stopPropagation(); deleteMember(${i})" title="Xóa thành viên">🗑️</button>
        
        <img class="member-avatar" src="https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf" 
             style="filter: ${hpPercent <= 0 ? 'grayscale(100%)' : 'none'}; width: 44px; height: 44px; position: relative; z-index: 10;" 
             onclick="var e=arguments[0]||window.event; e.stopPropagation(); openAvatarModal(${i});">
        
        <div style="font-size:.85rem; font-weight:700;">${esc(m.name)}</div>
        <div class="hp-bar-container"><div class="hp-bar-fill" style="width: ${hpPercent}%; background: ${hpColor};"></div></div>
        <div class="status-label" style="color: ${hpColor};">${statusText} (${hpPercent}%)</div>
        
        <div style="width: 100%; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.65rem; color: var(--text2); display: flex; justify-content: space-between; align-items: center;">
                <span>💰 Đóng quỹ</span>
                <span style="color: var(--green); font-weight: 600;">${formatVND(totalContributed)}</span>
            </div>
            
            ${totalAdvanced > 0 ? `
            <div style="font-size: 0.65rem; color: var(--text2); display: flex; justify-content: space-between; align-items: center;">
                <span>💳 Đã ứng hộ</span>
                <span style="color: var(--blue); font-weight: 600;">+${formatVND(totalAdvanced)}</span>
            </div>` : ''}

            <div style="font-size: 0.65rem; color: var(--text2); display: flex; justify-content: space-between; align-items: center;">
                <span>🛒 Đã tiêu</span>
                <span style="color: var(--red); font-weight: 600;">-${formatVND(totalConsumed)}</span>
            </div>

            <div style="width: 100%; font-size: 0.8rem; font-weight: 800; color: ${balanceColor}; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.03);">
                <span>${balanceLabel}</span>
                <span>${formatVND(Math.abs(balance))}</span>
            </div>
        </div>
      </div>`;
  }).join('');

  // 6. VẼ DANH SÁCH CHI TIẾT (TAB THÀNH VIÊN BÊN PHẢI)
  detailList.innerHTML = members.map((m, i) => {
    const totalContributed = (m.payments || []).reduce((s, v) => s + v, 0) || m.paid || 0;
    const totalConsumed = memberStats[m.name].consumed;
    const totalAdvanced = memberStats[m.name].advanced;
    const balance = totalContributed + totalAdvanced - totalConsumed;
    
    const seed = m.avatarSeed || m.name; 

    return `
    <div class="swipe-container" style="margin-bottom: 8px;">
        <div class="swipe-actions editor-only">
            <button class="action-btn action-edit" style="background: var(--green-bg); color: var(--green);" onclick="openEditMember(${i})">💰</button>
            <button class="action-btn action-delete" onclick="deleteMember(${i})">🗑️</button>
        </div>
        <div class="swipe-content payment-item action-card" style="margin-bottom: 0; width: 100%; box-sizing: border-box;">
        <img src="https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf" 
            style="width: 40px; height: 40px; border-radius: 50%; object-fit: contain; cursor: pointer; flex-shrink: 0;" 
            onclick="var e=arguments[0]||window.event; e.stopPropagation(); openAvatarModal(${i});">
            
        <div style="flex: 1; min-width: 0; padding-left: 5px;">
            <div style="font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(m.name)}</div>
            <div style="font-size: .7rem; color: var(--text3); margin-top: 3px;">
                Số dư: <span style="font-weight: 600; color: ${balance >= 0 ? 'var(--green)' : 'var(--red)'}">${balance >= 0 ? '+' : ''}${formatVND(balance)}</span>
            </div>
        </div>
        </div>
    </div>`;
  }).join('');

  if (flash) grid.classList.add('update-flash'), setTimeout(() => grid.classList.remove('update-flash'), 700);
  setTimeout(window.initSwipeActions, 100);
};

function getSafeExcelName(name) {
    return String(name || 'Trippy').replace(/[\/\\?%*:|"<>]/g, '-').trim() || 'Trippy';
}

function getPaymentPayerText(p) {
    if (!p) return "";
    if (p.multiPayers && p.multiPayers.length) {
        return p.multiPayers.map(mp => `${mp.name || "Chưa rõ"}: ${mp.amount || 0}${mp.fromFund ? " (Quỹ)" : ""}`).join(" | ");
    }
    return p.payer || "";
}

function getPaymentFromFundText(p) {
    if (!p) return "";
    if (p.multiPayers && p.multiPayers.length) {
        const fundItems = p.multiPayers.filter(mp => mp.fromFund);
        return fundItems.length ? fundItems.map(mp => `${mp.name || "Quỹ"}: ${mp.amount || 0}`).join(" | ") : "";
    }
    return p.fromFund ? "x" : "";
}

function getPaymentActivityContext(payment) {
    if (!payment || !payment.linkedActId || !DATA || !DATA.days) {
        return { date: "", dayTitle: "", activity: "", time: "", location: "" };
    }

    for (const day of DATA.days || []) {
        const act = (day.activities || []).find(a => a && a.id === payment.linkedActId);
        if (act) {
            return {
                date: day.date || "",
                dayTitle: day.title || "",
                activity: act.name || "",
                time: act.time || "",
                location: act.location || ""
            };
        }
    }

    return { date: "", dayTitle: "", activity: "Hoạt động đã xóa", time: "", location: "" };
}

function applyVNDFormat(ws, rowStart, rowEnd, colIndexes) {
    for (let r = rowStart; r <= rowEnd; r++) {
        colIndexes.forEach(c => {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = ws[cellRef];
            if (cell && typeof cell.v === "number") {
                cell.z = '#,##0" đ"';
            }
        });
    }
}

window.exportPaymentsToExcel = exportPaymentsToExcel = () => {
    if (!DATA) return showToast("Không có dữ liệu!", "error");
    const payments = (DATA.payments || []).filter(p => p && typeof p === "object");
    if (!payments.length) return showToast("Chưa có chi tiêu để export", "info");

    try {
        const wb = XLSX.utils.book_new();
        const rows = [[
            "STT", "Ngày", "Day", "Giờ", "Hoạt động", "Địa điểm", "Mô tả",
            "Số tiền (VNĐ)", "Người trả", "Người tham gia", "Dự trù", "Đã thanh toán",
            "Rút từ quỹ", "Có bill", "Link bill"
        ]];

        payments.forEach((p, index) => {
            const ctx = getPaymentActivityContext(p);
            rows.push([
                index + 1,
                ctx.date,
                ctx.dayTitle,
                ctx.time,
                ctx.activity || (p.linkedActId ? "Hoạt động đã xóa" : "Phát sinh"),
                ctx.location,
                p.desc || "",
                p.amount || 0,
                getPaymentPayerText(p),
                (p.participants || []).join(", "),
                p.isEstimate ? "x" : "",
                p.isPaid ? "x" : "",
                getPaymentFromFundText(p),
                p.receiptUrl ? "x" : "",
                p.receiptUrl || ""
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [
            {wch: 6}, {wch: 12}, {wch: 20}, {wch: 8}, {wch: 24}, {wch: 24}, {wch: 30},
            {wch: 14}, {wch: 34}, {wch: 36}, {wch: 10}, {wch: 14}, {wch: 22}, {wch: 9}, {wch: 42}
        ];
        applyVNDFormat(ws, 1, payments.length, [7]);
        if (payments.length) {
            ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: payments.length, c: 14 } }) };
        }
        XLSX.utils.book_append_sheet(wb, ws, "Chi_Tieu");
        XLSX.writeFile(wb, `ChiTieu_${getSafeExcelName(DATA.trip?.name)}.xlsx`);
        showToast("Đã export Excel chi tiêu", "success");
    } catch (err) {
        console.error(err);
        showToast("Lỗi export Excel chi tiêu", "error");
    }
};

window.exportMemberExpensesToExcel = exportMemberExpensesToExcel = () => {
    if (!DATA) return showToast("Không có dữ liệu!", "error");
    const members = DATA.members || [];
    const payments = (DATA.payments || []).filter(p => p && typeof p === "object");
    if (!members.length) return showToast("Chưa có thành viên để export", "info");

    try {
        const wb = XLSX.utils.book_new();
        const memberStats = {};
        members.forEach(m => {
            const rawFund = (m.payments || []).reduce((s, v) => s + (Number(v) || 0), 0) || (m.paid || 0);
            memberStats[m.name] = {
                fundPaid: Math.max(0, rawFund),
                fundWithdrawn: Math.abs(Math.min(0, rawFund)),
                consumed: 0,
                advanced: 0
            };
        });

        const memberEntries = {};
        members.forEach(m => { memberEntries[m.name] = []; });

        payments.forEach(p => {
            if (!p.isPaid || p.isEstimate) return;
            const ctx = getPaymentActivityContext(p);
            const participants = p.participants || [];
            const splitAmount = participants.length ? Math.round((p.amount || 0) / participants.length) : 0;
            const advancedByMember = {};

            if (p.multiPayers && p.multiPayers.length) {
                p.multiPayers.forEach(mp => {
                    if (!mp.fromFund && memberStats[mp.name]) {
                        advancedByMember[mp.name] = (advancedByMember[mp.name] || 0) + (mp.amount || 0);
                    }
                });
            } else if (!p.fromFund && memberStats[p.payer]) {
                advancedByMember[p.payer] = (advancedByMember[p.payer] || 0) + (p.amount || 0);
            }

            const activityLabel = ctx.activity || (p.linkedActId ? "Hoạt động đã xóa" : "Phát sinh");

            members.forEach(m => {
                const consumed = participants.includes(m.name) ? splitAmount : 0;
                const advanced = advancedByMember[m.name] || 0;
                if (!consumed && !advanced) return;

                memberStats[m.name].consumed += consumed;
                memberStats[m.name].advanced += advanced;
                memberEntries[m.name].push({
                    date: ctx.date,
                    activity: activityLabel,
                    desc: p.desc || "",
                    consumed,
                    advanced
                });
            });
        });

        const summaryHeader = [
            "Thành viên", "Quỹ đã đóng (VNĐ)", "Quỹ đã rút (VNĐ)", "Tổng phần chi tiêu (VNĐ)",
            "Tổng đã ứng/trả hộ (VNĐ)", "Chênh lệch ứng - tiêu (VNĐ)", "Nợ nhóm (VNĐ)", "Được hoàn (VNĐ)"
        ];
        const summaryDataRows = members.map(m => {
            const s = memberStats[m.name];
            // CÔNG THỨC CHUẨN (đồng bộ với mục Tổng quan thành viên trong app):
            // Số dư = Quỹ đã đóng - Quỹ đã rút + Đã ứng/trả hộ - Tổng phần chi tiêu
            // Số dư âm -> còn NỢ NHÓM đúng bằng giá trị tuyệt đối đó; số dư dương -> ĐƯỢC HOÀN đúng bằng số dư đó
            const balance = s.fundPaid - s.fundWithdrawn + s.advanced - s.consumed;
            const noNhom = balance < 0 ? -balance : 0;
            const duocHoan = balance > 0 ? balance : 0;
            return [m.name, s.fundPaid, s.fundWithdrawn, s.consumed, s.advanced, s.advanced - s.consumed, noNhom, duocHoan];
        });

        const fundRows = [["Thành viên", "Loại", "Số tiền (VNĐ)", "Lần"]];
        members.forEach(m => {
            const history = m.payments || (m.paid ? [m.paid] : []);
            history.forEach((amount, index) => {
                fundRows.push([m.name, amount >= 0 ? "Nạp quỹ" : "Rút quỹ", amount, index + 1]);
            });
        });

        // Gộp 1 sheet dạng bảng phẳng có cột "Thành viên" để bật Filter Excel:
        // chọn 1 người -> chỉ hiện người đó, chọn "(Select All)" -> hiện tất cả.
        // Mỗi thành viên là 1 nhóm (Excel Group/Outline) có thể bấm nút "-" để thu gọn
        // chỉ còn dòng Tổng cộng, và có dòng trống ngăn cách giữa các thành viên.
        const detailHeader = ["Thành viên", "Ngày", "Hoạt động", "Mô tả chi tiêu", "Phải trả (VNĐ)", "Đã ứng hộ (VNĐ)", "Quỹ đã đóng (VNĐ)"];
        const combinedRows = [];
        const moneyDataCells = []; // {r, c} cells cần format VNĐ
        const rowLevels = {}; // r -> outline level (để tạo group thu gọn/mở rộng)

        combinedRows.push(["CHI TIẾT CHI TIÊU THEO TỪNG THÀNH VIÊN (Filter ở cột Thành viên để lọc; bấm nút [-] bên trái để thu gọn từng người)"]);
        const mainTitleRow = 0;

        combinedRows.push(detailHeader);
        const detailHeaderRow = combinedRows.length - 1;
        const detailDataStart = combinedRows.length;

        const memberNamesWithData = members.filter(m => memberEntries[m.name].length);
        memberNamesWithData.forEach((m, idx) => {
            const entries = memberEntries[m.name];

            entries.forEach(e => {
                const r = combinedRows.length;
                combinedRows.push([m.name, e.date, e.activity, e.desc, e.consumed, e.advanced, ""]);
                moneyDataCells.push({ r, c: 4 }, { r, c: 5 });
                rowLevels[r] = 1; // dòng chi tiết -> có thể thu gọn
            });

            const totalConsumed = entries.reduce((s, e) => s + e.consumed, 0);
            const totalAdvanced = entries.reduce((s, e) => s + e.advanced, 0);
            const fundPaidForMember = memberStats[m.name].fundPaid;
            const subtotalRow = combinedRows.length;
            combinedRows.push([m.name, "", "—", "Tổng cộng phải trả", totalConsumed, totalAdvanced, fundPaidForMember]);
            moneyDataCells.push({ r: subtotalRow, c: 4 }, { r: subtotalRow, c: 5 }, { r: subtotalRow, c: 6 });
            // dòng Tổng cộng giữ level 0 -> luôn hiện, là dòng đại diện khi thu gọn nhóm

            if (idx < memberNamesWithData.length - 1) {
                combinedRows.push([]); // break line ngăn cách sang thành viên kế tiếp
            }
        });
        const detailDataEnd = combinedRows.length - 1;

        combinedRows.push([]);
        combinedRows.push([]);
        combinedRows.push(["TỔNG QUAN QUỸ THEO THÀNH VIÊN"]);
        const summaryTitleRow = combinedRows.length - 1;
        combinedRows.push(summaryHeader);
        const summaryDataStart = combinedRows.length;
        summaryDataRows.forEach(r => combinedRows.push(r));
        const summaryDataEnd = combinedRows.length - 1;

        const wsCombined = XLSX.utils.aoa_to_sheet(combinedRows);
        wsCombined["!cols"] = [
            {wch: 18}, {wch: 12}, {wch: 26}, {wch: 32}, {wch: 18}, {wch: 18}, {wch: 18}, {wch: 16}
        ];
        wsCombined["!merges"] = [
            { s: { r: mainTitleRow, c: 0 }, e: { r: mainTitleRow, c: 6 } },
            { s: { r: summaryTitleRow, c: 0 }, e: { r: summaryTitleRow, c: 7 } }
        ];
        if (Object.keys(rowLevels).length) {
            wsCombined["!rows"] = [];
            Object.keys(rowLevels).forEach(rIdx => {
                wsCombined["!rows"][rIdx] = { level: rowLevels[rIdx] };
            });
        }
        if (detailDataEnd >= detailDataStart) {
            wsCombined["!autofilter"] = {
                ref: XLSX.utils.encode_range({ s: { r: detailHeaderRow, c: 0 }, e: { r: detailDataEnd, c: 6 } })
            };
        }

        moneyDataCells.forEach(({ r, c }) => {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = wsCombined[cellRef];
            if (cell && typeof cell.v === "number") cell.z = '#,##0" đ"';
        });
        if (summaryDataEnd >= summaryDataStart) applyVNDFormat(wsCombined, summaryDataStart, summaryDataEnd, [1, 2, 3, 4, 5, 6, 7]);
        XLSX.utils.book_append_sheet(wb, wsCombined, "Chi_Tiet_Thanh_Vien");

        const wsFund = XLSX.utils.aoa_to_sheet(fundRows);
        wsFund["!cols"] = [{wch: 24}, {wch: 14}, {wch: 16}, {wch: 8}];
        applyVNDFormat(wsFund, 1, fundRows.length - 1, [2]);
        if (fundRows.length > 1) {
            wsFund["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: fundRows.length - 1, c: 3 } }) };
        }
        XLSX.utils.book_append_sheet(wb, wsFund, "Nap_Rut_Quy");

        XLSX.writeFile(wb, `ChiTieuThanhVien_${getSafeExcelName(DATA.trip?.name)}.xlsx`);
        showToast("Đã export Excel chi tiêu thành viên", "success");
    } catch (err) {
        console.error(err);
        showToast("Lỗi export Excel thành viên", "error");
    }
};

// ============================================
// XUẤT 1 FILE EXCEL GỒM 2 SHEET
// ============================================
window.exportMasterDataToExcel = exportMasterDataToExcel = () => {
    if (!DATA) return showToast("Không có dữ liệu!", "error");
    try {
        const wb = XLSX.utils.book_new();
        const safeTripName = (DATA.trip.name || 'Trippy').replace(/[\/\\?%*:|"<>]/g, '-');

        // --- SHEET 1: LỊCH TRÌNH ---
        const itinData = [["Ngày", "Tiêu đề ngày", "Giờ", "Hoạt động", "Địa điểm", "Ghi chú", "Mô tả chi tiêu", "Số tiền (VNĐ)", "Người trả", "Người tham gia (Chia đều)", "Đã thanh toán (x)", "Rút từ quỹ (x)", "Link ảnh Bill"]];
        
        if (DATA.days && DATA.days.length > 0) {
            DATA.days.forEach(day => {
                if (!day.activities) return;
                let dateStr = day.date || "";
                if (dateStr.includes('/') && dateStr.split('/').length < 3) dateStr += "/" + new Date().getFullYear();

                day.activities.forEach(act => {
                    const pIndices = window.getLinkedPaymentIndices(act.id);
                    
                    if (pIndices.length === 0) {
                        itinData.push([dateStr, day.title, act.time, act.name, act.location, act.note, "", "", "", "", "", "", ""]);
                        return;
                    }

                    pIndices.forEach((pIdx, index) => {
                        const p = DATA.payments[pIdx];
                        if (!p) return;
                        
                        let payDesc = p.desc || ""; 
                        let amount = p.amount || 0; 
                        let payer = p.payer || "";
                        let participants = (p.participants || []).join(", ");
                        let isPaid = p.isPaid ? "x" : ""; 
                        let receiptUrl = p.receiptUrl || ""; 
                        
                        // LOGIC THÔNG MINH CHO CỘT QUỸ: Chốt hạ chỉ "x" hoặc ""
                        let fromFundStr = "";
                        if (p.multiPayers && p.multiPayers.length > 0) {
                            payer = p.multiPayers.map(mp => `${mp.name}: ${mp.amount}${mp.fromFund ? ' (Quỹ)' : ''}`).join(' | ');
                            const fundCount = p.multiPayers.filter(mp => mp.fromFund).length;
                            // Chỉ đánh dấu x nếu TẤT CẢ đều rút từ quỹ
                            if (fundCount === p.multiPayers.length) fromFundStr = "x";
                            else fromFundStr = ""; // Hỗn hợp hoặc móc túi riêng thì để trống
                        } else {
                            fromFundStr = p.fromFund ? "x" : "";
                        }

                        if (index === 0) {
                            itinData.push([dateStr, day.title, act.time, act.name, act.location, act.note, payDesc, amount, payer, participants, isPaid, fromFundStr, receiptUrl]);
                        } else {
                            itinData.push(["", "", "", "", "", "", payDesc, amount, payer, participants, isPaid, fromFundStr, receiptUrl]);
                        }
                    });
                });
            });
        }
        const wsItin = XLSX.utils.aoa_to_sheet(itinData);
        if (wsItin['!ref']) {
            const range = XLSX.utils.decode_range(wsItin['!ref']);
            for (let r = 1; r <= range.e.r; r++) {
                const cell = wsItin[XLSX.utils.encode_cell({r: r, c: 0})];
                if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes('/')) {
                    const p = cell.v.split('/');
                    cell.t = 'd'; cell.v = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])); cell.z = 'dd/mm/yyyy';
                }
            }
        }
        wsItin['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsItin, "Lich_Trinh");

        // --- SHEET 2: CHI TIÊU NGOÀI ---
        const payData = [
            ["BẢNG CHI TIÊU PHÁT SINH (NẰM NGOÀI LỊCH TRÌNH)", "", "", "", "", "", "", "", ""],
            ["* Lưu ý: Link ảnh Bill được lưu ở cột cuối cùng để tránh mất dữ liệu khi Import.", "", "", "", "", "", "", "", ""],
            ["Mô tả khoản chi", "Ngày / Ghi chú", "Số tiền (VNĐ)", "Người trả", "Người tham gia (Chia đều)", "Dự trù (x)", "Đã thanh toán (x)", "Rút từ quỹ (x)", "Link ảnh Bill"]
        ];
        if (DATA.payments) {
            DATA.payments.filter(p => !p.linkedActId).forEach(p => {
                let fullDesc = p.desc || "", desc = fullDesc, note = "";
                let match = fullDesc.match(/^(.*?)\s*\((.*?)\)$/);
                if (match) { desc = match[1]; note = match[2]; }
                
                let payerStr = p.payer || "";
                let fromFundStr = "";
                
                // LOGIC THÔNG MINH CHO CỘT QUỸ: Chốt hạ chỉ "x" hoặc ""
                if (p.multiPayers && p.multiPayers.length > 0) {
                    payerStr = p.multiPayers.map(mp => `${mp.name}: ${mp.amount}${mp.fromFund ? ' (Quỹ)' : ''}`).join(' | ');
                    const fundCount = p.multiPayers.filter(mp => mp.fromFund).length;
                    // Chỉ đánh dấu x nếu TẤT CẢ đều rút từ quỹ
                    if (fundCount === p.multiPayers.length) fromFundStr = "x";
                    else fromFundStr = ""; // Hỗn hợp hoặc móc túi riêng thì để trống
                } else {
                    fromFundStr = p.fromFund ? "x" : "";
                }

                payData.push([desc, note, p.amount || 0, payerStr, (p.participants || []).join(", "), p.isEstimate ? "x" : "", p.isPaid ? "x" : "", fromFundStr, p.receiptUrl || ""]);
            });
        }
        const wsPay = XLSX.utils.aoa_to_sheet(payData);
        wsPay['!cols'] = [{wch: 30}, {wch: 20}, {wch: 15}, {wch: 35}, {wch: 40}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 40}];
        wsPay['!merges'] = [{ s: {r:0, c:0}, e: {r:0, c:8} }, { s: {r:1, c:0}, e: {r:1, c:8} }];
        XLSX.utils.book_append_sheet(wb, wsPay, "Chi_Tieu");

        XLSX.writeFile(wb, `DuLieu_${safeTripName}.xlsx`);
        showToast("Đã xuất file chuẩn kèm link ảnh!", "success");
    } catch (err) { console.error(err); showToast("Lỗi xuất file!", "error"); }
};

// ============================================
// NHẬP 1 FILE EXCEL GỒM 2 SHEET 
// ============================================
window.importMasterDataFromExcel = importMasterDataFromExcel = (event) => {
    if (!isEditor) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            if (!DATA.members) DATA.members = [];
            let currentMemberNames = DATA.members.map(m => m.name);

            let groupedDays = {};
            let newLinkedPayments = [];
            let newManualPayments = [];
            let hasValidData = false;

            // --- 1. XỬ LÝ TAB LỊCH TRÌNH ---
            let sheetItin = workbook.Sheets["Lich_Trinh"] || workbook.Sheets[workbook.SheetNames[0]];
            if (sheetItin) {
                const aoa = XLSX.utils.sheet_to_json(sheetItin, { header: 1, raw: false, defval: "" });
                let headerRowIdx = -1;
                // BỔ SUNG: participants: -1 vào colMap
                let colMap = { date: -1, title: -1, time: -1, act: -1, location: -1, note: -1, payDesc: -1, amount: -1, payer: -1, participants: -1, isPaid: -1, fromFund: -1 };

                for (let i = 0; i < Math.min(aoa.length, 10); i++) {
                    let rowStr = aoa[i].map(c => String(c).toLowerCase().replace(/\s/g, ''));
                    let dIdx = rowStr.findIndex(c => c.includes('ngày') || c.includes('date'));
                    let aIdx = rowStr.findIndex(c => c.includes('hoạtđộng') || c.includes('activity'));
                    
                    if (dIdx !== -1 && aIdx !== -1) { 
                        headerRowIdx = i; 
                        colMap.date = dIdx; 
                        colMap.act = aIdx; 
                        colMap.title = rowStr.findIndex(c => c.includes('tiêuđề')); 
                        colMap.time = rowStr.findIndex(c => c.includes('giờ')); 
                        colMap.location = rowStr.findIndex(c => c.includes('địađiểm')); 
                        colMap.note = rowStr.findIndex(c => c.includes('ghichú')); 
                        colMap.payDesc = rowStr.findIndex(c => c.includes('môtả')); 
                        colMap.amount = rowStr.findIndex(c => c.includes('sốtiền')); 
                        colMap.payer = rowStr.findIndex(c => c.includes('ngườitrả')); 
                        // BỔ SUNG: Tìm vị trí cột tham gia/chia đều
                        colMap.participants = rowStr.findIndex(c => c.includes('thamgia') || c.includes('chia'));
                        colMap.isPaid = rowStr.findIndex(c => c.includes('đãthanhtoán')); 
                        colMap.fromFund = rowStr.findIndex(c => c.includes('rúttừquỹ')); 
                        break; 
                    }
                }

                let lastActId = null;    // Ghi nhớ ID hoạt động trước đó
                let lastDate = null;     // Ghi nhớ ngày trước đó
                let lastDayTitle = null; 
                let lastActName = null;  // Ghi nhớ tên hoạt động trước đó

                if (headerRowIdx !== -1) {
                  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
                      let row = aoa[i];
                      if (!row || row.length === 0 || row.every(c => !String(c).trim())) continue;

                      let date = colMap.date !== -1 ? String(row[colMap.date]).trim() : "";
                      let actName = colMap.act !== -1 ? String(row[colMap.act]).trim() : "";
                      
                      let amountStr = colMap.amount !== -1 ? String(row[colMap.amount]).replace(/[^0-9]/g, '') : "";
                      let amount = parseFloat(amountStr) || 0;
                      let explicitPayDesc = colMap.payDesc !== -1 ? String(row[colMap.payDesc]).trim() : "";

                      // TRƯỜNG HỢP 1: CÓ TÊN HOẠT ĐỘNG -> TẠO HOẠT ĐỘNG MỚI
                      if (actName && actName.toLowerCase() !== 'undefined') {
                          if (date) lastDate = date; else date = lastDate; // Kế thừa ngày nếu bị trộn ô Excel
                          if (!date) continue; // Vẫn không có thì bỏ qua

                          if (date.includes('/')) {
                              let dParts = date.split('/');
                              date = `${dParts[0].padStart(2,'0')}/${dParts[1].padStart(2,'0')}${dParts.length > 2 ? '/' + dParts[2] : ''}`;
                          }

                          let dayTitle = colMap.title !== -1 ? String(row[colMap.title]).trim() : "";
                          if (dayTitle) lastDayTitle = dayTitle; else dayTitle = lastDayTitle;

                          lastActName = actName; // Cập nhật tên hoạt động mới nhất

                          let time = colMap.time !== -1 ? String(row[colMap.time]).trim() : "08:00";
                          if (time && time.includes(':')) {
                              let parts = time.split(':');
                              time = `${parts[0].padStart(2, '0')}:${parts[1] ? parts[1].padStart(2, '0') : '00'}`;
                          }
                          let location = colMap.location !== -1 ? String(row[colMap.location]).trim() : "";
                          let note = colMap.note !== -1 ? String(row[colMap.note]).trim() : "";
                          
                          lastActId = 'act_' + Date.now() + '_' + Math.floor(Math.random()*1000) + '_' + i;

                          if (!groupedDays[date]) groupedDays[date] = { date: date, title: dayTitle, activities: [] };
                          groupedDays[date].activities.push({ id: lastActId, time, name: actName, location, note });
                          hasValidData = true;
                      } 
                      // TRƯỜNG HỢP 2: DÒNG NÀY TRỐNG TÊN HOẠT ĐỘNG, NHƯNG CÓ TIỀN -> CHI TIÊU BỔ SUNG CHO HĐ BÊN TRÊN
                      else if (!actName && amount > 0 && lastActId) {
                          actName = lastActName; // Mượn tên hoạt động cũ để làm mô tả dự phòng
                      } 
                      // TRƯỜNG HỢP 3: KHÔNG THUỘC 2 LOẠI TRÊN THÌ BỎ QUA
                      else {
                          continue;
                      }

                      // TẠO KHOẢN CHI (Cả dòng mới và dòng bổ sung đều chạy chung logic này)
                      if (amount > 0) {
                          let rawPayer = colMap.payer !== -1 ? String(row[colMap.payer]).trim() : "";
                          let payer = rawPayer;
                          let multiPayers = null;

                          let finalPayDesc = explicitPayDesc || actName || "Chi tiêu liên kết";
                          let partStr = colMap.participants !== -1 ? String(row[colMap.participants]).trim() : "";
                          let participants = partStr ? partStr.split(',').map(s => s.trim()).filter(s => s) : [];
                          if (participants.length === 0) participants = [...currentMemberNames];

                          // 🔑 BẢN VÁ: Phân tích Multi-Payer từ Excel
                          if (rawPayer.includes(':') && rawPayer.includes('|')) {
                              multiPayers = [];
                              rawPayer.split('|').forEach(part => {
                                  let [n, a] = part.split(':');
                                  if (n && a) {
                                      let name = n.trim();
                                      let isF = a.includes('(Quỹ)');
                                      let amt = parseFloat(a.replace(/[^0-9]/g, '')) || 0;
                                      if (name && amt > 0) {
                                          multiPayers.push({ name, amount: amt, fromFund: isF });
                                          if (name.toLowerCase() !== 'quỹ' && name.toLowerCase() !== 'quy' && !currentMemberNames.includes(name)) {
                                              DATA.members.push({ name, payments: [], avatarSeed: name });
                                              currentMemberNames.push(name);
                                          }
                                      }
                                  }
                              });
                              if (multiPayers.length > 0) payer = "Nhiều người trả"; else multiPayers = null;
                          } else if (payer && payer.toLowerCase() !== 'quỹ' && payer.toLowerCase() !== 'quy' && !currentMemberNames.includes(payer)) {
                              DATA.members.push({ name: payer, payments: [], avatarSeed: payer }); 
                              currentMemberNames.push(payer); 
                          }

                          if (!payer) {
                              newLinkedPayments.push({ desc: finalPayDesc, amount: amount, payer: "", isPaid: false, fromFund: false, participants: [], linkedActId: lastActId, isEstimate: true });
                          } else {
                              participants.forEach(p => {
                                  if (!currentMemberNames.includes(p)) { DATA.members.push({ name: p, payments: [], avatarSeed: p }); currentMemberNames.push(p); }
                              });

                              const checkVal = (idx) => idx !== -1 && row[idx] && (String(row[idx]).toLowerCase().includes('x') || String(row[idx]) === '1' || String(row[idx]).toLowerCase() === 'có');
                              let isPaid = checkVal(colMap.isPaid); 
                              let fromFund = checkVal(colMap.fromFund);
                              if (!fromFund && (payer.toLowerCase() === 'quỹ' || payer.toLowerCase() === 'quy')) { fromFund = true; isPaid = true; }
                              if (multiPayers) isPaid = true; // Góp chung thì tự động coi như đã trả

                              let newPay = { desc: finalPayDesc, amount: amount, payer: payer || (fromFund ? "Quỹ" : "Chưa rõ"), isPaid: isPaid, fromFund: fromFund, participants: participants, linkedActId: lastActId, isEstimate: false };
                              if (multiPayers) newPay.multiPayers = multiPayers; // Nhúng vào data
                              newLinkedPayments.push(newPay);
                          }
                      }
                  }
                }
            }

            // --- 2. XỬ LÝ TAB CHI TIÊU (Có hỗ trợ Header thông minh) ---
            let sheetPay = workbook.Sheets["Chi_Tieu"];
            if (sheetPay) {
                const aoaPay = XLSX.utils.sheet_to_json(sheetPay, { header: 1, raw: false, defval: "" });
                let headerRowIdx = -1;
                let colMap = { desc: -1, note: -1, amount: -1, payer: -1, participants: -1, isEst: -1, isPaid: -1, fromFund: -1 };
                
                // Quét để bỏ qua các dòng Tiêu đề Cảnh báo, tìm đúng dòng có chữ "Mô tả"
                for (let i = 0; i < Math.min(aoaPay.length, 10); i++) {
                    if (!aoaPay[i]) continue;
                    let rowStr = aoaPay[i].map(c => String(c).toLowerCase().replace(/\s/g, ''));
                    let descIdx = rowStr.findIndex(c => c.includes('môtả'));
                    
                    if (descIdx !== -1) { 
                        headerRowIdx = i; 
                        colMap.desc = descIdx; 
                        colMap.note = rowStr.findIndex(c => c.includes('ghichú') || c.includes('ngày'));
                        colMap.amount = rowStr.findIndex(c => c.includes('sốtiền')); 
                        colMap.payer = rowStr.findIndex(c => c.includes('ngườitrả')); 
                        colMap.participants = rowStr.findIndex(c => c.includes('thamgia') || c.includes('chia')); 
                        colMap.isEst = rowStr.findIndex(c => c.includes('dựtrù')); 
                        colMap.isPaid = rowStr.findIndex(c => c.includes('đãthanhtoán')); 
                        colMap.fromFund = rowStr.findIndex(c => c.includes('rúttừquỹ')); 
                        break; 
                    }
                }

                if (headerRowIdx !== -1 && colMap.desc !== -1 && colMap.amount !== -1) {
                    for (let i = headerRowIdx + 1; i < aoaPay.length; i++) {
                        let row = aoaPay[i];
                        if (!row || row.length === 0 || row.every(c => !String(c).trim())) continue;

                        let baseDesc = String(row[colMap.desc]).trim();
                        let note = colMap.note !== -1 ? String(row[colMap.note]).trim() : "";
                        
                        // Thông minh: Nếu người dùng có điền cột Ghi chú, gộp nó vào tên luôn
                        let finalDesc = note ? `${baseDesc} (${note})` : baseDesc;

                        let amountStr = String(row[colMap.amount]).replace(/[^0-9]/g, '');
                        let amount = parseFloat(amountStr) || 0;

                        if (baseDesc && amount > 0) {
                            hasValidData = true;
                            const checkVal = (idx) => idx !== -1 && row[idx] && (String(row[idx]).toLowerCase().includes('x') || String(row[idx]) === '1' || String(row[idx]).toLowerCase() === 'có');
                            let isEstimate = checkVal(colMap.isEst); let isPaid = checkVal(colMap.isPaid); let fromFund = checkVal(colMap.fromFund);
                            
                            let rawPayer = colMap.payer !== -1 ? String(row[colMap.payer]).trim() : "";
                            let payer = rawPayer;
                            let multiPayers = null;

                            // 🔑 BẢN VÁ: Phân tích Multi-Payer
                            if (rawPayer.includes(':') && rawPayer.includes('|')) {
                                multiPayers = [];
                                rawPayer.split('|').forEach(part => {
                                    let [n, a] = part.split(':');
                                    if (n && a) {
                                        let name = n.trim();
                                        let isF = a.includes('(Quỹ)');
                                        let amt = parseFloat(a.replace(/[^0-9]/g, '')) || 0;
                                        if (name && amt > 0) {
                                            multiPayers.push({ name, amount: amt, fromFund: isF });
                                            if (name.toLowerCase() !== 'quỹ' && name.toLowerCase() !== 'quy' && !currentMemberNames.includes(name)) {
                                                DATA.members.push({ name, payments: [], avatarSeed: name });
                                                currentMemberNames.push(name);
                                            }
                                        }
                                    }
                                });
                                if (multiPayers.length > 0) payer = "Nhiều người trả"; else multiPayers = null;
                            } else if (payer && payer.toLowerCase() !== 'quỹ' && payer.toLowerCase() !== 'quy' && !currentMemberNames.includes(payer)) { 
                                DATA.members.push({ name: payer, payments: [], avatarSeed: payer }); 
                                currentMemberNames.push(payer); 
                            }

                            let partStr = colMap.participants !== -1 ? String(row[colMap.participants]).trim() : "";
                            let participants = partStr ? partStr.split(',').map(s => s.trim()).filter(s => s) : [];
                            participants.forEach(p => { if (!currentMemberNames.includes(p)) { DATA.members.push({ name: p, payments: [], avatarSeed: p }); currentMemberNames.push(p); } });

                            if (!fromFund && (payer.toLowerCase() === 'quỹ' || payer.toLowerCase() === 'quy')) { fromFund = true; isPaid = true; }
                            if (participants.length === 0 && !isEstimate) { participants = [...currentMemberNames]; }
                            if (multiPayers) isPaid = true; // Góp chung thì coi như đã trả

                            let newPay = { desc: finalDesc, amount, payer: payer || (fromFund ? "Quỹ" : (isEstimate ? "" : "Chưa rõ")), isPaid, fromFund, participants, isEstimate, linkedActId: "" };
                            if (multiPayers) newPay.multiPayers = multiPayers;
                            newManualPayments.push(newPay);
                        }
                    }
                }
            }

            if (!hasValidData) return showToast("Không có dữ liệu hợp lệ nào!", "error");

            const newDays = Object.values(groupedDays).map(day => {
                day.activities.sort((a, b) => a.time.localeCompare(b.time));
                return day;
            });

            if (confirm(`Đã quét xong file Excel.\nBấm OK để ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ file này.`)) {
                if (newDays.length > 0) DATA.days = newDays; 
                // --- CHỐT CHẶN BẢO VỆ ẢNH BILL ---
                const allNewPayments = [...newLinkedPayments, ...newManualPayments];
                
                // Lục tìm trong dữ liệu cũ xem khoản nào có ảnh thì bơm trả lại cho dữ liệu mới
                if (DATA.payments && DATA.payments.length > 0) {
                    allNewPayments.forEach(newP => {
                        const oldMatch = DATA.payments.find(oldP => 
                            oldP.desc === newP.desc && 
                            oldP.amount === newP.amount && 
                            oldP.receiptUrl
                        );
                        if (oldMatch) {
                            newP.receiptUrl = oldMatch.receiptUrl; // Bơm trả lại link ảnh
                        }
                    });
                }
                
                // Ghi đè an toàn
                DATA.payments = allNewPayments;

                if (!DATA.fund) DATA.fund = {collected:0, used:0, link:"", qrUrl:""};
                DATA.fund.used = DATA.payments.reduce((sum, p) => {
                    if (!p.isPaid || p.isEstimate) return sum;
                    if (p.multiPayers) {
                        return sum + p.multiPayers.reduce((s, mp) => mp.fromFund ? s + (mp.amount || 0) : s, 0);
                    }
                    return p.fromFund ? sum + (p.amount || 0) : sum;
                }, 0);

                save(); autoSync(); renderAll();
                showToast(`Đã đồng bộ toàn bộ dữ liệu từ Excel!`, "success");
            }
            event.target.value = '';
        } catch (err) {
            console.error("Upload Error:", err);
            showToast("Lỗi xử lý file Excel!", "error");
        }
    };
    reader.readAsArrayBuffer(file);
};

// ============================================
// TẠO VÀ TẢI FILE EXCEL MẪU (2 SHEET CHUẨN)
// ============================================
window.downloadMasterExcelTemplate = downloadMasterExcelTemplate = () => {
    try {
        const wb = XLSX.utils.book_new();

        const itinHeader = [
            ["HƯỚNG DẪN: Điền từ dòng thứ 5 trở xuống. Ngày chuẩn DD/MM/YYYY. Giờ chuẩn HH:MM. Số tiền chỉ nhập số.", "", "", "", "", "", "", "", "", "", "", ""],
            ["* MẸO: Nếu 1 hoạt động có nhiều khoản chi, ở các dòng tiếp theo bạn chỉ cần điền Cột G -> L.", "", "", "", "", "", "", "", "", "", "", ""],
            ["* Để trống 'Người trả' nếu muốn biến khoản chi đó thành 'DỰ TRÙ'.", "", "", "", "", "", "", "", "", "", "", ""],
            ["* ĐỒNG THANH TOÁN: Ghi nhiều người góp theo mẫu: Người A: 200000 (Quỹ) | Người B: 300000 (Cột Rút từ quỹ để trống)", "", "", "", "", "", "", "", "", "", "", ""],
            ["Ngày", "Tiêu đề ngày", "Giờ", "Hoạt động", "Địa điểm", "Ghi chú", "Mô tả chi tiêu", "Số tiền (VNĐ)", "Người trả", "Người tham gia (Chia đều)", "Đã thanh toán (x)", "Rút từ quỹ (x)"]
        ];

        const itinSamples = [
            ["29/04/2026", "Ngày 1: Khởi hành", "08:00", "Bay tới Nha Trang", "Sân bay", "VJ622", "Vé máy bay", 1500000, "Người A", "Người A, Người B, Người C", "x", "x"],
            ["29/04/2026", "Ngày 1: Khởi hành", "12:00", "Ăn trưa", "Quán Nem", "Đặc sản", "Bữa trưa", 500000, "Người A: 200000 (Quỹ) | Người B: 300000", "Người A, Người B, Người C, Người D", "x", ""],
            ["30/04/2026", "Ngày 2", "08:30", "VinWonders", "Đảo", "", "Vé vui chơi", 1000000, "", "", "", ""] 
        ];

        const wsItin = XLSX.utils.aoa_to_sheet([...itinHeader, ...itinSamples]);
        if (wsItin['!ref']) {
            const range = XLSX.utils.decode_range(wsItin['!ref']);
            for (let r = 5; r <= range.e.r; r++) {
                const cell = wsItin[XLSX.utils.encode_cell({r: r, c: 0})];
                if (cell && cell.v && typeof cell.v === 'string') {
                    const p = cell.v.split('/');
                    cell.t = 'd'; cell.v = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])); cell.z = 'dd/mm/yyyy';
                }
            }
        }
        wsItin['!merges'] = [{ s: {r:0, c:0}, e: {r:0, c:11} }, { s: {r:1, c:0}, e: {r:1, c:11} }, { s: {r:2, c:0}, e: {r:2, c:11} }, { s: {r:3, c:0}, e: {r:3, c:11} }];
        wsItin['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 8 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 35 }, { wch: 35 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsItin, "Lich_Trinh");

        // Sheet Chi tiêu mẫu
        const payHeader = [
            ["BẢNG CHI TIÊU PHÁT SINH (Khoản chi ngoài lịch trình)", "", "", "", "", "", "", ""],
            ["* Lưu ý: Tên người tham gia viết cách nhau bởi dấu phẩy (VD: Người A, Người B, Người C).", "", "", "", "", "", "", ""],
            ["Mô tả khoản chi", "Ngày / Ghi chú", "Số tiền (VNĐ)", "Người trả", "Người tham gia (Chia đều)", "Dự trù (x)", "Đã thanh toán (x)", "Rút từ quỹ (x)"]
        ];
        const paySamples = [ 
            ["Mua quà lưu niệm", "Sân bay", 300000, "Người C", "Người A, Người B, Người C", "", "x", ""], 
            ["Tiền Tip taxi", "Tối ngày 2", 50000, "Quỹ", "Tất cả", "", "x", "x"] 
        ];
        const wsPay = XLSX.utils.aoa_to_sheet([...payHeader, ...paySamples]);
        wsPay['!merges'] = [{ s: {r:0, c:0}, e: {r:0, c:7} }, { s: {r:1, c:0}, e: {r:1, c:7} }];
        wsPay['!cols'] = [{wch: 30}, {wch: 20}, {wch: 15}, {wch: 35}, {wch: 35}, {wch: 10}, {wch: 15}, {wch: 15}];
        XLSX.utils.book_append_sheet(wb, wsPay, "Chi_Tieu");

        XLSX.writeFile(wb, "File_Mau_Trippy_Master.xlsx");
        showToast("Đã tải file mẫu chuẩn hóa mới!", "success");
    } catch (err) { showToast("Lỗi tạo file mẫu!", "error"); }
};

// ===== FIREBASE - REALTIME LISTENER =====
window.connectFirebase = connectFirebase = (silent = false) => {
  _doConnect(FIREBASE_CONFIG.apiKey, FIREBASE_CONFIG.projectId, FIREBASE_CONFIG.dbUrl, silent);
};

function _doConnect(apiKey, projectId, dbUrl, silent) {
  try {
    const sdk = window._fbSDK;
    if (!sdk) { showToast("Firebase SDK chưa tải xong, thử lại.", "error"); return; }

    // Hủy listener cũ nếu có
    stopRealtimeListener();

    const config = { apiKey, authDomain:`${projectId}.firebaseapp.com`, databaseURL:dbUrl, projectId };
    const existingApps = sdk.getApps();
    window._firebaseApp = _firebaseApp = existingApps.length > 0 ? sdk.getApp() : sdk.initializeApp(config);
    window._firebaseDb = _firebaseDb = sdk.getDatabase(window._firebaseApp);
    firebaseConnected = true;

    const dot = document.getElementById('fbDot');
    dot.classList.add('connected');
    document.getElementById('fbStatus').textContent = "Online";
    
    if (!silent) showToast("Đã kết nối Firebase!", "success");

    // --- BẮT ĐẦU SỬA: Tải danh sách công khai ngay khi có DB ---
    loadPublicTrips(); 
    // --- KẾT THÚC SỬA ---

    // Bắt đầu lắng nghe realtime cho phòng hiện tại (nếu đã vào phòng)
    startRealtimeListener();

  } catch(e) { 
    showToast("Lỗi kết nối: " + e.message, "error"); 
  }
}

function startRealtimeListener() {
  if (!firebaseConnected || !DATA || !DATA.trip || !DATA.trip.code) return;
  const sdk = window._fbSDK;
  const roomRef = sdk.ref(window._firebaseDb, `rooms/${DATA.trip.code}`);

  // Hiện badge LIVE
  document.getElementById('liveBadge').classList.add('visible');

  let isFirst = true;

  const unsubFn = sdk.onValue(roomRef, (snapshot) => {
    // Nếu mình vừa push lên (syncToFirebase), bỏ qua snapshot đầu tiên sau push
    if (_ignoreNextSnapshot) {
      _ignoreNextSnapshot = false;
      return;
    }

    if (!snapshot.exists()) {
      if (!isFirst) showToast("Room chưa có dữ liệu trên Firebase", "info");
      isFirst = false;
      return;
    }

    const remoteData = snapshot.val();
    isFirst = false;

    // So sánh sơ lược để không re-render nếu data không đổi
    const remoteStr = JSON.stringify(remoteData);
    const localStr = JSON.stringify(DATA);
    if (remoteStr === localStr) return;

    // Kiểm tra xem có modal nào đang mở không
    const openModal = document.querySelector('.modal-overlay.open');
    const activeInputs = document.querySelectorAll('.form-input:focus, input:focus, textarea:focus');

    // Cập nhật DATA (không làm mất trạng thái UI)
    DATA = remoteData;
    save();
    verifyRole();

    if (openModal || activeInputs.length > 0) {
      // Đang có modal mở hoặc đang nhập → render âm thầm, không flash, không toast gây xao nhãng
      renderAll(false);
    } else {
      // Không có gì đang mở → render bình thường với flash highlight
      renderAll(true);
      showToast("✦ Room đã cập nhật", "info");
    }
  }, (error) => {
    console.error("Firebase listener error:", error);
    showToast("Mất kết nối Firebase", "error");
    document.getElementById('fbDot').classList.remove('connected');
    document.getElementById('fbStatus').textContent = "Lỗi";
  });

  // Lưu thêm cách khác để hủy (onValue trả về unsubscribe function)
  _realtimeUnsubscribe = unsubFn; // onValue returns unsubscribe fn
}

function stopRealtimeListener() {
  if (typeof _realtimeUnsubscribe === 'function') {
    try { _realtimeUnsubscribe(); } catch(e) {}
    _realtimeUnsubscribe = null;
  }
  document.getElementById('liveBadge')?.classList.remove('visible');
}

  // SetupTimePicker
function setupTimePicker() {
  const hourSelect = document.getElementById('actHour');
  const minSelect = document.getElementById('actMinute');
  
  // BỔ SUNG: Lấy thêm 2 ô select của phần Sửa
  const editHourSelect = document.getElementById('editActHour');
  const editMinSelect = document.getElementById('editActMinute');

  let hOptions = '';
  for (let i = 0; i < 24; i++) {
    const val = i.toString().padStart(2, '0');
    hOptions += `<option value="${val}">${val}</option>`;
  }
  if (hourSelect) hourSelect.innerHTML = hOptions;
  if (editHourSelect) editHourSelect.innerHTML = hOptions; // Đổ vào form Sửa

  let mOptions = '';
  for (let i = 0; i < 60; i += 5) {
    const val = i.toString().padStart(2, '0');
    mOptions += `<option value="${val}">${val}</option>`;
  }
  if (minSelect) minSelect.innerHTML = mOptions;
  if (editMinSelect) editMinSelect.innerHTML = mOptions; // Đổ vào form Sửa
}

// Gọi hàm này trong phần init của bạn
setupTimePicker();

window.disconnectFirebase = disconnectFirebase = () => {
  stopRealtimeListener();
  firebaseConnected = false;
  window._firebaseDb = _firebaseDb = null;
  window._firebaseApp = _firebaseApp = null;
  document.getElementById('fbDot').classList.remove('connected');
  document.getElementById('fbStatus').textContent = "Offline";
  showToast("Đã ngắt kết nối Firebase", "");
};

// ===== AUTO SYNC (BẢN NÂNG CẤP OFFLINE) =====
let _syncTimer = null;
window.suppressNextDayClick = suppressNextDayClick = false;
function autoSync() {
  if (!isEditor || !window._firebaseDb) return;
  
  // NẾU MẤT MẠNG: Dừng lại, không đẩy lên Firebase nữa
  if (!navigator.onLine) {
      document.getElementById('fbDot').className = 'firebase-dot syncing';
      document.getElementById('fbStatus').textContent = "Lưu nháp (Offline)";
      showToast("Mất mạng: Đã lưu tạm vào máy!", "warning");
      return; 
  }

  if (!firebaseConnected) return;
  
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      const sdk = window._fbSDK;
      const roomPath = `rooms/${DATA.trip.code}`;
      const publicPath = `public_trips/${DATA.trip.code}`;
      
      document.getElementById('fbDot').className = 'firebase-dot syncing';
      document.getElementById('fbStatus').textContent = "Đang lưu...";
      
      _ignoreNextSnapshot = true;

      // 1. Luôn cập nhật trong phòng riêng
      await sdk.set(sdk.ref(window._firebaseDb, roomPath), DATA);

      // 2. CẬP NHẬT REAL-TIME RA NGOÀI TRANG CHỦ (Nếu đang chia sẻ)
      if (DATA.trip && DATA.trip.isShared) {
          await sdk.set(sdk.ref(window._firebaseDb, publicPath), DATA);
      }

      document.getElementById('fbDot').className = 'firebase-dot connected';
      document.getElementById('fbStatus').textContent = "Online";
    } catch(e) {
      _ignoreNextSnapshot = false;
      document.getElementById('fbDot').className = 'firebase-dot connected';
      document.getElementById('fbStatus').textContent = "Online";
      showToast("Lỗi lưu: " + e.message, "error");
    }
  }, 300);
}

window.refreshCurrentTrip = refreshCurrentTrip = async () => {
  if (!DATA || !DATA.trip || !DATA.trip.code) {
    if (typeof renderAll === 'function') renderAll(true);
    return;
  }

  if (!navigator.onLine || !firebaseConnected || !window._firebaseDb || !window._fbSDK) {
    if (typeof renderAll === 'function') renderAll(true);
    showToast("Đã làm mới dữ liệu local", "info");
    return;
  }

  try {
    const sdk = window._fbSDK;
    const roomRef = sdk.ref(window._firebaseDb, `rooms/${DATA.trip.code}`);
    const snapshot = await sdk.get(roomRef);

    if (snapshot.exists()) {
      DATA = snapshot.val();
      save();
      verifyRole();
      renderAll(true);
      showToast("Đã tải dữ liệu mới nhất", "success");
    } else {
      renderAll(true);
      showToast("Không tìm thấy room trên máy chủ", "warning");
    }
  } catch (e) {
    renderAll(true);
    showToast("Làm mới thất bại", "error");
  }
};

// Giữ lại syncToFirebase để dùng khi tạo phòng mới
window.syncToFirebase = syncToFirebase = async () => {
  if (!isEditor) return;
  if (!firebaseConnected || !window._firebaseDb) return;
  try {
    document.getElementById('fbDot').className = 'firebase-dot syncing';
    document.getElementById('fbStatus').textContent = "Đang lưu...";
    _ignoreNextSnapshot = true;
    await window._fbSDK.set(window._fbSDK.ref(window._firebaseDb, `rooms/${DATA.trip.code}`), DATA);
    document.getElementById('fbDot').className = 'firebase-dot connected';
    document.getElementById('fbStatus').textContent = "Online";
  } catch(e) {
    _ignoreNextSnapshot = false;
    document.getElementById('fbDot').className = 'firebase-dot connected';
    document.getElementById('fbStatus').textContent = "Online";
  }
};

// Change Trip Code on Firebase
window.changeTripCode = changeTripCode = async () => {
    if (!isEditor) return;
    const newCode = document.getElementById('settingTripCode').value.trim();
    const oldCode = DATA.trip.code;

    if (!newCode) return showToast("Mã Room ID không được để trống", "error");
    if (newCode === oldCode) return showToast("Mã này đang được sử dụng", "info");

    if (!firebaseConnected || !window._firebaseDb) {
        return showToast("Cần kết nối mạng để kiểm tra và đổi Room ID", "error");
    }

    const sdk = window._fbSDK;
    const newRoomRef = sdk.ref(window._firebaseDb, `rooms/${newCode}`);

    try {
        document.getElementById('fbDot').className = 'firebase-dot syncing';

        if (!confirm(`CẢNH BÁO:\nBạn có chắc muốn đổi Room ID từ "${oldCode}" sang "${newCode}" không?\n\nCác thành viên khác sẽ bị văng ra và phải nhập lại mã mới này để tiếp tục xem.`)) {
            document.getElementById('fbDot').className = 'firebase-dot connected';
            return;
        }

        document.getElementById('fbStatus').textContent = "Đang chuyển dữ liệu...";

        const newData = JSON.parse(JSON.stringify(DATA));
        newData.trip.code = newCode;

        // 1. Dùng Transaction để "xí chỗ" mã mới 1 cách atomic (an toàn, chống trùng
        // kể cả khi người khác cũng đang thử đặt mã này cùng lúc)
        const txResult = await sdk.runTransaction(newRoomRef, (currentData) => {
            if (currentData !== null) {
                return; // Mã mới đã có người dùng -> hủy transaction
            }
            return newData;
        });

        if (!txResult.committed) {
            document.getElementById('fbDot').className = 'firebase-dot connected';
            return showToast("Mã Room ID này đã tồn tại! Vui lòng chọn mã khác.", "error");
        }

        // 2. Xóa nhà cũ đi
        const oldRoomRef = sdk.ref(window._firebaseDb, `rooms/${oldCode}`);
        await sdk.set(oldRoomRef, null);

        // 3. SỬA LỖI: Quét trực tiếp trên Firebase xem có đang public không, thay vì tin vào biến local
        const oldPublicRef = sdk.ref(window._firebaseDb, `public_trips/${oldCode}`);
        const publicSnap = await sdk.get(oldPublicRef);
        
        if (publicSnap.exists()) {
             // Nếu có public, thì bứng nó sang mã mới luôn
             newData.trip.isShared = true; 
             await sdk.set(sdk.ref(window._firebaseDb, `public_trips/${newCode}`), newData);
             await sdk.set(oldPublicRef, null);
        }

        // Cập nhật dữ liệu trên máy tính
        DATA.trip.code = newCode;
        if (publicSnap.exists()) DATA.trip.isShared = true;
        save();
        updateUrlTripCode(newCode); // Cập nhật lại URL để link chia sẻ luôn trỏ đúng mã mới
        window.cancelAllSettings();

        stopRealtimeListener();
        startRealtimeListener();

        renderAll();
        showToast("Đã đổi Room ID thành công!", "success");
        document.getElementById('fbDot').className = 'firebase-dot connected';
        document.getElementById('fbStatus').textContent = "Online";

    } catch (e) {
        showToast("Lỗi khi đổi ID: " + e.message, "error");
        document.getElementById('fbDot').className = 'firebase-dot connected';
        document.getElementById('fbStatus').textContent = "Online";
    }
};

// ===== CRUD OPERATIONS =====
window.resetEditDayForm = resetEditDayForm = () => {
    const dateInput = document.getElementById('editDayDate');
    const titleInput = document.getElementById('editDayTitle');
    const idxInput = document.getElementById('editDayIdx');

    if (dateInput) {
        dateInput.value = '';
        if (dateInput.hasAttribute('data-date')) dateInput.setAttribute('data-date', '');
    }
    if (titleInput) titleInput.value = '';
    if (idxInput) idxInput.value = '';
};

window.addDay = addDay = () => {
    const dateInput = document.getElementById('newDayDate').value;
    const titleInput = document.getElementById('dayTitle');
    const titleValue = titleInput ? titleInput.value : '';

    if (!dateInput) return showToast("Vui lòng chọn ngày", "error");

    if (!DATA.days) DATA.days = [];
    
    const parts = dateInput.split('-');
    const dayMonth = `${parts[2]}/${parts[1]}`;
    const fullDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const isDuplicate = DATA.days.some(day => day.date === dayMonth || day.date === fullDate);
    if (isDuplicate) return showToast("⚠️ Ngày này đã tồn tại!", "error"); 

    DATA.days.push({ 
        date: dayMonth, 
        title: titleValue, 
        activities: [] 
    });

    save();
    autoSync();
    renderAll();
    closeModal('dayModal');
    showToast("Đã thêm ngày " + fullDate, "success");

    // Gọi hàm dọn dẹp vừa thêm ở trên
    window.resetDayForm();
};

// THÊM HÀM NÀY ĐỂ NÚT THÊM NGÀY HOẠT ĐỘNG
window.resetDayForm = resetDayForm = () => {
    const dateInput = document.getElementById('newDayDate');
    const titleInput = document.getElementById('dayTitle');
    if (dateInput) {
        dateInput.value = '';
        dateInput.setAttribute('data-date', ''); // Xóa chữ "Chọn ngày" cũ
    }
    if (titleInput) titleInput.value = '';
};

// HÀM MỞ BẢNG SỬA NGÀY
window.openEditDay = openEditDay = (di) => {
    const day = DATA.days[di];
    
    // Nạp Index và Tiêu đề
    if(document.getElementById('editDayIdx')) document.getElementById('editDayIdx').value = di;
    if(document.getElementById('editDayTitle')) document.getElementById('editDayTitle').value = day.title || "";

    // Nạp Ngày (Chỉ đổi định dạng, không cần lo giấu placeholder nữa)
    const dateInput = document.getElementById('editDayDate'); 
    if (dateInput) {
        if (day.date && day.date.includes('/')) {
            const parts = day.date.split('/');
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts.length === 3 ? parts[2] : new Date().getFullYear();
            dateInput.value = `${y}-${m}-${d}`; 
            
            // --- THÊM DÒNG NÀY ĐỂ FIX LỖI IOS ---
            dateInput.setAttribute('data-date', day.date); 
        } else {
            dateInput.value = "";
            dateInput.setAttribute('data-date', "");
        }
    }

    openModal('editDayModal');
};

// HÀM LƯU BẢNG SỬA NGÀY
window.saveEditDay = saveEditDay = () => {
    const diInput = document.getElementById('editDayIdx').value;
    if (diInput === '') return;
    const di = parseInt(diInput, 10);

    const title = document.getElementById('editDayTitle').value.trim();
    const dateInput = document.getElementById('editDayDate').value; 

    // Mặc định giữ nguyên ngày cũ nếu người dùng không chọn ngày mới
    let dateToSave = DATA.days[di].date; 
    let isDuplicate = false;

    // Nếu người dùng có chọn ngày mới
    if (dateInput && dateInput.includes('-')) {
        const parts = dateInput.split('-');
        const dayMonth = `${parts[2]}/${parts[1]}`; // Format DD/MM (Giống hệt hàm addDay của bạn)
        const fullDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // Format DD/MM/YYYY

        dateToSave = dayMonth; // Chốt lưu định dạng DD/MM cho đồng bộ data

        // ==================================================
        // CHỐT CHẶN: Quét trùng lặp (trừ chính nó ra)
        // ==================================================
        isDuplicate = DATA.days.some((day, index) => {
            // Check cả 2 trường hợp lỡ data cũ lưu full date
            return index !== di && (day.date === dayMonth || day.date === fullDate);
        });
    }

    if (isDuplicate) {
        return showToast("⚠️ Ngày này đã tồn tại trong lịch trình!", "error");
    }

    // Vượt qua chốt chặn thì tiến hành cập nhật
    DATA.days[di].title = title;
    DATA.days[di].date = dateToSave;

    // Lưu và đồng bộ
    save(); 
    if (typeof autoSync === 'function') autoSync(); 
    if (typeof renderAll === 'function') renderAll();
    
    closeModal('editDayModal');
    showToast("Đã cập nhật ngày!", "success");

    // Máy hút bụi dọn form
    if (typeof resetEditDayForm === 'function') resetEditDayForm();
};

window.deleteDay = deleteDay = async (di) => { // Thêm async
  if (!isEditor) return;
  const day = DATA.days[di];
  const dayName = day.title || `Ngày ${di + 1}`;
  
  const ok = await window.niceConfirm("Cảnh báo Xóa Ngày", `Xóa "${dayName}"? TOÀN BỘ hoạt động và CHI TIÊU đi kèm cũng sẽ bị xóa vĩnh viễn!`, "danger");
  if (!ok) return;

  if (day.activities && day.activities.length > 0 && DATA.payments && DATA.payments.length > 0) {
      const actIds = day.activities.map(a => a.id);
      
      for (let i = DATA.payments.length - 1; i >= 0; i--) {
          const p = DATA.payments[i];
          if (p && p.linkedActId && actIds.includes(p.linkedActId)) {
              DATA.payments.splice(i, 1);
          }
      }
  }

  DATA.days.splice(di, 1);

  // 4. BỘ NÃO HOẠT ĐỘNG: Tính lại quỹ và vẽ lại tab Quỹ
  renderCollection(); 

  // 5. LƯU VÀ ĐỒNG BỘ số liệu chuẩn
  save();          
  autoSync();      
  
  // 6. ✅ TỐI ƯU HIỆU NĂNG: Chỉ vẽ lại các phần còn lại, KHÔNG DÙNG renderAll() nữa
  try {
      renderItinerary(); // Vẽ lại lịch trình (vì ngày đã biến mất)
      renderPayments();  // Vẽ lại danh sách chi tiêu và bong bóng Heatmap
  } catch(e) {
      console.warn("Lỗi render các component phụ:", e);
  }

  showToast(`Đã xóa ${dayName} và dọn sạch chi tiêu đi kèm!`, "info");
};

window.exportItineraryToImage = exportItineraryToImage = async () => {
    const listEl = document.getElementById('itineraryList');
    
    // Kiểm tra xem có lịch trình chưa
    if (!listEl || listEl.innerHTML.includes('Chưa có lịch trình nào')) {
        return showToast("Chưa có lịch trình để chụp!", "error");
    }

    showToast("📸 Đang tạo ảnh sắc nét, vui lòng đợi...", "info");

    // 1. CHUẨN BỊ BỐ CỤC (Tạo dáng trước khi chụp)
    const allDays = listEl.querySelectorAll('.day-section');
    const collapsedDays = [];
    
    // Mở bung tất cả các ngày đang bị thu gọn ra
    allDays.forEach((day, index) => {
        if (day.classList.contains('collapsed')) {
            collapsedDays.push(index); // Ghi nhớ thằng nào đang đóng để lát trả lại
            day.classList.remove('collapsed');
        }
    });

    // Ép tàng hình các nút Sửa/Xóa
    listEl.classList.add('hide-editor-for-capture');

    try {
        // Đợi 0.4s để các hiệu ứng mở bung chạy xong thì ảnh mới không bị mờ
        await new Promise(r => setTimeout(r, 400));

        // 2. BẤM MÁY CHỤP
        const canvas = await html2canvas(listEl, {
            scale: 2, // Tăng độ phân giải gấp đôi cho nét căng
            backgroundColor: '#0a0a0a', // Ép nền đen đồng bộ với App
            useCORS: true, // Cho phép tải các icon/ảnh từ link ngoài
            logging: false
        });

        // 3. TẠO FILE VÀ TẢI VỀ
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        document.getElementById('capturedImagePreview').src = imgData;
        openModal('imageResultModal');
        showToast("✅ Đã chụp xong!", "success");

    } catch (error) {
        console.error("Lỗi tạo ảnh:", error);
        showToast("Có lỗi khi tạo ảnh!", "error");
    } finally {
        // 4. DỌN DẸP CHIẾN TRƯỜNG (Trả UI về như cũ)
        listEl.classList.remove('hide-editor-for-capture');
        collapsedDays.forEach(index => {
            if (allDays[index]) allDays[index].classList.add('collapsed');
        });
    }
};

window.exportPaymentToImage = exportPaymentToImage = async () => {
    const listEl = document.getElementById('paymentList');
    if (!listEl || listEl.innerHTML.includes('Chưa có chi tiêu nào')) {
        return showToast("Chưa có chi tiêu để chụp báo cáo!", "error");
    }

    showToast("📸 Đang tạo ảnh báo cáo sắc nét, vui lòng đợi...", "info");

    // 1. CHUẨN BỊ BỐ CỤC: Ẩn các nút Sửa/Xóa và ẩn luôn cái nút Chụp Ảnh
    listEl.classList.add('hide-editor-for-capture');
    const captureBtn = document.getElementById('btnCapturePayment');
    if (captureBtn) captureBtn.style.display = 'none';

    try {
        // Đợi 0.3s để UI ổn định, giấu nút xong xuôi
        await new Promise(r => setTimeout(r, 300));

        // 2. BẤM MÁY CHỤP
        const canvas = await html2canvas(listEl, {
            scale: 2, // Tăng độ phân giải gấp đôi cho nét căng
            backgroundColor: '#0a0a0a', // Ép nền đen chuẩn App
            useCORS: true, // Cho phép tải các icon
            logging: false
        });

        // 3. TẠO FILE VÀ TẢI VỀ
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        document.getElementById('capturedImagePreview').src = imgData;
        openModal('imageResultModal');
        showToast("✅ Đã chụp xong!", "success");

    } catch (error) {
        console.error("Lỗi tạo ảnh:", error);
        showToast("Có lỗi khi tạo ảnh!", "error");
    } finally {
        // 4. DỌN DẸP CHIẾN TRƯỜNG: Trả lại các nút như cũ
        listEl.classList.remove('hide-editor-for-capture');
        if (captureBtn) captureBtn.style.display = 'inline-block';
    }
};

window.openActModal = openActModal = (dayIdx) => {
    const daySelect = document.getElementById('actDayIdx');
    
    // 1. Tự động lấy tất cả các ngày đang có và nặn thành các lựa chọn (Options)
    if (daySelect && DATA.days) {
        daySelect.innerHTML = DATA.days.map((day, index) => {
            const title = day.title || `Ngày ${index + 1}`;
            return `<option value="${index}">${esc(title)} (${esc(day.date)})</option>`;
        }).join('');
    }

    // 2. Tự động chọn ngày (Nếu bấm từ nút + của 1 ngày cụ thể thì chọn ngày đó, nếu bấm FAB thì chọn ngày cuối)
    if (daySelect) {
        if (dayIdx !== undefined && dayIdx >= 0) {
            daySelect.value = dayIdx;
        } else if (DATA.days && DATA.days.length > 0) {
            daySelect.value = DATA.days.length - 1;
        }
    }

    // 3. Reset các ô còn lại
    document.getElementById('actHour').value = '08';
    document.getElementById('actMinute').value = '00';
    document.getElementById('actName').value = '';
    
    // An toàn kiểm tra xem có ô location không (vì mình mới thêm)
    if (document.getElementById('actLocation')) {
        document.getElementById('actLocation').value = '';
    }
    
    document.getElementById('actNote').value = '';
    const cbExpense = document.getElementById('actHasExpense');
    if (cbExpense) cbExpense.checked = false;
    
    openModal('actModal');
};

window.addActivity = addActivity = () => {
    if (!isEditor) return;
    const di = parseInt(document.getElementById('actDayIdx').value);
    const h = document.getElementById('actHour').value;
    const m = document.getElementById('actMinute').value;
    const name = document.getElementById('actName').value.trim();
    const location = document.getElementById('actLocation').value.trim(); 
    const note = document.getElementById('actNote').value.trim();

    if (!name) return showToast("Điền tên hoạt động", "error");

    // 🔑 BẢN VÁ: Nhận diện xem trước đó bác có "đặt cọc" mã ID nào chưa (do đã kê khai chi tiêu).
    // Nếu chưa có thì tự tạo mới một mã bình thường.
    const actId = window.finalActId || ('act_' + Date.now() + '_' + Math.floor(Math.random()*1000));

    if (!DATA.days[di].activities) DATA.days[di].activities = [];
    DATA.days[di].activities.push({ id: actId, time: `${h}:${m}`, name, location, note }); 
    
    // Sắp xếp lại giờ giấc
    DATA.days[di].activities.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    
    save(); autoSync(); 
    renderItinerary();
    try { renderPayments(); } catch(e) {}
    if (typeof window.renderTodayView === 'function') window.renderTodayView();
    window.isSavingActivityFlow = isSavingActivityFlow = true;
    closeModal('actModal');
    window.isSavingActivityFlow = isSavingActivityFlow = false;
    
    // 🧹 Dọn dẹp "Bản nháp" sau khi lưu thành công để không bị dính vào lần Thêm sau
    window.finalActId = finalActId = null;
    window.draftActivity = draftActivity = null;
    window.pendingReturnToAct = pendingReturnToAct = null;
    
    // Reset màu nút kê khai tiền về như cũ
    const btn = document.getElementById('btnActExpenseFlow');
    if (btn) {
        btn.style.background = 'var(--surface2)';
        btn.style.color = 'var(--text2)';
        btn.innerHTML = '<span style="font-size: 1.1rem;">💰</span> Kê khai chi tiêu cho hoạt động này';
    }

    showToast("Đã lưu hoạt động thành công!", "success");
};

window.deleteActivity = deleteActivity = async (di, ai) => { // Thêm async
    if (!isEditor) return;
    const act = DATA.days[di].activities[ai];
    const actName = act.name || "hoạt động này";
    const pIndices = window.getLinkedPaymentIndices(act.id);
    
    let confirmMsg = `Bạn có chắc muốn xóa "${actName}"?`;
    if (pIndices.length > 0) confirmMsg = `Xóa "${actName}"? Lưu ý: CẢ ${pIndices.length} KHOẢN CHI TIÊU đi kèm cũng sẽ bị xóa sạch!`;
    
    const ok = await window.niceConfirm("Xóa hoạt động?", confirmMsg, "danger");
    if (!ok) return;

    // 2. TIÊU DIỆT TẬN GỐC (Nếu có chi tiêu liên kết)
    if (pIndices.length > 0) {
        pIndices.sort((a, b) => b - a);
        pIndices.forEach(idx => {
            DATA.payments.splice(idx, 1);
        });
    }

    // 3. Xóa hoạt động
    DATA.days[di].activities.splice(ai, 1); 
    
    // ✅ 4. THỨ TỰ VÀNG: Ép bộ não tính toán lại Quỹ trước
    renderCollection();

    // ✅ 5. LƯU VÀ ĐỒNG BỘ: Firebase nhận số liệu chuẩn
    save(); 
    autoSync(); 
    
    // ✅ 6. TỐI ƯU HIỆU NĂNG: Chỉ vẽ lại Lịch trình và Chi tiêu (Bỏ renderAll)
    try {
        renderItinerary();
        renderPayments();
    } catch(e) {
        console.warn("Lỗi render các component phụ:", e);
    }
    
    showToast(`Đã xóa hoạt động và ${pIndices.length} khoản chi liên quan`, "info");
};

window.openMapModal = openMapModal = (locationStr) => {
    if (!locationStr) return;

    // 1. Nếu là Link trực tiếp (bắt đầu bằng http) -> Google chặn nhúng iframe, bắt buộc mở tab ngoài
    if (locationStr.startsWith('http')) {
        window.open(locationStr, '_blank');
        return;
    }

    // 2. Nếu là Text (Ví dụ: "Chợ Bến Thành") -> Chơi chiêu nhúng In-App Map
    document.getElementById('mapModalTitle').textContent = locationStr;
    
    // ✅ ĐÃ SỬA: Dùng đúng URL nhúng chuẩn của Google Maps và thêm dấu $
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationStr)}&hl=vi&z=17&output=embed`;
    
    document.getElementById('mapIframe').src = embedUrl;
    openModal('mapModal');
};

window.openEditActivity = openEditActivity = (di, ai) => {
    try {
        if (!isEditor) return;
        const act = DATA.days[di].activities[ai];
        if (!act.id) act.id = 'act_' + Date.now(); // Cấp ID cho data cũ

        document.getElementById('editActDayIdx').value = di;
        document.getElementById('editActIdx').value = ai; // Đảm bảo ID này khớp với HTML

        const timeParts = (act.time || "08:00").split(':');
        document.getElementById('editActHour').value = timeParts[0].padStart(2, '0');
        document.getElementById('editActMinute').value = timeParts[1].padStart(2, '0');

        document.getElementById('editActName').value = act.name || '';
        document.getElementById('editActLocation').value = act.location || '';
        document.getElementById('editActNote').value = act.note || '';

        const expContainer = document.getElementById('editActExpenseContainer');
        if (expContainer) {
            // LẤY TẤT CẢ các chi tiêu liên kết
            const pIndices = window.getLinkedPaymentIndices(act.id);
            
            if (pIndices.length > 0) {
                let totalAmt = 0;
                let pItemsHtml = '';
                
                // Duyệt qua từng khoản chi để tạo UI list
                pIndices.forEach(pIdx => {
                    const p = DATA.payments[pIdx];
                    totalAmt += p.amount || 0;
                    pItemsHtml += `
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.05);">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 0.72rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(p.desc)}</div>
                                <div style="color: var(--orange); font-weight: 700; font-size: 0.75rem;">💰 ${formatVND(p.amount)}</div>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button class="btn" style="width:30px; height:30px; padding:0; background:var(--surface3); color:var(--text2); display:flex; align-items:center; justify-content:center; border-radius:6px;" 
                                        onclick="window.pendingReturnToAct = pendingReturnToAct = { di: ${di}, ai: ${ai}, mode: 'edit' }; closeModal('editActModal'); setTimeout(()=>openEditPayment(${pIdx}), 300);">✎</button>
                                <button class="btn" style="width:30px; height:30px; padding:0; background:var(--red-bg); color:var(--red); display:flex; align-items:center; justify-content:center; border-radius:6px;" 
                                        onclick="unlinkPaymentFromAct(${pIdx}, ${di}, ${ai})">✕</button>
                            </div>
                        </div>
                    `;
                });

                expContainer.innerHTML = `
                    <div style="background: rgba(251,146,60,0.05); border: 1px dashed rgba(251,146,60,0.3); padding: 12px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="font-size: 0.65rem; color: var(--text3); margin-bottom: 10px; display: flex; justify-content: space-between; font-weight: bold; text-transform: uppercase;">
                            <span>${pIndices.length} khoản chi liên kết:</span>
                            <span style="color: var(--orange);">Tổng: ${formatVND(totalAmt)}</span>
                        </div>
                        ${pItemsHtml}
                        <button type="button" class="btn" style="background: var(--surface); color: var(--text2); border: 1px dashed rgba(255,255,255,0.1); font-size: 0.75rem; width: 100%; margin-top: 10px; display: flex; align-items: center; justify-content: flex-start; padding-left: 15px; gap: 8px;" onclick="saveEditActivity(true)">
                            <span style="font-size: 1rem;">➕</span> Thêm khoản chi mới
                        </button>
                    </div>`;
            } else {
                // UI khi chưa có chi tiêu nào
                expContainer.innerHTML = `
                    <button type="button" class="btn" style="background: var(--surface2); color: var(--text2); border: 1px dashed rgba(255,255,255,0.1); font-size: 0.75rem; width: 100%; margin-top: 10px; display: flex; align-items: center; justify-content: flex-start; padding-left: 15px; gap: 8px;" onclick="saveEditActivity(true)">
                        <span style="font-size: 1.1rem;">💰</span> Thêm khoản chi tiêu cho HĐ này
                    </button>`;
            }
        }
        openModal('editActModal');
    } catch (err) { console.error("Lỗi openEdit:", err); }
};

window.unlinkPaymentFromAct = unlinkPaymentFromAct = (pIdx, di, ai) => {
    if (!confirm("Bạn muốn gỡ khoản chi này khỏi hoạt động?\n(Nó sẽ bị chuyển về tab Chi tiêu dưới dạng khoản PHÁT SINH)")) return;
    
    // Cắt đứt liên kết
    DATA.payments[pIdx].linkedActId = ""; 
    
    // Lưu và đồng bộ
    save(); 
    autoSync();
    
    // Quét lại toàn bộ giao diện (Cập nhật Bóng năng lượng)
    try { renderItinerary(); renderPayments(); } catch(e){}
    
    // Cập nhật lại giao diện Modal Sửa hoạt động ngay lập tức
    openEditActivity(di, ai);
    
    showToast("Đã gỡ liên kết chi tiêu", "success");
};

window.saveEditActivity = saveEditActivity = (forceExpense = false) => {
    const di = parseInt(document.getElementById('editActDayIdx').value);
    const ai = parseInt(document.getElementById('editActIdx').value);
    const name = document.getElementById('editActName').value.trim();
    const location = document.getElementById('editActLocation').value.trim(); 

    if (!name) return showToast("Điền tên hoạt động", "error");

    const act = DATA.days[di].activities[ai];
    act.time = `${document.getElementById('editActHour').value}:${document.getElementById('editActMinute').value}`;
    act.name = name;
    act.location = location; 
    act.note = document.getElementById('editActNote').value.trim();

    const cb = document.getElementById('editActHasExpense');
    const wantExpense = forceExpense === true || (cb ? cb.checked : false);

    DATA.days[di].activities.sort((a, b) => (a.time||"").localeCompare(b.time||""));
    
    // Lấy lại Index mới lỡ người dùng có đổi giờ làm nó nhảy vị trí
    const newAi = DATA.days[di].activities.findIndex(a => a.id === act.id);
    
    save(); autoSync(); renderItinerary();

    if (wantExpense) {
        // 1. Đóng đàng hoàng để reset UI nút bấm
        closeModal('editActModal');
        
        // 2. Xuất vé khứ hồi
        window.pendingReturnToAct = pendingReturnToAct = { di, ai: newAi, mode: 'edit' }; // Đảm bảo có mode: 'edit'
        
        // 3. Mở bảng chi tiêu
        setTimeout(() => openAddPaymentModal(name, act.id), 300);
    } else {
        closeModal('editActModal');
        showToast("Đã cập nhật", "success");
    }
};

window.toggleEstimateMode = toggleEstimateMode = (prefix) => {
    const isEstimate = document.getElementById(`${prefix}IsEstimate`).checked;
    const dynamicFields = document.getElementById(`${prefix}DynamicFields`);
    const labelEl = document.getElementById(`${prefix}EstimateLabel`);

    if (isEstimate) {
        // NẾU ĐƯỢC CHỌN (DỰ TRÙ) -> Ẩn input, nút sáng lên màu vàng
        dynamicFields.style.display = 'none'; 
        labelEl.style.background = 'var(--accent-glow)';
        labelEl.style.borderColor = 'var(--accent)';
        labelEl.style.color = 'var(--accent)';
        labelEl.innerHTML = '✅ Đang là khoản dự trù';
    } else {
        // NẾU BỎ CHỌN -> Hiện input, nút chìm xuống màu xám
        dynamicFields.style.display = 'block'; 
        labelEl.style.background = 'var(--surface2)';
        labelEl.style.borderColor = 'rgba(255,255,255,0.06)';
        labelEl.style.color = 'var(--text3)';
        labelEl.innerHTML = '⬜ Đánh dấu là khoản dự trù';
    }
};

// ============================================
// 💸 LOGIC ĐỒNG THANH TOÁN (MULTI-PAYER)
// ============================================
window.isMultiPayerMode = isMultiPayerMode = false;

window.toggleMultiPayerMode = toggleMultiPayerMode = () => {
    window.isMultiPayerMode = isMultiPayerMode = !window.isMultiPayerMode;
    const singleArea = document.getElementById('pmSinglePayerArea');
    const multiArea = document.getElementById('pmMultiPayerArea');
    const btn = document.getElementById('btnToggleMulti');
    const amountInput = document.getElementById('pmAmount');

    // 🧹 CHỐT CHẶN: Reset tiền về rỗng và dọn sạch các hàng cũ mỗi khi chuyển đổi
    amountInput.value = ''; 
    document.getElementById('payerRowsContainer').innerHTML = '';

    if (window.isMultiPayerMode) {
        singleArea.style.display = 'none';
        multiArea.style.display = 'block';
        btn.innerHTML = '<span style="color:var(--red)">✕ Hủy góp chung</span>';
        amountInput.readOnly = true; 
        amountInput.style.opacity = '0.7';
        
        // Tự động đẻ ra 2 hàng mới sạch sẽ
        window.addPayerRow(); window.addPayerRow(); 
        window.updateMultiTotal(); // Ép tính lại tổng (sẽ ra 0)
    } else {
        singleArea.style.display = 'block';
        multiArea.style.display = 'none';
        btn.innerHTML = '+ Góp tiền chung';
        amountInput.readOnly = false;
        amountInput.style.opacity = '1';
    }
};

window.addPayerRow = addPayerRow = () => {
    const container = document.getElementById('payerRowsContainer');
    const row = document.createElement('div');
    row.className = 'payer-row';
    
    // 1. Thêm lựa chọn rỗng làm mặc định để bắt buộc người dùng phải chọn
    const memberOptions = `<option value="" disabled selected>Chọn người...</option>` + 
                          (DATA.members || []).map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');
    
    // 2. Ép chiều cao (44px) và bo góc (10px) đồng bộ cho TẤT CẢ các thành phần
    row.innerHTML = `
        <select class="form-input payer-name" style="min-height: 44px !important; height: 44px; padding: 0 10px !important; font-size: 0.8rem; border-radius: 10px;">${memberOptions}</select>
        
        <input type="number" class="form-input payer-amt" placeholder="Số tiền" oninput="window.updateMultiTotal()" style="min-height: 44px !important; height: 44px; padding: 0 10px !important; font-size: 0.85rem; border-radius: 10px; text-align: right;">
        
        <label class="chip-checkbox" style="height: 44px; margin: 0; flex-shrink: 0;">
            <input type="checkbox" class="payer-fund" onchange="window.updateMultiTotal()">
            <span class="chip-label fund" style="height: 100%; display: flex; align-items: center; justify-content: center; padding: 0 10px; font-size: 0.65rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">💰 Quỹ</span>
        </label>
        
        <button class="btn-remove-payer" style="width: 44px; height: 44px; border-radius: 10px; border: none; flex-shrink: 0;" onclick="this.parentElement.remove(); window.updateMultiTotal();">✕</button>
    `;
    container.appendChild(row);
};

window.updateMultiTotal = updateMultiTotal = () => {
    let total = 0;
    document.getElementById('payerRowsContainer').querySelectorAll('.payer-amt').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('pmAmount').value = total;
};

// --- HÀM LƯU CHI TIÊU DUY NHẤT VÀ HOÀN CHỈNH ---
window.savePayment = savePayment = () => {
    if (!isEditor) return;

    // 1. Chặn lưu nếu đang up ảnh
    if (window.isUploadingImage) {
        return showToast("⏳ Đang tải ảnh lên, vui lòng chờ 1-2 giây rồi bấm Thêm!", "warning");
    }

    const desc = document.getElementById('pmDesc').value.trim();
    const amount = parseFloat(document.getElementById('pmAmount').value) || 0;
    const isEstimate = document.getElementById('pmIsEstimate').checked;
    const categoryInput = document.getElementById('pmCategory');
    const category = (categoryInput && categoryInput.value) || 'other';

    if (!desc || amount <= 0) return showToast("Nhập mô tả và số tiền", "error");

    let payer = "", isPaid = false, fromFund = false, participants = [];
    let multiPayers = null; // Chứa dữ liệu của nhiều người trả

    // 2. Thu thập dữ liệu theo chế độ
    if (!isEstimate) {
        const chips = document.getElementById('pmParticipants').querySelectorAll('.participant-chip.selected');
        participants = Array.from(chips).map(c => c.getAttribute('data-name'));
        if (participants.length === 0) return showToast("Phải có ít nhất 1 người tham gia", "error");

        isPaid = document.getElementById('pmIsPaid').checked;

        if (window.isMultiPayerMode) {
            // Lấy danh sách những người góp chung
            multiPayers = [];
            let hasEmptyName = false; // Cờ theo dõi lỗi

            document.getElementById('payerRowsContainer').querySelectorAll('.payer-row').forEach(row => {
                const name = row.querySelector('.payer-name').value;
                const amt = parseFloat(row.querySelector('.payer-amt').value) || 0;
                const isFund = row.querySelector('.payer-fund').checked;
                
                if (!name && amt > 0) hasEmptyName = true; // Có tiền mà quên chọn tên
                if (amt > 0 && name) multiPayers.push({ name, amount: amt, fromFund: isFund });
            });
            
            if (hasEmptyName) return showToast("Vui lòng chọn tên người trả tiền!", "error");
            if (multiPayers.length === 0) return showToast("Chưa nhập số tiền góp", "error");
            payer = "Nhiều người trả";
            
        } else {
            payer = document.getElementById('pmPayer').value;
            fromFund = document.getElementById('pmFromFund').checked;
            
            // CHỐT CHẶN: Bắt lỗi nếu quên chọn người trả tiền
            if (!payer) return showToast("Vui lòng chọn người trả tiền!", "error");
        }
    }

    try {
        if (!DATA.payments) DATA.payments = [];
        const actId = document.getElementById('pmLinkedActId') ? document.getElementById('pmLinkedActId').value : "";
        const receiptUrl = document.getElementById('pmReceiptUrl').value;

        // 3. LƯU VÀO DATA
        const newPayment = { desc, amount, category, payer, isPaid, fromFund, participants, linkedActId: actId, isEstimate, receiptUrl };
        if (multiPayers) newPayment.multiPayers = multiPayers; // Nhúng cục góp chung vào dữ liệu
        
        DATA.payments.push(newPayment);

        // 4. RENDER LẠI (TÍNH TIỀN) VÀ ĐỒNG BỘ
        renderCollection();
        save();
        autoSync();
        try { renderPayments(); renderItinerary(); } catch(e) {}

        // 5. DỌN DẸP FORM
        document.getElementById('pmReceiptUrl').value = "";
        const preview = document.getElementById('pmPreviewContainer');
        if(preview) preview.style.display = 'none';
        closeModal('paymentModal');
        if (window.isMultiPayerMode) window.toggleMultiPayerMode(); // Reset giao diện về 1 người

        // 6. BẮN THÔNG BÁO ISLAND (Đã khôi phục thành công!)
        if (typeof window.updateIsland === 'function') {
            window.updateIsland('notif', `💸 Vừa tiêu ${formatVND(amount)}: ${desc}`, 'Có chi tiêu 💰');
        }

        window.playTing('success');
        if (typeof confetti === 'function') confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 }, colors: ['#4ade80', '#ffffff'], shapes: ['square'] });
        showToast("Đại gia tiêu tiền có khác, chốt đơn! ✅", "success");

    } catch (err) {
        console.error(err);
        showToast("Lỗi giao diện (Nhấn F5)", "error");
    }
};

// ============================================
// 💸 LOGIC ĐỒNG THANH TOÁN CHO BẢNG SỬA (EDIT)
// ============================================
window.isEditMultiPayerMode = isEditMultiPayerMode = false;

window.toggleEditMultiPayerMode = toggleEditMultiPayerMode = (forceState = null) => {
    // Nhận biết xem đây là người dùng tự bấm hay máy tự mở
    const isManualClick = forceState === null;
    window.isEditMultiPayerMode = isEditMultiPayerMode = forceState !== null ? forceState : !window.isEditMultiPayerMode;
    
    const singleArea = document.getElementById('editPmSinglePayerArea');
    const multiArea = document.getElementById('editPmMultiPayerArea');
    const btn = document.getElementById('btnEditToggleMulti');
    const amountInput = document.getElementById('editPmAmount');

    // 🧹 CHỐT CHẶN: Nếu NGƯỜI DÙNG TỰ BẤM chuyển đổi -> Dọn rác và reset tiền
    if (isManualClick) {
        amountInput.value = ''; 
        document.getElementById('editPayerRowsContainer').innerHTML = '';
    }

    if (window.isEditMultiPayerMode) {
        singleArea.style.display = 'none';
        multiArea.style.display = 'block';
        btn.innerHTML = '<span style="color:var(--red)">✕ Hủy góp chung</span>';
        amountInput.readOnly = true; 
        amountInput.style.opacity = '0.7';
        
        // Nếu người dùng tự bấm thì đẻ ra 2 hàng mới sạch sẽ
        if (isManualClick || document.getElementById('editPayerRowsContainer').children.length === 0) {
            window.addEditPayerRow(); window.addEditPayerRow(); 
            window.updateEditMultiTotal();
        }
    } else {
        singleArea.style.display = 'block';
        multiArea.style.display = 'none';
        btn.innerHTML = '+ Góp tiền chung';
        amountInput.readOnly = false;
        amountInput.style.opacity = '1';
    }
};

window.addEditPayerRow = addEditPayerRow = (name = "", amt = "", fromFund = false) => {
    const container = document.getElementById('editPayerRowsContainer');
    const row = document.createElement('div');
    row.className = 'payer-row';
    
    let memberOptions = `<option value="" disabled ${!name ? 'selected' : ''}>Chọn người...</option>`;
    (DATA.members || []).forEach(m => {
        memberOptions += `<option value="${esc(m.name)}" ${m.name === name ? 'selected' : ''}>${esc(m.name)}</option>`;
    });
    
    row.innerHTML = `
        <select class="form-input payer-name" style="min-height: 44px !important; height: 44px; padding: 0 10px !important; font-size: 0.8rem; border-radius: 10px;">${memberOptions}</select>
        <input type="number" class="form-input payer-amt" placeholder="Số tiền" value="${amt}" oninput="window.updateEditMultiTotal()" style="min-height: 44px !important; height: 44px; padding: 0 10px !important; font-size: 0.85rem; border-radius: 10px; text-align: right;">
        <label class="chip-checkbox" style="height: 44px; margin: 0; flex-shrink: 0;">
            <input type="checkbox" class="payer-fund" onchange="window.updateEditMultiTotal()" ${fromFund ? 'checked' : ''}>
            <span class="chip-label fund" style="height: 100%; display: flex; align-items: center; justify-content: center; padding: 0 10px; font-size: 0.65rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);">💰 Quỹ</span>
        </label>
        <button class="btn-remove-payer" style="width: 44px; height: 44px; border-radius: 10px; border: none; flex-shrink: 0;" onclick="this.parentElement.remove(); window.updateEditMultiTotal();">✕</button>
    `;
    container.appendChild(row);
};

window.updateEditMultiTotal = updateEditMultiTotal = () => {
    let total = 0;
    document.getElementById('editPayerRowsContainer').querySelectorAll('.payer-amt').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('editPmAmount').value = total;
};

window.deletePayment = deletePayment = async (i) => { // Thêm chữ 'async' ở đây nè bác
  const confirmed = await window.niceConfirm("Xóa chi tiêu?", "Khoản chi này sẽ biến mất vĩnh viễn khỏi ví của bạn.");
  if (!isEditor || !confirmed) return;
  
  // 1. Xóa phần tử khỏi mảng dữ liệu gốc
  DATA.payments.splice(i, 1);

  // 2. CẬP NHẬT GIAO DIỆN (Thứ tự rất quan trọng)
  
  // Tính toán lại Quỹ và HP thành viên (Single Source of Truth)
  renderCollection(); 
  
  // ✅ VÁ LỖI: Vẽ lại danh sách chi tiêu và bong bóng Heatmap
  renderPayments(); 
  
  // Cập nhật lại các chỉ số tiền nong trong lịch trình
  renderItinerary(); 

  // 3. LƯU VÀ ĐỒNG BỘ DỮ LIỆU ĐÃ CHUẨN
  save(); 
  autoSync(); 
  
  showToast("Đã xóa chi tiêu", "info");
};

window.removeEditPmReceipt = removeEditPmReceipt = () => {
    // 1. Xóa link trong ô input ẩn
    const urlInput = document.getElementById('editPmReceiptUrl');
    if (urlInput) urlInput.value = "";
    
    // 2. Xóa luôn đường dẫn ảnh để chống hiển thị lại ảnh cũ (Ghost image)
    const previewImg = document.getElementById('editPmReceiptPreview');
    if (previewImg) previewImg.src = "";
    
    // 3. Ẩn khung chứa ảnh đi
    const previewContainer = document.getElementById('editPmPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
    
    // 4. Ẩn chính cái nút Xóa này đi
    const btnRemove = document.getElementById('btnEditPmRemove');
    if (btnRemove) btnRemove.style.display = 'none';
};

window.openEditPayment = openEditPayment = (i) => {
  const p = DATA.payments[i];
  const members = DATA.members || [];
  document.getElementById('editPmIdx').value = i;
  document.getElementById('editPmDesc').value = p.desc;
  document.getElementById('editPmAmount').value = p.amount;
  selectCategory('editPm', p.category && EXPENSE_CATEGORIES[p.category] ? p.category : 'other');

  // Bơm dữ liệu hoạt động vào dropdown
  const actSelect = document.getElementById('editPmLinkedActId');
  let optionsHtml = '<option value="">Chưa có liên kết</option>';
  if (DATA.days && DATA.days.length > 0) {
      DATA.days.forEach((day, dIdx) => {
          if (day.activities && day.activities.length > 0) {
              optionsHtml += `<optgroup label="${esc(day.title || `Ngày ${dIdx+1}`)} (${esc(day.date)})" style="background:var(--surface2); color:var(--text); padding:5px;">`;
              day.activities.forEach(act => {
                  optionsHtml += `<option value="${act.id}" style="padding:8px;">${act.time} - ${esc(act.name)}</option>`;
              });
              optionsHtml += `</optgroup>`;
          }
      });
  }
  actSelect.innerHTML = optionsHtml;
  actSelect.value = p.linkedActId || ""; 

  // Trạng thái dự trù
  document.getElementById('editPmIsEstimate').checked = p.isEstimate || false;
  toggleEstimateMode('editPm');

  const isPaidInput = document.getElementById('editPmIsPaid');
  const fromFundInput = document.getElementById('editPmFromFund');
  isPaidInput.checked = p.isPaid || false;
  fromFundInput.checked = p.fromFund || false;
  
  const payerSelect = document.getElementById('editPmPayer');
  const partContainer = document.getElementById('editPmParticipants');

  if (members.length > 0) {
      payerSelect.innerHTML = `<option value="" disabled ${!p.payer || p.payer === "Nhiều người trả" ? 'selected' : ''}>Chọn người...</option>` + members.map(m => `<option value="${esc(m.name)}" ${m.name === p.payer ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
      payerSelect.disabled = false;
      
      const isOldData = !p.participants; 
      const selectedParts = p.participants || [];
      partContainer.innerHTML = members.map(m => {
          const isSelected = isOldData || selectedParts.includes(m.name);
          return `<div class="participant-chip ${isSelected ? 'selected' : ''}" onclick="this.classList.toggle('selected')" data-name="${esc(m.name)}">${esc(m.name)}</div>`;
      }).join('');

      isPaidInput.disabled = false;
      fromFundInput.disabled = false;
      isPaidInput.nextElementSibling.style.opacity = '1';
      fromFundInput.nextElementSibling.style.opacity = '1';
      isPaidInput.nextElementSibling.style.cursor = 'pointer';
      fromFundInput.nextElementSibling.style.cursor = 'pointer';

  } else {
      payerSelect.innerHTML = '<option value="">Chưa có thành viên</option>';
      payerSelect.disabled = true; 
      partContainer.innerHTML = '<div style="font-size:0.7rem; color:var(--text3)">Chưa có thành viên</div>';
      isPaidInput.disabled = true;
      fromFundInput.disabled = true;
      isPaidInput.checked = false;
      fromFundInput.checked = false;
      isPaidInput.nextElementSibling.style.opacity = '0.4';
      fromFundInput.nextElementSibling.style.opacity = '0.4';
      isPaidInput.nextElementSibling.style.cursor = 'not-allowed';
      fromFundInput.nextElementSibling.style.cursor = 'not-allowed';
  }

  // --- 💡 NẠP DỮ LIỆU ĐỒNG THANH TOÁN (MULTI-PAYER) VÀO GIAO DIỆN ---
  const rowsContainer = document.getElementById('editPayerRowsContainer');
  
  if (p.multiPayers && p.multiPayers.length > 0) {
      window.toggleEditMultiPayerMode(true); // Bật mode (hàm này sẽ lỡ tay tự tạo 2 dòng rỗng)
      
      rowsContainer.innerHTML = ''; // 🔑 Chốt chặn: Xóa sạch 2 dòng rỗng đó đi trước khi nạp data thật
      
      p.multiPayers.forEach(mp => {
          window.addEditPayerRow(mp.name, mp.amount, mp.fromFund);
      });

      window.updateEditMultiTotal(); // 🔧 SỬA LỖI: Tính lại tổng tiền từ data thật vừa nạp,
      // nếu không ô Số tiền sẽ bị kẹt ở giá trị 0 do lần tính tổng trước đó (lúc container còn rỗng)
  } else {
      window.toggleEditMultiPayerMode(false);
      rowsContainer.innerHTML = ''; // Dọn dẹp sạch sẽ nếu quay về chế độ 1 người trả
  }

  // Hiển thị ảnh Bill cũ nếu có
  const rUrl = p.receiptUrl || "";
  document.getElementById('editPmReceiptUrl').value = rUrl;
  if (rUrl) {
      document.getElementById('editPmReceiptPreview').src = rUrl;
      document.getElementById('editPmPreviewContainer').style.display = 'block';
  } else {
      document.getElementById('editPmPreviewContainer').style.display = 'none';
  }

  openModal('editPaymentModal');
};

window.saveEditPayment = saveEditPayment = () => {
    if (!isEditor) return;
    if (window.isUploadingImage) return showToast("⏳ Đang tải ảnh lên, vui lòng chờ 1-2 giây rồi bấm Lưu!", "warning");
    
    const i = parseInt(document.getElementById('editPmIdx').value, 10);
    const desc = document.getElementById('editPmDesc').value.trim();
    const amount = parseFloat(document.getElementById('editPmAmount').value) || 0;
    const isEstimate = document.getElementById('editPmIsEstimate').checked;
    const editPmReceiptUrl = document.getElementById('editPmReceiptUrl').value;
    const editCategoryInput = document.getElementById('editPmCategory');
    const category = (editCategoryInput && editCategoryInput.value) || 'other';

    if (!desc || amount <= 0) return showToast("Nhập mô tả và số tiền", "error");
    
    let payer = "", isPaid = false, fromFund = false, participants = [];
    let multiPayers = null;

    if (!isEstimate) {
        isPaid = document.getElementById('editPmIsPaid').checked;
        const chips = document.getElementById('editPmParticipants').querySelectorAll('.participant-chip.selected');
        participants = Array.from(chips).map(c => c.getAttribute('data-name'));
        if (participants.length === 0) return showToast("Phải có ít nhất 1 người tham gia", "error");

        if (window.isEditMultiPayerMode) {
            multiPayers = [];
            let hasEmptyName = false;
            document.getElementById('editPayerRowsContainer').querySelectorAll('.payer-row').forEach(row => {
                const name = row.querySelector('.payer-name').value;
                const amt = parseFloat(row.querySelector('.payer-amt').value) || 0;
                const isFund = row.querySelector('.payer-fund').checked;
                
                if (!name && amt > 0) hasEmptyName = true;
                if (amt > 0 && name) multiPayers.push({ name, amount: amt, fromFund: isFund });
            });
            
            if (hasEmptyName) return showToast("Vui lòng chọn tên người trả tiền!", "error");
            if (multiPayers.length === 0) return showToast("Chưa nhập số tiền góp", "error");
            payer = "Nhiều người trả";
        } else {
            payer = document.getElementById('editPmPayer').value;
            fromFund = document.getElementById('editPmFromFund').checked;
            if (!payer) return showToast("Vui lòng chọn người trả tiền!", "error");
        }
    }

    try {
        const keptLinkedActId = document.getElementById('editPmLinkedActId').value;
        const updatedPayment = {
            desc, amount, category, payer, isPaid, fromFund,
            participants, linkedActId: keptLinkedActId,
            isEstimate, receiptUrl: editPmReceiptUrl
        };
        
        if (multiPayers) updatedPayment.multiPayers = multiPayers;

        DATA.payments[i] = updatedPayment;

        renderCollection(); 
        save();      
        autoSync();  

        try { renderPayments(); renderItinerary(); } catch(e) {}
        
        closeModal('editPaymentModal');
        showToast("Đã cập nhật chi tiêu thành công", "success");

    } catch (err) {
        console.error(err);
        showToast("Lỗi cập nhật dữ liệu", "error");
    }
};

window.openDayExpenseModal = openDayExpenseModal = (targetTitle) => {
    document.getElementById('dayExpenseTitle').textContent = targetTitle;
    const listEl = document.getElementById('dayExpenseList');
    let total = 0;
    let html = '';

    const payments = DATA.payments || [];
    
    payments.forEach((p) => {
        if (!p.isPaid || p.isEstimate) return; // Bỏ qua đồ dự trù và chưa trả

        let isMatch = false;

        if (targetTitle === 'Phát sinh') {
            // NẾU BẤM VÀO QUẢ CẦU "PHÁT SINH": Lấy những khoản KHÔNG có linkedActId
            if (!p.linkedActId) {
                isMatch = true;
            } else {
                // Check thêm: Nhỡ khoản này có link nhưng hoạt động đã bị xóa thì cũng coi như Phát sinh
                let actExists = false;
                if (DATA.days) {
                    DATA.days.forEach(day => {
                        if (day.activities && day.activities.some(a => a.id === p.linkedActId)) actExists = true;
                    });
                }
                if (!actExists) isMatch = true;
            }
        } else {
            // NẾU BẤM VÀO NGÀY BÌNH THƯỜNG (D1, D2...)
            if (p.linkedActId && DATA.days) {
                DATA.days.forEach(day => {
                    if (day.date === targetTitle && day.activities && day.activities.some(a => a.id === p.linkedActId)) {
                        isMatch = true;
                    }
                });
            }
        }

        // Render HTML nếu khớp điều kiện
        if (isMatch) {
            total += p.amount || 0;
            const isFund = p.fromFund ? '<span style="color:var(--orange); font-size: 0.6rem; font-weight: 800;">(QUỸ)</span>' : '';
            const manualBadge = !p.linkedActId ? `<span style="margin-left:6px; font-size:0.55rem; padding:1px 5px; border-radius:4px; background:var(--accent-glow); color:var(--accent); border:1px dashed var(--accent);">✨ PHÁT SINH</span>` : '';
            
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface2); border-radius:var(--radius-sm); margin-bottom:8px; border-left: 3px solid ${p.fromFund ? 'var(--orange)' : 'var(--surface3)'}">
                    <div style="flex: 1; padding-right: 10px;">
                        <div style="font-size:.8rem; font-weight:bold; color:var(--text); word-break: break-word;">${esc(p.desc)} ${manualBadge}</div>
                        <div style="font-size:.65rem; color:var(--text3); margin-top:4px;">👤 ${esc(p.payer)} ${isFund}</div>
                    </div>
                    <div style="font-size:.85rem; font-weight:bold; color:var(--accent); flex-shrink: 0;">${formatVND(p.amount)}</div>
                </div>
            `;
        }
    });

    if (html === '') {
        html = `<div class="empty" style="padding: 20px 0;">Không có chi tiêu nào trong mục này! 🧘‍♂️</div>`;
    }

    listEl.innerHTML = html;
    document.getElementById('dayExpenseTotal').textContent = formatVND(total);
    
    openModal('dayExpenseModal');
};

window.openTotalExpenseModal = openTotalExpenseModal = () => {
    const listEl = document.getElementById('totalExpenseList');
    let total = 0;
    let html = '';

    const payments = DATA.payments || [];
    
    // 1. Chỉ lấy những khoản ĐÃ THANH TOÁN và KHÔNG PHẢI DỰ TRÙ
    const validPayments = payments.map((p, index) => {
        let timestamp = 0;
        if (p.linkedActId && DATA.days) {
            for (let day of DATA.days) {
                const act = (day.activities || []).find(a => a.id === p.linkedActId);
                if (act) {
                    const parts = day.date.split('/');
                    const dd = parseInt(parts[0]) || 0;
                    const mm = parseInt(parts[1]) || 0;
                    let yyyy = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear();
                    if (yyyy < 100) yyyy += 2000;
                    const tParts = (act.time || "00:00").split(':');
                    timestamp = new Date(yyyy, mm - 1, dd, parseInt(tParts[0]||0), parseInt(tParts[1]||0)).getTime();
                    break;
                }
            }
        }
        return { ...p, originalIndex: index, timestamp };
    }).filter(p => p.isPaid && !p.isEstimate);

    // 2. Sắp xếp lại (Phát sinh lên đầu, lịch trình theo thời gian)
    validPayments.sort((a, b) => {
        const aIsManual = !a.linkedActId;
        const bIsManual = !b.linkedActId;
        if (aIsManual && !bIsManual) return -1;
        if (!aIsManual && bIsManual) return 1;
        if (aIsManual && bIsManual) return b.originalIndex - a.originalIndex;
        return a.timestamp - b.timestamp;
    });

    // 3. Đổ dữ liệu ra HTML
    validPayments.forEach((p) => {
        total += p.amount || 0;
        const isFund = p.fromFund ? '<span style="color:var(--orange); font-size: 0.6rem; font-weight: 800;">(QUỸ)</span>' : '';
        
        let dateDisplay = `<span style="color:var(--text3); font-size: 0.65rem;"> (Phát sinh)</span>`;
        if (p.linkedActId && DATA.days) {
            DATA.days.forEach(day => {
                if (day.activities && day.activities.some(a => a.id === p.linkedActId)) {
                    dateDisplay = `<span style="color:var(--text3); font-size: 0.65rem;"> (${day.date})</span>`;
                }
            });
        }

        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface2); border-radius:var(--radius-sm); margin-bottom:8px; border-left: 3px solid ${p.fromFund ? 'var(--orange)' : 'var(--surface3)'}">
                <div style="flex: 1; padding-right: 10px;">
                    <div style="font-size:.8rem; font-weight:bold; color:var(--text); word-break: break-word;">${esc(p.desc)}${dateDisplay}</div>
                    <div style="font-size:.65rem; color:var(--text3); margin-top:4px;">👤 ${esc(p.payer)} ${isFund}</div>
                </div>
                <div style="font-size:.85rem; font-weight:bold; color:var(--accent); flex-shrink: 0;">${formatVND(p.amount)}</div>
            </div>
        `;
    });

    if (html === '') {
        html = `<div class="empty" style="padding: 20px 0;">Chưa có khoản chi tiêu nào! 🧘‍♂️</div>`;
    }

    listEl.innerHTML = html;
    document.getElementById('totalExpenseModalSum').textContent = formatVND(total);
    
    openModal('totalExpenseModal');
};

// ===== MEMBERS =====
window.toggleAllParticipants = toggleAllParticipants = (containerId) => {
    const container = document.getElementById(containerId);
    const chips = container.querySelectorAll('.participant-chip');
    const allSelected = Array.from(chips).every(c => c.classList.contains('selected'));
    chips.forEach(c => {
        if (allSelected) c.classList.remove('selected');
        else c.classList.add('selected');
    });
};

window.addMember = addMember = () => {
    if (!isEditor) return;
    const name = document.getElementById('memName').value.trim();
    const paid = parseFloat(document.getElementById('memPaid').value) || 0;
    const avatarSeed = document.getElementById('newMemAvatarSeed').value; 

    if (!name) return showToast("Điền tên thành viên", "error");
    
    if (!DATA.members) DATA.members = [];

    // 1. KIỂM TRA TRÙNG TÊN (Chặn lỗi phân thân)
    const isDuplicate = DATA.members.some(m => m.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
        return showToast(`⚠️ Tên "${name}" đã có trong đoàn rồi bác ơi!`, "error");
    }
    
    // 2. THÊM VÀO DỮ LIỆU GỐC (Single Source of Truth)
    const newMem = { name, payments: paid > 0 ? [paid] : [] };
    if (avatarSeed) newMem.avatarSeed = avatarSeed; 
    DATA.members.push(newMem); 

    // 3. THỨ TỰ VÀNG: RENDER -> SAVE -> SYNC
    renderCollection(); // Quét lại toàn bộ và ghi đè quỹ chuẩn vào RAM
    save();             // Lưu số chuẩn vào máy
    autoSync();         // Bơm số chuẩn lên Firebase
    
    // 4. DỌN DẸP GIAO DIỆN
    closeModal('memberModal');
    
    // Bonus: Xóa trắng form để lần sau mở lên không bị dính số cũ
    document.getElementById('memName').value = "";
    document.getElementById('memPaid').value = "";
    
    showToast("Đã thêm thành viên thành công!", "success");
};

window.enableEditMemName = enableEditMemName = () => {
    const nameInput = document.getElementById('editMemName');
    nameInput.disabled = false;
    nameInput.style.opacity = '1';
    nameInput.style.background = 'var(--surface2)'; // Đổi màu nền cho nó sáng lên
    nameInput.focus(); // Đặt trỏ chuột vào luôn cho tiện
};

window.openEditMember = openEditMember = (i) => {
    if (!isEditor) return;
    const m = DATA.members[i];
    
    const payments = m.payments || (m.paid ? [m.paid] : []);
    const totalContributed = payments.reduce((s, v) => s + v, 0);
    
    // --- THUẬT TOÁN ĐẾM SỐ LẦN NẠP/RÚT ---
    let depositCount = 0;
    let withdrawCount = 0;
    payments.forEach(p => {
        if (p > 0) depositCount++;
        else if (p < 0) withdrawCount++;
    });
    
    // Tính tổng xài & ứng để ra Số Dư (Còn lại)
    let consumed = 0; let advanced = 0;
    (DATA.payments || []).forEach(p => {
        if (!p.isPaid || p.isEstimate) return;
        if (p.participants && p.participants.includes(m.name)) consumed += Math.round(p.amount / p.participants.length);
        if (p.multiPayers) {
            const mp = p.multiPayers.find(x => x.name === m.name);
            if (mp && !mp.fromFund) advanced += mp.amount;
        } else if (p.payer === m.name && !p.fromFund) {
            advanced += p.amount;
        }
    });
    const balance = totalContributed + advanced - consumed;
    
    document.getElementById('editMemIndex').value = i;
    
    // Nạp Tên
    const nameInput = document.getElementById('editMemName');
    nameInput.value = m.name || '';
    nameInput.disabled = true;
    nameInput.style.opacity = '0.8';
    nameInput.style.background = 'var(--surface)';
    
    // Nạp UI thông số
    document.getElementById('editMemPaidDisplay').textContent = formatVND(totalContributed);
    
    // --- HIỂN THỊ SỐ LẦN LÊN TIÊU ĐỀ ---
    const addLabel = document.getElementById('editMemAddLabel');
    if (addLabel) addLabel.innerHTML = `<i class="fa-solid fa-arrow-down-to-line"></i> NẠP THÊM QUỸ (LẦN ${depositCount + 1})`;
    
    const withdrawLabel = document.getElementById('editMemWithdrawLabel');
    if (withdrawLabel) withdrawLabel.innerHTML = `<i class="fa-solid fa-hand-holding-dollar"></i> RÚT QUỸ / HOÀN TIỀN (LẦN ${withdrawCount + 1})`;
    
    const maxWithdrawEl = document.getElementById('editMemMaxWithdraw');
    maxWithdrawEl.textContent = balance > 0 ? formatVND(balance) : '0đ (Đang nợ quỹ)';
    document.getElementById('editMemWithdraw').setAttribute('data-max', balance > 0 ? balance : 0);
    
    // Reset các ô nhập liệu
    document.getElementById('editMemAdd').value = ''; 
    document.getElementById('editMemWithdraw').value = ''; 
    
    openModal('editMemberModal');
};

window.saveEditMember = saveEditMember = () => {
    if (!isEditor) return;

    const indexEl = document.getElementById('editMemIndex');
    if (!indexEl) return console.error("Không tìm thấy element editMemIndex");
    const i = parseInt(indexEl.value, 10);

    const newName = document.getElementById('editMemName').value.trim();
    const oldName = DATA.members[i].name; 
    
    // Lấy số tiền từ 2 ô Nạp và Rút
    const addAmount = parseFloat(document.getElementById('editMemAdd')?.value) || 0; 
    const withdrawAmount = parseFloat(document.getElementById('editMemWithdraw')?.value) || 0;
    const maxWithdraw = parseFloat(document.getElementById('editMemWithdraw')?.getAttribute('data-max')) || 0;

    if (!newName) return showToast("Tên không được để trống", "error");

    // Check trùng tên
    const isDuplicate = DATA.members.some((m, idx) => idx !== i && m.name.toLowerCase() === newName.toLowerCase());
    if (isDuplicate) return showToast(`⚠️ Tên "${newName}" đã tồn tại!`, "error");

    // Check logic Rút tiền
    if (withdrawAmount > 0 && addAmount > 0) {
        return showToast("Không thể vừa nạp vừa rút cùng lúc!", "error");
    }
    if (withdrawAmount > maxWithdraw) {
        return showToast(`Người này chỉ có thể rút tối đa ${formatVND(maxWithdraw)}!`, "error");
    }

    // Cập nhật đổi tên toàn hệ thống
    if (newName !== oldName) {
        (DATA.payments || []).forEach(p => {
            if (p.payer === oldName) p.payer = newName;
            if (p.participants) p.participants = p.participants.map(name => name === oldName ? newName : name);
        });
    }

    DATA.members[i].name = newName;
    
    // Lưu Tiền (Nạp là số dương, Rút là số âm)
    if (addAmount > 0 || withdrawAmount > 0) {
        DATA.members[i].payments = DATA.members[i].payments || (DATA.members[i].paid ? [DATA.members[i].paid] : []);
        
        if (addAmount > 0) {
            DATA.members[i].payments.push(addAmount);
            showToast("Đại gia xuất hiện! Quỹ lại đầy rồi. 🏦", "success");
            window.playTing('success');
            if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 160, origin: { y: 0.6 }, colors: ['#ffd700', '#ffae00'] });
        } 
        else if (withdrawAmount > 0) {
            DATA.members[i].payments.push(-withdrawAmount); // Đẩy số âm vào mảng
            showToast(`Đã hoàn lại ${formatVND(withdrawAmount)} cho ${newName}`, "info");
        }
        
        if (DATA.members[i].paid !== undefined) delete DATA.members[i].paid;
    } else {
        showToast("Đã cập nhật thông tin thành công!", "success");
    }

    renderCollection(); save(); autoSync(); renderItinerary();
    if (typeof window.renderPayments === 'function') window.renderPayments(); // 🔧 Cập nhật ngay Dashboard/cảnh báo Quỹ chung bên tab Chi tiêu
    closeModal('editMemberModal');
};

// ============================================
// LOGIC THÊM THÀNH VIÊN KÈM AVATAR
// ============================================

// Mở bảng và reset mọi thứ về mặc định
window.openAddMemberModal = openAddMemberModal = () => {
    document.getElementById('memName').value = '';
    document.getElementById('memPaid').value = '';
    document.getElementById('newMemAvatarSeed').value = ''; // Xóa seed random
    document.getElementById('newMemAvatarPreview').src = `https://api.dicebear.com/8.x/adventurer/svg?seed=New&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    openModal('memberModal');
};

// Vừa gõ tên vừa update mặt (nếu chưa bấm random)
window.updateNewMemberAvatarPreview = updateNewMemberAvatarPreview = () => {
    const name = document.getElementById('memName').value.trim() || 'New';
    const seedInput = document.getElementById('newMemAvatarSeed').value;
    
    // Chỉ tự đổi ảnh theo tên nếu người dùng CHƯA bấm chọn random
    if (!seedInput) {
        document.getElementById('newMemAvatarPreview').src = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }
};

// Bấm vào hình để xoay Avatar random
window.randomizeNewMemberAvatar = randomizeNewMemberAvatar = () => {
    const randomSeed = 'avatar_' + Date.now() + Math.random();
    document.getElementById('newMemAvatarSeed').value = randomSeed;
    document.getElementById('newMemAvatarPreview').src = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

window.deleteMember = deleteMember = async (i) => {
  if (!isEditor) return;
  const m = DATA.members[i];
  const deletedName = m.name; // Lưu lại tên người sắp bị xóa
  
  const ok = await window.niceConfirm(
      "Xóa thành viên?", 
      `Xóa "${deletedName}"? Dữ liệu đóng tiền sẽ bị xóa, và các khoản chi tiêu có mặt người này sẽ TỰ ĐỘNG CHIA LẠI cho những người còn lại.`, 
      "danger"
  );
  if (!ok) return;

  // === 🛠️ BẢN VÁ LỖI: GỠ TÊN KHỎI CÁC KHOẢN CHI TIÊU ===
  if (DATA.payments && DATA.payments.length > 0) {
      DATA.payments.forEach(p => {
          // 1. Gỡ khỏi danh sách những người cùng chia tiền
          if (p.participants && p.participants.includes(deletedName)) {
              p.participants = p.participants.filter(name => name !== deletedName);
          }
          // 2. Chống lỗi: Nếu người này đang đứng tên là "Người trả", reset về Chưa rõ
          if (p.payer === deletedName) {
              p.payer = p.fromFund ? "Quỹ" : "Chưa rõ";
          }
      });
  }
  // =====================================================

  // 1. Thực hiện xóa khỏi mảng dữ liệu thành viên
  DATA.members.splice(i, 1);
  
  // 2. THỨ TỰ VÀNG: Ép tính toán lại toàn bộ Quỹ và Túi tiền của từng người
  renderCollection();

  // 3. LƯU VÀ ĐỒNG BỘ lên Firebase
  save(); 
  autoSync(); 
  
  // 4. Cập nhật lại giao diện Lịch trình và Chi tiêu (Để tiền mỗi người nảy lên số mới)
  try {
      renderPayments();
      renderItinerary();
  } catch(e) {}

  showToast(`Đã xóa ${deletedName} và chia lại chi tiêu!`, "info");
};

window.saveTripInfo = saveTripInfo = () => {
    if (!isEditor) return;
    const name = document.getElementById('settingTripName').value.trim();
    if (!name) return showToast("Tên chuyến đi không được trống", "error");
    
    DATA.trip.name = name;
    save(); autoSync(); renderAll();
    
    window.cancelAllSettings(); // Thêm dòng này
    showToast("Đã lưu tên chuyến đi", "success");
};

// ===== QUẢN LÝ KẾT THÚC & CHIA SẺ =====
window.updateManagementUI = updateManagementUI = () => {
    if (!DATA || !DATA.trip) return;
    
    const isFinished = DATA.trip.isFinished || false;
    const isShared = DATA.trip.isShared || false;

    // Bật/tắt class khóa UI toàn cục
    document.body.classList.toggle('trip-finished', isFinished);
    if (isFinished) {
        document.querySelectorAll('.swipe-content').forEach(el => {
            el.style.transition = 'transform 0.2s ease';
            el.style.transform = 'translateX(0)';
        });
    }

    const fundCard = document.getElementById('fundLinkCard');
    if (fundCard) {
        // Nếu đã kết thúc thì ẩn (none), nếu đang chạy thì hiện (block)
        fundCard.style.display = isFinished ? 'none' : 'block';
    }

    const btnFinish = document.getElementById('btnFinishTrip');
    const btnShare = document.getElementById('btnShareTrip');
    const indFinished = document.getElementById('indFinished');
    const indShared = document.getElementById('indShared');
    
    // BỔ SUNG: Lấy cái huy hiệu trên Header
    const headerSharedBadge = document.getElementById('headerSharedBadge');

    if (btnFinish && btnShare && indFinished && indShared) {
        
        // 1. Xử lý nút KẾT THÚC CHUYẾN ĐI
        if (isFinished) {
            btnFinish.innerHTML = "🔓 Mở khóa chuyến đi";
            btnFinish.style.background = "var(--surface3)";
            indFinished.style.display = "inline-flex";
        } else {
            btnFinish.innerHTML = "🔒 Kết thúc chuyến đi";
            btnFinish.style.background = "var(--surface3)";
            indFinished.style.display = "none";
        }

        // 2. Xử lý nút CHIA SẺ
        btnShare.disabled = false;
        if (isShared) {
            btnShare.innerHTML = "🗑️ Ngừng chia sẻ";
            btnShare.style.background = "var(--red-bg)";
            btnShare.style.color = "var(--red)";
            btnShare.style.border = "none";
            indShared.style.display = "inline-flex";
            
            // BỔ SUNG: Hiện trên Header
            if (headerSharedBadge) headerSharedBadge.style.display = "inline-flex";
        } else {
            btnShare.innerHTML = "🌍 Chia sẻ công khai";
            btnShare.style.background = "var(--accent-glow)";
            btnShare.style.color = "var(--accent)";
            btnShare.style.border = "1px solid var(--accent)";
            indShared.style.display = "none";
            
            // BỔ SUNG: Ẩn trên Header
            if (headerSharedBadge) headerSharedBadge.style.display = "none";
        }
    }
};

window.toggleFinishTrip = toggleFinishTrip = async () => { // Thêm async
    if (!isEditor) return;
    const isFinished = DATA.trip.isFinished || false;

    if (!isFinished) {
        const ok = await window.niceConfirm("Kết thúc chuyến đi?", "Toàn bộ chức năng Thêm/Sửa/Xóa sẽ bị khóa lại.", "warning");
        if (!ok) return;
    } else {
        const ok = await window.niceConfirm("Mở khóa chuyến đi?", "Nếu đang chia sẻ công khai, bài chia sẻ sẽ tự động bị gỡ xuống.", "warning");
        if (!ok) return;
        DATA.trip.isShared = false;
        if (firebaseConnected && window._firebaseDb) {
             window._fbSDK.set(window._fbSDK.ref(window._firebaseDb, `public_trips/${DATA.trip.code}`), null);
        }
    }

    DATA.trip.isFinished = !isFinished;
    save(); autoSync(); 
    window.updateManagementUI();

    // BẮN PHÁO HOA KHI KHÓA CHUYẾN ĐI THÀNH CÔNG
    if (DATA.trip.isFinished) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#e8c547', '#4ade80', '#60a5fa', '#f87171']
        });
    }
    showToast(DATA.trip.isFinished ? "Đã khóa chuyến đi" : "Đã mở khóa chuyến đi", "success");
};

window.toggleShareTrip = toggleShareTrip = async () => {
    if (!isEditor) return;
    if (!firebaseConnected || !window._firebaseDb) return showToast("Cần kết nối mạng để chia sẻ", "error");

    const isShared = DATA.trip.isShared || false;
    const sdk = window._fbSDK;
    const publicRef = sdk.ref(window._firebaseDb, `public_trips/${DATA.trip.code}`);

    try {
        if (!isShared) {
            await sdk.set(publicRef, DATA);
            DATA.trip.isShared = true;
            showToast("Đã chia sẻ lên trang chủ!", "success");
        } else {
            await sdk.set(publicRef, null);
            DATA.trip.isShared = false;
            showToast("Đã gỡ khỏi trang chủ", "info");
        }
        save(); autoSync(); 
        window.updateManagementUI();
    } catch (e) {
        showToast("Lỗi: " + e.message, "error");
    }
};

// ===== HELPERS =====
window.openAddModal = openAddModal = () => {
  openModal('addChoiceModal');
};

window.openAddActivityChoose = openAddActivityChoose = () => {
    if (!DATA.days || DATA.days.length === 0) {
        return showToast("Vui lòng tạo ngày mới trước!", "error");
    }
    // Mở form thêm cho ngày cuối cùng
    openActModal(DATA.days.length - 1);
};

window.getLinkedPaymentIndices = getLinkedPaymentIndices = (actId) => {
    if (!DATA.payments || !actId) return [];
    // Trả về mảng chứa tất cả các index của chi tiêu có linkedActId trùng khớp
    return DATA.payments
        .map((p, idx) => (p && p.linkedActId === actId ? idx : -1))
        .filter(idx => idx !== -1);
};

window.openAddPaymentModal = openAddPaymentModal = (prefillName = "", linkedActId = "") => {
    if (!isTripEditable()) {
        showToast(DATA?.trip?.isFinished ? "Chuyến đi đã kết thúc" : "Chỉ Editor mới được thêm chi tiêu", "info");
        return;
    }
    const payerSelect = document.getElementById('pmPayer');
    const partContainer = document.getElementById('pmParticipants');
    const members = DATA.members || [];
  
    document.getElementById('pmDesc').value = prefillName;
    document.getElementById('pmAmount').value = '';
    selectCategory('pm', 'food');
    if(document.getElementById('pmLinkedActId')) document.getElementById('pmLinkedActId').value = linkedActId;
    
    // Mặc định reset Dự trù về Tắt
    document.getElementById('pmIsEstimate').checked = false;
    toggleEstimateMode('pm');

    // =========================================================
    // 🧹 ÉP RESET TOÀN BỘ CHẾ ĐỘ GÓP CHUNG VỀ MẶC ĐỊNH (VÁ LỖI CỘNG DỒN)
    // =========================================================
    window.isMultiPayerMode = isMultiPayerMode = false;
    document.getElementById('pmSinglePayerArea').style.display = 'block';
    document.getElementById('pmMultiPayerArea').style.display = 'none';
    document.getElementById('btnToggleMulti').innerHTML = '+ Góp tiền chung';
    document.getElementById('payerRowsContainer').innerHTML = ''; // Xóa sạch các hàng cũ
    const amtInput = document.getElementById('pmAmount');
    if (amtInput) {
        amtInput.readOnly = false; // Mở khóa ô nhập tổng tiền
        amtInput.style.opacity = '1';
    }
    // =========================================================

    // Lấy 2 nút checkbox Thanh toán / Rút quỹ
    const isPaidInput = document.getElementById('pmIsPaid');
    const fromFundInput = document.getElementById('pmFromFund');
  
    if (members.length > 0) {
        payerSelect.innerHTML = `<option value="" disabled selected>Chọn người...</option>` + members.map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');
        payerSelect.disabled = false; // Mở khóa
        
        partContainer.innerHTML = members.map(m => `<div class="participant-chip selected" onclick="this.classList.toggle('selected')" data-name="${esc(m.name)}">${esc(m.name)}</div>`).join('');

        // ✅ VÁ LỖI: Reset trạng thái checkbox về mặc định để không dính "tàn dư" của lần mở trước
        isPaidInput.checked = true;   // Mặc định HTML của bác là Đã thanh toán
        fromFundInput.checked = false; // Mặc định là Không rút quỹ

        // Mở khóa 2 nút tick
        isPaidInput.disabled = false;
        fromFundInput.disabled = false;
        isPaidInput.nextElementSibling.style.opacity = '1';
        fromFundInput.nextElementSibling.style.opacity = '1';
        isPaidInput.nextElementSibling.style.cursor = 'pointer';
        fromFundInput.nextElementSibling.style.cursor = 'pointer';

    } else {
        payerSelect.innerHTML = '<option value="">Chưa có thành viên</option>';
        payerSelect.disabled = true;  // Khóa cứng
        partContainer.innerHTML = '<div style="font-size:0.7rem; color:var(--text3)">Vui lòng thêm thành viên trước</div>';

        // Khóa cứng 2 nút tick, bỏ tick và làm mờ đi
        isPaidInput.disabled = true;
        fromFundInput.disabled = true;
        isPaidInput.checked = false; 
        fromFundInput.checked = false;
        
        // CSS làm mờ và hiện dấu cấm click
        isPaidInput.nextElementSibling.style.opacity = '0.4';
        fromFundInput.nextElementSibling.style.opacity = '0.4';
        isPaidInput.nextElementSibling.style.cursor = 'not-allowed';
        fromFundInput.nextElementSibling.style.cursor = 'not-allowed';
    }
    openModal('paymentModal');
};

window.switchSubTab = switchSubTab = (tab) => {
  document.querySelectorAll('#page-collection .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#page-collection .sub-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`#page-collection .tab:nth-child(${tab==='fund'?1:2})`).classList.add('active');
  document.getElementById('subtab-' + tab).classList.add('active');
};

// ===== HISTORYMODAL =====
// Hàm chuyển tab trong Modal Lịch sử
window.toggleHistoryTab = toggleHistoryTab = (tabName) => {
    document.getElementById('tabHistoryFundBtn').classList.toggle('active', tabName === 'fund');
    document.getElementById('tabHistoryExpBtn').classList.toggle('active', tabName === 'expense');
    
    document.getElementById('history-tab-fund').style.display = tabName === 'fund' ? 'block' : 'none';
    document.getElementById('history-tab-expense').style.display = tabName === 'expense' ? 'block' : 'none';
};

window.openHistoryModal = openHistoryModal = (i) => {
  const m = DATA.members[i];
  document.getElementById('historyMemName').textContent = m.name;
  const list = document.getElementById('historyList');
  
  // 1. DỮ LIỆU ĐÓNG QUỸ
  const payments = m.payments || (m.paid ? [m.paid] : []);
  const totalContributed = payments.reduce((s, v) => s + v, 0);

  // 2. DỮ LIỆU CHI TIÊU VÀ ỨNG TIỀN (THUẬT TOÁN CHUẨN)
  let totalConsumed = 0; // Tổng số tiền thực sự bị trừ vào ví
  let involvedPayments = [];

  (DATA.payments || []).forEach((p, idx) => {
      if (!p.isPaid || p.isEstimate) return; // Bỏ qua dự trù & chưa trả
      
      let consumed = 0; // Tiền bị chia (Tiêu thụ)
      let advanced = 0; // Tiền đứng ra trả hộ (Ứng trước)

      // A. Tính tiền bị chia (Thụ hưởng)
      if (p.participants && p.participants.includes(m.name)) {
          consumed = Math.round(p.amount / p.participants.length);
      }

      // B. Tính tiền ứng ra trả hộ
      if (p.multiPayers) {
          const mp = p.multiPayers.find(x => x.name === m.name);
          if (mp && !mp.fromFund) advanced = mp.amount; // Bỏ qua nếu móc từ quỹ ra trả
      } else if (p.payer === m.name && !p.fromFund) {
          advanced = p.amount;
      }

      if (consumed > 0 || advanced > 0) {
          totalConsumed += consumed;
          involvedPayments.push({ ...p, originalIdx: idx, consumed, advanced });
      }
  });

  // Đảo ngược để khoản mới nhất lên đầu
  involvedPayments.reverse();

  // 3. RENDER UI TAB QUỸ (FUND)
  let fundHtml = '';
  // Nút mở modal "Quản lý & Đóng quỹ" để Nạp thêm / Rút quỹ ngay từ Sao kê
  // Đánh dấu để sau khi Lưu/Hủy ở modal đó xong sẽ tự quay lại Sao kê (không bị tắt luôn)
  const manageFundBtnHtml = isEditor ? `
      <button class="btn" style="width:100%; background: var(--surface2); color: var(--green); border: 1px dashed var(--green); font-size:0.78rem; font-weight:700; margin-bottom:15px; padding:13px 14px; display:flex; align-items:center; justify-content:center; gap:10px;" onclick="window.pendingReturnToHistoryIdx = pendingReturnToHistoryIdx = ${i}; closeModal('historyModal'); setTimeout(() => openEditMember(${i}), 300);">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; font-size:1.2rem; line-height:1; flex-shrink:0;">💳</span><span style="display:inline-flex; align-items:center; line-height:1;">Nạp thêm / Rút quỹ</span>
      </button>
  ` : '';

  if (!payments.length) {
    fundHtml = manageFundBtnHtml + '<div class="empty" style="padding:20px 0">Chưa đóng quỹ lần nào</div>';
  } else {
    // TẠO 2 BỘ ĐẾM RIÊNG BIỆT
    let dCount = 0; // Đếm số lần nạp
    let wCount = 0; // Đếm số lần rút

    const historyItemsHtml = payments.map((p, idx) => {
        const isWithdraw = p < 0;
        const color = isWithdraw ? 'var(--orange)' : 'var(--green)';
        const sign = isWithdraw ? '-' : '+';
        
        // CHUẨN HÓA TEXT DANH SÁCH: "Lần nạp X" và "Lần rút Y"
        let label = '';
        if (isWithdraw) {
            wCount++;
            label = `Lần rút ${wCount}`;
        } else {
            dCount++;
            label = `Lần nạp ${dCount}`;
        }
        
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:8px; border-left: 2px solid ${color};">
          <div style="font-size:.8rem;color:var(--text2)">${label}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-size:.85rem;font-weight:bold;color:${color}">${sign} ${formatVND(Math.abs(p))}</div>
            ${isEditor ? `
              <button style="background:var(--accent-glow);color:var(--accent);border:none;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="editHistoryCashIn(${i}, ${idx}, ${p})">✎</button>
              <button style="background:var(--red-bg);color:var(--red);border:none;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="deleteHistoryCashIn(${i}, ${idx}, ${p})">🗑️</button>
            ` : ''}
          </div>
        </div>`;
    }).join('');

    fundHtml = `
      <div style="background: var(--surface3); border-radius: var(--radius-sm); padding: 15px; margin-bottom: 15px; border-left: 4px solid var(--green); display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow);">
        <div>
          <div style="font-size: 0.6rem; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Tổng tiền có trong quỹ</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: var(--green);">${formatVND(totalContributed)}</div>
        </div>
        <div style="font-size: 1.5rem; opacity: 0.5;">💰</div>
      </div>
      ${manageFundBtnHtml}
      <div style="font-size: 0.7rem; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-left: 5px;">Biến động Nạp / Rút:</div>
      ${historyItemsHtml}
    `;
  }

  // 4. RENDER UI TAB CHI TIÊU (EXPENSE) - VÁ LỖI DẤU TRỪ + THÊM TỔNG ĐÃ ỨNG
  let expHtml = '';
  const totalAdvanced = involvedPayments.reduce((s, p) => s + (p.advanced || 0), 0);
  const expenseBalance = totalAdvanced - totalConsumed;
  const balColor = expenseBalance > 0 ? 'var(--blue)' : (expenseBalance < 0 ? 'var(--red)' : 'var(--text3)');
  const balLabel = expenseBalance > 0 ? '🔄 Được hoàn lại (ứng nhiều hơn tiêu, chưa gồm quỹ)' : (expenseBalance < 0 ? '🔄 Còn phải trả (tiêu nhiều hơn ứng, chưa gồm quỹ)' : '🔄 Ứng vừa đủ tiêu (chưa gồm quỹ)');

  // ĐỐI CHIẾU TỔNG QUÁT: Đóng quỹ + Đã ứng hộ so với Đã chi -> để check nhanh xem có khớp không
  const overallBalance = totalContributed + totalAdvanced - totalConsumed;
  const overallColor = overallBalance > 0 ? 'var(--green)' : (overallBalance < 0 ? 'var(--red)' : 'var(--text3)');
  const overallLabel = overallBalance > 0 ? '✅ Được hoàn lại' : (overallBalance < 0 ? '⚠️ Còn phải đóng thêm' : '⚖️ Huề vốn');

  const summaryCheckHtml = `
    <div style="background: var(--surface3); border-radius: var(--radius); padding:14px 16px; margin-bottom:14px; border: 1px solid rgba(255,255,255,0.06); box-shadow: var(--shadow);">
      <div style="font-size:0.6rem; color:var(--text3); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">🧮 Đối chiếu nhanh: Quỹ + Ứng − Chi</div>
      <div style="display:flex; flex-direction:column; gap:7px;">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem;">
          <span style="display:inline-flex; align-items:center; gap:6px; color:var(--text2);"><span style="display:inline-flex; align-items:center; justify-content:center; width:16px; font-size:0.9rem; line-height:1;">🏦</span>Đóng quỹ</span>
          <span style="color:var(--green); font-weight:700;">+${formatVND(totalContributed)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem;">
          <span style="display:inline-flex; align-items:center; gap:6px; color:var(--text2);"><span style="display:inline-flex; align-items:center; justify-content:center; width:16px; font-size:0.9rem; line-height:1;">💳</span>Đã ứng hộ</span>
          <span style="color:var(--blue); font-weight:700;">+${formatVND(totalAdvanced)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; padding-bottom:7px; border-bottom:1px dashed rgba(255,255,255,0.12);">
          <span style="display:inline-flex; align-items:center; gap:6px; color:var(--text2);"><span style="display:inline-flex; align-items:center; justify-content:center; width:16px; font-size:0.9rem; line-height:1;">💸</span>Đã chi</span>
          <span style="color:var(--red); font-weight:700;">-${formatVND(Math.abs(totalConsumed))}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:1px;">
          <span style="font-size:0.78rem; font-weight:800; color:var(--text);">${overallLabel}</span>
          <span style="font-size:0.98rem; font-weight:900; color:${overallColor};">${formatVND(Math.abs(overallBalance))}</span>
        </div>
      </div>
    </div>
  `;

  if (!involvedPayments.length) {
      expHtml = '<div class="empty" style="padding:20px 0">Chưa tham gia chi tiêu nào</div>';
  } else {
      expHtml = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
        <div style="background: var(--surface3); border-radius: var(--radius-sm); padding: 13px; border-left: 4px solid var(--blue); box-shadow: var(--shadow);">
          <div style="font-size: 0.58rem; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px;">💳 Đã ứng hộ</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--blue); word-break: break-word;">+${formatVND(totalAdvanced)}</div>
        </div>
        <div style="background: var(--surface3); border-radius: var(--radius-sm); padding: 13px; border-left: 4px solid var(--red); box-shadow: var(--shadow);">
          <div style="font-size: 0.58rem; color: var(--text3); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px;">💸 Đã tiêu</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--red); word-break: break-word;">-${formatVND(Math.abs(totalConsumed))}</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap: 10px; background: var(--surface2); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom:15px; border: 1px dashed rgba(255,255,255,0.1);">
        <span style="font-size:0.68rem; color:var(--text2); font-weight:600;">${balLabel}</span>
        <span style="font-size:0.85rem; font-weight:800; color:${balColor}; white-space:nowrap;">${formatVND(Math.abs(expenseBalance))}</span>
      </div>

      <div style="font-size: 0.7rem; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-left: 5px;">Chi tiết từng khoản:</div>

      ${involvedPayments.map(p => `
        <div style="padding:12px; background:var(--surface2); border-radius:var(--radius-sm); margin-bottom:8px; border: 1px solid rgba(255,255,255,0.02);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex: 1; padding-right: 10px;">
                    <div style="font-size:0.8rem; font-weight:bold; color:var(--text);">${esc(p.desc)}</div>
                    <div style="font-size:0.6rem; color:var(--text3); margin-top:4px;">Tổng Bill: ${formatVND(p.amount)}</div>
                </div>
                <div style="text-align:right; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px;">
                    ${p.advanced > 0 ? `<div style="font-size:0.65rem; color:var(--blue); font-weight:bold; background: var(--blue-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(96,165,250,0.25);">Ứng: +${formatVND(Math.abs(p.advanced))}</div>` : ''}
                    ${p.consumed > 0 ? `<div style="font-size:0.65rem; color:var(--red); font-weight:bold; background: var(--red-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(248,113,113,0.2);">Đã tiêu: -${formatVND(Math.abs(p.consumed))}</div>` : ''}
                </div>
            </div>
        </div>
      `).join('')}
      `;
  }

  // 5. GỘP LẠI VÀ BỌC TRONG THANH TABS
  list.innerHTML = `
      ${summaryCheckHtml}

      <div class="tab-bar" style="margin-bottom: 15px; padding: 4px; background: var(--surface2);">
        <button class="tab active" id="tabHistoryFundBtn" onclick="toggleHistoryTab('fund')">🏦 Nạp / Rút</button>
        <button class="tab" id="tabHistoryExpBtn" onclick="toggleHistoryTab('expense')">💸 Chi tiêu</button>
      </div>
      
      <div id="history-tab-fund" style="display: block;">
        ${fundHtml}
      </div>
      
      <div id="history-tab-expense" style="display: none;">
        ${expHtml}
      </div>
  `;
  
  openModal('historyModal');
};

// ============================================
// 💳 TỔNG QUAN: AI ĐÃ ỨNG BAO NHIÊU & MỤC GÌ (WEB, KHÔNG CẦN EXCEL)
// Phân biệt rõ: Ứng cá nhân (chưa rút quỹ) vs Đã rút quỹ để trả
// ============================================
function computeAdvanceOverviewData() {
    const members = DATA.members || [];
    const payments = (DATA.payments || []).filter(p => p && typeof p === 'object');
    const map = {};
    members.forEach(m => { map[m.name] = { personal: 0, fund: 0, items: [] }; });

    payments.forEach(p => {
        if (!p.isPaid || p.isEstimate) return;
        const ctx = getPaymentActivityContext(p);
        const activityLabel = ctx.activity || (p.linkedActId ? 'Hoạt động đã xóa' : 'Phát sinh');

        if (p.multiPayers && p.multiPayers.length) {
            p.multiPayers.forEach(mp => {
                if (!mp.amount || !map[mp.name]) return;
                const type = mp.fromFund ? 'fund' : 'personal';
                map[mp.name][type] += mp.amount;
                map[mp.name].items.push({ desc: p.desc || '', activity: activityLabel, date: ctx.date, amount: mp.amount, type });
            });
        } else if (p.payer && map[p.payer]) {
            const type = p.fromFund ? 'fund' : 'personal';
            map[p.payer][type] += (p.amount || 0);
            map[p.payer].items.push({ desc: p.desc || '', activity: activityLabel, date: ctx.date, amount: p.amount || 0, type });
        }
    });

    return map;
}

window.setAdvanceOverviewFilter = setAdvanceOverviewFilter = (f) => {
    window._advOverviewFilter = _advOverviewFilter = f;
    renderAdvanceOverview();
};

function renderAdvanceOverview() {
    const list = document.getElementById('advanceOverviewList');
    const members = DATA.members || [];
    const map = window._advOverviewData || {};
    const filter = window._advOverviewFilter || 'all';

    let grandPersonal = 0, grandFund = 0;
    Object.values(map).forEach(v => { grandPersonal += v.personal; grandFund += v.fund; });

    const tabHtml = `
      <div class="tab-bar" style="margin-bottom:15px; padding:4px; background: var(--surface2);">
        <button class="tab ${filter === 'all' ? 'active' : ''}" onclick="setAdvanceOverviewFilter('all')">Tất cả</button>
        <button class="tab ${filter === 'personal' ? 'active' : ''}" onclick="setAdvanceOverviewFilter('personal')">💳 Ứng cá nhân</button>
        <button class="tab ${filter === 'fund' ? 'active' : ''}" onclick="setAdvanceOverviewFilter('fund')">🏦 Đã rút quỹ</button>
      </div>
    `;

    const summaryHtml = `
      <div style="display:flex; gap:10px; margin-bottom:15px;">
        <div style="flex:1; background: var(--surface3); border-radius: var(--radius-sm); padding: 12px; border-left: 4px solid var(--blue);">
          <div style="font-size:0.55rem; color: var(--text3); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">💳 Ứng cá nhân (chưa rút quỹ)</div>
          <div style="font-size:1rem; font-weight:800; color: var(--blue);">${formatVND(grandPersonal)}</div>
        </div>
        <div style="flex:1; background: var(--surface3); border-radius: var(--radius-sm); padding: 12px; border-left: 4px solid var(--orange);">
          <div style="font-size:0.55rem; color: var(--text3); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">🏦 Đã rút quỹ để trả</div>
          <div style="font-size:1rem; font-weight:800; color: var(--orange);">${formatVND(grandFund)}</div>
        </div>
      </div>
    `;

    const membersWithData = members.filter(m => {
        const d = map[m.name];
        if (!d) return false;
        if (filter === 'personal') return d.personal > 0;
        if (filter === 'fund') return d.fund > 0;
        return (d.personal + d.fund) > 0;
    }).sort((a, b) => {
        const da = map[a.name], db = map[b.name];
        const va = filter === 'personal' ? da.personal : (filter === 'fund' ? da.fund : (da.personal + da.fund));
        const vb = filter === 'personal' ? db.personal : (filter === 'fund' ? db.fund : (db.personal + db.fund));
        return vb - va;
    });

    if (!membersWithData.length) {
        list.innerHTML = tabHtml + summaryHtml + '<div class="empty" style="padding:20px 0">Không có khoản nào phù hợp</div>';
        return;
    }

    const membersHtml = membersWithData.map(m => {
        const d = map[m.name];
        const items = d.items.filter(it => filter === 'all' || it.type === filter).slice().reverse();
        const memberTotal = filter === 'personal' ? d.personal : (filter === 'fund' ? d.fund : (d.personal + d.fund));

        const itemsHtml = items.map(it => {
            const isFund = it.type === 'fund';
            const color = isFund ? 'var(--orange)' : 'var(--blue)';
            const badge = isFund ? '🏦 Rút quỹ' : '💳 Ứng cá nhân';
            return `
              <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:10px 12px; background:var(--surface2); border-radius:var(--radius-sm); margin-bottom:6px; border-left: 2px solid ${color};">
                <div style="flex:1; padding-right:10px;">
                  <div style="font-size:0.8rem; font-weight:600; color:var(--text);">${esc(it.desc || it.activity || 'Khoản chi')}</div>
                  <div style="font-size:0.6rem; color:var(--text3); margin-top:3px;">${esc(it.activity || '')}${it.date ? ' • ' + esc(it.date) : ''}</div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                  <div style="font-size:0.8rem; font-weight:bold; color:${color};">+${formatVND(it.amount)}</div>
                  <div style="font-size:0.55rem; color:${color}; margin-top:2px;">${badge}</div>
                </div>
              </div>
            `;
        }).join('');

        return `
          <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 4px; border-bottom: 1px dashed rgba(255,255,255,0.1); margin-bottom:8px;">
              <div style="font-size:0.85rem; font-weight:800; color:var(--text);">👤 ${esc(m.name)}</div>
              <div style="font-size:0.85rem; font-weight:800; color:var(--text);">${formatVND(memberTotal)}</div>
            </div>
            ${itemsHtml}
          </div>
        `;
    }).join('');

    list.innerHTML = tabHtml + summaryHtml + membersHtml;
}

window.openAdvanceOverviewModal = openAdvanceOverviewModal = () => {
    window._advOverviewData = _advOverviewData = computeAdvanceOverviewData();
    window._advOverviewFilter = _advOverviewFilter = 'all';
    renderAdvanceOverview();
    openModal('advanceOverviewModal');
};

window.editHistoryCashIn = editHistoryCashIn = async (memIdx, payIdx, oldVal) => {
  if (!isEditor) return;

  const numericOldVal = parseFloat(oldVal) || 0;
  const isWithdraw = numericOldVal < 0;
  
  let dCount = 0;
  let wCount = 0;
  const memberPayments = DATA.members[memIdx].payments || [];
  
  for (let i = 0; i <= payIdx; i++) {
      if (memberPayments[i] < 0) wCount++;
      else dCount++;
  }
  
  // CHUẨN HÓA TEXT DIALOG
  const title = isWithdraw ? "Sửa tiền rút" : "Sửa tiền nạp";
  const subtitle = isWithdraw ? `Lần rút ${wCount}:` : `Lần nạp ${dCount}:`;

  const input = await window.nicePrompt(title, subtitle, Math.abs(numericOldVal));
  if (input === null) return; 
  
  const parsedVal = parseFloat(input) || 0;
  if (parsedVal <= 0) return showToast("Số tiền không hợp lệ!", "error");

  const newVal = isWithdraw ? -Math.abs(parsedVal) : Math.abs(parsedVal);

  DATA.members[memIdx].payments[payIdx] = newVal;
  renderCollection();
  if (typeof window.renderPayments === 'function') window.renderPayments(); // 🔧 Cập nhật ngay Dashboard/cảnh báo Quỹ chung bên tab Chi tiêu
  save(); 
  autoSync(); 
  
  closeModal('historyModal'); 
  showToast(isWithdraw ? "Đã cập nhật số tiền rút" : "Đã sửa số tiền nạp", "success");
};

window.deleteHistoryCashIn = deleteHistoryCashIn = async (memIdx, payIdx, oldVal) => { // Thêm async
  if (!isEditor) return;
  const ok = await window.niceConfirm("Xóa lịch sử?", `Xóa Lần đóng ${payIdx + 1} (${formatVND(oldVal)})?`, "danger");
  if (!ok) return;
  
  const m = DATA.members[memIdx];
  // 1. Thực hiện thao tác trên dữ liệu gốc
  m.payments.splice(payIdx, 1);
  
  // ✅ 2. THỨ TỰ CHUẨN: Ép tính toán lại Quỹ chuẩn 100% từ mảng đã xóa
  renderCollection();
  if (typeof window.renderPayments === 'function') window.renderPayments(); // 🔧 Cập nhật ngay Dashboard/cảnh báo Quỹ chung bên tab Chi tiêu (kể cả khi quỹ chuyển từ dương sang âm)

  // 3. Lưu và đồng bộ con số chuẩn lên Firebase
  save(); 
  autoSync(); 
  
  closeModal('historyModal'); 
  showToast("Đã xóa lần đóng tiền", "success");
};

// ===== QR/Link =====
window.saveFundLink = saveFundLink = () => {
    if (!isEditor) return;
    const linkInput = document.getElementById('fundLinkInput');
    
    // Lưu dữ liệu
    DATA.fund.link = linkInput.value.trim();
    save(); 
    autoSync();
    
    // Chuyển UI sang chế độ "Khóa" ngay lập tức
    linkInput.disabled = true;
    const actionBtn = document.getElementById('fundLinkActionBtn');
    actionBtn.textContent = "Sửa";
    actionBtn.setAttribute('onclick', 'editFundLink()');

    showToast("Đã lưu link quỹ", "success");
};

window.editFundLink = editFundLink = () => {
    if (!isEditor) return;
    
    const linkInput = document.getElementById('fundLinkInput');
    const actionBtn = document.getElementById('fundLinkActionBtn');

    // Mở khóa input và tự động focus (đặt trỏ chuột) vào đó
    linkInput.disabled = false;
    linkInput.focus();

    // Đổi nút thành "Lưu"
    actionBtn.textContent = "Lưu";
    actionBtn.setAttribute('onclick', 'saveFundLink()');
};

window.openFundLink = openFundLink = () => {
    const link = document.getElementById('fundLinkInput').value.trim();
    if (!link) return showToast("Chưa có link quỹ", "error");
    window.open(link, '_blank');
};

window.handleQrUpload = handleQrUpload = (event) => {
    if (!isEditor) return;
    const file = event.target.files[0];
    const status = document.getElementById('uploadStatus');
    
    if (!file) return;

    // Kiểm tra dung lượng (Nên giới hạn dưới 1MB để tránh nặng Firebase)
    if (file.size > 1024 * 1024) {
        showToast("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1MB", "error");
        return;
    }

    status.textContent = "Đang xử lý ảnh...";

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64String = e.target.result;
        
        // 1. Cập nhật giao diện ngay lập tức
        document.getElementById('fundQrImg').src = base64String;
        
        // 2. Lưu vào dữ liệu DATA
        if (!DATA.fund) DATA.fund = { collected: 0, used: 0 };
        DATA.fund.qrUrl = base64String;

        // 3. Đồng bộ lên Firebase
        save();
        autoSync();
        
        status.textContent = "✅ Đã tải lên thành công!";
        showToast("Đã cập nhật mã QR mới", "success");
    };
    
    reader.onerror = function() {
        showToast("Lỗi khi đọc file ảnh", "error");
        status.textContent = "❌ Lỗi tải lên";
    };

    reader.readAsDataURL(file); // Chuyển ảnh sang Base64
};

window.removeFundQr = removeFundQr = async () => {
    // 1. Kiểm tra quyền Editor và xác nhận trước khi xóa
    if (!isEditor) return;
    const ok = await window.niceConfirm("Gỡ mã QR?", "Bạn có chắc muốn gỡ ảnh mã QR quỹ hiện tại?", "danger");
    if (!ok) return;

    // 2. Cập nhật giao diện ngay lập tức về placeholder
    document.getElementById('fundQrImg').src = "https://placehold.co/200x200?text=Chưa+có+mã+QR";

    // 3. Xóa dữ liệu trong mảng DATA
    if (!DATA.fund) DATA.fund = { collected: 0, used: 0 };
    DATA.fund.qrUrl = ""; // Đặt link ảnh về chuỗi rỗng

    // 4. Lưu vào máy và đồng bộ lên Firebase
    save();
    autoSync();

    showToast("Đã gỡ ảnh mã QR", "info");
};

// ============================================
// 1. LOGIC XỬ LÝ NÚT SỬA ĐỊA ĐIỂM (SETTINGS)
// ============================================
window.enableEditLoc = enableEditLoc = () => {
    window.cancelAllSettings();
    document.getElementById('settingTripLoc').disabled = false;
    document.getElementById('settingTripLoc').focus();
    document.getElementById('btnEditLoc').style.display = 'none';
    document.getElementById('btnSaveLoc').style.display = 'block';
    document.getElementById('btnCancelLoc').style.display = 'block';
};

window.cancelEditLoc = cancelEditLoc = () => {
    document.body.classList.remove('searching-city'); // Mở khóa cuộn
    document.getElementById('customSuggestions').style.display = 'none';
    const input = document.getElementById('settingTripLoc');
    if(input) {
        input.value = DATA.trip.location || "";
        input.disabled = true;
    }
    if(document.getElementById('btnEditLoc')) document.getElementById('btnEditLoc').style.display = 'block';
    if(document.getElementById('btnSaveLoc')) document.getElementById('btnSaveLoc').style.display = 'none';
    if(document.getElementById('btnCancelLoc')) document.getElementById('btnCancelLoc').style.display = 'none';
};

window.saveTripLoc = saveTripLoc = () => {
    if (!isEditor) return;
    const inputVal = document.getElementById('settingTripLoc').value.trim();
    const suggBox = document.getElementById('customSuggestions');
    
    // NẾU BẢNG GỢI Ý ĐANG MỞ -> Bắt buộc phải bấm vào danh sách, không cho bấm Lưu tay
    if (suggBox && suggBox.style.display === 'block') {
        return showToast("⚠️ Vui lòng BẤM CHỌN một địa điểm từ danh sách gợi ý!", "error");
    }
    
    // Nếu cố tình nhập tay khác đi, xóa luôn địa chỉ cũ để không bị râu ông nọ cắm cằm bà kia
    if (inputVal !== DATA.trip.location) {
        DATA.trip.fullAddress = ""; 
    }

    DATA.trip.location = inputVal;
    
    save(); autoSync(); renderAll();
    window.cancelAllSettings();
    showToast("Đã lưu địa điểm", "success");
};

// ============================================
// 2. BỘ MÁY XỬ LÝ API THỜI TIẾT OPEN-METEO
// ============================================
window._weatherCache = _weatherCache = {};
window._weatherLastFetch = _weatherLastFetch = 0;
window._weatherLoc = _weatherLoc = "";

window.loadWeatherForItinerary = loadWeatherForItinerary = async () => {
    // 1. Ưu tiên lấy tọa độ đã lưu trong DATA.trip
    let lat = DATA.trip?.lat;
    let lon = DATA.trip?.lon;
    const city = DATA.trip?.location;

    if (!city || !DATA.days || DATA.days.length === 0) return;

    // 2. Bộ nhớ đệm (Cache): Chỉ gọi API nếu đổi thành phố HOẶC đã quá 3 tiếng
    const cacheKey = `${lat}_${lon}`;
    if (cacheKey !== window._weatherKey || Date.now() - window._weatherLastFetch > 3 * 3600 * 1000) {
        try {
            // Nếu chưa có tọa độ (trường hợp dữ liệu cũ), mới phải đi tìm kiếm
            if (!lat || !lon) {
                console.log("Đang tìm tọa độ cho:", city);
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=vi&format=json`);
                const geoData = await geoRes.json();
                if (!geoData.results || geoData.results.length === 0) return;
                lat = geoData.results[0].latitude;
                lon = geoData.results[0].longitude;
            }

            // Gọi API dự báo thời tiết bằng tọa độ (Cực nhanh và chính xác)
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code&timezone=auto&forecast_days=16`);
            const weatherData = await weatherRes.json();
            
            if (!weatherData.daily) return;

            // Lưu kết quả vào Cache theo định dạng YYYY-MM-DD để so sánh chuẩn xác nhất
            window._weatherCache = _weatherCache = {};
            weatherData.daily.time.forEach((dateStr, i) => {
                // dateStr có dạng "2026-04-29"
                window._weatherCache[dateStr] = getEmojiForCode(weatherData.daily.weather_code[i]);
            });

            window._weatherLastFetch = _weatherLastFetch = Date.now();
            window._weatherKey = _weatherKey = cacheKey;
            window._weatherLoc = _weatherLoc = city;
            
            console.log("Cập nhật thời tiết thành công cho:", city);
        } catch(e) {
            console.error("Lỗi API thời tiết:", e);
            return;
        }
    }

    // 3. Hiển thị Icon lên giao diện
    DATA.days.forEach((day, di) => {
        const el = document.getElementById(`weather-icon-${di}`);
        if (!el) return;

        // FIX: Tự động bổ sung năm nếu dữ liệu chỉ có DD/MM
        const parts = day.date.split('/');
        const dd = parts[0].padStart(2, '0');
        const mm = parts[1].padStart(2, '0');
        const yyyy = parts.length === 3 ? parts[2] : new Date().getFullYear();
        
        const apiFormat = `${yyyy}-${mm}-${dd}`;
        
        if (window._weatherCache[apiFormat]) {
            el.innerHTML = window._weatherCache[apiFormat];
            el.style.display = 'inline-block';
        } else {
            el.style.display = 'none';
        }
    });
    
    // --- 🏝️ CẬP NHẬT HIỆU ỨNG THỜI TIẾT LÊN VIÊN THUỐC ---
    // --- 🏝️ CẬP NHẬT HIỆU ỨNG THỜI TIẾT LÊN VIÊN THUỐC ---
    const islandText = document.getElementById('island-main-content');
    const islandIcon = document.getElementById('island-icon');
    
    if (window._weatherCache && islandText && islandIcon) {
        const today = new Date().toISOString().split('T')[0];
        const weatherIcon = window._weatherCache[today] || '☀️';
        const currentHour = new Date().getHours();
        const isNight = currentHour < 6 || currentHour > 18;

        if (weatherIcon.includes('🌧️') || weatherIcon.includes('⛈️')) {
            islandText.style.color = 'var(--blue)'; 
            islandIcon.innerHTML = '🌧️'; 
        } 
        else if (isNight) {
            islandText.style.color = '#a78bfa'; 
            islandIcon.innerHTML = '🌙'; 
        } 
        else {
            // TRẠNG THÁI BÌNH THƯỜNG: Phải reset cả màu và icon
            islandText.style.color = '#fff';
            islandIcon.innerHTML = getTripTheme().icon; // <--- Thêm dòng này để quay về mặc định
        }
    }
};

// Từ điển dịch mã thời tiết của trạm khí tượng sang Emoji dễ thương
function getEmojiForCode(code) {
    if (code === 0) return '☀️'; // Trời quang
    if ([1,2,3].includes(code)) return '⛅'; // Có mây
    if ([45,48].includes(code)) return '🌫️'; // Sương mù
    if ([51,53,55,56,57].includes(code)) return '🌦️'; // Mưa phùn
    if ([61,63,65,66,67,80,81,82].includes(code)) return '🌧️'; // Mưa rào
    if ([71,73,75,77].includes(code)) return '🌨️'; // Tuyết
    if ([95,96,99].includes(code)) return '⛈️'; // Bão/Sấm sét
    return '🌥️';
}

// ============================================
// LOGIC HÀNH TRANG (PACKING LIST)
// ============================================
window.switchItineraryTab = switchItineraryTab = (tab) => {
    document.querySelectorAll('#page-itinerary .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-itinerary .sub-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#page-itinerary .tab:nth-child(${tab==='timeline'?1:2})`).classList.add('active');
    document.getElementById('subtab-' + tab).classList.add('active');
};

window.addSuggestedPackingItem = addSuggestedPackingItem = (name) => {
    if (!isEditor) return;
    if (!DATA.packingList) DATA.packingList = [];
    if (DATA.packingList.some(item => item && item.name === name)) {
        return showToast("Món này đã có trong checklist", "info");
    }
    DATA.packingList.push({ name, assignee: "Cả nhóm", isPacked: false });
    save(); autoSync(); renderPackingList();
    showToast("Đã thêm vào checklist", "success");
};

window.openPackingModal = openPackingModal = (idx = -1) => {
    if (!isEditor) return;
    const assigneeSelect = document.getElementById('packAssignee');
    const members = DATA.members || [];
    
    // Tự động tải danh sách thành viên vào dropdown để chia việc
    assigneeSelect.innerHTML = `<option value="Cả nhóm">Cả nhóm</option>` + 
        members.map(m => `<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');

    document.getElementById('packingIdx').value = idx;

    if (idx >= 0 && DATA.packingList && DATA.packingList[idx]) {
        document.getElementById('packName').value = DATA.packingList[idx].name;
        assigneeSelect.value = DATA.packingList[idx].assignee || 'Cả nhóm';
    } else {
        document.getElementById('packName').value = '';
        assigneeSelect.value = 'Cả nhóm';
    }
    openModal('packingModal');
};

window.savePackingItem = savePackingItem = () => {
    if (!isEditor) return;
    const idx = parseInt(document.getElementById('packingIdx').value);
    const name = document.getElementById('packName').value.trim();
    const assignee = document.getElementById('packAssignee').value;

    if (!name) return showToast("Vui lòng nhập tên món đồ", "error");
    if (!DATA.packingList) DATA.packingList = [];

    if (idx >= 0) {
        DATA.packingList[idx].name = name;
        DATA.packingList[idx].assignee = assignee;
    } else {
        DATA.packingList.push({ name, assignee, isPacked: false }); // Mặc định chưa chuẩn bị
    }

    save(); autoSync(); renderPackingList();
    closeModal('packingModal');
    showToast("Đã lưu hành trang", "success");
};

// Hàm bấm vào để tick ✅ chuẩn bị đồ
window.togglePackingItem = togglePackingItem = (idx) => {
    if (!isEditor) return showToast("Chỉ người có quyền Editor mới được tick", "error");
    if (!DATA.packingList) return;
    
    DATA.packingList[idx].isPacked = !DATA.packingList[idx].isPacked;
    save(); autoSync(); renderPackingList();
};

window.deletePackingItem = deletePackingItem = (idx) => {
    if (!isEditor || !confirm("Xóa món đồ này khỏi danh sách?")) return;
    DATA.packingList.splice(idx, 1);
    save(); autoSync(); renderPackingList();
};

window.renderPackingList = renderPackingList = (flash = false) => {
    const list = document.getElementById('packingListContainer');
    if (!list) return;

    const items = DATA.packingList || [];
    if (!items.length) {
        const theme = getTripTheme();
        const suggestions = theme.checklist.map(item => `<button class="suggestion-chip editor-only" onclick="addSuggestedPackingItem('${esc(item).replace(/'/g, "\\'")}')">${esc(item)}</button>`).join('');
        list.innerHTML = `
            <div class="empty" style="padding: 34px 18px; text-align: center; border: 1px dashed var(--accent); border-radius: 16px; background: var(--surface2);">
                <div class="theme-empty-art" style="width:64px;height:64px;font-size:2.2rem;border-radius:18px;">${theme.icon}</div>
                <div style="font-weight:800;color:var(--text);margin-bottom:6px;">Checklist gợi ý</div>
                <div style="font-size:.72rem;color:var(--text3);line-height:1.5;">Chọn nhanh vài món hợp vibe chuyến đi.</div>
                <div class="suggestion-chip-row">${suggestions}</div>
            </div>`;
        return;
    }

    const sortedItems = items.map((item, originalIndex) => ({...item, originalIndex}))
                             .sort((a, b) => (a.isPacked === b.isPacked) ? 0 : a.isPacked ? 1 : -1);

    list.innerHTML = sortedItems.map(item => {
        const i = item.originalIndex;
        return `
        <div class="swipe-container" style="margin-bottom: 8px;">
            <div class="swipe-actions editor-only">
                <button class="action-btn action-edit" onclick="openPackingModal(${i})">✎</button>
                <button class="action-btn action-delete" onclick="deletePackingItem(${i})">🗑️</button>
            </div>
            <div class="swipe-content payment-item" style="border-left: 4px solid ${item.isPacked ? 'var(--green)' : 'var(--accent)'}; padding: 0 !important; margin-bottom: 0; cursor: default; width: 100%; box-sizing: border-box;">
                
                <div style="display:flex; align-items:center; gap:12px; flex:1; cursor:pointer; padding: 12px 14px; opacity: ${item.isPacked ? '0.5' : '1'};" onclick="togglePackingItem(${i})">
                    <div style="width:24px; height:24px; border-radius:6px; border: 2px solid ${item.isPacked ? 'var(--green)' : 'var(--surface3)'}; background: ${item.isPacked ? 'var(--green)' : 'transparent'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${item.isPacked ? '<span style="color:#000; font-size:14px; font-weight:bold;">✓</span>' : ''}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size:.85rem; font-weight:600; text-decoration: ${item.isPacked ? 'line-through' : 'none'}; word-break: break-word;">
                            ${esc(item.name)}
                        </div>
                        <div style="font-size:.7rem; color:var(--text3); margin-top:4px;">
                            👤 Ai mang: <span style="color:var(--text2)">${esc(item.assignee || 'Cả nhóm')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    if (flash) list.classList.add('update-flash'), setTimeout(()=>list.classList.remove('update-flash'),700);
    setTimeout(window.initSwipeActions, 100);
};

// ============================================
// VÒNG QUAY NHÂN PHẨM 🎲
// ============================================

window.currentRandomMode = currentRandomMode = 'members';

window.openRandomModal = openRandomModal = () => {
    // Reset lại trạng thái mỗi khi mở lên
    document.getElementById('randResult').textContent = "Sẵn sàng!";
    document.getElementById('randResult').className = "random-display";
    document.getElementById('btnSpin').disabled = false;
    document.getElementById('btnSpin').innerHTML = "QUAY NGAY 🎯";
    switchRandomMode('members');
    openModal('randomModal');
};

window.switchRandomMode = switchRandomMode = (mode) => {
    window.currentRandomMode = currentRandomMode = mode;
    document.getElementById('tabRandMembers').classList.toggle('active', mode === 'members');
    document.getElementById('tabRandCustom').classList.toggle('active', mode === 'custom');
    document.getElementById('randCustomInput').style.display = mode === 'custom' ? 'block' : 'none';
    
    document.getElementById('randResult').textContent = "Sẵn sàng!";
    document.getElementById('randResult').className = "random-display";
};

window.spinRandomizer = spinRandomizer = () => {
    const display = document.getElementById('randResult');
    const btn = document.getElementById('btnSpin');

    let options = [];
    
    // Lấy dữ liệu từ tab tương ứng
    if (window.currentRandomMode === 'members') {
        if (!DATA.members || DATA.members.length === 0) {
            return showToast("Chưa có thành viên nào! Hãy thêm người trước.", "error");
        }
        options = DATA.members.map(m => m.name);
    } else {
        const val = document.getElementById('randOptions').value;
        options = val.split(',').map(s => s.trim()).filter(s => s);
        if (options.length < 2) {
            return showToast("Hãy nhập ít nhất 2 lựa chọn để quay!", "error");
        }
    }

    // Bắt đầu hiệu ứng quay
    btn.disabled = true;
    btn.innerHTML = "Đang quay... 🌀";
    display.className = "random-display spinning";

    let spins = 0;
    const maxSpins = 30; // Chạy qua 30 chữ
    let delay = 30;      // Tốc độ lướt chữ ban đầu cực nhanh

    const spinInterval = () => {
        // Nháy ngẫu nhiên liên tục
        const randomChoice = options[Math.floor(Math.random() * options.length)];
        display.textContent = randomChoice;

        spins++;
        if (spins < maxSpins) {
            delay += 6; // Chậm dần đều giống thật (Hiệu ứng phanh lại)
            setTimeout(spinInterval, delay);
        } else {
            // Chốt kết quả (Winner)
            const winner = options[Math.floor(Math.random() * options.length)];
            display.textContent = "🎉 " + winner + " 🎉";
            display.className = "random-display winner";
            
            btn.disabled = false;
            btn.innerHTML = "QUAY LẠI 🎲";
        }
    };

    spinInterval();
};

// ============================================
// QUẢN LÝ CHỌN AVATAR 🧑‍🎤
// ============================================
window.openAvatarModal = openAvatarModal = (i) => {
    document.getElementById('editAvatarMemIdx').value = i;
    const m = DATA.members[i];
    
    // Lấy seed hiện tại của user, nếu chưa có thì lấy Tên
    const currentSeed = m.avatarSeed || m.name;
    
    // Mở bảng và nạp hình vào preview
    window.selectAvatarSeed(currentSeed);
    openModal('avatarModal');
};

// Hàm khi bấm vào các icon có sẵn hoặc khi load preview
window.selectAvatarSeed = selectAvatarSeed = (seed) => {
    document.getElementById('currentAvatarSeed').value = seed;
    const url = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    document.getElementById('avatarPreview').src = url;
};

// Hàm bấm nút 🎲 Ngẫu nhiên
window.randomizeAvatarInModal = randomizeAvatarInModal = () => {
    // Tạo 1 seed random
    const randomSeed = 'avatar_' + Date.now() + Math.random();
    // Gán vào preview để xem thử
    window.selectAvatarSeed(randomSeed);
};

// Hàm bấm Lưu
window.saveAvatar = saveAvatar = () => {
    const i = parseInt(document.getElementById('editAvatarMemIdx').value);
    const seed = document.getElementById('currentAvatarSeed').value;
    
    // Lưu thẳng vào DATA
    DATA.members[i].avatarSeed = seed;
    save(); // Lưu máy cá nhân
    
    // ÉP ĐỒNG BỘ LÊN FIREBASE (Bỏ qua rào cản Viewer của hàm autoSync)
    if (firebaseConnected && window._firebaseDb && DATA.trip && DATA.trip.code) {
        document.getElementById('fbDot').className = 'firebase-dot syncing';
        window._fbSDK.set(window._fbSDK.ref(window._firebaseDb, `rooms/${DATA.trip.code}`), DATA)
            .then(() => {
                document.getElementById('fbDot').className = 'firebase-dot connected';
            })
            .catch(e => console.error("Lỗi sync avatar:", e));
    } else {
        autoSync(); // Fallback nếu đang dùng offline
    }
    
    renderCollection(); // Vẽ lại trang danh sách
    closeModal('avatarModal');
    showToast("Đã thay đồ thành công!", "success");
};

window.cancelAllSettings = cancelAllSettings = () => {
    // Gọi lại tất cả các hàm Hủy mà mình đã có sẵn
    if (typeof cancelEditName === 'function') cancelEditName();
    if (typeof cancelEditLoc === 'function') cancelEditLoc();
    if (typeof cancelEditCode === 'function') cancelEditCode();
};

window.togglePaymentPaid = togglePaymentPaid = async (i) => { // Thêm async
    if (!isEditor) return;
    const p = DATA.payments[i];
    const actionText = p.isPaid ? "chuyển về CHƯA THANH TOÁN" : "xác nhận ĐÃ THANH TOÁN";
    
    const ok = await window.niceConfirm("Đổi trạng thái", `Bạn muốn ${actionText} khoản "${p.desc}"?`, "warning");
    if (ok) {
        p.isPaid = !p.isPaid;
        renderCollection(); save(); autoSync(); 
        try { renderPayments(); renderItinerary(); } catch(e) { renderAll(); }
        showToast("Đã cập nhật trạng thái thành công", "success");
    }
};

window.toggleDayCollapse = toggleDayCollapse = (index) => {
    if (window.suppressNextDayClick) {
        window.suppressNextDayClick = suppressNextDayClick = false;
        return;
    }
    const el = document.getElementById(`day-section-${index}`);
    if (el) {
        el.classList.toggle('collapsed');
        const key = el.dataset.collapseKey;
        if (key) window.manualDayCollapseState[key] = el.classList.contains('collapsed');
    }
};

// === TRIP COUNTDOWN NÂNG CẤP ===
function updateTripCountdown() {
  const container = document.getElementById('trip-countdown');
  const statusEl = document.getElementById('countdown-status');
  const labelEl = document.getElementById('countdown-label');

  if (!DATA || !DATA.days || DATA.days.length === 0) {
    container.innerHTML = `<div style="font-size:0.75rem; color:var(--text3)">Chưa có lịch trình để đếm ngược</div>`;
    return;
  }

  // 1. LẤY NGÀY & GIỜ BẮT ĐẦU TỪ HOẠT ĐỘNG ĐẦU TIÊN
  const firstDay = DATA.days[0];
  const firstDayStr = firstDay.date; 
  const parts = firstDayStr.split('/');
  const dd = parseInt(parts[0]);
  const mm = parseInt(parts[1]) - 1; 
  
  let yyyy = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear();
  if (yyyy < 100) yyyy += 2000; 

  // Mặc định là 00:00 nếu không có hoạt động
  let targetHour = 0;
  let targetMinute = 0;
  
  // Tự động săn tìm giờ của hoạt động sớm nhất trong ngày đầu tiên
  if (firstDay.activities && firstDay.activities.length > 0) {
      const firstTime = firstDay.activities[0].time; // Lấy định dạng "HH:MM"
      if (firstTime && firstTime.includes(':')) {
          const tParts = firstTime.split(':');
          targetHour = parseInt(tParts[0]) || 0;
          targetMinute = parseInt(tParts[1]) || 0;
      }
  }

  // Gắn mốc thời gian chuẩn xác đến từng phút
  const targetDate = new Date(yyyy, mm, dd, targetHour, targetMinute, 0);
  const now = new Date();
  const diff = targetDate - now;

  if (isNaN(targetDate.getTime())) {
    container.innerHTML = `<div style="font-size:0.75rem; color:var(--red)">Định dạng ngày lỗi!</div>`;
    return;
  }

  // ==========================================
  // 2. NẾU ĐÃ ĐẾN GIỜ KHỞI HÀNH HOẶC TRÔI QUA
  // ==========================================
  if (diff <= 0) {
    // 🔑 BẢN VÁ: TÌM MỐC KẾT THÚC DỰA VÀO HOẠT ĐỘNG CUỐI CÙNG
    let endDayStr = DATA.days[DATA.days.length - 1].date;
    let endHour = 23;
    let endMinute = 59;

    // Quét ngược từ ngày cuối lên để tìm hoạt động chốt sổ
    for (let i = DATA.days.length - 1; i >= 0; i--) {
        const day = DATA.days[i];
        if (day.activities && day.activities.length > 0) {
            endDayStr = day.date; // Ngày kết thúc chính là ngày của hoạt động này
            const lastAct = day.activities[day.activities.length - 1]; // Hoạt động cuối cùng
            
            if (lastAct.time && lastAct.time.includes(':')) {
                const tParts = lastAct.time.split(':');
                endHour = parseInt(tParts[0]) || 23;
                endMinute = parseInt(tParts[1]) || 59;
            }
            break; // Tìm thấy hoạt động cuối cùng rồi thì dừng quét
        }
    }

    const lParts = endDayStr.split('/');
    const lDd = parseInt(lParts[0]);
    const lMm = parseInt(lParts[1]) - 1;
    
    let lYyyy = lParts.length === 3 ? parseInt(lParts[2]) : new Date().getFullYear();
    if (lYyyy < 100) lYyyy += 2000;
    
    // Set mốc kết thúc chính xác tới từng phút của hoạt động cuối cùng (cộng thêm 59 giây cho trọn vẹn phút đó)
    const tripEnd = new Date(lYyyy, lMm, lDd, endHour, endMinute, 59);
    
    if (now <= tripEnd) {
      container.innerHTML = `<div style="font-size:1.5rem; font-weight:800; color:var(--green)">🔥 ĐANG QUẨY !!!</div>`;
      statusEl.textContent = "Tận hưởng chuyến đi ngay thôi!";
      labelEl.textContent = "🚀 TRẠNG THÁI";
    } else {
      container.innerHTML = `<div style="font-size:1.2rem; color:var(--text3); font-weight:700">CHUYẾN ĐI ĐÃ KẾT THÚC</div>`;
      statusEl.textContent = "Hẹn gặp lại ở chuyến đi tới!";
      labelEl.textContent = "🏁 THÔNG BÁO";
    }
    return;
  }

  // ==========================================
  // 3. ĐẾM NGƯỢC THỜI GIAN
  // ==========================================
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  container.innerHTML = `
    <div class="countdown-unit"><div class="countdown-value">${days}</div><div class="countdown-sub">Ngày</div></div>
    <div class="countdown-unit"><div class="countdown-value">${hours}</div><div class="countdown-sub">Giờ</div></div>
    <div class="countdown-unit"><div class="countdown-value">${mins}</div><div class="countdown-sub">Phút</div></div>
    <div class="countdown-unit"><div class="countdown-value ${days === 0 ? 'trip-starting-soon' : ''}">${secs}</div><div class="countdown-sub">Giây</div></div>
  `;

  labelEl.textContent = "⏳ THỜI GIAN CHỜ ĐỢI";
  if (days > 7) statusEl.textContent = "Sắp xếp hành lý dần là vừa rồi đấy!";
  else if (days > 0) statusEl.textContent = "Sát nút rồi! Kiểm tra lại đồ đạc đi!";
  else statusEl.textContent = "🚨 CHUẨN BỊ XUẤT PHÁT TRONG VÀI GIỜ TỚI!";
}

// Chạy mỗi giây một lần
setInterval(updateTripCountdown, 1000);

// === ADD PAYMENT TO ACTIVITY ===
// Mở modal chọn hoạt động để gắn
window.openLinkToActModal = openLinkToActModal = (paymentIdx) => {
    if (!isEditor) return;
    const p = DATA.payments[paymentIdx];
    if (!p) return;

    document.getElementById('linkPmIdx').value = paymentIdx;
    document.getElementById('linkPmDescDisplay').textContent = p.desc || 'Chi tiêu';

    const selectEl = document.getElementById('linkActTarget');
    let optionsHtml = '';
    
    // Tạo danh sách các hoạt động từ lịch trình
    if (DATA.days && DATA.days.length > 0) {
        DATA.days.forEach((day, dIdx) => {
            if (day.activities && day.activities.length > 0) {
                // Thêm một option tiêu đề (disabled) cho ngày
                optionsHtml += `<optgroup label="${esc(day.title || `Ngày ${dIdx+1}`)} (${esc(day.date)})" style="background:var(--surface2); color:var(--text); padding:5px;">`;
                
                day.activities.forEach(act => {
                    // Kiểm tra xem hoạt động này đã có chi tiêu nào gắn vào chưa (chỉ nên gắn 1 chi tiêu cho 1 hoạt động để dễ quản lý, tuy nhiên tùy logic của bạn, ở đây cứ cho gắn thoải mái)
                    optionsHtml += `<option value="${act.id}" style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.05);">${act.time} - ${esc(act.name)}</option>`;
                });
                optionsHtml += `</optgroup>`;
            }
        });
    }

    if (optionsHtml === '') {
         selectEl.innerHTML = '<option value="" disabled>Chưa có hoạt động nào trong lịch trình</option>';
    } else {
         selectEl.innerHTML = optionsHtml;
    }

    openModal('linkToActModal');
};

// Lưu việc gắn liên kết
window.saveLinkToAct = saveLinkToAct = () => {
    if (!isEditor) return;
    
    const paymentIdxStr = document.getElementById('linkPmIdx').value;
    const paymentIdx = parseInt(paymentIdxStr, 10);
    const targetActId = document.getElementById('linkActTarget').value;

    if (isNaN(paymentIdx) || !DATA.payments[paymentIdx]) {
        return showToast("Lỗi: Không tìm thấy khoản chi tiêu!", "error");
    }

    if (!targetActId) {
        return showToast("Vui lòng chọn một hoạt động để gắn!", "error");
    }

    // Gán ID hoạt động
    DATA.payments[paymentIdx].linkedActId = targetActId;

    // Lưu và đồng bộ
    save(); 
    autoSync(); 
    
    // Chỉ cần vẽ lại 2 tab liên quan là Lịch trình và Chi tiêu
    try {
        renderPayments(); 
        renderItinerary(); 
    } catch(e) {
        renderAll();
    }
    
    closeModal('linkToActModal');
    
    showToast("Đã liên kết chi tiêu với hoạt động", "success");
};

// === LOGIC KÉO THẢ CHUỘT CHO PUBLIC GRID ===
const slider = document.getElementById('publicTripsList');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
  
  // Tạm tắt chế độ "hút dính" và "cuộn mượt" để chuột kéo bám sát tay hơn
  slider.style.scrollSnapType = 'none'; 
  slider.style.scrollBehavior = 'auto'; 
});

slider.addEventListener('mouseleave', () => {
  isDown = false;
  slider.classList.remove('is-dragging');
  // Bật lại chế độ mượt khi chuột rời đi
  slider.style.scrollSnapType = 'x mandatory';
  slider.style.scrollBehavior = 'smooth';
});

slider.addEventListener('mouseup', () => {
  isDown = false;
  slider.style.scrollSnapType = 'x mandatory';
  slider.style.scrollBehavior = 'smooth';
  
  // Đợi 50ms rồi mới gỡ class để không vô tình trigger sự kiện onclick của thẻ
  setTimeout(() => slider.classList.remove('is-dragging'), 50);
});

slider.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5; // Nhân 1.5 để tốc độ lướt nhanh hơn một chút
  
  // Nếu kéo rê chuột lớn hơn 5px thì tính là đang vuốt
  if (Math.abs(walk) > 5) {
      slider.classList.add('is-dragging');
  }
  
  slider.scrollLeft = scrollLeft - walk;
});

function save() { localStorage.setItem('tripData', JSON.stringify(DATA)); }
function formatVND(n) { return (n||0).toLocaleString('vi-VN') + 'đ'; }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
window.showToast = showToast = (msg, type = 'info') => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    if (toast.classList.contains('show') && toast.textContent === msg) {
        return; 
    }

    clearTimeout(window.toastTimer);
    toast.classList.remove('show', 'success', 'error', 'info');

    void toast.offsetWidth; 

    toast.textContent = msg;
    toast.classList.add(type, 'show');

    // --- THÊM DÒNG NÀY: Bấm vào là ẩn ngay ---
    toast.onclick = () => {
        toast.classList.remove('show');
        clearTimeout(window.toastTimer);
    };

    window.toastTimer = toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
};

// ============================================
// HÀM XỬ LÝ KHO LƯU TRỮ (PHOTO & FILE) - CLOUDINARY
// ============================================
// 1. Chuyển đổi qua lại giữa 2 tab
window.switchGalleryTab = switchGalleryTab = (tab) => {
    document.querySelectorAll('#page-gallery .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#page-gallery .sub-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#page-gallery .tab:nth-child(${tab==='image'?1:2})`).classList.add('active');
    document.getElementById('gallery-tab-' + tab).classList.add('active');
};

// 2. Nâng cấp hàm Upload (Thêm nhận diện Tab đích)
window.uploadToCloudinary = uploadToCloudinary = async (input, targetTab) => { 
    if (!isEditor) return;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    let customName = await window.nicePrompt("Tên hiển thị", `Nhập tên cho ${targetTab === 'image' ? 'ảnh' : 'file'} này:`, file.name);
    
    if (customName === null) {
        input.value = ""; 
        return; 
    }
    customName = customName.trim() || file.name;

    const isImage = file.type.startsWith('image/');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    showToast("Đang tải lên...", "info");

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
            method: 'POST', body: formData
        });
        const result = await response.json();

        if (!DATA.gallery) DATA.gallery = [];
        DATA.gallery.push({
            id: Date.now(),
            url: result.secure_url,
            name: customName, 
            type: file.type,
            isImage: isImage,
            tab: targetTab // Dán nhãn tab nó đang đứng
        });

        save(); autoSync(); renderGallery();
        showToast("Tải lên thành công!", "success");
        input.value = ""; 
    } catch (e) {
        showToast("Lỗi tải lên!", "error");
        input.value = "";
    }
};

// 3. Hàm Đẩy file sang Tab khác
window.moveGalleryItem = moveGalleryItem = async (id) => {
    if (!isEditor) return;
    const item = DATA.gallery.find(i => i.id === id);
    if (!item) return;

    // Xác định tab hiện tại (fallback cho data cũ)
    const currentTab = item.tab || (item.isImage ? 'image' : 'file');
    const targetTab = currentTab === 'image' ? 'file' : 'image';
    const tabName = targetTab === 'image' ? 'Kho Ảnh 🖼️' : 'Kho File 📁';

    const ok = await window.niceConfirm("Chuyển Tab?", `Đẩy "${item.name}" sang ${tabName}?`, "info");
    if (!ok) return;

    item.tab = targetTab;
    save(); autoSync(); renderGallery();
    showToast(`Đã chuyển sang ${tabName}`, "success");
};

// 4. Hàm Xóa (Chỉ Editor mới thấy nút xóa)
window.deleteGalleryItem = deleteGalleryItem = async (id) => { // Thêm async
    if (!isEditor) return;
    const ok = await window.niceConfirm("Xóa File?", "Bạn có chắc muốn xóa file này khỏi danh sách?", "danger");
    if (!ok) return;

    DATA.gallery = DATA.gallery.filter(item => item.id !== id);
    save();
    autoSync();
    renderGallery();
    showToast("Đã xóa khỏi danh sách!");
};

// 5. Hàm Vẽ giao diện (Viewer thấy nút tải về, Editor thấy nút xóa, Khóa khi Kết thúc)
window.renderGallery = renderGallery = () => {
    const imgContainer = document.getElementById('galleryImageContainer');
    const fileContainer = document.getElementById('galleryFileContainer');
    if (!imgContainer || !fileContainer) return;

    if (DATA.trip && DATA.trip.isFinished) {
        const lockHtml = `<div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; color:var(--text3); border: 1px dashed var(--surface3); border-radius:15px;"><div style="font-size: 2.5rem; margin-bottom:10px;">🔒</div><div style="font-weight:700; color:var(--text2)">CHUYẾN ĐI ĐÃ KẾT THÚC</div></div>`;
        imgContainer.innerHTML = lockHtml;
        fileContainer.innerHTML = lockHtml;
        return;
    }

    const items = DATA.gallery || [];
    
    // Tự động phân loại (Có hỗ trợ tương thích ngược với dữ liệu cũ chưa có nhãn 'tab')
    const imgItems = items.filter(i => (i.tab ? i.tab === 'image' : i.isImage));
    const fileItems = items.filter(i => (i.tab ? i.tab === 'file' : !i.isImage));

    // Bộ máy tạo HTML cho từng thẻ
    const generateHtml = (item) => {
        let previewHtml = "";
        if (item.isImage) {
            previewHtml = `
            <img src="${item.url}" style="width:100%; height:100%; object-fit:cover;" onclick="var e=arguments[0]||window.event; e.stopPropagation(); openLightbox('${item.url}')">
            <div style="position:absolute; bottom:26px; left:0; right:0; background:rgba(0,0,0,0.6); color:var(--text); font-size:0.55rem; padding:3px 5px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:none;">${esc(item.name)}</div>`;
        } else {
            let icon = "📄";
            if (item.type && item.type.includes('pdf')) icon = "📕";
            if (item.type && (item.type.includes('word') || item.type.includes('document'))) icon = "📘";
            previewHtml = `
            <div class="file-box" onclick="window.open('${item.url}', '_blank')" style="height: 100%; display: flex; flex-direction: column; justify-content: center; width: 100%; box-sizing: border-box; padding-bottom: 24px;">
                <div style="font-size:1.5rem;">${icon}</div>
                <div style="font-size:0.55rem; color:var(--text2); margin-top:4px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${esc(item.name)}</div>
            </div>`;
        }

        return `
        <div class="gallery-item">
            ${isEditor ? `
                <button class="btn-del-file" title="Xóa" onclick="deleteGalleryItem(${item.id})">✕</button>
                <button class="btn-move-file" title="Đổi Tab" onclick="moveGalleryItem(${item.id})">⇆</button>
            ` : ''}
            ${previewHtml}
            <a href="${item.url}" target="_blank" download="${item.name}" class="btn-download-file">Tải về ↓</a>
        </div>`;
    };

    // Đổ dữ liệu ra màn hình
    imgContainer.innerHTML = imgItems.length ? imgItems.map(generateHtml).join('') : '<div class="empty" style="grid-column: 1/-1;">Chưa có ảnh nào.</div>';
    fileContainer.innerHTML = fileItems.length ? fileItems.map(generateHtml).join('') : '<div class="empty" style="grid-column: 1/-1;">Chưa có tài liệu nào.</div>';
};

// Khai báo biến cờ để theo dõi trạng thái tải ảnh
window.isUploadingImage = isUploadingImage = false;

window.uploadReceipt = uploadReceipt = async (input, previewId, containerId, urlInputId) => {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    const container = document.getElementById(containerId);
    const urlInput = document.getElementById(urlInputId);

    // Cài đặt bối cảnh cho Container để chứa tia Laser
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Bơm tia Laser và Chữ Hacker vào nếu chưa có
    if (!container.querySelector('.cyber-scanner')) {
        container.insertAdjacentHTML('beforeend', '<div class="cyber-scanner"></div><div class="cyber-text">ĐANG TRÍCH XUẤT...</div>');
    }
    const textEl = container.querySelector('.cyber-text');

    // Hiện preview và Kích hoạt chế độ Quét
    preview.src = URL.createObjectURL(file);
    container.style.display = 'block';
    container.classList.add('scanning'); // Bật Laser
    window.isUploadingImage = isUploadingImage = true;
    window.playTing('success');

    // Hiệu ứng chữ Fake Loading cho ngầu
    const fakeText1 = setTimeout(() => { if(textEl) textEl.textContent = "PHÂN TÍCH DỮ LIỆU..."; window.playTing('success'); }, 1000);
    const fakeText2 = setTimeout(() => { if(textEl) textEl.textContent = "LỌC THAM SỐ KHỚP..."; window.playTing('success'); }, 2200);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
            method: 'POST', body: formData
        });
        const result = await response.json();
        
        if (result.secure_url) {
            urlInput.value = result.secure_url; 
            if(textEl) textEl.textContent = "✅ HOÀN TẤT!";
            window.playTing('success');
        } else {
            throw new Error("Không lấy được link ảnh");
        }
    } catch (e) {
        showToast("❌ Lỗi mạng, quét thất bại!", "error");
        container.style.display = 'none';
        urlInput.value = "";
    } finally {
        // Mở khóa và tắt hiệu ứng Laser sau 1 giây để người dùng đọc chữ "Hoàn tất"
        setTimeout(() => {
            container.classList.remove('scanning');
            clearTimeout(fakeText1); clearTimeout(fakeText2);
            window.isUploadingImage = isUploadingImage = false;
        }, 1000);
    }
};

window.uploadTripCover = uploadTripCover = async (input) => {
    if (!isEditor) return;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const preview = document.getElementById('tripCoverPreview');
    if (preview) {
        preview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
        window.isUploadingImage = isUploadingImage = true;
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!result.secure_url) throw new Error("Không lấy được link ảnh");

        if (!DATA.trip) DATA.trip = {};
        DATA.trip.coverUrl = result.secure_url;
        save();
        autoSync();
        renderAll();
        showToast("Đã cập nhật cover chuyến đi", "success");
    } catch (e) {
        updateTripCoverPreview();
        showToast("Upload cover thất bại", "error");
    } finally {
        window.isUploadingImage = isUploadingImage = false;
        input.value = "";
    }
};

window.removeTripCover = removeTripCover = async () => {
    if (!isEditor || !DATA || !DATA.trip) return;
    if (!DATA.trip.coverUrl) return showToast("Chưa có ảnh cover để xóa", "info");

    const ok = await window.niceConfirm("Xóa ảnh cover?", "Public trip sẽ dùng gradient theo vibe chuyến đi.", "warning");
    if (!ok) return;

    DATA.trip.coverUrl = "";
    save();
    autoSync();
    renderAll();
    showToast("Đã xóa ảnh cover", "info");
};

// Tạo lớp nền tối cho FAB
document.body.insertAdjacentHTML('beforeend', '<div class="fab-overlay" id="fabOverlay" onclick="toggleFab()"></div>');
document.body.insertAdjacentHTML('beforeend', `
  <div class="pull-refresh" id="pullRefreshIndicator">
    <div class="pull-refresh-icon">↻</div>
    <div class="pull-refresh-text">Kéo để làm mới</div>
  </div>
`);

window.toggleFab = toggleFab = () => {
    document.getElementById('fabContainer').classList.toggle('active');
    document.getElementById('fabOverlay').classList.toggle('active');
};

(() => {
    const threshold = 76;
    const maxPull = 120;
    let startY = 0;
    let startX = 0;
    let pullDistance = 0;
    let pulling = false;
    let refreshing = false;

    const indicator = () => document.getElementById('pullRefreshIndicator');
    const indicatorText = () => indicator()?.querySelector('.pull-refresh-text');

    const setIndicator = (distance, state = "pull") => {
        const el = indicator();
        if (!el) return;
        const eased = Math.min(distance, maxPull);
        el.classList.add('visible');
        el.classList.toggle('ready', distance >= threshold);
        el.classList.toggle('loading', state === "loading");
        el.style.transform = `translate(-50%, ${Math.max(-80, eased - 70)}px)`;
        const text = indicatorText();
        if (text) {
            text.textContent = state === "loading"
                ? "Đang làm mới..."
                : (distance >= threshold ? "Thả để làm mới" : "Kéo để làm mới");
        }
    };

    const hideIndicator = () => {
        const el = indicator();
        if (!el) return;
        el.classList.remove('visible', 'ready', 'loading');
        el.style.transform = 'translate(-50%, -80px)';
    };

    const canStartPull = (target) => {
        if (!DATA || refreshing) return false;
        if (window.scrollY > 0) return false;
        if (document.querySelector('.modal-overlay.open')) return false;
        if (target.closest('input, textarea, select, button, label, summary, .swipe-content, .lightbox-overlay')) return false;
        return true;
    };

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || !canStartPull(e.target)) return;
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        pullDistance = 0;
        pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pulling || e.touches.length !== 1) return;
        const diffY = e.touches[0].clientY - startY;
        const diffX = Math.abs(e.touches[0].clientX - startX);

        if (diffY <= 0 || diffX > diffY * 0.8) {
            pulling = false;
            hideIndicator();
            return;
        }

        pullDistance = diffY * 0.55;
        setIndicator(pullDistance);
        if (pullDistance > 8) e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', async () => {
        if (!pulling) return;
        pulling = false;

        if (pullDistance < threshold) {
            hideIndicator();
            return;
        }

        refreshing = true;
        setIndicator(threshold, "loading");
        try {
            if (typeof window.refreshCurrentTrip === 'function') {
                await window.refreshCurrentTrip();
            } else if (typeof renderAll === 'function') {
                renderAll(true);
            }
        } finally {
            setTimeout(() => {
                refreshing = false;
                pullDistance = 0;
                hideIndicator();
            }, 450);
        }
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
        pulling = false;
        if (!refreshing) hideIndicator();
    }, { passive: true });
})();

// --- ZOOM & LOCK LIGHTBOX BẢN PRO ---
let lbScale = 1, lbPanningX = 0, lbPanningY = 0;
let lbStartX = 0, lbStartY = 0, lbStartDistance = 0;
let lbIsDragging = false;
let scrollPosBeforeLightbox = 0;

const lbOverlay = document.getElementById('appLightbox');
const lbImg = document.getElementById('lightboxImg');

window.openLightbox = openLightbox = (url) => {
    // 1. Khóa cứng nền đằng sau
    scrollPosBeforeLightbox = window.pageYOffset;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosBeforeLightbox}px`;
    document.body.style.width = '100%';

    lbImg.src = url;
    lbOverlay.classList.add('show');
    resetLightboxZoom();
};

window.closeLightbox = closeLightbox = () => {
    lbOverlay.classList.remove('show');
    setTimeout(() => lbImg.src = '', 300);

    // 2. Mở khóa nền đằng sau
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('width');
    window.scrollTo(0, scrollPosBeforeLightbox);
};

function resetLightboxZoom() {
    lbScale = 1; lbPanningX = 0; lbPanningY = 0;
    lbImg.style.transition = 'transform 0.3s ease';
    lbImg.style.transform = `translate(0px, 0px) scale(1)`;
}

// Ngăn đóng modal khi bấm nhầm vào ảnh
lbImg.onclick = (e) => e.stopPropagation();
// Đóng khi click ra ngoài nền đen (Ghi đè HTML cũ)
lbOverlay.onclick = (e) => {
    if (e.target === lbOverlay) window.closeLightbox();
};

// --- LOGIC CẢM ỨNG ĐA ĐIỂM (ZOOM & PAN) ---
lbOverlay.addEventListener('touchstart', (e) => {
    // 🔑 Bỏ qua nếu đang bấm vào nút X
    if (e.target.closest('.lightbox-close')) return;
    
    if (e.touches.length === 2) {
        lbImg.style.transition = 'none'; 
        lbStartDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    } else if (e.touches.length === 1 && lbScale > 1) {
        lbIsDragging = true;
        lbImg.style.transition = 'none';
        lbStartX = e.touches[0].clientX - lbPanningX;
        lbStartY = e.touches[0].clientY - lbPanningY;
    }
}, {passive: false});

lbOverlay.addEventListener('touchmove', (e) => {
    // 🔑 MẤU CHỐT Ở ĐÂY: Nếu chạm nút X, không được khóa hành vi để bảo toàn lệnh Click
    if (e.target.closest('.lightbox-close')) return;

    e.preventDefault(); // KHÓA CỨNG SCROLL NỀN KHI VUỐT ẢNH
    if (e.touches.length === 2) {
        const currentDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        let newScale = lbScale * (currentDistance / lbStartDistance);
        newScale = Math.max(1, Math.min(newScale, 5));
        lbImg.style.transform = `translate(${lbPanningX}px, ${lbPanningY}px) scale(${newScale})`;
    } else if (e.touches.length === 1 && lbIsDragging && lbScale > 1) {
        lbPanningX = e.touches[0].clientX - lbStartX;
        lbPanningY = e.touches[0].clientY - lbStartY;
        lbImg.style.transform = `translate(${lbPanningX}px, ${lbPanningY}px) scale(${lbScale})`;
    }
}, {passive: false});

lbOverlay.addEventListener('touchend', (e) => {
    // 🔑 Bỏ qua nếu đang bấm vào nút X
    if (e.target.closest('.lightbox-close')) return;
    
    lbIsDragging = false;
    if (e.touches.length === 0) {
        const transform = lbImg.style.transform;
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        if (scaleMatch) lbScale = parseFloat(scaleMatch[1]);

        if (lbScale <= 1) {
            resetLightboxZoom();
        }
    }
});

// Thêm một biến toàn cục ở đầu script để nhớ vị trí cuộn
let scrollPos = 0;

// 🔧 BẢN VÁ LỖI "MODAL NHỚ VỊ TRÍ CUỘN CŨ": Đưa modal (và mọi danh sách cuộn lồng bên trong,
// ví dụ #historyList, #advanceOverviewList, #dayExpenseList...) về lại vị trí cuộn mặc định
// (đầu trang) mỗi khi mở, thay vì giữ nguyên vị trí đã cuộn từ lần mở trước đó.
function resetModalScroll(overlayEl) {
    if (!overlayEl) return;
    const sheet = overlayEl.querySelector('.modal') || overlayEl;
    sheet.scrollTop = 0;
    sheet.querySelectorAll('*').forEach(el => {
        if (el.scrollHeight - el.clientHeight > 1) el.scrollTop = 0;
    });
}

function openModal(id) { 
    if (document.getElementById('fabContainer').classList.contains('active')) {
        toggleFab(); 
    }

    // 🔑 BẢN VÁ LỖI NHẢY NỀN: Chỉ khóa nền nếu CHƯA CÓ Modal nào đang mở
    if (!document.body.classList.contains('modal-open')) {
        scrollPos = window.pageYOffset; 
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPos}px`;
        document.body.style.width = '100%';
        document.body.classList.add('modal-open'); 
    }

    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('open'); 
        // Luôn trả modal (và các list bên trong) về vị trí cuộn mặc định mỗi lần mở
        resetModalScroll(modal);
    }
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open'); 

    // Dọn ảnh Form Thêm
    if (id === 'paymentModal') {
        if(document.getElementById('pmPreviewContainer')) document.getElementById('pmPreviewContainer').style.display = 'none';
        if(document.getElementById('pmReceiptPreview')) document.getElementById('pmReceiptPreview').src = '';
    }
    
    // Dọn ảnh Form Sửa
    if (id === 'editPaymentModal') {
        if(document.getElementById('editPmPreviewContainer')) document.getElementById('editPmPreviewContainer').style.display = 'none';
        if(document.getElementById('editPmReceiptPreview')) document.getElementById('editPmReceiptPreview').src = '';
        if(document.getElementById('btnEditPmRemove')) document.getElementById('btnEditPmRemove').style.display = 'none';
    }

    // 🔑 BẢN VÁ LỖI KẸT NÚT: Chỉ nhả khóa nền nếu KHÔNG CÒN Modal nào đang hiện trên màn hình
    const openModals = document.querySelectorAll('.modal-overlay.open');
    if (openModals.length === 0) {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('top');
        document.body.style.removeProperty('width');
        document.body.classList.remove('modal-open'); 
        window.scrollTo(0, scrollPos);
    }
}

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => {
      
      // --- 🧹 BẢN VÁ: Tự động đóng tất cả các thẻ đang bị vuốt dở ---
      document.querySelectorAll('.swipe-content').forEach(el => {
          el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
          el.style.transform = 'translateX(0)'; // Ép chạy về vị trí 0
      });
      // -------------------------------------------------------------

      document.querySelectorAll('.nav-item, .page').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
      currentPage = btn.dataset.page;
      
      if (currentPage === 'gallery' && typeof window.renderGallery === 'function') {
          window.renderGallery();
      }
      if (currentPage === 'today' && typeof window.renderTodayView === 'function') {
          window.renderTodayView();
      }
      if (currentPage === 'payment' && typeof window.renderPayments === 'function') {
          window.renderPayments(); // 🔧 Luôn tính lại từ đầu để Dashboard/cảnh báo Quỹ chung không bị cũ
      }

      // THÊM ĐÚNG 1 DÒNG NÀY ĐỂ KÍCH HOẠT VUỐT MỌI LÚC MỌI NƠI
      setTimeout(window.initSwipeActions, 100);

      window.triggerSwipeHint();
    };
  });
}

// --- 🚀 HỆ THỐNG DIALOG HIỆN ĐẠI (BẢN VÁ LỖI BÀN PHÍM VĨNH VIỄN) ---
window.openSettingsPage = openSettingsPage = () => {
  document.querySelectorAll('.swipe-content').forEach(el => {
      el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      el.style.transform = 'translateX(0)';
  });
  document.querySelectorAll('.nav-item, .page').forEach(el => el.classList.remove('active'));
  const settingsPage = document.getElementById('page-settings');
  if (settingsPage) settingsPage.classList.add('active');
  currentPage = 'settings';
  if (window.updateManagementUI) window.updateManagementUI();
  refreshGeminiKeyUI();
};

window.niceConfirm = niceConfirm = (title, text, type = 'danger') => {
    return new Promise((resolve) => {
        const dialog = document.getElementById('niceDialog');
        const icon = document.getElementById('dialogIcon');
        const btnConfirm = document.getElementById('dialogBtnConfirm');
        
        icon.textContent = type === 'danger' ? '🗑️' : '❓';
        btnConfirm.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
        btnConfirm.textContent = type === 'danger' ? 'Xóa luôn' : 'Đồng ý';
        
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogText').textContent = text;
        document.getElementById('dialogPromptArea').style.display = 'none';

        // Trả lại vị trí ban đầu trước khi mở
        const dialogCard = dialog.querySelector('.dialog-card');
        dialogCard.style.transform = 'translateY(0)';
        dialogCard.style.transition = 'transform 0.3s ease';

        dialog.classList.add('open');

        const wasAlreadyLocked = document.body.classList.contains('modal-open');
        if (!wasAlreadyLocked) {
            window.dialogScrollPos = dialogScrollPos = window.pageYOffset;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.dialogScrollPos}px`;
            document.body.style.width = '100%';
            document.body.classList.add('modal-open');
        }

        const closeDialog = (result) => {
            dialog.classList.remove('open'); 
            if (!wasAlreadyLocked) {
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('position');
                document.body.style.removeProperty('top');
                document.body.style.removeProperty('width');
                document.body.classList.remove('modal-open');
                window.scrollTo(0, window.dialogScrollPos);
            }
            resolve(result);
        };

        dialog.onclick = (e) => { if (e.target === dialog) closeDialog(false); };
        btnConfirm.onclick = () => closeDialog(true);
        document.getElementById('dialogBtnCancel').onclick = () => closeDialog(false);
    });
};

window.nicePrompt = nicePrompt = (title, text, defaultValue = '') => {
    return new Promise((resolve) => {
        const dialog = document.getElementById('niceDialog');
        document.getElementById('dialogIcon').textContent = '💬';
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogText').textContent = text;
        
        const inputArea = document.getElementById('dialogPromptArea');
        const input = document.getElementById('dialogInput');
        inputArea.style.display = 'block';
        input.value = defaultValue;
        
        const btnConfirm = document.getElementById('dialogBtnConfirm');
        btnConfirm.className = 'btn btn-primary';
        btnConfirm.textContent = 'Xác nhận';

        const dialogCard = dialog.querySelector('.dialog-card');
        // Reset transform để trình duyệt tự do canh giữa
        dialogCard.style.transform = 'none';
        dialogCard.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

        dialog.classList.add('open');

        // KHÓA CUỘN NỀN
        const wasAlreadyLocked = document.body.classList.contains('modal-open');
        if (!wasAlreadyLocked) {
            window.dialogScrollPos = dialogScrollPos = window.pageYOffset;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.dialogScrollPos}px`;
            document.body.style.width = '100%';
            document.body.classList.add('modal-open');
        }

        // ==========================================
        // Đã xóa bộ nhận diện Touch & Focus đẩy -12vh
        // Để nhường việc đẩy khung cho trình duyệt gốc của điện thoại lo
        // ==========================================

        input.setAttribute('autocomplete', 'off');
        input.focus(); 

        const closeDialog = (result) => {
            dialog.classList.remove('open'); 
            if (!wasAlreadyLocked) {
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('position');
                document.body.style.removeProperty('top');
                document.body.style.removeProperty('width');
                document.body.classList.remove('modal-open');
                window.scrollTo(0, window.dialogScrollPos);
            }
            resolve(result);
        };

        dialog.onclick = (e) => { if (e.target === dialog) closeDialog(null); };
        btnConfirm.onclick = () => closeDialog(input.value);
        document.getElementById('dialogBtnCancel').onclick = () => closeDialog(null);
    });
};

// --- 🔊 HỆ THỐNG PHẢN HỒI XÚC GIÁC & ÂM THANH ---
window.playTing = playTing = (type = 'success') => {
    // 1. Rung điện thoại
    if (navigator.vibrate) {
        if (type === 'success') navigator.vibrate(50);
        else if (type === 'error') navigator.vibrate([50, 100, 50]);
        else navigator.vibrate(30);
    }

    // 2. Tiếng Ting Ting (Dùng Web Audio API, không cần file mp3)
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'success' ? 880 : 440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
};

// --- BỘ NÃO CỦA TRIPPY ISLAND ---
window.toggleIsland = toggleIsland = () => {
    const island = document.getElementById('trippy-island');
    const overlay = document.getElementById('island-overlay');
    if (!island || !overlay) return;

    const isExpanded = island.classList.toggle('expanded');
    
    if (isExpanded) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
    } else {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        // TRẢ VỀ MẶC ĐỊNH NGAY LẬP TỨC KHI ĐÓNG ISLAND LẠI
        island.classList.remove('notif');
        if (typeof window.updateSmartIsland === 'function') window.updateSmartIsland();
        if (typeof window.loadWeatherForItinerary === 'function') window.loadWeatherForItinerary();
    }
};

window.updateIsland = updateIsland = (type, mainText, icon = getTripTheme().icon) => {
    const island = document.getElementById('trippy-island');
    const mainEl = document.getElementById('island-main-content');
    const iconEl = document.getElementById('island-icon');

    if (!island || !mainEl || !iconEl) return;
    if (island.classList.contains('expanded')) return;

    mainEl.style.opacity = '0';
    iconEl.style.opacity = '0';
    
    setTimeout(() => {
        mainEl.textContent = mainText; 
        iconEl.innerHTML = icon;
        mainEl.style.opacity = '1';
        iconEl.style.opacity = '1';
        
        if (type === 'notif') {
            island.classList.add('notif');
            
            // TỰ ĐỘNG THU DỌN VÀ TRẢ VỀ DEFAULT UI SAU 15 GIÂY
            setTimeout(() => {
                island.classList.remove('notif');
                
                if (!island.classList.contains('expanded')) {
                    mainEl.style.opacity = '0';
                    iconEl.style.opacity = '0';
                    
                    setTimeout(() => {
                        mainEl.textContent = (DATA && DATA.trip) ? DATA.trip.name : 'Trippy';
                        iconEl.innerHTML = getTripTheme().icon;
                        mainEl.style.opacity = '1';
                        iconEl.style.opacity = '1';
                        if (typeof window.loadWeatherForItinerary === 'function') window.loadWeatherForItinerary();
                    }, 300);
                }
            }, 15000); 
        }
    }, 300);
};

// Gắn an toàn vào hàm renderAll gốc để không làm crash App
const __originalRenderAllIsland = window.renderAll;
window.renderAll = renderAll = (flash) => {
    if (typeof __originalRenderAllIsland === 'function') {
        __originalRenderAllIsland(flash);
    }
    if (DATA && DATA.trip && DATA.trip.name) {
        window.updateIsland('default', DATA.trip.name, getTripTheme().icon);
    }
    setTimeout(window.updateSmartIsland, 500);
};

// --- 🧠 LOGIC NHẮC TUỒNG THÔNG MINH (BẢN TỐI ƯU GIAO DIỆN) ---
window.updateSmartIsland = updateSmartIsland = () => {
    const mainEl = document.getElementById('island-main-content');
    const island = document.getElementById('trippy-island');
    
    if (DATA && DATA.trip && DATA.trip.name && mainEl && island && !island.classList.contains('notif')) {
        mainEl.textContent = DATA.trip.name;
    }

    if (!DATA || !DATA.days || DATA.days.length === 0) return;

    const subEl = document.getElementById('island-sub-content');
    if (!subEl) return;

    const oldPrompter = document.getElementById('island-prompter');
    if (oldPrompter) oldPrompter.remove();

    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const todayStr = now.getDate().toString().padStart(2, '0') + "/" + (now.getMonth() + 1).toString().padStart(2, '0');
    const todayData = DATA.days.find(d => d.date.startsWith(todayStr));

    if (!todayData || !todayData.activities || todayData.activities.length === 0) return;

    const acts = [...todayData.activities].sort((a, b) => a.time.localeCompare(b.time));
    let currentAct = null; let nextAct = null;

    for (let i = 0; i < acts.length; i++) {
        if (acts[i].time <= currentHHMM) {
            currentAct = acts[i]; nextAct = acts[i + 1] || null;
        } else {
            if (!currentAct) nextAct = acts[i];
            break;
        }
    }

    let promptHtml = '';
    if (currentAct) {
        promptHtml = `
            <div style="font-size: 0.8rem; color: var(--text); font-weight: 700; margin-bottom: 4px; white-space: normal;">
                <span style="color:var(--green)">●</span> Đang diễn ra: ${esc(currentAct.name)}
            </div>`;
        if (nextAct) {
            promptHtml += `
            <div style="font-size: 0.65rem; color: var(--text2); white-space: normal;">
                🔜 Tiếp theo (${esc(nextAct.time)}): ${esc(nextAct.name)}
            </div>`;
        }
    } else if (nextAct) {
        promptHtml = `
            <div style="font-size: 0.8rem; color: var(--text); font-weight: 700; margin-bottom: 4px; white-space: normal;">
                🔜 Sắp tới (${esc(nextAct.time)}): ${esc(nextAct.name)}
            </div>`;
    }

    if (promptHtml !== '') {
        const prompterDiv = document.createElement('div');
        prompterDiv.id = 'island-prompter';
        prompterDiv.style = "background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; margin-bottom: 5px; text-align: left; border: 1px solid rgba(255,255,255,0.05); width: 100%; box-sizing: border-box;";
        prompterDiv.innerHTML = promptHtml;
        subEl.prepend(prompterDiv);
    }
};

// Vẫn giữ vòng lặp mỗi phút để cập nhật giờ chuẩn
setInterval(window.updateSmartIsland, 60000);

// --- BẢN VÁ LỖI VUỐT (ĐO LẠI KÍCH THƯỚC ĐỘNG NGAY LÚC CHẠM) ---
window.initSwipeActions = initSwipeActions = () => {
    document.querySelectorAll('.swipe-content').forEach(el => {
        // Chống gán sự kiện nhiều lần gây lag
        if (el.dataset.swipeInited) return;
        el.dataset.swipeInited = 'true';

        el.style.userSelect = 'none';
        el.style.WebkitUserSelect = 'none';

        const actionsEl = el.previousElementSibling;
        
        let startX = 0, startY = 0, currentX = 0, currentY = 0;
        let isDragging = false;
        let isHorizontalSwipe = false;
        
        // Khởi tạo biến lưu giới hạn
        let maxSwipe = -110; 
        let limitSwipe = -120;

        const startDrag = (clientX, clientY = 0) => {
            if (!isEditor) return;
            
            // 🧠 AI ĐO LƯỜNG TỰ ĐỘNG: Chuyển việc đo kích thước vào ngay lúc chạm tay
            // Đảm bảo không bao giờ bị đo sai do DOM chưa load kịp
            if (actionsEl && actionsEl.classList.contains('swipe-actions')) {
                const actionsWidth = actionsEl.offsetWidth;
                if (actionsWidth > 0) {
                    maxSwipe = -(actionsWidth + 8); // Kéo ra vừa khít
                    limitSwipe = -(actionsWidth + 25); // Kéo lố ra thêm chút xíu cho có độ nảy
                }
            }

            isDragging = true;
            isHorizontalSwipe = false;
            startX = clientX;
            startY = clientY;
            currentX = startX;
            currentY = startY;
            el.style.transition = 'none';
            el.style.animation = 'none'; 
        };

        const doDrag = (clientX, clientY = startY) => {
            if (!isDragging) return;
            currentX = clientX;
            currentY = clientY;
            let diffX = currentX - startX;
            let diffY = currentY - startY;
            
            if (Math.abs(diffX) > 8 && Math.abs(diffX) > Math.abs(diffY)) {
                isHorizontalSwipe = true;
                if (el.classList.contains('day-header')) window.suppressNextDayClick = suppressNextDayClick = true;
            }
            
            // Áp dụng giới hạn đo lường tự động
            if (diffX < 0 && diffX >= limitSwipe) {
                el.style.transform = `translateX(${diffX}px)`;
            }
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            
            el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            let finalDiff = currentX - startX;
            // Kéo qua mốc 40px -> Mở tung khay nút
            if (finalDiff < -40) {
                el.style.transform = `translateX(${maxSwipe}px)`;
                if (el.classList.contains('day-header') || isHorizontalSwipe) {
                    window.suppressNextDayClick = suppressNextDayClick = true;
                }
            } else {
                el.style.transform = 'translateX(0)';
            }
        };

        // PC
        el.addEventListener('mousedown', e => { if (e.button === 0) startDrag(e.clientX, e.clientY); });
        el.addEventListener('mousemove', e => doDrag(e.clientX, e.clientY));
        el.addEventListener('mouseleave', endDrag);
        el.addEventListener('mouseup', endDrag);

        // Mobile
        el.addEventListener('touchstart', e => startDrag(e.touches[0].clientX, e.touches[0].clientY), {passive: true});
        el.addEventListener('touchmove', e => doDrag(e.touches[0].clientX, e.touches[0].clientY), {passive: true});
        el.addEventListener('touchend', endDrag);
        el.addEventListener('touchcancel', endDrag);
    });
};

// --- LOGIC VUỐT ĐỂ ĐÓNG (SWIPE-TO-CLOSE) ---
let startY = 0;
let currentY = 0;
let isDragging = false;
let dragStarted = false; // Cờ xác nhận ngón tay đã thực sự kéo

// 🔧 BẢN VÁ LỖI "SCROLL NHẦM THÀNH ĐÓNG MODAL":
// Nhiều modal (sao kê, ứng tiền, chi tiêu theo ngày/tổng...) có danh sách con cuộn RIÊNG
// (vd #historyList, #advanceOverviewList, #dayExpenseList, #totalExpenseList...) nằm lồng
// bên trong khung .modal ngoài cùng. Trước đây code chỉ kiểm tra modal.scrollTop (khung ngoài),
// mà khung ngoài gần như không bao giờ tự cuộn (chỉ list con bên trong mới cuộn), nên dù đang
// ở cuối danh sách con, modal.scrollTop vẫn = 0 → hệ thống tưởng nhầm là "đang ở đầu trang"
// và cho phép vuốt-để-đóng, khiến thao tác cuộn ngược lên bị hiểu lầm thành đóng modal.
// Hàm dưới đây kiểm tra TOÀN BỘ vùng cuộn (khung ngoài + mọi list lồng bên trong):
// chỉ khi tất cả đều đang ở đúng vị trí trên cùng thì mới cho phép vuốt để đóng.
function isModalContentScrolled(modal) {
    if (modal.scrollTop > 0) return true;
    const children = modal.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (el.scrollHeight - el.clientHeight > 1 && el.scrollTop > 0) return true;
    }
    return false;
}

function initDraggableModals() {
    // 1. XỬ LÝ KÉO XUỐNG ĐỂ ĐÓNG (SWIPE-TO-CLOSE)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('touchstart', (e) => {
            // Hàng rào bảo vệ: Bỏ qua tất cả các nút, ô nhập liệu, tên thành viên, checkbox...
            if (e.target.closest('input, textarea, select, button, label, summary, .form-section-header, .participant-chip, .tab, .option-group, .chip-checkbox')) {
                isDragging = false;
                return;
            }

            // Chỉ cho phép kéo-để-đóng khi TOÀN BỘ vùng cuộn (kể cả list con lồng bên trong)
            // đang ở tận cùng phía trên. Nếu bất kỳ vùng nào đã cuộn xuống thì để nguyên cho
            // trình duyệt cuộn nội dung bình thường, không cho vuốt-để-đóng.
            if (isModalContentScrolled(modal)) {
                isDragging = false;
                return;
            }

            startY = e.touches[0].clientY;
            currentY = startY; 
            isDragging = true;
            dragStarted = false; 
        }, { passive: true });

        modal.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            // CHỐNG RUNG TAY: Phải vuốt xuống hơn 15px mới tính là kéo (Ngăn lỗi tap nhầm)
            if (!dragStarted && diff > 15) {
                // Kiểm tra lại lần nữa ngay trước khi thực sự bắt đầu kéo: phòng trường hợp
                // trong cùng một cú chạm, người dùng đã cuộn list con ra khỏi vị trí đầu
                // (vd: cuộn xuống rồi đổi hướng cuộn lên lại trong cùng 1 lần chạm).
                if (isModalContentScrolled(modal)) {
                    isDragging = false;
                    return;
                }
                dragStarted = true;
                modal.classList.add('dragging');
            }

            if (dragStarted && diff > 0) {
                if (e.cancelable) e.preventDefault(); // Cản trình duyệt cuộn dọc
                modal.style.transform = `translateY(${diff}px)`;
                
                const overlay = modal.parentElement;
                const opacity = Math.max(0, 0.6 - (diff / 400));
                overlay.style.backgroundColor = `rgba(0,0,0,${opacity})`;
            }
        }, { passive: false });

        modal.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            if (dragStarted) {
                modal.classList.remove('dragging');
                const diff = currentY - startY;
                const overlay = modal.parentElement;

                // Kéo mạnh qua 100px thì mới đóng
                if (diff > 100) {
                    closeModal(overlay.id);
                    setTimeout(() => {
                        modal.style.transform = '';
                        overlay.style.backgroundColor = '';
                    }, 300);
                } else {
                    // Kéo nhẹ thì nảy về vị trí cũ
                    modal.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    modal.style.transform = 'translateY(0)';
                    overlay.style.backgroundColor = '';
                    setTimeout(() => { modal.style.transition = ''; }, 300);
                }
            }
            
            dragStarted = false;
            startY = 0;
            currentY = 0;
        });
    });

    // 2. XỬ LÝ CHẠM RA NGOÀI ĐỂ ĐÓNG (CLICK OUTSIDE)
    // Khắc phục triệt để lỗi ấn nhầm viền modal bị văng do "Ghost Click"
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        // Trả về sự kiện 'click' để nó hút trọn vẹn chuỗi hành động chạm
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Hai dòng này là khiên chắn, chặn đứng mọi luồng click rò rỉ xuống dưới
                e.preventDefault();
                e.stopPropagation();
                closeModal(overlay.id);
            }
        });
    });
}

// Gọi hàm này ngay trong init() hoặc sau khi load trang
setTimeout(initDraggableModals, 1000);

// ============================================
// PWA & TỰ ĐỘNG ĐỒNG BỘ KHI CÓ MẠNG LẠI
// ============================================

// 1. Đăng ký Service Worker (Trợ lý chạy ngầm)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA: Đã đăng ký thành công!'))
            .catch(err => console.log('PWA: Lỗi đăng ký', err));
    });
}

// 2. Lắng nghe khi điện thoại CÓ MẠNG lại
window.addEventListener('online', () => {
    showToast("Đã có mạng! Đang kết nối lại...", "info");
    document.getElementById('fbDot').className = 'firebase-dot syncing';
    document.getElementById('fbStatus').textContent = "Connecting...";
    
    // Đợi hẳn 3 giây để DNS và đường truyền thực sự ổn định
    setTimeout(async () => {
        if (!window._firebaseDb) {
            if (typeof window.connectFirebase === 'function') {
                window.connectFirebase(true);
            }
        } else {
            // Ép UI về trạng thái Online nếu Firebase tự động phục hồi ngầm thành công
            document.getElementById('fbDot').className = 'firebase-dot connected';
            document.getElementById('fbStatus').textContent = "Online";
            if (typeof autoSync === 'function') autoSync();
            showToast("Đã đồng bộ dữ liệu mới nhất!", "success");
        }
    }, 3000); 
});

// 3. Lắng nghe khi điện thoại MẤT MẠNG
window.addEventListener('offline', () => {
    document.getElementById('fbDot').className = 'firebase-dot syncing';
    document.getElementById('fbStatus').textContent = "Offline";
    showToast("Bạn đang offline. Mọi thay đổi sẽ lưu an toàn trên máy.", "warning");
});

// Thêm một hàm "fail-safe" để reset trạng thái nếu bị treo quá lâu
setInterval(() => {
    const status = document.getElementById('fbStatus').textContent;
    if (status === "Đang lưu..." || status === "Đang kết nối...") {
        // Nếu treo quá 10 giây ở trạng thái này thì tự đưa về Online/Offline thực tế
        const dot = document.getElementById('fbDot');
        if (navigator.onLine) {
            dot.className = 'firebase-dot connected';
            document.getElementById('fbStatus').textContent = "Online";
        }
    }
}, 10000);

// --- 💡 THỦ THUẬT PEEKING (NHÁ HÀNG VUỐT) CHUẨN APPLE ---
window.triggerSwipeHint = triggerSwipeHint = () => {
    if (!isEditor) return; // Chỉ nhá hàng cho Admin
    
    // 1. KHOANH VÙNG TUYỆT ĐỐI: Chỉ tìm đúng khu vực danh sách Lịch trình
    const timelineTab = document.getElementById('subtab-timeline');
    
    // 2. CHỐT CHẶN: Nếu tab Lịch trình đang KHÔNG hiển thị trên màn hình -> HỦY LUÔN
    if (!timelineTab || timelineTab.offsetParent === null) return;
    
    // 3. Chỉ lấy chính xác cái thẻ hoạt động đầu tiên của Lịch trình
    const firstSwipeItem = timelineTab.querySelector('.swipe-content');
    
    if (firstSwipeItem) {
        // Đợi UI render xong nửa giây rồi mới nhá hàng
        setTimeout(() => {
            firstSwipeItem.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            firstSwipeItem.style.transform = 'translateX(-60px)';
            
            // Đợi 0.4s rồi kéo nó về lại vị trí cũ (Snap back)
            setTimeout(() => {
                firstSwipeItem.style.transform = 'translateX(0)';
                // Gỡ transition để trả lại logic kéo vuốt bằng tay
                setTimeout(() => { firstSwipeItem.style.transition = 'none'; }, 400);
            }, 400);
            
        }, 600);
    }
};

// ============================================
// 🔄 BỘ ĐIỀU TỐC: LUỒNG THÊM HOẠT ĐỘNG -> CHI TIÊU
// ============================================
window.draftActivity = draftActivity = null; // Nơi cất giữ dữ liệu đang gõ dở
window.finalActId = finalActId = null;    // ID chờ để liên kết
window.isOpeningExpenseFlow = isOpeningExpenseFlow = false;
window.pendingReturnToHistoryIdx = pendingReturnToHistoryIdx = null; // Chỉ số thành viên cần quay lại Sao kê sau khi Nạp/Rút quỹ
window.isSavingActivityFlow = isSavingActivityFlow = false;

function resetActivityExpenseFlowUI() {
    const btn = document.getElementById('btnActExpenseFlow');
    if (btn) {
        btn.style.background = 'var(--surface2)';
        btn.style.color = 'var(--text2)';
        btn.innerHTML = '<span style="font-size: 1.1rem;">💰</span> Kê khai chi tiêu cho hoạt động này';
    }
}

function cleanupPendingActivityExpense(removePayments = false) {
    const pendingActId = window.finalActId;
    let removedCount = 0;

    if (removePayments && pendingActId && DATA && Array.isArray(DATA.payments)) {
        const before = DATA.payments.length;
        DATA.payments = DATA.payments.filter(p => !p || p.linkedActId !== pendingActId);
        removedCount = before - DATA.payments.length;
    }

    window.finalActId = finalActId = null;
    window.draftActivity = draftActivity = null;
    window.pendingReturnToAct = pendingReturnToAct = null;
    resetActivityExpenseFlowUI();

    if (removedCount > 0) {
        save();
        autoSync();
        try { renderPayments(); renderItinerary(); } catch(e) {}
        if (typeof window.renderTodayView === 'function') window.renderTodayView();
    }
}

window.openExpenseFlow = openExpenseFlow = () => {
    const name = document.getElementById('actName').value.trim();
    if (!name) return showToast("Vui lòng nhập tên hoạt động trước!", "error");
    
    // 1. Tạo ID trước (nhưng chưa lưu vào DATA)
    window.finalActId = finalActId = 'act_' + Date.now() + '_' + Math.floor(Math.random()*1000);
    
    // 2. Cất giữ "bản nháp" những gì bác đang gõ
    window.draftActivity = draftActivity = {
        name,
        h: document.getElementById('actHour').value,
        m: document.getElementById('actMinute').value,
        loc: document.getElementById('actLocation').value,
        note: document.getElementById('actNote').value,
        di: document.getElementById('actDayIdx').value
    };

    // 3. Xuất vé khứ hồi loại "Thêm mới"
    window.pendingReturnToAct = pendingReturnToAct = { mode: 'add_flow' };

    // 4. Đóng bảng Hoạt động chuẩn xác và mở bảng Chi tiêu
    window.isOpeningExpenseFlow = isOpeningExpenseFlow = true;
    closeModal('actModal');
    setTimeout(() => {
        try {
            openAddPaymentModal(name, window.finalActId);
            const estimateInput = document.getElementById('pmIsEstimate');
            if (estimateInput) {
                estimateInput.checked = false;
                toggleEstimateMode('pm');
            }
        } finally {
            window.isOpeningExpenseFlow = isOpeningExpenseFlow = false;
        }
    }, 300);
};

// --- HÀM ĐÓNG MODAL CẢI TIẾN ---
const __oldCloseModalFlow = window.closeModal;
window.closeModal = closeModal = (id) => {
    __oldCloseModalFlow(id); 
    
    // 🔑 BẢN VÁ: Cho phép quay xe khi đóng cả 'paymentModal' (Thêm) và 'editPaymentModal' (Sửa)
    if ((id === 'paymentModal' || id === 'editPaymentModal') && window.pendingReturnToAct) {
        const returnInfo = window.pendingReturnToAct;
        window.pendingReturnToAct = pendingReturnToAct = null;
        
        setTimeout(() => {
            if (returnInfo.mode === 'edit') {
                // Quay về bảng Sửa hoạt động
                window.openEditActivity(returnInfo.di, returnInfo.ai);
            } 
            else if (returnInfo.mode === 'add_flow' && window.draftActivity) {
                // (Giữ nguyên logic phục hồi bản nháp cũ của bác ở đây...)
                const d = window.draftActivity;
                document.getElementById('actName').value = d.name;
                document.getElementById('actHour').value = d.h;
                document.getElementById('actMinute').value = d.m;
                document.getElementById('actLocation').value = d.loc;
                document.getElementById('actNote').value = d.note;
                document.getElementById('actDayIdx').value = d.di;
                
                const hasSavedPayment = DATA.payments && DATA.payments.some(p => p.linkedActId === window.finalActId);
                const btn = document.getElementById('btnActExpenseFlow');
                if (btn) {
                    if (hasSavedPayment) {
                        btn.style.background = 'var(--orange-bg)'; btn.style.color = 'var(--orange)';
                        btn.innerHTML = '✅ Đã kê khai chi tiêu (Bấm Thêm ở dưới để lưu)';
                    } else {
                        btn.style.background = 'var(--surface2)'; btn.style.color = 'var(--text2)';
                        btn.innerHTML = '<span style="font-size: 1.1rem;">💰</span> Kê khai chi tiêu cho hoạt động này';
                    }
                }
                openModal('actModal');
            }
        }, 350);
    }

    // 🔑 BẢN VÁ: Quay lại modal Sao kê sau khi đóng modal Quản lý & Đóng quỹ (nếu được mở ra từ Sao kê)
    // Áp dụng cho cả 2 trường hợp: bấm "Lưu thay đổi" (đã nạp/rút xong) và bấm "Hủy"
    if (id === 'editMemberModal' && window.pendingReturnToHistoryIdx !== null && window.pendingReturnToHistoryIdx !== undefined) {
        const returnIdx = window.pendingReturnToHistoryIdx;
        window.pendingReturnToHistoryIdx = pendingReturnToHistoryIdx = null;

        setTimeout(() => {
            if (DATA.members && DATA.members[returnIdx]) {
                window.openHistoryModal(returnIdx); // Mở lại kèm dữ liệu Nạp/Rút mới nhất
            }
        }, 350);
    }

    // 🔑 2. BẢN VÁ: NẾU BÁC HỦY TẠO HOẠT ĐỘNG -> DỌN SẠCH RÁC NGAY LẬP TỨC
    if (id === 'actModal' && !window.isOpeningExpenseFlow && !window.isSavingActivityFlow) {
        cleanupPendingActivityExpense(true);
        return;
        window.finalActId = finalActId = null;
        window.draftActivity = draftActivity = null;
        window.pendingReturnToAct = pendingReturnToAct = null;

        // Reset màu nút về mặc định luôn cho an toàn
        const btn = document.getElementById('btnActExpenseFlow');
        if (btn) {
            btn.style.background = 'var(--surface2)';
            btn.style.color = 'var(--text2)';
            btn.innerHTML = '<span style="font-size: 1.1rem;">💰</span> Kê khai chi tiêu cho hoạt động này';
        }
    }
};

init();
