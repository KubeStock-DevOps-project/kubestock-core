const axios = require('axios');
const qs = require('querystring');

/**
 * Fetches an Access Token from Asgardeo using Client Credentials grant (M2M).
 * Suitable for Machine-to-Machine communication.
 */
async function getM2MAccessToken() {
    const tokenUrl = process.env.ASGARDEO_TOKEN_URL;
    const clientId = process.env.ASGARDEO_CLIENT_ID;
    const clientSecret = process.env.ASGARDEO_CLIENT_SECRET;

    if (!tokenUrl || !clientId || !clientSecret) {
        console.warn('⚠️  Missing Asgardeo M2M credentials. Tests requiring auth may fail.');
        return null;
    }

    try {
        const data = qs.stringify({
            grant_type: 'client_credentials',
            scope: 'internal_user_mgt_view internal_user_mgt_create internal_user_mgt_update internal_user_mgt_delete internal_group_mgt_view'
        });

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            }
        };

        console.log(`🔐 Requesting M2M access token from ${tokenUrl}...`);
        const response = await axios.post(tokenUrl, data, config);
        console.log('✅ M2M Access Token obtained successfully.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Failed to obtain M2M Access Token:', error.response ? error.response.data : error.message);
        throw new Error('M2M Authentication Failed');
    }
}

/**
 * Fetches an Access Token from Asgardeo using Resource Owner Password Credentials grant.
 * Used when username and password are provided (user login).
 */
async function getUserAccessToken(username, password) {
    const tokenUrl = process.env.ASGARDEO_TOKEN_URL;
    const clientId = process.env.ASGARDEO_CLIENT_ID;
    const clientSecret = process.env.ASGARDEO_CLIENT_SECRET;

    if (!tokenUrl || !clientId || !clientSecret) {
        console.warn('⚠️  Missing Asgardeo credentials.');
        return null;
    }

    if (!username || !password) {
        console.warn('⚠️  Missing username or password for user authentication.');
        return null;
    }

    try {
        const data = qs.stringify({
            grant_type: 'password',
            username: username,
            password: password,
            scope: 'openid profile'
        });

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            }
        };

        console.log(`🔐 Requesting user access token for ${username} from ${tokenUrl}...`);
        const response = await axios.post(tokenUrl, data, config);
        console.log('✅ User Access Token obtained successfully.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Failed to obtain User Access Token:', error.response ? error.response.data : error.message);
        throw new Error('User Authentication Failed');
    }
}

/**
 * Main function to get access token based on available credentials.
 * Priority:
 * 1. If username/password from env variables -> User login
 * 2. Otherwise -> M2M client credentials
 */
async function getAccessToken() {
    const username = process.env.ASGARDEO_USERNAME;
    const password = process.env.ASGARDEO_PASSWORD;

    if (username && password) {
        return await getUserAccessToken(username, password);
    } else {
        return await getM2MAccessToken();
    }
}

module.exports = { getAccessToken, getUserAccessToken, getM2MAccessToken };
