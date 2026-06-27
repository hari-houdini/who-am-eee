import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import { Stack } from 'alchemy/Stack';
import * as Effect from 'effect/Effect';

export default Alchemy.Stack(
  'HariHoudiniPortfolio',
  {
    providers: Cloudflare.providers(),
    /**
     * Can swap it with `State.localState()` for local development.
     * From "alchemy/State"
     */
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const stack = yield* Stack;
    console.log(stack.name);
    console.log(stack.stage);
    const bucket = yield* Cloudflare.R2Bucket('Bucket').pipe(
      Alchemy.RemovalPolicy.retain(stack.stage === 'production'),
    );

    return {
      bucketName: bucket.bucketName,
    };
  }),
);
