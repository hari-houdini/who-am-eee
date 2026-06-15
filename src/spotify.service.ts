export class SpotifyService {
  private bearerToken: string;

  constructor(token: string) {
    this.bearerToken = token;
  }
}
