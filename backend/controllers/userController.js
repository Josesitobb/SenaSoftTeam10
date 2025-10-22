import prisma from "../models/prismaClient.js";

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany();
    console.log(usuarios);
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching usuarios' });
  }
};

export const getById = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Buscando usuario con ID:', id);
        const usuario = await prisma.usuarios.findUnique({
            where: { documento: Number(id) }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Error detallado:', error);
        if (error.code === 'P2020') {
            return res.status(500).json({ 
                error: 'Error en base de datos: fechas inválidas detectadas. Ejecuta el script fix_dates.sql',
                details: 'La tabla usuarios contiene fechas con formato 0000-00-00 que no son compatibles con Prisma'
            });
        }
        res.status(500).json({ error: 'Error fetching usuario' });
    }
};
