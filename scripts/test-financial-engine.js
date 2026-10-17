/**
 * Unit Test Kiểm thử Động cơ Tài chính StockAI Personal
 * Chạy độc lập với Node.js để kiểm thử toàn bộ công thức trước khi tích hợp vào giao diện.
 */

// Import trực tiếp logic tính toán để test
function calculateTradeCashFlow(type, shares, price, feeRate = 0.0015, taxRate = 0.0010) {
  if (shares <= 0 || price <= 0) throw new Error('Số lượng cổ phiếu và giá phải lớn hơn 0');
  const grossAmount = Math.round(shares * price);
  const fee = Math.round(grossAmount * feeRate);
  const tax = type === 'SELL' ? Math.round(grossAmount * taxRate) : 0;
  const netCashFlow = type === 'BUY' ? -(grossAmount + fee) : (grossAmount - fee - tax);
  return { grossAmount, fee, tax, netCashFlow };
}

function calculateNewCostBasis(currentShares, currentCostBasis, buyShares, buyPrice, buyFee) {
  const currentTotalCost = currentShares * currentCostBasis;
  const buyTotalCost = (buyShares * buyPrice) + buyFee;
  const newShares = currentShares + buyShares;
  const newCostBasis = Math.round((currentTotalCost + buyTotalCost) / newShares);
  return { newShares, newCostBasis };
}

function calculateRealizedPnL(sellShares, sellPrice, averageCostBasis, sellFee, sellTax) {
  const grossRevenue = Math.round(sellShares * sellPrice);
  const netProceeds = grossRevenue - sellFee - sellTax;
  const costOfSoldShares = Math.round(sellShares * averageCostBasis);
  const realizedPnL = netProceeds - costOfSoldShares;
  const returnPercent = costOfSoldShares > 0 ? (realizedPnL / costOfSoldShares) * 100 : 0;
  return { realizedPnL, returnPercent: Number(returnPercent.toFixed(2)), costOfSoldShares, netProceeds };
}

function calculateUnrealizedPnL(currentShares, costBasis, marketPrice) {
  const totalCost = Math.round(currentShares * costBasis);
  const marketValue = Math.round(currentShares * marketPrice);
  const unrealizedPnL = marketValue - totalCost;
  const returnPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
  return { marketValue, unrealizedPnL, returnPercent: Number(returnPercent.toFixed(2)) };
}

function applyStockSplit(currentShares, currentCostBasis, splitRatio) {
  const newShares = Math.floor(currentShares * splitRatio);
  const newCostBasis = Math.round(currentCostBasis / splitRatio);
  return { newShares, newCostBasis };
}

function applyCashDividend(sharesEligible, dividendPerShare, taxRate = 0.05) {
  const grossDividend = Math.round(sharesEligible * dividendPerShare);
  const tax = Math.round(grossDividend * taxRate);
  const netCashReceived = grossDividend - tax;
  return { grossDividend, tax, netCashReceived };
}

function applyStockDividend(currentShares, currentCostBasis, dividendRatio) {
  const bonusShares = Math.floor(currentShares * dividendRatio);
  const newTotalShares = currentShares + bonusShares;
  const adjustedCostBasis = Math.round((currentShares * currentCostBasis) / newTotalShares);
  return { bonusShares, newTotalShares, adjustedCostBasis };
}

// Bắt đầu chạy test cases
console.log('=== BẮT ĐẦU KIỂM THỬ ĐỘNG CƠ TÀI CHÍNH STOCKAI ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. Kiểm thử Mua cổ phiếu & Phí môi giới
const buy1 = calculateTradeCashFlow('BUY', 1000, 25000, 0.0015, 0.0010);
assert(buy1.grossAmount === 25000000, 'Test 1.1: Gross amount = 25,000,000 đ');
assert(buy1.fee === 37500, 'Test 1.2: Phí mua 0.15% = 37,500 đ');
assert(buy1.tax === 0, 'Test 1.3: Thuế khi mua = 0 đ');
assert(buy1.netCashFlow === -25037500, 'Test 1.4: Net cash flow = -25,037,500 đ');

// 2. Kiểm thử Giá vốn bình quân gia quyền
// Mua đợt 1: 1,000 cp giá vốn 25,038 đ (đã gồm phí)
// Mua đợt 2: 1,000 cp giá 27,000 đ, phí 40,500 đ
const newBasis = calculateNewCostBasis(1000, 25038, 1000, 27000, 40500);
assert(newBasis.newShares === 2000, 'Test 2.1: Tổng số lượng sau mua đợt 2 = 2,000 cp');
assert(newBasis.newCostBasis === 26039, 'Test 2.2: Giá vốn bình quân chuẩn xác = 26,039 đ/cp');

// 3. Kiểm thử Bán cổ phiếu & Lãi/Lỗ thực hiện
// Bán 1,000 cp giá 30,000 đ
const sell1 = calculateTradeCashFlow('SELL', 1000, 30000, 0.0015, 0.0010);
assert(sell1.grossAmount === 30000000, 'Test 3.1: Gross bán = 30,000,000 đ');
assert(sell1.fee === 45000, 'Test 3.2: Phí bán 0.15% = 45,000 đ');
assert(sell1.tax === 30000, 'Test 3.3: Thuế bán 0.1% = 30,000 đ');
assert(sell1.netCashFlow === 29925000, 'Test 3.4: Tiền thu ròng về ví = 29,925,000 đ');

const pnl1 = calculateRealizedPnL(1000, 30000, 26039, sell1.fee, sell1.tax);
assert(pnl1.costOfSoldShares === 26039000, 'Test 3.5: Giá vốn 1,000 cp bán = 26,039,000 đ');
assert(pnl1.realizedPnL === 3886000, 'Test 3.6: Lãi ròng đã thực hiện = +3,886,000 đ');
assert(pnl1.returnPercent === 14.92, 'Test 3.7: Tỷ suất sinh lời thực hiện = +14.92%');

// 4. Kiểm thử Lãi/Lỗ chưa thực hiện
// Còn lại 1,000 cp, giá thị trường hiện tại 33,100 đ
const unpnl = calculateUnrealizedPnL(1000, 26039, 33100);
assert(unpnl.marketValue === 33100000, 'Test 4.1: Giá trị thị trường = 33,100,000 đ');
assert(unpnl.unrealizedPnL === 7061000, 'Test 4.2: Lãi chưa thực hiện = +7,061,000 đ');
assert(unpnl.returnPercent === 27.12, 'Test 4.3: % Lãi chưa thực hiện = +27.12%');

// 5. Kiểm thử Chia tách cổ phiếu 2:1
const split = applyStockSplit(1000, 26039, 2.0);
assert(split.newShares === 2000, 'Test 5.1: Số lượng sau tách 2:1 = 2,000 cp');
assert(split.newCostBasis === 13020, 'Test 5.2: Giá vốn sau tách = 13,020 đ');

// 6. Kiểm thử Cổ tức tiền mặt 1,500 đ/cp
const divCash = applyCashDividend(2000, 1500, 0.05);
assert(divCash.grossDividend === 3000000, 'Test 6.1: Cổ tức tiền gộp = 3,000,000 đ');
assert(divCash.tax === 150000, 'Test 6.2: Thuế TNCN cổ tức (5%) = 150,000 đ');
assert(divCash.netCashReceived === 2850000, 'Test 6.3: Tiền cổ tức thực nhận = 2,850,000 đ');

// 7. Kiểm thử Cổ tức bằng cổ phiếu 10%
const divStock = applyStockDividend(2000, 13020, 0.10);
assert(divStock.bonusShares === 200, 'Test 7.1: Cổ phiếu thưởng thêm = 200 cp');
assert(divStock.newTotalShares === 2200, 'Test 7.2: Tổng cổ phiếu mới = 2,200 cp');
assert(divStock.adjustedCostBasis === 11836, 'Test 7.3: Giá vốn điều chỉnh = 11,836 đ');

console.log(`\n=== KẾT QUẢ: ĐÃ VƯỢT QUA ${passedTests}/${totalTests} BÀI KIỂM THỬ (${Math.round(passedTests/totalTests*100)}%) ===`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
