const path = require('path');
const styleSpec = require(path.resolve(__dirname, '../..', 'frontend', 'node_modules', '@maplibre', 'maplibre-gl-style-spec'));

console.log('Validating expressions...');

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

const parsed = styleSpec.expression.createExpression(expr, { type: 'color' });
console.log('Fill Color expression result:', parsed.result);
if (parsed.result === 'error') {
  console.error('Errors:', JSON.stringify(parsed.value));
} else {
  console.log('Expression valid!');
  const testVal = parsed.value.evaluate({
    properties: () => ({ climate_debt_score: 84.2 })
  });
  console.log('Evaluated for 84.2:', testVal);
}

// Now test fill-opacity expression
const opacityExpr = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  0.75,
  ['boolean', ['feature-state', 'hover'], false],
  0.65,
  0.48,
];
const parsedOpacity = styleSpec.expression.createExpression(opacityExpr, { type: 'number' });
console.log('Opacity expression result:', parsedOpacity.result);
if (parsedOpacity.result === 'error') {
  console.error('Opacity Errors:', JSON.stringify(parsedOpacity.value));
}

// Now test line-color expression
const lineColorExpr = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  '#FFFFFF',
  ['boolean', ['feature-state', 'hover'], false],
  '#FFFFFF',
  '#062A13',
];
const parsedLineColor = styleSpec.expression.createExpression(lineColorExpr, { type: 'color' });
console.log('Line Color expression result:', parsedLineColor.result);
if (parsedLineColor.result === 'error') {
  console.error('Line Color Errors:', JSON.stringify(parsedLineColor.value));
}

// Now validate complete layer definition against validateStyle or validateLayer
const fillLayer = {
  id: 'ward-fills',
  type: 'fill',
  source: 'pune-wards-source',
  paint: {
    'fill-color': expr,
    'fill-opacity': opacityExpr,
  },
};
const layerErrors = styleSpec.validate(fillLayer, styleSpec.latest);
console.log('Fill layer validate errors:', layerErrors);
