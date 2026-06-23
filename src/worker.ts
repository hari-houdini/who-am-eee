/**
 * Spotify worker — resolves the Spotify client ID from Bun's secret store
 * and initialises the {@link SpotifyService}.
 *
 * @remarks
 * The implementation is currently commented out pending Spotify OAuth setup.
 */

import { secrets } from "bun";
import { SpotifyService } from "./spotify.service";

// let spotifyClientId: string | null = await secrets.get({
//   service: 'spotify',
//   name: 'client-id',
// });

// if (!spotifyClientId) {
//   if (!Bun.env.SPOTIFY_CLIENT_ID) {
//     throw new Error('Spotify client ID is not set');
//   }

//   await secrets.set({
//     service: 'spotify',
//     name: 'client-id',
//     value: Bun.env.SPOTIFY_CLIENT_ID,
//   });
// }
