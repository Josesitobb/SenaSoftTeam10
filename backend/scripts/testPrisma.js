import prisma from '../models/prismaClient.js';

async function main() {
  // Listar eps
  const allEps = await prisma.eps.findMany();
  console.log('EPS existentes:', allEps);

  if (allEps.length === 0) {
    // Crear un EPS de ejemplo
    const nueva = await prisma.eps.create({
      data: {
        nombre_eps: 'EPS Ejemplo',
        nit: '900000000',
        regimen: 'Contributivo',
        telefono: '3000000000'
      }
    });
    console.log('EPS creado:', nueva);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
