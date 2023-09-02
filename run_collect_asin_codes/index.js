const axios = require('axios');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {Firestore} = require('@google-cloud/firestore');
const functions = require('@google-cloud/functions-framework');

const secretClient = new SecretManagerServiceClient();
const firestore = new Firestore();

const sellerID = 'ADZH7GRDFE99Y';


/**
 * Marks a page that has no products as invalid.
 *
 * @param pageNumber page number to mark as invalid
 * @return {Promise<void>}
 */
async function markInvalidPageNumber(pageNumber) {
	const docRef = firestore.collection('info').doc('asinCodes');

	await docRef.update({
		invalidPages: Firestore.FieldValue.arrayUnion(pageNumber)
	});
}

/**
 * Retrieves asinCode runner info
 *
 * @return {Promise<Object>}
 */
async function getRunnerInfo() {
	const docRef = firestore.collection('info').doc('asinCodes');
	const doc = await docRef.get();

	if (doc.exists) {
		return doc.data();
	} else {
		return {}
	}
}

/**
 * Updates the asinCode runner info.
 *
 * @param param Update query to modify runner info with.
 * @return {Promise<void>}
 */
async function updateRunnerInfo(param) {
	const docRef = firestore.collection('info').doc('asinCodes');

	// Update the checkedPages field in Firestore
	await docRef.set(param, { merge: true });
}

/**
 * Gets next available page number based on already queried pages.
 *
 * @return {Promise<string>}
 */
async function getNextPageNumber() {
	const runnerInfo = await getRunnerInfo();

	let checkedPages = runnerInfo.checkedPages || [];

	let pageNumber = 1;
	while (checkedPages.includes(pageNumber)) {
		pageNumber++;
	}

	await updateRunnerInfo({
		checkedPages: Firestore.FieldValue.arrayUnion(pageNumber)
	})

	return pageNumber.toString();
}

async function getProductDataAxesso(apiKey, overwrite = false, pageNumber) {
	const nextPageNumber = pageNumber ? pageNumber : await getNextPageNumber();

	const options = {
		method: 'GET',
		url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-seller-products',
		params: {
			domainCode: 'com',
			sellerId: sellerID,
			page: nextPageNumber
		},
		headers: {
			'X-RapidAPI-Key': apiKey,
			'X-RapidAPI-Host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com'
		}
	};

	const response = await axios.request(options);

	return response.data
}

async function processProductData(productData, overwrite = false, priority=1) {
	if (productData.numberOfProducts <= 0) {
		await markInvalidPageNumber(productData.currentPage)
		return;
	}

	const products = productData.searchProductDetails;

	// Initialize batch
	const batch = firestore.batch();

	// Prepare all document references and operations in the batch
	const productPromises = products.map(async (product) => {
		const asin = product.asin;
		const productDocRef = firestore.collection('products').doc(asin);

		if (overwrite) {
			// Add set operation to batch
			batch.set(productDocRef, {...product, priority, processed: false});
		} else {
			const productDoc = await productDocRef.get();

			if (!productDoc.exists) {
				// Add set operation to batch if the document doesn't exist
				batch.set(productDocRef, {...product, priority, processed: false});
			}
		}
	});

	// Wait for all promises to complete
	await Promise.all(productPromises);

	// Commit the batch
	await batch.commit();

}

async function getAxessoAPIKey() {
	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/shoplc-amazon-reviews/secrets/axesso-api-key/versions/latest'
	});
	return version.payload.data.toString()
}

functions.http('collect_asin_codes', async (req, res) => {
	// Whether to perform the action in overwrite mode
	const overwrite = req.body.packageoverwrite || false;
	const pageNumber = req.body.pageNumber;
	const priority = req.body.priority;

	const apiKey = await getAxessoAPIKey();

	// Fetch data from Amazon API
	const productData = await getProductDataAxesso(apiKey, overwrite, pageNumber);

	await processProductData(productData, overwrite, priority);

	res.status(200).send('Data fetched and written to Firestore.');
});
