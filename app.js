// --- SECURITY PIN CHECK ---
const secretPin = "8899"; 
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
const formInputs = document.querySelectorAll('input, select');
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

// Amortization DOM Elements
const toggleScheduleBtn = document.getElementById('toggle-schedule-btn');
const scheduleSection = document.getElementById('schedule-section');
const amortizationTableBody = document.querySelector('#amortization-table tbody');

// Calculation Logic
function calculate() {
    // 1. Get Inputs
    const onRoadPrice = parseFloat(document.getElementById('on-road-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const tenure = parseFloat(document.getElementById('tenure').value) || 0;
    const roi = parseFloat(document.getElementById('roi').value) || 0;
    
    const pfType = document.getElementById('pf-type').value;
    const pfInputValue = parseFloat(document.getElementById('pf-value').value) || 0;
    
    const disbDateInput = document.getElementById('disb-date');
    const emiDateInput = document.getElementById('emi-date');
    const insPlanInput = document.getElementById('ins-plan');
    
    // 2. AUTO EMI DATE CALCULATION
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

    // 3. BASE LOAN & ROUNDING
    let exactBaseLoan = Math.max(0, onRoadPrice - downPayment);
    const baseLoanAmount = Math.round(exactBaseLoan / 500) * 500;

    // 4. RESOLVE CIRCULAR DEPENDENCY
    let insurancePremium = 0;
    let plan = 'E';
    let years = '5';
    let loanAmount = 0;
    let totalUpfront = 0;
    let dealerDisbursement = 0;
    let pfCharge = 0, rcCharge = 0, docCharge = 0, stampDuty = 0, totalCharges = 0;
    
    let projectedTotalLoan = baseLoanAmount; 

    for (let i = 0; i < 3; i++) {
        plan = 'E'; 
        if (projectedTotalLoan <= 70000) plan = 'A';
        else if (projectedTotalLoan <= 100000) plan = 'B';
        else if (projectedTotalLoan <= 125000) plan = 'C';
        else if (projectedTotalLoan <= 150000) plan = 'D';

        if (tenure <= 24) years = '2'; 
        else if (tenure <= 36) years = '3';
        else if (tenure <= 48) years = '4';
        else years = '5';

        insurancePremium = insuranceRates[plan][years] || 0;

        let fundedAmountBase = baseLoanAmount + insurancePremium;
        
        if (pfType === 'percentage') {
            pfCharge = (fundedAmountBase * (pfInputValue / 100)) * 1.18; 
        } else {
            pfCharge = pfInputValue; 
        }
        
        rcCharge = 600 * 1.18;
        docCharge = 750 * 1.18;
        stampDuty = 200;
        totalCharges = pfCharge + rcCharge + docCharge + stampDuty;

        if (fundChargesCheckbox && fundChargesCheckbox.checked) {
            projectedTotalLoan = fundedAmountBase + totalCharges;
            loanAmount = projectedTotalLoan;
            totalUpfront = downPayment; 
            dealerDisbursement = baseLoanAmount; 
        } else {
            projectedTotalLoan = fundedAmountBase; 
            loanAmount = projectedTotalLoan;
            totalUpfront = downPayment + totalCharges; 
            dealerDisbursement = baseLoanAmount - totalCharges; 
        }
    }
    
    if (baseLoanAmount > 0 && tenure > 0) {
        insPlanInput.value = `Plan ${plan} (${years} Years) - Coverage limit auto-detected`;
    } else {
        insPlanInput.value = '';
    }
    
    if (loanAmount <= 0 || tenure <= 0 || roi <= 0) {
        resetOutputs(loanAmount, insurancePremium, totalUpfront);
        if(amortizationTableBody) amortizationTableBody.innerHTML = '';
        return;
    }

    // 6. EMI CALCULATION
    const r = (roi / 12) / 100;
    const n = tenure;
    const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * tenure;
    const flatRoi = (((totalPayment - loanAmount) * 12) / (loanAmount * tenure)) * 100;

    // 7. BROKEN PERIOD
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

    // 8. UPDATE UI
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

    // 9. GENERATE AMORTIZATION SCHEDULE
    generateAmortizationSchedule(loanAmount, roi, tenure, emi);
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

// Attach listeners
formInputs.forEach(input => {
    input.addEventListener('input', calculate);
});
if (fundChargesCheckbox) {
    fundChargesCheckbox.addEventListener('change', calculate);
}

// --- AMORTIZATION SCHEDULE LOGIC ---
if (toggleScheduleBtn) {
    toggleScheduleBtn.addEventListener('click', () => {
        if (scheduleSection.style.display === 'none') {
            scheduleSection.style.display = 'block';
            toggleScheduleBtn.innerText = '📅 Hide Repayment Schedule';
            toggleScheduleBtn.style.backgroundColor = '#6b7280';
            scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            scheduleSection.style.display = 'none';
            toggleScheduleBtn.innerText = '📅 View Repayment Schedule';
            toggleScheduleBtn.style.backgroundColor = '#3b82f6';
        }
    });
}

function generateAmortizationSchedule(loanAmt, roi, tenure, emi) {
    if (!amortizationTableBody) return;
    amortizationTableBody.innerHTML = ''; 

    if (loanAmt <= 0 || tenure <= 0 || roi <= 0) return;

    let balance = loanAmt;
    const monthlyRate = (roi / 12) / 100;
    let html = '';

    for (let month = 1; month <= tenure; month++) {
        let interestForMonth = balance * monthlyRate;
        let principalForMonth = emi - interestForMonth;
        
        if (month === tenure) {
            principalForMonth = balance;
            emi = principalForMonth + interestForMonth;
        }

        balance -= principalForMonth;
        if (balance < 0) balance = 0; 

        html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 10px; text-align: center; font-weight: bold;">${month}</td>
                <td style="padding: 10px; font-weight: 600;">${formatCurrency(emi)}</td>
                <td style="padding: 10px; color: #ef4444;">${formatCurrency(interestForMonth)}</td>
                <td style="padding: 10px; color: #22c55e;">${formatCurrency(principalForMonth)}</td>
                <td style="padding: 10px; font-weight: bold;">${formatCurrency(balance)}</td>
            </tr>
        `;
    }
    
    amortizationTableBody.innerHTML = html;
}

// --- WHATSAPP SHARE AUTOMATION ---
const whatsappBtn = document.getElementById('whatsapp-btn');
if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
        const emiValue = resEmi.innerText;
        if (emiValue === "₹0" || emiValue === "0") {
            alert("Please calculate a loan first before sharing!");
            return;
        }

        const onRoadPrice = document.getElementById('on-road-price').value || "0";
        const tenure = document.getElementById('tenure').value || "0";
        const upfront = resTotalUpfront.innerText;
        const loanAmt = resLoanAmount.innerText;
        const roi = document.getElementById('roi').value || "0";

        const message = 
`*🏍️ TWO-WHEELER LOAN QUOTATION*

*Vehicle On-Road Price:* ₹${Number(onRoadPrice).toLocaleString('en-IN')}
*Total Loan Amount:* ${loanAmt}
*Tenure:* ${tenure} Months
*Rate of Interest:* ${roi}%

*➡️ Monthly EMI:* ${emiValue}
*➡️ Upfront to Pay at Showroom:* ${upfront}

_Note: This is an estimated quote. Final approval is subject to bank processing and document verification._`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}