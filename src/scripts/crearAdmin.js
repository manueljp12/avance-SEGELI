const bcrypt = require('bcryptjs');

const password = '190920'; // la contraseña que tú quieras
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('HASH:', hash);