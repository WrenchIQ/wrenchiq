const $ = (id) => document.getElementById(id);

const diagnosticCard = $('diagnosticCard');
const fixCard = $('fixCard');
const stepsEl = $('steps');

const rules = [
  {
    match: ({dtc, complaint, scanData}) => dtc.includes('P0171') || /lean|rough idle|fuel trim/i.test(complaint + ' ' + scanData),
    confidence: '82%',
    summary: 'Lean-condition workflow. Start by determining whether the fault is strongest at idle or remains under load before replacing parts.',
    steps: [
      ['Compare fuel trims at idle vs 2,500 RPM', 'If trims improve significantly off-idle, prioritize unmetered air/vacuum leaks. If they stay high, move toward fuel delivery or MAF/load calculation checks.'],
      ['Inspect for unmetered air', 'Check intake ducting, PCV hoses, brake booster hose, intake manifold sealing, and vacuum connections. Smoke-test when appropriate.'],
      ['Validate MAF / calculated load', 'Compare airflow and load data against engine size, RPM, and operating condition. Inspect contamination or wiring before condemning the sensor.'],
      ['Check fuel delivery if lean under load', 'Verify pressure/volume and consider injector restriction only after air-measurement and vacuum-leak checks are reasonable.']
    ]
  },
  {
    match: ({dtc, complaint}) => dtc.includes('P0456') || /evap|small leak|fuel cap/i.test(complaint),
    confidence: '79%',
    summary: 'EVAP small-leak workflow. Verify sealing and purge behavior before replacing canister or valves.',
    steps: [
      ['Verify fuel-cap and filler-neck sealing', 'Inspect cap seal, filler neck, and obvious hose damage. Confirm the cap is correct for the vehicle.'],
      ['Check purge valve sealing', 'With the purge commanded closed, verify it is not passing vacuum unexpectedly.'],
      ['Smoke-test the EVAP system', 'Use the correct service-port or test method and inspect hoses, canister connections, vent valve area, and tank sealing points.'],
      ['Review monitor conditions and freeze-frame', 'Confirm when the code set and whether ambient/fuel-level conditions point toward an intermittent seal or valve issue.']
    ]
  },
  {
    match: ({complaint}) => /vibration|shake|shudder/i.test(complaint),
    confidence: '72%',
    summary: 'Vibration workflow. Separate speed-related, load-related, and engine-RPM-related causes before parts replacement.',
    steps: [
      ['Classify the vibration', 'Determine whether it follows vehicle speed, engine RPM, throttle/load, braking, or steering input.'],
      ['Inspect tires/wheels and runout', 'Check pressure, balance evidence, damage, tread separation, and wheel/tire runout.'],
      ['Check driveline under load', 'If vibration appears mainly on acceleration, inspect CV axles, propeller shaft, mounts, and driveline angles/play as applicable.'],
      ['Compare in neutral / coast conditions', 'A change when coasting or shifting to neutral can help separate engine/load causes from vehicle-speed causes.']
    ]
  }
];

function getInput() {
  return {
    year: $('year').value.trim(),
    make: $('make').value.trim(),
    model: $('model').value.trim(),
    engine: $('engine').value.trim(),
    vin: $('vin').value.trim().toUpperCase(),
    complaint: $('complaint').value.trim(),
    dtc: $('dtc').value.trim().toUpperCase(),
    mileage: $('mileage').value.trim(),
    scanData: $('scanData').value.trim()
  };
}

function genericPlan() {
  return {
    confidence: '65%',
    summary: 'General diagnostic workflow. Verify the complaint, gather objective data, isolate the system, and test before replacing components.',
    steps: [
      ['Verify the customer concern', 'Reproduce the problem and record the exact operating conditions when it occurs.'],
      ['Perform a full vehicle scan', 'Record current, pending, history, and related-network DTCs before clearing anything.'],
      ['Review live data and freeze-frame', 'Identify values that do not agree with the operating condition or with related sensors.'],
      ['Inspect the highest-probability system', 'Check power, ground, connectors, wiring, mechanical condition, and service history before component replacement.']
    ]
  };
}

function renderPlan(plan, input) {
  $('confidence').textContent = `Confidence: ${plan.confidence}`;
  $('summary').innerHTML = `<strong>${input.year} ${input.make} ${input.model}</strong>${input.dtc ? ` · ${input.dtc}` : ''}<br>${plan.summary}`;
  stepsEl.innerHTML = '';

  plan.steps.forEach((s, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'step';
    wrap.innerHTML = `
      <h3>${i + 1}. ${s[0]}</h3>
      <p>${s[1]}</p>
      <div class="step-actions">
        <button data-result="pass">Pass / Normal</button>
        <button data-result="fail">Fail / Abnormal</button>
        <button data-result="skip">Not Checked</button>
      </div>
      <div class="history-meta result-line"></div>
    `;
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const label = btn.dataset.result === 'pass' ? 'Recorded: normal' : btn.dataset.result === 'fail' ? 'Recorded: abnormal — move this branch higher in priority' : 'Recorded: not checked';
        wrap.querySelector('.result-line').textContent = label;
        fixCard.classList.remove('hidden');
      });
    });
    stepsEl.appendChild(wrap);
  });
  diagnosticCard.classList.remove('hidden');
  fixCard.classList.remove('hidden');
  diagnosticCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('diagnoseBtn').addEventListener('click', () => {
  const input = getInput();
  if (!input.complaint && !input.dtc) {
    alert('Enter a customer complaint or DTC first.');
    return;
  }
  const plan = rules.find(r => r.match(input)) || genericPlan();
  renderPlan(plan, input);
});

$('saveFixBtn').addEventListener('click', () => {
  const input = getInput();
  const record = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    vehicle: `${input.year} ${input.make} ${input.model}`.trim(),
    dtc: input.dtc,
    complaint: input.complaint,
    mileage: input.mileage,
    rootCause: $('rootCause').value.trim(),
    repair: $('repair').value.trim()
  };
  if (!record.rootCause) {
    alert('Enter the confirmed root cause before saving.');
    return;
  }
  const history = JSON.parse(localStorage.getItem('wrenchiq_history') || '[]');
  history.unshift(record);
  localStorage.setItem('wrenchiq_history', JSON.stringify(history.slice(0, 50)));
  $('saveMessage').textContent = 'Confirmed repair saved locally.';
  renderHistory();
});

$('resetBtn').addEventListener('click', () => location.reload());
$('clearHistoryBtn').addEventListener('click', () => {
  localStorage.removeItem('wrenchiq_history');
  renderHistory();
});

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('wrenchiq_history') || '[]');
  if (!history.length) {
    $('history').className = 'history muted';
    $('history').textContent = 'No saved repairs yet.';
    return;
  }
  $('history').className = 'history';
  $('history').innerHTML = history.map(r => `
    <div class="history-item">
      <strong>${r.vehicle || 'Unknown vehicle'}${r.dtc ? ` · ${r.dtc}` : ''}</strong>
      <div>${r.rootCause}${r.repair ? ` — ${r.repair}` : ''}</div>
      <div class="history-meta">${r.date}${r.mileage ? ` · ${r.mileage} miles` : ''}</div>
    </div>
  `).join('');
}

renderHistory();
