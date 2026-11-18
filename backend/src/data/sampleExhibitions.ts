export const sampleExhibitions = [
  {
    id: 'los-grandes-mares', title: 'Los Grandes Mares', heading: 'Un viaje inagualable',
    description: `A fish swam past the pond with a bit of bread.
Another fish bonked his head.
When they saw the fisherman, they looked shocked and swam away.
This was another normal day.

Hastily I threw a bait.
The fishes then gobbled and ate.
I reeled it up, eating was my wish.
The fish was delish and it made quite a dish.`,
    theme: 'sea', imageUrl: '/images/FISH.png', imageAlt: 'Ilustración de un pez', caption: 'Fish', order: 0,
    startDate: new Date('2027-06-12T12:00:00-04:00'), endDate: new Date('2027-08-31T12:00:00-04:00'),
    visitHours: 'Martes a domingo, 10:00 a 19:00', visitNotes: 'El recorrido completo toma unos 40 minutos. Hay bancas a lo largo de la sala y se permite fotografiar sin flash.',
  },
  {
    id: 'arte-indigena', title: 'Arte indígena', heading: 'Arte, territorio y memoria',
    description: 'Un espacio dedicado al arte indígena y a las distintas formas de expresar la relación con el territorio, la memoria y la comunidad.',
    theme: 'green', imageUrl: '', imageAlt: '', caption: '', order: 1,
    startDate: new Date('2027-06-12T12:00:00-04:00'), endDate: new Date('2027-08-31T12:00:00-04:00'),
    visitHours: 'Martes a domingo, 10:00 a 19:00', visitNotes: 'Algunas piezas son ceremoniales: te pedimos no tocarlas ni fotografiarlas con flash. El recorrido toma unos 30 minutos.',
  },
  // "Otras exposiciones": no van grandes en el inicio (featured: false).
  {
    id: 'luz-de-acuarela', title: 'Luz de acuarela', heading: 'Agua y luz en capas transparentes',
    description: 'Paisajes costeros pintados en capas transparentes, donde el agua y la luz se mezclan.',
    theme: 'sea', imageUrl: '', imageAlt: '', caption: '', order: 10, featured: false,
    discipline: 'Pintura', room: 'Sala A', artistId: 'demo-elena-rios', startDate: new Date('2027-06-12T12:00:00-04:00'), endDate: new Date('2027-07-31T12:00:00-04:00'),
  },
  {
    id: 'formas-en-equilibrio', title: 'Formas en equilibrio', heading: 'Peso, vacío y movimiento',
    description: 'Esculturas de papel y arcilla que juegan con el peso, el vacío y el movimiento.',
    theme: 'green', imageUrl: '', imageAlt: '', caption: '', order: 11, featured: false,
    discipline: 'Escultura', room: 'Sala B', artistId: 'demo-tomas-vidal', startDate: new Date('2027-06-13T12:00:00-04:00'), endDate: new Date('2027-08-15T12:00:00-04:00'),
  },
  {
    id: 'mirar-el-puerto', title: 'Mirar el puerto', heading: 'Muelles, pescadores y reflejos',
    description: 'Una serie fotográfica sobre los muelles, los pescadores y los reflejos del atardecer.',
    theme: 'sea', imageUrl: '', imageAlt: '', caption: '', order: 12, featured: false,
    discipline: 'Fotografía', room: 'Sala C', artistId: 'demo-ines-soto', startDate: new Date('2027-06-19T12:00:00-04:00'), endDate: new Date('2027-08-31T12:00:00-04:00'),
  },
  {
    id: 'cuadernos-de-viaje', title: 'Cuadernos de viaje', heading: 'La costa, página a página',
    description: 'Dibujos y apuntes de color hechos en recorridos por la costa, expuestos página a página.',
    theme: 'green', imageUrl: '', imageAlt: '', caption: '', order: 13, featured: false,
    discipline: 'Pintura e ilustración', room: 'Sala D', artistId: 'demo-lucia-mora', startDate: new Date('2027-06-20T12:00:00-04:00'), endDate: new Date('2027-09-30T12:00:00-04:00'),
  },
];
