# NUDE SPORTSWEAR — E-commerce

Tienda en línea de [NUDE SPORTSWEAR](https://nudesportswear.co), marca colombiana de ropa
deportiva femenina. Software a la medida: Next.js 16 + TypeScript + Tailwind 4 + Postgres + Cloudflare R2.

**En vivo:** https://nudesportswear.co — hoy sirve la **fase 1** (design system). La tienda
todavía no puede vender: no hay catálogo, carrito ni checkout.

```bash
cd tienda
npm install
npm run dev      # http://localhost:3000
```

---

## Qué hay acá

| Ruta | Contenido |
|------|-----------|
| [`SPEC.md`](SPEC.md) | **La especificación oficial** (v1.2). Alcance, tokens de marca aplicados a web, arquitectura de información, estructura bloque por bloque de cada página, modelo de producto, microcopy, accesibilidad. Manda sobre todo lo demás |
| [`tienda/`](tienda/) | El código. Ver [`tienda/README.md`](tienda/README.md) para estado real, estructura, reglas del sistema y despliegue |
| `design-system/` | Design system en tokens. **Subordinado a `SPEC.md` §2** — donde se contradigan, gana el SPEC |
| `assets/brand/` | Isotipo y wordmark en SVG, monocromos con `currentColor` |
| `assets/reference/` | 22 capturas de camilaperezsport.com. Referencia **estructural**, nunca estética |

---

## Fases (SPEC §9.4)

- [x] **1 — Design system.** Tokens, tipografía, componentes, header, footer
- [x] **2 — Modelo de datos y panel `/admin`** (productos sin inventario, categorías, pedidos, configuración)
- [x] **3 — Catálogo y ficha de producto** (catálogo real: 46 productos, 109 fotos)
- [x] **4 — Carrito y checkout** (contra entrega y transferencia, sin pasarela)
- [ ] **5 — Panel de pedidos y correos** (panel hecho; faltan los correos automáticos)
- [ ] **6 — Home real, Nosotras, contenido, SEO**

---

## Despliegue

Arquitectura de referencia de `starter-next-auth`: GitHub Actions (`.github/workflows/`,
con los workflows comunes de `shared-gha-stackless`) → imagen en GHCR → Coolify, con
Postgres por ambiente y fotos de producto en Cloudflare R2. Detalle en
[`tienda/README.md`](tienda/README.md#despliegue).

**El sitio en vivo sigue en Firebase** hasta el corte de DNS de `nudesportswear.co` hacia
Coolify.

---

## Repo de marca

La identidad, el contenido de Instagram, la landing y las finanzas viven aparte, en
`~/Documents/Claude/Projects/NUDE SPORTWEAR/`. Ahí está el `CLAUDE.md` con el ADN de marca,
la paleta Desert Dune y las decisiones cerradas. **Este repo no redefine nada de eso** — lo
consume vía `SPEC.md` §2.
