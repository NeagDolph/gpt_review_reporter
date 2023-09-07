const {Firestore} = require('@google-cloud/firestore');
const axios = require("axios");
const functions = require("@google-cloud/functions-framework");
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const firestore = new Firestore();
const secretClient = new SecretManagerServiceClient();

// Function to fetch Axesso API Key from Google Cloud Secret Manager
async function getAxessoAPIKey() {
	console.log('Fetching Axesso API Key...');
	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/shoplc-amazon-reviews/secrets/axesso-api-key/versions/latest'
	});
	console.log('Successfully fetched Axesso API Key');
	return version.payload.data.toString();
}


// Function to get reviews from Axesso
async function getReviewsAxesso(asin, apiKey, page) {
	console.log(`Fetching reviews for ASIN: ${asin}...`);

	asin = typeof asin === "string" ? asin : asin.toString();

	// Axios request options
	const options = {
		method: 'GET',
		url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-lookup-reviews',
		params: {
			domainCode: 'com',
			asin,
			sortBy: 'recent',
			filters: "reviewerType=all_reviews;filterByStar=one_star",
			page
		},
		headers: {
			'X-RapidAPI-Key': '07814c1beamsh4ca5e486709d9bdp116125jsn08c528e56756',
			'X-RapidAPI-Host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com'
		}
	};

	let response;

	// Make the Axios request
	try {
		response = await axios.request(options);
		console.log('Successfully fetched reviews');
	} catch (e) {
		console.log("Error retreiving reveiws:", e.response, e.response.data, e.response.data.error)

		throw e;
	}


	return response.data;
}

// Function to check if a product is valid based on review count and last checked date
function isValidProduct(reviewCount, lastCheckEpoch) {
	console.log('Checking if product is valid...');
	// Handle special case when reviewCount is 0

	if (reviewCount === null) {
		return true;
	}

	if (reviewCount === 0) {
		return ((Date.now() - lastCheckEpoch) / (1000 * 60 * 60 * 24)) >= 60;
	}

	// Parameters for the logarithmic function for minimum days
	const a_min = -4.989;
	const b_min = 45.570;
	const c_min = 69.710;

	// -4.989 * Math.log(45.570 * 7000) + 69.710;

	// Compute the estimated minimum days to wait
	const min_days = a_min * Math.log(b_min * reviewCount) + c_min;
	const daysSinceLastCheck = (Date.now() - lastCheckEpoch) / (1000 * 60 * 60 * 24);

	// Check if the number of days since the last check is greater than or equal to min_days
	console.log(`Product is ${daysSinceLastCheck >= min_days ? 'valid' : 'invalid'}`);
	return daysSinceLastCheck >= min_days;
}

// Function to find a valid product from Firestore
async function findValidProduct() {
	console.log('Finding a valid product...');

	// First try to find a priority product
	const productsRef = firestore.collection('products');
	const priorityProducts = await productsRef
		.where('priority', '>', 1)
		.orderBy('priority', 'desc')
		.limit(1)
		.get();

	// Fallback function to find last checked product
	async function findLastCheckedProduct(count, startAt) {
		console.log('Finding last checked product...');
		let snapshotWithDate = await productsRef
			.where('lastChecked', '>=', 0)
			.orderBy('lastChecked', 'asc')
			.startAfter(startAt || -1)
			.limit(count)
			.get();

		if (snapshotWithDate.empty) return null;

		let item;
		for (item of snapshotWithDate.docs) {
			const itemData = item.data();
			const validProduct = isValidProduct(itemData.countReview, itemData.lastChecked ?? 0);
			if (validProduct || itemData.lastChecked === 0) return itemData;
		}

		return findLastCheckedProduct(count, item);
	}

	// If no priority products are found, fall back to finding the last checked product
	if (priorityProducts.empty) {
		console.log('No priority products found. Falling back to finding last checked product.');
		return findLastCheckedProduct(100);
	} else {
		console.log('Found a priority product.');
		return priorityProducts.docs[0].data();
	}
}

async function updateItem(productData) {
	const docRef = firestore
		.collection('products')
		.doc(productData.asin)

	// Update the checkedPages field in Firestore
	await docRef.set(productData, {merge: true});
}

// Function to save reviews to Firestore
async function saveReviews(asin, reviews) {
	console.log(`Saving reviews for ASIN: ${asin}...`);
	// Initialize Firestore batch
	const batch = firestore.batch();
	const reviewsRef = firestore
		.collection('products')
		.doc(asin)
		.collection("reviews");

	// Prepare batch operations
	const productPromises = reviews.map(async (review) => {
		const id = review.reviewId;
		const reviewDocRef = reviewsRef.doc(id);  // Changed from reviewsRef.doc(asin) to use reviewId as the document ID

		batch.set(reviewDocRef, {...review, processed: false});
	});

	// Wait for all promises to complete
	await Promise.all(productPromises);

	// Commit the batch to Firestore
	await batch.commit();

	console.log('Successfully saved reviews');
}

// Main function to aggregate reviews
async function aggregateReviews() {
	console.log('Starting to aggregate reviews...');
	const apiKey = await getAxessoAPIKey();

	const product = await findValidProduct();

	if (product === null) {
		console.log('No items to process found');
		return {message: 'No items to process found'};
	}

	const reviewData = await getReviewsAxesso(product.asin, apiKey, 1);

	const oldReviewCount = product.countReview;
	let newReviewCount = reviewData.countReviews;

	await saveReviews(product.asin, reviewData.reviews);

	console.log(`Found reviews: ${reviewData.reviews.length}. Total: ${newReviewCount}`)

	let reviewCount = reviewData.reviews.length;

	// Check if new reviews have been added since the last check
	if (newReviewCount >= oldReviewCount + 10) {
		const reviewCountDelta = newReviewCount - oldReviewCount;
		const reviewPagesDelta = Math.ceil(reviewCountDelta / 10);

		// Iterate through new review pages
		for (let pageNum = 2; pageNum <= reviewPagesDelta; pageNum++) {
			console.log("Running iteration for page", pageNum)
			const iterativeReviewData = await getReviewsAxesso(product.asin, apiKey, pageNum);

			newReviewCount = iterativeReviewData.countReviews


			console.log(`Found reviews: ${iterativeReviewData.reviews.length}. Total: ${newReviewCount}`)

			reviewCount += iterativeReviewData.reviews.length;
			await saveReviews(product.asin, iterativeReviewData.reviews);
		}
	}

	await updateItem({asin: product.asin, countReview: newReviewCount, lastChecked: Date.now()});

	const returnMessage = `${reviewCount} reviews successfully written for product: ${product.asin}`;
	console.log(returnMessage);
	return {message: returnMessage};
}


module.exports.aggregatereviews = async(req, res) => {
	const response = await aggregateReviews();

	res.status(200).send(response.message);
}

functions.http("aggregatereviews", module.exports.aggregatereviews);
