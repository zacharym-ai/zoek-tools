// ============================================================
// ZOEK INDUSTRY BENCHMARK DATA
// Used by Revenue Loss, ROI, and Cost Per Lead calculators
// ============================================================

const INDUSTRY_BENCHMARKS = {
  'home_services': {
    label: 'Home Services',
    conversionRate: 8.2,
    costPerLead: 65,
    roiTarget: 300,
    avgOrderValue: 850,
    closeRate: 35,
    leadVolume: 120,
    marketingBudgetPct: 8,
    notes: 'Home services (plumbing, roofing, HVAC, electrical) typically see strong local search demand with seasonal peaks.'
  },
  'healthcare': {
    label: 'Healthcare & Medical',
    conversionRate: 12.5,
    costPerLead: 48,
    roiTarget: 400,
    avgOrderValue: 320,
    closeRate: 55,
    leadVolume: 85,
    marketingBudgetPct: 6,
    notes: 'Healthcare practices benefit heavily from reviews and local SEO. Patient lifetime value makes higher CPL worthwhile.'
  },
  'restaurant': {
    label: 'Restaurant & Food Service',
    conversionRate: 4.2,
    costPerLead: 12,
    roiTarget: 200,
    avgOrderValue: 45,
    closeRate: 20,
    leadVolume: 400,
    marketingBudgetPct: 4,
    notes: 'Restaurants operate on thin margins but high volume. Google Business Profile and reviews are critical drivers.'
  },
  'retail': {
    label: 'Retail',
    conversionRate: 3.8,
    costPerLead: 22,
    roiTarget: 250,
    avgOrderValue: 180,
    closeRate: 25,
    leadVolume: 280,
    marketingBudgetPct: 7,
    notes: 'Retail competes heavily online. Strong product pages, reviews, and retargeting ads are key performance drivers.'
  },
  'professional': {
    label: 'Professional Services',
    conversionRate: 15.2,
    costPerLead: 95,
    roiTarget: 500,
    avgOrderValue: 2400,
    closeRate: 42,
    leadVolume: 45,
    marketingBudgetPct: 10,
    notes: 'Law firms, accountants, consultants. High lifetime value justifies higher CPL. Referrals + SEO dominate.'
  },
  'fitness': {
    label: 'Fitness & Wellness',
    conversionRate: 9.4,
    costPerLead: 38,
    roiTarget: 350,
    avgOrderValue: 120,
    closeRate: 40,
    leadVolume: 160,
    marketingBudgetPct: 9,
    notes: 'Studios and gyms rely on local visibility, reviews, and social proof. Membership model improves LTV significantly.'
  },
  'beauty': {
    label: 'Beauty & Salon',
    conversionRate: 11.2,
    costPerLead: 28,
    roiTarget: 300,
    avgOrderValue: 95,
    closeRate: 48,
    leadVolume: 200,
    marketingBudgetPct: 8,
    notes: 'Salons and spas depend on repeat business. Reviews, Instagram presence, and booking ease drive conversions.'
  },
  'real_estate': {
    label: 'Real Estate',
    conversionRate: 2.8,
    costPerLead: 145,
    roiTarget: 800,
    avgOrderValue: 8500,
    closeRate: 18,
    leadVolume: 60,
    marketingBudgetPct: 12,
    notes: 'Long sales cycle but extremely high transaction value. Digital ads and SEO are primary lead sources.'
  },
  'automotive': {
    label: 'Automotive',
    conversionRate: 6.5,
    costPerLead: 55,
    roiTarget: 350,
    avgOrderValue: 1200,
    closeRate: 30,
    leadVolume: 95,
    marketingBudgetPct: 7,
    notes: 'Auto repair and dealerships rely on Google local and reviews. Repeat customers drive significant lifetime value.'
  },
  'education': {
    label: 'Education & Childcare',
    conversionRate: 18.5,
    costPerLead: 42,
    roiTarget: 450,
    avgOrderValue: 650,
    closeRate: 60,
    leadVolume: 70,
    marketingBudgetPct: 8,
    notes: 'High conversion intent — parents searching for schools/daycare are ready to act. Reviews and local SEO are critical.'
  },
  'construction': {
    label: 'Construction & Remodeling',
    conversionRate: 7.8,
    costPerLead: 88,
    roiTarget: 400,
    avgOrderValue: 12000,
    closeRate: 28,
    leadVolume: 35,
    marketingBudgetPct: 6,
    notes: 'High ticket projects justify premium CPL. Portfolio, reviews, and local SEO are strongest conversion drivers.'
  },
  'nonprofit': {
    label: 'Nonprofit & Faith-Based',
    conversionRate: 22.0,
    costPerLead: 8,
    roiTarget: 150,
    avgOrderValue: 75,
    closeRate: 65,
    leadVolume: 200,
    marketingBudgetPct: 3,
    notes: 'Community engagement and mission-driven messaging drive high conversion at low cost. Social and local search dominate.'
  }
};

// Helper to get benchmark or closest match
function getBenchmark(industryKey) {
  return INDUSTRY_BENCHMARKS[industryKey] || INDUSTRY_BENCHMARKS['home_services'];
}

// Industry selector HTML — reusable across calculators
function buildIndustrySelector(containerId, onSelectFn) {
  const options = Object.entries(INDUSTRY_BENCHMARKS).map(([key, val]) =>
    `<option value="${key}">${val.label}</option>`
  ).join('');

  document.getElementById(containerId).innerHTML = `
    <div class="benchmark-selector">
      <div class="bm-label">📊 Compare to your industry</div>
      <div class="bm-row">
        <select class="bm-select" id="bm-industry-select" onchange="${onSelectFn}(this.value)">
          <option value="">Select your industry...</option>
          ${options}
        </select>
      </div>
      <div id="bm-results" class="bm-results" style="display:none"></div>
    </div>`;
}

// Shared benchmark CSS — inject into page
const BENCHMARK_CSS = `
.benchmark-selector{margin-top:2.5rem;padding-top:2rem;border-top:1px solid rgba(105,44,142,0.25);}
.bm-label{font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a0a0c0;margin-bottom:0.75rem;}
.bm-row{display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;}
.bm-select{flex:1;padding:0.65rem 0.85rem;background:rgba(255,255,255,0.05);border:1.5px solid rgba(105,44,142,0.25);border-radius:5px;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;outline:none;cursor:pointer;transition:border-color 0.2s;}
.bm-select:focus{border-color:#ED0875;}
.bm-select option{background:#27215C;color:#fff;}
.bm-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1px;background:rgba(105,44,142,0.2);border:1px solid rgba(105,44,142,0.2);border-radius:8px;overflow:hidden;margin-top:0.5rem;}
.bm-card{background:#27215C;padding:1rem 1.1rem;}
.bm-card-label{font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a0a0c0;margin-bottom:0.4rem;}
.bm-card-avg{font-size:0.75rem;color:#a0a0c0;margin-bottom:0.2rem;}
.bm-card-you{font-size:0.78rem;font-weight:700;margin-bottom:0.35rem;}
.bm-card-delta{font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:3px;display:inline-block;}
.bm-delta-good{background:rgba(79,255,176,0.12);color:#4fffb0;}
.bm-delta-warn{background:rgba(250,163,28,0.12);color:#FAA31C;}
.bm-delta-bad{background:rgba(237,8,117,0.12);color:#ED0875;}
.bm-insight{margin-top:1rem;padding:0.85rem 1rem;background:rgba(237,8,117,0.06);border:1px solid rgba(237,8,117,0.15);border-radius:6px;font-size:0.78rem;color:#a0a0c0;line-height:1.6;}
.bm-insight strong{color:#fff;display:block;margin-bottom:0.2rem;}
`;
