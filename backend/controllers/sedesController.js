import prisma from "../models/prismaClient.js";

export const getSede = async (req, res) => {
    try {
        const sede = await prisma.sedes.findMany();
        if (sede.length === 0) {
            return res.status(404).json({ error: 'No se encontraron sedes' });
        }
        return res.status(200).json(sede);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching sedes' });
    }
}