/**
 * Quick FAL API Key Test - Generate one image
 * Usage: node tests/quick-fal-test.js
 */

require("dotenv").config({ path: ".env.local" });

const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/flux/schnell"; // Fast model for quick test

async function testFalApiKey() {
	console.log("\n🧪 Quick FAL API Key Test\n");

	if (!FAL_KEY) {
		console.error("❌ FAL_KEY not found in .env.local");
		process.exit(1);
	}

	console.log(`✅ FAL_KEY found: ${FAL_KEY.substring(0, 10)}...`);
	console.log(`📷 Model: ${MODEL_ID}`);
	console.log(`🎨 Generating test image...\n`);

	const prompt =
		"A romantic couple dancing under the Eiffel Tower at sunset, cinematic lighting, 4k";

	try {
		// Submit job
		const startTime = Date.now();
		const submitRes = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${FAL_KEY}`,
			},
			body: JSON.stringify({
				prompt,
				image_size: "landscape_16_9",
				num_images: 1,
			}),
		});

		if (!submitRes.ok) {
			const errorText = await submitRes.text();
			throw new Error(`Submit failed: ${submitRes.status} - ${errorText}`);
		}

		const status = await submitRes.json();
		console.log(`📤 Job submitted: ${status.request_id}`);

		// Poll for result
		let attempts = 0;
		const maxAttempts = 30;

		while (attempts < maxAttempts) {
			attempts++;
			await new Promise((r) => setTimeout(r, 1000));

			const pollRes = await fetch(status.status_url, {
				headers: { Authorization: `Key ${FAL_KEY}` },
			});

			if (!pollRes.ok) continue;

			const pollData = await pollRes.json();
			process.stdout.write(`\r⏳ Status: ${pollData.status} (${attempts}s)`);

			if (pollData.status === "COMPLETED") {
				const resultRes = await fetch(status.response_url, {
					headers: { Authorization: `Key ${FAL_KEY}` },
				});
				const result = await resultRes.json();
				const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

				console.log(`\n\n✅ SUCCESS! Image generated in ${elapsed}s\n`);
				console.log(`🖼️  Image URL: ${result.images[0].url}\n`);
				console.log(`📝 Prompt: "${prompt}"\n`);
				return;
			}

			if (pollData.status === "FAILED") {
				throw new Error("Image generation failed");
			}
		}

		throw new Error("Timeout waiting for image");
	} catch (error) {
		console.error(`\n\n❌ FAILED: ${error.message}\n`);
		process.exit(1);
	}
}

testFalApiKey();
