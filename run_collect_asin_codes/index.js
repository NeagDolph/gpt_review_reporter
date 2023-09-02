const express = require('express');
const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const secretClient = new SecretManagerServiceClient();
const firestore = new Firestore();

async function getProductsAxesso(apiKey) {
	const options = {
		method: 'GET',
		url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-seller-products',
		params: {
			domainCode: 'com',
			sellerId: 'ADZH7GRDFE99Y',
			page: '1'
		},
		headers: {
			'X-RapidAPI-Key': apiKey,
			'X-RapidAPI-Host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com'
		}
	};

	const response = await axios.request(options);

	const asinCodes = response.data
}

app.get('/', async (req, res) => {
	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/shoplc-amazon-reviews/secrets/axesso-api-key/versions/latest'
	});
	const apiKey = version.payload.data.toString();

	// Fetch data from Amazon API
	const asinNumbers = await getProductsAxesso(apiKey);

	// Write data to Firestore
	const batch = firestore.batch();
	asinNumbers.forEach((asin, index) => {
		const docRef = firestore.collection('asinNumbers').doc(index.toString());
		batch.set(docRef, { asin });
	});
	await batch.commit();

	res.status(200).send('Data fetched and written to Firestore.');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
