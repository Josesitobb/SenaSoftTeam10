import prisma from "../models/prismaClient.js";

export const getEps = async (req, res) => {
  try {
    const eps = await prisma.eps.findMany();
    if (eps.length === 0) {
      return res.status(404).json({ error: 'No se encontraron EPS' });
    }
    return res.status(200).json(eps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching eps' });
  }
};

