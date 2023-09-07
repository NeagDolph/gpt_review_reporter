const fs = require('fs');
const OpenAI = require("openai");
const log = require('loglevel');
const functions = require("@google-cloud/functions-framework");

// Initialize log level
log.setLevel('info');

// Initialize OpenAI configuration
log.info('Initializing OpenAI configuration...');
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});
log.info('OpenAI configuration initialized.');

// Number of reviews to process in a batch
const batchSize = 3;

// Load reviews from a JSON file
log.info('Loading reviews from input/reviews.json...');
const reviews = JSON.parse(fs.readFileSync('input/reviews.json', 'utf-8'));
log.info(`Loaded ${reviews.length} reviews.`);

// Load prompt templates
log.info('Loading prompt templates...');
const firstPromptTemplate = fs.readFileSync('input/generate_violations.md', 'utf-8');
const secondPromptTemplate = fs.readFileSync('input/generate_output.md', 'utf-8');
const amazonGuidelinesTemplate = fs.readFileSync('input/amazon_review_tos.md', 'utf-8');
log.info('Prompt templates loaded.');

function createRoundOnePrompt(reviews) {
	const messages = []

	messages.push({"role": "user", "content": amazonGuidelinesTemplate})

	const reply = "Yes, I understand. I will scrutinize the Amazon reviews you provide based on the community guidelines you've outlined. I'll identify any possible infringements and explain why each review might be in violation of those guidelines. Please go ahead and provide the reviews you'd like me to evaluate."

	messages.push({"role": "assistant", "content": reply})

	const reviewContent = reviews.map(review => {
		return `Rating: ${review["Star Rating"]}
Title: ${review["Subject"]}
Review: ${review["Review"]}`
	}).join("\n\n")

	// Prepare the first prompt
	const firstPrompt = firstPromptTemplate.replace('${reviews}', reviewContent);

	messages.push({"role": "user", "content": firstPrompt})

	return messages
}

// Function to make API calls
async function callGpt4(messages, temperature, top_p) {
	log.info('Making GPT-4 API call...');
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages
		});
		log.info('GPT-4 API call successful.');
		return completion.choices[0].message.content;
	} catch (error) {
		log.error(`Failed to call GPT-4 API: ${error}`);
		return null;
	}
}

function processReviewBatch(i, intermediaryFolder, finalFolder) {
	const reviewBatch = reviews.slice(i, i + batchSize);
	log.info(`Processing reviews ${i + 1} to ${i + batchSize}...`);

	const name = (i + 1) + "to" + (i + batchSize);

	const firstPromptMessages = createRoundOnePrompt(reviewBatch);

	// Make the first GPT-4 API call
	callGpt4(firstPromptMessages).then(firstOutput => {
		// Save the intermediary output
		fs.writeFileSync(`${intermediaryFolder}/firstOutput_${name}.txt`, firstOutput);
		log.info(`Saved intermediary output to ${intermediaryFolder}/firstOutput_${name}.txt`);

		// Prepare the second prompt
		const secondPrompt = secondPromptTemplate.replace('${review_output}', firstOutput);

		const secondPromptMessages = [{role: "user", content: secondPrompt}]

		// Make the second GPT-4 API call
		callGpt4(secondPromptMessages).then(secondOutput => {
			// Save the final output
			fs.writeFileSync(`${finalFolder}/secondOutput_${name}.txt`, secondOutput);
			log.info(`Saved final output to ${finalFolder}/secondOutput_${name}.txt`);
		})
	})
}

async function processReviews() {
	const intermediaryFolder = 'output/intermediary-' + batchSize;
	const finalFolder = 'output/final-' + batchSize;

	// Create folders if they do not exist
	log.info('Creating output directories if they do not exist...');
	if (!fs.existsSync(intermediaryFolder)) {
		fs.mkdirSync(intermediaryFolder, {recursive: true});
	}
	if (!fs.existsSync(finalFolder)) {
		fs.mkdirSync(finalFolder, {recursive: true});
	}
	log.info('Output directories created or already exist.');

	for (let i = 0; i < reviews.length; i += batchSize) {
		if (i !== 6) continue;
		processReviewBatch(i, intermediaryFolder, finalFolder);
	}
}


module.exports.processreviews = async (req, res) => {
	await processReviews()

	res.status(200).send(response.message);
}

functions.http("processreviews", module.exports.processreviews);

processReviews().then(r => log.info("Processing complete."));

