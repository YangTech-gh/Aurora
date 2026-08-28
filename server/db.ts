import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, InsertVisualProject, visualProjects, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listVisualProjects(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: visualProjects.id,
    name: visualProjects.name,
    activePage: visualProjects.activePage,
    createdAt: visualProjects.createdAt,
    updatedAt: visualProjects.updatedAt,
  }).from(visualProjects).where(eq(visualProjects.ownerId, ownerId)).orderBy(desc(visualProjects.updatedAt));
}

export async function getVisualProject(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(visualProjects).where(and(eq(visualProjects.ownerId, ownerId), eq(visualProjects.id, projectId))).limit(1);
  return result[0];
}

export async function saveVisualProject(project: InsertVisualProject) {
  const db = await getDb();
  if (!db) return undefined;
  if (project.id) {
    await db.update(visualProjects)
      .set({ name: project.name, activePage: project.activePage, projectJson: project.projectJson, origin: project.origin, detectedFramework: project.detectedFramework, sourceUrl: project.sourceUrl, importedFiles: project.importedFiles })
      .where(and(eq(visualProjects.id, project.id), eq(visualProjects.ownerId, project.ownerId)));
    return project.id;
  }
  const result = await db.insert(visualProjects).values(project);
  return Number(result[0].insertId);
}
