// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed: ', err);
        });
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

// DOM Elements
const formInputs = document.querySelectorAll('input');
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
const resDealerDisb = document.getElementById('res-dealer-disb');

// Calculation Logic
function calculate() {
    // 1. Get Inputs
    const onRoadPrice = parseFloat(document.getElementById('on-road-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const tenure = parseFloat(document.getElementById('tenure').value) || 0;
    const roi = parseFloat(document.getElementById('roi').value) || 0;
    const disbDateVal = document.getElementById('disb-date').value;
    const emiDateVal = document.getElementById('emi-date').value;

    // 2. Base Loan Amount
    const loanAmount = Math.max(0, onRoadPrice - downPayment);
    
    // Default zero states if inputs are missing
    if (loanAmount <= 0 || tenure <= 0 || roi <= 0) {
        resetOutputs(loanAmount);
        return;
    }

    // 3. EMI Calculation
    const r = (roi / 12) / 100;
    const n = tenure;
    const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

    // 4. Flat Rate ROI
    const totalPayment = emi * tenure;
    const flatRoi = (((totalPayment - loanAmount) * 12) / (loanAmount * tenure)) * 100;

    // 5. Broken Period Days
    let brokenDays = 0;
    if (disbDateVal && emiDateVal) {
        const disbDate = new Date(disbDateVal);
        const firstEmiDate = new Date(emiDateVal);
        
        const oneMonthBeforeEmi = new Date(firstEmiDate);
        oneMonthBeforeEmi.setMonth(oneMonthBeforeEmi.getMonth() - 1);
        
        const timeDiff = oneMonthBeforeEmi.getTime() - disbDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        brokenDays = Math.max(0, daysDiff - 1);
    }

    // 6. Broken Period Interest & First Installment
    const brokenInterest = loanAmount * brokenDays * (roi / 360) / 100;
    const firstInstallment = emi + brokenInterest;

    // 7. Additional Charges
    const pfCharge = (loanAmount * 0.025) * 1.18; // 2.5% + 18% GST
    const rcCharge = 600 * 1.18;
    const docCharge = 750 * 1.18;
    const stampDuty = 200;
    const totalCharges = pfCharge + rcCharge + docCharge + stampDuty;

    // 8. Dealer Disbursement
    const dealerDisbursement = loanAmount - totalCharges;

    // 9. Update UI
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

    resDealerDisb.innerText = formatCurrency(dealerDisbursement);
}

function resetOutputs(loanAmount) {
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
    resDealerDisb.innerText = formatCurrency(0);
}

// Attach listeners for real-time calculation
formInputs.forEach(input => {
    input.addEventListener('input', calculate);
});