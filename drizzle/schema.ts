import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const visualProjects = mysqlTable("visual_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  activePage: varchar("activePage", { length: 160 }).notNull().default("Home"),
  projectJson: text("projectJson").notNull(),
  origin: mysqlEnum("origin", ["blank", "folder", "github"]).default("blank").notNull(),
  detectedFramework: mysqlEnum("detectedFramework", ["html", "vue", "react", "svelte", "unknown"]).default("unknown").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  importedFiles: text("importedFiles"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisualProject = typeof visualProjects.$inferSelect;
export type InsertVisualProject = typeof visualProjects.$inferInsert;
