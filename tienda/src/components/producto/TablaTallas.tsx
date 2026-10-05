import { TABLA_TALLAS } from '@/lib/tallas'

/** Tabla de medidas. La usan el panel de la ficha y la pagina /guia-de-tallas. */
export function TablaTallas() {
  return (
    <div className="tabla-scroll">
      <table className="tabla-tallas">
        <caption className="visually-hidden">
          Equivalencia de tallas en centímetros de busto, cintura y cadera
        </caption>
        <thead>
          <tr>
            <th scope="col">Talla</th>
            <th scope="col">Busto</th>
            <th scope="col">Cintura</th>
            <th scope="col">Cadera</th>
          </tr>
        </thead>
        <tbody>
          {TABLA_TALLAS.map((fila) => (
            <tr key={fila.talla}>
              <th scope="row">{fila.talla}</th>
              <td>{fila.busto}</td>
              <td>{fila.cintura}</td>
              <td>{fila.cadera}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
