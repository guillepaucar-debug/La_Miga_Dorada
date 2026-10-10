const { db } = require('./connection');

// Catálogo inicial. Se crea en Firestore solo la primera vez (los productos que ya existen no se tocan).
const PRODUCTS = [
    [1, 'Torta de Chocolate Artesanal', 'Tortas', 'TORTAS', 12.50, 'Exquisito bizcocho de cacao fino de aroma, bañado en ganache artesanal de chocolate amargo al 70% y virutas crujientes.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800'],
    [2, 'Red Velvet Elegante', 'Tortas', 'TORTAS', 14.00, 'Suave terciopelo rojo horneado a baja temperatura con suave crema de queso mascarpone y toques de vainilla natural.', 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=800'],
    [3, 'Torta de Fresas y Crema', 'Tortas', 'TORTAS', 13.50, 'Bizcochuelo esponjoso intercalado con crema batida fresca y fresas silvestres orgánicas recién seleccionadas.', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800'],
    [4, 'Pan de Masa Madre', 'Panes de Molde', 'PANES DE MOLDE', 8.50, 'Hogaza rústica elaborada con fermentación lenta de 36 horas. Alveolado perfecto y corteza crujiente carameliz...', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=800'],
    [5, 'Pan Integral con Semillas', 'Panes de Molde', 'PANES DE MOLDE', 7.00, 'Harinas integrales de grano entero cubiertas de semillas de girasol, calabaza, lino y sésamo tostado.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'],
    [6, 'Pan Brioche', 'Panes de Molde', 'PANES DE MOLDE', 9.00, 'Miga ultra suave enriquecida con mantequilla de Bretaña y huevos de pastoreo. Perfecto para tostadas f...', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=800'],
    [7, 'Croissant Francés Clásico', 'Panecillos', 'PANECILLOS', 4.50, 'Masa hojaldrada tradicional en capas perfectas horneada con mantequilla artesanal para una textura dorada.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'],
    [8, 'Pain au Chocolat', 'Panecillos', 'PANECILLOS', 5.00, 'Masa hojaldrada mantequillosa rellena con dos barras de fino chocolate negro francés al 60%.', 'https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&q=80&w=800'],
    [9, 'Rollo de Canela y Nuez', 'Panecillos', 'PANECILLOS', 4.50, 'Esponjoso rollo especiado con canela de Ceilán, trozos de nueces tostadas y glaseado artesanal.', 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&q=80&w=800'],
    [10, 'Torta Tres Leches Clásica', 'Tortas', 'TORTAS', 13.00, 'Bizcocho esponjoso bañado en tres leches y cubierto con merengue suave y un toque de canela en polvo.', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=800'],
    [11, 'Torta de Zanahoria y Nuez', 'Tortas', 'TORTAS', 12.00, 'Capas húmedas de zanahoria fresca y nueces tostadas, con frosting cremoso de queso y especias suaves.', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&q=80&w=800'],
    [12, 'Torta de Vainilla y Frambuesa', 'Tortas', 'TORTAS', 14.50, 'Bizcocho de vainilla de Madagascar relleno de compota de frambuesa y crema ligera de mantequilla.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&q=80&w=800'],
    [13, 'Torta Selva Negra', 'Tortas', 'TORTAS', 15.00, 'Chocolate intenso, cerezas al licor, crema chantilly y virutas de cacao en una receta de tradición alemana.', 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=800'],
    [14, 'Cheesecake de Frutos Rojos', 'Tortas', 'TORTAS', 14.00, 'Base crocante de galleta, crema de queso sedosa horneada lento y cobertura de frutos rojos de temporada.', 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800'],
    [15, 'Torta de Limón y Amapola', 'Tortas', 'TORTAS', 12.50, 'Miga tierna con ralladura de limón y semillas de amapola, glaseada con un fino almíbar cítrico.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800'],
    [16, 'Panecillo de Mantequilla', 'Panecillos', 'PANECILLOS', 3.50, 'Pancito suave de miga dorada, enriquecido con mantequilla fresca. Ideal para el desayuno o la merienda.', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800'],
    [17, 'Panecillo de Queso Gratinado', 'Panecillos', 'PANECILLOS', 4.00, 'Masa esponjosa rellena y cubierta con queso fundido y gratinado hasta lograr una costra dorada.', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=800'],
    [18, 'Brioche Individual', 'Panecillos', 'PANECILLOS', 4.20, 'Bollito brioche de miga aireada y brillo dorado, con aroma a mantequilla y un toque de vainilla.', 'img/brioche-individual.jpg'],
    [19, 'Panecillo de Semillas', 'Panecillos', 'PANECILLOS', 3.80, 'Corteza crujiente cubierta de sésamo, girasol y amapola sobre una miga ligera y llena de sabor.', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=800'],
    [20, 'Rol de Mantequilla y Hierbas', 'Panecillos', 'PANECILLOS', 4.00, 'Panecillo horneado con mantequilla de ajo suave y hierbas finas, perfecto para acompañar tus comidas.', 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&q=80&w=800'],
    [21, 'Panecillo Rústico de Masa Madre', 'Panecillos', 'PANECILLOS', 4.50, 'Fermentación lenta de 24 horas que le da una corteza fina y una miga alveolada de sabor profundo.', 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&q=80&w=800'],
    [22, 'Pan de Molde Blanco Artesanal', 'Panes de Molde', 'PANES DE MOLDE', 6.50, 'Rebanadas suaves y uniformes de miga tierna, horneadas cada mañana sin conservantes ni aditivos.', 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&q=80&w=800'],
    [23, 'Pan de Molde Integral', 'Panes de Molde', 'PANES DE MOLDE', 7.00, 'Harina integral molida en piedra para un pan nutritivo, de miga densa y un sabor ligeramente dulce.', 'img/pan-integral.jpg'],
    [24, 'Pan de Molde Multicereales', 'Panes de Molde', 'PANES DE MOLDE', 7.50, 'Mezcla de avena, linaza, centeno y girasol que aporta fibra y una textura rica en cada rebanada.', 'https://images.unsplash.com/photo-1568471173242-461f0a730452?auto=format&fit=crop&q=80&w=800'],
    [25, 'Pan de Leche', 'Panes de Molde', 'PANES DE MOLDE', 6.80, 'Miga esponjosa y ligeramente dulce, elaborada con leche fresca. El favorito de los más pequeños.', 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?auto=format&fit=crop&q=80&w=800'],
    [26, 'Pan de Centeno', 'Panes de Molde', 'PANES DE MOLDE', 8.00, 'Pan oscuro de sabor profundo y miga compacta, con un toque de comino. Excelente con quesos y embutidos.', 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=800'],
    [27, 'Pan de Avena y Miel', 'Panes de Molde', 'PANES DE MOLDE', 7.80, 'Copos de avena y miel natural en una miga húmeda y aromática, perfecta para tostadas y desayunos.', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800'],
    [28, 'Galletas de Chispas de Chocolate', 'Galletas', 'GALLETAS', 5.50, 'Crujientes por fuera y suaves por dentro, con generosas chispas de chocolate semiamargo.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800'],
    [29, 'Galletas de Avena y Pasas', 'Galletas', 'GALLETAS', 5.00, 'Receta casera con avena integral, pasas jugosas y canela. Un snack nutritivo y lleno de sabor.', 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=800'],
    [30, 'Galletas de Mantequilla', 'Galletas', 'GALLETAS', 5.20, 'Galletas clásicas que se deshacen en la boca, hechas con mantequilla fresca y azúcar glas.', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800'],
    [31, 'Galletas de Almendra', 'Galletas', 'GALLETAS', 6.00, 'Delicadas galletas con harina de almendra y un centro tierno, ideales para acompañar el té o el café.', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=800'],
    [32, 'Galletas de Jengibre', 'Galletas', 'GALLETAS', 5.30, 'Especiadas con jengibre, canela y clavo, con un toque de melaza que las hace cálidas y aromáticas.', 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?auto=format&fit=crop&q=80&w=800'],
    [33, 'Galletas Doble Chocolate', 'Galletas', 'GALLETAS', 5.80, 'Cacao puro y trozos de chocolate negro en una galleta intensa, húmeda y perfecta para los amantes del chocolate.', 'https://images.unsplash.com/photo-1621236378699-8597faf6a176?auto=format&fit=crop&q=80&w=800'],
    [34, 'Tartaleta de Frutas', 'Postres', 'POSTRES', 6.50, 'Base de masa quebrada con crema pastelera de vainilla y frutas frescas de temporada con brillo de glaseado.', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80&w=800'],
    [35, 'Macarons Surtidos', 'Postres', 'POSTRES', 9.00, 'Caja de macarons franceses de textura fina y rellenos cremosos en sabores de fruta, café y chocolate.', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=800'],
    [36, 'Cupcake de Vainilla', 'Postres', 'POSTRES', 4.50, 'Bizcocho esponjoso de vainilla coronado con frosting suave de mantequilla y decoración artesanal.', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=800'],
    [37, 'Donas Glaseadas', 'Postres', 'POSTRES', 4.00, 'Masa suave y aireada, frita al momento y bañada en glaseado brillante. Dulces y recién hechas.', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800'],
    [38, 'Tarta de Manzana', 'Postres', 'POSTRES', 7.50, 'Manzanas caramelizadas con canela sobre una masa de mantequilla crujiente, servida con un toque de azúcar.', 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&q=80&w=800'],
    [39, 'Copa de Mousse de Chocolate', 'Postres', 'POSTRES', 6.00, 'Mousse aireada de chocolate negro al 70%, servida en copa y decorada con crema y virutas de cacao.', 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800']
];

async function initDb() {
    const col = db.collection('products');
    const refs = PRODUCTS.map(p => col.doc(String(p[0])));
    const snaps = await db.getAll(...refs);

    const batch = db.batch();
    let created = 0;
    PRODUCTS.forEach(([id, title, category, tag, price, description, image], i) => {
        if (snaps[i].exists) return;
        batch.set(refs[i], { id, title, category, tag, price, description, image, active: true });
        created++;
    });
    if (created) await batch.commit();
    if (created) console.log(`Firestore: ${created} productos cargados.`);
}

module.exports = { initDb, PRODUCTS };
