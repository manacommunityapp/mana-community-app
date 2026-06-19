import { apiClient } from "./apiClient";

/** One database table and its column names, as reported by the backend. */
export interface DbTableSchema {
  name: string;
  columns: string[];
}

export const schemaService = {
  /**
   * Fetch the live database schema (tables + columns) from the backend.
   * The backend introspects the connected database (e.g. PostgreSQL
   * information_schema) and returns the table/column metadata.
   *
   * Endpoint: GET /api/admin/db-schema  (SUPER_ADMIN only)
   */
  getDbSchema(): Promise<DbTableSchema[]> {
    return apiClient.get<DbTableSchema[]>("/admin/db-schema");
  },
};
