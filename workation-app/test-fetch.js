const http = require('http');

http.get('http://localhost:3000/accommodations', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data.substring(0, 1000));
    console.log('Includes 숙소:', data.includes('숙소'));
    console.log('Includes 강릉 홍보 체험형:', data.includes('강릉 홍보 체험형'));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
