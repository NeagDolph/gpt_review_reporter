# Use Node.js image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies by copying the package.json and package-lock.json files
# Assuming the root directory has the main package.json and node_modules
COPY ../package*.json ./

# If there are service-specific dependencies, you can install them like so:
RUN npm install

# Copy just the necessary code files for this specific service
COPY ./ ./

# Start the application
CMD [ "npm", "start" ]
