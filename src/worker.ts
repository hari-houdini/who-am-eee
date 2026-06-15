/**
 * Spotify
 */

import { secrets } from 'bun';
import { SpotifyService } from './spotify.service';

// let spotifyClientId: string | null = await secrets.get({
//   service: 'spotify',
//   name: 'client-id',
// });

// if (!spotifyClientId) {
//   if (!process.env.SPOTIFY_CLIENT_ID) {
//     throw new Error('Spotify client ID is not set');
//   }

//   await secrets.set({
//     service: 'spotify',
//     name: 'client-id',
//     value: process.env.SPOTIFY_CLIENT_ID,
//   });
// }
