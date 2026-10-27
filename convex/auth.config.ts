import { AuthConfig } from "convex/server";

// Convex Auth issues its own JWTs, signed with the RS256 key stored in the
// deployment's `JWT_PRIVATE_KEY`. Trust the deployment's own site origin as the
// issuer (`iss`) and `convex` as the audience (`aud`) — no external identity
// provider is involved.
export default {
	providers: [
		{
			domain: process.env.CONVEX_SITE_URL!,
			applicationID: "convex",
		},
	],
} satisfies AuthConfig;
