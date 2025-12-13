const axios = require('axios');
const qs = require('querystring');

/**
 * Fetches an Access Token from Asgardeo using Resource Owner Password Credentials grant.
 * Uses M2M client credentials passed in the request body (not Basic Auth).
 * This authenticates as a real user for testing purposes.
 */
async function getUserAccessToken(username, password) {
    const tokenUrl = process.env.ASGARDEO_TOKEN_URL;
    const clientId = process.env.ASGARDEO_CLIENT_ID;
    const clientSecret = process.env.ASGARDEO_CLIENT_SECRET;

    if (!tokenUrl || !clientId || !clientSecret) {
        console.warn('⚠️  Missing Asgardeo credentials (ASGARDEO_TOKEN_URL, ASGARDEO_CLIENT_ID, ASGARDEO_CLIENT_SECRET).');
        throw new Error('Missing OAuth Configuration');
    }

    if (!username || !password) {
        console.warn('⚠️  Missing username or password for user authentication.');
        throw new Error('Missing User Credentials');
    }

    try {
        const data = qs.stringify({
            grant_type: 'password',
            username: username,
            password: password,
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'openid profile email'
        });

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        console.log(`🔐 Requesting user access token for ${username} via M2M client with password grant...`);
        const response = await axios.post(tokenUrl, data, config);
        console.log('✅ User Access Token obtained successfully.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Failed to obtain User Access Token:', error.response ? error.response.data : error.message);
        throw new Error('User Authentication Failed');
    }
}

/**
 * Main function to get access token using credentials from environment.
 * Always uses username/password flow with M2M client credentials.
 */
async function getAccessToken() {
    const username = process.env.ASGARDEO_USERNAME;
    const password = process.env.ASGARDEO_PASSWORD;

    return await getUserAccessToken(username, password);
}

module.exports = { getAccessToken, getUserAccessToken };



