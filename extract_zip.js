const AdmZip = require('adm-zip');
const zip = new AdmZip('attached_assets/ZashaEmailAutomation_1761737298505.zip');
zip.extractAllTo('./', true);
console.log('Extracted successfully');
