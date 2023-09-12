const fs = require('fs');
const OpenAI = require("openai");
const {Firestore} = require('@google-cloud/firestore');
const functions = require("@google-cloud/functions-framework");
const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");

const firestore = new Firestore();
const secretClient = new SecretManagerServiceClient();

// Function to fetch Axesso API Key from Google Cloud Secret Manager
async function getOpenAIAPIKey() {
	console.log('Fetching OpenAI API Key...');

	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/shoplc-amazon-reviews/secrets/openai-api-key/versions/latest'
	});

	console.log('Successfully fetched OpenAI API Key');
	return version.payload.data.toString();
}

// Number of reviews to process in a batch
const batchSize = 3;

// Global variable to set on initiation
let openai;

// Load reviews from a JSON file
console.log('Loading reviews from input/reviews.json...');
const reviews = JSON.parse(fs.readFileSync('input/reviews.json', 'utf-8'));
console.log(`Loaded ${reviews.length} reviews.`);

// Load prompt templates
console.log('Loading prompt templates...');
const firstPromptTemplate = fs.readFileSync('input/generate_violations.md', 'utf-8');
const secondPromptTemplate = fs.readFileSync('input/generate_output.md', 'utf-8');
const amazonGuidelinesTemplate = fs.readFileSync('input/amazon_review_tos.md', 'utf-8');
console.log('Prompt templates loaded.');

function createRoundOnePrompt(reviews) {
	const messages = []

	messages.push({"role": "user", "content": amazonGuidelinesTemplate})

	const reply = "Yes, I understand. I will scrutinize the Amazon reviews you provide based on the community guidelines you've outlined. I'll identify any possible infringements and explain why each review might be in violation of those guidelines. Please go ahead and provide the reviews you'd like me to evaluate."

	messages.push({"role": "assistant", "content": reply})

	const reviewContent = reviews.map(review => {
		return `Rating: ${review.rating}
Title: ${review.title}
Text: ${review.text}`;

	}).join("\n\n");


	// Prepare the first prompt
	const firstPrompt = firstPromptTemplate.replace('${reviews}', reviewContent);

	messages.push({"role": "user", "content": firstPrompt})

	return messages
}

// Function to make API calls
async function callGpt4(messages, temperature, top_p) {
	console.log('Making GPT-4 API call...');
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages
		});
		console.log('GPT-4 API call successful.');
		return completion.choices[0].message.content;
	} catch (error) {
		console.error(`Failed to call GPT-4 API: ${error}`);
		return null;
	}
}

async function processReviewBatch(reviews) {

	const firstPromptMessages = createRoundOnePrompt(reviews);

	const firstOutput = await callGpt4(firstPromptMessages);

	// Prepare the second prompt
	const secondPrompt = secondPromptTemplate.replace('${review_output}', firstOutput);

	const secondPromptMessages = [{role: "user", content: secondPrompt}]

	const secondOutput = await callGpt4(secondPromptMessages);

	const splitSecondOutput = secondOutput.split("===")

	console.log("Review length", reviews.length, splitSecondOutput.length, "REPORT", splitSecondOutput)

	const combinedReports = reviews.map((review, i) => {
		return {...review, reportData: splitSecondOutput[i]}
	})

	return combinedReports;
}

async function retrieveReviews() {
	const reviewsRef = firestore.collection('reviews');

	// Retrieve up to 3 reviews that have not been processed, ordered by 'priority' in descending order
	const reviewItemsSnapshot = await reviewsRef
		.where('processed', '==', false)
		.orderBy('priority', 'desc')
		.limit(3)
		.get();

	if (reviewItemsSnapshot.empty) {
		console.log("No available reviews to process");
		return [];
	}

	// Convert the Firestore document snapshots to regular JavaScript objects
	const reviews = reviewItemsSnapshot.docs.map(doc => doc.data());

	return reviews;
}


async function saveReports(reports) {
	// Initialize Firestore batch
	const reportsBatch = firestore.batch();

	const reportsRef = firestore
		.collection("reports");

	const reviewsRef = firestore
		.collection("reviews");

	// Prepare batch operations
	const reportsPromises = reports.map(async (report) => {
		const reviewId = report.reviewId;
		const reportRef = reportsRef.doc(reviewId);
		const reviewDocRef = reviewsRef.doc(reviewId);

		reportsBatch.update(reviewDocRef, {processed: true, priority: 1}, {merge: true})
		console.log("REPORT: ", report)
		reportsBatch.set(reportRef, {text: report.reportData, productId: report.productId, sent: false, reviewId})
	});

	// Wait for all promises to complete
	await Promise.all(reportsPromises);

	// Commit the batch to Firestore
	await reportsBatch.commit();

	console.log('Successfully saved reviews');
}


async function processReviews() {
	const apiKey = await getOpenAIAPIKey();

	// Initialize OpenAI configuration
	console.log('Initializing OpenAI configuration...');
	openai = new OpenAI({
		apiKey: apiKey,
	});
	console.log('OpenAI configuration initialized.');

	const reviews = await retrieveReviews();

	if (reviews.length === 0) {
		return {message: "No reviews found", code: 200};
	}

	const reports = await processReviewBatch(reviews);

	await saveReports(reports);

	return {message: `Successfully saved ${reports.length} reviews`, code: 200}
}

// async function moveAllReviews() {
// 	const productsRef = firestore.collection('products');
//
// 	// Get all products
// 	const productItemsSnapshot = await productsRef.get();
// 	const productItems = productItemsSnapshot.docs;
//
// 	// Use Promise.all to wait for all asynchronous operations to complete
// 	await Promise.all(productItems.map(async (product) => {
// 		const reviewBatch = firestore.batch();
// 		const reviewsSnapshot = await product.ref.collection("reviews").get();
// 		const reviews = reviewsSnapshot.docs;
//
// 		if (reviews.length === 0) {
// 			return;
// 		}
//
// 		reviews.forEach((review) => {
// 			const reviewData = review.data();
// 			const reviewDoc = firestore.collection("reviews").doc(reviewData.reviewId);
//
// 			// Clone and modify the review object
// 			const newReviewData = { ...reviewData, productId: product.id };
//
// 			reviewBatch.set(reviewDoc, newReviewData);
// 		});
//
// 		// Commit the batch
// 		await reviewBatch.commit();
// 	}));
//
// 	return { code: 200, message: "All reviews moved" };
// }

// async function addPriorityToAllReviews() {
// 	const reviewsRef = firestore.collection('reviews');
//
// 	const reviewItemsSnapshot = await reviewsRef.get();
// 	const reviewItems = reviewItemsSnapshot.docs;
//
// 	const batchSize = 500; // Firestore batch write limit
// 	let currentBatch = firestore.batch();
// 	let operationCount = 0;
//
// 	for (const review of reviewItems) {
// 		currentBatch.update(review.ref, { priority: 1 });
// 		operationCount++;
//
// 		if (operationCount >= batchSize) {
// 			await currentBatch.commit();
// 			currentBatch = firestore.batch();
// 			operationCount = 0;
// 		}
// 	}
//
// 	// Commit any remaining operations
// 	if (operationCount > 0) {
// 		await currentBatch.commit();
// 	}
//
// 	return { message: "Added priority to all reviews", code: 200 };
// }




module.exports.processreviews = async (req, res) => {
	const response = await processReviews();

	console.log("Reviews processing complete")
	res.status(response.code).send(response.message);
}

functions.http("processreviews", module.exports.processreviews);

