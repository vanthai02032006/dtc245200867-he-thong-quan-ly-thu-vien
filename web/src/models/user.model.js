const { pool, dbState, memoryStore } = require('../config/db');

class UserModel {
  static async findByCredentials(username, password) {
    if (dbState.storageMode === 'memory') {
      return memoryStore.users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );
    }
    const result = await pool.query(
      'SELECT id, username, full_name, role FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
      [username.trim(), password]
    );
    return result.rows[0];
  }

  static async create({ username, password, full_name, role = 'THỦ THƯ / ĐỘC GIẢ' }) {
    if (dbState.storageMode === 'memory') {
      const exists = memoryStore.users.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        const err = new Error('Tên đăng nhập đã tồn tại');
        err.code = '23505';
        throw err;
      }
      const newUser = {
        id: memoryStore.nextUserId++,
        username: username.trim(),
        password,
        full_name: full_name.trim(),
        role,
      };
      memoryStore.users.push(newUser);
      return newUser;
    }

    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, role`,
      [username.trim(), password, full_name.trim(), role]
    );
    return result.rows[0];
  }
}

module.exports = UserModel;
