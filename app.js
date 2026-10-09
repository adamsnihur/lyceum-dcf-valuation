/* ==========================================================================
   Lyceum: Interaktywne Kompendium Wyceny Spółki DCF (Discounted Cash Flow)
   Silnik Matematyczny, Symulatory Wizualne Plotly & Canvas, Pełny Sandbox
   ========================================================================== */

(function() {
  'use strict';

  // --- Global State ---
  const state = {
    // Moduł 1: TVM
    m1: {
      cf0: 100, // mln PLN
      rate: 9.5, // %
      years: 10,
      growth: 4.0 // %
    },
    // Moduł 2: FCFF vs FCFE Waterfall
    m2: {
      revenue: 1000,
      ebitMargin: 18.0,
      taxRate: 19.0,
      daPercent: 6.0,
      capexPercent: 7.5,
      nwcPercent: 2.0,
      interestExpense: 22,
      netBorrowing: 15
    },
    // Moduł 3: WACC & CAPM & Hamada
    m3: {
      rf: 5.25,
      betaU: 0.85,
      erp: 5.50,
      taxRate: 19.0,
      debt: 350,
      equity: 650,
      costOfDebt: 6.80
    },
    // Moduł 4: Terminal Value
    m4: {
      method: 'gordon', // 'gordon' | 'multiple'
      fcffLast: 125,
      wacc: 8.80,
      g: 2.50,
      roic: 14.0,
      exitMultiple: 9.5,
      ebitdaLast: 240
    },
    // Moduł 5: Equity Bridge
    m5: {
      pvFcff: 480,
      pvTv: 1120,
      cash: 140,
      debt: 420,
      nonOpAssets: 35,
      minorityInterest: 20,
      optionsVal: 15,
      shares: 60,
      currentPrice: 20.50
    },
    // Moduł 6: Macierz Wrażliwości
    m6: {
      baseWacc: 8.80,
      baseG: 2.50,
      fcffYear1to5: [105, 115, 126, 138, 150],
      scenario: 'base' // 'bear' | 'base' | 'bull'
    },
    // Moduł 7: Monte Carlo
    m7: {
      runs: 5000,
      isSimulating: false,
      results: []
    },
    // Moduł 8: Pełny Model Archetypowy
    m8: {
      currentArchetype: 'bigtech',
      presets: {
        bigtech: {
          name: 'Global Big Tech',
          desc: 'Wysoka marża operacyjna, zwinny bilans z nadwyżką gotówki netto, silna fosy technologiczna.',
          rev0: 2500,
          growthYears: [14.0, 13.0, 11.5, 10.0, 8.5],
          ebitMargin: 31.0,
          taxRate: 19.0,
          capexRatio: 4.5,
          daRatio: 4.0,
          nwcRatio: 1.5,
          rf: 4.50,
          beta: 1.10,
          erp: 5.25,
          costDebt: 5.50,
          debt: 300,
          equity: 4200,
          g: 2.75,
          cash: 850,
          shares: 120,
          marketPrice: 42.00
        },
        mature: {
          name: 'Dojrzały Przemysł / Utility',
          desc: 'Stabilne, defensywne przepływy, wysoka intensywność kapitałowa (CapEx), wysokie zadłużenie.',
          rev0: 3800,
          growthYears: [3.5, 3.2, 3.0, 2.8, 2.5],
          ebitMargin: 13.5,
          taxRate: 19.0,
          capexRatio: 8.5,
          daRatio: 7.5,
          nwcRatio: 2.5,
          rf: 5.25,
          beta: 0.75,
          erp: 5.50,
          costDebt: 6.80,
          debt: 1800,
          equity: 2200,
          g: 2.00,
          cash: 180,
          shares: 140,
          marketPrice: 17.80
        },
        saas: {
          name: 'High-Growth SaaS',
          desc: 'Dynamiczne skalowanie przychodów, reinwestycja w ekspansję, podwyższone ryzyko systematyczne (Beta).',
          rev0: 650,
          growthYears: [28.0, 24.0, 20.0, 16.0, 12.0],
          ebitMargin: 18.0,
          taxRate: 19.0,
          capexRatio: 3.5,
          daRatio: 3.0,
          nwcRatio: 1.0,
          rf: 5.00,
          beta: 1.45,
          erp: 5.50,
          costDebt: 7.20,
          debt: 80,
          equity: 1100,
          g: 3.00,
          cash: 220,
          shares: 55,
          marketPrice: 38.50
        },
        fmcg: {
          name: 'Spółka Konsumencka / FMCG',
          desc: 'Przewidywalny popyt, umiarkowany wzrost, stabilna stopa wypłaty gotówki, zrównoważony dług.',
          rev0: 1800,
          growthYears: [5.5, 5.0, 4.8, 4.5, 4.0],
          ebitMargin: 16.5,
          taxRate: 19.0,
          capexRatio: 5.0,
          daRatio: 4.8,
          nwcRatio: 2.0,
          rf: 5.25,
          beta: 0.70,
          erp: 5.50,
          costDebt: 6.40,
          debt: 600,
          equity: 1400,
          g: 2.50,
          cash: 140,
          shares: 80,
          marketPrice: 24.00
        }
      }
    },
    // Quiz State
    quiz: {
      answers: {},
      score: 0,
      submitted: false
    }
  };

  // --- Helper Functions ---
  function formatPLN(val, decimals = 1) {
    return Number(val).toLocaleString('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' mln PLN';
  }

  function formatPercent(val, decimals = 2) {
    return Number(val).toFixed(decimals) + '%';
  }

  function formatRatio(val, decimals = 2) {
    return Number(val).toFixed(decimals);
  }

  // Box-Muller transform for Monte Carlo normal distribution
  function randomNormal(mean = 0, stdev = 1) {
    let u1 = 1 - Math.random();
    let u2 = 1 - Math.random();
    let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdev * randStdNormal;
  }

  // --- MODUŁ 1: Wartość Pieniądza w Czasie (TVM) ---
  function initModule1() {
    const slRate = document.getElementById('m1SliderRate');
    const slYears = document.getElementById('m1SliderYears');
    const slGrowth = document.getElementById('m1SliderGrowth');
    const slCf0 = document.getElementById('m1SliderCf0');

    function update() {
      state.m1.rate = parseFloat(slRate.value);
      state.m1.years = parseInt(slYears.value);
      state.m1.growth = parseFloat(slGrowth.value);
      state.m1.cf0 = parseFloat(slCf0.value);

      document.getElementById('m1ValRate').textContent = formatPercent(state.m1.rate, 1);
      document.getElementById('m1ValYears').textContent = state.m1.years + ' lat';
      document.getElementById('m1ValGrowth').textContent = formatPercent(state.m1.growth, 1);
      document.getElementById('m1ValCf0').textContent = formatPLN(state.m1.cf0, 0);

      const r = state.m1.rate / 100;
      const g = state.m1.growth / 100;
      const T = state.m1.years;

      const yearsArr = [];
      const nominalArr = [];
      const discountedArr = [];
      const discountFactors = [];
      let totalNominal = 0;
      let totalPv = 0;

      for (let t = 1; t <= T; t++) {
        yearsArr.push(`Rok ${t}`);
        const nom = state.m1.cf0 * Math.pow(1 + g, t);
        const df = 1 / Math.pow(1 + r, t);
        const pv = nom * df;
        nominalArr.push(nom);
        discountedArr.push(pv);
        discountFactors.push(df * 100);
        totalNominal += nom;
        totalPv += pv;
      }

      document.getElementById('m1SumNominal').textContent = formatPLN(totalNominal, 1);
      document.getElementById('m1SumPv').textContent = formatPLN(totalPv, 1);
      const erosion = ((1 - totalPv / totalNominal) * 100).toFixed(1);
      document.getElementById('m1ValErosion').textContent = erosion + '%';

      // Plotly chart
      const traceNominal = {
        x: yearsArr,
        y: nominalArr,
        name: 'Przepływ Nominalny (CF)',
        type: 'bar',
        marker: { color: '#93c5fd' }
      };

      const traceDiscounted = {
        x: yearsArr,
        y: discountedArr,
        name: 'Wartość Bieżąca (PV)',
        type: 'bar',
        marker: { color: '#2563eb' }
      };

      const traceFactor = {
        x: yearsArr,
        y: discountFactors,
        name: 'Współczynnik Dyskonta (DF %)',
        yaxis: 'y2',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#d97706', width: 2.5, dash: 'dot' },
        marker: { size: 6, color: '#d97706' }
      };

      const layout = {
        margin: { t: 30, r: 45, b: 40, l: 55 },
        barmode: 'group',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        legend: { orientation: 'h', y: 1.15, x: 0 },
        yaxis: {
          title: 'Wartość (mln PLN)',
          gridcolor: '#f1f5f9',
          zerolinecolor: '#cbd5e1'
        },
        yaxis2: {
          title: 'DF (%)',
          overlaying: 'y',
          side: 'right',
          showgrid: false,
          range: [0, 105]
        },
        xaxis: { gridcolor: '#f8fafc' }
      };

      Plotly.react('m1Chart', [traceNominal, traceDiscounted, traceFactor], layout, { responsive: true, displayModeBar: false });
    }

    [slRate, slYears, slGrowth, slCf0].forEach(sl => sl.addEventListener('input', update));
    update();
  }

  // --- MODUŁ 2: Anatomia Wolnych Przepływów Pieniężnych (FCFF vs FCFE) ---
  function initModule2() {
    const slRev = document.getElementById('m2SliderRev');
    const slEbit = document.getElementById('m2SliderEbit');
    const slTax = document.getElementById('m2SliderTax');
    const slDa = document.getElementById('m2SliderDa');
    const slCapex = document.getElementById('m2SliderCapex');
    const slNwc = document.getElementById('m2SliderNwc');
    const slInterest = document.getElementById('m2SliderInterest');
    const slBorrowing = document.getElementById('m2SliderBorrowing');

    function update() {
      const rev = parseFloat(slRev.value);
      const ebitMargin = parseFloat(slEbit.value) / 100;
      const taxRate = parseFloat(slTax.value) / 100;
      const daRatio = parseFloat(slDa.value) / 100;
      const capexRatio = parseFloat(slCapex.value) / 100;
      const nwcRatio = parseFloat(slNwc.value) / 100;
      const interest = parseFloat(slInterest.value);
      const borrowing = parseFloat(slBorrowing.value);

      document.getElementById('m2ValRev').textContent = formatPLN(rev, 0);
      document.getElementById('m2ValEbit').textContent = formatPercent(ebitMargin * 100, 1);
      document.getElementById('m2ValTax').textContent = formatPercent(taxRate * 100, 1);
      document.getElementById('m2ValDa').textContent = formatPercent(daRatio * 100, 1);
      document.getElementById('m2ValCapex').textContent = formatPercent(capexRatio * 100, 1);
      document.getElementById('m2ValNwc').textContent = formatPercent(nwcRatio * 100, 1);
      document.getElementById('m2ValInterest').textContent = formatPLN(interest, 0);
      document.getElementById('m2ValBorrowing').textContent = formatPLN(borrowing, 0);

      // FCFF Calculations
      const ebit = rev * ebitMargin;
      const taxes = ebit * taxRate;
      const nopat = ebit * (1 - taxRate);
      const da = rev * daRatio;
      const capex = rev * capexRatio;
      const deltaNwc = rev * nwcRatio;
      const fcff = nopat + da - capex - deltaNwc;

      // FCFE Calculations
      const ebt = Math.max(0, ebit - interest);
      const taxNet = ebt * taxRate;
      const netIncome = ebt - taxNet;
      const fcfe = netIncome + da - capex - deltaNwc + borrowing;

      document.getElementById('m2OutEbit').textContent = formatPLN(ebit, 1);
      document.getElementById('m2OutNopat').textContent = formatPLN(nopat, 1);
      document.getElementById('m2OutFcff').textContent = formatPLN(fcff, 1);
      document.getElementById('m2OutNetIncome').textContent = formatPLN(netIncome, 1);
      document.getElementById('m2OutFcfe').textContent = formatPLN(fcfe, 1);

      // Waterfall Chart for FCFF
      const xLabels = ['EBIT', 'Podatek NOPAT', '+ D&A', '- CapEx', '- ΔNWC', 'FCFF'];
      const yValues = [ebit, -taxes, da, -capex, -deltaNwc, fcff];
      const measure = ['relative', 'relative', 'relative', 'relative', 'relative', 'total'];

      const waterfallData = [{
        type: 'waterfall',
        orientation: 'v',
        measure: measure,
        x: xLabels,
        textposition: 'outside',
        text: yValues.map(v => (v > 0 ? '+' : '') + v.toFixed(1)),
        y: [ebit, -taxes, da, -capex, -deltaNwc, 0],
        connector: { line: { color: '#94a3b8' } },
        increasing: { marker: { color: '#059669' } },
        decreasing: { marker: { color: '#e11d48' } },
        totals: { marker: { color: '#2563eb' } }
      }];

      const layout = {
        margin: { t: 25, r: 25, b: 40, l: 55 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        yaxis: {
          title: 'mln PLN',
          gridcolor: '#f1f5f9'
        },
        xaxis: { gridcolor: '#f8fafc' }
      };

      Plotly.react('m2WaterfallChart', waterfallData, layout, { responsive: true, displayModeBar: false });
    }

    [slRev, slEbit, slTax, slDa, slCapex, slNwc, slInterest, slBorrowing].forEach(sl => sl.addEventListener('input', update));
    update();
  }

  // --- MODUŁ 3: Matematyka Kosztu Kapitału (WACC & CAPM & Hamada) ---
  function initModule3() {
    const slRf = document.getElementById('m3SliderRf');
    const slBetaU = document.getElementById('m3SliderBetaU');
    const slErp = document.getElementById('m3SliderErp');
    const slTax = document.getElementById('m3SliderTax');
    const slDebt = document.getElementById('m3SliderDebt');
    const slEquity = document.getElementById('m3SliderEquity');
    const slCostDebt = document.getElementById('m3SliderCostDebt');

    function update() {
      const rf = parseFloat(slRf.value);
      const betaU = parseFloat(slBetaU.value);
      const erp = parseFloat(slErp.value);
      const tax = parseFloat(slTax.value);
      const debt = parseFloat(slDebt.value);
      const equity = parseFloat(slEquity.value);
      const rdPre = parseFloat(slCostDebt.value);

      document.getElementById('m3ValRf').textContent = formatPercent(rf, 2);
      document.getElementById('m3ValBetaU').textContent = formatRatio(betaU, 2);
      document.getElementById('m3ValErp').textContent = formatPercent(erp, 2);
      document.getElementById('m3ValTax').textContent = formatPercent(tax, 1);
      document.getElementById('m3ValDebt').textContent = formatPLN(debt, 0);
      document.getElementById('m3ValEquity').textContent = formatPLN(equity, 0);
      document.getElementById('m3ValCostDebt').textContent = formatPercent(rdPre, 2);

      const V = debt + equity;
      const wD = debt / V;
      const wE = equity / V;
      const t = tax / 100;

      // Hamada Equation: Beta_L = Beta_U * [1 + (1 - t) * (D / E)]
      const betaL = betaU * (1 + (1 - t) * (debt / equity));

      // CAPM: Re = Rf + Beta_L * ERP
      const re = rf + betaL * erp;

      // After-tax cost of debt: Rd * (1 - t)
      const rdPost = rdPre * (1 - t);

      // WACC = wE * Re + wD * RdPost
      const wacc = (wE * re) + (wD * rdPost);

      document.getElementById('m3OutBetaL').textContent = formatRatio(betaL, 2);
      document.getElementById('m3OutRe').textContent = formatPercent(re, 2);
      document.getElementById('m3OutRdPost').textContent = formatPercent(rdPost, 2);
      document.getElementById('m3OutWd').textContent = formatPercent(wD * 100, 1);
      document.getElementById('m3OutWe').textContent = formatPercent(wE * 100, 1);
      document.getElementById('m3OutWacc').textContent = formatPercent(wacc, 2);

      // Simulation curve: WACC vs D/V ratio (U-curve with financial distress cost)
      const dvRatios = [];
      const waccCurve = [];
      const reCurve = [];
      const rdCurve = [];

      for (let ratio = 0; ratio <= 0.85; ratio += 0.05) {
        dvRatios.push((ratio * 100).toFixed(0) + '%');
        const d_e = ratio / (1 - ratio || 0.001);
        const bL = betaU * (1 + (1 - t) * d_e);
        const curRe = rf + bL * erp;
        // Non-linear increase in cost of debt for high distress
        const distressSpread = ratio > 0.40 ? Math.pow(ratio - 0.40, 2) * 18 : 0;
        const curRdPost = (rdPre + distressSpread) * (1 - t);
        const curWacc = (1 - ratio) * curRe + ratio * curRdPost;

        reCurve.push(curRe);
        rdCurve.push(curRdPost);
        waccCurve.push(curWacc);
      }

      const traceWacc = {
        x: dvRatios,
        y: waccCurve,
        name: 'WACC',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#2563eb', width: 3.5 }
      };

      const traceRe = {
        x: dvRatios,
        y: reCurve,
        name: 'Koszt Kapitału Własnego (Re)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#e11d48', width: 2, dash: 'dash' }
      };

      const traceRd = {
        x: dvRatios,
        y: rdCurve,
        name: 'Koszt Długu Netto (Rd × (1-t))',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#059669', width: 2, dash: 'dot' }
      };

      // Current point marker
      const curRatioIdx = Math.min(dvRatios.length - 1, Math.max(0, Math.round(wD / 0.05)));
      const tracePoint = {
        x: [dvRatios[curRatioIdx]],
        y: [wacc],
        name: 'Aktualna Struktura',
        type: 'scatter',
        mode: 'markers',
        marker: { size: 12, color: '#d97706', symbol: 'diamond' }
      };

      const layout = {
        margin: { t: 25, r: 25, b: 40, l: 55 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        legend: { orientation: 'h', y: 1.15, x: 0 },
        yaxis: {
          title: 'Stopa Kosztu (%)',
          gridcolor: '#f1f5f9'
        },
        xaxis: {
          title: 'Udział Długu w Strukturze (D / V)',
          gridcolor: '#f8fafc'
        }
      };

      Plotly.react('m3WaccCurveChart', [traceWacc, traceRe, traceRd, tracePoint], layout, { responsive: true, displayModeBar: false });
    }

    [slRf, slBetaU, slErp, slTax, slDebt, slEquity, slCostDebt].forEach(sl => sl.addEventListener('input', update));
    update();
  }

  // --- MODUŁ 4: Wartość Rezydualna (Terminal Value - TV) ---
  function initModule4() {
    const btnGordon = document.getElementById('m4BtnGordon');
    const btnMultiple = document.getElementById('m4BtnMultiple');
    const slFcffLast = document.getElementById('m4SliderFcffLast');
    const slWacc = document.getElementById('m4SliderWacc');
    const slG = document.getElementById('m4SliderG');
    const slRoic = document.getElementById('m4SliderRoic');
    const slMultiple = document.getElementById('m4SliderMultiple');
    const slEbitdaLast = document.getElementById('m4SliderEbitdaLast');

    function update() {
      const isGordon = state.m4.method === 'gordon';
      document.getElementById('m4GordonControls').classList.toggle('hidden', !isGordon);
      document.getElementById('m4MultipleControls').classList.toggle('hidden', isGordon);

      btnGordon.classList.toggle('bg-blue-600', isGordon);
      btnGordon.classList.toggle('text-white', isGordon);
      btnGordon.classList.toggle('bg-slate-100', !isGordon);
      btnGordon.classList.toggle('text-slate-700', !isGordon);

      btnMultiple.classList.toggle('bg-blue-600', !isGordon);
      btnMultiple.classList.toggle('text-white', !isGordon);
      btnMultiple.classList.toggle('bg-slate-100', isGordon);
      btnMultiple.classList.toggle('text-slate-700', isGordon);

      const fcffLast = parseFloat(slFcffLast.value);
      const wacc = parseFloat(slWacc.value) / 100;
      const g = parseFloat(slG.value) / 100;
      const roic = parseFloat(slRoic.value) / 100;
      const multiple = parseFloat(slMultiple.value);
      const ebitdaLast = parseFloat(slEbitdaLast.value);

      document.getElementById('m4ValFcffLast').textContent = formatPLN(fcffLast, 0);
      document.getElementById('m4ValWacc').textContent = formatPercent(wacc * 100, 2);
      document.getElementById('m4ValG').textContent = formatPercent(g * 100, 2);
      document.getElementById('m4ValRoic').textContent = formatPercent(roic * 100, 1);
      document.getElementById('m4ValMultiple').textContent = multiple.toFixed(1) + 'x';
      document.getElementById('m4ValEbitdaLast').textContent = formatPLN(ebitdaLast, 0);

      // Warning when g >= wacc
      const gWarning = document.getElementById('m4GWarning');
      if (g >= wacc) {
        gWarning.classList.remove('hidden');
      } else {
        gWarning.classList.add('hidden');
      }

      // Reinvestment Rate: RR = g / ROIC
      const reinvestmentRate = (g / (roic || 0.01)) * 100;
      document.getElementById('m4OutReinvestmentRate').textContent = reinvestmentRate.toFixed(1) + '%';

      let tv = 0;
      let impliedEv = 0;
      if (isGordon) {
        const spread = Math.max(0.002, wacc - g);
        const fcffNext = fcffLast * (1 + g);
        tv = fcffNext / spread;
      } else {
        tv = ebitdaLast * multiple;
      }

      // Present value of TV after 5 years (discount factor 1 / (1+wacc)^5)
      const pvFactor = 1 / Math.pow(1 + wacc, 5);
      const pvTv = tv * pvFactor;

      document.getElementById('m4OutTvNominal').textContent = formatPLN(tv, 1);
      document.getElementById('m4OutTvPv').textContent = formatPLN(pvTv, 1);

      // Illustrative comparison of TV share
      const assumedForecastPv = 420; // 5-year explicit forecast
      const totalEv = assumedForecastPv + pvTv;
      const tvShare = (pvTv / totalEv) * 100;
      document.getElementById('m4OutTvShare').textContent = tvShare.toFixed(1) + '%';

      // Donut chart of Enterprise Value composition
      const donutData = [{
        values: [assumedForecastPv, pvTv],
        labels: ['Przepływy 5-letnie (PV)', 'Wartość Rezydualna (PV TV)'],
        type: 'pie',
        hole: 0.58,
        marker: { colors: ['#93c5fd', '#2563eb'] },
        textinfo: 'label+percent',
        insidetextorientation: 'radial'
      }];

      const layout = {
        margin: { t: 20, r: 20, b: 20, l: 20 },
        paper_bgcolor: 'transparent',
        showlegend: false
      };

      Plotly.react('m4TvPieChart', donutData, layout, { responsive: true, displayModeBar: false });
    }

    btnGordon.addEventListener('click', () => { state.m4.method = 'gordon'; update(); });
    btnMultiple.addEventListener('click', () => { state.m4.method = 'multiple'; update(); });

    [slFcffLast, slWacc, slG, slRoic, slMultiple, slEbitdaLast].forEach(sl => sl.addEventListener('input', update));
    update();
  }

  // --- MODUŁ 5: Most Wyceny: Od Enterprise Value do Ceny Akcji ---
  function initModule5() {
    const slPvFcff = document.getElementById('m5SliderPvFcff');
    const slPvTv = document.getElementById('m5SliderPvTv');
    const slCash = document.getElementById('m5SliderCash');
    const slDebt = document.getElementById('m5SliderDebt');
    const slNonOp = document.getElementById('m5SliderNonOp');
    const slMinority = document.getElementById('m5SliderMinority');
    const slOptions = document.getElementById('m5SliderOptions');
    const slShares = document.getElementById('m5SliderShares');
    const slCurrentPrice = document.getElementById('m5SliderCurrentPrice');

    function update() {
      const pvFcff = parseFloat(slPvFcff.value);
      const pvTv = parseFloat(slPvTv.value);
      const cash = parseFloat(slCash.value);
      const debt = parseFloat(slDebt.value);
      const nonOp = parseFloat(slNonOp.value);
      const minority = parseFloat(slMinority.value);
      const optionsVal = parseFloat(slOptions.value);
      const shares = parseFloat(slShares.value);
      const marketPrice = parseFloat(slCurrentPrice.value);

      document.getElementById('m5ValPvFcff').textContent = formatPLN(pvFcff, 0);
      document.getElementById('m5ValPvTv').textContent = formatPLN(pvTv, 0);
      document.getElementById('m5ValCash').textContent = formatPLN(cash, 0);
      document.getElementById('m5ValDebt').textContent = formatPLN(debt, 0);
      document.getElementById('m5ValNonOp').textContent = formatPLN(nonOp, 0);
      document.getElementById('m5ValMinority').textContent = formatPLN(minority, 0);
      document.getElementById('m5ValOptions').textContent = formatPLN(optionsVal, 0);
      document.getElementById('m5ValShares').textContent = shares.toFixed(1) + ' mln';
      document.getElementById('m5ValCurrentPrice').textContent = marketPrice.toFixed(2) + ' PLN';

      // Enterprise Value = PV(Forecast) + PV(TV)
      const ev = pvFcff + pvTv;
      const netDebt = debt - cash;

      // Equity Value = EV + Cash - Debt + NonOp - Minority - Options
      const equityValue = ev + cash - debt + nonOp - minority - optionsVal;

      // Implied Price
      const impliedPrice = equityValue / shares;
      const marginOfSafety = ((impliedPrice - marketPrice) / marketPrice) * 100;

      document.getElementById('m5OutEv').textContent = formatPLN(ev, 1);
      document.getElementById('m5OutNetDebt').textContent = formatPLN(netDebt, 1);
      document.getElementById('m5OutEquityVal').textContent = formatPLN(equityValue, 1);
      document.getElementById('m5OutImpliedPrice').textContent = impliedPrice.toFixed(2) + ' PLN';

      const mosBadge = document.getElementById('m5OutMosBadge');
      if (marginOfSafety > 0) {
        mosBadge.textContent = `Niedowartościowana (+${marginOfSafety.toFixed(1)}% dyskonta)`;
        mosBadge.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
      } else {
        mosBadge.textContent = `Przewartościowana (${marginOfSafety.toFixed(1)}% premii)`;
        mosBadge.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300';
      }

      // Equity Bridge Waterfall Chart
      const bridgeLabels = ['Enterprise Value', '+ Gotówka', '- Dług Brutto', '+ Aktywa Nieoper.', '- Mniejszości/ESOP', 'Equity Value'];
      const bridgeValues = [ev, cash, -debt, nonOp, -(minority + optionsVal), equityValue];

      const bridgeData = [{
        type: 'waterfall',
        orientation: 'v',
        measure: ['relative', 'relative', 'relative', 'relative', 'relative', 'total'],
        x: bridgeLabels,
        textposition: 'outside',
        text: [
          ev.toFixed(0),
          '+' + cash.toFixed(0),
          '-' + debt.toFixed(0),
          '+' + nonOp.toFixed(0),
          '-' + (minority + optionsVal).toFixed(0),
          equityValue.toFixed(0)
        ],
        y: [ev, cash, -debt, nonOp, -(minority + optionsVal), 0],
        connector: { line: { color: '#94a3b8' } },
        increasing: { marker: { color: '#059669' } },
        decreasing: { marker: { color: '#e11d48' } },
        totals: { marker: { color: '#2563eb' } }
      }];

      const layout = {
        margin: { t: 30, r: 25, b: 65, l: 55 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        yaxis: {
          title: 'Wartość (mln PLN)',
          gridcolor: '#f1f5f9'
        },
        xaxis: { tickangle: -20, gridcolor: '#f8fafc' }
      };

      Plotly.react('m5BridgeChart', bridgeData, layout, { responsive: true, displayModeBar: false });
    }

    [slPvFcff, slPvTv, slCash, slDebt, slNonOp, slMinority, slOptions, slShares, slCurrentPrice].forEach(sl => sl.addEventListener('input', update));
    update();
  }

  // --- MODUŁ 6: Macierz Wrażliwości (Sensitivity Analysis) ---
  function initModule6() {
    const slBaseWacc = document.getElementById('m6SliderBaseWacc');
    const slBaseG = document.getElementById('m6SliderBaseG');
    const btnBear = document.getElementById('m6BtnBear');
    const btnBase = document.getElementById('m6BtnBase');
    const btnBull = document.getElementById('m6BtnBull');

    function calculateDcfPrice(waccPct, gPct) {
      const wacc = waccPct / 100;
      const g = gPct / 100;
      if (wacc <= g) return null;

      // 5-year forecast flows
      const flows = state.m6.fcffYear1to5;
      let pvForecast = 0;
      for (let t = 1; t <= 5; t++) {
        pvForecast += flows[t - 1] / Math.pow(1 + wacc, t);
      }

      // TV
      const terminalFcff = flows[4] * (1 + g);
      const tv = terminalFcff / (wacc - g);
      const pvTv = tv / Math.pow(1 + wacc, 5);

      const ev = pvForecast + pvTv;
      const netDebt = 280; // mln PLN
      const equityVal = ev - netDebt;
      const shares = 60; // mln
      return equityVal / shares;
    }

    function renderTable() {
      const baseWacc = parseFloat(slBaseWacc.value);
      const baseG = parseFloat(slBaseG.value);

      document.getElementById('m6ValBaseWacc').textContent = formatPercent(baseWacc, 2);
      document.getElementById('m6ValBaseG').textContent = formatPercent(baseG, 2);

      const waccSteps = [-1.0, -0.5, 0.0, 0.5, 1.0].map(s => +(baseWacc + s).toFixed(2));
      const gSteps = [-0.8, -0.4, 0.0, 0.4, 0.8].map(s => +(baseG + s).toFixed(2));

      const thead = document.getElementById('m6TableHead');
      const tbody = document.getElementById('m6TableBody');

      // Build header row: g values
      let headHtml = '<tr><th class="bg-slate-100 text-slate-700 border border-slate-200">WACC \\ g</th>';
      gSteps.forEach(g => {
        headHtml += `<th class="bg-slate-100 text-slate-700 border border-slate-200">${g.toFixed(2)}%</th>`;
      });
      headHtml += '</tr>';
      thead.innerHTML = headHtml;

      const currentMktPrice = 20.50; // benchmark
      let bodyHtml = '';

      waccSteps.forEach(w => {
        bodyHtml += `<tr><td class="bg-slate-100 font-semibold text-slate-800 border border-slate-200">${w.toFixed(2)}%</td>`;
        gSteps.forEach(g => {
          const price = calculateDcfPrice(w, g);
          if (price === null) {
            bodyHtml += '<td class="bg-slate-200 text-slate-400 border border-slate-200">Brak zb.</td>';
          } else {
            const isBase = Math.abs(w - baseWacc) < 0.01 && Math.abs(g - baseG) < 0.01;
            const diffPct = ((price - currentMktPrice) / currentMktPrice) * 100;

            let bgColor = 'bg-slate-50';
            let textColor = 'text-slate-800';
            if (diffPct > 15) {
              bgColor = 'bg-emerald-100/80';
              textColor = 'text-emerald-900';
            } else if (diffPct > 0) {
              bgColor = 'bg-emerald-50';
              textColor = 'text-emerald-800';
            } else if (diffPct < -15) {
              bgColor = 'bg-rose-100/80';
              textColor = 'text-rose-900';
            } else {
              bgColor = 'bg-rose-50';
              textColor = 'text-rose-800';
            }

            const baseClass = isBase ? 'sensitivity-cell-base ring-2 ring-blue-600 font-bold' : '';
            bodyHtml += `<td class="${bgColor} ${textColor} ${baseClass} border border-slate-200 cursor-default" title="Cena: ${price.toFixed(2)} PLN (${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%)">
              ${price.toFixed(2)} zł
            </td>`;
          }
        });
        bodyHtml += '</tr>';
      });

      tbody.innerHTML = bodyHtml;
    }

    slBaseWacc.addEventListener('input', renderTable);
    slBaseG.addEventListener('input', renderTable);

    btnBear.addEventListener('click', () => {
      slBaseWacc.value = 10.2;
      slBaseG.value = 1.8;
      renderTable();
    });
    btnBase.addEventListener('click', () => {
      slBaseWacc.value = 8.8;
      slBaseG.value = 2.5;
      renderTable();
    });
    btnBull.addEventListener('click', () => {
      slBaseWacc.value = 7.8;
      slBaseG.value = 3.2;
      renderTable();
    });

    renderTable();
  }

  // --- MODUŁ 7: Symulator Monte Carlo DCF ---
  function initModule7() {
    const btnRun = document.getElementById('m7BtnRun');
    const slRuns = document.getElementById('m7SliderRuns');
    const currentMktPrice = 20.50;

    function runSimulation() {
      const runs = parseInt(slRuns.value);
      btnRun.disabled = true;
      btnRun.textContent = 'Trwa symulacja...';

      setTimeout(() => {
        const prices = [];
        let undervaluedCount = 0;

        // Base distributions:
        // Revenue growth mean 6.5%, sd 2.5%
        // EBIT margin mean 18.0%, sd 3.0%
        // WACC mean 8.8%, sd 0.9%
        // g mean 2.5%, sd 0.5%
        const rev0 = 1000;
        const shares = 60;
        const netDebt = 280;

        for (let i = 0; i < runs; i++) {
          const simGrowth = Math.max(0.01, randomNormal(0.065, 0.022));
          const simMargin = Math.max(0.06, randomNormal(0.18, 0.028));
          const simWacc = Math.max(0.05, randomNormal(0.088, 0.009));
          const simG = Math.max(0.008, Math.min(simWacc - 0.008, randomNormal(0.025, 0.005)));

          let pvFcff = 0;
          let curRev = rev0;
          for (let t = 1; t <= 5; t++) {
            curRev *= (1 + simGrowth);
            const ebit = curRev * simMargin;
            const nopat = ebit * (1 - 0.19);
            // Cash flow approximation
            const fcff = nopat * 0.88;
            pvFcff += fcff / Math.pow(1 + simWacc, t);
          }

          const terminalFcff = (curRev * simMargin * 0.81 * 0.88) * (1 + simG);
          const tv = terminalFcff / (simWacc - simG);
          const pvTv = tv / Math.pow(1 + simWacc, 5);

          const ev = pvFcff + pvTv;
          const eqVal = Math.max(0, ev - netDebt);
          const sharePrice = eqVal / shares;

          if (isFinite(sharePrice) && sharePrice > 0 && sharePrice < 150) {
            prices.push(sharePrice);
            if (sharePrice > currentMktPrice) undervaluedCount++;
          }
        }

        prices.sort((a, b) => a - b);
        const p10 = prices[Math.floor(prices.length * 0.10)];
        const p50 = prices[Math.floor(prices.length * 0.50)];
        const p90 = prices[Math.floor(prices.length * 0.90)];
        const probUndervalued = (undervaluedCount / prices.length) * 100;

        document.getElementById('m7OutP10').textContent = p10.toFixed(2) + ' zł';
        document.getElementById('m7OutP50').textContent = p50.toFixed(2) + ' zł';
        document.getElementById('m7OutP90').textContent = p90.toFixed(2) + ' zł';
        document.getElementById('m7OutProb').textContent = probUndervalued.toFixed(1) + '%';

        // Plot histogram
        const histTrace = {
          x: prices,
          type: 'histogram',
          nbinsx: 35,
          marker: {
            color: '#3b82f6',
            line: { color: '#ffffff', width: 1 }
          },
          name: 'Rozkład Wyceny'
        };

        const layout = {
          margin: { t: 25, r: 25, b: 45, l: 50 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            title: 'Wycena Implikowana (PLN / akcję)',
            gridcolor: '#f1f5f9'
          },
          yaxis: {
            title: 'Liczba Prób',
            gridcolor: '#f1f5f9'
          },
          shapes: [
            // Current Market Price vertical line
            {
              type: 'line',
              x0: currentMktPrice,
              x1: currentMktPrice,
              y0: 0,
              y1: 1,
              yref: 'paper',
              line: { color: '#e11d48', width: 2.5, dash: 'dash' }
            },
            // P50 Mediana line
            {
              type: 'line',
              x0: p50,
              x1: p50,
              y0: 0,
              y1: 1,
              yref: 'paper',
              line: { color: '#059669', width: 2.5 }
            }
          ],
          annotations: [
            {
              x: currentMktPrice,
              y: 1,
              yref: 'paper',
              text: `Kurs rynkowy (${currentMktPrice.toFixed(2)} zł)`,
              showarrow: true,
              arrowhead: 2,
              ax: -55,
              ay: -25,
              font: { color: '#e11d48', size: 11 }
            },
            {
              x: p50,
              y: 0.85,
              yref: 'paper',
              text: `Mediana P50 (${p50.toFixed(2)} zł)`,
              showarrow: true,
              arrowhead: 2,
              ax: 55,
              ay: -25,
              font: { color: '#059669', size: 11 }
            }
          ]
        };

        Plotly.react('m7HistogramChart', [histTrace], layout, { responsive: true, displayModeBar: false });

        btnRun.disabled = false;
        btnRun.textContent = '🚀 Uruchom Symulację Ponownie';
      }, 50);
    }

    slRuns.addEventListener('input', () => {
      document.getElementById('m7ValRuns').textContent = parseInt(slRuns.value).toLocaleString('pl-PL') + ' prób';
    });
    btnRun.addEventListener('click', runSimulation);
    runSimulation();
  }

  // --- MODUŁ 8: Pełny Model Archetypowy Sandbox ---
  function initModule8() {
    const pTabs = document.querySelectorAll('.archetype-tab');

    function applyArchetype(key) {
      const p = state.m8.presets[key];
      if (!p) return;
      state.m8.currentArchetype = key;

      pTabs.forEach(t => {
        const isActive = t.dataset.archetype === key;
        t.classList.toggle('border-blue-600', isActive);
        t.classList.toggle('text-blue-600', isActive);
        t.classList.toggle('font-bold', isActive);
        t.classList.toggle('border-transparent', !isActive);
        t.classList.toggle('text-slate-500', !isActive);
      });

      document.getElementById('m8ArchTitle').textContent = p.name;
      document.getElementById('m8ArchDesc').textContent = p.desc;

      // Inputs
      document.getElementById('m8InRev0').value = p.rev0;
      document.getElementById('m8InEbitMargin').value = p.ebitMargin;
      document.getElementById('m8InTaxRate').value = p.taxRate;
      document.getElementById('m8InCapexRatio').value = p.capexRatio;
      document.getElementById('m8InDaRatio').value = p.daRatio;
      document.getElementById('m8InNwcRatio').value = p.nwcRatio;
      document.getElementById('m8InRf').value = p.rf;
      document.getElementById('m8InBeta').value = p.beta;
      document.getElementById('m8InErp').value = p.erp;
      document.getElementById('m8InCostDebt').value = p.costDebt;
      document.getElementById('m8InDebt').value = p.debt;
      document.getElementById('m8InEquity').value = p.equity;
      document.getElementById('m8InG').value = p.g;
      document.getElementById('m8InCash').value = p.cash;
      document.getElementById('m8InShares').value = p.shares;
      document.getElementById('m8InMarketPrice').value = p.marketPrice;

      // 5-year growth inputs
      for (let y = 1; y <= 5; y++) {
        document.getElementById(`m8InGrowthY${y}`).value = p.growthYears[y - 1];
      }

      recalculate();
    }

    function recalculate() {
      const rev0 = parseFloat(document.getElementById('m8InRev0').value) || 1000;
      const ebitMargin = (parseFloat(document.getElementById('m8InEbitMargin').value) || 15) / 100;
      const taxRate = (parseFloat(document.getElementById('m8InTaxRate').value) || 19) / 100;
      const capexRatio = (parseFloat(document.getElementById('m8InCapexRatio').value) || 6) / 100;
      const daRatio = (parseFloat(document.getElementById('m8InDaRatio').value) || 5) / 100;
      const nwcRatio = (parseFloat(document.getElementById('m8InNwcRatio').value) || 2) / 100;

      const rf = (parseFloat(document.getElementById('m8InRf').value) || 5) / 100;
      const beta = parseFloat(document.getElementById('m8InBeta').value) || 1.0;
      const erp = (parseFloat(document.getElementById('m8InErp').value) || 5.5) / 100;
      const costDebt = (parseFloat(document.getElementById('m8InCostDebt').value) || 6.5) / 100;
      const debt = parseFloat(document.getElementById('m8InDebt').value) || 200;
      const equity = parseFloat(document.getElementById('m8InEquity').value) || 800;
      const g = (parseFloat(document.getElementById('m8InG').value) || 2.5) / 100;
      const cash = parseFloat(document.getElementById('m8InCash').value) || 100;
      const shares = parseFloat(document.getElementById('m8InShares').value) || 50;
      const mktPrice = parseFloat(document.getElementById('m8InMarketPrice').value) || 20;

      // Calculate WACC
      const V = debt + equity;
      const wD = debt / V;
      const wE = equity / V;
      const re = rf + beta * erp;
      const rdPost = costDebt * (1 - taxRate);
      const wacc = (wE * re) + (wD * rdPost);

      document.getElementById('m8OutWaccLive').textContent = (wacc * 100).toFixed(2) + '%';
      document.getElementById('m8OutReLive').textContent = (re * 100).toFixed(2) + '%';

      // 5-year projections
      const years = ['Rok 1', 'Rok 2', 'Rok 3', 'Rok 4', 'Rok 5'];
      const fcffArr = [];
      const pvFcffArr = [];
      let curRev = rev0;
      let sumPvFcff = 0;

      for (let t = 1; t <= 5; t++) {
        const growth = (parseFloat(document.getElementById(`m8InGrowthY${t}`).value) || 5) / 100;
        curRev *= (1 + growth);
        const ebit = curRev * ebitMargin;
        const nopat = ebit * (1 - taxRate);
        const da = curRev * daRatio;
        const capex = curRev * capexRatio;
        const deltaNwc = curRev * nwcRatio;
        const fcff = nopat + da - capex - deltaNwc;
        const pv = fcff / Math.pow(1 + wacc, t);

        fcffArr.push(fcff);
        pvFcffArr.push(pv);
        sumPvFcff += pv;
      }

      // Terminal Value
      const terminalFcff = fcffArr[4] * (1 + g);
      const tvNominal = terminalFcff / Math.max(0.002, wacc - g);
      const pvTv = tvNominal / Math.pow(1 + wacc, 5);

      const ev = sumPvFcff + pvTv;
      const eqVal = ev + cash - debt;
      const impliedPrice = eqVal / shares;
      const mos = ((impliedPrice - mktPrice) / mktPrice) * 100;

      document.getElementById('m8OutEvVal').textContent = formatPLN(ev, 1);
      document.getElementById('m8OutPvFcffVal').textContent = formatPLN(sumPvFcff, 1);
      document.getElementById('m8OutPvTvVal').textContent = formatPLN(pvTv, 1);
      document.getElementById('m8OutEqVal').textContent = formatPLN(eqVal, 1);
      document.getElementById('m8OutImpliedShare').textContent = impliedPrice.toFixed(2) + ' PLN';

      const pill = document.getElementById('m8OutVerdictPill');
      if (mos > 0) {
        pill.textContent = `Niedowartościowanie +${mos.toFixed(1)}% (Margin of Safety)`;
        pill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
      } else {
        pill.textContent = `Przewartościowanie ${mos.toFixed(1)}%`;
        pill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300';
      }

      // Projection Bar Chart
      const chartTrace = {
        x: [...years, 'Wartość Rezydualna (PV TV)'],
        y: [...pvFcffArr, pvTv],
        type: 'bar',
        marker: {
          color: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#059669']
        },
        text: [...pvFcffArr, pvTv].map(v => v.toFixed(0) + ' mln'),
        textposition: 'outside'
      };

      const layout = {
        margin: { t: 30, r: 25, b: 50, l: 55 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        yaxis: {
          title: 'Wartość Bieżąca (PV mln PLN)',
          gridcolor: '#f1f5f9'
        },
        xaxis: { gridcolor: '#f8fafc' }
      };

      Plotly.react('m8ProjectionsChart', [chartTrace], layout, { responsive: true, displayModeBar: false });
    }

    pTabs.forEach(t => {
      t.addEventListener('click', () => applyArchetype(t.dataset.archetype));
    });

    // Listen to all inputs inside module 8
    document.querySelectorAll('#module8 input').forEach(inp => {
      inp.addEventListener('input', recalculate);
    });

    applyArchetype('bigtech');
  }

  // --- MODUŁ 10: Interaktywny Quiz Sprawdzający Wiedzę ---
  function initModule10() {
    const quizQuestions = [
      {
        id: 'q1',
        correct: 'B',
        exp: 'FCFF to przepływ wolny dla wszystkich dawców kapitału (wierzycieli i akcjonariuszy), dlatego MUSI być dyskontowany średnioważonym kosztem kapitału (WACC). Dyskontowanie FCFF kosztem kapitału własnego (Re) to kardynalny błąd zaniżający dyskont (Re > WACC), sztucznie zawyżający wycenę!'
      },
      {
        id: 'q2',
        correct: 'C',
        exp: 'Równanie Hamady: Beta_L = Beta_U * [1 + (1 - t)*(D/E)]. Wraz ze wzrostem dźwigni finansowej rośnie ryzyko finansowe akcjonariuszy, co podbija betę zalewarowaną (Beta_L) i zwiększa wymagany koszt kapitału własnego.'
      },
      {
        id: 'q3',
        correct: 'B',
        exp: 'Wzór Gordona bazuje na sumie nieskończonego szeregu geometrycznego, który jest zbieżny wyłącznie wtedy, gdy stopa dyskontowa jest wyższa od stopy wzrostu (WACC > g). Jeśli g >= WACC, mianownik staje się ujemny lub zerowy, a wycena dąży do nieskończoności.'
      },
      {
        id: 'q4',
        correct: 'A',
        exp: 'W mostku z EV do Equity Value gotówkę operacyjną i nadwyżkową DODAJEMY do Enterprise Value, a dług brutto ODEJMUJEMY (lub odejmujemy dług netto: Dług - Gotówka).'
      },
      {
        id: 'q5',
        correct: 'C',
        exp: 'SBC (Stock-Based Compensation) nie wymaga natychmiastowego wydatku gotówkowego, ale rozwadnia istniejących akcjonariuszy. Dodanie SBC z powrotem do zysku bez powiększenia liczby rozwodnionych akcji (Diluted Shares) zawyża wycenę na akcję.'
      },
      {
        id: 'q6',
        correct: 'B',
        exp: 'Fundamentalny wzór Damodarana: g = ROIC × Stopa Reinwestycji. Spółka nie może rosnąć bez inwestowania kapitału, chyba że jej ROIC dąży do nieskończoności.'
      }
    ];

    const scoreDisplay = document.getElementById('quizScoreText');
    const resetBtn = document.getElementById('quizResetBtn');

    function updateScore() {
      let score = 0;
      let answered = 0;
      quizQuestions.forEach(q => {
        if (state.quiz.answers[q.id]) {
          answered++;
          if (state.quiz.answers[q.id] === q.correct) score++;
        }
      });
      state.quiz.score = score;
      if (scoreDisplay) {
        scoreDisplay.textContent = `${score} / ${quizQuestions.length}`;
      }
    }

    quizQuestions.forEach(q => {
      const options = document.querySelectorAll(`.quiz-opt[data-qid="${q.id}"]`);
      const feedback = document.getElementById(`quizFb_${q.id}`);

      options.forEach(opt => {
        opt.addEventListener('click', () => {
          if (state.quiz.answers[q.id]) return; // already answered
          const chosen = opt.dataset.ans;
          state.quiz.answers[q.id] = chosen;

          options.forEach(o => {
            o.disabled = true;
            if (o.dataset.ans === q.correct) {
              o.classList.add('correct');
            } else if (o.dataset.ans === chosen) {
              o.classList.add('incorrect');
            }
          });

          if (feedback) {
            feedback.classList.remove('hidden');
            const isRight = chosen === q.correct;
            feedback.innerHTML = `
              <div class="p-3 rounded-lg text-xs leading-relaxed ${isRight ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}">
                <strong>${isRight ? '✓ Znakomicie!' : '✗ Błędna odpowiedź.'}</strong> ${q.exp}
              </div>
            `;
          }

          updateScore();
        });
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.quiz.answers = {};
        quizQuestions.forEach(q => {
          const options = document.querySelectorAll(`.quiz-opt[data-qid="${q.id}"]`);
          const feedback = document.getElementById(`quizFb_${q.id}`);
          options.forEach(o => {
            o.disabled = false;
            o.classList.remove('correct', 'incorrect');
          });
          if (feedback) {
            feedback.classList.add('hidden');
            feedback.innerHTML = '';
          }
        });
        updateScore();
      });
    }

    updateScore();
  }

  // --- MODUŁ 11: Python Modal & Copy Script ---
  function initModule11() {
    const btnOpen = document.getElementById('btnOpenPythonModal');
    const btnClose = document.getElementById('btnClosePythonModal');
    const modal = document.getElementById('pythonModal');
    const btnCopy = document.getElementById('btnCopyPythonCode');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    }
    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const code = document.getElementById('pythonCodeBlock').innerText;
        navigator.clipboard.writeText(code).then(() => {
          const orig = btnCopy.textContent;
          btnCopy.textContent = '✓ Skopiowano do schowka!';
          setTimeout(() => { btnCopy.textContent = orig; }, 2000);
        });
      });
    }
  }

  // --- Auto-init on DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', () => {
    initModule1();
    initModule2();
    initModule3();
    initModule4();
    initModule5();
    initModule6();
    initModule7();
    initModule8();
    initModule10();
    initModule11();

    // KaTeX render if available
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }

    // Scrollspy dla lewego sidebara
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('section[id]').forEach(sec => observer.observe(sec));
  });

})();
