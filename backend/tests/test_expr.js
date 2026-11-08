const styleSpec = require('./frontend/node_modules/@maplibre/maplibre-gl-style-spec');

const expr = [
  'case',
  ['>=', ['to-number', ['get', 'climate_debt_score'], 0], 75.0],
  '#DC3545',
  ['>=', ['to-number', ['get', 'climate_debt_score'], 0], 60.0],
  '#F59E0B',
  ['>=', ['to-number', ['get', 'climate_debt_score'], 0], 40.0],
  '#0EA5E9',
  '#16A34A',
];

try {
  const parsed = styleSpec.expression.createExpression(expr, { type: 'color' });
  console.log('Result:', parsed.result);
  if (parsed.result === 'error') {
    console.error('Errors:', parsed.value);
  } else {
    console.log('Expression parsed successfully!');
    // Test evaluation
    const val = parsed.value.evaluate({
      properties: () => ({ climate_debt_score: 84.2 })
    });
    console.log('Evaluated for 84.2:', val);
  }
} catch (e) {
  console.error('Exception parsing expression:', e);
}
