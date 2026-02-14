const res = await fetch('http://localhost:3000/api/news?lang=PT&sortOrder=latest');
console.log('Status:', res.status);
const json = await res.json();
console.log('Type:', json.Type);
console.log('Count:', json.Data?.length || 0);
if (json.Data?.[0]) {
  console.log('Latest:', new Date(json.Data[0].published_on * 1000).toISOString());
  console.log('Title:', json.Data[0].title?.substring(0, 80));
} else {
  console.log('Response:', JSON.stringify(json).substring(0, 500));
}
