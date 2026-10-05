"""Catalogo inicial de NUDE: de Productos_20261005_1445.xlsx (78 filas, una por
color) y de las fotos de la sesion (catalogonude-20261005T194331Z-1-001.zip) a
productos agrupados con variantes de color.

    python3 scripts/importar-catalogo.py <carpeta-con-las-fotos-en-jpg>

Genera:
  - src/content/productos.json   (semilla de Postgres: npm run db:seed)
  - scripts/catalogo-fotos.json  (manifiesto de scripts/gen-catalogo.mjs)

Es una importacion de una sola vez: despues de cargar la semilla, el catalogo
se mantiene desde /admin. Queda en el repo para saber de donde salio cada
producto (el codigo del POS es la primera parte de cada SKU) y cada foto.

Reglas de la agrupacion:
  - Filas que solo cambian de color se vuelven un producto con varios colores.
    Si el precio cambia por color, el producto toma el menor y el color guarda
    el suyo (variantes.precio).
  - El prefijo del nombre (REVEL, FIT LAB, AMORFIT, NOONS, SE SPORT, BELATTI,
    Centro) es el proveedor: va a productos.marca, que nunca se muestra.
  - Tallas S, M y L para ropa y U (unica) para accesorios y bienestar: el
    listado no trae tallas (SPEC §13, decision abierta 1). Se ajustan en /admin.
  - Sin foto = borrador: el producto existe en el panel pero no en la tienda.
  - El stock del listado se ignora: no se maneja inventario.
"""
import sys
import json, os, re, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTOS = sys.argv[1] if len(sys.argv) > 1 else None

HEX = {
    'Negro': '#1F1C1B', 'Café': '#6B4A35', 'Gris': '#8E8B88', 'Rojo': '#A8262C', 'Azul': '#2E4E8F',
    'Verde militar': '#5B5E3E', 'Blanco': '#F1EDE6', 'Rosado': '#E3AEB4', 'Azul eléctrico': '#2F55C8',
    'Marfil': '#EEE5D3', 'Amarillo': '#E9D27A', 'Azul claro': '#A9C6E3', 'Moka': '#A88B73',
    'Castaño y papiro': '#7A5238', 'Petróleo y blanco': '#2F5A62', 'Gris elefante': '#9C948A',
    'Vino tinto': '#6E1F2E', 'Vinotinto': '#6E1F2E', 'Chocolate': '#5A3A2B', 'Verde esmeralda': '#1F6E5C',
    'Lila': '#C7B5D9', 'Taupe': '#9E8C7C', 'Azul cielo': '#A8CBE6', 'Azul petróleo': '#2F5A70',
    'Beige': '#D9C3A0', 'Natural': '#E8A33D', 'Por definir': '#C4956A', 'Blanco marfil': '#EEE5D3',
    'Nude': '#D9B49A',
}

ROPA = ['S', 'M', 'L']
UNICA = ['U']


def slug(t):
    t = unicodedata.normalize('NFD', t)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def c(nombre, codigo, fotos=(), precio=None, hex=None):
    return {'nombre': nombre, 'codigo': codigo, 'fotos': list(fotos), 'precio': precio, 'hex': hex or HEX[nombre]}


M = 'mute'  # cuadro de video con icono de sonido abajo a la derecha

P = []


def p(slug_, nombre, categoria, marca, precio, descripcion, detalles, colores, tallas=ROPA,
      destacado=False, combina=(), alt=None):
    P.append(dict(slug=slug_, nombre=nombre, categoria=categoria, marca=marca, precio=precio,
                  descripcion=descripcion, detalles=detalles, colores=colores, tallas=tallas,
                  destacado=destacado, combina=list(combina), alt=alt))


# ---------------------------------------------------------------- Enterizos
p('enterizo-corto-tela-fria-manga-larga', 'Enterizo corto Tela Fría manga larga', 'enterizos', 'REVEL', 140000,
  'Manga larga, cierre al frente y una espalda abierta que solo se ve cuando giras. '
  'La tela fría se siente fresca al ponértela y el siso trasero levanta sin apretar.',
  ['Tela fría', 'Cierre frontal', 'Espalda abierta', 'Siso trasero con efecto push-up', 'Largo a medio muslo'],
  [c('Negro', '54', [('IMG_7727.jpg', M), ('IMG_7726.jpg', M), '92D978E0-6B29-4D3E-85B8-E62504023A4B.jpg', 'IMG_7590.jpg']),
   c('Café', 'PRD-1789502361', [('IMG_7730.jpg', M), ('IMG_7731.jpg', M), 'B83434DC-97EF-4C01-95AB-CC223C70534B.jpg', 'IMG_7588.jpg']),
   c('Gris', 'PRD-1789502385', [('IMG_7728.jpg', M), ('IMG_7729.jpg', M), '0BFE6361-9BA2-49E7-BCAF-81ECFD34B4C1.jpg', 'IMG_7589.jpg']),
   c('Rojo', '55', [('IMG_7734.jpg', M), ('IMG_7735.jpg', M), '15940242-E6C2-4D12-BDBD-7758219B4401.jpg', 'IMG_7592.jpg']),
   c('Azul', '56', [('IMG_7724.jpg', M), ('IMG_7725.jpg', M), 'A9C97056-A2D2-459D-AB46-B1B334C6BD91.jpg', 'IMG_7591.jpg']),
   c('Verde militar', 'PRD-1789501869', [('IMG_7732.jpg', M), ('IMG_7733.jpg', M), '867DDE70-14C9-491D-B4B4-EA6C8491497D.jpg'])],
  destacado=True, combina=['calentadoras-classic', 'calentadoras-small'],
  alt='Enterizo corto de manga larga en tela fría con cierre frontal, sobre fondo de arcos blancos')

p('enterizo-largo-tela-fria-manga-larga', 'Enterizo largo Tela Fría manga larga', 'enterizos', 'REVEL', 160000,
  'Largo hasta el tobillo, manga larga y cierre al frente. Se ajusta como una segunda piel, '
  'deja la espalda al aire y el siso marca la silueta.',
  ['Tela fría', 'Cierre frontal', 'Espalda abierta', 'Siso trasero con efecto push-up', 'Largo completo'],
  [c('Negro', '57', ['IMG_7747.jpg', 'IMG_7583.jpg']),
   c('Café', '58', ['IMG_7750.jpg', 'IMG_7582.jpg']),
   c('Gris', 'PRD-1789502952', ['IMG_7749.jpg', 'IMG_7584.jpg'])],
  destacado=True, combina=['calentadoras-classic'],
  alt='Enterizo largo de manga larga en tela fría con cierre frontal')

p('enterizo-largo-tela-fria-siso', 'Enterizo largo Tela Fría siso', 'enterizos', 'REVEL', 150000,
  'Sin mangas, con cierre al frente y la espalda descubierta. La tela fría no se pega con el calor '
  'y el siso trasero hace el trabajo que nadie ve.',
  ['Tela fría', 'Sin mangas', 'Cierre frontal', 'Espalda abierta', 'Siso trasero con efecto push-up'],
  [c('Negro', '60', ['IMG_7579.jpg', '45589940-1fe4-4cdd-bd9b-64979a068bf8.jpg']),
   c('Gris', '61', ['IMG_7577.jpg']),
   c('Café', '59', ['IMG_7578.jpg']),
   c('Rosado', 'PRD-1789502289', ['91c1dc65-f938-4c99-a75f-1bd8d44558da.jpg']),
   c('Blanco', 'PRD-1789502309', ['8815ae23-ae31-4e69-9747-5794d1a7fae0.jpg'])],
  combina=['calentadoras-classic'],
  alt='Enterizo largo sin mangas en tela fría, vista de frente y de espalda')

p('enterizo-corto-tela-fria-siso', 'Enterizo corto Tela Fría siso', 'enterizos', 'REVEL', 135000,
  'Corto, con cierre al frente y siso trasero. Fresco para los días de calor y firme en cada sentadilla.',
  ['Tela fría', 'Cierre frontal', 'Siso trasero con efecto push-up', 'Largo a medio muslo'],
  [c('Blanco', '53', ['IMG_7751.jpg', 'IMG_7752.jpg', 'IMG_7753.jpg'], precio=140000),
   c('Azul eléctrico', '52', ['IMG_7754.jpg', 'IMG_7755.jpg', 'IMG_7585.jpg']),
   c('Gris', '51', ['IMG_7586.jpg'])],
  combina=['calentadoras-small'],
  alt='Enterizo corto en tela fría con cierre frontal y siso trasero')

p('enterizo-largo-tela-fria-cuello-redondo', 'Enterizo largo Tela Fría cuello redondo', 'enterizos', 'REVEL', 150000,
  'Cuello redondo y manga corta por delante; espalda abierta por detrás. Largo completo para '
  'entrenar o salir sin cambiarte.',
  ['Tela fría', 'Cuello redondo', 'Manga corta', 'Espalda abierta', 'Siso trasero con efecto push-up'],
  [c('Negro', 'PRD-1789502658', ['IMG_7580.jpg']),
   c('Rojo', 'PRD-1789501983', ['IMG_7614.jpg'])],
  alt='Enterizo largo de cuello redondo con espalda abierta, tres vistas')

p('enterizo-halter-sin-costuras', 'Enterizo halter sin costuras', 'enterizos', 'FIT LAB', 160000,
  'Tejido sin costuras que se amolda al cuerpo, cuello halter y la espalda completamente abierta. '
  'Las líneas en contraste dibujan la pierna de arriba abajo.',
  ['Tejido sin costuras (flatseamer)', 'Cuello halter', 'Espalda abierta', 'Siso trasero', 'Largo completo'],
  [c('Azul eléctrico', '31', ['IMG_7758.jpg', 'IMG_7760.jpg', 'IMG_7759.jpg']),
   c('Café', '50'),
   c('Vinotinto', '49')],
  destacado=True, combina=['calentadoras-classic'],
  alt='Enterizo largo halter sin costuras con espalda abierta, al aire libre')

p('enterizo-corto-manga-corta', 'Enterizo corto manga corta', 'enterizos', 'SE SPORT', 120000,
  'Manga corta y cuello redondo por delante, espalda abierta por detrás. Un básico que se ve '
  'pensado y se siente cómodo todo el día.',
  ['Manga corta', 'Cuello redondo', 'Espalda abierta', 'Siso trasero'],
  [c('Negro', '22', ['enterizo-black-1.jpg', 'enterizo-black-2.jpg'])],
  destacado=True, combina=['calentadoras-small'],
  alt='Enterizo corto negro de manga corta con espalda abierta')

p('enterizo-corto-luxury', 'Enterizo corto Luxury', 'enterizos', 'FIT LAB', 125000,
  'Sin mangas, con cierre al frente en contraste. Se sube y se baja en segundos y queda '
  'impecable con calentadoras.',
  ['Sin mangas', 'Cierre frontal en contraste', 'Largo a medio muslo'],
  [c('Gris', '5', ['enterizo-luxury-1.jpg', 'enterizo-luxury-2.jpg', 'enterizo-luxury-3.jpg'])],
  combina=['calentadoras-classic'],
  alt='Enterizo corto gris sin mangas con cierre frontal')

p('enterizo-corto-tiras', 'Enterizo corto de tiras', 'enterizos', 'SE SPORT', 120000,
  'Cuello halter que se amarra atrás y una espalda abierta hasta la cintura. Tejido en canal '
  'que acompaña cada movimiento.',
  ['Cuello halter con amarre', 'Espalda abierta', 'Tejido en canal', 'Siso trasero'],
  [c('Amarillo', '21', ['enterizo-espalda-abierta-1.jpg', 'enterizo-espalda-abierta-2.jpg',
                       'enterizo-espalda-abierta-4.jpg', 'enterizo-espalda-abierta-3.jpg'])],
  alt='Enterizo corto amarillo de tiras con espalda abierta')

p('enterizo-corto-tiras-sesgo', 'Enterizo corto de tiras con sesgo', 'enterizos', 'AMORFIT', 120000,
  'Tiras finas y un sesgo ondulado en contraste bajo el busto. Ligero, femenino y listo para el estudio.',
  ['Tiras delgadas', 'Sesgo en contraste', 'Línea ondulada bajo el busto'],
  [c('Castaño y papiro', '41', ['EAA3F02C-826B-4C63-A722-F0EE63B61D9D.jpg']),
   c('Gris elefante', '40', ['F4D51CF5-B746-410B-8452-0E74FE235106.jpg']),
   c('Petróleo y blanco', '42')],
  alt='Enterizo corto de tiras con sesgo en contraste, foto de producto')

p('enterizo-corto-manga-corta-marfil', 'Enterizo corto manga corta en canal', 'enterizos', 'AMORFIT', 120000,
  'Tejido en canal, manga corta y una espalda en U que se descubre al girar. Claro, suave y fácil de combinar.',
  ['Tejido en canal', 'Manga corta', 'Espalda abierta en U', 'Siso trasero'],
  [c('Marfil', '34', ['fec74a51-32c4-4ee3-b6cf-3b775756f1f4.jpg', '0724e9c5-947e-4674-902f-8a0fb1b8a00e.jpg'])],
  combina=['calentadoras-classic'],
  alt='Enterizo corto marfil de manga corta con espalda abierta')

p('enterizo-corto-halter', 'Enterizo corto halter', 'enterizos', None, 115000,
  'Halter en canal con sesgo blanco en cuello y sisas. Una pieza que se pone en un segundo y sostiene todo el entreno.',
  ['Cuello halter', 'Tejido en canal', 'Sesgo blanco en contraste'],
  [c('Café', 'PRD-1789435651', ['CAF_.jpg'])],
  alt='Enterizo corto halter café con sesgo blanco, foto de producto')

p('enterizo-largo-bota-campana', 'Enterizo largo bota campana', 'enterizos', 'AMORFIT', 85000,
  'Tirantes anchos, escote en U y una bota campana que alarga la pierna. Del estudio a la calle sin cambiar de ropa.',
  ['Tirantes anchos', 'Escote en U', 'Bota campana', 'Largo completo'],
  [c('Negro', '36', ['IMG_8483.jpg']),
   c('Azul claro', '38', ['IMG_8485.jpg']),
   c('Moka', '39', ['IMG_8484.jpg']),
   c('Amarillo', '37', ['ChatGPT_Image_8_sept_2026_22_48_15.jpg'])],
  alt='Enterizo largo bota campana de tirantes anchos, foto de producto')

p('enterizo-largo-manga-corta-sesgo', 'Enterizo largo manga corta con sesgo', 'enterizos', 'SE SPORT', 136000,
  'Escote cuadrado, manga corta y espalda abierta. Largo completo y siso trasero para una silueta continua.',
  ['Escote cuadrado', 'Manga corta', 'Espalda abierta', 'Siso trasero', 'Largo completo'],
  [c('Negro', '26'),
   c('Café', '27', ['enterizo-cafe-1.jpg', 'enterizo-cafe-3.jpg'], precio=140000)],
  alt='Enterizo largo café de manga corta con espalda abierta')

p('enterizo-corto-manga-corta-sesgo', 'Enterizo corto manga corta con sesgo', 'enterizos', 'SE SPORT', 125000,
  'Manga corta con sesgo en contraste.', ['Manga corta', 'Sesgo en contraste'],
  [c('Café', '20')])

p('enterizo-nude-costura-blanca', 'Enterizo nude con costura blanca', 'enterizos', 'NOONS', 135000,
  'Tono nude con costura blanca en contraste.', ['Costura blanca en contraste'],
  [c('Nude', '48')])

# ---------------------------------------------------------------- Sets
p('set-halo', 'Set Halo', 'sets', 'FIT LAB', 185000,
  'Body halter con sesgo marfil y amarre al cuello, más un short a juego. Dos piezas que ya vienen pensadas juntas.',
  ['Incluye body y short', 'Cuello halter con amarre', 'Sesgo en contraste', 'Espalda abierta'],
  [c('Rosado', '2', ['set-body-pink-1.jpg', 'set-body-pink-2.jpg', 'set-body-pink-4.jpg', 'set-body-pink-3.jpg'])],
  destacado=True, combina=['calentadoras-classic'],
  alt='Set Halo: body halter rosado con sesgo marfil y short marfil')

p('set-legging-top-costura', 'Set legging y top con costura', 'sets', 'NOONS', 140000,
  'Top halter y legging de tiro alto con costura blanca curva que dibuja la pierna. Siso atrás, línea limpia adelante.',
  ['Incluye top y legging', 'Costura blanca en contraste', 'Tiro alto', 'Siso trasero'],
  [c('Negro', '43', ['CF423696-AE53-4568-92EC-0821A15FAE83.jpg'])],
  combina=['calentadoras-classic'],
  alt='Set negro de top halter y legging con costura blanca, frente y espalda')

p('set-koko', 'Set Koko', 'sets', 'FIT LAB', 160000, 'Set Koko.', ['Incluye dos piezas'],
  [c('Vinotinto', '16')])

p('set-short-buzo-sesgo', 'Set short y buzo con sesgo', 'sets', 'SE SPORT', 150000,
  'Short y buzo con sesgo marfil.', ['Incluye short y buzo', 'Sesgo marfil'],
  [c('Negro', '24')])

# ---------------------------------------------------------------- Leggings
p('legging-mesh', 'Legging Mesh', 'leggings', 'FIT LAB', 110000,
  'Tiro alto y paneles en malla que dejan respirar la pierna justo donde más calor hace.',
  ['Tiro alto', 'Paneles en malla', 'Tejido sin costuras'],
  [c('Marfil', '19', ['set-body-mesh-1.jpg', 'set-body-mesh-3.jpg']),
   c('Negro', '17', ['trio-mesh-2.jpg', 'trio-mesh-3.jpg'])],
  combina=['body-mesh-manga-larga', 'blusita-mesh-con-top', 'top-bra'],
  alt='Legging de tiro alto con paneles de malla')

p('legging-rib-sin-push', 'Legging Rib', 'leggings', 'SE SPORT', 88000,
  'Tejido en canal, tiro alto y sin costuras. Sujeta sin marcar y se siente suave desde la primera puesta.',
  ['Tejido en canal (rib)', 'Tiro alto', 'Sin costuras'],
  [c('Marfil', 'PRD-1789435584', ['MARFIL.jpg']),
   c('Negro', '32', ['NEGRO.jpg'])],
  combina=['top-premium'],
  alt='Legging en canal de tiro alto, foto de producto')

p('legging-rib-push', 'Legging Rib con push', 'leggings', None, 88000,
  'El mismo tejido en canal con un fruncido trasero que levanta y define.',
  ['Tejido en canal (rib)', 'Tiro alto', 'Fruncido trasero con efecto push-up'],
  [c('Chocolate', 'PRD-1789435602', ['CHOCOLATE.jpg'])],
  combina=['top-premium'],
  alt='Legging chocolate en canal con fruncido trasero, foto de producto')

p('legging-koko', 'Legging Koko', 'leggings', 'FIT LAB', 100000,
  'Tiro alto con calados laterales que dejan ver un poco de piel y mucho movimiento.',
  ['Tiro alto', 'Calados laterales'],
  [c('Marfil', '6', ['f2877108-63e9-41ab-9221-a511dbb51b05.jpg'])],
  combina=['buzo-corto-sesgo'],
  alt='Legging marfil con calados laterales')

p('legging-verde-esmeralda', 'Legging verde esmeralda', 'leggings', None, 93000,
  'Legging verde esmeralda.', ['Tiro alto'], [c('Verde esmeralda', 'PRD-1789425434')])

p('legging-sesgo-blanco', 'Legging con sesgo blanco', 'leggings', 'SE SPORT', 88000,
  'Legging negro con sesgo blanco.', ['Sesgo en contraste'], [c('Negro', '33')])

# ---------------------------------------------------------------- Tops y buzos
p('top-premium', 'Top Premium', 'tops', None, 75000,
  'Tiras dobles ajustables y un nudo al frente que sostiene sin varillas. El logo, discreto, en el pecho.',
  ['Tiras dobles ajustables', 'Nudo frontal', 'Sin varillas'],
  [c('Chocolate', 'PRD-1789435340', ['D192FB32-E176-4FA9-94BB-40EF2EAED0E3.jpg', 'CHOCOLATE__1_.jpg', 'IMG_7743.jpg'])],
  combina=['legging-rib-push', 'legging-rib-sin-push'],
  alt='Top chocolate de tiras dobles con nudo frontal')

p('top-bra', 'Top bra', 'tops', 'FIT LAB', 60000,
  'Triángulo halter de sujeción ligera. Solo o bajo unas manguitas, siempre se ve terminado.',
  ['Corte triángulo', 'Cuello halter', 'Sujeción ligera'],
  [c('Gris', '12', ['e84cfd49-8cac-4f21-8aaa-ece45548a825.jpg', '15457d19-329c-4518-b685-49aa4cd39921.jpg']),
   c('Blanco', '11', ['set-coco-2.jpg'])],
  combina=['manguitas', 'short-koko', 'legging-mesh'],
  alt='Top bra halter de corte triángulo')

p('manguitas', 'Manguitas', 'tops', 'FIT LAB', 72000,
  'Un bolero de manga larga que cubre brazos y hombros y deja el top a la vista. La capa que se lleva al estudio.',
  ['Bolero de manga larga', 'Logo bordado en la manga'],
  [c('Negro', '9', ['14775d41-5085-47a4-bf95-a40c4537b3d8.jpg', '05a98569-01bd-4a88-b239-f1dbd356c176.jpg',
                    '9839e87e-fadd-4c45-9a04-bf22bcb2c997.jpg', '56158051-e04c-4bc7-ab2b-0c751cf5fc45.jpg']),
   c('Taupe', '13', ['set-coco-3.jpg', 'set-coco-4.jpg'])],
  tallas=UNICA, destacado=True, combina=['top-bra', 'short-koko'],
  alt='Manguitas de manga larga sobre top bra halter')

p('blusita-mesh-con-top', 'Blusita Mesh con top', 'tops', 'FIT LAB', 120000,
  'Crop de malla manga corta sobre un top interno. Transparencia justa y el logo en la manga.',
  ['Incluye blusa de malla y top interno', 'Manga corta', 'Corte crop'],
  [c('Negro', '15', ['trio-mesh-3.jpg', 'editorial-1.jpg', 'trio-mesh-4.jpg'])],
  combina=['legging-mesh'],
  alt='Blusa crop de malla negra con top interno')

p('buzo-corto-sesgo', 'Buzo corto con sesgo', 'tops', 'FIT LAB', 90000,
  'Manga larga y corte a la cintura con sesgo en contraste en hombros y bajo el busto.',
  ['Manga larga', 'Corte crop', 'Sesgo en contraste'],
  [c('Blanco', '4', ['DSC00233_2.jpg']),
   c('Vinotinto', '3', ['f2877108-63e9-41ab-9221-a511dbb51b05.jpg', '1ed9a872-231e-4179-9ee2-25c9970de428.jpg'], precio=100000)],
  combina=['legging-koko'],
  alt='Buzo corto de manga larga con sesgo en contraste')

p('buzo-sesgo-marfil', 'Buzo con sesgo marfil', 'tops', 'SE SPORT', 80000,
  'Tejido en canal, manga larga y un borde ondulado con sesgo marfil.',
  ['Tejido en canal', 'Manga larga', 'Sesgo marfil en cuello y bajo'],
  [c('Negro', '23', ['D6F30E72-3FE5-428A-804F-37AA770287AC.jpg'])],
  alt='Buzo negro en canal con sesgo marfil, foto de producto')

p('buzo-verde-esmeralda', 'Buzo verde esmeralda', 'tops', None, 93000, 'Buzo verde esmeralda.',
  ['Manga larga'], [c('Verde esmeralda', 'PRD-1789417640')])

p('chaqueta-lisa', 'Chaqueta lisa', 'tops', 'AMORFIT', 70000, 'Chaqueta lisa importada.',
  ['Importada'], [c('Café', '35')])

# ---------------------------------------------------------------- Bodys
p('body-mesh-manga-larga', 'Body Mesh manga larga', 'bodys', 'FIT LAB', 160000,
  'Cuello alto, manga larga y malla calada en hombros y brazos. Ajusta como segunda piel y deja respirar.',
  ['Cuello alto', 'Manga larga', 'Malla calada en mangas', 'Logo NUDE en el pecho'],
  [c('Marfil', '7', ['set-body-mesh-1.jpg', 'set-body-mesh-2.jpg', 'eb73a2f0-1c9c-4635-a986-3f6c8f16962a.jpg'])],
  destacado=True, combina=['legging-mesh', 'short-bucos'],
  alt='Body marfil de manga larga y cuello alto con malla en las mangas')

p('body-siso', 'Body siso', 'bodys', 'BELATTI', 85000, 'Body con siso trasero.', ['Siso trasero'],
  [c('Por definir', '08892fe2')])

p('body-manga-sesgo', 'Body con manga y sesgo', 'bodys', 'BELATTI', 90000, 'Body negro con manga y sesgo.',
  ['Manga', 'Sesgo en contraste'], [c('Negro', '63')])

p('body-con-manga', 'Body con manga', 'bodys', 'BELATTI', 90000, 'Body con manga.', ['Manga'],
  [c('Por definir', '64')])

# ---------------------------------------------------------------- Shorts y faldas
p('short-bucos', 'Short Bucos', 'shorts-y-faldas', 'FIT LAB', 80000,
  'Short ciclista de textura panal con siso trasero y el logo en la pretina. Se queda en su sitio cuando te mueves.',
  ['Tejido texturizado tipo panal', 'Siso trasero', 'Logo en la pretina'],
  [c('Café', '8', ['IMG_8029.jpg', '23b7783e-0512-493d-acf1-5d00887af670.jpg', 'IMG_8028.jpg'])],
  combina=['body-mesh-manga-larga', 'calentadoras-classic'],
  alt='Short ciclista café de textura panal con siso trasero')

p('short-koko', 'Short Koko', 'shorts-y-faldas', 'FIT LAB', 75000,
  'Short ciclista con calados laterales. Va con el top bra y las manguitas del mismo tono.',
  ['Calados laterales', 'Tiro alto'],
  [c('Taupe', '10', ['set-coco-1.jpg', 'set-coco-4.jpg'])],
  combina=['manguitas', 'top-bra'],
  alt='Short taupe con calados laterales, con manguitas y top bra')

p('short-sesgo-marfil', 'Short con sesgo marfil', 'shorts-y-faldas', 'SE SPORT', 85000,
  'Short negro con sesgo marfil.', ['Sesgo marfil'], [c('Negro', '46076')])

p('faldita', 'Faldita', 'shorts-y-faldas', 'NOONS', 85000, 'Faldita deportiva.', ['Falda deportiva'],
  [c('Lila', '44'), c('Amarillo', '45'), c('Azul', '46'), c('Blanco', '47')])

# ---------------------------------------------------------------- Accesorios
CAL = ['calentadorasclassic-8.jpg', 'calentadorasclassic-2.jpg', 'calentadorasclassic-7.jpg', 'calentadorasclassic-5.jpg']
p('calentadoras-classic', 'Calentadoras classic', 'accesorios', 'FIT LAB', 48000,
  'Tejido grueso en canal que se arruga a tu gusto sobre el tenis. El detalle que termina cualquier enterizo.',
  ['Tejido grueso en canal', 'Talla única'],
  [c(n, f'18-{slug(n)}', CAL) for n in ['Negro', 'Café', 'Beige', 'Marfil', 'Blanco', 'Rosado', 'Lila', 'Azul cielo', 'Azul petróleo']],
  tallas=UNICA, destacado=True,
  alt='Calentadoras tejidas en canal, nueve colores sobre una mesa de madera')

p('calentadoras-small', 'Calentadoras small', 'accesorios', 'Centro', 36000,
  'La versión corta: se arruga justo sobre el tobillo.', ['Tejido en canal', 'Talla única'],
  [c('Gris', '28', ['calentadorassmall-1.jpg'])], tallas=UNICA,
  alt='Calentadoras cortas grises sobre tenis plateados')

p('medias-montanita', 'Medias montañita', 'accesorios', 'Centro', 8000, 'Medias deportivas.', ['Talla única'],
  [c('Blanco', '29'), c('Negro', '30')], tallas=UNICA)

# ---------------------------------------------------------------- Bienestar
p('shot-de-curcuma', 'Shot de cúrcuma 1 L', 'bienestar', 'NUDE', 50000,
  'Cúrcuma, naranja y limón en una botella de un litro. Se toma en ayunas, una pequeña dosis cada mañana.',
  ['Botella de 1 litro', '100 % natural', 'Sin azúcar añadida', 'Tomar en ayunas'],
  [c('Natural', 'PRD-1790018940', ['146199F2-6CEF-4CEE-BC54-DC6BF4679700.jpg'])], tallas=UNICA,
  alt='Botella de un litro de shot de cúrcuma NUDE')

# ---------------------------------------------------------------- Salida
fotos = {}  # (fuente, tratamiento) -> salida


def foto_de(prod, src):
    fuente, trat = (src if isinstance(src, tuple) else (src, 'auto'))
    k = (fuente, trat)
    if k not in fotos:
        n = sum(1 for v in fotos.values() if v.startswith(f'p/{prod}-')) + 1
        fotos[k] = f'p/{prod}-{n}'
    return fotos[k]


productos = []
for d in P:
    con_fotos = any(col['fotos'] for col in d['colores'])
    variantes, imagenes = [], {}
    for col in d['colores']:
        for t in d['tallas']:
            variantes.append({'color': col['nombre'], 'hex': col['hex'], 'talla': t,
                              'sku': f"{col['codigo']}-{t}".upper(), 'disponible': True,
                              'precio': col['precio']})
        if col['fotos']:
            imagenes[col['nombre']] = [foto_de(d['slug'], f) for f in col['fotos']]
    nombre = d['nombre']
    productos.append({
        'nombre': nombre, 'slug': d['slug'], 'categoria': d['categoria'], 'coleccion': 'Temporada 2026',
        'marca': d['marca'], 'precio': d['precio'], 'descripcion': d['descripcion'], 'detalles': d['detalles'],
        'estado': 'activo' if con_fotos else 'borrador', 'destacado': d['destacado'],
        'combina_con': d['combina'], 'imagenes': imagenes, 'variantes': variantes,
        'seo': {'titulo': nombre,
                'descripcion': (d['descripcion'][:150].rsplit(' ', 1)[0] + '.') if len(d['descripcion']) > 155 else d['descripcion'],
                'alt': d['alt'] or nombre},
    })

slugs = {x['slug'] for x in productos}
for x in productos:
    for s in x['combina_con']:
        assert s in slugs, (x['slug'], s)
    assert x['precio'] <= min([v['precio'] or x['precio'] for v in x['variantes']]), x['slug']
skus = [v['sku'] for x in productos for v in x['variantes']]
assert len(skus) == len(set(skus)), 'sku duplicado'

json.dump({'productos': productos}, open(f'{ROOT}/src/content/productos.json', 'w'), ensure_ascii=False, indent=2)
manifiesto = [{'salida': v, 'fuente': k[0], 'tratamiento': k[1]} for k, v in fotos.items()]
if FOTOS:
    for m in manifiesto:
        assert os.path.exists(os.path.join(FOTOS, m['fuente'])), m['fuente']
json.dump(manifiesto, open(f'{ROOT}/scripts/catalogo-fotos.json', 'w'), ensure_ascii=False, indent=2)
pub = [x for x in productos if x['estado'] == 'activo']
print(len(productos), 'productos;', len(pub), 'publicados;', len(productos) - len(pub), 'borradores;',
      len(manifiesto), 'fotos;', len(skus), 'variantes')
