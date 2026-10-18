import { STOCKAI_SECTORS, StockAiSector, T3Signal } from '@/types';

// Bảng ánh xạ mã cổ phiếu Việt Nam vào 13 ngành chuẩn mực
const SYMBOL_SECTOR_MAP: Record<string, StockAiSector> = {
  // 1. Ngân hàng
  TCB: 'Ngân hàng',
  MBB: 'Ngân hàng',
  VCB: 'Ngân hàng',
  CTG: 'Ngân hàng',
  ACB: 'Ngân hàng',
  VPB: 'Ngân hàng',
  TPB: 'Ngân hàng',
  STB: 'Ngân hàng',
  BID: 'Ngân hàng',
  HDB: 'Ngân hàng',
  VIB: 'Ngân hàng',
  LPB: 'Ngân hàng',
  SHB: 'Ngân hàng',
  MSB: 'Ngân hàng',
  OCB: 'Ngân hàng',
  EIB: 'Ngân hàng',
  SSB: 'Ngân hàng',
  BAB: 'Ngân hàng',
  BVB: 'Ngân hàng',
  NAB: 'Ngân hàng',

  // 2. Chứng khoán
  SSI: 'Chứng khoán',
  SHS: 'Chứng khoán',
  VND: 'Chứng khoán',
  VCI: 'Chứng khoán',
  HCM: 'Chứng khoán',
  MBS: 'Chứng khoán',
  BSI: 'Chứng khoán',
  FTS: 'Chứng khoán',
  CTS: 'Chứng khoán',
  VIX: 'Chứng khoán',
  ORS: 'Chứng khoán',
  AGR: 'Chứng khoán',
  BVS: 'Chứng khoán',
  TVS: 'Chứng khoán',

  // 3. Bất động sản
  VHM: 'Bất động sản',
  NVL: 'Bất động sản',
  PDR: 'Bất động sản',
  DXG: 'Bất động sản',
  DIG: 'Bất động sản',
  KDH: 'Bất động sản',
  NLG: 'Bất động sản',
  KBC: 'Bất động sản',
  IDC: 'Bất động sản',
  VIC: 'Bất động sản',
  CEO: 'Bất động sản',
  BCM: 'Bất động sản',
  VRE: 'Bất động sản',
  HDC: 'Bất động sản',
  SCR: 'Bất động sản',
  SZC: 'Bất động sản',
  TCH: 'Bất động sản',

  // 4. Thép
  HPG: 'Thép',
  HSG: 'Thép',
  NKG: 'Thép',
  VGS: 'Thép',
  TVN: 'Thép',
  TLH: 'Thép',
  POM: 'Thép',
  SMC: 'Thép',

  // 5. Bán lẻ
  MWG: 'Bán lẻ',
  FRT: 'Bán lẻ',
  DGW: 'Bán lẻ',
  PNJ: 'Bán lẻ',
  PET: 'Bán lẻ',

  // 6. Công nghệ thông tin
  FPT: 'Công nghệ thông tin',
  CMG: 'Công nghệ thông tin',
  ELC: 'Công nghệ thông tin',
  SAM: 'Công nghệ thông tin',
  FOX: 'Công nghệ thông tin',
  ITD: 'Công nghệ thông tin',

  // 7. Dầu khí
  BSR: 'Dầu khí',
  PVS: 'Dầu khí',
  PVD: 'Dầu khí',
  PLX: 'Dầu khí',
  GAS: 'Dầu khí',
  PVT: 'Dầu khí',
  PVC: 'Dầu khí',
  PSH: 'Dầu khí',
  OIL: 'Dầu khí',

  // 8. Điện và tiện ích
  POW: 'Điện và tiện ích',
  REE: 'Điện và tiện ích',
  PC1: 'Điện và tiện ích',
  GEG: 'Điện và tiện ích',
  HDG: 'Điện và tiện ích',
  NT2: 'Điện và tiện ích',
  QTP: 'Điện và tiện ích',
  PGV: 'Điện và tiện ích',
  TV2: 'Điện và tiện ích',
  BWE: 'Điện và tiện ích',
  TDM: 'Điện và tiện ích',

  // 9. Xây dựng và vật liệu
  VCG: 'Xây dựng và vật liệu',
  VGC: 'Xây dựng và vật liệu',
  CTD: 'Xây dựng và vật liệu',
  CII: 'Xây dựng và vật liệu',
  HHV: 'Xây dựng và vật liệu',
  FCN: 'Xây dựng và vật liệu',
  HT1: 'Xây dựng và vật liệu',
  BCC: 'Xây dựng và vật liệu',
  LCG: 'Xây dựng và vật liệu',
  C4G: 'Xây dựng và vật liệu',
  DPG: 'Xây dựng và vật liệu',

  // 10. Thực phẩm và đồ uống
  VNM: 'Thực phẩm và đồ uống',
  MSN: 'Thực phẩm và đồ uống',
  SAB: 'Thực phẩm và đồ uống',
  KDC: 'Thực phẩm và đồ uống',
  DBC: 'Thực phẩm và đồ uống',
  PAN: 'Thực phẩm và đồ uống',
  MCH: 'Thực phẩm và đồ uống',
  QNS: 'Thực phẩm và đồ uống',
  BAF: 'Thực phẩm và đồ uống',
  HAG: 'Thực phẩm và đồ uống',

  // 11. Vận tải và logistics
  GMD: 'Vận tải và logistics',
  HAH: 'Vận tải và logistics',
  VSC: 'Vận tải và logistics',
  VJC: 'Vận tải và logistics',
  HVN: 'Vận tải và logistics',
  TMS: 'Vận tải và logistics',
  ACV: 'Vận tải và logistics',
  PHP: 'Vận tải và logistics',
  SGP: 'Vận tải và logistics',

  // 12. Hóa chất
  DGC: 'Hóa chất',
  DCM: 'Hóa chất',
  DPM: 'Hóa chất',
  CSV: 'Hóa chất',
  BFC: 'Hóa chất',
  GVR: 'Hóa chất',
  PHR: 'Hóa chất',
  DPR: 'Hóa chất',
  LAS: 'Hóa chất',
};

/**
 * Tra cứu ngành của mã cổ phiếu
 */
export function getSymbolIndustry(symbol: string): StockAiSector {
  if (!symbol) return 'Khác/chưa phân ngành';
  const cleanSym = symbol.trim().toUpperCase();
  return SYMBOL_SECTOR_MAP[cleanSym] || 'Khác/chưa phân ngành';
}

/**
 * Chuẩn hóa tên ngành theo danh mục 13 ngành chuẩn
 */
export function normalizeIndustry(rawIndustry?: string): StockAiSector {
  if (!rawIndustry) return 'Khác/chưa phân ngành';
  const trimmed = rawIndustry.trim();

  // Kiểm tra khớp trực tiếp
  const match = STOCKAI_SECTORS.find(s => s.toLowerCase() === trimmed.toLowerCase());
  if (match && match !== 'Tất cả ngành') return match as StockAiSector;

  // Xử lý các biến thể phổ biến
  const lower = trimmed.toLowerCase();
  if (lower.includes('ngân hàng') || lower.includes('bank')) return 'Ngân hàng';
  if (lower.includes('chứng khoán') || lower.includes('securities')) return 'Chứng khoán';
  if (lower.includes('bất động sản') || lower.includes('địa ốc') || lower.includes('real estate')) return 'Bất động sản';
  if (lower.includes('thép') || lower.includes('steel')) return 'Thép';
  if (lower.includes('bán lẻ') || lower.includes('retail')) return 'Bán lẻ';
  if (lower.includes('công nghệ') || lower.includes('it') || lower.includes('tech')) return 'Công nghệ thông tin';
  if (lower.includes('dầu khí') || lower.includes('oil') || lower.includes('gas')) return 'Dầu khí';
  if (lower.includes('điện') || lower.includes('tiện ích') || lower.includes('utility')) return 'Điện và tiện ích';
  if (lower.includes('xây dựng') || lower.includes('vật liệu') || lower.includes('construction')) return 'Xây dựng và vật liệu';
  if (lower.includes('thực phẩm') || lower.includes('đồ uống') || lower.includes('food') || lower.includes('beverage')) return 'Thực phẩm và đồ uống';
  if (lower.includes('vận tải') || lower.includes('logistics') || lower.includes('cảng') || lower.includes('hàng không')) return 'Vận tải và logistics';
  if (lower.includes('hóa chất') || lower.includes('phân bón') || lower.includes('cao su') || lower.includes('chemical')) return 'Hóa chất';

  return 'Khác/chưa phân ngành';
}

/**
 * Bổ sung ngành và chuẩn hóa tín hiệu T3
 */
export function enrichT3Signal(signal: T3Signal): T3Signal {
  const industry = signal.industry 
    ? normalizeIndustry(signal.industry)
    : getSymbolIndustry(signal.symbol);

  // Mặc định signalType nếu thiếu
  const signalType = signal.signalType || (
    signal.strategy === 'Breakout' || signal.strategy === 'Pullback' || signal.strategy === 'Momentum'
      ? 'BUY'
      : signal.strategy === 'Reversal' && signal.t3Score < 75
        ? 'WATCHLIST'
        : 'BUY'
  );

  // Mặc định period nếu thiếu
  const period = signal.period || (
    signal.holdingDays?.includes('1') ? 'T+1' :
    signal.holdingDays?.includes('5') ? 'T+5' : 'T+3'
  );

  return {
    ...signal,
    industry,
    signalType,
    period,
  };
}
