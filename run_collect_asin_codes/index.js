const express = require('express');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const secretClient = new SecretManagerServiceClient();
const firestore = new Firestore();

app.get('/', async (req, res) => {
	// Fetch the API key from Secret Manager
	const [version] = await secretClient.accessSecretVersion({
		name: 'projects/YOUR_PROJECT_ID/secrets/amazon-api-key/versions/latest'
	});
	const apiKey = version.payload.data.toString();

	// Fetch data from Amazon API (Simulated here)
	const asinNumbers = ['123456', '789012']; // Replace with your API call logic

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
