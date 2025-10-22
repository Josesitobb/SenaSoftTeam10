import prisma from "../models/prismaClient.js";

export const getRoles = async (req, res) => {
  try {
    const roles = await prisma.roles.findMany();
    if (roles.length === 0) {
      return res.status(404).json({ error: 'No se encontraron roles' });
    }
    return res.status(200).json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching roles' });
  }
};
