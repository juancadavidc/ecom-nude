/**
 * SPEC §9.6 — Phosphor Icons, peso `light`, 20px, color `--line`.
 * Su trazo fino es lo mas cercano al isotipo; un icono de trazo grueso al lado
 * del logo se ve prestado de otra marca.
 *
 * Se importa desde `/dist/ssr`: son SVG planos que funcionan igual en Server y
 * en Client Components, sin arrastrar el contexto de React al servidor.
 * Un solo punto de entrada mantiene el set cerrado — si un icono no esta aqui,
 * no esta aprobado.
 */
export {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowUp,
  ArrowsClockwise,
  CaretDown,
  CaretRight,
  Check,
  CheckCircle,
  Envelope,
  Eye,
  EyeSlash,
  GearSix,
  Handbag,
  ImageSquare,
  Info,
  InstagramLogo,
  List,
  MagnifyingGlass,
  Minus,
  PencilSimple,
  Plus,
  Receipt,
  Ruler,
  SignOut,
  SquaresFour,
  Star,
  Storefront,
  TShirt,
  Trash,
  Truck,
  UploadSimple,
  User,
  Wallet,
  Warning,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react/dist/ssr'

/** Valores por defecto del sistema. Se pasan explicitos en cada uso. */
export const ICONO = { size: 20, weight: 'light' } as const
