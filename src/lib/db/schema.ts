import { pgTable, serial, varchar, integer, decimal, date, timestamp, text } from 'drizzle-orm/pg-core';

// 製品マスタ
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull().default('個'),
  standardTime: decimal('standard_time', { precision: 10, scale: 2 }), // 標準工数（時間/個）
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 工程マスタ
export const processes = pgTable('processes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 作業者マスタ
export const workers = pgTable('workers', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 生産計画
export const productionPlans = pgTable('production_plans', {
  id: serial('id').primaryKey(),
  planDate: date('plan_date').notNull(),
  productId: integer('product_id').notNull().references(() => products.id),
  processId: integer('process_id').notNull().references(() => processes.id),
  plannedQuantity: integer('planned_quantity').notNull(),
  plannedHours: decimal('planned_hours', { precision: 10, scale: 2 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 生産実績
export const productionResults = pgTable('production_results', {
  id: serial('id').primaryKey(),
  resultDate: date('result_date').notNull(),
  productId: integer('product_id').notNull().references(() => products.id),
  processId: integer('process_id').notNull().references(() => processes.id),
  workerId: integer('worker_id').references(() => workers.id),
  actualQuantity: integer('actual_quantity').notNull(),
  actualHours: decimal('actual_hours', { precision: 10, scale: 2 }),
  defectQuantity: integer('defect_quantity').default(0),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
