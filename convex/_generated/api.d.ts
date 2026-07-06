/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as buyerExpenses from "../buyerExpenses.js";
import type * as cashMovements from "../cashMovements.js";
import type * as catalogPieces from "../catalogPieces.js";
import type * as clients from "../clients.js";
import type * as closings from "../closings.js";
import type * as lots from "../lots.js";
import type * as pmr from "../pmr.js";
import type * as priceCheckSessions from "../priceCheckSessions.js";
import type * as priceChecks from "../priceChecks.js";
import type * as purchases from "../purchases.js";
import type * as quotations from "../quotations.js";
import type * as storage from "../storage.js";
import type * as supplierMovements from "../supplierMovements.js";
import type * as supplierPurchases from "../supplierPurchases.js";
import type * as suppliers from "../suppliers.js";
import type * as tenants from "../tenants.js";
import type * as users from "../users.js";
import type * as whatsappCampaignActions from "../whatsappCampaignActions.js";
import type * as whatsappCampaigns from "../whatsappCampaigns.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  buyerExpenses: typeof buyerExpenses;
  cashMovements: typeof cashMovements;
  catalogPieces: typeof catalogPieces;
  clients: typeof clients;
  closings: typeof closings;
  lots: typeof lots;
  pmr: typeof pmr;
  priceCheckSessions: typeof priceCheckSessions;
  priceChecks: typeof priceChecks;
  purchases: typeof purchases;
  quotations: typeof quotations;
  storage: typeof storage;
  supplierMovements: typeof supplierMovements;
  supplierPurchases: typeof supplierPurchases;
  suppliers: typeof suppliers;
  tenants: typeof tenants;
  users: typeof users;
  whatsappCampaignActions: typeof whatsappCampaignActions;
  whatsappCampaigns: typeof whatsappCampaigns;
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
