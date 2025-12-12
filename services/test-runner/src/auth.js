const axios = require('axios');
const qs = require('querystring');

/**
 * Fetches an Access Token from Asgardeo using Client Credentials grant.
 * Suitable for Machine-to-Machine (M2M) communication.
 */
async function getAccessToken() {
    const tokenUrl = process.env.ASGARDEO_TOKEN_URL;
    const clientId = process.env.ASGARDEO_CLIENT_ID;
    const clientSecret = process.env.ASGARDEO_CLIENT_SECRET;

    if (!tokenUrl || !clientId || !clientSecret) {
        console.warn('⚠️  Missing Asgardeo M2M credentials. Tests requiring auth may fail.');
        return null; // Return null to allow tests to proceed (maybe they don't need auth)
    }

    try {
        const data = qs.stringify({
            grant_type: 'client_credentials',
            scope: 'internal_user_mgt_view internal_user_mgt_create internal_user_mgt_update internal_user_mgt_delete internal_group_mgt_view' // Add scopes as needed
        });

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            }
        };

        console.log(`🔐 Requesting access token from ${tokenUrl}...`);
        const response = await axios.post(tokenUrl, data, config);
        console.log('✅ Access Token obtained successfully.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Failed to obtain Asgardeo Access Token:', error.response ? error.response.data : error.message);
        throw new Error('Authentication Failed');
    }
}

module.exports = { getAccessToken };
