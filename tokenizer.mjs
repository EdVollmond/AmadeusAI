

import crypto from 'crypto';

function randomToken() {
	let abc = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvXxYyZz";
    let rs = "";
    while (rs.length < 8) {
        rs += abc[Math.floor(Math.random() * abc.length)];
    }
	console.log(rs);
	return rs;
}


function generateToken(data, key) {
	// Создаем инстанс HMAC с алгоритмом (например, "sha256") и ключом
	const hmac = crypto.createHmac('sha256', key);
  
	// Обновляем HMAC данными для хеширования
	hmac.update(data);
  
	// Получаем и возвращаем хеш в шестнадцатеричном формате
	return btoa(hmac.digest('hex'));
}

//console.log(randomToken());

console.log(generateToken("Lara_Titova", randomToken()));
