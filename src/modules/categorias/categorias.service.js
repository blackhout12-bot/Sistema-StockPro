const { connectDB } = require('../../config/db');
const categoriasRepository = require('../../repositories/categorias.repository');

class CategoriasService {
    async getCategorias(empresa_id, filtros) {
        const pool = await connectDB();
        return await categoriasRepository.getCategorias(pool, empresa_id, filtros);
    }

    async getCategoriaById(id, empresa_id) {
        const pool = await connectDB();
        const cat = await categoriasRepository.getCategoriaById(pool, id, empresa_id);
        if (!cat) throw new Error('Categoría no encontrada');
        return cat;
    }

    async createCategoria(data, empresa_id) {
        const pool = await connectDB();
        
        // Validar unique name en la misma empresa
        const isDuplicate = await categoriasRepository.checkUniqueName(pool, data.nombre, empresa_id);
        if (isDuplicate) throw new Error('Ya existe una categoría con ese nombre en tu empresa.');

        const newId = await categoriasRepository.createCategoria(pool, data, empresa_id);
        return await this.getCategoriaById(newId, empresa_id);
    }

    async updateCategoria(id, data, empresa_id) {
        const pool = await connectDB();
        
        const existing = await categoriasRepository.getCategoriaById(pool, id, empresa_id);
        if (!existing) throw new Error('Categoría no encontrada');

        // Validar unique name excluyendo la actual
        const isDuplicate = await categoriasRepository.checkUniqueName(pool, data.nombre, empresa_id, id);
        if (isDuplicate) throw new Error('Ya existe otra categoría con ese nombre.');

        await categoriasRepository.updateCategoria(pool, id, data, empresa_id);
        return await this.getCategoriaById(id, empresa_id);
    }

    async deleteCategoria(id, empresa_id) {
        const pool = await connectDB();
        
        const existing = await categoriasRepository.getCategoriaById(pool, id, empresa_id);
        if (!existing) throw new Error('Categoría no encontrada');

        await categoriasRepository.deleteCategoria(pool, id, empresa_id);
        return { message: 'Categoría eliminada exitosamente' };
    }
}

module.exports = new CategoriasService();
