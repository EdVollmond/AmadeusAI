
import crypto from 'crypto';

function generateToken(data, key) {
	// Создаем инстанс HMAC с алгоритмом (например, "sha256") и ключом
	const hmac = crypto.createHmac('sha256', key);
  
	// Обновляем HMAC данными для хеширования
	hmac.update(data);
  
	// Получаем и возвращаем хеш в шестнадцатеричном формате
	return btoa(hmac.digest('hex'));
}
