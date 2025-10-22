import prisma from "../models/prismaClient.js";

export const getEquivalencias = async (req, res) => {
  try {
    const equivalencias = await prisma.equivalencias.findMany();
    if (equivalencias.length === 0) {
      return res.status(404).json({ error: 'No se encontraron equivalencias' });
    }
    return res.status(200).json(equivalencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching equivalencias' });
  }
};
