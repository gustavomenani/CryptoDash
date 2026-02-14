const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest');
console.log('Status:', res.status);
const json = await res.json();
console.log('Type:', json.Type);
console.log('Message:', json.Message);
console.log('Count:', json.Data?.length || 0);
if (json.Data?.[0]) {
  console.log('Latest:', new Date(json.Data[0].published_on * 1000).toISOString());
  console.log('Oldest:', new Date(json.Data[json.Data.length - 1].published_on * 1000).toISOString());
  console.log('Title:', json.Data[0].title?.substring(0, 80));
} else {
  console.log('Response keys:', Object.keys(json));
  console.log('Preview:', JSON.stringify(json).substring(0, 500));
}
