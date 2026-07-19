#!/usr/bin/env node
// Publishes a post to the PetVida Facebook Page and/or Instagram Business account.
// Facebook uses the Page Graph API (FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN).
// Instagram uses the newer Instagram API with Instagram Login
// (IG_BUSINESS_ACCOUNT_ID, IG_ACCESS_TOKEN) via graph.instagram.com — this is a
// separate token from the Facebook Page token, not interchangeable.
//
// Usage:
//   node --env-file=.env scripts/social/publish-meta.mjs --platform instagram --image <url> --caption "..."
//   node --env-file=.env scripts/social/publish-meta.mjs --platform facebook --image <url> --message "..."
//   node --env-file=.env scripts/social/publish-meta.mjs --platform both --image <url> --caption "..."

const FACEBOOK_GRAPH_API = 'https://graph.facebook.com/v21.0';
const INSTAGRAM_GRAPH_API = 'https://graph.instagram.com/v21.0';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function graphPost(baseUrl, path, params) {
  const url = new URL(`${baseUrl}${path}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Graph API error: ${JSON.stringify(data)}`);
  return data;
}

async function publishToFacebookPage({ imageUrl, message }) {
  const pageId = requireEnv('FB_PAGE_ID');
  const accessToken = requireEnv('FB_PAGE_ACCESS_TOKEN');

  if (imageUrl) {
    return graphPost(FACEBOOK_GRAPH_API, `/${pageId}/photos`, { url: imageUrl, caption: message, access_token: accessToken });
  }
  return graphPost(FACEBOOK_GRAPH_API, `/${pageId}/feed`, { message, access_token: accessToken });
}

async function publishToInstagram({ imageUrl, caption }) {
  if (!imageUrl) throw new Error('Instagram publishing requires --image');
  const igUserId = requireEnv('IG_BUSINESS_ACCOUNT_ID');
  const accessToken = requireEnv('IG_ACCESS_TOKEN');

  const container = await graphPost(INSTAGRAM_GRAPH_API, `/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  return graphPost(INSTAGRAM_GRAPH_API, `/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: accessToken,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const platform = args.platform ?? 'facebook';
  const imageUrl = args.image;
  const text = args.caption ?? args.message ?? '';

  if (platform === 'facebook' || platform === 'both') {
    try {
      console.log('Facebook:', await publishToFacebookPage({ imageUrl, message: text }));
    } catch (err) {
      console.error('Facebook failed:', err.message);
      process.exitCode = 1;
    }
  }
  if (platform === 'instagram' || platform === 'both') {
    try {
      console.log('Instagram:', await publishToInstagram({ imageUrl, caption: text }));
    } catch (err) {
      console.error('Instagram failed:', err.message);
      process.exitCode = 1;
    }
  }
}

main();
