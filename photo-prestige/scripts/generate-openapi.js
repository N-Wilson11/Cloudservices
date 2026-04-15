var fs = require('fs');
var path = require('path');

var sourcePath = path.join(__dirname, '..', 'openapi', 'source.json');
var outputPath = path.join(__dirname, '..', 'public', 'openapi.json');

function loadSourceSpec() {
  var raw = fs.readFileSync(sourcePath, 'utf8');
  return JSON.parse(raw);
}

function writeGeneratedSpec(spec) {
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
}

function main() {
  var spec = loadSourceSpec();
  writeGeneratedSpec(spec);
  console.log('Generated public/openapi.json from openapi/source.json');
}

main();
