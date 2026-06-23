/**
 * Server-side client for the Spotify Web API.
 *
 * @remarks
 * Instantiate with a bearer token obtained via the Client Credentials or
 * Authorization Code flow. The token is stored privately and used for all
 * subsequent API calls.
 */
export class SpotifyService {
	/** OAuth 2.0 bearer token used in the `Authorization` header. */
	private readonly bearerToken: string;

	/**
	 * @param token - A valid Spotify access token (Bearer).
	 */
	constructor(token: string) {
		this.bearerToken = token;
	}
}
