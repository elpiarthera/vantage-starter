/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminHelpers from "../adminHelpers.js";
import type * as agents from "../agents.js";
import type * as architectSessions from "../architectSessions.js";
import type * as assets from "../assets.js";
import type * as chatMessages from "../chatMessages.js";
import type * as checkpoints from "../checkpoints.js";
import type * as credits from "../credits.js";
import type * as email from "../email.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as http_agent from "../http/agent.js";
import type * as http_ai from "../http/ai.js";
import type * as http_orchestration from "../http/orchestration.js";
import type * as lib_agentAuth from "../lib/agentAuth.js";
import type * as lib_agentComposer from "../lib/agentComposer.js";
import type * as lib_agentTokens from "../lib/agentTokens.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_rag from "../lib/rag.js";
import type * as memory from "../memory.js";
import type * as missions from "../missions.js";
import type * as operations from "../operations.js";
import type * as orchestration from "../orchestration.js";
import type * as polar from "../polar.js";
import type * as rateLimits from "../rateLimits.js";
import type * as schemas_architect from "../schemas/architect.js";
import type * as seed from "../seed.js";
import type * as seedCredits from "../seedCredits.js";
import type * as sharedLinks from "../sharedLinks.js";
import type * as skills from "../skills.js";
import type * as subscriptionTiers from "../subscriptionTiers.js";
import type * as subscriptions from "../subscriptions.js";
import type * as usageTracking from "../usageTracking.js";
import type * as users from "../users.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminHelpers: typeof adminHelpers;
  agents: typeof agents;
  architectSessions: typeof architectSessions;
  assets: typeof assets;
  chatMessages: typeof chatMessages;
  checkpoints: typeof checkpoints;
  credits: typeof credits;
  email: typeof email;
  files: typeof files;
  http: typeof http;
  "http/agent": typeof http_agent;
  "http/ai": typeof http_ai;
  "http/orchestration": typeof http_orchestration;
  "lib/agentAuth": typeof lib_agentAuth;
  "lib/agentComposer": typeof lib_agentComposer;
  "lib/agentTokens": typeof lib_agentTokens;
  "lib/auth": typeof lib_auth;
  "lib/rag": typeof lib_rag;
  memory: typeof memory;
  missions: typeof missions;
  operations: typeof operations;
  orchestration: typeof orchestration;
  polar: typeof polar;
  rateLimits: typeof rateLimits;
  "schemas/architect": typeof schemas_architect;
  seed: typeof seed;
  seedCredits: typeof seedCredits;
  sharedLinks: typeof sharedLinks;
  skills: typeof skills;
  subscriptionTiers: typeof subscriptionTiers;
  subscriptions: typeof subscriptions;
  usageTracking: typeof usageTracking;
  users: typeof users;
  workspaces: typeof workspaces;
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

export declare const components: {
  polar: {
    lib: {
      createProduct: FunctionReference<
        "mutation",
        "internal",
        {
          product: {
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          };
        },
        any
      >;
      createSubscription: FunctionReference<
        "mutation",
        "internal",
        {
          subscription: {
            amount: number | null;
            cancelAtPeriodEnd: boolean;
            canceledAt?: string | null;
            checkoutId: string | null;
            createdAt: string;
            currency: string | null;
            currentPeriodEnd: string | null;
            currentPeriodStart: string;
            customFieldData?: Record<string, any>;
            customerCancellationComment?: string | null;
            customerCancellationReason?: string | null;
            customerId: string;
            discountId?: string | null;
            endedAt: string | null;
            endsAt?: string | null;
            id: string;
            metadata: Record<string, any>;
            modifiedAt: string | null;
            priceId?: string;
            productId: string;
            recurringInterval: string | null;
            recurringIntervalCount?: number;
            seats?: number | null;
            startedAt: string | null;
            status: string;
            trialEnd?: string | null;
            trialStart?: string | null;
          };
        },
        any
      >;
      getCurrentSubscription: FunctionReference<
        "query",
        "internal",
        { userId: string },
        {
          amount: number | null;
          cancelAtPeriodEnd: boolean;
          canceledAt?: string | null;
          checkoutId: string | null;
          createdAt: string;
          currency: string | null;
          currentPeriodEnd: string | null;
          currentPeriodStart: string;
          customFieldData?: Record<string, any>;
          customerCancellationComment?: string | null;
          customerCancellationReason?: string | null;
          customerId: string;
          discountId?: string | null;
          endedAt: string | null;
          endsAt?: string | null;
          id: string;
          metadata: Record<string, any>;
          modifiedAt: string | null;
          priceId?: string;
          product: {
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          };
          productId: string;
          recurringInterval: string | null;
          recurringIntervalCount?: number;
          seats?: number | null;
          startedAt: string | null;
          status: string;
          trialEnd?: string | null;
          trialStart?: string | null;
        } | null
      >;
      getCustomerByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        { id: string; metadata?: Record<string, any>; userId: string } | null
      >;
      getProduct: FunctionReference<
        "query",
        "internal",
        { id: string },
        {
          benefits?: Array<{
            createdAt: string;
            deletable: boolean;
            description: string;
            id: string;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            organizationId: string;
            properties?: any;
            selectable: boolean;
            type: string;
          }>;
          createdAt: string;
          description: string | null;
          id: string;
          isArchived: boolean;
          isRecurring: boolean;
          medias: Array<{
            checksumEtag: string | null;
            checksumSha256Base64: string | null;
            checksumSha256Hex: string | null;
            createdAt: string;
            id: string;
            isUploaded: boolean;
            lastModifiedAt: string | null;
            mimeType: string;
            name: string;
            organizationId: string;
            path: string;
            publicUrl: string;
            service?: string;
            size: number;
            sizeReadable: string;
            storageVersion: string | null;
            version: string | null;
          }>;
          metadata?: Record<string, any>;
          modifiedAt: string | null;
          name: string;
          organizationId: string;
          prices: Array<{
            amountType?: string;
            capAmount?: number | null;
            createdAt: string;
            id: string;
            isArchived: boolean;
            maximumAmount?: number | null;
            meter?: { id: string; name: string };
            meterId?: string;
            minimumAmount?: number | null;
            modifiedAt: string | null;
            presetAmount?: number | null;
            priceAmount?: number;
            priceCurrency?: string;
            productId: string;
            recurringInterval?: string | null;
            seatTiers?: Array<{
              maxSeats: number | null;
              minSeats: number;
              pricePerSeat: number;
            }>;
            source?: string;
            type?: string;
            unitAmount?: string;
          }>;
          recurringInterval?: string | null;
          recurringIntervalCount?: number | null;
          trialInterval?: string | null;
          trialIntervalCount?: number | null;
        } | null
      >;
      getSubscription: FunctionReference<
        "query",
        "internal",
        { id: string },
        {
          amount: number | null;
          cancelAtPeriodEnd: boolean;
          canceledAt?: string | null;
          checkoutId: string | null;
          createdAt: string;
          currency: string | null;
          currentPeriodEnd: string | null;
          currentPeriodStart: string;
          customFieldData?: Record<string, any>;
          customerCancellationComment?: string | null;
          customerCancellationReason?: string | null;
          customerId: string;
          discountId?: string | null;
          endedAt: string | null;
          endsAt?: string | null;
          id: string;
          metadata: Record<string, any>;
          modifiedAt: string | null;
          priceId?: string;
          productId: string;
          recurringInterval: string | null;
          recurringIntervalCount?: number;
          seats?: number | null;
          startedAt: string | null;
          status: string;
          trialEnd?: string | null;
          trialStart?: string | null;
        } | null
      >;
      insertCustomer: FunctionReference<
        "mutation",
        "internal",
        { id: string; metadata?: Record<string, any>; userId: string },
        string
      >;
      listAllUserSubscriptions: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amount: number | null;
          cancelAtPeriodEnd: boolean;
          canceledAt?: string | null;
          checkoutId: string | null;
          createdAt: string;
          currency: string | null;
          currentPeriodEnd: string | null;
          currentPeriodStart: string;
          customFieldData?: Record<string, any>;
          customerCancellationComment?: string | null;
          customerCancellationReason?: string | null;
          customerId: string;
          discountId?: string | null;
          endedAt: string | null;
          endsAt?: string | null;
          id: string;
          metadata: Record<string, any>;
          modifiedAt: string | null;
          priceId?: string;
          product: {
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          } | null;
          productId: string;
          recurringInterval: string | null;
          recurringIntervalCount?: number;
          seats?: number | null;
          startedAt: string | null;
          status: string;
          trialEnd?: string | null;
          trialStart?: string | null;
        }>
      >;
      listCustomerSubscriptions: FunctionReference<
        "query",
        "internal",
        { customerId: string },
        Array<{
          amount: number | null;
          cancelAtPeriodEnd: boolean;
          canceledAt?: string | null;
          checkoutId: string | null;
          createdAt: string;
          currency: string | null;
          currentPeriodEnd: string | null;
          currentPeriodStart: string;
          customFieldData?: Record<string, any>;
          customerCancellationComment?: string | null;
          customerCancellationReason?: string | null;
          customerId: string;
          discountId?: string | null;
          endedAt: string | null;
          endsAt?: string | null;
          id: string;
          metadata: Record<string, any>;
          modifiedAt: string | null;
          priceId?: string;
          productId: string;
          recurringInterval: string | null;
          recurringIntervalCount?: number;
          seats?: number | null;
          startedAt: string | null;
          status: string;
          trialEnd?: string | null;
          trialStart?: string | null;
        }>
      >;
      listProducts: FunctionReference<
        "query",
        "internal",
        { includeArchived?: boolean },
        Array<{
          benefits?: Array<{
            createdAt: string;
            deletable: boolean;
            description: string;
            id: string;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            organizationId: string;
            properties?: any;
            selectable: boolean;
            type: string;
          }>;
          createdAt: string;
          description: string | null;
          id: string;
          isArchived: boolean;
          isRecurring: boolean;
          medias: Array<{
            checksumEtag: string | null;
            checksumSha256Base64: string | null;
            checksumSha256Hex: string | null;
            createdAt: string;
            id: string;
            isUploaded: boolean;
            lastModifiedAt: string | null;
            mimeType: string;
            name: string;
            organizationId: string;
            path: string;
            publicUrl: string;
            service?: string;
            size: number;
            sizeReadable: string;
            storageVersion: string | null;
            version: string | null;
          }>;
          metadata?: Record<string, any>;
          modifiedAt: string | null;
          name: string;
          organizationId: string;
          priceAmount?: number;
          prices: Array<{
            amountType?: string;
            capAmount?: number | null;
            createdAt: string;
            id: string;
            isArchived: boolean;
            maximumAmount?: number | null;
            meter?: { id: string; name: string };
            meterId?: string;
            minimumAmount?: number | null;
            modifiedAt: string | null;
            presetAmount?: number | null;
            priceAmount?: number;
            priceCurrency?: string;
            productId: string;
            recurringInterval?: string | null;
            seatTiers?: Array<{
              maxSeats: number | null;
              minSeats: number;
              pricePerSeat: number;
            }>;
            source?: string;
            type?: string;
            unitAmount?: string;
          }>;
          recurringInterval?: string | null;
          recurringIntervalCount?: number | null;
          trialInterval?: string | null;
          trialIntervalCount?: number | null;
        }>
      >;
      listUserSubscriptions: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          amount: number | null;
          cancelAtPeriodEnd: boolean;
          canceledAt?: string | null;
          checkoutId: string | null;
          createdAt: string;
          currency: string | null;
          currentPeriodEnd: string | null;
          currentPeriodStart: string;
          customFieldData?: Record<string, any>;
          customerCancellationComment?: string | null;
          customerCancellationReason?: string | null;
          customerId: string;
          discountId?: string | null;
          endedAt: string | null;
          endsAt?: string | null;
          id: string;
          metadata: Record<string, any>;
          modifiedAt: string | null;
          priceId?: string;
          product: {
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          } | null;
          productId: string;
          recurringInterval: string | null;
          recurringIntervalCount?: number;
          seats?: number | null;
          startedAt: string | null;
          status: string;
          trialEnd?: string | null;
          trialStart?: string | null;
        }>
      >;
      syncProducts: FunctionReference<
        "action",
        "internal",
        { polarAccessToken: string; server: "sandbox" | "production" },
        any
      >;
      updateProduct: FunctionReference<
        "mutation",
        "internal",
        {
          product: {
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          };
        },
        any
      >;
      updateProducts: FunctionReference<
        "mutation",
        "internal",
        {
          polarAccessToken: string;
          products: Array<{
            benefits?: Array<{
              createdAt: string;
              deletable: boolean;
              description: string;
              id: string;
              metadata?: Record<string, any>;
              modifiedAt: string | null;
              organizationId: string;
              properties?: any;
              selectable: boolean;
              type: string;
            }>;
            createdAt: string;
            description: string | null;
            id: string;
            isArchived: boolean;
            isRecurring: boolean;
            medias: Array<{
              checksumEtag: string | null;
              checksumSha256Base64: string | null;
              checksumSha256Hex: string | null;
              createdAt: string;
              id: string;
              isUploaded: boolean;
              lastModifiedAt: string | null;
              mimeType: string;
              name: string;
              organizationId: string;
              path: string;
              publicUrl: string;
              service?: string;
              size: number;
              sizeReadable: string;
              storageVersion: string | null;
              version: string | null;
            }>;
            metadata?: Record<string, any>;
            modifiedAt: string | null;
            name: string;
            organizationId: string;
            prices: Array<{
              amountType?: string;
              capAmount?: number | null;
              createdAt: string;
              id: string;
              isArchived: boolean;
              maximumAmount?: number | null;
              meter?: { id: string; name: string };
              meterId?: string;
              minimumAmount?: number | null;
              modifiedAt: string | null;
              presetAmount?: number | null;
              priceAmount?: number;
              priceCurrency?: string;
              productId: string;
              recurringInterval?: string | null;
              seatTiers?: Array<{
                maxSeats: number | null;
                minSeats: number;
                pricePerSeat: number;
              }>;
              source?: string;
              type?: string;
              unitAmount?: string;
            }>;
            recurringInterval?: string | null;
            recurringIntervalCount?: number | null;
            trialInterval?: string | null;
            trialIntervalCount?: number | null;
          }>;
        },
        any
      >;
      updateSubscription: FunctionReference<
        "mutation",
        "internal",
        {
          subscription: {
            amount: number | null;
            cancelAtPeriodEnd: boolean;
            canceledAt?: string | null;
            checkoutId: string | null;
            createdAt: string;
            currency: string | null;
            currentPeriodEnd: string | null;
            currentPeriodStart: string;
            customFieldData?: Record<string, any>;
            customerCancellationComment?: string | null;
            customerCancellationReason?: string | null;
            customerId: string;
            discountId?: string | null;
            endedAt: string | null;
            endsAt?: string | null;
            id: string;
            metadata: Record<string, any>;
            modifiedAt: string | null;
            priceId?: string;
            productId: string;
            recurringInterval: string | null;
            recurringIntervalCount?: number;
            seats?: number | null;
            startedAt: string | null;
            status: string;
            trialEnd?: string | null;
            trialStart?: string | null;
          };
        },
        any
      >;
    };
  };
  rag: {
    chunks: {
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          chunks: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entryId: string;
          startOrder: number;
        },
        { status: "pending" | "ready" | "replaced" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          entryId: string;
          order: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            metadata?: Record<string, any>;
            order: number;
            state: "pending" | "ready" | "replaced";
            text: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      replaceChunksPage: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        { nextStartOrder: number; status: "pending" | "ready" | "replaced" }
      >;
    };
    entries: {
      add: FunctionReference<
        "mutation",
        "internal",
        {
          allChunks?: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        {
          created: boolean;
          entryId: string;
          status: "pending" | "ready" | "replaced";
        }
      >;
      addAsync: FunctionReference<
        "mutation",
        "internal",
        {
          chunker: string;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        { created: boolean; entryId: string; status: "pending" | "ready" }
      >;
      deleteAsync: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        null
      >;
      deleteByKeyAsync: FunctionReference<
        "mutation",
        "internal",
        { beforeVersion?: number; key: string; namespaceId: string },
        null
      >;
      deleteByKeySync: FunctionReference<
        "action",
        "internal",
        { key: string; namespaceId: string },
        null
      >;
      deleteSync: FunctionReference<
        "action",
        "internal",
        { entryId: string },
        null
      >;
      findByContentHash: FunctionReference<
        "query",
        "internal",
        {
          contentHash: string;
          dimension: number;
          filterNames: Array<string>;
          key: string;
          modelId: string;
          namespace: string;
        },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { entryId: string },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          namespaceId?: string;
          order?: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { entryId: string },
        {
          replacedEntry: {
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          } | null;
        }
      >;
    };
    namespaces: {
      deleteNamespace: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          deletedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
      deleteNamespaceSync: FunctionReference<
        "action",
        "internal",
        { namespaceId: string },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | {
          createdAt: number;
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          namespaceId: string;
          status: "pending" | "ready" | "replaced";
          version: number;
        }
      >;
      getOrCreate: FunctionReference<
        "mutation",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          onComplete?: string;
          status: "pending" | "ready";
        },
        { namespaceId: string; status: "pending" | "ready" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listNamespaceVersions: FunctionReference<
        "query",
        "internal",
        {
          namespace: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      lookup: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | string
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          replacedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
    };
    search: {
      search: FunctionReference<
        "action",
        "internal",
        {
          chunkContext?: { after: number; before: number };
          dimension?: number;
          embedding?: Array<number>;
          filters: Array<{ name: string; value: any }>;
          limit: number;
          modelId: string;
          namespace: string;
          searchType?: "vector" | "text" | "hybrid";
          textQuery?: string;
          textWeight?: number;
          vectorScoreThreshold?: number;
          vectorWeight?: number;
        },
        {
          entries: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          results: Array<{
            content: Array<{ metadata?: Record<string, any>; text: string }>;
            entryId: string;
            order: number;
            score: number;
            startOrder: number;
          }>;
        }
      >;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: Array<string> | string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bcc?: Array<string>;
          bounced?: boolean;
          cc?: Array<string>;
          clicked?: boolean;
          complained: boolean;
          createdAt: number;
          deliveryDelayed?: boolean;
          errorMessage?: string;
          failed?: boolean;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          bounced: boolean;
          clicked: boolean;
          complained: boolean;
          deliveryDelayed: boolean;
          errorMessage: string | null;
          failed: boolean;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          bcc?: Array<string>;
          cc?: Array<string>;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject?: string;
          template?: {
            id: string;
            variables?: Record<string, string | number>;
          };
          text?: string;
          to: Array<string>;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
  ratelimiter: {
    public: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
  };
};
