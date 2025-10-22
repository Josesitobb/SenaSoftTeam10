import prisma from "../models/prismaClient.js";

export const getMedicamentos = async (req, res) => {
    try {
        const medicamentos = await prisma.medicamentos.findMany();
        if (medicamentos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron medicamentos' });
        }
        return res.status(200).json(medicamentos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching medicamentos' });
    }
}