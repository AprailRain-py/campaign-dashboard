const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { google } = require('googleapis');

const getOAuthClient = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
};

const propertyId = process.env.GA4_PROPERTY_ID || 'properties/500643354';

const REPORTS = {
  funnel: {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: ['signup_click','signup_complete','login_complete','first_chat_sent','subscription_started','cta_click','form_start']
        }
      }
    }
  },
  traffic: {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  engagement: {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'engagedSessions' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10
  },
  utm: {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'sessionCampaignName' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 20
  },
  daily: {
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'engagedSessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  }
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const reportType = event.queryStringParameters?.type || 'funnel';
  if (!REPORTS[reportType]) return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown report type: ${reportType}` }) };

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'missing_credentials', message: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in Netlify env vars.' }) };
  }

  try {
    const auth = getOAuthClient();
    const analyticsClient = new BetaAnalyticsDataClient({ authClient: auth });
    const [response] = await analyticsClient.runReport({ property: propertyId, ...REPORTS[reportType] });
    return { statusCode: 200, headers, body: JSON.stringify({ rows: response.rows || [], rowCount: response.rowCount || 0, dimensionHeaders: response.dimensionHeaders, metricHeaders: response.metricHeaders }) };
  } catch (err) {
    console.error('GA4 error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
