// Manual shims for third-party modules without type declarations
declare module 'lucide-react' {
  export const User: any;
  export const Users: any;
  export const Settings: any;
  export const Leaf: any;
  export const X: any;
  export const Heart: any;
  export const HandHeart: any;
  export const Lock: any;
  export const ChevronDown: any;
  export const ChevronRight: any;
  export const ChevronLeft: any;
  export const MoreHorizontal: any;
  export const ArrowLeft: any;
  export const ArrowRight: any;
  export const Check: any;
  export const Search: any;
  export const Dot: any;
  export const GripVertical: any;
  export const ChevronUp: any;
  export const PanelLeft: any;
  export const Brain: any;
  export const Bell: any;
  export const Book: any;
  export const UserCheck: any;
  export const GraduationCap: any;
  export const MessageCircle: any;
  export const ChartLine: any;
  export const Vote: any;
  export const Lightbulb: any;
  export const Shield: any;
  export const Calendar: any;
  export const Video: any;
  export const Star: any;
  export const Circle: any;
  export const AlertCircle: any;
  const _default: any;
  export default _default;
}

declare module 'better-sqlite3' {
  const Database: any;
  export default Database;
}

declare module 'drizzle-orm' {
  export const sql: any;
  const _default: any;
  export default _default;
}

declare module 'drizzle-orm/neon-http' {
  export function drizzle(...args: any[]): any;
}

declare module 'drizzle-orm/pg-core' {
  type ColumnBuilder<T = any> = {
    notNull: () => ColumnBuilder<T>;
    unique: () => ColumnBuilder<T>;
    references: (fn: () => any) => ColumnBuilder<T>;
    $type: <U = any>() => ColumnBuilder<U>;
    default: (v?: any) => ColumnBuilder<T>;
  } & any;

  export function pgTable(name: string, cols: Record<string, any>): any;
  export function text(name: string): ColumnBuilder<string>;
  export function varchar(name: string): ColumnBuilder<string>;
  export function integer(name: string): ColumnBuilder<number>;
  export function real(name: string): ColumnBuilder<number>;
  export function boolean(name: string): ColumnBuilder<boolean>;
  export function timestamp(name: string): ColumnBuilder<number>;
  export function json(name: string): ColumnBuilder<any>;
}
