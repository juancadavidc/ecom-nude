# NUDE SPORTSWEAR — E-commerce

Tienda en línea de [NUDE SPORTSWEAR](https://nudesportswear.co), marca colombiana de ropa
deportiva femenina. Software a la medida: Next.js 16 + TypeScript + Tailwind 4 + Firestore.

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
- [ ] **2 — Modelo de datos y panel `/admin`**
- [ ] **3 — Catálogo y ficha de producto**
- [ ] **4 — Carrito y checkout**
- [ ] **5 — Panel de pedidos y correos**
- [ ] **6 — Home real, Nosotras, contenido, SEO**

---

## Dos cosas que muerden

**El export estático se cae en la fase 3.** Hoy el sitio se despliega como `output: 'export'`
porque las cuatro rutas se prerenderizan en build. Catálogo y ficha necesitan Firestore con
renderizado en servidor, y el checkout necesita Server Actions — nada de eso existe en un
export estático. Hay que migrar a Firebase App Hosting antes de esa fase.

**El deploy pisa a la landing.** Este repo y el repo de marca despliegan al *mismo* sitio de
Firebase (`nudesportswear-landing`). El último que corre `firebase deploy` gana, y como son
repos separados git no avisa. Detalle y rollback en [`tienda/README.md`](tienda/README.md).

---

## Repo de marca

La identidad, el contenido de Instagram, la landing y las finanzas viven aparte, en
`~/Documents/Claude/Projects/NUDE SPORTWEAR/`. Ahí está el `CLAUDE.md` con el ADN de marca,
la paleta Desert Dune y las decisiones cerradas. **Este repo no redefine nada de eso** — lo
consume vía `SPEC.md` §2.
