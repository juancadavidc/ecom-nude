# Placeholders de producto — DESECHABLES

Generados por `tienda/scripts/gen-placeholders.mjs`. No son fotografia: son un
fondo plano de la paleta con el isotipo centrado, para poder construir y
verificar la card, la galeria y la ficha antes de que exista sesion de producto.

**Se borran completos** cuando entre la fotografia real (SPEC §13, decision
abierta 5). Lo que hay que cambiar entonces es `imagenes` en
`tienda/src/content/productos.json` y borrar este directorio junto con
`tienda/public/fotos/placeholder/`.

Los minimos que tendra que cumplir la foto de verdad estan en SPEC §6: fondo
Cream o Sahara, luz natural calida y lateral, sin flash directo, 3:4, minimo
1600px de ancho, y `alt` descriptivo en cada una.
