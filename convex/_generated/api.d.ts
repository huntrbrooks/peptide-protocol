/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as dailyStats from "../dailyStats.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as klaviyo from "../klaviyo.js";
import type * as klaviyoData from "../klaviyoData.js";
import type * as lib_memberCodes from "../lib/memberCodes.js";
import type * as lib_memberDiscount from "../lib/memberDiscount.js";
import type * as lib_rfmScoring from "../lib/rfmScoring.js";
import type * as lib_staff from "../lib/staff.js";
import type * as lifecycle from "../lifecycle.js";
import type * as lifecycleEmail from "../lifecycleEmail.js";
import type * as members from "../members.js";
import type * as orders from "../orders.js";
import type * as purchaseAnalytics from "../purchaseAnalytics.js";
import type * as rfm from "../rfm.js";
import type * as staff from "../staff.js";
import type * as welcomeEmail from "../welcomeEmail.js";
import type * as wishlists from "../wishlists.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  crons: typeof crons;
  dailyStats: typeof dailyStats;
  http: typeof http;
  inventory: typeof inventory;
  klaviyo: typeof klaviyo;
  klaviyoData: typeof klaviyoData;
  "lib/memberCodes": typeof lib_memberCodes;
  "lib/memberDiscount": typeof lib_memberDiscount;
  "lib/rfmScoring": typeof lib_rfmScoring;
  "lib/staff": typeof lib_staff;
  lifecycle: typeof lifecycle;
  lifecycleEmail: typeof lifecycleEmail;
  members: typeof members;
  orders: typeof orders;
  purchaseAnalytics: typeof purchaseAnalytics;
  rfm: typeof rfm;
  staff: typeof staff;
  welcomeEmail: typeof welcomeEmail;
  wishlists: typeof wishlists;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
