export interface SortConfig {
  field: string;
  dir?: "asc" | "desc";
}

export interface QueryConfig<T> {
  search?: (keyof T)[];
  sort?: SortConfig;
  pageSize?: number;
  filter?: (item: T) => boolean;
  groupBy?: keyof T;
}

export interface RunOptions<T> {
  term?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
  filterFn?: (item: T) => boolean;
  selected?: (string | number)[];
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  from: number;
  to: number;
  hasNext: boolean;
  hasPrev: boolean;
  term: string;
  sortField: string;
  sortDir: "asc" | "desc";
  isEmpty: boolean;
  isNoResults: boolean;
  allSelected: boolean;
  someSelected: boolean;
  ms: number;
}

export interface GroupResult<T> {
  groups: Record<string, T[]>;
  total: number;
  ms: number;
}

export interface QueryInstance<T> {
  run(data: T[], options?: RunOptions<T>): QueryResult<T> | GroupResult<T>;
  toJSON(): QueryConfig<T>;
}

export interface CreateQuery {
  <T extends Record<string, any>>(config: QueryConfig<T>): QueryInstance<T>;
  fromJSON<T extends Record<string, any>>(
    config: QueryConfig<T>,
  ): QueryInstance<T>;
}

export declare const createQuery: CreateQuery;
