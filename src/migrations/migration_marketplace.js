module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmpresaModulos' and xtype='U')
        BEGIN
            CREATE TABLE EmpresaModulos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                empresa_id INT NOT NULL,
                modulo_id VARCHAR(50) NOT NULL,
                usuario_id_instalador INT NOT NULL,
                fecha_instalacion DATETIME DEFAULT GETDATE(),
                estado VARCHAR(20) DEFAULT 'ACTIVO',
                CONSTRAINT UQ_Empresa_Modulo UNIQUE (empresa_id, modulo_id)
            );
        END
    );
  },
  down: async (queryInterface, Sequelize) => {
    // Reversible action
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS EmpresaModulos');
  }
};
