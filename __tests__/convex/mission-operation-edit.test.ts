/// <reference types="vite/client" />
/**
 * Mission/operation edit regression tests (docs/brief-ui.md, task k170tzpc).
 *
 * A created mission was frozen: neither the mission (title, objective,
 * success criteria) nor its operations (title, description, duration,
 * dependencies) could be corrected after creation — a typo forced deleting
 * and redoing the whole mission.
 *
 * `convex/missions.ts::update` and `convex/operations.ts::update` already
 * existed and were already workspace-guarded — the defect was that no UI
 * call-site ever invoked them (the orphan-mutation class, see the frontend
 * census in the PR). This file proves the mutations themselves: a
 * successful edit persists, a refused edit changes nothing AND surfaces an
 * error, and editing an operation that another depends on does not corrupt
 * the dependency chain.
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";

const modules = import.meta.glob([
	"../../convex/**/*.ts",
	"../../convex/**/*.js",
	"!../../convex/**/*.d.ts",
]);

function makeT() {
	return convexTest(schema, modules);
}

const OWNER_A = "user_org_a_owner";
const ATTACKER_B = "user_org_b_attacker";

async function seedMissionWithOps(t: ReturnType<typeof makeT>) {
	return await t.run(async (ctx) => {
		const now = Date.now();

		const ownerId = await ctx.db.insert("users", {
			clerkUserId: OWNER_A,
			organizationId: undefined,
			email: `${OWNER_A}@test.com`,
			createdAt: now,
			updatedAt: now,
		});

		const workspaceId = await ctx.db.insert("workspaces", {
			organizationId: "personal",
			ownerId: OWNER_A,
			name: "Org A Workspace",
			isDefault: true,
			createdAt: now,
			updatedAt: now,
		});

		const missionId = await ctx.db.insert("missions", {
			workspaceId,
			name: "Original mission title",
			objective: "Original objective",
			successCriteria: ["Original criterion"],
			status: "pending",
			priority: "medium",
			progress: 0,
			createdBy: OWNER_A,
			ownerId: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

		const opAId = await ctx.db.insert("operations", {
			missionId,
			workspaceId,
			name: "Operation A",
			type: "ai",
			status: "pending",
			dependsOn: [],
			createdBy: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

		// Operation B depends on operation A.
		const opBId = await ctx.db.insert("operations", {
			missionId,
			workspaceId,
			name: "Operation B",
			type: "ai",
			status: "blocked",
			dependsOn: [opAId],
			createdBy: OWNER_A,
			createdAt: now,
			updatedAt: now,
		});

		return { ownerId, workspaceId, missionId, opAId, opBId };
	});
}

describe("missions.update — a typo can be corrected", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED 1: an edited title is re-read as the new value", async () => {
		const { missionId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		await asOwner.mutation(api.missions.update, {
			id: missionId,
			name: "Corrected mission title",
			objective: "Corrected objective",
			successCriteria: ["Corrected criterion"],
		});

		const mission = await asOwner.query(api.missions.get, { id: missionId });
		expect(mission?.name).toBe("Corrected mission title");
		expect(mission?.objective).toBe("Corrected objective");
		expect(mission?.successCriteria).toEqual(["Corrected criterion"]);
	});

	it("RED 2: an edit refused by access control changes nothing AND throws", async () => {
		const { missionId } = await seedMissionWithOps(t);
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });

		// Attacker has no user row / no workspace access -> requireAuthWithWorkspace throws.
		await expect(
			asAttacker.mutation(api.missions.update, {
				id: missionId,
				name: "Hijacked title",
			}),
		).rejects.toThrow();

		// State half of the assertion: nothing changed, read back as owner.
		const asOwner = t.withIdentity({ subject: OWNER_A });
		const mission = await asOwner.query(api.missions.get, { id: missionId });
		expect(mission?.name).toBe("Original mission title");
	});
});

describe("operations.update — editing an operation preserves the dependency chain", () => {
	let t: ReturnType<typeof makeT>;

	beforeEach(() => {
		t = makeT();
	});

	it("RED 1: an edited operation title/description/duration is re-read as the new value", async () => {
		const { opAId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		await asOwner.mutation(api.operations.update, {
			operationId: opAId,
			name: "Operation A (renamed)",
			description: "New description",
			estimatedMinutes: 45,
		});

		const ops = await t.run(async (ctx) => ctx.db.get(opAId));
		expect(ops?.name).toBe("Operation A (renamed)");
		expect(ops?.description).toBe("New description");
		expect(ops?.estimatedMinutes).toBe(45);
	});

	it("RED 2: an edit refused by access control changes nothing AND throws", async () => {
		const { opAId } = await seedMissionWithOps(t);
		const asAttacker = t.withIdentity({ subject: ATTACKER_B });

		await expect(
			asAttacker.mutation(api.operations.update, {
				operationId: opAId,
				name: "Hijacked operation",
			}),
		).rejects.toThrow();

		const op = await t.run(async (ctx) => ctx.db.get(opAId));
		expect(op?.name).toBe("Operation A");
	});

	it("RED 3: renaming operation A does not break B's dependency link", async () => {
		const { opAId, opBId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		await asOwner.mutation(api.operations.update, {
			operationId: opAId,
			name: "Operation A (renamed)",
		});

		const opB = await t.run(async (ctx) => ctx.db.get(opBId));
		expect(opB?.dependsOn).toEqual([opAId]);
	});

	it("rejects a dependsOn edit that would make an operation depend on itself", async () => {
		const { opAId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		await expect(
			asOwner.mutation(api.operations.update, {
				operationId: opAId,
				dependsOn: [opAId],
			}),
		).rejects.toThrow();
	});

	it("rejects a dependsOn edit that reaches into a different mission", async () => {
		const { missionId, opAId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		const otherMissionOpId: Id<"operations"> = await t.run(async (ctx) => {
			const now = Date.now();
			const mission = await ctx.db.get(missionId);
			if (!mission) throw new Error("Mission not found");

			const otherMissionId = await ctx.db.insert("missions", {
				workspaceId: mission.workspaceId,
				name: "Other mission",
				status: "pending",
				priority: "medium",
				progress: 0,
				createdBy: OWNER_A,
				ownerId: OWNER_A,
				createdAt: now,
				updatedAt: now,
			});

			return await ctx.db.insert("operations", {
				missionId: otherMissionId,
				workspaceId: mission.workspaceId,
				name: "Foreign operation",
				type: "ai",
				status: "pending",
				dependsOn: [],
				createdBy: OWNER_A,
				createdAt: now,
				updatedAt: now,
			});
		});

		await expect(
			asOwner.mutation(api.operations.update, {
				operationId: opAId,
				dependsOn: [otherMissionOpId],
			}),
		).rejects.toThrow();

		const opA = await t.run(async (ctx) => ctx.db.get(opAId));
		expect(opA?.dependsOn).toEqual([]);
	});

	it("rejects a dependsOn edit that would create a circular chain", async () => {
		const { opAId, opBId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		// B already depends on A. Making A depend on B would create a cycle.
		await expect(
			asOwner.mutation(api.operations.update, {
				operationId: opAId,
				dependsOn: [opBId],
			}),
		).rejects.toThrow();

		const opA = await t.run(async (ctx) => ctx.db.get(opAId));
		expect(opA?.dependsOn).toEqual([]);
	});

	it("accepts a legitimate dependsOn edit within the same mission", async () => {
		const { missionId, opAId, opBId } = await seedMissionWithOps(t);
		const asOwner = t.withIdentity({ subject: OWNER_A });

		const opCId: Id<"operations"> = await t.run(async (ctx) => {
			const now = Date.now();
			const mission = await ctx.db.get(missionId);
			if (!mission) throw new Error("Mission not found");
			return await ctx.db.insert("operations", {
				missionId,
				workspaceId: mission.workspaceId,
				name: "Operation C",
				type: "ai",
				status: "pending",
				dependsOn: [],
				createdBy: OWNER_A,
				createdAt: now,
				updatedAt: now,
			});
		});

		await asOwner.mutation(api.operations.update, {
			operationId: opCId,
			dependsOn: [opAId, opBId],
		});

		const opC = await t.run(async (ctx) => ctx.db.get(opCId));
		expect(opC?.dependsOn).toEqual([opAId, opBId]);
	});
});
