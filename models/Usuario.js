//=========================================
// 4. MODELS/USER.JS
// ========================================

const pool = require('../config/database');

class Usuario {

  static async findByCredentials(usuario, contraseña) {
    try {
      const query = `
        SELECT 
          u.id_usuario,
          u.nombres,
          u.apellidos,
          u.correo,
          u.usuario,
          u.foto,
          r.rol,
          e.nombres as empleado_nombres,
          e.apellido1,
          e.apellido2
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        WHERE u.usuario = $1 AND u.contraseña = $2 AND u.esta_borrado = false
      `;
      
      const result = await pool.query(query, [usuario, contraseña]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          id: user.id_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo,
          usuario: user.usuario,
          foto: user.foto,
          rol: user.rol,
          empleado: user.empleado_nombres ? 
            `${user.empleado_nombres} ${user.apellido1} ${user.apellido2}` : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar usuario:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT 
          u.id_usuario,
          u.nombres,
          u.apellidos,
          u.correo,
          u.usuario,
          u.foto,
          r.rol,
          e.nombres as empleado_nombres,
          e.apellido1,
          e.apellido2
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        LEFT JOIN empleados e ON u.id_empleado = e.id_empleado
        WHERE u.id_usuario = $1 AND u.esta_borrado = false
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
          id: user.id_usuario,
          nombres: user.nombres,
          apellidos: user.apellidos,
          correo: user.correo,
          usuario: user.usuario,
          foto: user.foto,
          rol: user.rol,
          empleado: user.empleado_nombres ? 
            `${user.empleado_nombres} ${user.apellido1} ${user.apellido2}` : null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error);
      throw error;
    }
  }
}

module.exports = Usuario;