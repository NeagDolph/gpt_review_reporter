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

	// Fetch ASIN numbers from Firestore
	const asinSnapshot = await firestore.collection('asinNumbers').get();
	const asinCodes = asinSnapshot.docs.map(doc => doc.data().asin);

	// Fetch reviews for ASIN numbers from Amazon API (Simulated here)
	// Replace this with your actual API call logic
	const reviews = asinCodes.map(asin => ({
		asin,
		review: 'Sample review for ' + asin
	}));

	// Write reviews to a different Firestore collection
	const batch = firestore.batch();
	reviews.forEach((review, index) => {
		const docRef = firestore.collection('asinReviews').doc(index.toString());
		batch.set(docRef, review);
	});
	await batch.commit();

	res.status(200).send('Reviews fetched and written to Firestore.');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
