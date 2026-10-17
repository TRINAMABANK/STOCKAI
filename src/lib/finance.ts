/**
 * Finance Engine - Động cơ tính toán tài chính chuẩn cho StockAI Personal
 * Nghiêm cấm dùng AI để suy đoán con số tài chính; toàn bộ số liệu phải được tính toán xác thực.
 */

export interface TradeCalculationResult {
  grossAmount: number;
  fee: number;
  tax: number;
  netCashFlow: number; // Âm đối với MUA (tiền xuất ra), Dương đối với BÁN (tiền thu về)
}

/**
 * Tính toán phí và thuế cho một giao dịch Mua hoặc Bán
 * @param type 'BUY' | 'SELL'
 * @param shares Số lượng cổ phiếu
 * @param price Giá mỗi cổ phiếu (VNĐ)
 * @param feeRate Tỷ lệ phí môi giới (Mặc định 0.15% = 0.0015)
 * @param taxRate Tỷ lệ thuế TNCN khi bán (Mặc định 0.1% = 0.0010)
 */
export function calculateTradeCashFlow(
  type: 'BUY' | 'SELL',
  shares: number,
  price: number,
  feeRate = 0.0015,
  taxRate = 0.0010
): TradeCalculationResult {
  if (shares <= 0 || price <= 0) {
    throw new Error('Số lượng cổ phiếu và giá phải lớn hơn 0');
  }

  const grossAmount = Math.round(shares * price);
  const fee = Math.round(grossAmount * feeRate);
  const tax = type === 'SELL' ? Math.round(grossAmount * taxRate) : 0;

  // Khi MUA: Chi phí = Tiền cổ phiếu + Phí
  // Khi BÁN: Tiền thu về = Tiền cổ phiếu - Phí - Thuế
  const netCashFlow = type === 'BUY' ? -(grossAmount + fee) : (grossAmount - fee - tax);

  return {
    grossAmount,
    fee,
    tax,
    netCashFlow,
  };
}

/**
 * Tính giá vốn bình quân gia quyền (Weighted Average Cost Basis) khi mua thêm cổ phiếu
 * Phí mua được vốn hóa trực tiếp vào giá vốn theo chuẩn kế toán chứng khoán Việt Nam.
 */
export function calculateNewCostBasis(
  currentShares: number,
  currentCostBasis: number,
  buyShares: number,
  buyPrice: number,
  buyFee: number
): { newShares: number; newCostBasis: number } {
  if (buyShares <= 0 || buyPrice <= 0) {
    throw new Error('Số lượng và giá mua phải lớn hơn 0');
  }

  const currentTotalCost = currentShares * currentCostBasis;
  const buyTotalCost = (buyShares * buyPrice) + buyFee;
  const newShares = currentShares + buyShares;
  const newCostBasis = Math.round((currentTotalCost + buyTotalCost) / newShares);

  return {
    newShares,
    newCostBasis,
  };
}

/**
 * Tính lãi/lỗ đã thực hiện (Realized P&L) khi bán cổ phiếu
 * @param sellShares Số lượng bán
 * @param sellPrice Giá bán khớp lệnh
 * @param averageCostBasis Giá vốn bình quân
 * @param sellFee Phí môi giới bán
 * @param sellTax Thuế TNCN bán (0.1%)
 */
export function calculateRealizedPnL(
  sellShares: number,
  sellPrice: number,
  averageCostBasis: number,
  sellFee: number,
  sellTax: number
): { realizedPnL: number; returnPercent: number; costOfSoldShares: number; netProceeds: number } {
  if (sellShares <= 0) {
    throw new Error('Số lượng bán phải lớn hơn 0');
  }

  const grossRevenue = Math.round(sellShares * sellPrice);
  const netProceeds = grossRevenue - sellFee - sellTax;
  const costOfSoldShares = Math.round(sellShares * averageCostBasis);
  const realizedPnL = netProceeds - costOfSoldShares;
  const returnPercent = costOfSoldShares > 0 ? (realizedPnL / costOfSoldShares) * 100 : 0;

  return {
    realizedPnL,
    returnPercent: Number(returnPercent.toFixed(2)),
    costOfSoldShares,
    netProceeds,
  };
}

/**
 * Tính lãi/lỗ chưa thực hiện (Unrealized P&L) cho lượng cổ phiếu đang nắm giữ
 */
export function calculateUnrealizedPnL(
  currentShares: number,
  costBasis: number,
  marketPrice: number
): { marketValue: number; unrealizedPnL: number; returnPercent: number } {
  if (currentShares <= 0) {
    return { marketValue: 0, unrealizedPnL: 0, returnPercent: 0 };
  }

  const totalCost = Math.round(currentShares * costBasis);
  const marketValue = Math.round(currentShares * marketPrice);
  const unrealizedPnL = marketValue - totalCost;
  const returnPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

  return {
    marketValue,
    unrealizedPnL,
    returnPercent: Number(returnPercent.toFixed(2)),
  };
}

/**
 * Xử lý chia tách cổ phiếu (Stock Split)
 * Ví dụ: Tỷ lệ 2:1 -> splitRatio = 2.0 (1 cổ cũ thành 2 cổ mới)
 * Tổng giá vốn không đổi, số lượng nhân lên, giá vốn bình quân chia tương ứng.
 */
export function applyStockSplit(
  currentShares: number,
  currentCostBasis: number,
  splitRatio: number
): { newShares: number; newCostBasis: number } {
  if (splitRatio <= 0) throw new Error('Tỷ lệ chia tách phải lớn hơn 0');
  const newShares = Math.floor(currentShares * splitRatio);
  const newCostBasis = Math.round(currentCostBasis / splitRatio);
  return { newShares, newCostBasis };
}

/**
 * Xử lý cổ tức bằng tiền mặt (Cash Dividend)
 * Tại Việt Nam, cổ tức bằng tiền mặt chịu thuế khấu trừ tại nguồn 5% (0.05).
 */
export function applyCashDividend(
  sharesEligible: number,
  dividendPerShare: number,
  taxRate = 0.05
): { grossDividend: number; tax: number; netCashReceived: number } {
  const grossDividend = Math.round(sharesEligible * dividendPerShare);
  const tax = Math.round(grossDividend * taxRate);
  const netCashReceived = grossDividend - tax;
  return { grossDividend, tax, netCashReceived };
}

/**
 * Xử lý cổ tức bằng cổ phiếu / Cổ phiếu thưởng (Stock Dividend)
 * Ví dụ: Cổ tức 10% -> dividendRatio = 0.10
 * Số cổ phiếu nhận thêm = shares * 0.10
 * Tổng vốn bỏ ra giữ nguyên -> Giá vốn mỗi cổ phiếu điều chỉnh giảm tương ứng.
 */
export function applyStockDividend(
  currentShares: number,
  currentCostBasis: number,
  dividendRatio: number
): { bonusShares: number; newTotalShares: number; adjustedCostBasis: number } {
  if (dividendRatio <= 0) throw new Error('Tỷ lệ cổ tức cổ phiếu phải lớn hơn 0');
  const bonusShares = Math.floor(currentShares * dividendRatio);
  const newTotalShares = currentShares + bonusShares;
  const adjustedCostBasis = Math.round((currentShares * currentCostBasis) / newTotalShares);
  return { bonusShares, newTotalShares, adjustedCostBasis };
}
