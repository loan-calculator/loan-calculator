// --- SECURITY PIN CHECK ---
const secretPin = "8899"; // <-- You can change "8899" to any PIN you want!
const userAttempt = prompt("🔒 Private Calculator. Please enter the Access PIN:");

if (userAttempt !== secretPin) {
    document.body.innerHTML = "<div style='display: flex; height: 100vh; justify-content: center; align-items: center; font-family: sans-serif; background-color: #111827; color: white;'><h1>🔒 Access Denied. Incorrect PIN.</h1></div>";
    throw new Error("Execution stopped. Incorrect PIN entered.");
}
// --- END SECURITY CHECK ---

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {});
    });
}

// Dark Mode Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') document.body.setAttribute('data-theme', 'dark');

themeToggleBtn.addEventListener('click', () => {
    let theme = document.body.getAttribute('data-theme');
    if (theme === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Formatting Utility
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// --- INSURANCE PREMIUM DATA ---
const insuranceRates = {
    'A': { '2': 674, '3': 968, '4': 1233, '5': 1470 },
    'B': { '2': 963, '3': 1383, '4': 1762, '5': 2100 },
    'C': { '2': 1204, '3': 1729, '4': 2202, '5': 2625 },
    'D': { '2': 1444, '3': 2074, '4': 2643, '5': 3150 },
    'E': { '2': 1926, '3': 2766, '4': 3524, '5': 4200 }
};

// DOM Elements
const formInputs = document.querySelectorAll('input');
const fundChargesCheckbox = document.getElementById('fund-charges'); 

const resInsurance = document.getElementById('res-insurance');
const resLoanAmount = document.getElementById('res-loan-amount');
const resEmi = document.getElementById('res-emi');
const resFlatRoi = document.getElementById('res-flat-roi');
const resBrokenDays = document.getElementById('res-broken-days');
const resBrokenInt = document.getElementById('res-broken-int');
const resFirstInst = document.getElementById('res-first-inst');
const resPf = document.getElementById('res-pf');
const resRc = document.getElementById('res-rc');
const resDoc = document.getElementById('res-doc');
const resStamp = document.getElementById('res-stamp');
const resTotalCharges = document.getElementById('res-total-charges');
const resTotalUpfront = document.getElementById('res-total-upfront'); 
const resDealerDisb = document.getElementById('res-dealer-disb');

// Calculation Logic
function calculate() {
    // 1. Get Inputs
    const onRoadPrice = parseFloat(document.getElementById('on-road-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const tenure = parseFloat(document.getElementById('tenure').value) || 0;
    const roi = parseFloat(document.getElementById('roi').value) || 0;
    
    // NEW: Grab the manual PF Rate you just added to HTML
    const pfRateInput = parseFloat(document.getElementById('pf-rate').value) || 0;

    const disbDateInput = document.getElementById('disb-date');
    const emiDateInput = document.getElementById('emi-date');
    const insPlanInput = document.getElementById('ins-plan');
    
    // 2. AUTO EMI DATE CALCULATION (Rule: 5th of the month)
    let emiDateVal = "";
    if (disbDateInput.value) {
        let d = new Date(disbDateInput.value);
        let day = d.getDate();
        let month = d.getMonth();
        let year = d.getFullYear();

        if (day >= 6 && day <= 21) {
            month += 1;
        } else if (day >= 22) {
            month += 2;
        } else if (day <= 5) {
            month += 1;
        }

        if (month > 11) {
            year += Math.floor(month / 12);
            month = month % 12;
        }

        let emiMonthStr = (month + 1).toString().padStart(2, '0');
        emiDateVal = `${year}-${emiMonthStr}-05`;
        emiDateInput.value = emiDateVal; 
    }

    // 3. BASE LOAN & ROUNDING TO NEAREST 500
    let exactBaseLoan = Math.max(0, onRoadPrice - downPayment);
    const baseLoanAmount = Math.round(exactBaseLoan / 500) * 500;

    // 4. AUTO INSURANCE SLAB DETERMINATION
    let insurancePremium = 0;
    if (baseLoanAmount > 0 && tenure > 0) {
        let plan = 'E'; // Default to max
        if (baseLoanAmount <= 70000) plan = 'A';
        else if (baseLoanAmount <= 100000) plan = 'B';
        else if (baseLoanAmount <= 125000) plan = 'C';
        else if (baseLoanAmount <= 150000) plan = 'D';

        let years = '5';
        if (tenure <= 24) years = '2'; 
        else if (tenure <= 36) years = '3';
        else if (tenure <= 48) years = '4';

        insurancePremium = insuranceRates[plan][years];
        insPlanInput.value = `Plan ${plan} (${years} Years) - Coverage limit auto-detected`;
    } else {
        insPlanInput.value = '';
    }

    // 5. CALCULATE TOTALS & BANK CHARGES (Using Manual PF Rate)
    const fundedAmountBase = baseLoanAmount + insurancePremium;
    
    // Converts "2.5" into 0.025 for math
    const actualPfRate = pfRateInput / 100;
    
    const pfCharge = (fundedAmountBase * actualPfRate) * 1.18; // Typed PF + 18% GST
    const rcCharge = 600 * 1.18;
    const docCharge = 750 * 1.18;
    const stampDuty = 200;
    const totalCharges = pfCharge + rcCharge + docCharge + stampDuty;

    // 6. FUNDED VS UPFRONT LOGIC (Checkbox)
    let loanAmount = 0;
    let totalUpfront = 0;
    let dealerDisbursement = 0;

    if (fundChargesCheckbox && fundChargesCheckbox.checked) {
        loanAmount = fundedAmountBase + totalCharges;
        totalUpfront = downPayment; 
        dealerDisbursement = baseLoanAmount; 
    } else {
        loanAmount = fundedAmountBase;
        totalUpfront = downPayment + totalCharges; 
        dealerDisbursement = baseLoanAmount - totalCharges; 
    }
    
    if (loanAmount <= 0 || tenure <= 0 || roi <= 0) {
        resetOutputs(loanAmount, insurancePremium, totalUpfront);
        return;
    }

    // 7. EMI CALCULATION
    const r = (roi / 12) / 100;
    const n = tenure;
    const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * tenure;
    const flatRoi = (((totalPayment - loanAmount) * 12) / (loanAmount * tenure)) * 100;

    // 8. BROKEN PERIOD CALCULATION
    let brokenDays = 0;
    if (disbDateInput.value && emiDateVal) {
        const disbDate = new Date(disbDateInput.value);
        const firstEmiDate = new Date(emiDateVal);
        
        const oneMonthBeforeEmi = new Date(firstEmiDate);
        oneMonthBeforeEmi.setMonth(oneMonthBeforeEmi.getMonth() - 1);
        
        const timeDiff = oneMonthBeforeEmi.getTime() - disbDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        brokenDays = Math.max(0, daysDiff - 1);
    }

    const brokenInterest = loanAmount * brokenDays * (roi / 360) / 100;
    const firstInstallment = emi + brokenInterest;

    // 9. UPDATE UI
    resInsurance.innerText = formatCurrency(insurancePremium);
    resLoanAmount.innerText = formatCurrency(loanAmount);
    resEmi.innerText = formatCurrency(emi);
    resFlatRoi.innerText = flatRoi.toFixed(2) + '%';
    
    resBrokenDays.innerText = brokenDays;
    resBrokenInt.innerText = formatCurrency(brokenInterest);
    resFirstInst.innerText = formatCurrency(firstInstallment);

    resPf.innerText = formatCurrency(pfCharge);
    resRc.innerText = formatCurrency(rcCharge);
    resDoc.innerText = formatCurrency(docCharge);
    resStamp.innerText = formatCurrency(stampDuty);
    resTotalCharges.innerText = formatCurrency(totalCharges);

    resTotalUpfront.innerText = formatCurrency(totalUpfront);
    resDealerDisb.innerText = formatCurrency(dealerDisbursement);
}

function resetOutputs(loanAmount, insurancePremium, totalUpfront = 0) {
    resInsurance.innerText = formatCurrency(insurancePremium);
    resLoanAmount.innerText = formatCurrency(loanAmount);
    resEmi.innerText = formatCurrency(0);
    resFlatRoi.innerText = '0%';
    resBrokenDays.innerText = '0';
    resBrokenInt.innerText = formatCurrency(0);
    resFirstInst.innerText = formatCurrency(0);
    resPf.innerText = formatCurrency(0);
    resRc.innerText = formatCurrency(0);
    resDoc.innerText = formatCurrency(0);
    resStamp.innerText = formatCurrency(0);
    resTotalCharges.innerText = formatCurrency(0);
    resTotalUpfront.innerText = formatCurrency(totalUpfront);
    resDealerDisb.innerText = formatCurrency(0);
}

// Attach listeners for real-time calculation
formInputs.forEach(input => {
    input.addEventListener('input', calculate);
});