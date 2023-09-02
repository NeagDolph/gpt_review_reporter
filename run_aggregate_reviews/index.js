const express = require('express');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const {Firestore} = require('@google-cloud/firestore');
const functions = require("@google-cloud/functions-framework");
const axios = require("axios");

const secretClient = new SecretManagerServiceClient();
const firestore = new Firestore();

async function getAxessoAPIKey() {
	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/shoplc-amazon-reviews/secrets/axesso-api-key/versions/latest'
	});
	return version.payload.data.toString()
}

/**
 * Gets next available reviews page number based on already queried reviews pages.
 *
 * @return {Promise<string>}
 */
async function getNextPageNumber(asin) {
	const asinDoc = firestore.collection("products").doc(asin)

	const doc = await asinDoc.get();

	const docData = doc.data()

	let checkedPages = docData.checkedPages || [];

	let maxPage = docData.lastPage || Infinity;

	let pageNumber = 1;
	while (checkedPages.includes(pageNumber)) {
		pageNumber++;
	}

	if (pageNumber > maxPage) {
		return '1';
	}


}

async function getReviewsAxesso(asin) {
	const nextPageNumber = getNextPageNumber(asin);

	const options = {
		method: 'GET',
		url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-seller-products',
		params: {
			domainCode: 'com',
			asin,
			sortBy: 'recent',
			filters: "reviewerType=all_reviews;filterByStar=one_star",
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


async function getProductByPriority() {
	const productsRef = firestore.collection('products');

	// Query Firestore for the document with the highest "priority" value
	const snapshot = await productsRef.orderBy('priority', 'desc').limit(1).get();

	if (snapshot.empty) {
		console.log('No matching documents.');
		return;
	}

	// Extract the "asin" parameter from the document
	let asin;
	snapshot.forEach(doc => {
		console.log(doc.id, '=>', doc.data());
		asin = doc.data().asin;
	});

	return asin
}

functions.http('aggregate_reviews', async (req, res) => {
	// Whether to perform the action in overwrite mode
	const apiKey = await getAxessoAPIKey();

	const asin = await getProductByPriority();



	res.status(200).send('Data fetched and written to Firestore.');
});
