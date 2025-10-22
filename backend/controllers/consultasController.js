import prisma from "../models/prismaClient.js";

export const getConsultas = async (req, res) => {
  try {
    const consultas = await prisma.consultas.findMany();
    if (!consultas || consultas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron consultas' });
    }
    return res.status(200).json(consultas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching consultas' });
  }
};
