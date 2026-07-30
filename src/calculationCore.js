/**
 * Industrial heat pump SPF core (VDI 4645 bin method, no DOM).
 * SPF = Q_total / (E_compressor + E_aux)
 * E_compressor per period = Q / COP (when Q > 0 and COP > 0)
 */

function isFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n);
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return obj[k];
    }
  }
  return undefined;
}

/**
 * Resolve monthly or annual inputs into a normalized month list.
 * @param {Record<string, unknown>} raw
 * @returns {{ months: Array<{ qDemand: number, cop: number, eAux: number }>, mode: string, synthesized?: boolean }}
 */
export function resolveSpfInputs(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  if (Array.isArray(p.months) && p.months.length) {
    const months = p.months.map((m, i) => ({
      qDemand: Number(pick(m, 'qDemand', 'q_demand') ?? 0),
      cop: Number(pick(m, 'cop', 'spfCop') ?? 0),
      eAux: Number(pick(m, 'eAux', 'e_aux') ?? 0),
      index: i + 1,
    }));
    return { months, mode: 'monthly' };
  }

  const annualQ = pick(p, 'annualHeatDemand', 'qDemandTotal', 'q_total');
  const annualCop = pick(p, 'spfCop', 'cop', 'estimatedCop', 'hpCop');
  const eAuxAnnual = pick(p, 'eAuxAnnual', 'e_aux_annual', 'eAux');

  if (isFiniteNumber(annualQ) && isFiniteNumber(annualCop)) {
    return {
      months: [
        {
          qDemand: Number(annualQ),
          cop: Number(annualCop),
          eAux: isFiniteNumber(eAuxAnnual) ? Number(eAuxAnnual) : 0,
          index: 1,
        },
      ],
      mode: 'annual',
    };
  }

  const heatLoad = pick(p, 'heatLoadKw', 'peakHeatLoadKw');
  const hours = pick(p, 'annualOperatingHours', 'annualHours');
  const cop = pick(p, 'estimatedCop', 'hpCop', 'cop', 'spfCop');

  if (isFiniteNumber(heatLoad) && isFiniteNumber(hours) && isFiniteNumber(cop)) {
    const qDemand = Number(heatLoad) * Number(hours);
    const eAux = isFiniteNumber(eAuxAnnual) ? Number(eAuxAnnual) : 0;
    return {
      months: [{ qDemand, cop: Number(cop), eAux, index: 1 }],
      mode: 'ota_synthesized',
      synthesized: true,
    };
  }

  return { months: null, mode: 'unknown' };
}

/**
 * @param {Array<{ qDemand: number, cop: number, eAux: number, index?: number }>} months
 */
export function calculateSpfFromMonths(months) {
  const assumptions = [
    'VDI 4645 bin method: E_comp = Q / COP per period; SPF = Q_total / (E_comp + E_aux).',
    'Energy units are consistent (typically kWh per month or per year).',
  ];
  const warnings = [];
  const missingInputs = [];

  if (!months || !months.length) {
    missingInputs.push('months');
    return { ok: false, results: null, missingInputs, warnings, assumptions };
  }

  if (months.length !== 12 && months.length !== 1) {
    warnings.push(`Expected 12 monthly bins or 1 annual aggregate; got ${months.length} period(s).`);
  }

  let totalQ = 0;
  let totalECompressor = 0;
  let totalEAux = 0;
  const periodDetails = [];

  for (const m of months) {
    const q = Number(m.qDemand) || 0;
    const cop = Number(m.cop) || 0;
    const eAux = Number(m.eAux) || 0;
    let eCompressor = 0;

    if (q > 0 && cop <= 0) {
      return {
        ok: false,
        results: null,
        missingInputs: [`cop (period ${m.index ?? '?'})`],
        warnings: [`Period ${m.index ?? '?'}: heat demand > 0 but COP ≤ 0.`],
        assumptions,
        message: `Period ${m.index ?? '?'}: qDemand > 0 requires COP > 0`,
      };
    }

    if (cop > 0 && q > 0) {
      eCompressor = q / cop;
    }

    totalQ += q;
    totalECompressor += eCompressor;
    totalEAux += eAux;

    periodDetails.push({
      qDemand: q,
      cop,
      eAux,
      eCompressor,
    });
  }

  if (totalQ <= 0) {
    return {
      ok: false,
      results: null,
      missingInputs: ['qDemand'],
      warnings: ['Total heat demand must be > 0.'],
      assumptions,
      message: 'Total heat demand must be > 0',
    };
  }

  const totalEAnnual = totalECompressor + totalEAux;
  if (totalEAnnual <= 0) {
    return {
      ok: false,
      results: null,
      missingInputs: [],
      warnings: ['Total electricity (compressor + aux) must be > 0.'],
      assumptions,
      message: 'Total electricity must be > 0',
    };
  }

  const spf = totalQ / totalEAnnual;

  return {
    ok: true,
    results: {
      spf,
      totalQDemand: totalQ,
      totalECompressor,
      totalEAux,
      totalEAnnual,
      periodCount: months.length,
      periods: periodDetails,
    },
    missingInputs: [],
    warnings,
    assumptions,
  };
}

/**
 * @param {Record<string, unknown>} raw
 */
export function calculateSpf(raw) {
  const resolved = resolveSpfInputs(raw);
  const missingInputs = [];

  if (!resolved.months) {
    missingInputs.push('months');
    missingInputs.push('annualHeatDemand');
    missingInputs.push('heatLoadKw');
    return {
      ok: false,
      results: null,
      missingInputs,
      warnings: [
        'Provide months[12], or annualHeatDemand+cop, or heatLoadKw+annualOperatingHours+estimatedCop.',
      ],
      assumptions: [
        'VDI 4645 SPF calculator; missing inputs return missingInputs without inventing numbers.',
      ],
    };
  }

  const out = calculateSpfFromMonths(resolved.months);
  if (out.ok && resolved.synthesized) {
    out.warnings = [
      ...out.warnings,
      'Annual heat demand synthesized as heatLoadKw × annualOperatingHours.',
    ];
    out.assumptions = [
      ...out.assumptions,
      'Single-period OTA synthesis from heatLoadKw × annualOperatingHours.',
    ];
    out.results.mode = resolved.mode;
  } else if (out.ok) {
    out.results.mode = resolved.mode;
  }

  return out;
}
